import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  saveContract,
  listContracts,
  removeContract,
  type ContractFunctionDef,
} from "../utils/contract-store.js";

export function registerContractManagementTools(server: McpServer): void {
  // ── register_contract ────────────────────────────────────────

  server.tool(
    "register_contract",
    `Register a custom smart contract definition for use with query_contract.

Provide the contract's on-chain index and a JSON array of function definitions describing the binary input/output layout. Once registered, you can query the contract by name with automatic encoding and decoding.

Supported field types: uint8, uint16, uint32, uint64, int8, int16, int32, int64, identity (32-byte pubkey ↔ 60-char address), padding (skipped bytes).

Fields support "count" for arrays (e.g., 8 recipients) and "enum" for value→label mapping.

Example functions JSON:
[{
  "name": "getGateCount",
  "inputType": 6,
  "input": [],
  "output": [
    { "name": "totalGates", "type": "uint64" },
    { "name": "activeGates", "type": "uint64" }
  ]
}]`,
    {
      name: z.string().min(1).max(50).describe("Contract name (e.g., QGate)"),
      contractIndex: z.number().int().min(1).describe("On-chain contract index"),
      functions: z
        .string()
        .describe("JSON array of function definitions with input/output field schemas"),
      description: z.string().optional().describe("Human-readable description of the contract"),
      identity: z
        .string()
        .length(60)
        .optional()
        .describe("Contract's 60-character Qubic identity (optional, informational)"),
    },
    async ({ name, contractIndex, functions: functionsJson, description, identity }) => {
      try {
        let parsed: unknown;
        try {
          parsed = JSON.parse(functionsJson);
        } catch {
          return {
            content: [
              {
                type: "text" as const,
                text: "Invalid JSON in functions parameter. Must be a JSON array of function definitions.",
              },
            ],
            isError: true,
          };
        }

        if (!Array.isArray(parsed) || parsed.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Functions must be a non-empty JSON array.",
              },
            ],
            isError: true,
          };
        }

        const result = saveContract(
          name,
          contractIndex,
          parsed as ContractFunctionDef[],
          description,
          identity,
        );

        if ("error" in result) {
          return {
            content: [{ type: "text" as const, text: `Registration failed: ${result.error}` }],
            isError: true,
          };
        }

        const fns = parsed as ContractFunctionDef[];
        const fnList = fns
          .map(
            (f) =>
              `  - ${(f as { name: string }).name} (inputType ${String((f as { inputType: number }).inputType)})`,
          )
          .join("\n");

        return {
          content: [
            {
              type: "text" as const,
              text: [
                `Contract "${name}" registered successfully.`,
                ``,
                `Index: ${String(contractIndex)}`,
                description ? `Description: ${description}` : null,
                identity ? `Identity: ${identity}` : null,
                `Functions:`,
                fnList,
                ``,
                `Use query_contract to call these functions.`,
              ]
                .filter(Boolean)
                .join("\n"),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error registering contract: ${message}` }],
          isError: true,
        };
      }
    },
  );

  // ── list_contracts ───────────────────────────────────────────

  server.tool(
    "list_contracts",
    "List all registered custom smart contract definitions with their functions and field schemas.",
    {},
    async () => {
      const contracts = listContracts();

      if (contracts.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No contracts registered. Use register_contract to add one.",
            },
          ],
        };
      }

      const lines = [`Registered Contracts (${String(contracts.length)})`, `${"=".repeat(30)}`, ``];

      for (const c of contracts) {
        lines.push(`${c.name} (index ${String(c.contractIndex)})`);
        if (c.description) lines.push(`  ${c.description}`);
        if (c.identity) lines.push(`  Identity: ${c.identity}`);
        lines.push(`  Functions:`);

        for (const fn of c.functions) {
          const inputDesc =
            fn.input.length === 0
              ? "none"
              : fn.input
                  .filter((f) => f.type !== "padding")
                  .map(
                    (f) =>
                      `${f.name}: ${f.type}${f.count && f.count > 1 ? `[${String(f.count)}]` : ""}`,
                  )
                  .join(", ");
          const outputCount = fn.output.filter((f) => f.type !== "padding").length;
          lines.push(
            `    ${fn.name} (inputType ${String(fn.inputType)}) — input: ${inputDesc}, output: ${String(outputCount)} fields`,
          );
        }

        lines.push(`  Added: ${c.addedAt}`);
        lines.push(``);
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    },
  );

  // ── remove_contract ──────────────────────────────────────────

  server.tool(
    "remove_contract",
    "Remove a registered smart contract definition by name.",
    {
      name: z.string().min(1).describe("Name of the contract to remove"),
    },
    async ({ name }) => {
      const result = removeContract(name);

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
            text: `Contract "${name}" removed.`,
          },
        ],
      };
    },
  );
}
