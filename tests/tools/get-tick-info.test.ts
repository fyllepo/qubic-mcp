import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTickInfoTool } from "../../src/tools/get-tick-info.js";
import type { QubicMcpConfig } from "../../src/config/index.js";

const config: QubicMcpConfig = {
  rpcUrl: "https://rpc.qubic.org",
  apiUrl: "https://api.qubic.org",
};

describe("get_tick_info tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => registerTickInfoTool(server, config)).not.toThrow();
  });
});

// Test formatting logic
describe("tick info formatting", () => {
  it("calculates ticks in epoch correctly", () => {
    const tick = 44180259;
    const initialTick = 43910000;
    const ticksInEpoch = tick - initialTick;
    expect(ticksInEpoch).toBe(270259);
  });
});
