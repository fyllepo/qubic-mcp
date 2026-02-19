import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerMarketPrompt(server: McpServer): void {
  server.prompt(
    "qubic-market",
    "Comprehensive Qubic market overview: price, network stats, mining phase, and top token orderbooks",
    () => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              "Give me a comprehensive Qubic market overview. Follow these steps:",
              "",
              "1. Call get_token_price for the current QUBIC/USD price across sources.",
              "2. Call get_network_status for network health (tick, epoch, supply, market cap).",
              "3. Call get_mining_phase for the current MINING/IDLE phase and XMR marathon status.",
              "4. Call get_token_list to see what tokens are available on Qubic.",
              "5. For the top 3 tokens by name, call get_qx_orderbook to show current liquidity.",
              "",
              "Summarize everything in a market report with sections for:",
              "- Price & Market Cap",
              "- Network Health (tick quality, epoch progress)",
              "- Mining Phase",
              "- QX DEX Activity (top token orderbooks with spread and depth)",
            ].join("\n"),
          },
        },
      ],
    }),
  );
}
