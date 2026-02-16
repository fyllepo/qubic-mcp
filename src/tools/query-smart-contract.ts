import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { QubicMcpConfig } from "../config/index.js";
import { rpcPost } from "../utils/qubic-rpc.js";
import { getField } from "../utils/format.js";

const KNOWN_CONTRACTS: Record<number, string> = {
  1: "QX (Decentralized Exchange)",
  2: "Quottery (Betting & Oracles)",
  3: "Random (Random Number Generation)",
  4: "QUTIL (Utility Functions)",
  5: "MLM (My Last Match - Gaming)",
};

function formatContractList(): string {
  return Object.entries(KNOWN_CONTRACTS)
    .map(([idx, name]) => `  ${idx}: ${name}`)
    .join("\n");
}

export function registerQuerySmartContractTool(
  server: McpServer,
  config: QubicMcpConfig,
): void {
  server.tool(
    "query_smart_contract",
    `Query a Qubic smart contract (read-only). Returns the contract's response data as base64-encoded bytes.

Known contracts:
${formatContractList()}

This is a low-level query tool. Use inputType to specify which contract function to call, and inputHex for the function parameters (hex-encoded bytes). If unsure about parameters, start with inputType=0 and empty input to get contract info.`,
    {
      contractIndex: z
        .number()
        .int()
        .min(1)
        .describe("Smart contract index (1=QX, 2=Quottery, 3=Random, 4=QUTIL, 5=MLM)"),
      inputType: z
        .number()
        .int()
        .min(0)
        .describe("Function input type ID (contract-specific)"),
      inputSize: z
        .number()
        .int()
        .min(0)
        .default(0)
        .describe("Size of input data in bytes (default: 0)"),
      requestedData: z
        .string()
        .default("")
        .describe("Hex-encoded input data for the contract function (default: empty)"),
    },
    async ({ contractIndex, inputType, inputSize, requestedData }) => {
      const contractName = KNOWN_CONTRACTS[contractIndex] ?? `Unknown Contract #${String(contractIndex)}`;

      try {
        const body: Record<string, unknown> = {
          contractIndex,
          inputType,
          inputSize,
        };
        if (requestedData.length > 0) {
          body["requestedData"] = requestedData;
        }

        const response = await rpcPost(config, "/v1/querySmartContract", body);
        const responseData = getField(response, "responseData") as string | undefined;

        if (!responseData) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Smart contract query returned no data.\n\nContract: ${contractName}\nInput Type: ${String(inputType)}`,
              },
            ],
          };
        }

        const lines = [
          `Smart Contract Query Result`,
          `===========================`,
          ``,
          `Contract: ${contractName} (index ${String(contractIndex)})`,
          `Input Type: ${String(inputType)}`,
          `Input Size: ${String(inputSize)} bytes`,
          ``,
          `Response (base64): ${responseData}`,
        ];

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error querying smart contract ${contractName}: ${message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
