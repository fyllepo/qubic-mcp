import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { QubicMcpConfig } from "../config/index.js";
import { externalGet, queryGet } from "../utils/qubic-rpc.js";
import { getField } from "../utils/format.js";

async function fetchPrice(config: QubicMcpConfig): Promise<number | undefined> {
  // Try CoinGecko first, fall back to Qubic API
  try {
    const data = await externalGet(
      "https://api.coingecko.com/api/v3/simple/price?ids=qubic-network&vs_currencies=usd",
    );
    const qubic = getField(data, "qubic-network") as { usd?: number } | undefined;
    if (qubic?.usd !== undefined) return qubic.usd;
  } catch {
    // fall through
  }

  try {
    const data = await queryGet(config, "/v1/latest-stats");
    const stats = getField(data, "data") as { price?: number } | undefined;
    if (stats?.price !== undefined) return stats.price;
  } catch {
    // fall through
  }

  return undefined;
}

function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}

export function registerConvertQuUsdTool(server: McpServer, config: QubicMcpConfig): void {
  server.tool(
    "convert_qu_usd",
    "Convert between QU (Qubic Units) and USD using the current live price. Specify either a QU amount to get USD value, or a USD amount to get the equivalent in QU.",
    {
      qu: z.number().min(0).optional().describe("Amount in QU to convert to USD"),
      usd: z.number().min(0).optional().describe("Amount in USD to convert to QU"),
    },
    async ({ qu, usd }) => {
      if (qu === undefined && usd === undefined) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Please provide either a QU amount or a USD amount to convert.",
            },
          ],
          isError: true,
        };
      }

      const price = await fetchPrice(config);
      if (price === undefined) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Unable to fetch current QUBIC price. Try again shortly.",
            },
          ],
          isError: true,
        };
      }

      const lines: string[] = [];

      if (qu !== undefined) {
        const usdValue = qu * price;
        lines.push(`QU → USD Conversion`);
        lines.push(`═══════════════════`);
        lines.push(
          `${formatLargeNumber(qu)} QU = $${usdValue < 0.01 ? usdValue.toPrecision(4) : usdValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        );
      }

      if (usd !== undefined) {
        const quValue = usd / price;
        if (lines.length > 0) lines.push(``);
        lines.push(`USD → QU Conversion`);
        lines.push(`═══════════════════`);
        lines.push(
          `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = ${formatLargeNumber(quValue)} QU`,
        );
      }

      lines.push(``);
      lines.push(`Rate: 1 QU = $${String(price)}`);

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    },
  );
}
