import { describe, it, expect } from "vitest";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDocsResources } from "../../src/resources/docs.js";

describe("docs resources", () => {
  it("registers all 4 doc resources without error", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => registerDocsResources(server)).not.toThrow();
  });
});
