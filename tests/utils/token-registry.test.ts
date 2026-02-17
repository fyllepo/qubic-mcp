import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { fetchTokenList } from "../../src/utils/token-registry.js";

describe("fetchTokenList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses response with tokens array", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          tokens: [
            { name: "CFB", issuer: "A".repeat(60), website: "https://cfbtoken.com/" },
            { name: "RANDOM", issuer: "B".repeat(60) },
          ],
        }),
    });

    const tokens = await fetchTokenList();
    expect(tokens.length).toBe(2);
    expect(tokens[0]!.name).toBe("CFB");
    expect(tokens[1]!.name).toBe("RANDOM");
  });

  it("handles flat array response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          { name: "CFB", issuer: "A".repeat(60) },
        ]),
    });

    const tokens = await fetchTokenList();
    expect(tokens.length).toBe(1);
    expect(tokens[0]!.name).toBe("CFB");
  });

  it("returns empty array when no tokens", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ tokens: [] }),
    });

    const tokens = await fetchTokenList();
    expect(tokens.length).toBe(0);
  });

  it("throws on network error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: () => Promise.resolve(""),
    });

    await expect(fetchTokenList()).rejects.toThrow("HTTP error");
  });
});
