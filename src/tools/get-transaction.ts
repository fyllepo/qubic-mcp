import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { QubicMcpConfig } from "../config/index.js";
import { rpcGet } from "../utils/qubic-rpc.js";
import { formatQU, formatNumber, getField } from "../utils/format.js";

interface Transaction {
  sourceId: string;
  destId: string;
  amount: string;
  tickNumber: number;
  inputType: number;
  inputSize: number;
  inputHex: string;
  signatureHex: string;
  txId: string;
}

interface TransactionEntry {
  transaction: Transaction;
  timestamp: string;
  moneyFlew: boolean;
}

function formatTx(entry: TransactionEntry): string {
  const tx = entry.transaction;
  const ts = Number(entry.timestamp);
  const date = ts > 0 ? new Date(ts).toISOString() : "N/A";

  const lines = [
    `Transaction: ${tx.txId}`,
    `Status: ${entry.moneyFlew ? "Confirmed (money flew)" : "Included (no money transfer)"}`,
    `Timestamp: ${date}`,
    ``,
    `From: ${tx.sourceId}`,
    `To:   ${tx.destId}`,
    `Amount: ${formatQU(tx.amount)}`,
    `Tick: ${formatNumber(tx.tickNumber)}`,
  ];

  if (tx.inputType > 0) {
    lines.push(
      ``,
      `Smart Contract Call:`,
      `  Input Type: ${String(tx.inputType)}`,
      `  Input Size: ${String(tx.inputSize)} bytes`,
    );
  }

  return lines.join("\n");
}

export function registerTransactionTool(server: McpServer, config: QubicMcpConfig): void {
  server.tool(
    "get_transaction",
    "Look up a Qubic transaction by its transaction ID. Returns source, destination, amount, tick, and execution status. Transaction IDs are 60 lowercase letters.",
    {
      transactionId: z.string().describe("The 60-character lowercase transaction ID"),
    },
    async ({ transactionId }) => {
      const sanitized = transactionId.trim().toLowerCase();
      if (sanitized.length === 0) {
        return {
          content: [{ type: "text" as const, text: "Transaction ID cannot be empty." }],
          isError: true,
        };
      }

      if (!/^[a-z]{60}$/.test(sanitized)) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Invalid transaction ID: "${transactionId}". Expected 60 lowercase letters (a-z).`,
            },
          ],
          isError: true,
        };
      }

      try {
        const response = await rpcGet(config, `/v1/transactions/${sanitized}`);
        const transaction = getField(response, "transaction") as TransactionEntry | undefined;

        if (!transaction) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Transaction not found: ${sanitized}. It may not exist or may not have been processed yet.`,
              },
            ],
          };
        }

        return {
          content: [{ type: "text" as const, text: formatTx(transaction) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error fetching transaction: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
