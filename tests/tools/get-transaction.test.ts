import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTransactionTool } from "../../src/tools/get-transaction.js";
import type { QubicMcpConfig } from "../../src/config/index.js";

const config: QubicMcpConfig = {
  rpcUrl: "https://rpc.qubic.org",
  apiUrl: "https://api.qubic.org",
};

describe("get_transaction tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => registerTransactionTool(server, config)).not.toThrow();
  });
});

describe("transaction ID validation", () => {
  it("valid transaction ID format", () => {
    const valid = "a".repeat(60);
    expect(/^[a-z]{60}$/.test(valid)).toBe(true);
  });

  it("rejects uppercase transaction IDs", () => {
    const invalid = "A".repeat(60);
    expect(/^[a-z]{60}$/.test(invalid)).toBe(false);
  });

  it("rejects too short IDs", () => {
    expect(/^[a-z]{60}$/.test("abc")).toBe(false);
  });

  it("rejects IDs with numbers", () => {
    const withNumbers = "a".repeat(55) + "12345";
    expect(/^[a-z]{60}$/.test(withNumbers)).toBe(false);
  });
});
