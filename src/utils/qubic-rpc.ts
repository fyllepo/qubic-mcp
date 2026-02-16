import type { QubicMcpConfig } from "../config/index.js";

/**
 * Makes a GET request to the Qubic RPC API.
 */
export async function rpcGet(config: QubicMcpConfig, path: string): Promise<unknown> {
  const url = `${config.rpcUrl}${path}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Qubic RPC error: ${String(response.status)} ${response.statusText} for ${path}${body ? ` — ${body}` : ""}`,
    );
  }

  return response.json() as Promise<unknown>;
}

/**
 * Makes a POST request to the Qubic RPC API.
 */
export async function rpcPost(
  config: QubicMcpConfig,
  path: string,
  body: unknown,
): Promise<unknown> {
  const url = `${config.rpcUrl}${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const respBody = await response.text().catch(() => "");
    throw new Error(
      `Qubic RPC error: ${String(response.status)} ${response.statusText} for ${path}${respBody ? ` — ${respBody}` : ""}`,
    );
  }

  return response.json() as Promise<unknown>;
}

/**
 * Makes a GET request to the Qubic Query API (api.qubic.org).
 */
export async function queryGet(config: QubicMcpConfig, path: string): Promise<unknown> {
  const url = `${config.apiUrl}${path}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Qubic Query API error: ${String(response.status)} ${response.statusText} for ${path}${body ? ` — ${body}` : ""}`,
    );
  }

  return response.json() as Promise<unknown>;
}

/**
 * Makes a GET request to an arbitrary URL (e.g., CoinGecko).
 */
export async function externalGet(url: string): Promise<unknown> {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${String(response.status)} ${response.statusText} for ${url}`);
  }

  return response.json() as Promise<unknown>;
}
