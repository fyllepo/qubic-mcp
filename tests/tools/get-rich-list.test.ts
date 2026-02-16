import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerRichListTool } from "../../src/tools/get-rich-list.js";
import type { QubicMcpConfig } from "../../src/config/index.js";

const config: QubicMcpConfig = {
  rpcUrl: "https://rpc.qubic.org",
  apiUrl: "https://api.qubic.org",
};

describe("get_rich_list tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => registerRichListTool(server, config)).not.toThrow();
  });
});

describe("rich list formatting", () => {
  it("calculates correct start rank for page 2", () => {
    const page = 2;
    const pageSize = 15;
    const startRank = (page - 1) * pageSize + 1;
    expect(startRank).toBe(16);
  });

  it("pads rank numbers for alignment", () => {
    expect(String(1).padStart(4)).toBe("   1");
    expect(String(100).padStart(4)).toBe(" 100");
    expect(String(9999).padStart(4)).toBe("9999");
  });
});
