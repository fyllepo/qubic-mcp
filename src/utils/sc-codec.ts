/**
 * Generic binary codec for Qubic smart contract field schemas.
 *
 * Encodes named input values into binary request data and decodes
 * binary response data into named output values, driven by a field
 * schema that describes the layout of each struct.
 */

import { identityToBytes, bytesToIdentity } from "./qubic-identity.js";

// ── Field schema types ────────────────────────────────────────────

export type ScFieldType =
  | "uint8"
  | "uint16"
  | "uint32"
  | "uint64"
  | "int8"
  | "int16"
  | "int32"
  | "int64"
  | "identity"
  | "padding";

export interface ScFieldDef {
  /** Field name (used as key in input/output objects). */
  name: string;
  /** Data type. */
  type: ScFieldType;
  /** Byte size — required for "padding", ignored for fixed-size types. */
  size?: number;
  /** Array element count (default 1). */
  count?: number;
  /** Optional value → human-readable label mapping (applied on decode). */
  enum?: Record<string, string>;
}

// ── Size helpers ──────────────────────────────────────────────────

const FIXED_SIZES: Record<ScFieldType, number> = {
  uint8: 1,
  uint16: 2,
  uint32: 4,
  uint64: 8,
  int8: 1,
  int16: 2,
  int32: 4,
  int64: 8,
  identity: 32,
  padding: 0,
};

/** Byte size of a single element of the given field. */
export function fieldByteSize(field: ScFieldDef): number {
  if (field.type === "padding") {
    return field.size ?? 0;
  }
  return FIXED_SIZES[field.type];
}

/** Total byte size of a full field (element size × count). */
function fullFieldSize(field: ScFieldDef): number {
  return fieldByteSize(field) * (field.count ?? 1);
}

/** Total byte size of an entire field schema. */
export function totalByteSize(fields: ScFieldDef[]): number {
  return fields.reduce((sum, f) => sum + fullFieldSize(f), 0);
}

// ── Encoding ─────────────────────────────────────────────────────

function writeOne(
  view: DataView,
  buffer: Uint8Array,
  offset: number,
  type: ScFieldType,
  value: unknown,
): void {
  switch (type) {
    case "uint8":
      view.setUint8(offset, Number(value ?? 0));
      break;
    case "uint16":
      view.setUint16(offset, Number(value ?? 0), true);
      break;
    case "uint32":
      view.setUint32(offset, Number(value ?? 0), true);
      break;
    case "uint64":
      view.setBigUint64(offset, BigInt((value as string | number) ?? 0), true);
      break;
    case "int8":
      view.setInt8(offset, Number(value ?? 0));
      break;
    case "int16":
      view.setInt16(offset, Number(value ?? 0), true);
      break;
    case "int32":
      view.setInt32(offset, Number(value ?? 0), true);
      break;
    case "int64":
      view.setBigInt64(offset, BigInt((value as string | number) ?? 0), true);
      break;
    case "identity": {
      const idStr = typeof value === "string" && value.length === 60 ? value : "A".repeat(60);
      const bytes = identityToBytes(idStr);
      buffer.set(bytes, offset);
      break;
    }
    case "padding":
      // Already zeroed
      break;
  }
}

/**
 * Encode named values into a binary buffer according to the field schema.
 *
 * Values are looked up by field name. Missing values are zero-filled.
 * Array fields (count > 1) expect an array value.
 */
export function encodeFields(fields: ScFieldDef[], values: Record<string, unknown>): Uint8Array {
  const size = totalByteSize(fields);
  const buffer = new Uint8Array(size);
  const view = new DataView(buffer.buffer);
  let offset = 0;

  for (const field of fields) {
    const count = field.count ?? 1;
    const elemSize = fieldByteSize(field);

    if (field.type === "padding") {
      offset += elemSize * count;
      continue;
    }

    const raw = values[field.name];

    if (count === 1) {
      writeOne(view, buffer, offset, field.type, raw);
      offset += elemSize;
    } else {
      const arr = Array.isArray(raw) ? raw : [];
      for (let i = 0; i < count; i++) {
        writeOne(view, buffer, offset, field.type, arr[i]);
        offset += elemSize;
      }
    }
  }

  return buffer;
}

// ── Decoding ─────────────────────────────────────────────────────

function readOne(view: DataView, buffer: Uint8Array, offset: number, type: ScFieldType): unknown {
  switch (type) {
    case "uint8":
      return view.getUint8(offset);
    case "uint16":
      return view.getUint16(offset, true);
    case "uint32":
      return view.getUint32(offset, true);
    case "uint64":
      return view.getBigUint64(offset, true).toString();
    case "int8":
      return view.getInt8(offset);
    case "int16":
      return view.getInt16(offset, true);
    case "int32":
      return view.getInt32(offset, true);
    case "int64":
      return view.getBigInt64(offset, true).toString();
    case "identity": {
      const slice = buffer.slice(offset, offset + 32);
      return bytesToIdentity(slice);
    }
    case "padding":
      return undefined;
  }
}

function formatValue(raw: unknown, field: ScFieldDef): string {
  if (raw === undefined || raw === null) return "";

  // Apply enum label if available
  if (field.enum) {
    const label = field.enum[String(raw)];
    if (label) return `${label} (${String(raw)})`;
  }

  // Format large numbers with commas
  if (field.type === "uint64" || field.type === "int64") {
    try {
      return BigInt(raw as string).toLocaleString("en-US");
    } catch {
      return String(raw);
    }
  }

  return String(raw);
}

/**
 * Decode a binary buffer into named values according to the field schema.
 *
 * Returns an array of { name, raw, display } for each non-padding field.
 * Array fields (count > 1) produce a single entry whose raw value is an array.
 */
export function decodeFields(
  fields: ScFieldDef[],
  buffer: Uint8Array,
): Array<{ name: string; raw: unknown; display: string }> {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const results: Array<{ name: string; raw: unknown; display: string }> = [];
  let offset = 0;

  for (const field of fields) {
    const count = field.count ?? 1;
    const elemSize = fieldByteSize(field);

    if (field.type === "padding") {
      offset += elemSize * count;
      continue;
    }

    if (count === 1) {
      const raw = readOne(view, buffer, offset, field.type);
      results.push({
        name: field.name,
        raw,
        display: formatValue(raw, field),
      });
      offset += elemSize;
    } else {
      const rawArr: unknown[] = [];
      const displayArr: string[] = [];
      for (let i = 0; i < count; i++) {
        const raw = readOne(view, buffer, offset, field.type);
        rawArr.push(raw);
        displayArr.push(formatValue(raw, field));
        offset += elemSize;
      }
      results.push({
        name: field.name,
        raw: rawArr,
        display: displayArr.join(", "),
      });
    }
  }

  return results;
}

// ── Validation ───────────────────────────────────────────────────

const VALID_TYPES = new Set<string>(Object.keys(FIXED_SIZES));

/** Validate a field schema, returning an error message or null if valid. */
export function validateFieldDef(field: ScFieldDef, index: number, context: string): string | null {
  if (!field.name || typeof field.name !== "string") {
    return `${context} field #${String(index)}: missing or invalid "name"`;
  }
  if (!VALID_TYPES.has(field.type)) {
    return `${context} field "${field.name}": unknown type "${String(field.type)}". Valid types: ${[...VALID_TYPES].join(", ")}`;
  }
  if (field.type === "padding" && (!field.size || field.size < 1)) {
    return `${context} field "${field.name}": padding type requires "size" > 0`;
  }
  if (field.count !== undefined && (field.count < 1 || !Number.isInteger(field.count))) {
    return `${context} field "${field.name}": "count" must be a positive integer`;
  }
  return null;
}
