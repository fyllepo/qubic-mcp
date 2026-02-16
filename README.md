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
```

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

### Network & Explorer

- "What's the current tick?"
- "Show me the network status"
- "Who are the top Qubic holders?"
- "Show rich list page 2"
- "Get explorer links for my-main"
- "Open the explorer for this transaction: abcdef...xyz"

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

Configuration is via environment variables. See [`.env.example`](.env.example) for all options.

| Variable | Default | Description |
|----------|---------|-------------|
| `QUBIC_RPC_URL` | `https://rpc.qubic.org` | Qubic RPC endpoint |
| `QUBIC_API_URL` | `https://api.qubic.org` | Qubic Query API endpoint |

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
| `save_wallet` | Save a Qubic address with a friendly name for quick access |
| `list_wallets` | List all saved wallets |
| `remove_wallet` | Remove a saved wallet |

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
