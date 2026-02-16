import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { QubicMcpConfig } from "../config/index.js";
import { rpcGet } from "../utils/qubic-rpc.js";
import { isValidQubicAddress } from "../utils/validation.js";
import { formatQU, formatNumber, getField } from "../utils/format.js";

interface BalanceData {
  id: string;
  balance: string;
  validForTick: number;
  numberOfIncomingTransfers: number;
  numberOfOutgoingTransfers: number;
}

function formatValidation(address: string, balance: BalanceData | undefined): string {
  const lines = [
    `Address Validation`,
    `==================`,
    `Address: ${address}`,
    `Format:  Valid (60 uppercase letters A-Z)`,
  ];

  if (balance) {
    const totalTx = balance.numberOfIncomingTransfers + balance.numberOfOutgoingTransfers;
    const hasActivity = totalTx > 0 || balance.balance !== "0";

    lines.push(`On-chain: ${hasActivity ? "Active — has balance or transfer history" : "Empty — no balance or transfers found"}`);
    lines.push(``);
    lines.push(`Balance:    ${formatQU(balance.balance)}`);
    lines.push(`Transfers:  ${formatNumber(totalTx)} total (${formatNumber(balance.numberOfIncomingTransfers)} in, ${formatNumber(balance.numberOfOutgoingTransfers)} out)`);
  } else {
    lines.push(`On-chain: Unable to verify (API unavailable)`);
  }

  return lines.join("\n");
}

export function registerValidateAddressTool(server: McpServer, config: QubicMcpConfig): void {
  server.tool(
    "validate_address",
    "Validate a Qubic address format and check if it exists on-chain with balance or transfer activity.",
    {
      address: z
        .string()
        .describe("Qubic address to validate (should be 60 uppercase letters)"),
    },
    async ({ address }) => {
      const trimmed = address.trim();

      // Format checks
      const issues: string[] = [];

      if (trimmed.length !== 60) {
        issues.push(`Length is ${String(trimmed.length)}, expected 60`);
      }

      if (trimmed !== trimmed.toUpperCase()) {
        issues.push("Contains lowercase letters (must be all uppercase)");
      }

      if (/[^A-Za-z]/.test(trimmed)) {
        issues.push("Contains non-letter characters (only A-Z allowed)");
      }

      if (!isValidQubicAddress(trimmed)) {
        const lines = [
          `Address Validation`,
          `==================`,
          `Input:   ${trimmed}`,
          `Format:  INVALID`,
          ``,
          `Issues:`,
          ...issues.map((i) => `  - ${i}`),
          ``,
          `Qubic addresses must be exactly 60 uppercase letters (A-Z).`,
        ];

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      }

      // Valid format — check on-chain
      let balance: BalanceData | undefined;
      try {
        const response = await rpcGet(config, `/v1/balances/${trimmed}`);
        balance = getField(response, "balance") as BalanceData | undefined;
      } catch {
        // API unavailable, still report format validity
      }

      return {
        content: [{ type: "text" as const, text: formatValidation(trimmed, balance) }],
      };
    },
  );
}
