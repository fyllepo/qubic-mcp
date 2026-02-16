/**
 * Validates a Qubic address (60 uppercase alpha characters).
 */
export function isValidQubicAddress(address: string): boolean {
  return /^[A-Z]{60}$/.test(address);
}
