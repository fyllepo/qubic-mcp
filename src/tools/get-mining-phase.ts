import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { QubicMcpConfig } from "../config/index.js";
import { rpcGet } from "../utils/qubic-rpc.js";
import { formatNumber, getField, progressBar } from "../utils/format.js";

/**
 * Qubic network cycles: every 1,353 ticks the network alternates between
 * a MINING phase (676 ticks) and an IDLE phase (677 ticks).
 * Cycles are global, counted from tick 0.
 *
 * Separately, the network alternates 24-hour periods (starting at 12:00 UTC
 * each Wednesday) between "Qubic" days and "XMR marathon" days.
 * On XMR marathon days, miners produce Monero instead of Qubic AI solutions.
 */

const MINING_PHASE_TICKS = 676;
const IDLE_PHASE_TICKS = 677;
const CYCLE_TICKS = MINING_PHASE_TICKS + IDLE_PHASE_TICKS; // 1353

/** Reference Wednesday 12:00 UTC — epoch 200 started near Wed Feb 11 2026. */
const WEDNESDAY_REF_MS = Date.UTC(2026, 1, 11, 12, 0, 0); // Feb 11 2026 12:00 UTC
const DAY_MS = 24 * 60 * 60 * 1000;

interface TickInfo {
  tick: number;
  duration: number;
  epoch: number;
  initialTick: number;
}

export type Phase = "MINING" | "IDLE";
export type DayType = "QUBIC" | "XMR";

export interface MiningPhaseInfo {
  currentTick: number;
  epoch: number;
  phase: Phase;
  cycleNumber: number;
  tickInCycle: number;
  cycleProgress: number;
  phaseTicksRemaining: number;
  nextPhase: Phase;
  dayType: DayType;
  isXmrMarathon: boolean;
}

export function calculatePhase(tick: number): {
  phase: Phase;
  cycleNumber: number;
  tickInCycle: number;
  phaseTicksRemaining: number;
} {
  const cycleNumber = Math.floor(tick / CYCLE_TICKS);
  const tickInCycle = tick % CYCLE_TICKS;

  if (tickInCycle < MINING_PHASE_TICKS) {
    return {
      phase: "MINING",
      cycleNumber,
      tickInCycle,
      phaseTicksRemaining: MINING_PHASE_TICKS - tickInCycle,
    };
  }
  return {
    phase: "IDLE",
    cycleNumber,
    tickInCycle,
    phaseTicksRemaining: CYCLE_TICKS - tickInCycle,
  };
}

export function calculateDayType(nowMs: number = Date.now()): DayType {
  const dayIndex = Math.floor((nowMs - WEDNESDAY_REF_MS) / DAY_MS);
  // Even days (0, 2, 4…) = Qubic, odd days (1, 3, 5…) = XMR
  return dayIndex % 2 === 0 ? "QUBIC" : "XMR";
}

function formatMiningPhase(info: MiningPhaseInfo): string {
  const phaseIcon = info.phase === "MINING" ? "⛏" : "⏸";
  const dayIcon = info.isXmrMarathon ? "⛰" : "🧠";
  const lines = [
    `Qubic Mining Phase`,
    `══════════════════`,
    ``,
    `${phaseIcon}  Phase: ${info.phase}`,
    `${dayIcon}  Day Type: ${info.isXmrMarathon ? "XMR Marathon (Monero mining)" : "Qubic (AI solutions)"}`,
    ``,
    `Cycle #${formatNumber(info.cycleNumber)}:`,
    `  ${formatNumber(info.tickInCycle)} / ${formatNumber(CYCLE_TICKS)} ticks`,
    `  ${progressBar(info.cycleProgress)}`,
    `  ⏭ ${formatNumber(info.phaseTicksRemaining)} ticks until ${info.nextPhase}`,
    ``,
    `Network:`,
    `  Current Tick: ${formatNumber(info.currentTick)}`,
    `  Epoch: ${String(info.epoch)}`,
    ``,
    `Cycle: MINING (${String(MINING_PHASE_TICKS)} ticks) → IDLE (${String(IDLE_PHASE_TICKS)} ticks)`,
  ];
  return lines.join("\n");
}

export function registerMiningPhaseTool(server: McpServer, config: QubicMcpConfig): void {
  server.tool(
    "get_mining_phase",
    "Get the current Qubic mining phase (MINING or IDLE) and whether it's an XMR marathon day. The network alternates between mining and idle phases every ~1,353 ticks, and between Qubic AI solution days and XMR mining days every 24 hours.",
    {},
    async () => {
      try {
        const response = await rpcGet(config, "/v1/tick-info");
        const tickInfo = getField(response, "tickInfo") as TickInfo | undefined;

        if (!tickInfo) {
          return {
            content: [{ type: "text" as const, text: "Unable to parse tick info response." }],
            isError: true,
          };
        }

        const { phase, cycleNumber, tickInCycle, phaseTicksRemaining } = calculatePhase(
          tickInfo.tick,
        );
        const dayType = calculateDayType();

        const info: MiningPhaseInfo = {
          currentTick: tickInfo.tick,
          epoch: tickInfo.epoch,
          phase,
          cycleNumber,
          tickInCycle,
          cycleProgress: tickInCycle / CYCLE_TICKS,
          phaseTicksRemaining,
          nextPhase: phase === "MINING" ? "IDLE" : "MINING",
          dayType,
          isXmrMarathon: dayType === "XMR",
        };

        return {
          content: [{ type: "text" as const, text: formatMiningPhase(info) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error fetching mining phase: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
