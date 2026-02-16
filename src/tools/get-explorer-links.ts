import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveAddress } from "../utils/wallet-store.js";

const EXPLORERS = [
  {
    name: "Qubic Explorer (Official)",
    addressUrl: "https://explorer.qubic.org/network/address/",
    txUrl: "https://explorer.qubic.org/network/tx/",
  },
] as const;

function formatAddressLinks(address: string, label: string): string {
  const lines = [`Explorer Links for ${label}`, `${"=".repeat(40)}`, ``];

  for (const explorer of EXPLORERS) {
    lines.push(`${explorer.name}:`);
    lines.push(`  ${explorer.addressUrl}${address}`);
    lines.push(``);
  }

  return lines.join("\n");
}

function formatTxLinks(txId: string): string {
  const lines = [`Explorer Links for Transaction`, `${"=".repeat(40)}`, `TX: ${txId}`, ``];

  for (const explorer of EXPLORERS) {
    lines.push(`${explorer.name}:`);
    lines.push(`  ${explorer.txUrl}${txId}`);
    lines.push(``);
  }

  return lines.join("\n");
}

export function registerExplorerLinksTool(server: McpServer): void {
  server.tool(
    "get_explorer_links",
    "Get links to Qubic block explorers for an address or transaction ID. Accepts saved wallet names.",
    {
      address: z
        .string()
        .optional()
        .describe("Qubic address (60 uppercase letters) or saved wallet name"),
      txId: z.string().optional().describe("Transaction ID (60 lowercase letters)"),
    },
    async ({ address, txId }) => {
      if (!address && !txId) {
        return {
          content: [
            { type: "text" as const, text: "Please provide an address or transaction ID." },
          ],
          isError: true,
        };
      }

      const lines: string[] = [];

      if (address) {
        const resolved = resolveAddress(address);
        if ("error" in resolved) {
          return {
            content: [{ type: "text" as const, text: resolved.error }],
            isError: true,
          };
        }
        lines.push(formatAddressLinks(resolved.address, resolved.label));
      }

      if (txId) {
        const trimmed = txId.trim().toLowerCase();
        if (!/^[a-z]{60}$/.test(trimmed)) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Invalid transaction ID format. Expected 60 lowercase letters, got ${String(trimmed.length)} characters.`,
              },
            ],
            isError: true,
          };
        }
        if (lines.length > 0) lines.push(``);
        lines.push(formatTxLinks(trimmed));
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    },
  );
}
