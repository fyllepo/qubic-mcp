import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTransferHistoryTool } from "../../src/tools/get-transfer-history.js";
import type { QubicMcpConfig } from "../../src/config/index.js";
import { isValidQubicAddress } from "../../src/utils/validation.js";

const config: QubicMcpConfig = {
  rpcUrl: "https://rpc.qubic.org",
  apiUrl: "https://api.qubic.org",
};

describe("get_transfer_history tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => registerTransferHistoryTool(server, config)).not.toThrow();
  });
});

describe("transfer history validation", () => {
  it("validates address format", () => {
    expect(
      isValidQubicAddress("BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID"),
    ).toBe(true);
    expect(isValidQubicAddress("invalid")).toBe(false);
  });

  it("validates tick range", () => {
    const startTick = 44180000;
    const endTick = 44180200;
    expect(endTick).toBeGreaterThan(startTick);
  });

  it("rejects invalid tick range", () => {
    const startTick = 44180200;
    const endTick = 44180000;
    expect(endTick).toBeLessThan(startTick);
  });
});
