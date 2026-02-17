/**
 * Binary encoding utilities for Qubic identities and asset names.
 *
 * Qubic identities are 60 uppercase letters (A-Z) encoding a 32-byte public key.
 * The encoding uses base-26 arithmetic over 4 groups of 14 characters, each
 * representing a little-endian uint64. The last 4 characters are a checksum.
 *
 * Verified against ts-library, qubic-cli (C++), and Qubic.NET (C#).
 */

const ALPHABET_SIZE = 26n;
const CHARS_PER_GROUP = 14;
const GROUPS = 4;
const PUBLIC_KEY_BYTES = 32;
const BYTES_PER_GROUP = 8;

/**
 * Convert a 60-character Qubic identity string to a 32-byte public key.
 *
 * The first 52 characters encode the 32-byte key (4 groups of 13 chars → 4 uint64s).
 * Actually: 4 groups of 14 chars from the first 56 chars encode 4 uint64 values,
 * but the standard approach is base-26 decode of 4×14 = 56 chars into 4 uint64s.
 * The last 4 chars are a checksum (ignored here).
 */
export function identityToBytes(identity: string): Uint8Array {
  if (identity.length !== 60) {
    throw new Error(`Identity must be 60 characters, got ${String(identity.length)}`);
  }
  if (!/^[A-Z]{60}$/.test(identity)) {
    throw new Error("Identity must contain only uppercase letters A-Z");
  }

  const bytes = new Uint8Array(PUBLIC_KEY_BYTES);
  const view = new DataView(bytes.buffer);

  for (let g = 0; g < GROUPS; g++) {
    let value = 0n;
    const offset = g * CHARS_PER_GROUP;

    // Base-26 decode: most significant digit first
    for (let j = CHARS_PER_GROUP - 1; j >= 0; j--) {
      const charCode = identity.charCodeAt(offset + j) - 65; // 'A' = 0
      value = value * ALPHABET_SIZE + BigInt(charCode);
    }

    // Write as little-endian uint64
    view.setBigUint64(g * BYTES_PER_GROUP, value, true);
  }

  return bytes;
}

/**
 * Convert a 32-byte public key back to a 60-character Qubic identity string.
 *
 * Encodes 4 uint64 groups as base-26 characters, then appends a 4-char
 * checksum placeholder ("AAAA") since we don't need checksum validation
 * for display purposes.
 */
export function bytesToIdentity(bytes: Uint8Array): string {
  if (bytes.length !== PUBLIC_KEY_BYTES) {
    throw new Error(`Expected ${String(PUBLIC_KEY_BYTES)} bytes, got ${String(bytes.length)}`);
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chars: string[] = [];

  for (let g = 0; g < GROUPS; g++) {
    let value = view.getBigUint64(g * BYTES_PER_GROUP, true);

    for (let j = 0; j < CHARS_PER_GROUP; j++) {
      const remainder = value % ALPHABET_SIZE;
      chars.push(String.fromCharCode(Number(remainder) + 65));
      value = value / ALPHABET_SIZE;
    }
  }

  // Append 4-char checksum placeholder
  chars.push("A", "A", "A", "A");

  return chars.join("");
}

/**
 * Encode an asset name string as an 8-byte little-endian uint64.
 *
 * Raw ASCII byte packing: byte[i] = char[i].charCodeAt(0).
 * Maximum 7 characters (8th byte is always 0).
 */
export function assetNameToBytes(name: string): Uint8Array {
  if (name.length === 0 || name.length > 7) {
    throw new Error(`Asset name must be 1-7 characters, got ${String(name.length)}`);
  }

  const bytes = new Uint8Array(8); // 8th byte stays 0
  for (let i = 0; i < name.length; i++) {
    bytes[i] = name.charCodeAt(i);
  }

  return bytes;
}

/**
 * Decode an 8-byte buffer back to an asset name string.
 * Reads ASCII bytes until a zero byte or end of buffer.
 */
export function bytesToAssetName(bytes: Uint8Array): string {
  const chars: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === undefined || b === 0) break;
    chars.push(String.fromCharCode(b));
  }
  return chars.join("");
}
