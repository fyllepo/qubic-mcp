import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { isValidQubicAddress } from "./validation.js";

export interface SavedWallet {
  name: string;
  address: string;
  addedAt: string;
}

interface WalletStoreData {
  wallets: SavedWallet[];
}

const STORE_DIR = join(homedir(), ".qubic-mcp");
const STORE_FILE = join(STORE_DIR, "wallets.json");

function ensureStoreDir(): void {
  try {
    mkdirSync(STORE_DIR, { recursive: true });
  } catch {
    // directory already exists
  }
}

function readStore(): WalletStoreData {
  try {
    const raw = readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(raw) as WalletStoreData;
  } catch {
    return { wallets: [] };
  }
}

function writeStore(data: WalletStoreData): void {
  ensureStoreDir();
  writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function listWallets(): SavedWallet[] {
  return readStore().wallets;
}

export function getWalletByName(name: string): SavedWallet | undefined {
  const normalized = name.trim().toLowerCase();
  return readStore().wallets.find((w) => w.name.toLowerCase() === normalized);
}

export function resolveAddress(input: string): { address: string; label: string } | { error: string } {
  const trimmed = input.trim();

  // If it looks like a valid address, use it directly
  if (isValidQubicAddress(trimmed.toUpperCase())) {
    return { address: trimmed.toUpperCase(), label: trimmed.toUpperCase() };
  }

  // Otherwise try to resolve as a wallet name
  const wallet = getWalletByName(trimmed);
  if (wallet) {
    return { address: wallet.address, label: `${wallet.name} (${wallet.address})` };
  }

  return {
    error: `"${input}" is not a valid Qubic address (60 uppercase letters) and no saved wallet found with that name. Use list_wallets to see saved wallets.`,
  };
}

export function saveWallet(
  name: string,
  address: string,
): { success: true } | { error: string } {
  const trimmedName = name.trim();
  const trimmedAddress = address.trim().toUpperCase();

  if (trimmedName.length === 0) {
    return { error: "Wallet name cannot be empty." };
  }

  if (trimmedName.length > 50) {
    return { error: "Wallet name must be 50 characters or less." };
  }

  if (!isValidQubicAddress(trimmedAddress)) {
    return {
      error: `Invalid Qubic address: "${address}". Expected 60 uppercase letters (A-Z).`,
    };
  }

  const store = readStore();

  // Check for duplicate name
  const existingByName = store.wallets.findIndex(
    (w) => w.name.toLowerCase() === trimmedName.toLowerCase(),
  );
  if (existingByName >= 0) {
    // Update existing
    store.wallets[existingByName] = {
      name: trimmedName,
      address: trimmedAddress,
      addedAt: new Date().toISOString(),
    };
  } else {
    store.wallets.push({
      name: trimmedName,
      address: trimmedAddress,
      addedAt: new Date().toISOString(),
    });
  }

  writeStore(store);
  return { success: true };
}

export function removeWallet(name: string): { success: true } | { error: string } {
  const normalized = name.trim().toLowerCase();
  const store = readStore();
  const idx = store.wallets.findIndex((w) => w.name.toLowerCase() === normalized);

  if (idx < 0) {
    return { error: `No wallet found with name "${name}".` };
  }

  store.wallets.splice(idx, 1);
  writeStore(store);
  return { success: true };
}
