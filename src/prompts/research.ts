import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerResearchPrompt(server: McpServer): void {
  server.prompt(
    "qubic-research",
    "Research a specific Qubic token: orderbook analysis, spread, depth, and price context",
    { token: z.string().describe("Token name to research (e.g., CFB, QXMR, QMINE)") },
    ({ token }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              `Research the Qubic token "${token}". Follow these steps:`,
              "",
              "1. Call get_token_list to find the token's issuer address and details.",
              `2. Call get_qx_orderbook for "${token}" to get current ask and bid orders.`,
              "3. Analyze the orderbook:",
              "   - Best ask and best bid prices",
              "   - Spread (absolute and percentage)",
              "   - Total depth on each side (sum of shares)",
              "   - Top 5 orders on each side",
              "4. Call get_token_price for the current QUBIC/USD price to add USD context.",
              "",
              "Present a research summary with:",
              "- Token info (name, issuer, website if available)",
              "- Orderbook analysis (spread, depth, key levels)",
              "- Liquidity assessment (thin/moderate/deep)",
              "- USD-equivalent prices for the best ask/bid",
            ].join("\n"),
          },
        },
      ],
    }),
  );
}
