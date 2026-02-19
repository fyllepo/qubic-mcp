import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface SavedNetwork {
  name: string;
  rpcUrl: string;
  apiUrl: string;
  addedAt: string;
}

interface NetworkStoreData {
  activeNetwork: string; // "mainnet", "testnet", or a saved custom name
  networks: SavedNetwork[];
}

function getStoreDir(): string {
  return join(homedir(), ".qubic-mcp");
}

function getStoreFile(): string {
  return join(getStoreDir(), "networks.json");
}

/** Built-in network presets that are always available. */
const BUILTIN_NETWORKS: Record<string, { rpcUrl: string; apiUrl: string }> = {
  mainnet: {
    rpcUrl: "https://rpc.qubic.org",
    apiUrl: "https://api.qubic.org",
  },
  testnet: {
    rpcUrl: "https://testnet-rpc.qubic.org",
    apiUrl: "https://testnet-api.qubic.org",
  },
};

function ensureStoreDir(): void {
  try {
    mkdirSync(getStoreDir(), { recursive: true });
  } catch {
    // directory already exists
  }
}

function readStore(): NetworkStoreData {
  try {
    const raw = readFileSync(getStoreFile(), "utf-8");
    return JSON.parse(raw) as NetworkStoreData;
  } catch {
    return { activeNetwork: "mainnet", networks: [] };
  }
}

function writeStore(data: NetworkStoreData): void {
  ensureStoreDir();
  writeFileSync(getStoreFile(), JSON.stringify(data, null, 2), "utf-8");
}

export function getActiveNetworkName(): string {
  return readStore().activeNetwork;
}

/**
 * Resolve a network name to its RPC/API URLs.
 * Checks built-in presets first, then saved custom networks.
 */
export function resolveNetwork(
  name: string,
): { rpcUrl: string; apiUrl: string; label: string } | { error: string } {
  const normalized = name.trim().toLowerCase();

  // Check built-in presets
  if (normalized in BUILTIN_NETWORKS) {
    const preset = BUILTIN_NETWORKS[normalized] as { rpcUrl: string; apiUrl: string };
    return { ...preset, label: normalized };
  }

  // Check saved custom networks
  const store = readStore();
  const saved = store.networks.find((n) => n.name.toLowerCase() === normalized);
  if (saved) {
    return { rpcUrl: saved.rpcUrl, apiUrl: saved.apiUrl, label: saved.name };
  }

  return {
    error: `Network "${name}" not found. Use list_networks to see available networks.`,
  };
}

/**
 * Get the currently active network's URLs.
 */
export function getActiveNetwork(): {
  name: string;
  rpcUrl: string;
  apiUrl: string;
} {
  const activeName = getActiveNetworkName();
  const resolved = resolveNetwork(activeName);

  if ("error" in resolved) {
    // Fallback to mainnet if the saved active network was removed
    const mainnet = BUILTIN_NETWORKS["mainnet"] as { rpcUrl: string; apiUrl: string };
    return { name: "mainnet", ...mainnet };
  }

  return { name: activeName, rpcUrl: resolved.rpcUrl, apiUrl: resolved.apiUrl };
}

export function switchNetwork(
  name: string,
): { rpcUrl: string; apiUrl: string; label: string } | { error: string } {
  const resolved = resolveNetwork(name);
  if ("error" in resolved) {
    return resolved;
  }

  const store = readStore();
  store.activeNetwork = name.trim().toLowerCase();
  writeStore(store);

  return resolved;
}

export function listNetworks(): {
  active: string;
  builtIn: string[];
  custom: SavedNetwork[];
} {
  const store = readStore();
  return {
    active: store.activeNetwork,
    builtIn: Object.keys(BUILTIN_NETWORKS),
    custom: store.networks,
  };
}

export function saveNetwork(
  name: string,
  rpcUrl: string,
  apiUrl?: string,
): { success: true } | { error: string } {
  const trimmedName = name.trim().toLowerCase();

  if (trimmedName.length === 0) {
    return { error: "Network name cannot be empty." };
  }

  if (trimmedName.length > 50) {
    return { error: "Network name must be 50 characters or less." };
  }

  if (trimmedName in BUILTIN_NETWORKS) {
    return {
      error: `Cannot overwrite built-in network "${trimmedName}". Choose a different name.`,
    };
  }

  // Basic URL validation
  try {
    new URL(rpcUrl);
  } catch {
    return { error: `Invalid RPC URL: "${rpcUrl}". Must be a valid URL.` };
  }

  if (apiUrl) {
    try {
      new URL(apiUrl);
    } catch {
      return { error: `Invalid API URL: "${apiUrl}". Must be a valid URL.` };
    }
  }

  const store = readStore();
  const existingIdx = store.networks.findIndex((n) => n.name.toLowerCase() === trimmedName);

  const entry: SavedNetwork = {
    name: trimmedName,
    rpcUrl: rpcUrl.replace(/\/+$/, ""), // strip trailing slashes
    apiUrl: (apiUrl ?? rpcUrl).replace(/\/+$/, ""),
    addedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    store.networks[existingIdx] = entry;
  } else {
    store.networks.push(entry);
  }

  writeStore(store);
  return { success: true };
}

export function removeNetwork(name: string): { success: true } | { error: string } {
  const normalized = name.trim().toLowerCase();

  if (normalized in BUILTIN_NETWORKS) {
    return { error: `Cannot remove built-in network "${normalized}".` };
  }

  const store = readStore();
  const idx = store.networks.findIndex((n) => n.name.toLowerCase() === normalized);

  if (idx < 0) {
    return { error: `No custom network found with name "${name}".` };
  }

  store.networks.splice(idx, 1);

  // If the removed network was active, switch back to mainnet
  if (store.activeNetwork === normalized) {
    store.activeNetwork = "mainnet";
  }

  writeStore(store);
  return { success: true };
}
