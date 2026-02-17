<p align="center">
  <img src="assets/qubic-logo.png" alt="Qubic" width="300">
</p>

# qubic-mcp

> MCP server for the Qubic cryptocurrency — enabling AI assistants to interact with the Qubic network.

[![npm version](https://img.shields.io/npm/v/mcp-server-qubic)](https://www.npmjs.com/package/mcp-server-qubic)
[![CI](https://github.com/fyllepo/qubic-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/fyllepo/qubic-mcp/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## Overview

**qubic-mcp** is an open-source [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that gives AI assistants — Claude, ChatGPT, Copilot, Cursor, and others — native access to the [Qubic](https://qubic.org) blockchain.

Query balances, inspect transactions, track wallets, monitor network status, and more — all through natural language.

## Features

- **Wallet Management** — Save wallet addresses locally for quick access ("check my balance")
- **Balance & Transfers** — Query any Qubic address balance and transfer history
- **Transactions** — Look up transaction details by ID
- **Network Status** — Current tick, epoch, supply, burned QUs, active addresses, market cap
- **Token Price** — Real-time QUBIC price compared across 3 sources (CoinGecko, Qubic API, CryptoCompare)
- **Rich List** — Top holders ranked by balance
- **QU/USD Converter** — Convert between QU and USD at live rates
- **Address Validation** — Check format and on-chain activity
- **Explorer Links** — Direct links to the official Qubic block explorer
- **Mining Phase** — Current MINING/IDLE phase and XMR marathon status, calculated from tick data
- **Token Registry** — List all registered Qubic tokens with issuer and website
- **QX DEX Orderbook** — Live ask/bid orders for any token on the QX decentralized exchange
- **Network Management** — Switch between mainnet, testnet, or your own local/lite node at runtime
- **Secure by Design** — Never stores or transmits private keys or seeds

## Quick Start

Works with any MCP-compatible AI client — Claude, ChatGPT, Copilot, Cursor, Windsurf, Gemini, JetBrains, and more.

Add this to your client's MCP config:

```json
{
  "mcpServers": {
    "qubic": {
      "command": "npx",
      "args": ["mcp-server-qubic"]
    }
  }
}
```

<details>
<summary>Where to find the config file</summary>

| Client | Config location |
|--------|----------------|
| **Claude Desktop** (macOS) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Claude Desktop** (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` |
| **Claude Desktop** (Linux) | `~/.config/Claude/claude_desktop_config.json` |
| **Claude Code** | Run `claude mcp add qubic -- npx mcp-server-qubic` in your terminal |
| **VS Code / Cursor / Windsurf** | `.vscode/mcp.json` or your editor's MCP settings |
| **JetBrains IDEs** | Settings → Tools → AI Assistant → MCP Servers |
| **ChatGPT Desktop** | Settings → MCP Servers → Add |

For other clients, check your app's MCP documentation — the config above is universal.

</details>

Then just ask in plain English — here are some examples to get you started:

### Wallet Management

Save a wallet for quick access:
- "Save my wallet UXITJAGNXUE...RAPDBE as my-main"
- "Save this address as cold-storage: BAAAAA...ARMID"

Check your saved wallets:
- "List my wallets"
- "Show my saved wallets"

Remove a wallet:
- "Remove my old-wallet"

### Balances & Transfers

Check a balance by name or address:
- "What's the balance of my-main?"
- "Check balance for BAAAAAAAA...ARMID"

View transfer history:
- "Show my-main transfer history for the last 1000 ticks"
- "Get transfers for my-main from tick 22300000 to 22301000"

### Price & Market

- "What's the current QUBIC price?"
- "How much is 1 billion QU worth in USD?"
- "Convert $100 to QU"

### Network & Mining

- "What's the current tick?"
- "Show me the network status"
- "What mining phase are we in?"
- "Is it an XMR marathon right now?"
- "Who are the top Qubic holders?"
- "Show rich list page 2"
- "Get explorer links for my-main"
- "Open the explorer for this transaction: abcdef...xyz"

### QX DEX & Tokens

List all tokens registered on Qubic:
- "What tokens are available on Qubic?"
- "Show me the token registry"

Query the QX orderbook for any token (the assistant will look up the issuer automatically):
- "Show the QX orderbook for CFB"
- "What are the current ask orders for QXMR?"
- "Show bid orders for QMINE on QX"
- "Show page 2 of the CFB orderbook"

### Network Switching

Add and switch between Qubic networks (mainnet, testnet, or your own local node):
- "Add my local network at http://192.168.1.50:21841"
- "Switch to my local network"
- "Switch back to mainnet"
- "List my networks"
- "Remove my local network"

### Validation

- "Is this a valid Qubic address? BAAAAA...ARMID"
- "Validate address XYZABC..."

## Installation

### From npm (recommended)

```bash
npm install -g mcp-server-qubic
```

### From source

```bash
git clone https://github.com/fyllepo/qubic-mcp.git
cd qubic-mcp
npm install
npm run build
```

## Configuration

### Network Management

The easiest way to configure which Qubic network you talk to is through the built-in tools — no env vars needed:

1. **Add a custom network:** `add_network` — save your local node's IP with a friendly name
2. **Switch networks:** `switch_network` — toggle between mainnet, testnet, or any saved network
3. **List networks:** `list_networks` — see all available networks and which is active

Networks are saved to `~/.qubic-mcp/networks.json` and persist across sessions. Built-in networks (mainnet, testnet) are always available.

### Environment Variables

For advanced use or CI environments, you can also configure via env vars. See [`.env.example`](.env.example).

| Variable | Default | Description |
|----------|---------|-------------|
| `QUBIC_RPC_URL` | *(from active network)* | Override the RPC endpoint (takes priority over saved networks) |
| `QUBIC_API_URL` | *(from active network)* | Override the Query API endpoint |
| `QUBIC_NETWORK_LABEL` | *(auto)* | Friendly label shown when using `QUBIC_RPC_URL` override |
| `MCP_HTTP_PORT` | *(not set)* | Set a port to run as an HTTP server instead of stdio |

### HTTP Transport

By default the server uses stdio, which is what most MCP clients expect. To run it as a standalone HTTP endpoint instead, set `MCP_HTTP_PORT`:

```bash
MCP_HTTP_PORT=3000 node dist/index.js
```

The server exposes a single `/mcp` endpoint that supports the MCP Streamable HTTP transport:

- **POST /mcp** — send JSON-RPC requests (initialize creates a session)
- **GET /mcp** — open an SSE stream for server notifications (requires `mcp-session-id` header)
- **DELETE /mcp** — terminate a session

## Available Tools

| Tool | Description |
|------|-------------|
| `get_balance` | Get balance and transfer activity for an address or saved wallet |
| `get_tick_info` | Get current tick number, epoch, and tick duration |
| `get_network_status` | Network stats: supply, burned QUs, active addresses, tick quality, market cap |
| `get_transaction` | Look up a transaction by its 60-character ID |
| `get_token_price` | QUBIC price compared across CoinGecko, Qubic API, and CryptoCompare |
| `get_transfer_history` | Paginated transfer history for an address within a tick range |
| `get_rich_list` | Top Qubic addresses ranked by balance with pagination |
| `convert_qu_usd` | Convert between QU and USD using live price |
| `validate_address` | Validate address format and check on-chain activity |
| `get_explorer_links` | Get links to Qubic block explorers for an address or transaction |
| `get_mining_phase` | Current MINING/IDLE phase, cycle progress, and XMR marathon status |
| `get_token_list` | List all registered Qubic tokens with name, issuer address, and website |
| `get_qx_orderbook` | QX DEX orderbook — ask and/or bid orders for any token, with pagination |
| `save_wallet` | Save a Qubic address with a friendly name for quick access |
| `list_wallets` | List all saved wallets |
| `remove_wallet` | Remove a saved wallet |
| `add_network` | Save a custom Qubic network (e.g., local lite node) for quick switching |
| `switch_network` | Switch the active network (mainnet, testnet, or any saved custom network) |
| `list_networks` | List all available networks and show which is currently active |
| `remove_network` | Remove a saved custom network |

## Security

This project takes security seriously, especially given it interacts with a financial network.

- **No private keys** — This server is read-only by default. It never asks for, stores, or transmits private keys or seeds.
- **Input validation** — All inputs are validated with Zod schemas before processing.
- **No telemetry** — No analytics, tracking, or data collection of any kind.
- **Auditable** — Fully open source. Read every line.

See [SECURITY.md](SECURITY.md) for our vulnerability disclosure policy.

## Contributing

Contributions are welcome and encouraged! Whether you're fixing a bug, adding a new tool, improving docs, or suggesting an idea — we'd love your help.

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Roadmap

See [ROADMAP.md](ROADMAP.md) for our planned features and future direction.

## License

MIT — see [LICENSE](LICENSE).

## Disclaimer

This software is provided "as is" without warranty of any kind. The authors and contributors are not responsible for any loss of funds, data, or other damages resulting from the use of this software.

This tool interacts with the Qubic blockchain where transactions are irreversible. Users are solely responsible for verifying all information and understanding the risks. This software does not provide financial advice.
