import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerQuerySmartContractTool } from "../../src/tools/query-smart-contract.js";
import type { QubicMcpConfig } from "../../src/config/index.js";

const config: QubicMcpConfig = {
  rpcUrl: "https://rpc.qubic.org",
  apiUrl: "https://api.qubic.org",
};

describe("query_smart_contract tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => registerQuerySmartContractTool(server, config)).not.toThrow();
  });
});

describe("known contracts mapping", () => {
  it("has 5 known contracts", () => {
    const contracts: Record<number, string> = {
      1: "QX (Decentralized Exchange)",
      2: "Quottery (Betting & Oracles)",
      3: "Random (Random Number Generation)",
      4: "QUTIL (Utility Functions)",
      5: "MLM (My Last Match - Gaming)",
    };
    expect(Object.keys(contracts)).toHaveLength(5);
    expect(contracts[1]).toContain("QX");
    expect(contracts[2]).toContain("Quottery");
  });
});
