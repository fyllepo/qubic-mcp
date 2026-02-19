import { describe, it, expect } from "vitest";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPortfolioPrompt } from "../../src/prompts/portfolio.js";

describe("qubic-portfolio prompt", () => {
  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => registerPortfolioPrompt(server)).not.toThrow();
  });
});
