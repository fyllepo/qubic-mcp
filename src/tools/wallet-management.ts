import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  saveWallet,
  removeWallet,
  listWallets,
} from "../utils/wallet-store.js";

export function registerWalletManagementTools(server: McpServer): void {
  server.tool(
    "save_wallet",
    "Save a Qubic wallet address with a friendly name for quick access. Only saves the public address — never stores seeds or private keys. Stored locally in ~/.qubic-mcp/wallets.json.",
    {
      name: z
        .string()
        .describe('A friendly name for this wallet (e.g., "my-main", "trading", "savings")'),
      address: z
        .string()
        .describe("The 60-character Qubic address to save"),
    },
    async ({ name, address }) => {
      const result = saveWallet(name, address);

      if ("error" in result) {
        return {
          content: [{ type: "text" as const, text: result.error }],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Wallet "${name}" saved successfully.\n\nAddress: ${address.trim().toUpperCase()}\n\nYou can now use "${name}" instead of the full address in any tool (e.g., get_balance, get_transfer_history).`,
          },
        ],
      };
    },
  );

  server.tool(
    "list_wallets",
    "List all saved Qubic wallet addresses. These are public addresses only — no private keys are ever stored.",
    {},
    async () => {
      const wallets = listWallets();

      if (wallets.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: 'No wallets saved yet. Use save_wallet to add one (e.g., save_wallet with name "my-main" and your Qubic address).',
            },
          ],
        };
      }

      const lines = [
        `Saved Wallets (${String(wallets.length)})`,
        `${"=".repeat(30)}`,
        ``,
      ];

      for (const w of wallets) {
        lines.push(`${w.name}`);
        lines.push(`  Address: ${w.address}`);
        lines.push(`  Added: ${w.addedAt}`);
        lines.push(``);
      }

      lines.push(`Use any wallet name in place of an address in tools like get_balance.`);

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    },
  );

  server.tool(
    "remove_wallet",
    "Remove a saved wallet by name. This only removes the local reference — it does not affect the actual blockchain address in any way.",
    {
      name: z.string().describe("The name of the wallet to remove"),
    },
    async ({ name }) => {
      const result = removeWallet(name);

      if ("error" in result) {
        return {
          content: [{ type: "text" as const, text: result.error }],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Wallet "${name}" removed successfully.`,
          },
        ],
      };
    },
  );
}
