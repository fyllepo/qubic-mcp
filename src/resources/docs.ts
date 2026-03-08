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
  {
    name: "docs-oracles",
    uri: "qubic://docs/oracles",
    description: "Qubic Oracle Machines: bridging smart contracts with real-world data via QPI",
    path: "/developers/oracles.md",
  },
  {
    name: "docs-sc-architecture",
    uri: "qubic://docs/sc-architecture",
    description: "Qubic smart contract architecture: state, procedures, functions, logging",
    path: "/developers/smart-contract-architecture.md",
  },
  {
    name: "docs-sc-lifecycle",
    uri: "qubic://docs/sc-lifecycle",
    description: "Smart contract lifecycle: from research through proposal, IPO, deployment, and maintenance",
    path: "/developers/smart-contracts/getting-started/lifecycle.md",
  },
  {
    name: "docs-ticks-concurrency",
    uri: "qubic://docs/ticks-concurrency",
    description: "Qubic ticks and concurrency: tick lifecycle, parallel execution, transaction ordering",
    path: "/developers/ticks-and-concurrency.md",
  },
  {
    name: "docs-interact-sc",
    uri: "qubic://docs/interact-sc",
    description: "Interacting with Qubic smart contracts: calling functions, invoking procedures",
    path: "/developers/interact-with-sc.md",
  },
  {
    name: "docs-execution-fees",
    uri: "qubic://docs/execution-fees",
    description: "Qubic contract execution fees: fee reserves, invocation costs, burn mechanics",
    path: "/learn/contract-execution-fees.md",
  },
  {
    name: "docs-rpc",
    uri: "qubic://docs/rpc",
    description: "Qubic RPC API: endpoints, smart contract queries, transaction broadcasting",
    path: "/api/rpc.md",
  },
  {
    name: "docs-qpi",
    uri: "qubic://docs/qpi",
    description: "Qubic Protocol Interface (QPI): the API available to smart contracts",
    path: "/developers/qpi.md",
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
