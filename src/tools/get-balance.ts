import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { QubicMcpConfig } from "../config/index.js";
import { rpcGet } from "../utils/qubic-rpc.js";
import { formatQU, formatNumber, getField } from "../utils/format.js";
import { resolveAddress } from "../utils/wallet-store.js";

interface BalanceData {
  id: string;
  balance: string;
  validForTick: number;
  latestIncomingTransferTick: number;
  latestOutgoingTransferTick: number;
  incomingAmount: string;
  outgoingAmount: string;
  numberOfIncomingTransfers: number;
  numberOfOutgoingTransfers: number;
}

function formatBalance(label: string, data: BalanceData): string {
  const lines = [
    `${label}`,
    `════════════════════`,
    `Balance: ${formatQU(data.balance)}`,
    ``,
    `Transfer Activity:`,
    `  ← In:  ${formatQU(data.incomingAmount)} (${formatNumber(data.numberOfIncomingTransfers)} transfers)`,
    `  → Out: ${formatQU(data.outgoingAmount)} (${formatNumber(data.numberOfOutgoingTransfers)} transfers)`,
    ``,
    `  Last incoming tick: ${formatNumber(data.latestIncomingTransferTick)}`,
    `  Last outgoing tick: ${formatNumber(data.latestOutgoingTransferTick)}`,
    ``,
    `Valid for tick: ${formatNumber(data.validForTick)}`,
  ];
  return lines.join("\n");
}

export function registerBalanceTool(server: McpServer, config: QubicMcpConfig): void {
  server.tool(
    "get_balance",
    'Get the current balance of a Qubic address or saved wallet. Accepts a 60-character Qubic address OR a saved wallet name (e.g., "my-main"). Use save_wallet to save addresses for quick access.',
    {
      address: z
        .string()
        .describe('Qubic address (60 uppercase letters) or saved wallet name (e.g., "my-main")'),
    },
    async ({ address }) => {
      const resolved = resolveAddress(address);

      if ("error" in resolved) {
        return {
          content: [{ type: "text" as const, text: resolved.error }],
          isError: true,
        };
      }

      try {
        const response = await rpcGet(config, `/v1/balances/${resolved.address}`);
        const balance = getField(response, "balance") as BalanceData | undefined;

        if (!balance) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No balance data found for: ${resolved.label}`,
              },
            ],
          };
        }

        return {
          content: [{ type: "text" as const, text: formatBalance(resolved.label, balance) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error fetching balance: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
