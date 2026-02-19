import { describe, it, expect } from "vitest";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerResearchPrompt } from "../../src/prompts/research.js";

describe("qubic-research prompt", () => {
  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => registerResearchPrompt(server)).not.toThrow();
  });
});
