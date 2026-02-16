#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerBalanceTool } from "./tools/get-balance.js";
import { registerTickInfoTool } from "./tools/get-tick-info.js";
import { registerNetworkStatusTool } from "./tools/get-network-status.js";
import { registerTransactionTool } from "./tools/get-transaction.js";
import { registerTokenPriceTool } from "./tools/get-token-price.js";
import { registerTransferHistoryTool } from "./tools/get-transfer-history.js";
import { registerWalletManagementTools } from "./tools/wallet-management.js";
import { registerRichListTool } from "./tools/get-rich-list.js";
import { registerConvertQuUsdTool } from "./tools/convert-qu-usd.js";
import { registerValidateAddressTool } from "./tools/validate-address.js";
import { registerExplorerLinksTool } from "./tools/get-explorer-links.js";
import { getConfig } from "./config/index.js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const config = getConfig();

const server = new McpServer({
  name: "qubic-mcp",
  version,
});

// Core tools — all verified against live Qubic APIs
registerBalanceTool(server, config);
registerTickInfoTool(server, config);
registerNetworkStatusTool(server, config);
registerTransactionTool(server, config);
registerTokenPriceTool(server, config);
registerTransferHistoryTool(server, config);

// Market & analytics tools
registerRichListTool(server, config);
registerConvertQuUsdTool(server, config);
registerValidateAddressTool(server, config);
registerExplorerLinksTool(server);

// Wallet management (local storage, public addresses only)
registerWalletManagementTools(server);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error("Fatal error starting qubic-mcp server:", error);
  process.exit(1);
});
