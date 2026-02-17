import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { externalGet } from "../utils/qubic-rpc.js";

const TOKEN_LIST_URL = "https://static.qubic.org/v1/general/data/tokens.min.json";

interface QubicToken {
  name?: string;
  issuer?: string;
  website?: string;
}

interface TokenRegistryResponse {
  tokens?: QubicToken[];
}

function formatTokenList(tokens: QubicToken[]): string {
  if (tokens.length === 0) {
    return "No tokens found in the Qubic token registry.";
  }

  const lines = [
    `Qubic Token Registry`,
    `=====================`,
    ``,
    `${String(tokens.length)} token${tokens.length === 1 ? "" : "s"} registered:`,
    ``,
  ];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;
    const name = token.name ?? "Unknown";
    const issuer = token.issuer ?? "N/A";
    const website = token.website ?? "";

    lines.push(`${String(i + 1)}. ${name}`);
    lines.push(`   Issuer: ${issuer}`);
    if (website) {
      lines.push(`   Website: ${website}`);
    }
    lines.push(``);
  }

  return lines.join("\n").trimEnd();
}

export function registerTokenListTool(server: McpServer): void {
  server.tool(
    "get_token_list",
    "Get a list of all registered Qubic tokens with their name, issuer address, and website. Useful for finding token issuers needed for QX orderbook queries.",
    {},
    async () => {
      try {
        const response = (await externalGet(TOKEN_LIST_URL)) as TokenRegistryResponse;

        const tokens = Array.isArray(response)
          ? (response as QubicToken[])
          : (response.tokens ?? []);
        return {
          content: [{ type: "text" as const, text: formatTokenList(tokens) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error fetching token list: ${message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
