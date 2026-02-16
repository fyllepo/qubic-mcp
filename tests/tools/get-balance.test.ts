import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerBalanceTool } from "../../src/tools/get-balance.js";
import type { QubicMcpConfig } from "../../src/config/index.js";

const config: QubicMcpConfig = {
  rpcUrl: "https://rpc.qubic.org",
  apiUrl: "https://api.qubic.org",
};

// Helper to call a registered tool by extracting the handler
function createToolCaller(server: McpServer) {
  // We test by registering and calling via the server's internal tool map
  // Since McpServer doesn't expose tool handlers directly, we test the formatting
  // and validation logic via the tool registration + direct invocation pattern
  return server;
}

describe("get_balance tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => registerBalanceTool(server, config)).not.toThrow();
  });
});

// Test the formatting logic directly
import { formatNumber, formatQU } from "../../src/utils/format.js";
import { isValidQubicAddress } from "../../src/utils/validation.js";

describe("balance formatting and validation", () => {
  it("validates correct Qubic addresses", () => {
    expect(isValidQubicAddress("BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID")).toBe(
      true,
    );
  });

  it("rejects invalid addresses", () => {
    expect(isValidQubicAddress("invalid")).toBe(false);
    expect(isValidQubicAddress("")).toBe(false);
    expect(isValidQubicAddress("a".repeat(60))).toBe(false); // lowercase
  });

  it("formats balance amounts correctly", () => {
    expect(formatQU("269641214330")).toBe("269,641,214,330 QU");
    expect(formatQU("0")).toBe("0 QU");
    expect(formatQU("16803123888356")).toBe("16,803,123,888,356 QU");
  });

  it("formats transfer counts correctly", () => {
    expect(formatNumber(1827985)).toBe("1,827,985");
    expect(formatNumber(2455478859)).toBe("2,455,478,859");
  });
});
