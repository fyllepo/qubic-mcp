import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { QubicMcpConfig } from "../config/index.js";
import { rpcGet } from "../utils/qubic-rpc.js";
import { formatNumber, getField } from "../utils/format.js";

interface TickInfo {
  tick: number;
  duration: number;
  epoch: number;
  initialTick: number;
}

function formatTickInfo(info: TickInfo): string {
  const ticksInEpoch = info.tick - info.initialTick;
  const lines = [
    `Qubic Tick Info`,
    `═══════════════`,
    `Current Tick: ${formatNumber(info.tick)}`,
    `Epoch: ${String(info.epoch)}`,
    `Tick Duration: ~${String(info.duration)}s`,
    ``,
    `Epoch Progress:`,
    `  Initial tick:   ${formatNumber(info.initialTick)}`,
    `  Ticks in epoch: ${formatNumber(ticksInEpoch)}`,
  ];
  return lines.join("\n");
}

export function registerTickInfoTool(server: McpServer, config: QubicMcpConfig): void {
  server.tool(
    "get_tick_info",
    "Get the current Qubic network tick information. Returns the current tick number, epoch, and tick duration. Qubic processes transactions in ticks (~5 seconds each) organized into epochs (~1 week each).",
    {},
    async () => {
      try {
        const response = await rpcGet(config, "/v1/tick-info");
        const tickInfo = getField(response, "tickInfo") as TickInfo | undefined;

        if (!tickInfo) {
          return {
            content: [{ type: "text" as const, text: "Unable to parse tick info response." }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text" as const, text: formatTickInfo(tickInfo) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error fetching tick info: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
