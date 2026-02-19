/**
 * Local persistence for custom smart contract definitions.
 *
 * Stores contract schemas at ~/.qubic-mcp/contracts.json so users can
 * register unknown/custom contracts and query them with human-readable
 * encoding and decoding.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { validateFieldDef, type ScFieldDef } from "./sc-codec.js";

// ── Types ────────────────────────────────────────────────────────

export interface ContractFunctionDef {
  name: string;
  inputType: number;
  input: ScFieldDef[];
  output: ScFieldDef[];
}

export interface SavedContract {
  name: string;
  contractIndex: number;
  description?: string;
  identity?: string;
  functions: ContractFunctionDef[];
  addedAt: string;
}

interface ContractStoreData {
  contracts: SavedContract[];
}

// ── File I/O ─────────────────────────────────────────────────────

function getStoreDir(): string {
  return join(homedir(), ".qubic-mcp");
}

function getStoreFile(): string {
  return join(getStoreDir(), "contracts.json");
}

function ensureStoreDir(): void {
  try {
    mkdirSync(getStoreDir(), { recursive: true });
  } catch {
    // directory already exists
  }
}

function readStore(): ContractStoreData {
  try {
    const raw = readFileSync(getStoreFile(), "utf-8");
    return JSON.parse(raw) as ContractStoreData;
  } catch {
    return { contracts: [] };
  }
}

function writeStore(data: ContractStoreData): void {
  ensureStoreDir();
  writeFileSync(getStoreFile(), JSON.stringify(data, null, 2), "utf-8");
}

// ── Validation ───────────────────────────────────────────────────

function validateFunction(fn: ContractFunctionDef, index: number): string | null {
  if (!fn.name || typeof fn.name !== "string") {
    return `Function #${String(index)}: missing or invalid "name"`;
  }
  if (typeof fn.inputType !== "number" || !Number.isInteger(fn.inputType) || fn.inputType < 0) {
    return `Function "${fn.name}": "inputType" must be a non-negative integer`;
  }
  if (!Array.isArray(fn.input)) {
    return `Function "${fn.name}": "input" must be an array`;
  }
  if (!Array.isArray(fn.output)) {
    return `Function "${fn.name}": "output" must be an array`;
  }

  for (let i = 0; i < fn.input.length; i++) {
    const field = fn.input[i];
    if (!field) continue;
    const err = validateFieldDef(field, i, `Function "${fn.name}" input`);
    if (err) return err;
  }

  for (let i = 0; i < fn.output.length; i++) {
    const field = fn.output[i];
    if (!field) continue;
    const err = validateFieldDef(field, i, `Function "${fn.name}" output`);
    if (err) return err;
  }

  return null;
}

// ── Public API ───────────────────────────────────────────────────

export function saveContract(
  name: string,
  contractIndex: number,
  functions: ContractFunctionDef[],
  description?: string,
  identity?: string,
): { success: true } | { error: string } {
  const trimmedName = name.trim().toLowerCase();

  if (trimmedName.length === 0) {
    return { error: "Contract name cannot be empty." };
  }
  if (trimmedName.length > 50) {
    return { error: "Contract name must be 50 characters or less." };
  }
  if (!Number.isInteger(contractIndex) || contractIndex < 1) {
    return { error: "Contract index must be a positive integer." };
  }
  if (!Array.isArray(functions) || functions.length === 0) {
    return { error: "At least one function definition is required." };
  }

  // Validate each function
  for (let i = 0; i < functions.length; i++) {
    const fn = functions[i];
    if (!fn) continue;
    const err = validateFunction(fn, i);
    if (err) return { error: err };
  }

  // Check for duplicate function names
  const names = new Set<string>();
  for (const fn of functions) {
    const fnKey = fn.name.toLowerCase();
    if (names.has(fnKey)) {
      return { error: `Duplicate function name: "${fn.name}"` };
    }
    names.add(fnKey);
  }

  const store = readStore();
  const existingIdx = store.contracts.findIndex((c) => c.name.toLowerCase() === trimmedName);

  const entry: SavedContract = {
    name: trimmedName,
    contractIndex,
    functions,
    addedAt: new Date().toISOString(),
  };
  if (description) entry.description = description;
  if (identity) entry.identity = identity;

  if (existingIdx >= 0) {
    store.contracts[existingIdx] = entry;
  } else {
    store.contracts.push(entry);
  }

  writeStore(store);
  return { success: true };
}

export function getContract(name: string): SavedContract | { error: string } {
  const normalized = name.trim().toLowerCase();
  const store = readStore();
  const contract = store.contracts.find((c) => c.name.toLowerCase() === normalized);

  if (!contract) {
    return {
      error: `Contract "${name}" not found. Use list_contracts to see registered contracts.`,
    };
  }

  return contract;
}

export function getContractFunction(
  contractName: string,
  functionName: string,
): { contract: SavedContract; fn: ContractFunctionDef } | { error: string } {
  const contract = getContract(contractName);
  if ("error" in contract) return contract;

  const fnNorm = functionName.trim().toLowerCase();
  const fn = contract.functions.find((f) => f.name.toLowerCase() === fnNorm);

  if (!fn) {
    const available = contract.functions.map((f) => f.name).join(", ");
    return {
      error: `Function "${functionName}" not found on contract "${contract.name}". Available: ${available}`,
    };
  }

  return { contract, fn };
}

export function listContracts(): SavedContract[] {
  return readStore().contracts;
}

export function removeContract(name: string): { success: true } | { error: string } {
  const normalized = name.trim().toLowerCase();
  const store = readStore();
  const idx = store.contracts.findIndex((c) => c.name.toLowerCase() === normalized);

  if (idx < 0) {
    return { error: `No contract found with name "${name}".` };
  }

  store.contracts.splice(idx, 1);
  writeStore(store);
  return { success: true };
}
