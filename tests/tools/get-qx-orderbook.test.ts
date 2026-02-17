import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerQxOrderbookTool,
  buildRequestData,
  decodeOrders,
  formatOrderbook,
} from "../../src/tools/get-qx-orderbook.js";
import type { QxOrder } from "../../src/tools/get-qx-orderbook.js";
import type { QubicMcpConfig } from "../../src/config/index.js";

const config: QubicMcpConfig = {
  rpcUrl: "https://rpc.qubic.org",
  apiUrl: "https://api.qubic.org",
};

describe("get_qx_orderbook tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => registerQxOrderbookTool(server, config)).not.toThrow();
  });
});

describe("buildRequestData", () => {
  it("produces a valid base64 string", () => {
    const allAIdentity = "A".repeat(60);
    const result = buildRequestData(allAIdentity, "CFB", 0);

    // Should be base64 encoded 48 bytes
    const bytes = Buffer.from(result, "base64");
    expect(bytes.length).toBe(48);
  });

  it("encodes issuer, asset name, and offset correctly", () => {
    const allAIdentity = "A".repeat(60);
    const result = buildRequestData(allAIdentity, "CFB", 0);

    const bytes = Buffer.from(result, "base64");

    // First 32 bytes: issuer (all A's = all zeros)
    for (let i = 0; i < 32; i++) {
      expect(bytes[i]).toBe(0);
    }

    // Bytes 32-39: asset name "CFB" as raw ASCII
    expect(bytes[32]).toBe(0x43); // 'C'
    expect(bytes[33]).toBe(0x46); // 'F'
    expect(bytes[34]).toBe(0x42); // 'B'
    expect(bytes[35]).toBe(0);
    expect(bytes[36]).toBe(0);
    expect(bytes[37]).toBe(0);
    expect(bytes[38]).toBe(0);
    expect(bytes[39]).toBe(0);

    // Bytes 40-47: offset (0 as LE uint64)
    for (let i = 40; i < 48; i++) {
      expect(bytes[i]).toBe(0);
    }
  });

  it("encodes non-zero offset correctly", () => {
    const allAIdentity = "A".repeat(60);
    const result = buildRequestData(allAIdentity, "CFB", 256);

    const bytes = Buffer.from(result, "base64");
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const offset = view.getBigUint64(40, true);
    expect(offset).toBe(256n);
  });
});

describe("decodeOrders", () => {
  it("decodes a single valid order", () => {
    // Build a mock order: 48 bytes
    // entity: 32 zero bytes (all-A identity)
    // price: 25 as LE int64
    // shares: 1500 as LE int64
    const buffer = new Uint8Array(48);
    const view = new DataView(buffer.buffer);
    // entity is all zeros (identity = "AAA...A")
    view.setBigInt64(32, 25n, true); // price
    view.setBigInt64(40, 1500n, true); // shares

    const base64 = Buffer.from(buffer).toString("base64");
    const orders = decodeOrders(base64);

    expect(orders.length).toBe(1);
    expect(orders[0]!.price).toBe(25n);
    expect(orders[0]!.numberOfShares).toBe(1500n);
    expect(orders[0]!.entity.length).toBe(60);
  });

  it("filters out empty orders (shares = 0)", () => {
    // Two orders: first has shares, second is empty
    const buffer = new Uint8Array(96); // 2 * 48
    const view = new DataView(buffer.buffer);

    // First order: valid
    view.setBigInt64(32, 10n, true);
    view.setBigInt64(40, 500n, true);

    // Second order: shares = 0 (should be filtered)
    view.setBigInt64(80, 20n, true);
    view.setBigInt64(88, 0n, true);

    const base64 = Buffer.from(buffer).toString("base64");
    const orders = decodeOrders(base64);

    expect(orders.length).toBe(1);
    expect(orders[0]!.price).toBe(10n);
  });

  it("handles empty response", () => {
    // 256 orders * 48 bytes each = 12288 bytes, all zeros
    const buffer = new Uint8Array(12288);
    const base64 = Buffer.from(buffer).toString("base64");
    const orders = decodeOrders(base64);

    expect(orders.length).toBe(0);
  });

  it("decodes multiple valid orders", () => {
    const buffer = new Uint8Array(144); // 3 * 48
    const view = new DataView(buffer.buffer);

    // Order 1
    view.setBigInt64(32, 100n, true);
    view.setBigInt64(40, 1000n, true);

    // Order 2
    view.setBigInt64(80, 200n, true);
    view.setBigInt64(88, 2000n, true);

    // Order 3
    view.setBigInt64(128, 300n, true);
    view.setBigInt64(136, 3000n, true);

    const base64 = Buffer.from(buffer).toString("base64");
    const orders = decodeOrders(base64);

    expect(orders.length).toBe(3);
    expect(orders[0]!.price).toBe(100n);
    expect(orders[1]!.price).toBe(200n);
    expect(orders[2]!.price).toBe(300n);
  });
});

describe("formatOrderbook", () => {
  it("formats orders with correct layout", () => {
    const asks: QxOrder[] = [
      { entity: "A".repeat(60), price: 25n, numberOfShares: 1500n },
    ];
    const bids: QxOrder[] = [
      { entity: "B".repeat(60), price: 20n, numberOfShares: 2000n },
    ];

    const output = formatOrderbook("CFB", asks, bids, "both", 0);

    expect(output).toContain("QX Orderbook: CFB");
    expect(output).toContain("Ask Orders (sell):");
    expect(output).toContain("1,500 shares @ 25 QU");
    expect(output).toContain("Bid Orders (buy):");
    expect(output).toContain("2,000 shares @ 20 QU");
    expect(output).toContain("page 1");
  });

  it("shows only ask orders when side is ask", () => {
    const asks: QxOrder[] = [
      { entity: "A".repeat(60), price: 25n, numberOfShares: 1500n },
    ];

    const output = formatOrderbook("CFB", asks, [], "ask", 0);

    expect(output).toContain("Ask Orders (sell):");
    expect(output).not.toContain("Bid Orders (buy):");
  });

  it("shows only bid orders when side is bid", () => {
    const bids: QxOrder[] = [
      { entity: "A".repeat(60), price: 20n, numberOfShares: 2000n },
    ];

    const output = formatOrderbook("CFB", [], bids, "bid", 0);

    expect(output).not.toContain("Ask Orders (sell):");
    expect(output).toContain("Bid Orders (buy):");
  });

  it("handles empty orderbook", () => {
    const output = formatOrderbook("CFB", [], [], "both", 0);

    expect(output).toContain("No ask orders");
    expect(output).toContain("No bid orders");
  });

  it("shows correct page for non-zero offset", () => {
    const output = formatOrderbook("CFB", [], [], "both", 256);
    expect(output).toContain("page 2");
    expect(output).toContain("offset 256");
  });
});
