#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
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
import { registerMiningPhaseTool } from "./tools/get-mining-phase.js";
import { registerTokenListTool } from "./tools/get-token-list.js";
import { registerQxOrderbookTool } from "./tools/get-qx-orderbook.js";
import { registerNetworkManagementTools } from "./tools/network-management.js";
import { getConfig, type QubicMcpConfig } from "./config/index.js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

/**
 * Create and configure an McpServer with all tools.
 */
function createServer(config: QubicMcpConfig): McpServer {
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

  // Mining & network phase
  registerMiningPhaseTool(server, config);

  // Market & analytics tools
  registerRichListTool(server, config);
  registerConvertQuUsdTool(server, config);
  registerValidateAddressTool(server, config);
  registerExplorerLinksTool(server);

  // QX DEX & token registry
  registerTokenListTool(server);
  registerQxOrderbookTool(server, config);

  // Wallet management (local storage, public addresses only)
  registerWalletManagementTools(server);

  // Network management (add/switch/list custom networks)
  registerNetworkManagementTools(server, config);

  return server;
}

/**
 * Start the server with stdio transport (default).
 */
async function startStdio(config: QubicMcpConfig): Promise<void> {
  const server = createServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

/**
 * Start the server with Streamable HTTP transport.
 */
async function startHttp(config: QubicMcpConfig, port: number): Promise<void> {
  const app = createMcpExpressApp();

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  const server = createServer(config);
  await server.connect(transport);

  app.all("/mcp", async (req: IncomingMessage, res: ServerResponse) => {
    await transport.handleRequest(req, res, (req as unknown as { body: unknown }).body);
  });

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`qubic-mcp HTTP server listening on port ${String(port)}`);
  });
}

// Start the server
async function main(): Promise<void> {
  const config = getConfig();
  const httpPort = process.env["MCP_HTTP_PORT"];

  if (httpPort) {
    const port = parseInt(httpPort, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error(`Invalid MCP_HTTP_PORT: ${httpPort}`);
    }
    await startHttp(config, port);
  } else {
    await startStdio(config);
  }
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error("Fatal error starting qubic-mcp server:", error);
  process.exit(1);
});
