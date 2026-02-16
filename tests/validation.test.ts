import { describe, it, expect } from "vitest";
import { isValidQubicAddress } from "../src/utils/validation.js";

describe("isValidQubicAddress", () => {
  it("accepts a valid 60-character uppercase address", () => {
    const valid = "A".repeat(60);
    expect(isValidQubicAddress(valid)).toBe(true);
  });

  it("accepts a mixed uppercase address", () => {
    const valid = "ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGH";
    expect(isValidQubicAddress(valid)).toBe(true);
  });

  it("rejects lowercase letters", () => {
    const invalid = "a".repeat(60);
    expect(isValidQubicAddress(invalid)).toBe(false);
  });

  it("rejects addresses shorter than 60 characters", () => {
    const short = "A".repeat(59);
    expect(isValidQubicAddress(short)).toBe(false);
  });

  it("rejects addresses longer than 60 characters", () => {
    const long = "A".repeat(61);
    expect(isValidQubicAddress(long)).toBe(false);
  });

  it("rejects addresses with numbers", () => {
    const withNumbers = "A".repeat(50) + "1234567890";
    expect(isValidQubicAddress(withNumbers)).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidQubicAddress("")).toBe(false);
  });

  it("rejects addresses with special characters", () => {
    const withSpecial = "A".repeat(59) + "!";
    expect(isValidQubicAddress(withSpecial)).toBe(false);
  });
});
