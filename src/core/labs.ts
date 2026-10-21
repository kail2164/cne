import type {
  ActionResult,
  GameState,
  OwnedResearchFacility,
  ResearchFacilityTierDef,
  ResearchFacilityTierId,
  Scientist,
} from "./types.js";

/** Base RP each housed scientist produces per month (before facility mults). */
export const RP_PER_SCIENTIST = 2;
export const SCIENTIST_HIRE_COST = 150;
export const SCIENTIST_SALARY = 12;
export const MAX_FACILITY_STAGE = 5;

export const RESEARCH_FACILITY_TIERS: ResearchFacilityTierDef[] = [
  {
    id: "shed",
    name: "Field Research Shed",
    baseBuildCost: 500,
    baseCapacity: 2,
    tierRpMult: 1.0,
  },
  {
    id: "lab",
    name: "Research Laboratory",
    baseBuildCost: 1000,
    baseCapacity: 3,
    tierRpMult: 1.1,
  },
  {
    id: "institute",
    name: "Research Institute",
    baseBuildCost: 2000,
    baseCapacity: 4,
    tierRpMult: 1.25,
  },
  {
    id: "campus",
    name: "Science Campus",
    baseBuildCost: 4000,
    baseCapacity: 5,
    tierRpMult: 1.4,
  },
  {
    id: "academy",
    name: "Military Academy Labs",
    baseBuildCost: 8000,
    baseCapacity: 6,
    tierRpMult: 1.6,
  },
];

export function getResearchFacilityTier(
  id: string,
): ResearchFacilityTierDef | undefined {
  return RESEARCH_FACILITY_TIERS.find((t) => t.id === id);
}

/** Stage RP efficiency: 1.5^(stage−1). */
export function facilityStageEff(stage: number): number {
  const s = Math.min(MAX_FACILITY_STAGE, Math.max(1, Math.floor(stage)));
  return Math.pow(1.5, s - 1);
}

/** Seats: baseCapacity + (stage − 1). */
export function facilityCapacity(fac: OwnedResearchFacility): number {
  const tier = getResearchFacilityTier(fac.tierId)!;
  const stage = Math.min(MAX_FACILITY_STAGE, Math.max(1, fac.stage));
  return tier.baseCapacity + (stage - 1);
}

export function facilityRpMult(fac: OwnedResearchFacility): number {
  const tier = getResearchFacilityTier(fac.tierId)!;
  return tier.tierRpMult * facilityStageEff(fac.stage);
}

export function nextFacilityTierPrice(
  state: GameState,
  tierId: ResearchFacilityTierId,
): number {
  const tier = getResearchFacilityTier(tierId)!;
  return state.researchFacilityTierNextPrice[tierId] ?? tier.baseBuildCost;
}

export function facilityUpgradeCost(fac: OwnedResearchFacility): number | null {
  if (fac.stage >= MAX_FACILITY_STAGE) return null;
  const tier = getResearchFacilityTier(fac.tierId)!;
  return Math.round(tier.baseBuildCost * 0.35 * fac.stage);
}

export function totalScientistCapacity(state: GameState): number {
  return state.researchFacilities.reduce((n, f) => n + facilityCapacity(f), 0);
}

export function freeScientistSeats(state: GameState): number {
  return Math.max(0, totalScientistCapacity(state) - state.scientists.length);
}

export function createResearchFacility(
  id: string,
  tierId: ResearchFacilityTierId,
  stage = 1,
): OwnedResearchFacility {
  return { id, tierId, stage, scientistIds: [] };
}

export function startingResearchShed(): OwnedResearchFacility {
  return createResearchFacility("lab-1", "shed", 1);
}

export function startingScientist(facilityId: string): Scientist {
  return {
    id: "sci-1",
    name: "Dr. Hale",
    salary: SCIENTIST_SALARY,
    facilityId,
  };
}

/** Projected lab RP for current staffing (no state change). */
export function projectedLabRp(state: GameState): number {
  let total = 0;
  for (const fac of state.researchFacilities) {
    const mult = facilityRpMult(fac);
    const count = fac.scientistIds.length;
    total += Math.floor(count * RP_PER_SCIENTIST * mult);
  }
  return total;
}

export function scientistSalaryBill(state: GameState): number {
  return state.scientists.reduce((n, s) => n + s.salary, 0);
}

function findOpenFacility(
  state: GameState,
): OwnedResearchFacility | undefined {
  return state.researchFacilities.find(
    (f) => f.scientistIds.length < facilityCapacity(f),
  );
}

export function describeResearchFacilities(state: GameState): string[] {
  const lines = state.researchFacilities.map((f, i) => {
    const tier = getResearchFacilityTier(f.tierId)!;
    const cap = facilityCapacity(f);
    const mult = facilityRpMult(f);
    const rp =
      Math.floor(f.scientistIds.length * RP_PER_SCIENTIST * mult);
    return (
      `${i + 1}. [${f.id}] ${tier.name} stage ${f.stage}/${MAX_FACILITY_STAGE} ` +
      `seats ${f.scientistIds.length}/${cap} (×${mult.toFixed(2)} → ${rp} RP/mo)`
    );
  });
  lines.push(
    `  Staff ${state.scientists.length}/${totalScientistCapacity(state)} | ` +
      `projected ${projectedLabRp(state)} RP/mo | hire $${SCIENTIST_HIRE_COST} (salary $${SCIENTIST_SALARY}/mo)`,
  );
  return lines;
}

export function hireScientist(
  state: GameState,
): ActionResult<{ scientist: Scientist }> {
  if (freeScientistSeats(state) <= 0) {
    return {
      ok: false,
      state,
      message: `No free lab seats (${state.scientists.length}/${totalScientistCapacity(state)}). Build or upgrade a facility.`,
    };
  }
  if (state.funds < SCIENTIST_HIRE_COST) {
    return {
      ok: false,
      state,
      message: `Need $${SCIENTIST_HIRE_COST} to hire a scientist (have $${state.funds.toFixed(0)}).`,
    };
  }
  const fac = findOpenFacility(state);
  if (!fac) {
    return { ok: false, state, message: "No open facility seat (internal)." };
  }

  const id = `sci-${state.scientists.length + 1}`;
  const scientist: Scientist = {
    id,
    name: `Scientist ${state.scientists.length + 1}`,
    salary: SCIENTIST_SALARY,
    facilityId: fac.id,
  };

  const researchFacilities = state.researchFacilities.map((f) =>
    f.id === fac.id
      ? { ...f, scientistIds: [...f.scientistIds, id] }
      : f,
  );

  return {
    ok: true,
    state: {
      ...state,
      funds: state.funds - SCIENTIST_HIRE_COST,
      scientists: [...state.scientists, scientist],
      researchFacilities,
    },
    message: `Hired ${scientist.name} (−$${SCIENTIST_HIRE_COST}) → ${fac.id}. Salary $${SCIENTIST_SALARY}/mo.`,
    data: { scientist },
  };
}

export function buyResearchFacility(
  state: GameState,
  tierId: ResearchFacilityTierId,
): ActionResult<{ facility: OwnedResearchFacility; price: number }> {
  const tier = getResearchFacilityTier(tierId);
  if (!tier) {
    return { ok: false, state, message: `Unknown facility tier: ${tierId}` };
  }
  const price = nextFacilityTierPrice(state, tierId);
  if (state.funds < price) {
    return {
      ok: false,
      state,
      message: `Need $${price} to build ${tier.name} (have $${state.funds.toFixed(0)}).`,
    };
  }
  const id = `lab-${state.researchFacilities.length + 1}`;
  const facility = createResearchFacility(id, tierId, 1);
  const nextPrice = price * 2;
  return {
    ok: true,
    state: {
      ...state,
      funds: state.funds - price,
      researchFacilities: [...state.researchFacilities, facility],
      researchFacilityTierNextPrice: {
        ...state.researchFacilityTierNextPrice,
        [tierId]: nextPrice,
      },
    },
    message: `Built ${tier.name} for $${price} (${tier.baseCapacity} seats). Next ${tier.name} costs $${nextPrice}.`,
    data: { facility, price },
  };
}

export function upgradeResearchFacility(
  state: GameState,
  facilityId: string,
): ActionResult<{ facility: OwnedResearchFacility }> {
  const idx = state.researchFacilities.findIndex((f) => f.id === facilityId);
  if (idx < 0) {
    return { ok: false, state, message: `Unknown facility: ${facilityId}` };
  }
  const fac = state.researchFacilities[idx]!;
  const cost = facilityUpgradeCost(fac);
  if (cost == null) {
    return {
      ok: false,
      state,
      message: `${fac.id} already at stage ${MAX_FACILITY_STAGE}.`,
    };
  }
  if (state.funds < cost) {
    return {
      ok: false,
      state,
      message: `Need $${cost} to upgrade ${fac.id} (have $${state.funds.toFixed(0)}).`,
    };
  }
  const updated: OwnedResearchFacility = { ...fac, stage: fac.stage + 1 };
  const researchFacilities = state.researchFacilities.map((f, i) =>
    i === idx ? updated : f,
  );
  const cap = facilityCapacity(updated);
  return {
    ok: true,
    state: {
      ...state,
      funds: state.funds - cost,
      researchFacilities,
    },
    message: `Upgraded ${fac.id} to stage ${updated.stage} (−$${cost}). Capacity ${cap}, eff ×${facilityRpMult(updated).toFixed(2)}.`,
    data: { facility: updated },
  };
}

/** Award lab RP for the month; returns new state + amount earned. */
export function awardLabRp(
  state: GameState,
): { state: GameState; earned: number } {
  const earned = projectedLabRp(state);
  if (earned <= 0) {
    return { state, earned: 0 };
  }
  return {
    state: { ...state, researchPoints: state.researchPoints + earned },
    earned,
  };
}
