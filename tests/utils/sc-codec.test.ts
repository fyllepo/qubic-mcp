import { describe, it, expect } from "vitest";
import {
  encodeFields,
  decodeFields,
  fieldByteSize,
  totalByteSize,
  validateFieldDef,
  type ScFieldDef,
} from "../../src/utils/sc-codec.js";

describe("sc-codec", () => {
  describe("fieldByteSize", () => {
    it("returns correct sizes for fixed types", () => {
      expect(fieldByteSize({ name: "a", type: "uint8" })).toBe(1);
      expect(fieldByteSize({ name: "a", type: "uint16" })).toBe(2);
      expect(fieldByteSize({ name: "a", type: "uint32" })).toBe(4);
      expect(fieldByteSize({ name: "a", type: "uint64" })).toBe(8);
      expect(fieldByteSize({ name: "a", type: "int8" })).toBe(1);
      expect(fieldByteSize({ name: "a", type: "int16" })).toBe(2);
      expect(fieldByteSize({ name: "a", type: "int32" })).toBe(4);
      expect(fieldByteSize({ name: "a", type: "int64" })).toBe(8);
      expect(fieldByteSize({ name: "a", type: "identity" })).toBe(32);
    });

    it("returns size for padding", () => {
      expect(fieldByteSize({ name: "a", type: "padding", size: 5 })).toBe(5);
      expect(fieldByteSize({ name: "a", type: "padding" })).toBe(0);
    });
  });

  describe("totalByteSize", () => {
    it("sums field sizes", () => {
      const fields: ScFieldDef[] = [
        { name: "mode", type: "uint8" },
        { name: "count", type: "uint8" },
        { name: "active", type: "uint8" },
        { name: "pad", type: "padding", size: 5 },
        { name: "owner", type: "identity" },
      ];
      // 1 + 1 + 1 + 5 + 32 = 40
      expect(totalByteSize(fields)).toBe(40);
    });

    it("accounts for array count", () => {
      const fields: ScFieldDef[] = [
        { name: "recipients", type: "identity", count: 8 },
        { name: "ratios", type: "uint64", count: 8 },
      ];
      // 32*8 + 8*8 = 256 + 64 = 320
      expect(totalByteSize(fields)).toBe(320);
    });

    it("returns 0 for empty schema", () => {
      expect(totalByteSize([])).toBe(0);
    });
  });

  describe("encodeFields / decodeFields round-trip", () => {
    it("round-trips uint8, uint16, uint32, uint64", () => {
      const fields: ScFieldDef[] = [
        { name: "a", type: "uint8" },
        { name: "b", type: "uint16" },
        { name: "c", type: "uint32" },
        { name: "d", type: "uint64" },
      ];
      const values = { a: 42, b: 1000, c: 70000, d: "18446744073709551615" };
      const encoded = encodeFields(fields, values);

      expect(encoded.length).toBe(15); // 1+2+4+8

      const decoded = decodeFields(fields, encoded);
      expect(decoded).toHaveLength(4);
      expect(decoded[0]!.raw).toBe(42);
      expect(decoded[1]!.raw).toBe(1000);
      expect(decoded[2]!.raw).toBe(70000);
      expect(decoded[3]!.raw).toBe("18446744073709551615");
    });

    it("round-trips signed integers", () => {
      const fields: ScFieldDef[] = [
        { name: "a", type: "int8" },
        { name: "b", type: "int16" },
        { name: "c", type: "int32" },
        { name: "d", type: "int64" },
      ];
      const values = { a: -1, b: -1000, c: -70000, d: "-9223372036854775808" };
      const encoded = encodeFields(fields, values);
      const decoded = decodeFields(fields, encoded);

      expect(decoded[0]!.raw).toBe(-1);
      expect(decoded[1]!.raw).toBe(-1000);
      expect(decoded[2]!.raw).toBe(-70000);
      expect(decoded[3]!.raw).toBe("-9223372036854775808");
    });

    it("round-trips identity fields", () => {
      // Use a known identity (all B's)
      const identity = "B".repeat(60);
      const fields: ScFieldDef[] = [{ name: "owner", type: "identity" }];
      const encoded = encodeFields(fields, { owner: identity });

      expect(encoded.length).toBe(32);

      const decoded = decodeFields(fields, encoded);
      // bytesToIdentity appends checksum placeholder, so first 56 chars should match
      const decodedId = decoded[0]!.raw as string;
      expect(decodedId.length).toBe(60);
      // The encoding is lossy due to checksum (last 4 chars become "AAAA")
      // but the first 56 chars should round-trip correctly
      expect(decodedId.slice(0, 56)).toBe(identity.slice(0, 56));
    });

    it("handles padding (skips bytes)", () => {
      const fields: ScFieldDef[] = [
        { name: "mode", type: "uint8" },
        { name: "pad", type: "padding", size: 7 },
        { name: "value", type: "uint64" },
      ];
      const encoded = encodeFields(fields, { mode: 3, value: 42 });

      expect(encoded.length).toBe(16); // 1 + 7 + 8

      const decoded = decodeFields(fields, encoded);
      // padding is skipped
      expect(decoded).toHaveLength(2);
      expect(decoded[0]!.name).toBe("mode");
      expect(decoded[0]!.raw).toBe(3);
      expect(decoded[1]!.name).toBe("value");
      expect(decoded[1]!.raw).toBe("42");
    });

    it("handles array fields (count > 1)", () => {
      const fields: ScFieldDef[] = [{ name: "values", type: "uint64", count: 3 }];
      const values = { values: [100, 200, 300] };
      const encoded = encodeFields(fields, values);

      expect(encoded.length).toBe(24); // 8 * 3

      const decoded = decodeFields(fields, encoded);
      expect(decoded).toHaveLength(1);
      expect(decoded[0]!.raw).toEqual(["100", "200", "300"]);
    });

    it("zero-fills missing values", () => {
      const fields: ScFieldDef[] = [
        { name: "a", type: "uint32" },
        { name: "b", type: "uint64" },
      ];
      const encoded = encodeFields(fields, {});

      const decoded = decodeFields(fields, encoded);
      expect(decoded[0]!.raw).toBe(0);
      expect(decoded[1]!.raw).toBe("0");
    });

    it("zero-fills short arrays", () => {
      const fields: ScFieldDef[] = [{ name: "arr", type: "uint64", count: 4 }];
      const encoded = encodeFields(fields, { arr: [10] });

      const decoded = decodeFields(fields, encoded);
      const arr = decoded[0]!.raw as string[];
      expect(arr).toEqual(["10", "0", "0", "0"]);
    });
  });

  describe("enum labels on decode", () => {
    it("applies enum label to display value", () => {
      const fields: ScFieldDef[] = [
        {
          name: "mode",
          type: "uint8",
          enum: { "0": "SPLIT", "1": "ROUND_ROBIN", "2": "THRESHOLD" },
        },
      ];
      const encoded = encodeFields(fields, { mode: 1 });
      const decoded = decodeFields(fields, encoded);

      expect(decoded[0]!.raw).toBe(1);
      expect(decoded[0]!.display).toBe("ROUND_ROBIN (1)");
    });

    it("falls back to raw value when enum has no match", () => {
      const fields: ScFieldDef[] = [{ name: "mode", type: "uint8", enum: { "0": "SPLIT" } }];
      const encoded = encodeFields(fields, { mode: 99 });
      const decoded = decodeFields(fields, encoded);

      expect(decoded[0]!.display).toBe("99");
    });
  });

  describe("QGate-like struct decode", () => {
    it("decodes a full gate structure", () => {
      // Simulate the 400-byte QGate getGate response
      const fields: ScFieldDef[] = [
        {
          name: "mode",
          type: "uint8",
          enum: { "0": "SPLIT", "1": "ROUND_ROBIN", "2": "THRESHOLD" },
        },
        { name: "recipientCount", type: "uint8" },
        { name: "active", type: "uint8" },
        { name: "pad", type: "padding", size: 5 },
        { name: "owner", type: "identity" },
        { name: "totalReceived", type: "uint64" },
        { name: "totalForwarded", type: "uint64" },
        { name: "currentBalance", type: "uint64" },
        { name: "threshold", type: "uint64" },
        { name: "createdEpoch", type: "uint64" },
        { name: "recipients", type: "identity", count: 8 },
        { name: "ratios", type: "uint64", count: 8 },
      ];

      expect(totalByteSize(fields)).toBe(400);

      // Build a mock 400-byte buffer
      const buffer = new Uint8Array(400);
      const view = new DataView(buffer.buffer);

      buffer[0] = 0; // mode = SPLIT
      buffer[1] = 2; // recipientCount = 2
      buffer[2] = 1; // active = 1
      // padding bytes 3-7
      // owner at offset 8 — leave as zeros (all-A identity)
      view.setBigUint64(40, 5000n, true); // totalReceived
      view.setBigUint64(48, 3000n, true); // totalForwarded
      view.setBigUint64(56, 2000n, true); // currentBalance
      view.setBigUint64(64, 10000n, true); // threshold
      view.setBigUint64(72, 200n, true); // createdEpoch
      // recipients at offset 80, each 32 bytes — leave as zeros
      // ratios at offset 336, each 8 bytes
      view.setBigUint64(336, 60n, true); // ratio[0]
      view.setBigUint64(344, 40n, true); // ratio[1]

      const decoded = decodeFields(fields, buffer);

      const byName = Object.fromEntries(decoded.map((d) => [d.name, d]));

      expect(byName["mode"]!.raw).toBe(0);
      expect(byName["mode"]!.display).toBe("SPLIT (0)");
      expect(byName["recipientCount"]!.raw).toBe(2);
      expect(byName["active"]!.raw).toBe(1);
      expect(byName["totalReceived"]!.raw).toBe("5000");
      expect(byName["totalForwarded"]!.raw).toBe("3000");
      expect(byName["currentBalance"]!.raw).toBe("2000");
      expect(byName["threshold"]!.raw).toBe("10000");
      expect(byName["createdEpoch"]!.raw).toBe("200");

      const ratios = byName["ratios"]!.raw as string[];
      expect(ratios[0]).toBe("60");
      expect(ratios[1]).toBe("40");
    });
  });

  describe("getGateCount-like encode/decode", () => {
    it("encodes empty input and decodes 16-byte output", () => {
      const inputFields: ScFieldDef[] = [];
      const outputFields: ScFieldDef[] = [
        { name: "totalGates", type: "uint64" },
        { name: "activeGates", type: "uint64" },
      ];

      const encoded = encodeFields(inputFields, {});
      expect(encoded.length).toBe(0);

      // Mock 16-byte response
      const response = new Uint8Array(16);
      const view = new DataView(response.buffer);
      view.setBigUint64(0, 5n, true);
      view.setBigUint64(8, 3n, true);

      const decoded = decodeFields(outputFields, response);
      expect(decoded[0]!.raw).toBe("5");
      expect(decoded[0]!.display).toBe("5");
      expect(decoded[1]!.raw).toBe("3");
    });
  });

  describe("getGate-like encode", () => {
    it("encodes gate ID as 8-byte LE uint64", () => {
      const fields: ScFieldDef[] = [{ name: "gateId", type: "uint64" }];
      const encoded = encodeFields(fields, { gateId: 1 });

      expect(encoded.length).toBe(8);
      const view = new DataView(encoded.buffer);
      expect(view.getBigUint64(0, true)).toBe(1n);
    });
  });

  describe("validateFieldDef", () => {
    it("returns null for valid field", () => {
      expect(validateFieldDef({ name: "a", type: "uint8" }, 0, "test")).toBeNull();
    });

    it("rejects unknown type", () => {
      const result = validateFieldDef(
        { name: "a", type: "float32" as ScFieldDef["type"] },
        0,
        "test",
      );
      expect(result).toContain("unknown type");
    });

    it("rejects padding without size", () => {
      const result = validateFieldDef({ name: "a", type: "padding" }, 0, "test");
      expect(result).toContain("size");
    });

    it("rejects invalid count", () => {
      const result = validateFieldDef({ name: "a", type: "uint8", count: 0 }, 0, "test");
      expect(result).toContain("count");
    });

    it("rejects missing name", () => {
      const result = validateFieldDef({ name: "", type: "uint8" }, 0, "test");
      expect(result).toContain("name");
    });
  });
});
