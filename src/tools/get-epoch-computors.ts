import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { QubicMcpConfig } from "../config/index.js";
import { rpcGet } from "../utils/qubic-rpc.js";
import { formatNumber, getField } from "../utils/format.js";
import { z } from "zod";

interface ComputorsResponse {
  epoch: number;
  identities: string[];
}

function formatComputors(data: ComputorsResponse): string {
  const lines = [
    `Epoch ${String(data.epoch)} Computors`,
    `══════════════════════`,
    `Total: ${formatNumber(data.identities.length)}`,
    ``,
  ];

  for (let i = 0; i < data.identities.length; i++) {
    const identity = data.identities[i] ?? "";
    lines.push(`  ${String(i + 1).padStart(3)}. ${identity}`);
  }

  return lines.join("\n");
}

export function registerEpochComputorsTool(server: McpServer, config: QubicMcpConfig): void {
  server.tool(
    "get_epoch_computors",
    "List the computor identities for a given epoch. Computors are the 676 nodes that validate transactions on the Qubic network. Defaults to the current epoch if none is specified.",
    {
      epoch: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Epoch number (defaults to current epoch)"),
    },
    async ({ epoch }) => {
      try {
        let targetEpoch = epoch;

        if (targetEpoch === undefined) {
          const tickResponse = await rpcGet(config, "/v1/tick-info");
          const tickEpoch = getField(tickResponse, "tickInfo", "epoch") as number | undefined;
          if (!tickEpoch) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Unable to determine current epoch from tick info.",
                },
              ],
              isError: true,
            };
          }
          targetEpoch = tickEpoch;
        }

        const response = await rpcGet(config, `/v1/epochs/${String(targetEpoch)}/computors`);
        const computors = getField(response, "computors") as ComputorsResponse | undefined;

        if (!computors?.identities) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No computor data found for epoch ${String(targetEpoch)}.`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [{ type: "text" as const, text: formatComputors(computors) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error fetching computors: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
