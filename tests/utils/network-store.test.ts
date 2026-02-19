import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Create a temp directory that will be used as HOME for all tests.
// vi.mock is hoisted so homedir() returns tmpHome before the store module loads.
let tmpHome: string;

vi.mock("node:os", async (importOriginal) => {
  const original = await importOriginal<typeof import("node:os")>();
  return {
    ...original,
    homedir: () => tmpHome,
  };
});

// Must import AFTER vi.mock is set up (vitest hoists vi.mock above imports automatically)
import {
  resolveNetwork,
  getActiveNetwork,
  getActiveNetworkName,
  saveNetwork,
  switchNetwork,
  listNetworks,
  removeNetwork,
} from "../../src/utils/network-store.js";

beforeEach(() => {
  tmpHome = mkdtempSync(join(tmpdir(), "qubic-mcp-net-test-"));
});

afterEach(() => {
  rmSync(tmpHome, { recursive: true, force: true });
});

describe("network-store", () => {
  describe("built-in networks", () => {
    it("resolves mainnet", () => {
      const result = resolveNetwork("mainnet");
      expect("rpcUrl" in result).toBe(true);
      if ("rpcUrl" in result) {
        expect(result.rpcUrl).toBe("https://rpc.qubic.org");
        expect(result.label).toBe("mainnet");
      }
    });

    it("resolves testnet", () => {
      const result = resolveNetwork("testnet");
      expect("rpcUrl" in result).toBe(true);
      if ("rpcUrl" in result) {
        expect(result.rpcUrl).toBe("https://testnet-rpc.qubic.org");
      }
    });

    it("is case-insensitive for built-in names", () => {
      const result = resolveNetwork("MAINNET");
      expect("rpcUrl" in result).toBe(true);
    });
  });

  describe("getActiveNetwork", () => {
    it("defaults to mainnet when no store file exists", () => {
      const active = getActiveNetwork();
      expect(active.name).toBe("mainnet");
      expect(active.rpcUrl).toBe("https://rpc.qubic.org");
    });
  });

  describe("saveNetwork", () => {
    it("saves a custom network", () => {
      const result = saveNetwork("local", "http://192.168.1.50:21841");
      expect(result).toEqual({ success: true });

      const resolved = resolveNetwork("local");
      expect("rpcUrl" in resolved).toBe(true);
      if ("rpcUrl" in resolved) {
        expect(resolved.rpcUrl).toBe("http://192.168.1.50:21841");
      }
    });

    it("saves with separate API URL", () => {
      saveNetwork("local", "http://10.0.0.1:21841", "http://10.0.0.1:21842");

      const resolved = resolveNetwork("local");
      expect("rpcUrl" in resolved).toBe(true);
      if ("rpcUrl" in resolved) {
        expect(resolved.rpcUrl).toBe("http://10.0.0.1:21841");
        expect(resolved.apiUrl).toBe("http://10.0.0.1:21842");
      }
    });

    it("strips trailing slashes from URLs", () => {
      saveNetwork("local", "http://10.0.0.1:21841///");

      const resolved = resolveNetwork("local");
      if ("rpcUrl" in resolved) {
        expect(resolved.rpcUrl).toBe("http://10.0.0.1:21841");
      }
    });

    it("rejects empty name", () => {
      const result = saveNetwork("", "http://10.0.0.1:21841");
      expect("error" in result).toBe(true);
    });

    it("rejects name over 50 characters", () => {
      const result = saveNetwork("a".repeat(51), "http://10.0.0.1:21841");
      expect("error" in result).toBe(true);
    });

    it("rejects invalid RPC URL", () => {
      const result = saveNetwork("bad", "not-a-url");
      expect("error" in result).toBe(true);
    });

    it("rejects invalid API URL", () => {
      const result = saveNetwork("bad", "http://10.0.0.1:21841", "not-a-url");
      expect("error" in result).toBe(true);
    });

    it("cannot overwrite built-in networks", () => {
      const result = saveNetwork("mainnet", "http://evil.example.com");
      expect("error" in result).toBe(true);
    });

    it("overwrites existing custom network by name", () => {
      saveNetwork("local", "http://10.0.0.1:21841");
      saveNetwork("local", "http://10.0.0.2:21841");

      const list = listNetworks();
      expect(list.custom).toHaveLength(1);

      const resolved = resolveNetwork("local");
      if ("rpcUrl" in resolved) {
        expect(resolved.rpcUrl).toBe("http://10.0.0.2:21841");
      }
    });
  });

  describe("switchNetwork", () => {
    it("switches to a built-in network", () => {
      const result = switchNetwork("testnet");
      expect("rpcUrl" in result).toBe(true);

      const active = getActiveNetwork();
      expect(active.name).toBe("testnet");
    });

    it("switches to a custom network", () => {
      saveNetwork("local", "http://10.0.0.1:21841");
      const result = switchNetwork("local");
      expect("rpcUrl" in result).toBe(true);

      const active = getActiveNetwork();
      expect(active.name).toBe("local");
      expect(active.rpcUrl).toBe("http://10.0.0.1:21841");
    });

    it("returns error for unknown network", () => {
      const result = switchNetwork("nonexistent");
      expect("error" in result).toBe(true);
    });

    it("persists across reads", () => {
      saveNetwork("local", "http://10.0.0.1:21841");
      switchNetwork("local");

      const raw = readFileSync(
        join(tmpHome, ".qubic-mcp", "networks.json"),
        "utf-8",
      );
      const data = JSON.parse(raw);
      expect(data.activeNetwork).toBe("local");
    });
  });

  describe("listNetworks", () => {
    it("lists built-in and custom networks", () => {
      saveNetwork("local", "http://10.0.0.1:21841");
      saveNetwork("staging", "http://staging.example.com");

      const list = listNetworks();
      expect(list.builtIn).toContain("mainnet");
      expect(list.builtIn).toContain("testnet");
      expect(list.custom).toHaveLength(2);
      expect(list.active).toBe("mainnet");
    });
  });

  describe("removeNetwork", () => {
    it("removes a custom network", () => {
      saveNetwork("local", "http://10.0.0.1:21841");
      const result = removeNetwork("local");
      expect(result).toEqual({ success: true });

      const resolved = resolveNetwork("local");
      expect("error" in resolved).toBe(true);
    });

    it("cannot remove built-in networks", () => {
      const result = removeNetwork("mainnet");
      expect("error" in result).toBe(true);
    });

    it("returns error for unknown network", () => {
      const result = removeNetwork("nonexistent");
      expect("error" in result).toBe(true);
    });

    it("switches to mainnet when removing the active network", () => {
      saveNetwork("local", "http://10.0.0.1:21841");
      switchNetwork("local");
      removeNetwork("local");

      const active = getActiveNetwork();
      expect(active.name).toBe("mainnet");
    });
  });

  describe("resolveNetwork", () => {
    it("returns error for unknown name", () => {
      const result = resolveNetwork("does-not-exist");
      expect("error" in result).toBe(true);
    });
  });
});
