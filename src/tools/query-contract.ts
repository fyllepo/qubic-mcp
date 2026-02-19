import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { QubicMcpConfig } from "../config/index.js";
import { rpcPost } from "../utils/qubic-rpc.js";
import { getField } from "../utils/format.js";
import { getContractFunction } from "../utils/contract-store.js";
import { encodeFields, decodeFields, totalByteSize } from "../utils/sc-codec.js";

/** Convert Uint8Array to base64 string. */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

/** Convert base64 string to Uint8Array. */
function base64ToUint8Array(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, "base64"));
}

/** Format decoded fields into a human-readable block. */
function formatDecodedOutput(
  decoded: Array<{ name: string; raw: unknown; display: string }>,
): string {
  const lines: string[] = [];

  for (const entry of decoded) {
    if (Array.isArray(entry.raw)) {
      // Array field — show each element on its own line
      const arr = entry.raw as unknown[];
      const nonEmpty = arr.filter((v) => {
        if (typeof v === "string") return v !== "A".repeat(60) && v !== "0";
        return v !== 0 && v !== undefined;
      });

      if (nonEmpty.length === 0) {
        lines.push(`  ${entry.name}: (empty)`);
      } else {
        lines.push(`  ${entry.name}:`);
        for (let i = 0; i < arr.length; i++) {
          const v = arr[i];
          // Skip zero/empty entries in arrays
          if (typeof v === "string" && (v === "A".repeat(60) || v === "0")) continue;
          if (v === 0 || v === undefined) continue;
          const display =
            typeof v === "string" && /^\d+$/.test(v)
              ? BigInt(v).toLocaleString("en-US")
              : String(v);
          lines.push(`    [${String(i)}] ${display}`);
        }
      }
    } else {
      lines.push(`  ${entry.name}: ${entry.display}`);
    }
  }

  return lines.join("\n");
}

export function registerQueryContractTool(server: McpServer, config: QubicMcpConfig): void {
  server.tool(
    "query_contract",
    `Query a registered smart contract function with automatic binary encoding/decoding.

Use register_contract first to define the contract's functions and their field schemas. Then call this tool by contract name and function name.

Input values are provided as a JSON object with field names as keys. For example: {"gateId": 1}

The response is automatically decoded into human-readable named fields.`,
    {
      contract: z.string().min(1).describe("Name of the registered contract"),
      function: z.string().min(1).describe("Name of the function to call"),
      input: z
        .string()
        .optional()
        .describe(
          'JSON object of named input parameters (e.g., {"gateId": 1}). Omit for functions with no input.',
        ),
    },
    async ({ contract: contractName, function: funcName, input: inputJson }) => {
      // Resolve contract and function
      const resolved = getContractFunction(contractName, funcName);
      if ("error" in resolved) {
        return {
          content: [{ type: "text" as const, text: resolved.error }],
          isError: true,
        };
      }

      const { contract, fn } = resolved;

      try {
        // Parse input values
        let inputValues: Record<string, unknown> = {};
        if (inputJson) {
          try {
            const parsed = JSON.parse(inputJson);
            if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
              return {
                content: [
                  {
                    type: "text" as const,
                    text: 'Input must be a JSON object (e.g., {"gateId": 1}).',
                  },
                ],
                isError: true,
              };
            }
            inputValues = parsed as Record<string, unknown>;
          } catch {
            return {
              content: [{ type: "text" as const, text: "Invalid JSON in input parameter." }],
              isError: true,
            };
          }
        }

        // Encode input
        const inputSize = totalByteSize(fn.input);
        let requestData = "";
        if (inputSize > 0) {
          const encoded = encodeFields(fn.input, inputValues);
          requestData = uint8ArrayToBase64(encoded);
        }

        // Make the RPC call
        const body: Record<string, unknown> = {
          contractIndex: contract.contractIndex,
          inputType: fn.inputType,
          inputSize,
        };
        if (requestData.length > 0) {
          body["requestData"] = requestData;
        }

        const response = await rpcPost(config, "/v1/querySmartContract", body);
        const responseData = getField(response, "responseData") as string | undefined;

        if (!responseData) {
          return {
            content: [
              {
                type: "text" as const,
                text: [
                  `${contract.name}.${fn.name} — No response data`,
                  ``,
                  `Contract index: ${String(contract.contractIndex)}`,
                  `Input type: ${String(fn.inputType)}`,
                ].join("\n"),
              },
            ],
          };
        }

        // Decode output
        const responseBytes = base64ToUint8Array(responseData);
        const expectedSize = totalByteSize(fn.output);

        if (fn.output.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: [
                  `${contract.name}.${fn.name}`,
                  `${"=".repeat(contract.name.length + fn.name.length + 1)}`,
                  ``,
                  `Response (${String(responseBytes.length)} bytes, base64): ${responseData}`,
                ].join("\n"),
              },
            ],
          };
        }

        if (responseBytes.length < expectedSize) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Response too short: expected ${String(expectedSize)} bytes, got ${String(responseBytes.length)}. Raw base64: ${responseData}`,
              },
            ],
            isError: true,
          };
        }

        const decoded = decodeFields(fn.output, responseBytes);
        const header = `${contract.name}.${fn.name}`;

        const lines = [header, "=".repeat(header.length), ``, formatDecodedOutput(decoded)];

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error querying ${contract.name}.${fn.name}: ${message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
