/**
 * Shared token registry fetch helper.
 *
 * Used by both the get_token_list tool and token/orderbook resources.
 */

import { externalGet } from "./qubic-rpc.js";

const TOKEN_LIST_URL = "https://static.qubic.org/v1/general/data/tokens.min.json";

export interface QubicToken {
  name?: string;
  issuer?: string;
  website?: string;
}

interface TokenRegistryResponse {
  tokens?: QubicToken[];
}

/**
 * Fetch the full token list from the Qubic static registry.
 */
export async function fetchTokenList(): Promise<QubicToken[]> {
  const response = (await externalGet(TOKEN_LIST_URL)) as TokenRegistryResponse;
  return Array.isArray(response) ? (response as QubicToken[]) : (response.tokens ?? []);
}
