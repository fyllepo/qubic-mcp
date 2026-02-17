import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { QubicMcpConfig } from "../config/index.js";
import { saveNetwork, removeNetwork, switchNetwork, listNetworks } from "../utils/network-store.js";

/**
 * Apply a network switch to the live config object.
 * Because tools hold a reference to this object, mutating it
 * makes all tools instantly use the new RPC endpoint.
 */
function applyToConfig(
  config: QubicMcpConfig,
  rpcUrl: string,
  apiUrl: string,
  label: string,
): void {
  config.rpcUrl = rpcUrl;
  config.apiUrl = apiUrl;
  config.networkLabel = label;
  config.network = label === "mainnet" || label === "testnet" ? label : "custom";
}

export function registerNetworkManagementTools(server: McpServer, config: QubicMcpConfig): void {
  server.tool(
    "add_network",
    "Save a custom Qubic network (e.g., a local lite node). Stored in ~/.qubic-mcp/networks.json. Use switch_network to activate it.",
    {
      name: z
        .string()
        .describe('A friendly name for this network (e.g., "local", "dev-node", "my-lite")'),
      rpcUrl: z.string().describe('The RPC endpoint URL (e.g., "http://192.168.1.50:21841")'),
      apiUrl: z
        .string()
        .optional()
        .describe("Optional separate API/query endpoint. Defaults to the RPC URL if not provided."),
    },
    async ({ name, rpcUrl, apiUrl }) => {
      const result = saveNetwork(name, rpcUrl, apiUrl);

      if ("error" in result) {
        return {
          content: [{ type: "text" as const, text: result.error }],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Network "${name}" saved.\n\n  RPC: ${rpcUrl}\n  API: ${apiUrl ?? rpcUrl}\n\nUse switch_network to activate it.`,
          },
        ],
      };
    },
  );

  server.tool(
    "switch_network",
    'Switch the active Qubic network. All subsequent tool calls will use the new endpoint. Built-in networks: "mainnet", "testnet". Use add_network to save custom networks.',
    {
      name: z.string().describe('Network name to switch to (e.g., "mainnet", "testnet", "local")'),
    },
    async ({ name }) => {
      const result = switchNetwork(name);

      if ("error" in result) {
        return {
          content: [{ type: "text" as const, text: result.error }],
          isError: true,
        };
      }

      applyToConfig(config, result.rpcUrl, result.apiUrl, result.label);

      return {
        content: [
          {
            type: "text" as const,
            text: `Switched to network "${result.label}".\n\n  RPC: ${result.rpcUrl}\n  API: ${result.apiUrl}\n\nAll tools now query this endpoint.`,
          },
        ],
      };
    },
  );

  server.tool(
    "list_networks",
    "List all available Qubic networks (built-in and custom) and show which is currently active.",
    {},
    async () => {
      const { active, builtIn, custom } = listNetworks();

      const lines = [
        `Active Network: ${active}`,
        `Current RPC: ${config.rpcUrl}`,
        "",
        "Built-in Networks",
        "=".repeat(20),
      ];

      for (const name of builtIn) {
        const marker = name === active ? " (active)" : "";
        lines.push(`  ${name}${marker}`);
      }

      if (custom.length > 0) {
        lines.push("", "Custom Networks", "=".repeat(20));
        for (const n of custom) {
          const marker = n.name === active ? " (active)" : "";
          lines.push(`  ${n.name}${marker}`);
          lines.push(`    RPC: ${n.rpcUrl}`);
          lines.push(`    API: ${n.apiUrl}`);
        }
      } else {
        lines.push("", "No custom networks saved. Use add_network to add one.");
      }

      lines.push(
        "",
        'Use switch_network to change the active network (e.g., switch_network "local").',
      );

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    },
  );

  server.tool(
    "remove_network",
    "Remove a saved custom network. Cannot remove built-in networks (mainnet, testnet). If the removed network was active, switches back to mainnet.",
    {
      name: z.string().describe("The name of the custom network to remove"),
    },
    async ({ name }) => {
      const wasActive = config.networkLabel === name.trim().toLowerCase();
      const result = removeNetwork(name);

      if ("error" in result) {
        return {
          content: [{ type: "text" as const, text: result.error }],
          isError: true,
        };
      }

      let msg = `Network "${name}" removed.`;

      // If we just removed the active network, switch config back to mainnet
      if (wasActive) {
        applyToConfig(config, "https://rpc.qubic.org", "https://api.qubic.org", "mainnet");
        msg += "\n\nThis was the active network — switched back to mainnet.";
      }

      return {
        content: [{ type: "text" as const, text: msg }],
      };
    },
  );
}
