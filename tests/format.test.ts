import { describe, it, expect } from "vitest";
import { formatNumber, formatQU, getField, formatTimestamp } from "../src/utils/format.js";

describe("formatNumber", () => {
  it("formats small numbers", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(999)).toBe("999");
  });

  it("formats large numbers with commas", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1000000)).toBe("1,000,000");
  });

  it("formats string numbers (big balances)", () => {
    expect(formatNumber("269641214330")).toBe("269,641,214,330");
    expect(formatNumber("165601695595996")).toBe("165,601,695,595,996");
  });
});

describe("formatQU", () => {
  it("formats QU amounts", () => {
    expect(formatQU("269641214330")).toBe("269,641,214,330 QU");
    expect(formatQU(0)).toBe("0 QU");
  });
});

describe("getField", () => {
  it("extracts nested fields", () => {
    const obj = { balance: { id: "ABC", amount: 100 } };
    expect(getField(obj, "balance", "id")).toBe("ABC");
    expect(getField(obj, "balance", "amount")).toBe(100);
  });

  it("returns undefined for missing fields", () => {
    const obj = { foo: { bar: 1 } };
    expect(getField(obj, "missing")).toBeUndefined();
    expect(getField(obj, "foo", "missing")).toBeUndefined();
  });

  it("returns undefined for null/undefined input", () => {
    expect(getField(null, "foo")).toBeUndefined();
    expect(getField(undefined, "foo")).toBeUndefined();
  });

  it("extracts top-level fields", () => {
    expect(getField({ data: "hello" }, "data")).toBe("hello");
  });
});

describe("formatTimestamp", () => {
  it("formats millisecond timestamp strings", () => {
    const result = formatTimestamp("1771247884000");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns N/A for zero", () => {
    expect(formatTimestamp(0)).toBe("N/A");
    expect(formatTimestamp("0")).toBe("N/A");
  });
});
