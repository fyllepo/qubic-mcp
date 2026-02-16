# Roadmap

This roadmap outlines planned features and future direction for qubic-mcp. It's a living document — community input is welcome.

## Phase 1: Foundation (v0.1.0) — Current

Core read-only tools for querying the Qubic network.

- [x] Project setup and CI/CD
- [ ] `get_balance` — Query address balances
- [ ] `get_tick_info` — Current tick and epoch info
- [ ] `get_network_status` — Network health overview
- [ ] `get_transaction` — Transaction lookup
- [ ] `get_token_price` — QUBIC price data
- [ ] MCP Inspector compatibility
- [ ] Comprehensive test suite
- [ ] npm publish with provenance

## Phase 2: Smart Contracts (v0.2.0)

Read-only access to Qubic's on-chain smart contracts.

- [ ] `query_smart_contract` — Generic SC state query
- [ ] `get_qx_orderbook` — QX DEX orderbook data
- [ ] `get_qx_trades` — Recent QX trade history
- [ ] `get_qx_assets` — List assets on QX
- [ ] `get_quottery_bets` — Quottery active bets
- [ ] `get_quottery_results` — Quottery historical results
- [ ] Smart contract ABI/schema documentation as MCP resources

## Phase 3: Advanced Queries (v0.3.0)

Historical data, analytics, and richer querying.

- [ ] `get_transaction_history` — Paginated tx history for an address
- [ ] `get_epoch_info` — Epoch details and computor performance
- [ ] `get_rich_list` — Top holders
- [ ] `search_transactions` — Search/filter transactions
- [ ] MCP Resources for Qubic documentation (so AI can reference docs)
- [ ] MCP Prompts for common Qubic workflows

## Phase 4: Write Operations (v0.4.0) — Careful

Transaction creation and signing (opt-in, heavily guarded).

- [ ] `create_transaction` — Build unsigned transaction
- [ ] `sign_transaction` — Sign with user-provided seed (in-memory only)
- [ ] `broadcast_transaction` — Submit signed tx to network
- [ ] `send_qubic` — High-level send flow
- [ ] `transfer_asset` — QX asset transfer
- [ ] Confirmation prompts and safety checks for all write operations
- [ ] Explicit user consent flow before any on-chain action

## Phase 5: Ecosystem Integrations (v0.5.0+)

Broader Qubic ecosystem support and advanced features.

- [ ] Multi-network support (mainnet/testnet toggle)
- [ ] Computor monitoring tools
- [ ] Mining/UPoW statistics
- [ ] Integration with Qubic wallet formats (vault files)
- [ ] Streamable HTTP transport for remote deployment
- [ ] Docker container distribution
- [ ] Qubic smart contract deployment assistance (C++ SC tooling)

## Future Ideas

These are longer-term possibilities depending on Qubic ecosystem evolution:

- **SC Development Assistant** — Help write/audit Qubic C++ smart contracts
- **Portfolio Tracker** — Multi-address portfolio overview
- **Arbitrage Monitor** — Cross-DEX price comparison
- **Governance Tools** — Computor voting and proposal tracking
- **IPO Tracker** — Smart contract IPO monitoring
- **Aigarth Integration** — Leverage Qubic's AI subsystem
- **Oracle Data** — Query Qubic oracle data feeds
- **Send-Many Batching** — Batch multiple transfers efficiently

## Contributing to the Roadmap

Have an idea? Open a [feature request issue](https://github.com/user/qubic-mcp/issues/new?template=feature_request.yml) or start a [discussion](https://github.com/user/qubic-mcp/discussions).
