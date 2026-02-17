# qubic-mcp

MCP server for the Qubic cryptocurrency. Gives AI assistants native access to the Qubic blockchain.

## Project Structure

```
src/
  index.ts                  — Entry point, creates McpServer and connects stdio transport
  config/index.ts           — Configuration from environment variables
  tools/                    — One file per MCP tool (get-balance.ts, get-tick-info.ts, etc.)
  utils/qubic-rpc.ts        — HTTP client for Qubic RPC API (rpcGet, rpcPost, externalGet)
  utils/qubic-identity.ts   — Binary encoding: identity ↔ bytes, asset name ↔ bytes
  utils/validation.ts       — Input validation helpers
  utils/format.ts           — Number/QU/timestamp formatting
  utils/wallet-store.ts     — Local wallet storage (~/.qubic-mcp/wallets.json)
  utils/network-store.ts    — Network profile storage (~/.qubic-mcp/networks.json)
tests/                      — Vitest test files (mirrors src/ structure)
tickets/                    — Kanban-style ticket tracking (backlog/, in-progress/, done/)
```

## Key Technical Details

- **MCP SDK**: `@modelcontextprotocol/sdk` v1.x with `McpServer` class
- **Transport**: stdio (baseline), Streamable HTTP planned for Phase 5
- **Qubic RPC**: `https://rpc.qubic.org` (mainnet), `https://testnet-rpc.qubic.org` (testnet)
- **Qubic addresses**: 60 uppercase letters (A-Z), derived from 55-char lowercase seed via K12 hash + SchnorrQ
- **TypeScript**: Strict mode, ESM (`"type": "module"`), Node16 module resolution
- **Testing**: Vitest, with `npm run inspect` for MCP Inspector testing

## Commands

- `npm run build` — Compile TypeScript
- `npm test` — Run tests
- `npm run lint` — ESLint
- `npm run inspect` — Test with MCP Inspector

## Security Rules

- NEVER store, log, or persist private keys or seeds
- All inputs validated with Zod schemas
- No telemetry or analytics
- Sanitize all log output

## Qubic Smart Contracts

- QX (index 1) — Decentralized exchange
- Quottery (index 2) — Betting/oracle platform
- Random (index 3) — Random number generation
- QUTIL (index 4) — Utilities
- MLM (index 5) — Multiplayer game

## QX SC Binary Protocol

QX orderbook queries use `POST /v1/querySmartContract` with binary request/response data.

**Request (48 bytes):** `issuerPubKey[32] + assetName[8] + offset[8]`
- `inputType: 2` = AssetAskOrders, `3` = AssetBidOrders
- Asset names are raw ASCII packed into uint64 (e.g., "CFB" → [0x43, 0x46, 0x42, 0, 0, 0, 0, 0])

**Response:** Array of 256 orders, each 48 bytes: `entityPubKey[32] + price[8] + shares[8]`
- All integers are little-endian int64
- Empty orders have shares=0 and should be filtered out

Identity encoding (qubic-identity.ts): 60-char identity ↔ 32-byte public key via base-26 arithmetic over 4 groups of 14 characters, each mapping to a little-endian uint64. Last 4 chars are a checksum.

## Static Data APIs

- Token registry: `https://static.qubic.org/v1/general/data/tokens.min.json`
