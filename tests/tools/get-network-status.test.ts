import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerNetworkStatusTool } from "../../src/tools/get-network-status.js";
import type { QubicMcpConfig } from "../../src/config/index.js";

const config: QubicMcpConfig = {
  rpcUrl: "https://rpc.qubic.org",
  apiUrl: "https://api.qubic.org",
};

describe("get_network_status tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => registerNetworkStatusTool(server, config)).not.toThrow();
  });
});

// Test formatting of actual API response shape
import { formatNumber, formatQU } from "../../src/utils/format.js";

describe("network status formatting", () => {
  it("formats circulating supply correctly", () => {
    expect(formatQU("165601695595996")).toBe("165,601,695,595,996 QU");
  });

  it("formats burned QUs correctly", () => {
    expect(formatQU("34398304404004")).toBe("34,398,304,404,004 QU");
  });

  it("formats active addresses", () => {
    expect(formatNumber(598036)).toBe("598,036");
  });
});
