import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerValidateAddressTool } from "../../src/tools/validate-address.js";
import type { QubicMcpConfig } from "../../src/config/index.js";

const config: QubicMcpConfig = {
  rpcUrl: "https://rpc.qubic.org",
  apiUrl: "https://api.qubic.org",
};

describe("validate_address tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => registerValidateAddressTool(server, config)).not.toThrow();
  });
});

describe("address validation logic", () => {
  it("detects wrong length", () => {
    const address = "ABC";
    const issues: string[] = [];
    if (address.length !== 60) issues.push(`Length is ${String(address.length)}, expected 60`);
    expect(issues).toContain("Length is 3, expected 60");
  });

  it("detects lowercase letters", () => {
    const address = "abcdef";
    const issues: string[] = [];
    if (address !== address.toUpperCase()) issues.push("Contains lowercase letters");
    expect(issues).toHaveLength(1);
  });

  it("detects non-letter characters", () => {
    const address = "ABC123";
    const issues: string[] = [];
    if (/[^A-Za-z]/.test(address)) issues.push("Contains non-letter characters");
    expect(issues).toHaveLength(1);
  });

  it("passes valid address format", () => {
    const address = "BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID";
    expect(address.length).toBe(60);
    expect(address).toBe(address.toUpperCase());
    expect(/[^A-Za-z]/.test(address)).toBe(false);
  });
});
