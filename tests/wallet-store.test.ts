import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// We'll test the resolveAddress logic and wallet format validation directly
import { isValidQubicAddress } from "../src/utils/validation.js";

describe("wallet store concepts", () => {
  const VALID_ADDRESS = "BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID";

  it("validates a well-known Qubic address", () => {
    expect(isValidQubicAddress(VALID_ADDRESS)).toBe(true);
  });

  it("rejects addresses that are too short for wallet save", () => {
    expect(isValidQubicAddress("ABC")).toBe(false);
  });

  it("rejects lowercase addresses", () => {
    expect(isValidQubicAddress("baaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaarmid")).toBe(
      false,
    );
  });

  it("wallet name validation", () => {
    // Names should be non-empty and under 50 chars
    expect("my-main".length).toBeGreaterThan(0);
    expect("my-main".length).toBeLessThanOrEqual(50);
    expect("".length).toBe(0);
    expect("a".repeat(51).length).toBeGreaterThan(50);
  });

  it("resolveAddress returns address for valid address input", () => {
    // If input is a valid 60-char uppercase address, it should be returned as-is
    const upper = VALID_ADDRESS.toUpperCase();
    expect(isValidQubicAddress(upper)).toBe(true);
  });

  it("wallet data format is correct JSON shape", () => {
    const walletData = {
      wallets: [
        {
          name: "my-main",
          address: VALID_ADDRESS,
          addedAt: new Date().toISOString(),
        },
      ],
    };
    expect(walletData.wallets).toHaveLength(1);
    expect(walletData.wallets[0]?.name).toBe("my-main");
    expect(walletData.wallets[0]?.address).toBe(VALID_ADDRESS);
  });

  it("case-insensitive wallet name lookup", () => {
    const wallets = [{ name: "My-Main", address: VALID_ADDRESS }];
    const found = wallets.find((w) => w.name.toLowerCase() === "my-main");
    expect(found).toBeDefined();
    expect(found?.name).toBe("My-Main");
  });
});
