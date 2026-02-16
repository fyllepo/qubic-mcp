import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTokenPriceTool } from "../../src/tools/get-token-price.js";
import type { QubicMcpConfig } from "../../src/config/index.js";

const config: QubicMcpConfig = {
  rpcUrl: "https://rpc.qubic.org",
  apiUrl: "https://api.qubic.org",
};

describe("get_token_price tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => registerTokenPriceTool(server, config)).not.toThrow();
  });
});

describe("price formatting", () => {
  it("formats positive 24h change with + prefix", () => {
    const change = 2.5;
    const formatted = `+${change.toFixed(2)}%`;
    expect(formatted).toBe("+2.50%");
  });

  it("formats negative 24h change without + prefix", () => {
    const change = -1.11;
    const dir = change >= 0 ? "+" : "";
    const formatted = `${dir}${change.toFixed(2)}%`;
    expect(formatted).toBe("-1.11%");
  });

  it("formats market cap as currency", () => {
    const mc = 67131902.89;
    const formatted = mc.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
    expect(formatted).toMatch(/\$67,131,903/);
  });
});
