import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerQueryContractTool } from "../../src/tools/query-contract.js";
import type { QubicMcpConfig } from "../../src/config/index.js";

const config: QubicMcpConfig = {
  network: "custom",
  networkLabel: "test",
  rpcUrl: "http://localhost:41841",
  apiUrl: "http://localhost:41841",
};

describe("query_contract tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => registerQueryContractTool(server, config)).not.toThrow();
  });
});
