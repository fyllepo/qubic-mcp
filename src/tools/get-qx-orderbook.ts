import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { QubicMcpConfig } from "../config/index.js";
import { rpcPost } from "../utils/qubic-rpc.js";
import { getField } from "../utils/format.js";
import { identityToBytes, bytesToIdentity, assetNameToBytes } from "../utils/qubic-identity.js";
import { isValidQubicAddress } from "../utils/validation.js";

const QX_CONTRACT_INDEX = 1;
const INPUT_TYPE_ASK = 2;
const INPUT_TYPE_BID = 3;
const INPUT_SIZE = 48; // 32 (issuer) + 8 (asset name) + 8 (offset)
const ORDER_SIZE = 48; // 32 (entity) + 8 (price) + 8 (shares)
const ORDERS_PER_PAGE = 256;

interface QxOrder {
  entity: string;
  price: bigint;
  numberOfShares: bigint;
}

/**
 * Build the base64-encoded request data for a QX orderbook query.
 * Layout: issuerBytes[32] + assetNameBytes[8] + offsetBytes[8] = 48 bytes
 */
function buildRequestData(issuer: string, assetName: string, offset: number): string {
  const buffer = new Uint8Array(INPUT_SIZE);

  const issuerBytes = identityToBytes(issuer);
  buffer.set(issuerBytes, 0);

  const nameBytes = assetNameToBytes(assetName);
  buffer.set(nameBytes, 32);

  const offsetView = new DataView(buffer.buffer);
  offsetView.setBigUint64(40, BigInt(offset), true);

  return uint8ArrayToBase64(buffer);
}

/**
 * Decode a base64-encoded binary response into QX orders.
 * Each order is 48 bytes: entity[32] + price[8] + shares[8]
 */
function decodeOrders(base64Data: string): QxOrder[] {
  const bytes = base64ToUint8Array(base64Data);
  const orders: QxOrder[] = [];

  const orderCount = Math.floor(bytes.length / ORDER_SIZE);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  for (let i = 0; i < orderCount; i++) {
    const start = i * ORDER_SIZE;
    const sharesOffset = start + 40;

    // Read shares first to skip empty orders
    const numberOfShares = view.getBigInt64(sharesOffset, true);
    if (numberOfShares === 0n) continue;

    const entityBytes = bytes.slice(start, start + 32);
    const entity = bytesToIdentity(entityBytes);
    const price = view.getBigInt64(start + 32, true);

    orders.push({ entity, price, numberOfShares });
  }

  return orders;
}

function formatOrders(orders: QxOrder[], label: string): string {
  if (orders.length === 0) {
    return `  No ${label.toLowerCase()} orders`;
  }

  return orders
    .map((order, i) => {
      const shares = order.numberOfShares.toLocaleString("en-US");
      const price = order.price.toLocaleString("en-US");
      const num = String(i + 1).padStart(2, " ");
      return `  #${num}  ${shares} shares @ ${price} QU — ${order.entity}`;
    })
    .join("\n");
}

function formatOrderbook(
  assetName: string,
  askOrders: QxOrder[],
  bidOrders: QxOrder[],
  side: string,
  offset: number,
): string {
  const lines = [`QX Orderbook: ${assetName}`, `${"=".repeat(16 + assetName.length)}`, ``];

  if (side === "ask" || side === "both") {
    lines.push(`Ask Orders (sell):`);
    lines.push(formatOrders(askOrders, "ask"));
    lines.push(``);
  }

  if (side === "bid" || side === "both") {
    lines.push(`Bid Orders (buy):`);
    lines.push(formatOrders(bidOrders, "bid"));
    lines.push(``);
  }

  const page = Math.floor(offset / ORDERS_PER_PAGE) + 1;
  lines.push(
    `Showing page ${String(page)} (offset ${String(offset)}, ${String(ORDERS_PER_PAGE)} orders per page)`,
  );

  return lines.join("\n");
}

/** Convert Uint8Array to base64 string. */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

/** Convert base64 string to Uint8Array. */
function base64ToUint8Array(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, "base64"));
}

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

// Export for testing
export { buildRequestData, decodeOrders, formatOrderbook };
export type { QxOrder };
