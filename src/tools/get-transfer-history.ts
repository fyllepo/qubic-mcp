import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { QubicMcpConfig } from "../config/index.js";
import { rpcGet } from "../utils/qubic-rpc.js";
import { formatQU, formatNumber } from "../utils/format.js";
import { resolveAddress } from "../utils/wallet-store.js";

interface Transaction {
  sourceId: string;
  destId: string;
  amount: string;
  tickNumber: number;
  inputType: number;
  inputSize: number;
  txId: string;
}

interface TransactionEntry {
  transaction: Transaction;
  timestamp: string;
  moneyFlew: boolean;
}

interface TickGroup {
  tickNumber: number;
  identity: string;
  transactions: TransactionEntry[];
}

interface TransferResponse {
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
  };
  transactions: TickGroup[];
}

function formatTransferHistory(address: string, data: TransferResponse): string {
  const lines = [
    `Transfer History for ${address}`,
    `${"=".repeat(40)}`,
    `Total Records: ${formatNumber(data.pagination.totalRecords)}`,
    `Page ${String(data.pagination.currentPage)} of ${String(data.pagination.totalPages)}`,
    ``,
  ];

  if (data.transactions.length === 0) {
    lines.push("No transfers found in the specified tick range.");
    return lines.join("\n");
  }

  for (const group of data.transactions) {
    for (const entry of group.transactions) {
      const tx = entry.transaction;
      const ts = Number(entry.timestamp);
      const date = ts > 0 ? new Date(ts).toISOString() : "N/A";
      const direction = tx.sourceId === address ? "OUT" : "IN";
      const counterparty = direction === "OUT" ? tx.destId : tx.sourceId;
      const status = entry.moneyFlew ? "confirmed" : "no transfer";

      lines.push(
        `[${direction}] ${formatQU(tx.amount)} | Tick ${formatNumber(tx.tickNumber)} | ${date}`,
      );
      lines.push(`     ${direction === "OUT" ? "To" : "From"}: ${counterparty}`);
      lines.push(`     TX: ${tx.txId} (${status})`);

      if (tx.inputType > 0) {
        lines.push(`     SC Call: inputType=${String(tx.inputType)}`);
      }
      lines.push(``);
    }
  }

  return lines.join("\n");
}

export function registerTransferHistoryTool(server: McpServer, config: QubicMcpConfig): void {
  server.tool(
    "get_transfer_history",
    "Get the transfer history for a Qubic address or saved wallet within a tick range. Returns incoming and outgoing transfers with details. Use get_tick_info first to find the current tick number.",
    {
      address: z
        .string()
        .describe('Qubic address (60 uppercase letters) or saved wallet name (e.g., "my-main")'),
      startTick: z.number().int().min(0).describe("Start tick number for the range"),
      endTick: z.number().int().min(0).describe("End tick number for the range"),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(25)
        .describe("Number of results per page (default: 25, max: 100)"),
      page: z.number().int().min(1).default(1).describe("Page number (default: 1)"),
    },
    async ({ address, startTick, endTick, pageSize, page }) => {
      const resolved = resolveAddress(address);

      if ("error" in resolved) {
        return {
          content: [{ type: "text" as const, text: resolved.error }],
          isError: true,
        };
      }

      if (endTick <= startTick) {
        return {
          content: [
            {
              type: "text" as const,
              text: `endTick (${String(endTick)}) must be greater than startTick (${String(startTick)}).`,
            },
          ],
          isError: true,
        };
      }

      try {
        const path = `/v2/identities/${resolved.address}/transfers?startTick=${String(startTick)}&endTick=${String(endTick)}&pageSize=${String(pageSize)}&page=${String(page)}`;
        const response = (await rpcGet(config, path)) as TransferResponse;

        return {
          content: [
            { type: "text" as const, text: formatTransferHistory(resolved.address, response) },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error fetching transfer history: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
