import { getFood } from "./food.js";
import { scientistSalaryBill } from "./labs.js";
import { moraleDesertionThresholdBonus } from "./research.js";
import type { ActionResult, GameState, UpkeepResult } from "./types.js";

/** Abstract meal servings billed per soldier per month. */
export const MEALS_PER_MONTH = 20;

export const LOYALTY_DESERT_THRESHOLD = 40;

export function setMealPlan(
  state: GameState,
  foodId: string,
): ActionResult {
  const food = getFood(foodId);
  if (!food) {
    return { ok: false, state, message: `Unknown meal: ${foodId}` };
  }
  if (food.recipeId && !state.researchUnlocked.includes(food.recipeId)) {
    return {
      ok: false,
      state,
      message: `Meal locked (research ${food.recipeId}).`,
    };
  }
  return {
    ok: true,
    state: { ...state, mealPlanId: foodId },
    message: `Meal plan: ${food.name} ($${food.productionCost}/serving, happiness ${food.happiness}).`,
  };
}

/**
 * Pay salary then meals; apply loyalty deltas; roll desertion when loyalty &lt; 40.
 */
export function resolveMonthlyUpkeep(
  state: GameState,
): ActionResult<UpkeepResult> {
  const living = state.company.soldiers.filter((s) => s.alive);
  const notes: string[] = [];
  let funds = state.funds;
  let salaryPaid = 0;
  let foodPaid = 0;
  let salaryShort = false;
  let foodShort = false;

  const troopSalary = living.reduce((n, s) => n + s.salary, 0);
  const sciSalary = scientistSalaryBill(state);
  const salaryBill = troopSalary + sciSalary;
  if (funds >= salaryBill) {
    funds -= salaryBill;
    salaryPaid = salaryBill;
  } else {
    salaryShort = true;
    salaryPaid = funds;
    funds = 0;
    notes.push("Salary shortfall — loyalty −8.");
  }
  if (sciSalary > 0 && !salaryShort) {
    notes.push(`Scientists $${sciSalary.toFixed(0)}.`);
  }

  const food = getFood(state.mealPlanId) ?? getFood("army-stew")!;
  const foodBill = living.length * food.productionCost * MEALS_PER_MONTH;
  if (funds >= foodBill) {
    funds -= foodBill;
    foodPaid = foodBill;
  } else if (living.length > 0) {
    foodShort = true;
    foodPaid = funds;
    funds = 0;
    notes.push("Food shortfall — loyalty −10.");
  }

  let soldiers = living.map((s) => {
    let loyalty = s.loyalty;
    if (salaryShort) loyalty -= 8;
    if (foodShort) loyalty -= 10;
    if (!salaryShort && !foodShort) {
      loyalty += food.happiness;
    }
    loyalty = Math.min(100, Math.max(0, loyalty));
    return { ...s, loyalty };
  });

  // Include dead unchanged
  const livingIds = new Set(living.map((s) => s.id));
  const fullRoster = state.company.soldiers.map((s) => {
    if (!livingIds.has(s.id)) return s;
    return soldiers.find((x) => x.id === s.id) ?? s;
  });

  const desertThreshold = Math.max(
    20,
    LOYALTY_DESERT_THRESHOLD - moraleDesertionThresholdBonus(state),
  );

  let deserted = 0;
  const kept = fullRoster.filter((s) => {
    if (!s.alive) return true;
    if (s.loyalty >= desertThreshold) return true;
    const chance = Math.min(0.45, ((desertThreshold - s.loyalty) * 1.5) / 100);
    // Deterministic-ish from id + turn for replay stability
    let h = state.turn * 17;
    for (let i = 0; i < s.id.length; i++) h = (h * 31 + s.id.charCodeAt(i)) >>> 0;
    const roll = (h % 1000) / 1000;
    if (roll < chance) {
      deserted += 1;
      return false;
    }
    return true;
  });

  if (deserted > 0) {
    notes.push(`${deserted} deserted (loyalty < ${desertThreshold}).`);
  }

  // Clear unit membership for removed soldiers
  const keptIds = new Set(kept.map((s) => s.id));
  const squads = state.squads.map((u) => ({
    ...u,
    soldierIds: u.soldierIds.filter((id) => keptIds.has(id)),
    commanderSoldierId:
      u.commanderSoldierId && keptIds.has(u.commanderSoldierId)
        ? u.commanderSoldierId
        : u.commanderSoldierId && !keptIds.has(u.commanderSoldierId)
          ? null
          : u.commanderSoldierId,
  }));

  const next: GameState = {
    ...state,
    funds,
    company: { ...state.company, soldiers: kept },
    squads,
  };

  const sciNote =
    sciSalary > 0 ? ` incl. sci $${sciSalary.toFixed(0)}` : "";
  const summary =
    `Upkeep: salary $${salaryPaid.toFixed(0)}${sciNote}` +
    `${salaryShort ? " (short)" : ""}, meals $${foodPaid.toFixed(0)}` +
    `${foodShort ? " (short)" : ""} (${food.name})` +
    `${deserted ? `, deserted ${deserted}` : ""}.`;

  return {
    ok: true,
    state: next,
    message: summary,
    data: {
      salaryPaid,
      foodPaid,
      salaryShort,
      foodShort,
      deserted,
      loyaltyNotes: notes,
    },
  };
}

/** Apply mission outcome loyalty to living soldiers. */
export function applyMissionMorale(
  state: GameState,
  won: boolean,
): GameState {
  const delta = won ? 6 : -12;
  const soldiers = state.company.soldiers.map((s) => {
    if (!s.alive) return s;
    return {
      ...s,
      loyalty: Math.min(100, Math.max(0, s.loyalty + delta)),
    };
  });
  return { ...state, company: { ...state.company, soldiers } };
}
