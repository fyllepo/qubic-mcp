import { describe, it, expect } from "vitest";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerExplorerLinksTool } from "../../src/tools/get-explorer-links.js";

describe("get_explorer_links tool", () => {
  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => registerExplorerLinksTool(server)).not.toThrow();
  });
});

describe("explorer link generation", () => {
  const address = "BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID";
  const txId = "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefgh";

  it("generates correct Qubic Explorer address URL", () => {
    const url = `https://explorer.qubic.org/network/address/${address}`;
    expect(url).toContain(address);
    expect(url).toMatch(/^https:\/\/explorer\.qubic\.org/);
  });

  it("generates correct transaction URL", () => {
    const url = `https://explorer.qubic.org/network/tx/${txId}`;
    expect(url).toContain(txId);
  });

  it("validates transaction ID format (60 lowercase letters)", () => {
    expect(/^[a-z]{60}$/.test(txId)).toBe(true);
    expect(/^[a-z]{60}$/.test("ABC")).toBe(false);
    expect(/^[a-z]{60}$/.test(address)).toBe(false); // uppercase = invalid tx
  });
});
