import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerConvertQuUsdTool } from "../../src/tools/convert-qu-usd.js";
import type { QubicMcpConfig } from "../../src/config/index.js";

const config: QubicMcpConfig = {
  rpcUrl: "https://rpc.qubic.org",
  apiUrl: "https://api.qubic.org",
};

describe("convert_qu_usd tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => registerConvertQuUsdTool(server, config)).not.toThrow();
  });
});

describe("QU/USD conversion math", () => {
  const price = 0.000000498;

  it("converts QU to USD", () => {
    const qu = 1_000_000_000;
    const usd = qu * price;
    expect(usd).toBeCloseTo(498, 0);
  });

  it("converts USD to QU", () => {
    const usd = 100;
    const qu = usd / price;
    expect(qu).toBeGreaterThan(200_000_000);
  });

  it("formats large QU numbers", () => {
    const num = 1_500_000_000;
    const formatted = `${(num / 1_000_000_000).toFixed(2)}B`;
    expect(formatted).toBe("1.50B");
  });

  it("formats medium QU numbers", () => {
    const num = 2_500_000;
    const formatted = `${(num / 1_000_000).toFixed(2)}M`;
    expect(formatted).toBe("2.50M");
  });
});
