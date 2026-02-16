export interface QubicMcpConfig {
  rpcUrl: string;
  apiUrl: string;
}

export function getConfig(): QubicMcpConfig {
  return {
    rpcUrl: process.env["QUBIC_RPC_URL"] ?? "https://rpc.qubic.org",
    apiUrl: process.env["QUBIC_API_URL"] ?? "https://api.qubic.org",
  };
}
