import type {
  CombatTerrain,
  CombatType,
  Contract,
  ContractTier,
  GameState,
} from "./types.js";

export const BOARD_SIZE = 10;
export const COMPLETIONS_PER_TIER = 20;

export const TIER_ORDER: ContractTier[] = [
  "local",
  "province",
  "interstate",
  "national",
  "global",
];

const TIER_LABEL: Record<ContractTier, string> = {
  local: "Local Regions",
  province: "Nearby Provinces",
  interstate: "Interstates",
  national: "National",
  global: "Global",
};

type TierTemplate = {
  manpowerRequired: number;
  minPower: number;
  oppositionHp: number;
  oppositionDamagePerTurn: number;
  turnsNeeded: number;
  cashReward: number;
  lootMaterials: number;
  baseSuccessChance: number;
  recommendedAmmoPerSoldier: number;
};

const TIER_STATS: Record<ContractTier, TierTemplate> = {
  local: {
    manpowerRequired: 12,
    minPower: 140,
    oppositionHp: 380,
    oppositionDamagePerTurn: 28,
    turnsNeeded: 2,
    cashReward: 400,
    lootMaterials: 80,
    baseSuccessChance: 72,
    recommendedAmmoPerSoldier: 35,
  },
  province: {
    manpowerRequired: 28,
    minPower: 300,
    oppositionHp: 620,
    oppositionDamagePerTurn: 36,
    turnsNeeded: 3,
    cashReward: 900,
    lootMaterials: 160,
    baseSuccessChance: 65,
    recommendedAmmoPerSoldier: 45,
  },
  interstate: {
    manpowerRequired: 45,
    minPower: 500,
    oppositionHp: 900,
    oppositionDamagePerTurn: 44,
    turnsNeeded: 3,
    cashReward: 1800,
    lootMaterials: 280,
    baseSuccessChance: 60,
    recommendedAmmoPerSoldier: 55,
  },
  national: {
    manpowerRequired: 70,
    minPower: 800,
    oppositionHp: 1300,
    oppositionDamagePerTurn: 52,
    turnsNeeded: 4,
    cashReward: 3500,
    lootMaterials: 450,
    baseSuccessChance: 55,
    recommendedAmmoPerSoldier: 65,
  },
  global: {
    manpowerRequired: 100,
    minPower: 1200,
    oppositionHp: 1800,
    oppositionDamagePerTurn: 60,
    turnsNeeded: 5,
    cashReward: 7000,
    lootMaterials: 700,
    baseSuccessChance: 50,
    recommendedAmmoPerSoldier: 80,
  },
};

const NAMES: Record<ContractTier, string[]> = {
  local: [
    "Border Patrol Skirmish",
    "Rail Spur Raid",
    "Village Garrison Relief",
    "River Ford Contested",
    "Smuggler Sweep",
    "Outpost Resupply Escort",
    "Militia Drill Clash",
    "Warehouse Night Watch",
    "Bridge Guard Detail",
    "Hamlet Pacification",
    "Scout Ridge Clearance",
    "Convoy Dust-Up",
  ],
  province: [
    "Provincial Relief Column",
    "County Seat Siege Assist",
    "Highland Bandit Drive",
    "Provincial Depot Defense",
    "Marsh Crossing Push",
    "Rebel Camp Clearance",
    "Provincial Rail Security",
    "Frontier Fort Relief",
    "Timber Road Ambush",
    "Provincial Census Guard",
  ],
  interstate: [
    "Interstate Corridor Hold",
    "Border State Intervention",
    "Multi-County Drive",
    "Interstate Convoy Shield",
    "Regional Hub Assault",
    "Cross-Border Pursuit",
    "Interstate Depot Raid",
    "Federation Spur Defense",
  ],
  national: [
    "Capital Approaches Screen",
    "National Arsenal Guard",
    "Strategic Rail Junction",
    "National Mobilization Escort",
    "Coastal Battery Support",
    "Interior Line Stabilization",
  ],
  global: [
    "Overseas Expeditionary Landing",
    "Colonial Port Seizure",
    "Alliance Treaty Enforcement",
    "Transoceanic Convoy War",
    "Empire Frontier Campaign",
  ],
};

const TYPES: CombatType[] = ["offense", "defense", "convoy", "escort", "scout"];
const TERRAINS: CombatTerrain[] = ["plains", "forest", "urban", "desert", "jungle"];

function buildPool(): Contract[] {
  const pool: Contract[] = [];
  for (const tier of TIER_ORDER) {
    const stats = TIER_STATS[tier];
    const names = NAMES[tier];
    names.forEach((name, i) => {
      const id =
        tier === "local" && i === 0
          ? "local-border-patrol"
          : `${tier}-${String(i + 1).padStart(2, "0")}`;
      const variance = 1 + (i % 3) * 0.05;
      pool.push({
        id,
        name,
        tier,
        blurb: `${TIER_LABEL[tier]} job — ${name}.`,
        manpowerRequired: Math.round(stats.manpowerRequired * variance),
        minPower: Math.round(stats.minPower * variance),
        recommendedAmmoPerSoldier: stats.recommendedAmmoPerSoldier,
        oppositionHp: Math.round(stats.oppositionHp * variance),
        oppositionDamagePerTurn: stats.oppositionDamagePerTurn,
        turnsNeeded: stats.turnsNeeded,
        cashReward: Math.round(stats.cashReward * variance),
        lootMaterials: Math.round(stats.lootMaterials * variance),
        itemRewards: [],
        combatType: TYPES[i % TYPES.length]!,
        terrain: TERRAINS[i % TERRAINS.length]!,
        baseSuccessChance: stats.baseSuccessChance,
      });
    });
  }
  return pool;
}

export const CONTRACT_POOL: Contract[] = buildPool();

/** Demo-friendly local job (also on the pool/board). */
export const LOCAL_CONTRACT: Contract =
  CONTRACT_POOL.find((c) => c.id === "local-border-patrol") ?? CONTRACT_POOL[0]!;

export function tierIndex(tier: ContractTier): number {
  return TIER_ORDER.indexOf(tier);
}

export function tierLabel(tier: ContractTier): string {
  return TIER_LABEL[tier];
}

export function isTierUnlocked(state: GameState, tier: ContractTier): boolean {
  return tierIndex(tier) <= tierIndex(state.currentTier);
}

export function nextTier(current: ContractTier): ContractTier | null {
  const i = tierIndex(current);
  if (i < 0 || i >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[i + 1]!;
}

export function getContract(id: string): Contract | undefined {
  return CONTRACT_POOL.find((c) => c.id === id);
}

export function listContracts(): Contract[] {
  return CONTRACT_POOL;
}

export function listBoardContracts(state: GameState): Contract[] {
  return state.contractBoard
    .map((id) => getContract(id))
    .filter((c): c is Contract => Boolean(c));
}

function eligibleIds(state: GameState): string[] {
  const onBoard = new Set(state.contractBoard);
  const active = state.activeMission?.contractId;
  const unlocked = tierIndex(state.currentTier);
  const currentFirst = CONTRACT_POOL.filter(
    (c) =>
      tierIndex(c.tier) <= unlocked &&
      !onBoard.has(c.id) &&
      c.id !== active,
  );
  currentFirst.sort((a, b) => {
    const prefer =
      (b.tier === state.currentTier ? 1 : 0) - (a.tier === state.currentTier ? 1 : 0);
    if (prefer !== 0) return prefer;
    return tierIndex(a.tier) - tierIndex(b.tier);
  });
  return currentFirst.map((c) => c.id);
}

/** Fill board toward BOARD_SIZE from eligible unlocked-tier jobs. */
export function fillContractBoard(state: GameState): GameState {
  const board = [...state.contractBoard];
  const need = BOARD_SIZE - board.length;
  if (need <= 0) return { ...state, contractBoard: board.slice(0, BOARD_SIZE) };
  const add = eligibleIds({ ...state, contractBoard: board }).slice(0, need);
  return { ...state, contractBoard: [...board, ...add].slice(0, BOARD_SIZE) };
}

export function removeFromBoard(state: GameState, contractId: string): GameState {
  return {
    ...state,
    contractBoard: state.contractBoard.filter((id) => id !== contractId),
  };
}

export interface TierProgress {
  currentTier: ContractTier;
  currentLabel: string;
  completionsTowardNext: number;
  completionsRequired: number;
  next: ContractTier | null;
  nextLabel: string | null;
  jobsCompletedTotal: number;
}

export function getTierProgress(state: GameState): TierProgress {
  const next = nextTier(state.currentTier);
  return {
    currentTier: state.currentTier,
    currentLabel: tierLabel(state.currentTier),
    completionsTowardNext: state.jobsCompletedTowardNext,
    completionsRequired: COMPLETIONS_PER_TIER,
    next,
    nextLabel: next ? tierLabel(next) : null,
    jobsCompletedTotal: state.jobsCompletedTotal,
  };
}

/**
 * After a victorious mission: count completion, maybe advance tier, remove job, refill.
 * Non-victory: remove job + refill only.
 */
export function applyJobResolution(
  state: GameState,
  contractId: string,
  won: boolean,
): { state: GameState; message: string } {
  let next = removeFromBoard(state, contractId);
  const notes: string[] = [];

  if (won) {
    let toward = next.jobsCompletedTowardNext + 1;
    let total = next.jobsCompletedTotal + 1;
    let tier = next.currentTier;
    notes.push(`Job complete (+1). Progress ${toward}/${COMPLETIONS_PER_TIER} to next tier.`);

    const nxt = nextTier(tier);
    if (toward >= COMPLETIONS_PER_TIER && nxt) {
      tier = nxt;
      toward = 0;
      notes.push(`Tier unlocked: ${tierLabel(tier)}!`);
    } else if (toward >= COMPLETIONS_PER_TIER && !nxt) {
      toward = COMPLETIONS_PER_TIER;
      notes.push("Already at Global tier — prestige completions continue.");
    }

    next = {
      ...next,
      currentTier: tier,
      jobsCompletedTowardNext: toward,
      jobsCompletedTotal: total,
    };
  } else {
    notes.push("Job failed/retreated — removed from board (no tier progress).");
  }

  next = fillContractBoard(next);
  return { state: next, message: notes.join(" ") };
}
