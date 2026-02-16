# qubic-mcp

MCP server for the Qubic cryptocurrency. Gives AI assistants native access to the Qubic blockchain.

## Project Structure

```
src/
  index.ts              — Entry point, creates McpServer and connects stdio transport
  config/index.ts       — Configuration from environment variables
  tools/                — One file per MCP tool (get-balance.ts, get-tick-info.ts, etc.)
  utils/qubic-rpc.ts    — HTTP client for Qubic RPC API
  utils/validation.ts   — Input validation helpers
tests/                  — Vitest test files
tickets/                — Kanban-style ticket tracking (backlog/, in-progress/, done/)
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
