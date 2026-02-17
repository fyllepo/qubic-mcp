import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { QubicMcpConfig } from "../config/index.js";
import { externalGet, queryGet } from "../utils/qubic-rpc.js";
import { getField } from "../utils/format.js";

interface CoinGeckoPrice {
  usd: number;
  usd_market_cap: number;
  usd_24h_change: number;
  usd_24h_vol: number;
}

interface QubicStats {
  price: number;
  marketCap: string;
  circulatingSupply: string;
  burnedQus: string;
}

interface CryptoComparePrice {
  USD: number;
}

interface PriceSources {
  coinGecko?: CoinGeckoPrice;
  qubicApi?: QubicStats;
  cryptoCompare?: CryptoComparePrice;
}

function formatUsd(value: number): string {
  if (value < 0.001) {
    return `$${String(value)}`;
  }
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatMarketCap(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`;
  }
  return `$${num.toLocaleString("en-US")}`;
}

function formatPriceComparison(sources: PriceSources): string {
  const lines = [`QUBIC Price Comparison`, `══════════════════════`, ``];

  // Price comparison table
  lines.push(`Prices:`);

  if (sources.coinGecko) {
    const cg = sources.coinGecko;
    const arrow = cg.usd_24h_change >= 0 ? "▲" : "▼";
    const sign = cg.usd_24h_change >= 0 ? "+" : "";
    lines.push(
      `  CoinGecko:      ${formatUsd(cg.usd)}  ${arrow} ${sign}${cg.usd_24h_change.toFixed(2)}% 24h`,
    );
  }

  if (sources.qubicApi) {
    lines.push(`  Qubic Official: ${formatUsd(sources.qubicApi.price)}`);
  }

  if (sources.cryptoCompare) {
    lines.push(`  CryptoCompare:  ${formatUsd(sources.cryptoCompare.USD)}`);
  }

  // Market data
  lines.push(``);
  lines.push(`Market Data:`);

  if (sources.coinGecko) {
    lines.push(`  Market Cap (CoinGecko):  ${formatMarketCap(sources.coinGecko.usd_market_cap)}`);
  }

  if (sources.qubicApi) {
    lines.push(`  Market Cap (Qubic):      ${formatMarketCap(sources.qubicApi.marketCap)}`);
  }

  if (sources.coinGecko?.usd_24h_vol) {
    lines.push(`  24h Volume:              ${formatMarketCap(sources.coinGecko.usd_24h_vol)}`);
  }

  // Note about differences
  if (sources.coinGecko && sources.qubicApi) {
    const cgMc = sources.coinGecko.usd_market_cap;
    const qMc = Number(sources.qubicApi.marketCap);
    if (Math.abs(cgMc - qMc) / cgMc > 0.1) {
      lines.push(``);
      lines.push(
        `Note: Market cap differs between sources due to different circulating supply calculations.`,
      );
    }
  }

  const sourceCount = [sources.coinGecko, sources.qubicApi, sources.cryptoCompare].filter(
    Boolean,
  ).length;
  lines.push(``);
  lines.push(`Sources: ${String(sourceCount)} of 3 responding`);

  return lines.join("\n");
}

async function fetchCoinGecko(): Promise<CoinGeckoPrice | undefined> {
  try {
    const data = await externalGet(
      "https://api.coingecko.com/api/v3/simple/price?ids=qubic-network&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true",
    );
    return getField(data, "qubic-network") as CoinGeckoPrice | undefined;
  } catch {
    return undefined;
  }
}

async function fetchQubicStats(config: QubicMcpConfig): Promise<QubicStats | undefined> {
  try {
    const data = await queryGet(config, "/v1/latest-stats");
    return getField(data, "data") as QubicStats | undefined;
  } catch {
    return undefined;
  }
}

async function fetchCryptoCompare(): Promise<CryptoComparePrice | undefined> {
  try {
    const data = await externalGet(
      "https://min-api.cryptocompare.com/data/price?fsym=QUBIC&tsyms=USD",
    );
    const price = data as CryptoComparePrice | undefined;
    if (price?.USD !== undefined) {
      return price;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function registerTokenPriceTool(server: McpServer, config: QubicMcpConfig): void {
  server.tool(
    "get_token_price",
    "Get the current QUBIC token price compared across multiple sources (CoinGecko, Qubic Official API, CryptoCompare). Shows price, 24h change, market cap, and volume with source-by-source comparison.",
    {},
    async () => {
      const [coinGecko, qubicApi, cryptoCompare] = await Promise.all([
        fetchCoinGecko(),
        fetchQubicStats(config),
        fetchCryptoCompare(),
      ]);

      const sources: PriceSources = { coinGecko, qubicApi, cryptoCompare };
      const anySource = coinGecko ?? qubicApi ?? cryptoCompare;

      if (!anySource) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Unable to fetch QUBIC price from any source. All APIs may be temporarily unavailable.",
            },
          ],
          isError: true,
        };
      }

      return {
        content: [{ type: "text" as const, text: formatPriceComparison(sources) }],
      };
    },
  );
}
