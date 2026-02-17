import { describe, it, expect } from "vitest";

import {
  identityToBytes,
  bytesToIdentity,
  assetNameToBytes,
  bytesToAssetName,
} from "../../src/utils/qubic-identity.js";

describe("identityToBytes", () => {
  it("converts all-A identity to all-zero bytes", () => {
    const identity = "A".repeat(60);
    const bytes = identityToBytes(identity);
    expect(bytes.length).toBe(32);
    expect(bytes.every((b) => b === 0)).toBe(true);
  });

  it("rejects identities with wrong length", () => {
    expect(() => identityToBytes("ABC")).toThrow("60 characters");
    expect(() => identityToBytes("A".repeat(59))).toThrow("60 characters");
    expect(() => identityToBytes("A".repeat(61))).toThrow("60 characters");
  });

  it("rejects identities with invalid characters", () => {
    expect(() => identityToBytes("a".repeat(60))).toThrow("uppercase");
    expect(() => identityToBytes("A".repeat(59) + "1")).toThrow("uppercase");
  });

  it("encodes QX contract identity with non-zero first byte", () => {
    // QX contract address starts with B, so first byte should be non-zero
    const qxIdentity = "BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID";
    const bytes = identityToBytes(qxIdentity);
    expect(bytes[0]).toBe(1); // 'B' - 'A' = 1 in base-26 encoding
    // Remaining bytes of first group should be 0 (all A's)
    for (let i = 1; i < 8; i++) {
      expect(bytes[i]).toBe(0);
    }
  });
});

describe("bytesToIdentity", () => {
  it("converts all-zero bytes to identity starting with all A's", () => {
    const bytes = new Uint8Array(32);
    const identity = bytesToIdentity(bytes);
    expect(identity.length).toBe(60);
    // First 56 chars should be A's, last 4 are checksum placeholder
    expect(identity).toBe("A".repeat(60));
  });

  it("rejects wrong byte length", () => {
    expect(() => bytesToIdentity(new Uint8Array(31))).toThrow("32 bytes");
    expect(() => bytesToIdentity(new Uint8Array(33))).toThrow("32 bytes");
  });
});

describe("identity round-trip", () => {
  it("round-trips all-A identity", () => {
    const original = "A".repeat(60);
    const bytes = identityToBytes(original);
    const recovered = bytesToIdentity(bytes);
    // First 56 chars should match (last 4 are checksum, placeholder on decode)
    expect(recovered.substring(0, 56)).toBe(original.substring(0, 56));
  });

  it("round-trips QX contract identity (first 56 chars)", () => {
    const original = "BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID";
    const bytes = identityToBytes(original);
    const recovered = bytesToIdentity(bytes);
    // First 56 chars encode the public key — these must match
    expect(recovered.substring(0, 56)).toBe(original.substring(0, 56));
  });

  it("round-trips bytes → identity → bytes for non-trivial keys", () => {
    // Start from known bytes (any 32-byte key) and verify round-trip.
    // Not all 60-char strings are valid identities (26^14 > 2^64),
    // but all 32-byte keys produce valid identities.
    const bytes = new Uint8Array(32);
    bytes[0] = 42;
    bytes[7] = 255;
    bytes[15] = 128;
    bytes[24] = 1;
    bytes[31] = 200;

    const identity = bytesToIdentity(bytes);
    expect(identity.length).toBe(60);
    expect(/^[A-Z]{60}$/.test(identity)).toBe(true);

    const recovered = identityToBytes(identity);
    // Compare first 32 bytes (the public key portion)
    expect(recovered).toEqual(bytes);
  });
});

describe("assetNameToBytes", () => {
  it("encodes CFB correctly", () => {
    const bytes = assetNameToBytes("CFB");
    expect(bytes.length).toBe(8);
    expect(bytes[0]).toBe(0x43); // 'C'
    expect(bytes[1]).toBe(0x46); // 'F'
    expect(bytes[2]).toBe(0x42); // 'B'
    expect(bytes[3]).toBe(0);
    expect(bytes[4]).toBe(0);
    expect(bytes[5]).toBe(0);
    expect(bytes[6]).toBe(0);
    expect(bytes[7]).toBe(0);
  });

  it("encodes QWALLET correctly", () => {
    const bytes = assetNameToBytes("QWALLET");
    expect(bytes.length).toBe(8);
    expect(bytes[0]).toBe("Q".charCodeAt(0));
    expect(bytes[6]).toBe("T".charCodeAt(0));
    expect(bytes[7]).toBe(0);
  });

  it("rejects empty name", () => {
    expect(() => assetNameToBytes("")).toThrow("1-7 characters");
  });

  it("rejects name longer than 7 characters", () => {
    expect(() => assetNameToBytes("LONGNAME")).toThrow("1-7 characters");
  });
});

describe("bytesToAssetName", () => {
  it("decodes CFB from bytes", () => {
    const bytes = new Uint8Array([0x43, 0x46, 0x42, 0, 0, 0, 0, 0]);
    expect(bytesToAssetName(bytes)).toBe("CFB");
  });

  it("handles full 7-char name", () => {
    const bytes = assetNameToBytes("QWALLET");
    expect(bytesToAssetName(bytes)).toBe("QWALLET");
  });
});

describe("asset name round-trip", () => {
  it("round-trips various names", () => {
    for (const name of ["CFB", "RANDOM", "QX", "QWALLET", "MLM", "A"]) {
      const bytes = assetNameToBytes(name);
      expect(bytesToAssetName(bytes)).toBe(name);
    }
  });
});
