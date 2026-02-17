import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { QubicMcpConfig } from "../config/index.js";
import { rpcPost } from "../utils/qubic-rpc.js";
import { getField } from "../utils/format.js";
import { isValidQubicAddress } from "../utils/validation.js";
import {
  type QxOrder,
  QX_CONTRACT_INDEX,
  INPUT_TYPE_ASK,
  INPUT_TYPE_BID,
  INPUT_SIZE,
  buildRequestData,
  decodeOrders,
  formatOrderbook,
} from "../utils/qx.js";

export function registerQxOrderbookTool(server: McpServer, config: QubicMcpConfig): void {
  server.tool(
    "get_qx_orderbook",
    `Query the QX decentralized exchange orderbook for a Qubic token. Returns current ask (sell) and bid (buy) orders with price and quantity.

IMPORTANT: You MUST call get_token_list first to find the exact issuer address. NEVER guess or fabricate an issuer address. If the token is not in the registry, tell the user it was not found and ask them to provide the issuer address.`,
    {
      asset_name: z.string().min(1).max(7).describe('Token name (e.g., "CFB", "QXMR", "QMINE")'),
      issuer: z.string().length(60).describe("60-character Qubic address of the token issuer"),
      side: z
        .enum(["ask", "bid", "both"])
        .default("both")
        .describe("Which side of the orderbook to fetch (default: both)"),
      offset: z
        .number()
        .int()
        .min(0)
        .default(0)
        .describe("Pagination offset (256 orders per page, default: 0)"),
    },
    async ({ asset_name, issuer, side, offset }) => {
      if (!isValidQubicAddress(issuer)) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Invalid issuer address: must be exactly 60 uppercase letters (A-Z).`,
            },
          ],
          isError: true,
        };
      }

      try {
        const requestData = buildRequestData(issuer, asset_name, offset);

        let askOrders: QxOrder[] = [];
        let bidOrders: QxOrder[] = [];

        if (side === "ask" || side === "both") {
          const askResponse = await rpcPost(config, "/v1/querySmartContract", {
            contractIndex: QX_CONTRACT_INDEX,
            inputType: INPUT_TYPE_ASK,
            inputSize: INPUT_SIZE,
            requestData,
          });
          const askData = getField(askResponse, "responseData") as string | undefined;
          if (askData) {
            askOrders = decodeOrders(askData);
          }
        }

        if (side === "bid" || side === "both") {
          const bidResponse = await rpcPost(config, "/v1/querySmartContract", {
            contractIndex: QX_CONTRACT_INDEX,
            inputType: INPUT_TYPE_BID,
            inputSize: INPUT_SIZE,
            requestData,
          });
          const bidData = getField(bidResponse, "responseData") as string | undefined;
          if (bidData) {
            bidOrders = decodeOrders(bidData);
          }
        }

        return {
          content: [
            {
              type: "text" as const,
              text: formatOrderbook(asset_name, askOrders, bidOrders, side, offset),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error querying QX orderbook for ${asset_name}: ${message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
