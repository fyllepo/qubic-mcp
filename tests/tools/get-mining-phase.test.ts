import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMiningPhaseTool } from "../../src/tools/get-mining-phase.js";
import { calculatePhase, calculateDayType } from "../../src/tools/get-mining-phase.js";
import type { QubicMcpConfig } from "../../src/config/index.js";

const config: QubicMcpConfig = {
  rpcUrl: "https://rpc.qubic.org",
  apiUrl: "https://api.qubic.org",
};

describe("get_mining_phase tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    expect(() => registerMiningPhaseTool(server, config)).not.toThrow();
  });
});

describe("calculatePhase", () => {
  it("returns MINING at the start of a cycle", () => {
    // Tick 0 = start of cycle 0, should be MINING
    const result = calculatePhase(0);
    expect(result.phase).toBe("MINING");
    expect(result.cycleNumber).toBe(0);
    expect(result.tickInCycle).toBe(0);
    expect(result.phaseTicksRemaining).toBe(676);
  });

  it("returns MINING at tick 675 (last mining tick)", () => {
    const result = calculatePhase(675);
    expect(result.phase).toBe("MINING");
    expect(result.phaseTicksRemaining).toBe(1);
  });

  it("returns IDLE at tick 676 (first idle tick)", () => {
    const result = calculatePhase(676);
    expect(result.phase).toBe("IDLE");
    expect(result.phaseTicksRemaining).toBe(677);
  });

  it("returns IDLE at tick 1352 (last tick of cycle)", () => {
    const result = calculatePhase(1352);
    expect(result.phase).toBe("IDLE");
    expect(result.cycleNumber).toBe(0);
    expect(result.phaseTicksRemaining).toBe(1);
  });

  it("wraps to next cycle at tick 1353", () => {
    const result = calculatePhase(1353);
    expect(result.phase).toBe("MINING");
    expect(result.cycleNumber).toBe(1);
    expect(result.tickInCycle).toBe(0);
  });

  // Verified against minerlab API: tick 44197084, cycle 32665, IDLE
  it("matches minerlab for tick 44197084", () => {
    const result = calculatePhase(44197084);
    expect(result.cycleNumber).toBe(32665);
    expect(result.phase).toBe("IDLE");
  });

  // Verified against minerlab API: cycleStartTick 44195745 = start of cycle 32665
  it("matches minerlab cycle start tick", () => {
    const result = calculatePhase(44195745);
    expect(result.cycleNumber).toBe(32665);
    expect(result.tickInCycle).toBe(0);
    expect(result.phase).toBe("MINING");
  });
});

describe("calculateDayType", () => {
  // Reference: Wednesday Feb 11, 2026 12:00 UTC = day 0 = QUBIC
  const refWed = Date.UTC(2026, 1, 11, 12, 0, 0);

  it("returns QUBIC on the reference Wednesday", () => {
    expect(calculateDayType(refWed)).toBe("QUBIC");
  });

  it("returns QUBIC 12 hours into the reference day", () => {
    expect(calculateDayType(refWed + 12 * 3600 * 1000)).toBe("QUBIC");
  });

  it("returns XMR on Thursday (day 1)", () => {
    const thu = refWed + 24 * 3600 * 1000;
    expect(calculateDayType(thu)).toBe("XMR");
  });

  it("returns QUBIC on Friday (day 2)", () => {
    const fri = refWed + 2 * 24 * 3600 * 1000;
    expect(calculateDayType(fri)).toBe("QUBIC");
  });

  it("returns XMR on Saturday (day 3)", () => {
    const sat = refWed + 3 * 24 * 3600 * 1000;
    expect(calculateDayType(sat)).toBe("XMR");
  });

  // Verified against minerlab: Mon Feb 16 2026 21:30 UTC = XMR
  it("matches minerlab for Mon Feb 16 2026 21:30 UTC", () => {
    const monEvening = Date.UTC(2026, 1, 16, 21, 30, 0);
    expect(calculateDayType(monEvening)).toBe("XMR");
  });
});
