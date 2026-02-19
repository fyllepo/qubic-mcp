import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const GITHUB_RAW = "https://raw.githubusercontent.com/qubic/docs/refs/heads/main/docs";

interface DocResource {
  name: string;
  uri: string;
  description: string;
  path: string;
}

const DOCS: DocResource[] = [
  {
    name: "docs-network",
    uri: "qubic://docs/network",
    description: "Qubic network: epochs, ticks, quorum consensus, computor ranking",
    path: "/overview/consensus.md",
  },
  {
    name: "docs-tokenomics",
    uri: "qubic://docs/tokenomics",
    description: "Qubic tokenomics: $QUBIC as energy, supply cap, emission schedule, burning",
    path: "/learn/tokenomics.md",
  },
  {
    name: "docs-smart-contracts",
    uri: "qubic://docs/smart-contracts",
    description: "Qubic smart contracts: governance, execution, IPO process",
    path: "/learn/smart-contracts.md",
  },
  {
    name: "docs-address-format",
    uri: "qubic://docs/address-format",
    description: "Qubic identity system: seed → private key → public key → 60-char address",
    path: "/developers/qubic-id.md",
  },
];

/** Strip YAML frontmatter (--- ... ---) from markdown content. */
function stripFrontmatter(md: string): string {
  return md.replace(/^---[\s\S]*?---\s*/, "");
}

async function fetchDoc(path: string): Promise<string> {
  const url = `${GITHUB_RAW}${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${String(res.status)}`);
  }
  return stripFrontmatter(await res.text()).trim();
}

export function registerDocsResources(server: McpServer): void {
  for (const doc of DOCS) {
    server.resource(doc.name, doc.uri, { description: doc.description }, async () => ({
      contents: [
        {
          uri: doc.uri,
          mimeType: "text/markdown" as const,
          text: await fetchDoc(doc.path),
        },
      ],
    }));
  }
}
