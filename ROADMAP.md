# Roadmap

> **This roadmap is not set in stone.** It will pivot as the Qubic ecosystem evolves. The goal of this project is to provide ease-of-life functionality for interacting with the Qubic network through AI assistants — it is **not** a wallet replacement. As Qubic matures and new APIs become available, we'll plug into them.

Community input is welcome — suggest features, vote on priorities, or contribute directly.

## Phase 1: Foundation (v0.1.x–v0.2.x) — Complete

Core read-only tools for querying the Qubic network.

- [x] Project setup and CI/CD
- [x] `get_balance` — Query address balances
- [x] `get_tick_info` — Current tick and epoch info
- [x] `get_network_status` — Network health overview
- [x] `get_transaction` — Transaction lookup
- [x] `get_token_price` — Multi-source price comparison (CoinGecko, Qubic API, CryptoCompare)
- [x] `get_transfer_history` — Paginated transfer history
- [x] `get_rich_list` — Top holders ranked by balance
- [x] `convert_qu_usd` — QU/USD converter at live rates
- [x] `validate_address` — Format check and on-chain verification
- [x] `get_explorer_links` — Block explorer links
- [x] `get_mining_phase` — Current MINING/IDLE phase and XMR marathon status
- [x] `save_wallet` / `list_wallets` / `remove_wallet` — Local wallet management
- [x] npm publish with provenance
- [x] MCP Registry listing
- [x] Automated release pipeline

## Phase 2: Smart Contracts (v0.3.x) — In Progress

Read-only access to Qubic's on-chain smart contracts via binary SC query decoding.

- [x] QX DEX orderbook (`get_qx_orderbook`)
- [x] QX asset listings (`get_token_list` via static registry)
- [ ] QX trade history
- [ ] Quottery bet data
- [ ] Smart contract state queries with human-readable output

## Phase 3: Ecosystem & Analytics

Richer data and integrations as Qubic APIs expand.

- [ ] Epoch details and computor performance
- [x] Multi-network support (mainnet/testnet/custom network switching at runtime)
- [ ] MCP Resources for Qubic reference documentation
- [ ] MCP Prompts for common workflows
- [ ] Transaction search and filtering

## Phase 4: Advanced Features

Longer-term possibilities depending on ecosystem maturity.

- [ ] Streamable HTTP transport for remote deployment
- [ ] Docker container distribution
- [ ] Computor monitoring tools
- [ ] Portfolio tracking across multiple addresses

## Ideas We're Watching

These depend on Qubic ecosystem development and community demand:

- **Write operations** — Transaction creation/signing (would require careful security design and explicit user consent)
- **Mining/UPoW pool statistics** — Per-pool hashrates and worker stats (no standard pool API)
- **Payment request links** — Qubic has no payment URI scheme yet
- **SC Development Assistant** — Help write/audit Qubic C++ smart contracts
- **Aigarth Integration** — Leverage Qubic's AI subsystem
- **Oracle Data** — Query oracle data feeds when available

## Contributing to the Roadmap

Have an idea? Open a [feature request issue](https://github.com/fyllepo/qubic-mcp/issues/new?template=feature_request.yml) or start a [discussion](https://github.com/fyllepo/qubic-mcp/discussions).
