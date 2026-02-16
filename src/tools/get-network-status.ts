import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { QubicMcpConfig } from "../config/index.js";
import { queryGet } from "../utils/qubic-rpc.js";
import { formatNumber, formatQU, getField } from "../utils/format.js";

interface LatestStats {
  timestamp: string;
  circulatingSupply: string;
  activeAddresses: number;
  price: number;
  marketCap: string;
  epoch: number;
  currentTick: number;
  ticksInCurrentEpoch: number;
  emptyTicksInCurrentEpoch: number;
  epochTickQuality: number;
  burnedQus: string;
}

function formatNetworkStatus(stats: LatestStats): string {
  const lines = [
    `Qubic Network Status`,
    `====================`,
    ``,
    `Epoch: ${String(stats.epoch)}`,
    `Current Tick: ${formatNumber(stats.currentTick)}`,
    `Ticks in Epoch: ${formatNumber(stats.ticksInCurrentEpoch)}`,
    `Empty Ticks: ${formatNumber(stats.emptyTicksInCurrentEpoch)}`,
    `Tick Quality: ${stats.epochTickQuality.toFixed(2)}%`,
    ``,
    `Supply & Economics:`,
    `  Circulating Supply: ${formatQU(stats.circulatingSupply)}`,
    `  Burned: ${formatQU(stats.burnedQus)}`,
    `  Active Addresses: ${formatNumber(stats.activeAddresses)}`,
    ``,
    `Market:`,
    `  Price: $${String(stats.price)}`,
    `  Market Cap: $${formatNumber(stats.marketCap)}`,
  ];
  return lines.join("\n");
}

export function registerNetworkStatusTool(server: McpServer, config: QubicMcpConfig): void {
  server.tool(
    "get_network_status",
    "Get comprehensive Qubic network status including current tick, epoch progress, circulating supply, burned QUs, active addresses, price, and market cap.",
    {},
    async () => {
      try {
        const response = await queryGet(config, "/v1/latest-stats");
        const stats = getField(response, "data") as LatestStats | undefined;

        if (!stats) {
          return {
            content: [{ type: "text" as const, text: "Unable to parse network status response." }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text" as const, text: formatNetworkStatus(stats) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error fetching network status: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
