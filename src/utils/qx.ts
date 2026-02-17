/**
 * Shared QX binary protocol helpers for encoding/decoding orderbook queries.
 *
 * Used by both the get_qx_orderbook tool and the orderbook resource.
 */

import { identityToBytes, bytesToIdentity, assetNameToBytes } from "./qubic-identity.js";

export const QX_CONTRACT_INDEX = 1;
export const INPUT_TYPE_ASK = 2;
export const INPUT_TYPE_BID = 3;
export const INPUT_SIZE = 48; // 32 (issuer) + 8 (asset name) + 8 (offset)
export const ORDER_SIZE = 48; // 32 (entity) + 8 (price) + 8 (shares)
export const ORDERS_PER_PAGE = 256;

export interface QxOrder {
  entity: string;
  price: bigint;
  numberOfShares: bigint;
}

/**
 * Build the base64-encoded request data for a QX orderbook query.
 * Layout: issuerBytes[32] + assetNameBytes[8] + offsetBytes[8] = 48 bytes
 */
export function buildRequestData(issuer: string, assetName: string, offset: number): string {
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
export function decodeOrders(base64Data: string): QxOrder[] {
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

export function formatOrders(orders: QxOrder[], label: string): string {
  if (orders.length === 0) {
    return `  No ${label.toLowerCase()} orders`;
  }

  const maxShares = orders.reduce(
    (max, o) => (o.numberOfShares > max ? o.numberOfShares : max),
    0n,
  );

  return orders
    .map((order, i) => {
      const shares = order.numberOfShares.toLocaleString("en-US");
      const price = order.price.toLocaleString("en-US");
      const num = String(i + 1).padStart(2, " ");
      const barWidth = 12;
      const filled =
        maxShares === 0n ? 0 : Number((order.numberOfShares * BigInt(barWidth)) / maxShares);
      const bar = "█".repeat(filled) + "░".repeat(barWidth - filled);
      return `  #${num}  ${bar}  ${shares} @ ${price} QU\n       ${order.entity}`;
    })
    .join("\n");
}

export function formatOrderbook(
  assetName: string,
  askOrders: QxOrder[],
  bidOrders: QxOrder[],
  side: string,
  offset: number,
): string {
  const lines = [`QX Orderbook: ${assetName}`, `${"═".repeat(16 + assetName.length)}`, ``];

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
