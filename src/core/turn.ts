import { progressCombatMonth } from "./combat.js";
import { resolveFactoryMonth, unlockAllFactorySlots } from "./factory.js";
import { resolveMonthlyUpkeep } from "./upkeep.js";
import type { ActionResult, BarrackDuty, EndTurnResult, GameState } from "./types.js";

function advanceCalendar(year: number, month: number): { year: number; month: number } {
  if (month >= 12) return { year: year + 1, month: 1 };
  return { year, month: month + 1 };
}

function tickWounded(state: GameState): GameState {
  const soldiers = state.company.soldiers.map((s) => {
    if (!s.alive || s.duty !== "wounded" || s.woundedRestTicks <= 0) return s;
    const rest = s.woundedRestTicks - 1;
    if (rest <= 0) {
      const duty: BarrackDuty = s.squadId ? "ready" : "unassigned";
      return {
        ...s,
        woundedRestTicks: 0,
        duty,
        hp: Math.max(s.hp, Math.floor(s.maxHp * 0.7)),
      };
    }
    return { ...s, woundedRestTicks: rest };
  });
  return { ...state, company: { ...state.company, soldiers } };
}

/**
 * End turn (= 1 month):
 * factory → unlock → combat month → upkeep (salary/food/desertion) → calendar → wounded.
 */
export function endTurn(state: GameState): ActionResult<EndTurnResult> {
  const previousYear = state.year;
  const previousMonth = state.month;

  const production = resolveFactoryMonth(state);
  let next = unlockAllFactorySlots(production.state);

  const hadMission = Boolean(next.activeMission);
  const combat = progressCombatMonth(next);
  next = combat.state;
  const combatNote = hadMission ? combat.message : null;
  const missionResolved = combat.data?.resolved ?? null;

  const upkeep = resolveMonthlyUpkeep(next);
  next = upkeep.state;

  const cal = advanceCalendar(next.year, next.month);
  next = {
    ...next,
    year: cal.year,
    month: cal.month,
    turn: next.turn + 1,
  };

  next = tickWounded(next);

  const label = `${cal.year}-${String(cal.month).padStart(2, "0")}`;
  const combatPart = combatNote ? ` ${combatNote}` : "";
  const upkeepPart = upkeep.message ? ` ${upkeep.message}` : "";
  return {
    ok: true,
    state: next,
    message: `End turn → ${label} (turn ${next.turn}). ${production.message}.${combatPart}${upkeepPart}`,
    data: {
      production: production.data ?? {
        producedAmmo: 0,
        producedRifles: 0,
        producedGears: 0,
        producedGrenades: 0,
        fundsSpent: 0,
        shortfalls: [],
        warehouseNotes: [],
        lines: [],
      },
      combatNote,
      missionResolved,
      upkeep: upkeep.data ?? null,
      previousMonth,
      previousYear,
      month: next.month,
      year: next.year,
      turn: next.turn,
    },
  };
}

export function formatDate(state: GameState): string {
  return `${state.year}-${String(state.month).padStart(2, "0")} (turn ${state.turn})`;
}
