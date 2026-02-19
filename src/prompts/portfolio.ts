import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPortfolioPrompt(server: McpServer): void {
  server.prompt(
    "qubic-portfolio",
    "Analyze your Qubic portfolio: wallet balances, token holdings, and USD values",
    () => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              "Analyze my Qubic portfolio. Follow these steps:",
              "",
              "1. Call list_wallets to get all my saved wallet addresses.",
              "2. For each wallet, call get_balance to get the QU balance.",
              "3. Call get_token_price to get the current QUBIC/USD price.",
              "4. Summarize my portfolio in a table with:",
              "   - Wallet name",
              "   - Address (abbreviated)",
              "   - QU balance",
              "   - USD value",
              "   - Total across all wallets",
              "",
              "If no wallets are saved, let me know and explain how to save one.",
            ].join("\n"),
          },
        },
      ],
    }),
  );
}
