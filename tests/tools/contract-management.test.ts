import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

let tmpHome: string;

vi.mock("node:os", async (importOriginal) => {
  const original = await importOriginal<typeof import("node:os")>();
  return {
    ...original,
    homedir: () => tmpHome,
  };
});

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerContractManagementTools } from "../../src/tools/contract-management.js";

beforeEach(() => {
  tmpHome = mkdtempSync(join(tmpdir(), "qubic-mcp-cm-test-"));
});

afterEach(() => {
  rmSync(tmpHome, { recursive: true, force: true });
});

describe("contract-management tools", () => {
  it("registers all three tools without error", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => registerContractManagementTools(server)).not.toThrow();
  });
});
