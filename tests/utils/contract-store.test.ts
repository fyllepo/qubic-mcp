import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

let tmpHome: string;

vi.mock("node:os", async (importOriginal) => {
  const original = await importOriginal<typeof import("node:os")>();
  return {
    ...original,
    homedir: () => tmpHome,
  };
});

import {
  saveContract,
  getContract,
  getContractFunction,
  listContracts,
  removeContract,
  type ContractFunctionDef,
} from "../../src/utils/contract-store.js";

beforeEach(() => {
  tmpHome = mkdtempSync(join(tmpdir(), "qubic-mcp-contract-test-"));
});

afterEach(() => {
  rmSync(tmpHome, { recursive: true, force: true });
});

const sampleFunctions: ContractFunctionDef[] = [
  {
    name: "getCount",
    inputType: 6,
    input: [],
    output: [
      { name: "total", type: "uint64" },
      { name: "active", type: "uint64" },
    ],
  },
  {
    name: "getItem",
    inputType: 5,
    input: [{ name: "itemId", type: "uint64" }],
    output: [
      { name: "mode", type: "uint8" },
      { name: "owner", type: "identity" },
    ],
  },
];

describe("contract-store", () => {
  describe("saveContract", () => {
    it("saves a contract", () => {
      const result = saveContract("testsc", 24, sampleFunctions, "A test contract");
      expect(result).toEqual({ success: true });
    });

    it("overwrites existing contract by name", () => {
      saveContract("testsc", 24, sampleFunctions);
      saveContract("testsc", 25, sampleFunctions);

      const contract = getContract("testsc");
      expect("contractIndex" in contract).toBe(true);
      if ("contractIndex" in contract) {
        expect(contract.contractIndex).toBe(25);
      }
    });

    it("saves with optional identity", () => {
      saveContract("testsc", 24, sampleFunctions, "desc", "A".repeat(60));
      const contract = getContract("testsc");
      if (!("error" in contract)) {
        expect(contract.identity).toBe("A".repeat(60));
      }
    });

    it("rejects empty name", () => {
      const result = saveContract("", 24, sampleFunctions);
      expect("error" in result).toBe(true);
    });

    it("rejects name over 50 characters", () => {
      const result = saveContract("a".repeat(51), 24, sampleFunctions);
      expect("error" in result).toBe(true);
    });

    it("rejects contract index < 1", () => {
      const result = saveContract("testsc", 0, sampleFunctions);
      expect("error" in result).toBe(true);
    });

    it("rejects empty functions array", () => {
      const result = saveContract("testsc", 24, []);
      expect("error" in result).toBe(true);
    });

    it("rejects duplicate function names", () => {
      const dupes: ContractFunctionDef[] = [
        { name: "foo", inputType: 1, input: [], output: [] },
        { name: "foo", inputType: 2, input: [], output: [] },
      ];
      const result = saveContract("testsc", 24, dupes);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("Duplicate");
      }
    });

    it("rejects invalid field types", () => {
      const fns: ContractFunctionDef[] = [
        {
          name: "bad",
          inputType: 1,
          input: [{ name: "x", type: "float32" as "uint8" }],
          output: [],
        },
      ];
      const result = saveContract("testsc", 24, fns);
      expect("error" in result).toBe(true);
    });

    it("rejects padding without size", () => {
      const fns: ContractFunctionDef[] = [
        {
          name: "bad",
          inputType: 1,
          input: [],
          output: [{ name: "pad", type: "padding" }],
        },
      ];
      const result = saveContract("testsc", 24, fns);
      expect("error" in result).toBe(true);
    });
  });

  describe("getContract", () => {
    it("retrieves a saved contract", () => {
      saveContract("testsc", 24, sampleFunctions, "A test contract");
      const result = getContract("testsc");

      expect("name" in result).toBe(true);
      if ("name" in result) {
        expect(result.name).toBe("testsc");
        expect(result.contractIndex).toBe(24);
        expect(result.description).toBe("A test contract");
        expect(result.functions).toHaveLength(2);
      }
    });

    it("is case-insensitive", () => {
      saveContract("TestSC", 24, sampleFunctions);
      const result = getContract("TESTSC");
      expect("name" in result).toBe(true);
    });

    it("returns error for unknown contract", () => {
      const result = getContract("nonexistent");
      expect("error" in result).toBe(true);
    });
  });

  describe("getContractFunction", () => {
    it("resolves a contract function", () => {
      saveContract("testsc", 24, sampleFunctions);
      const result = getContractFunction("testsc", "getCount");

      expect("fn" in result).toBe(true);
      if ("fn" in result) {
        expect(result.fn.name).toBe("getCount");
        expect(result.fn.inputType).toBe(6);
        expect(result.contract.name).toBe("testsc");
      }
    });

    it("is case-insensitive for function name", () => {
      saveContract("testsc", 24, sampleFunctions);
      const result = getContractFunction("testsc", "GETCOUNT");
      expect("fn" in result).toBe(true);
    });

    it("returns error for unknown function", () => {
      saveContract("testsc", 24, sampleFunctions);
      const result = getContractFunction("testsc", "nonexistent");
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("Available");
      }
    });

    it("returns error for unknown contract", () => {
      const result = getContractFunction("nonexistent", "getCount");
      expect("error" in result).toBe(true);
    });
  });

  describe("listContracts", () => {
    it("returns empty array when no contracts saved", () => {
      expect(listContracts()).toEqual([]);
    });

    it("lists all saved contracts", () => {
      saveContract("alpha", 24, sampleFunctions);
      saveContract("beta", 25, sampleFunctions);

      const list = listContracts();
      expect(list).toHaveLength(2);
      expect(list.map((c) => c.name)).toEqual(["alpha", "beta"]);
    });
  });

  describe("removeContract", () => {
    it("removes a saved contract", () => {
      saveContract("testsc", 24, sampleFunctions);
      const result = removeContract("testsc");
      expect(result).toEqual({ success: true });

      const lookup = getContract("testsc");
      expect("error" in lookup).toBe(true);
    });

    it("returns error for unknown contract", () => {
      const result = removeContract("nonexistent");
      expect("error" in result).toBe(true);
    });
  });
});
