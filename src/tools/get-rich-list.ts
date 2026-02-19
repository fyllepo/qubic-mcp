import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { QubicMcpConfig } from "../config/index.js";
import { queryGet } from "../utils/qubic-rpc.js";
import { formatQU, formatNumber, horizontalBar } from "../utils/format.js";

interface RichListEntity {
  identity: string;
  balance: string;
}

interface RichListResponse {
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
  };
  epoch: number;
  richList: {
    entities: RichListEntity[];
  };
}

function formatRichList(data: RichListResponse, page: number, pageSize: number): string {
  const startRank = (page - 1) * pageSize + 1;
  const lines = [
    `Qubic Rich List (Epoch ${String(data.epoch)})`,
    `════════════════════════════════════════`,
    `Showing ranks ${String(startRank)}–${String(startRank + data.richList.entities.length - 1)} of ${formatNumber(data.pagination.totalRecords)}`,
    `Page ${String(data.pagination.currentPage)} of ${String(data.pagination.totalPages)}`,
    ``,
  ];

  // Find the max balance on this page to scale the bars
  const maxBalance = data.richList.entities.reduce((max, e) => {
    const b = BigInt(e.balance);
    return b > max ? b : max;
  }, 0n);

  for (let i = 0; i < data.richList.entities.length; i++) {
    const entity = data.richList.entities[i];
    if (!entity) continue;
    const rank = startRank + i;
    const bal = BigInt(entity.balance);
    const bar = horizontalBar(bal, maxBalance);
    lines.push(`#${String(rank).padStart(4)}  ${bar}  ${formatQU(entity.balance)}`);
    lines.push(`       ${entity.identity}`);
    lines.push(``);
  }

  return lines.join("\n");
}

export function registerRichListTool(server: McpServer, config: QubicMcpConfig): void {
  server.tool(
    "get_rich_list",
    "Get the Qubic rich list — top addresses ranked by balance for the current epoch. Supports pagination.",
    {
      page: z.number().int().min(1).default(1).describe("Page number (default: 1)"),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(15)
        .describe("Results per page (default: 15, max: 50)"),
    },
    async ({ page, pageSize }) => {
      try {
        const data = (await queryGet(
          config,
          `/v1/rich-list?page=${String(page)}&pageSize=${String(pageSize)}`,
        )) as RichListResponse;

        if (!data.richList?.entities?.length) {
          return {
            content: [{ type: "text" as const, text: "No rich list data available." }],
          };
        }

        return {
          content: [{ type: "text" as const, text: formatRichList(data, page, pageSize) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error fetching rich list: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
