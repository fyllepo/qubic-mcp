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

Query balances, inspect transactions, monitor the network, trade on QX, switch between networks, and interact with smart contracts — all through natural language.

## What's New in v0.4

- **Smart Contract Profiles** — Register custom SC interface definitions, then query them by name with automatic binary encoding/decoding
- **Network Management** — Save and switch between mainnet, testnet, or your own local/lite node at runtime
- **Epoch Computors** — Query the 676 computor identities for any epoch
- **MCP Prompts** — Predefined workflows for portfolio analysis, market overview, and research
- **MCP Resources** — Qubic reference documentation (network, tokenomics, smart contracts, address format)
- **HTTP Transport** — Run as a standalone HTTP server for remote deployment

## Features

### Blockchain Query Tools

- **Balance & Transfers** — Query any Qubic address balance and transfer history
- **Transactions** — Look up transaction details by ID
- **Network Status** — Current tick, epoch, supply, burned QUs, active addresses, market cap
- **Mining Phase** — Current MINING/IDLE phase, cycle progress, and XMR marathon status
- **Epoch Computors** — List all 676 computor identities for a given epoch
- **Rich List** — Top holders ranked by balance

### Market & Analytics

- **Token Price** — Real-time QUBIC price compared across 3 sources (CoinGecko, Qubic API, CryptoCompare)
- **QU/USD Converter** — Convert between QU and USD at live rates
- **Token Registry** — List all registered Qubic tokens with issuer and website
- **QX DEX Orderbook** — Live ask/bid orders for any token on the QX decentralized exchange

### Smart Contract Tools

- **Register Contract** — Save a custom SC interface definition (function names, input/output field schemas)
- **Query Contract** — Query a registered SC function by name with automatic binary encoding/decoding
- **Raw SC Query** — Low-level smart contract query with base64 input/output for advanced use
- **List/Remove Contracts** — Manage your registered contract definitions

### Local Management

- **Wallet Management** — Save wallet addresses locally for quick access
- **Network Switching** — Save and switch between mainnet, testnet, or custom RPC endpoints at runtime
- **Address Validation** — Check format and on-chain activity
- **Explorer Links** — Direct links to the official Qubic block explorer

### AI Context

- **MCP Resources** — Qubic reference docs (network, tokenomics, smart contracts, address format) available as context
- **MCP Prompts** — Predefined workflows: portfolio analysis, market overview, and Qubic research

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
| **JetBrains IDEs** | Settings > Tools > AI Assistant > MCP Servers |
| **ChatGPT Desktop** | Settings > MCP Servers > Add |

For other clients, check your app's MCP documentation — the config above is universal.

</details>

Then just ask in plain English:

### Wallet Management

```
"Save my wallet UXITJAGNXUE...RAPDBE as my-main"
"List my wallets"
"Remove my old-wallet"
```

### Balances & Transfers

```
"What's the balance of my-main?"
"Show transfer history for my-main over the last 1000 ticks"
```

### Price & Market

```
"What's the current QUBIC price?"
"How much is 1 billion QU worth in USD?"
"Convert $100 to QU"
```

### Network & Mining

```
"What's the current tick?"
"Show me the network status"
"What mining phase are we in?"
"Who are the top Qubic holders?"
```

### QX DEX & Tokens

```
"What tokens are available on Qubic?"
"Show the QX orderbook for CFB"
"Show bid orders for QMINE on QX"
```

### Network Switching

```
"Add my local network at http://192.168.1.50:21841"
"Switch to my local network"
"Switch back to mainnet"
"List my networks"
```

### Smart Contract Queries

```
"Register my QGate contract at index 24 with these functions: [...]"
"Query QGate getGateCount"
"Query QGate getGate with gateId 1"
"List my registered contracts"
```

## Smart Contract Development Workflow

One of the most powerful features of qubic-mcp is its smart contract profile system. If you're developing a Qubic smart contract on a local lite network, you can use the MCP to test your contract's RPC interface directly through your AI assistant.

### Why This Matters

Qubic smart contracts communicate via binary-encoded structs over the `/v1/querySmartContract` RPC endpoint. Without tooling, this means manually encoding fields into base64, making HTTP calls, and decoding binary responses — error-prone and tedious.

With qubic-mcp, you register your contract's interface once, and then query it by name with human-readable input and output. Your AI assistant handles all the binary encoding/decoding automatically.

### Step-by-Step

**1. Point the MCP at your test network:**

```
"Add my test network at http://192.168.1.50:21841 called qgate-testnet"
"Switch to qgate-testnet"
```

Your MCP server now talks to your local lite node instead of mainnet. This persists across sessions in `~/.qubic-mcp/networks.json`.

**2. Register your contract's interface:**

Tell the assistant your contract's index and function definitions. For example, a QGate contract at index 24:

```
Register my QGate contract at index 24 with these functions:

- getGateCount (inputType 6): no input, output is totalGates (uint64) and activeGates (uint64)
- getGate (inputType 5): input is gateId (uint64), output is mode (uint8), recipientCount (uint8), active (uint8), 5 bytes padding, owner (identity), totalReceived (uint64), totalForwarded (uint64), currentBalance (uint64), threshold (uint64), createdEpoch (uint64), recipients (identity array of 8), ratios (uint64 array of 8)
```

The assistant will call `register_contract` with the proper field schema JSON. The definition is saved to `~/.qubic-mcp/contracts.json` and persists across sessions.

**Supported field types:** `uint8`, `uint16`, `uint32`, `uint64`, `int8`, `int16`, `int32`, `int64`, `identity` (60-char Qubic address / 32-byte pubkey), `padding` (skipped bytes).

Fields support `count` for arrays (e.g., 8 recipients) and `enum` for value-to-label mapping (e.g., `0 = "SPLIT"`, `1 = "ROUND_ROBIN"`).

**3. Query your contract by name:**

```
"Query QGate getGateCount"
"Query QGate getGate with gateId 1"
```

The MCP encodes your input into binary, calls the RPC endpoint, and decodes the response into named fields:

```
qgate.getGate
===============

  mode: SPLIT (0)
  recipientCount: 2
  active: 1
  owner: BAAAAAAA...AAAAARMID
  totalReceived: 5,000
  totalForwarded: 3,000
  currentBalance: 2,000
  threshold: 10,000
  createdEpoch: 200
  recipients:
    [0] XYZABC...DEF
    [1] UVWXYZ...GHI
  ratios:
    [0] 60
    [1] 40
```

**4. Switch back to mainnet when done:**

```
"Switch to mainnet"
```

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

## All Tools

### Blockchain

| Tool | Description |
|------|-------------|
| `get_balance` | Get balance and transfer activity for an address or saved wallet |
| `get_tick_info` | Get current tick number, epoch, and tick duration |
| `get_network_status` | Network stats: supply, burned QUs, active addresses, tick quality, market cap |
| `get_transaction` | Look up a transaction by its 60-character ID |
| `get_transfer_history` | Paginated transfer history for an address within a tick range |
| `get_mining_phase` | Current MINING/IDLE phase, cycle progress, and XMR marathon status |
| `get_epoch_computors` | List all 676 computor identities for a given epoch |
| `get_rich_list` | Top Qubic addresses ranked by balance with pagination |

### Market & Tokens

| Tool | Description |
|------|-------------|
| `get_token_price` | QUBIC price compared across CoinGecko, Qubic API, and CryptoCompare |
| `convert_qu_usd` | Convert between QU and USD using live price |
| `get_token_list` | List all registered Qubic tokens with name, issuer address, and website |
| `get_qx_orderbook` | QX DEX orderbook — ask and/or bid orders for any token, with pagination |

### Smart Contracts

| Tool | Description |
|------|-------------|
| `register_contract` | Register a custom SC definition with typed function schemas |
| `query_contract` | Query a registered SC function by name (auto binary encode/decode) |
| `query_smart_contract` | Low-level SC query with raw base64 input/output |
| `list_contracts` | List all registered contract definitions |
| `remove_contract` | Remove a registered contract definition |

### Wallets & Networks

| Tool | Description |
|------|-------------|
| `save_wallet` | Save a Qubic address with a friendly name for quick access |
| `list_wallets` | List all saved wallets |
| `remove_wallet` | Remove a saved wallet |
| `add_network` | Save a custom Qubic network (e.g., local lite node) for quick switching |
| `switch_network` | Switch the active network (mainnet, testnet, or any saved custom network) |
| `list_networks` | List all available networks and show which is currently active |
| `remove_network` | Remove a saved custom network |

### Utility

| Tool | Description |
|------|-------------|
| `validate_address` | Validate address format and check on-chain activity |
| `get_explorer_links` | Get links to Qubic block explorers for an address or transaction |

### MCP Resources

| Resource URI | Description |
|--------------|-------------|
| `qubic://docs/network` | Qubic network: epochs, ticks, quorum consensus, computor ranking |
| `qubic://docs/tokenomics` | Qubic tokenomics: supply cap, emission schedule, burning |
| `qubic://docs/smart-contracts` | Qubic smart contracts: governance, execution, IPO process |
| `qubic://docs/address-format` | Qubic identity system: seed to private key to public key to address |

### MCP Prompts

| Prompt | Description |
|--------|-------------|
| `qubic-portfolio` | Analyze your portfolio: wallet balances, token holdings, USD values |
| `qubic-market` | Market overview: price, network stats, mining phase, rich list |
| `qubic-research` | Research a Qubic topic using the built-in reference documentation |

## Local Data

qubic-mcp stores local data in `~/.qubic-mcp/`:

| File | Purpose |
|------|---------|
| `wallets.json` | Saved wallet addresses (public addresses only, never private keys) |
| `networks.json` | Saved network profiles and active network selection |
| `contracts.json` | Registered smart contract interface definitions |

## Security

This project takes security seriously, especially given it interacts with a financial network.

- **No private keys** — This server is read-only. It never asks for, stores, or transmits private keys or seeds.
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
