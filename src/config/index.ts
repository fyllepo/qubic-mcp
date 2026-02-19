import { getActiveNetwork } from "../utils/network-store.js";

export type QubicNetwork = "mainnet" | "testnet" | "custom";

export interface QubicMcpConfig {
  network: QubicNetwork;
  networkLabel: string;
  rpcUrl: string;
  apiUrl: string;
}

/**
 * Build the initial config.
 *
 * Priority:
 *   1. QUBIC_RPC_URL / QUBIC_API_URL env vars (explicit override)
 *   2. Persisted active network from ~/.qubic-mcp/networks.json
 *   3. Mainnet defaults
 */
export function getConfig(): QubicMcpConfig {
  // If the user set explicit env vars, honour them (backwards-compatible)
  const envRpc = process.env["QUBIC_RPC_URL"];
  if (envRpc) {
    return {
      network: "custom",
      networkLabel: process.env["QUBIC_NETWORK_LABEL"] ?? `custom (${envRpc})`,
      rpcUrl: envRpc,
      apiUrl: process.env["QUBIC_API_URL"] ?? envRpc,
    };
  }

  // Otherwise, use the persisted active network (defaults to mainnet)
  const active = getActiveNetwork();
  const label = active.name;

  return {
    network: label === "mainnet" || label === "testnet" ? label : "custom",
    networkLabel: label,
    rpcUrl: active.rpcUrl,
    apiUrl: active.apiUrl,
  };
}
