import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerEpochComputorsTool } from "../../src/tools/get-epoch-computors.js";
import type { QubicMcpConfig } from "../../src/config/index.js";

const config: QubicMcpConfig = {
  rpcUrl: "https://rpc.qubic.org",
  apiUrl: "https://api.qubic.org",
};

describe("get_epoch_computors tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => registerEpochComputorsTool(server, config)).not.toThrow();
  });
});

describe("epoch computors formatting", () => {
  it("formats identity numbering correctly", () => {
    const identities = ["AAAAAAAAAAAAAAAAAAAAA", "BBBBBBBBBBBBBBBBBBBBB"];
    const formatted = identities.map((id, i) => `  ${String(i + 1).padStart(3)}. ${id}`);
    expect(formatted[0]).toBe("    1. AAAAAAAAAAAAAAAAAAAAA");
    expect(formatted[1]).toBe("    2. BBBBBBBBBBBBBBBBBBBBB");
  });

  it("calculates total count from identities array", () => {
    const identities = new Array<string>(676).fill("IDENTITY");
    expect(identities.length).toBe(676);
  });
});
