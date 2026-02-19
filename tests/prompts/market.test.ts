import { describe, it, expect } from "vitest";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMarketPrompt } from "../../src/prompts/market.js";

describe("qubic-market prompt", () => {
  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => registerMarketPrompt(server)).not.toThrow();
  });
});
