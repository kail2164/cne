import type {
  ActionResult,
  CaliberFamilyId,
  FactoryTierId,
  GameState,
  LoadSubtype,
  ResearchKind,
  ResearchNode,
} from "./types.js";

/** RP awarded every end-turn (1 month). */
export const RP_PER_MONTH = 3;
/** RP awarded on victorious contract resolution. */
export const RP_PER_CONTRACT_WIN = 10;

export const STARTER_UNLOCKS = ["gear-basic-pouch"] as const;

type FamilyPath = {
  familyId: CaliberFamilyId;
  label: string;
  primaryRifleId: string;
  primaryRifleName: string;
  secondRifleId: string;
  secondRifleName: string;
  secondYear: number;
};

const FAMILY_PATHS: FamilyPath[] = [
  {
    familyId: "762x54r",
    label: "7.62×54mmR",
    primaryRifleId: "mosin-m91",
    primaryRifleName: "Mosin–Nagant M1891",
    secondRifleId: "mosin-dragoon",
    secondRifleName: "Mosin Dragoon",
    secondYear: 1910,
  },
  {
    familyId: "3006",
    label: ".30-06",
    primaryRifleId: "springfield-m1903",
    primaryRifleName: "Springfield M1903",
    secondRifleId: "springfield-m1903a1",
    secondRifleName: "Springfield M1903A1",
    secondYear: 1912,
  },
  {
    familyId: "303br",
    label: ".303 British",
    primaryRifleId: "lee-enfield-smle",
    primaryRifleName: "Lee–Enfield SMLE",
    secondRifleId: "lee-enfield-no1mk3",
    secondRifleName: "Lee–Enfield No.1 Mk III",
    secondYear: 1910,
  },
  {
    familyId: "8x50r",
    label: "8×50mmR Lebel",
    primaryRifleId: "lebel-m1886",
    primaryRifleName: "Lebel M1886",
    secondRifleId: "berthier-m1907",
    secondRifleName: "Berthier M1907",
    secondYear: 1910,
  },
  {
    familyId: "792x57",
    label: "7.92×57mm Mauser",
    primaryRifleId: "gewehr-98",
    primaryRifleName: "Gewehr 98",
    secondRifleId: "karabiner-98a",
    secondRifleName: "Karabiner 98a",
    secondYear: 1910,
  },
];

function caliberNodeId(familyId: string): string {
  return `caliber-${familyId}`;
}

function weaponNodeId(rifleId: string): string {
  return `weapon-${rifleId}`;
}

function loadNodeId(familyId: string, subtype: LoadSubtype): string {
  return `load-${familyId}-${subtype}`;
}

function buildFamilyItemNodes(path: FamilyPath): ResearchNode[] {
  const calId = caliberNodeId(path.familyId);
  const primaryId = weaponNodeId(path.primaryRifleId);
  const secondId = weaponNodeId(path.secondRifleId);
  return [
    {
      id: calId,
      name: `${path.label} caliber`,
      kind: "item",
      rpCost: 12,
      requires: [],
      blurb: `Unlock ${path.label} chamber and FMJ loads.`,
      effects: [{ type: "unlock_item", itemId: path.familyId }],
    },
    {
      id: primaryId,
      name: path.primaryRifleName,
      kind: "item",
      rpCost: 18,
      requires: [calId],
      blurb: `Primary rifle for ${path.label}.`,
      effects: [{ type: "unlock_item", itemId: path.primaryRifleId }],
    },
    {
      id: `acc-${path.primaryRifleId}-bayonet`,
      name: `${path.primaryRifleName} bayonet`,
      kind: "item",
      rpCost: 8,
      requires: [primaryId],
      blurb: "Socket bayonet accessory.",
      effects: [{ type: "unlock_item", itemId: `acc-${path.primaryRifleId}-bayonet` }],
    },
    {
      id: `acc-${path.primaryRifleId}-sling`,
      name: `${path.primaryRifleName} sling`,
      kind: "item",
      rpCost: 5,
      requires: [primaryId],
      blurb: "Carry sling accessory.",
      effects: [{ type: "unlock_item", itemId: `acc-${path.primaryRifleId}-sling` }],
    },
    {
      id: secondId,
      name: path.secondRifleName,
      kind: "item",
      rpCost: 22,
      requires: [primaryId],
      earliestYear: path.secondYear,
      blurb: `Second weapon on ${path.label}.`,
      effects: [{ type: "unlock_item", itemId: path.secondRifleId }],
    },
    {
      id: loadNodeId(path.familyId, "hollow_point"),
      name: `${path.label} hollow point`,
      kind: "item",
      rpCost: 10,
      requires: [calId],
      blurb: "HP load subtype (high damage / low pen).",
      effects: [{ type: "unlock_item", itemId: loadNodeId(path.familyId, "hollow_point") }],
    },
    {
      id: loadNodeId(path.familyId, "ap"),
      name: `${path.label} AP`,
      kind: "item",
      rpCost: 14,
      requires: [calId],
      blurb: "Armor-piercing load subtype.",
      effects: [{ type: "unlock_item", itemId: loadNodeId(path.familyId, "ap") }],
    },
  ];
}

const TECH_NODES: ResearchNode[] = [
  {
    id: "tech-drill",
    name: "Field Drill",
    kind: "tech",
    rpCost: 15,
    requires: [],
    blurb: "+5% mission success chance.",
    effects: [{ type: "boost", target: "successChance", percent: 5 }],
  },
  {
    id: "tech-logistics",
    name: "Workshop Logistics",
    kind: "tech",
    rpCost: 20,
    requires: [],
    blurb: "+10% factory monthly output.",
    effects: [{ type: "boost", target: "production", percent: 10 }],
  },
  {
    id: "tech-recruiting",
    name: "Recruiting Office",
    kind: "tech",
    rpCost: 18,
    requires: [],
    blurb: "+8 barracks pop slots.",
    effects: [
      { type: "boost", target: "manpower", percent: 5 },
      { type: "flat_manpower_slots", amount: 8 },
    ],
  },
  {
    id: "tech-morale",
    name: "Company Morale Doctrine",
    kind: "tech",
    rpCost: 15,
    requires: [],
    blurb: "+8% morale retention (loyalty floor vs desertion).",
    effects: [{ type: "boost", target: "morale", percent: 8 }],
  },
];

const BUILDING_NODES: ResearchNode[] = [
  {
    id: "building-housing-expanded",
    name: "Expanded Housing",
    kind: "building",
    rpCost: 25,
    requires: [],
    blurb: "+20 barracks pop slots.",
    effects: [{ type: "flat_manpower_slots", amount: 20 }],
  },
  {
    id: "building-warehouse-medium",
    name: "Medium Warehouse",
    kind: "building",
    rpCost: 30,
    requires: [],
    blurb: "Warehouse capacity ×1.5.",
    effects: [{ type: "warehouse_mult", factor: 1.5 }],
  },
  {
    id: "building-factory-workshop",
    name: "Workshop Plans",
    kind: "building",
    rpCost: 40,
    requires: [],
    blurb: "Unlock buying workshop factories.",
    effects: [{ type: "unlock_factory_tier", tierId: "workshop" }],
  },
  {
    id: "building-factory-manufactory",
    name: "Manufactory Plans",
    kind: "building",
    rpCost: 60,
    requires: ["building-factory-workshop"],
    blurb: "Unlock buying manufactory factories.",
    effects: [{ type: "unlock_factory_tier", tierId: "manufactory" }],
  },
  {
    id: "building-factory-arsenal",
    name: "Arsenal Plans",
    kind: "building",
    rpCost: 80,
    requires: ["building-factory-manufactory"],
    blurb: "Unlock buying arsenal factories.",
    effects: [{ type: "unlock_factory_tier", tierId: "arsenal" }],
  },
  {
    id: "building-factory-industrial",
    name: "Industrial Works Plans",
    kind: "building",
    rpCost: 100,
    requires: ["building-factory-arsenal"],
    blurb: "Unlock buying industrial factories.",
    effects: [{ type: "unlock_factory_tier", tierId: "industrial" }],
  },
  {
    id: "building-garage",
    name: "Motor Garage",
    kind: "building",
    rpCost: 50,
    requires: ["building-warehouse-medium"],
    blurb: "Garage stub (vehicles Phase 2).",
    effects: [{ type: "stub" }],
  },
  {
    id: "building-shipyard",
    name: "Shipyard Slip",
    kind: "building",
    rpCost: 80,
    requires: ["building-garage"],
    blurb: "Shipyard stub (vehicles Phase 2).",
    effects: [{ type: "stub" }],
  },
];

const GEAR_NODES: ResearchNode[] = [
  {
    id: "gear-basic-pouch",
    name: "Basic Pouches",
    kind: "item",
    rpCost: 0,
    requires: [],
    blurb: "Starter gear (auto-unlocked).",
    effects: [{ type: "unlock_item", itemId: "basic-pouch" }],
  },
  {
    id: "gear-ammo-bandolier",
    name: "Ammo Bandolier",
    kind: "item",
    rpCost: 12,
    requires: ["gear-basic-pouch"],
    blurb: "Extra ammo capacity gear.",
    effects: [{ type: "unlock_item", itemId: "ammo-bandolier" }],
  },
  {
    id: "gear-helmet",
    name: "Steel Helmet",
    kind: "item",
    rpCost: 14,
    requires: ["gear-basic-pouch"],
    requiresBuilding: "building-housing-expanded",
    blurb: "Head protection; needs expanded housing to field.",
    effects: [{ type: "unlock_item", itemId: "steel-helmet" }],
  },
  {
    id: "gear-acc-helmet-liner",
    name: "Helmet Liner",
    kind: "item",
    rpCost: 6,
    requires: ["gear-helmet"],
    blurb: "Helmet accessory (comfort / fit).",
    effects: [{ type: "unlock_item", itemId: "acc-helmet-liner" }],
  },
  {
    id: "gear-body-armor",
    name: "Body Armor",
    kind: "item",
    rpCost: 22,
    requires: ["gear-basic-pouch"],
    requiresBuilding: "building-factory-workshop",
    blurb: "Soft armor; needs workshop plans.",
    effects: [{ type: "unlock_item", itemId: "body-armor" }],
  },
  {
    id: "gear-acc-armor-plate",
    name: "Armor Plate Insert",
    kind: "item",
    rpCost: 10,
    requires: ["gear-body-armor"],
    blurb: "Armor accessory (plate insert).",
    effects: [{ type: "unlock_item", itemId: "acc-armor-plate" }],
  },
  {
    id: "gear-demo-suit",
    name: "Demolition Suit",
    kind: "item",
    rpCost: 28,
    requires: ["gear-body-armor"],
    requiresBuilding: "building-factory-manufactory",
    blurb: "Heavy demo kit; needs manufactory plans.",
    effects: [{ type: "unlock_item", itemId: "demo-suit" }],
  },
  {
    id: "gear-acc-lamp",
    name: "Kit Lamp Mount",
    kind: "item",
    rpCost: 8,
    requires: ["gear-ammo-bandolier"],
    blurb: "Gear accessory light mount.",
    effects: [{ type: "unlock_item", itemId: "acc-kit-lamp" }],
  },
];

const VEHICLE_STUBS: ResearchNode[] = [
  {
    id: "vehicle-truck-light",
    name: "Light Supply Truck",
    kind: "vehicle",
    rpCost: 40,
    requires: ["building-garage"],
    blurb: "Phase 2 stub — not spendable.",
    effects: [{ type: "stub" }],
  },
  {
    id: "vehicle-gunboat",
    name: "River Gunboat",
    kind: "vehicle",
    rpCost: 70,
    requires: ["building-shipyard"],
    blurb: "Phase 2 stub — not spendable.",
    effects: [{ type: "stub" }],
  },
];

/** Full Phase 1 research catalog (1910 starter path + stubs). */
export const RESEARCH_CATALOG: ResearchNode[] = [
  ...TECH_NODES,
  ...BUILDING_NODES,
  ...FAMILY_PATHS.flatMap(buildFamilyItemNodes),
  ...GEAR_NODES,
  ...VEHICLE_STUBS,
];

const FACTORY_TIER_RESEARCH: Partial<Record<FactoryTierId, string>> = {
  workshop: "building-factory-workshop",
  manufactory: "building-factory-manufactory",
  arsenal: "building-factory-arsenal",
  industrial: "building-factory-industrial",
};

export function getResearchNode(id: string): ResearchNode | undefined {
  return RESEARCH_CATALOG.find((n) => n.id === id);
}

export function isResearchUnlocked(state: GameState, id: string): boolean {
  return state.researchUnlocked.includes(id);
}

export function primaryRifleIdForFamily(familyId: string): string | undefined {
  return FAMILY_PATHS.find((p) => p.familyId === familyId)?.primaryRifleId;
}

export function caliberResearchId(familyId: string): string {
  return caliberNodeId(familyId);
}

export function weaponResearchId(rifleId: string): string {
  return weaponNodeId(rifleId);
}

export function loadResearchId(familyId: string, subtype: LoadSubtype): string {
  return loadNodeId(familyId, subtype);
}

/** FMJ is free with caliber; HP/AP need their load nodes. */
export function isLoadSubtypeUnlocked(
  state: GameState,
  familyId: string,
  subtype: LoadSubtype,
): boolean {
  if (subtype === "fmj") {
    return isResearchUnlocked(state, caliberNodeId(familyId));
  }
  return isResearchUnlocked(state, loadNodeId(familyId, subtype));
}

export function isWeaponUnlocked(state: GameState, weaponId: string): boolean {
  return isResearchUnlocked(state, weaponNodeId(weaponId));
}

export function isGearUnlocked(state: GameState, gearId: string): boolean {
  const nodeId = gearId.startsWith("gear-") ? gearId : `gear-${gearId}`;
  // Map catalog gear ids to research node ids
  const map: Record<string, string> = {
    "basic-pouch": "gear-basic-pouch",
    "ammo-bandolier": "gear-ammo-bandolier",
    "steel-helmet": "gear-helmet",
    "body-armor": "gear-body-armor",
    "demo-suit": "gear-demo-suit",
  };
  const id = map[gearId] ?? nodeId;
  return isResearchUnlocked(state, id);
}

export function isFactoryTierUnlocked(state: GameState, tierId: FactoryTierId): boolean {
  if (tierId === "blacksmith") return true;
  const need = FACTORY_TIER_RESEARCH[tierId];
  if (!need) return true;
  return isResearchUnlocked(state, need);
}

export function missingPrereqs(state: GameState, node: ResearchNode): string[] {
  const missing = node.requires.filter((id) => !isResearchUnlocked(state, id));
  if (node.requiresBuilding && !isResearchUnlocked(state, node.requiresBuilding)) {
    missing.push(node.requiresBuilding);
  }
  return missing;
}

export function canResearch(
  state: GameState,
  nodeId: string,
): { ok: boolean; reason: string; node?: ResearchNode } {
  const node = getResearchNode(nodeId);
  if (!node) return { ok: false, reason: `Unknown research: ${nodeId}` };
  if (node.kind === "vehicle") {
    return { ok: false, reason: `${node.name} is Phase 2 (vehicles deferred).`, node };
  }
  if (isResearchUnlocked(state, nodeId)) {
    return { ok: false, reason: `Already unlocked: ${node.name}.`, node };
  }
  const missing = missingPrereqs(state, node);
  if (missing.length > 0) {
    return {
      ok: false,
      reason: `Missing prerequisites: ${missing.join(", ")}.`,
      node,
    };
  }
  if (node.earliestYear != null && state.year < node.earliestYear) {
    return {
      ok: false,
      reason: `${node.name} available from ${node.earliestYear} (now ${state.year}).`,
      node,
    };
  }
  if (state.researchPoints < node.rpCost) {
    return {
      ok: false,
      reason: `Need ${node.rpCost} RP (have ${state.researchPoints}).`,
      node,
    };
  }
  return { ok: true, reason: "ok", node };
}

function applyEffects(state: GameState, node: ResearchNode): GameState {
  let next = state;
  for (const fx of node.effects) {
    if (fx.type === "flat_manpower_slots") {
      next = { ...next, barracksPopSlots: next.barracksPopSlots + fx.amount };
    } else if (fx.type === "warehouse_mult") {
      next = {
        ...next,
        warehouse: {
          ...next.warehouse,
          maxWeight: Math.floor(next.warehouse.maxWeight * fx.factor),
          maxVolume: Math.floor(next.warehouse.maxVolume * fx.factor),
          name:
            node.id === "building-warehouse-medium"
              ? "Medium Warehouse"
              : next.warehouse.name,
        },
      };
    }
    // boost / unlock_item / unlock_factory_tier / stub: tracked via researchUnlocked
  }
  return next;
}

/** Grant unlocks without spending RP (starter path). */
export function grantResearch(
  state: GameState,
  nodeIds: string[],
): GameState {
  let next = state;
  for (const id of nodeIds) {
    if (isResearchUnlocked(next, id)) continue;
    const node = getResearchNode(id);
    if (!node) continue;
    next = {
      ...next,
      researchUnlocked: [...next.researchUnlocked, id],
    };
    next = applyEffects(next, node);
  }
  return next;
}

export function spendResearch(
  state: GameState,
  nodeId: string,
): ActionResult<{ node: ResearchNode }> {
  const check = canResearch(state, nodeId);
  if (!check.ok || !check.node) {
    return { ok: false, state, message: check.reason };
  }
  const node = check.node;
  let next: GameState = {
    ...state,
    researchPoints: state.researchPoints - node.rpCost,
    researchUnlocked: [...state.researchUnlocked, node.id],
  };
  next = applyEffects(next, node);
  return {
    ok: true,
    state: next,
    message: `Researched ${node.name} (−${node.rpCost} RP). Balance: ${next.researchPoints} RP.`,
    data: { node },
  };
}

export function awardMonthlyRp(state: GameState): GameState {
  return { ...state, researchPoints: state.researchPoints + RP_PER_MONTH };
}

export function awardContractWinRp(state: GameState): GameState {
  return {
    ...state,
    researchPoints: state.researchPoints + RP_PER_CONTRACT_WIN,
  };
}

export function sumBoostPercent(
  state: GameState,
  target: "manpower" | "morale" | "production" | "successChance",
): number {
  let sum = 0;
  for (const id of state.researchUnlocked) {
    const node = getResearchNode(id);
    if (!node) continue;
    for (const fx of node.effects) {
      if (fx.type === "boost" && fx.target === target) sum += fx.percent;
    }
  }
  return sum;
}

export function productionOutputMult(state: GameState): number {
  return 1 + sumBoostPercent(state, "production") / 100;
}

export function successChanceBoost(state: GameState): number {
  return sumBoostPercent(state, "successChance");
}

/** Raise effective desertion threshold by morale boost (loyalty must fall further). */
export function moraleDesertionThresholdBonus(state: GameState): number {
  return Math.round(sumBoostPercent(state, "morale") * 0.5);
}

export function listAvailableResearch(state: GameState): ResearchNode[] {
  return RESEARCH_CATALOG.filter((n) => {
    if (n.kind === "vehicle") return false;
    if (isResearchUnlocked(state, n.id)) return false;
    if (n.rpCost <= 0 && n.id === "gear-basic-pouch") return false;
    return missingPrereqs(state, n).length === 0;
  });
}

export function describeResearchTree(state: GameState, kind?: ResearchKind): string[] {
  const nodes = kind
    ? RESEARCH_CATALOG.filter((n) => n.kind === kind)
    : RESEARCH_CATALOG;
  return nodes.map((n) => {
    const status = isResearchUnlocked(state, n.id)
      ? "UNLOCKED"
      : n.kind === "vehicle"
        ? "STUB"
        : missingPrereqs(state, n).length
          ? "LOCKED"
          : state.researchPoints >= n.rpCost
            ? "READY"
            : "NEED RP";
    const req =
      n.requires.length || n.requiresBuilding
        ? ` req[${[...n.requires, n.requiresBuilding].filter(Boolean).join(",")}]`
        : "";
    return `[${status}] ${n.kind} ${n.id} — ${n.name} (${n.rpCost} RP)${req}`;
  });
}

export function describeAvailableResearch(state: GameState): string[] {
  return listAvailableResearch(state).map(
    (n, i) =>
      `${i + 1}. ${n.id} — ${n.name} (${n.rpCost} RP) [${n.kind}] ${n.blurb}`,
  );
}

/** Auto-grant caliber + primary rifle when locking starter family. */
export function grantStarterCaliberPath(
  state: GameState,
  familyId: CaliberFamilyId,
): GameState {
  const path = FAMILY_PATHS.find((p) => p.familyId === familyId);
  if (!path) return state;
  return grantResearch(state, [
    caliberNodeId(path.familyId),
    weaponNodeId(path.primaryRifleId),
  ]);
}
