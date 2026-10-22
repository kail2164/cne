import type {
  ActionResult,
  CaliberFamilyId,
  FactoryTierId,
  GameState,
  LoadSubtype,
  NationId,
  ResearchKind,
  ResearchNode,
} from "./types.js";

/**
 * Flat monthly RP stipend — removed; labs/scientists are primary income.
 * Kept as 0 for callers that still reference the constant.
 */
export const RP_PER_MONTH = 0;
/** RP awarded on victorious contract resolution (reduced; labs are primary). */
export const RP_PER_CONTRACT_WIN = 5;

export const STARTER_UNLOCKS = ["gear-basic-pouch"] as const;

type WeaponStep = {
  id: string;
  name: string;
  /** Service year. Research waits until the campaign reaches it. */
  year: number;
  rpCost: number;
};

type FamilyPath = {
  nation: NationId;
  familyId: CaliberFamilyId;
  label: string;
  /** Earlier cartridge on the same national line. Starter cartridges have none. */
  previousFamilyId?: CaliberFamilyId;
  /** First entry is granted with the cartridge. The rest are researched in order. */
  weapons: WeaponStep[];
};

const FAMILY_PATHS: FamilyPath[] = [
  {
    nation: "ussr",
    familyId: "762x54r",
    label: "7.62×54mmR",
    weapons: [
      { id: "mosin-m91", name: "Mosin–Nagant M1891", year: 1891, rpCost: 18 },
      { id: "mosin-dragoon", name: "Mosin Dragoon", year: 1891, rpCost: 22 },
      { id: "dp-27", name: "Degtyaryov DP-27", year: 1928, rpCost: 28 },
      { id: "mosin-m9130", name: "Mosin–Nagant M1891/30", year: 1930, rpCost: 24 },
    ],
  },
  {
    nation: "us",
    familyId: "3006",
    label: ".30-06",
    weapons: [
      { id: "springfield-m1903", name: "Springfield M1903", year: 1903, rpCost: 18 },
      { id: "m1917-enfield", name: "M1917 Enfield", year: 1917, rpCost: 22 },
      { id: "bar-m1918", name: "Browning BAR M1918", year: 1918, rpCost: 28 },
      { id: "springfield-m1903a1", name: "Springfield M1903A1", year: 1929, rpCost: 24 },
    ],
  },
  {
    nation: "uk",
    familyId: "303br",
    label: ".303 British",
    weapons: [
      { id: "lee-enfield-smle", name: "Lee–Enfield SMLE", year: 1904, rpCost: 18 },
      { id: "lee-enfield-no1mk3", name: "Lee–Enfield No.1 Mk III", year: 1907, rpCost: 22 },
      { id: "pattern-1914", name: "Pattern 1914 Enfield", year: 1914, rpCost: 22 },
      { id: "lewis-mk1", name: "Lewis Mk I", year: 1914, rpCost: 28 },
    ],
  },
  {
    nation: "france",
    familyId: "8x50r",
    label: "8×50mmR Lebel",
    weapons: [
      { id: "lebel-m1886", name: "Lebel M1886", year: 1886, rpCost: 18 },
      { id: "berthier-m1907", name: "Berthier M1907", year: 1907, rpCost: 22 },
      { id: "chauchat-m1915", name: "Chauchat Mle 1915", year: 1915, rpCost: 26 },
    ],
  },
  {
    nation: "france",
    familyId: "75x54",
    label: "7.5×54mm French",
    previousFamilyId: "8x50r",
    weapons: [{ id: "fm-24-29", name: "FM 24/29", year: 1929, rpCost: 30 }],
  },
  {
    nation: "germany",
    familyId: "792x57",
    label: "7.92×57mm Mauser",
    weapons: [
      { id: "gewehr-98", name: "Gewehr 98", year: 1898, rpCost: 18 },
      { id: "karabiner-98a", name: "Karabiner 98a", year: 1908, rpCost: 22 },
      { id: "mg08-15", name: "MG 08/15", year: 1915, rpCost: 30 },
      { id: "karabiner-98b", name: "Karabiner 98b", year: 1923, rpCost: 24 },
    ],
  },
  {
    nation: "italy",
    familyId: "65x52",
    label: "6.5×52mm Carcano",
    weapons: [
      { id: "carcano-m91", name: "Carcano Modello 1891", year: 1891, rpCost: 18 },
      { id: "carcano-moschetto", name: "Carcano Moschetto 1891", year: 1893, rpCost: 20 },
      { id: "breda-30", name: "Breda Modello 30", year: 1930, rpCost: 28 },
    ],
  },
  {
    nation: "japan",
    familyId: "65x50sr",
    label: "6.5×50mmSR Arisaka",
    weapons: [
      { id: "type-38", name: "Type 38 rifle", year: 1905, rpCost: 18 },
      { id: "type-38-carbine", name: "Type 38 carbine", year: 1905, rpCost: 20 },
      { id: "type-44", name: "Type 44 carbine", year: 1911, rpCost: 22 },
      { id: "type-11", name: "Type 11 light machine gun", year: 1922, rpCost: 28 },
    ],
  },
  {
    nation: "spain",
    familyId: "7x57",
    label: "7×57mm Mauser",
    weapons: [
      { id: "mauser-1893", name: "Mauser Model 1893", year: 1893, rpCost: 18 },
      { id: "mauser-m1916", name: "Spanish Mauser M1916", year: 1916, rpCost: 22 },
      { id: "hotchkiss-m1922", name: "Hotchkiss M1922", year: 1922, rpCost: 28 },
    ],
  },
  {
    nation: "sweden",
    familyId: "65x55",
    label: "6.5×55mm Swedish",
    weapons: [
      { id: "mauser-m96", name: "Swedish m/96", year: 1896, rpCost: 18 },
      { id: "mauser-m94", name: "Swedish m/94 carbine", year: 1894, rpCost: 20 },
      { id: "ksp-m21", name: "Kulsprutegevär m/21", year: 1921, rpCost: 28 },
    ],
  },
  {
    nation: "switzerland",
    familyId: "75x53",
    label: "7.5×53.5mm Swiss",
    weapons: [{ id: "schmidt-rubin-1896", name: "Schmidt–Rubin 1896", year: 1896, rpCost: 18 }],
  },
  {
    nation: "switzerland",
    familyId: "75x55",
    label: "7.5×55mm Swiss",
    previousFamilyId: "75x53",
    weapons: [
      { id: "schmidt-rubin-1911", name: "Schmidt–Rubin 1911", year: 1911, rpCost: 22 },
      { id: "karabiner-11", name: "Karabiner 11", year: 1911, rpCost: 22 },
      { id: "lmg-25", name: "Furrer Lmg 25", year: 1925, rpCost: 28 },
    ],
  },
  {
    nation: "austria",
    familyId: "8x50mann",
    label: "8×50mmR Mannlicher",
    weapons: [
      { id: "mannlicher-m1895", name: "Mannlicher M1895", year: 1895, rpCost: 18 },
      { id: "mannlicher-m1895-stutzen", name: "Mannlicher M1895 Stutzen", year: 1895, rpCost: 20 },
      { id: "schwarzlose-m712", name: "Schwarzlose M.7/12", year: 1912, rpCost: 30 },
    ],
  },
  {
    nation: "austria",
    familyId: "8x56r",
    label: "8×56mmR Steyr",
    previousFamilyId: "8x50mann",
    weapons: [{ id: "mannlicher-m9530", name: "Mannlicher M95/30", year: 1930, rpCost: 24 }],
  },
  {
    nation: "belgium",
    familyId: "765x53",
    label: "7.65×53mm Mauser",
    weapons: [
      { id: "mauser-1889", name: "Mauser Model 1889", year: 1889, rpCost: 18 },
      { id: "fn-m1930", name: "FN Model 1930", year: 1930, rpCost: 28 },
    ],
  },
  {
    nation: "greece",
    familyId: "65x54",
    label: "6.5×54mm Mannlicher–Schönauer",
    weapons: [
      { id: "schonauer-m1903", name: "Mannlicher–Schönauer M1903", year: 1903, rpCost: 18 },
      { id: "schonauer-m1903-14", name: "Mannlicher–Schönauer M1903/14", year: 1914, rpCost: 22 },
    ],
  },
  {
    nation: "netherlands",
    familyId: "65x53r",
    label: "6.5×53mmR Mannlicher",
    weapons: [
      { id: "mannlicher-m95-dutch", name: "Dutch Mannlicher M.95", year: 1895, rpCost: 18 },
      { id: "mannlicher-m95-carbine", name: "Dutch Mannlicher carbine", year: 1895, rpCost: 20 },
      { id: "lewis-m20", name: "Lewis M.20", year: 1920, rpCost: 28 },
    ],
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
  const primary = path.weapons[0];
  if (!primary) return [];
  const primaryId = weaponNodeId(primary.id);
  const nodes: ResearchNode[] = [
    {
      id: calId,
      name: `${path.label} caliber`,
      kind: "item",
      rpCost: 12,
      requires: path.previousFamilyId ? [caliberNodeId(path.previousFamilyId)] : [],
      earliestYear: path.previousFamilyId ? primary.year : undefined,
      blurb: path.previousFamilyId
        ? `Next cartridge on this national line. Unlocks ${path.label} and FMJ.`
        : `Unlock ${path.label} and its FMJ load.`,
      effects: [{ type: "unlock_item", itemId: path.familyId }],
      nation: path.nation,
    },
    {
      id: primaryId,
      name: primary.name,
      kind: "item",
      rpCost: primary.rpCost,
      requires: [calId],
      earliestYear: primary.year > 1910 ? primary.year : undefined,
      blurb: `Service weapon for ${path.label}.`,
      effects: [{ type: "unlock_item", itemId: primary.id }],
      nation: path.nation,
    },
    {
      id: `acc-${primary.id}-bayonet`,
      name: `${primary.name} bayonet`,
      kind: "item",
      rpCost: 8,
      requires: [primaryId],
      blurb: "Socket bayonet accessory.",
      effects: [{ type: "unlock_item", itemId: `acc-${primary.id}-bayonet` }],
      nation: path.nation,
    },
    {
      id: `acc-${primary.id}-sling`,
      name: `${primary.name} sling`,
      kind: "item",
      rpCost: 5,
      requires: [primaryId],
      blurb: "Carry sling accessory.",
      effects: [{ type: "unlock_item", itemId: `acc-${primary.id}-sling` }],
      nation: path.nation,
    },
  ];
  for (const weapon of path.weapons.slice(1)) {
    nodes.push({
      id: weaponNodeId(weapon.id),
      name: weapon.name,
      kind: "item",
      rpCost: weapon.rpCost,
      requires: [primaryId],
      earliestYear: weapon.year > 1910 ? weapon.year : undefined,
      blurb: `${weapon.name} on ${path.label}.`,
      effects: [{ type: "unlock_item", itemId: weapon.id }],
      nation: path.nation,
    });
  }
  nodes.push(
    {
      id: loadNodeId(path.familyId, "hollow_point"),
      name: `${path.label} hollow point`,
      kind: "item",
      rpCost: 10,
      requires: [calId],
      blurb: "HP load subtype (high damage / low pen).",
      effects: [{ type: "unlock_item", itemId: loadNodeId(path.familyId, "hollow_point") }],
      nation: path.nation,
    },
    {
      id: loadNodeId(path.familyId, "ap"),
      name: `${path.label} AP`,
      kind: "item",
      rpCost: 14,
      requires: [calId],
      blurb: "Armor-piercing load subtype.",
      effects: [{ type: "unlock_item", itemId: loadNodeId(path.familyId, "ap") }],
      nation: path.nation,
    },
  );
  return nodes;
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
  return FAMILY_PATHS.find((path) => path.familyId === familyId)?.weapons[0]?.id;
}

export function playerNation(state: GameState): NationId | null {
  if (!state.selectedCaliberId) return null;
  return FAMILY_PATHS.find((path) => path.familyId === state.selectedCaliberId)?.nation ?? null;
}

function nationBlocked(state: GameState, node: ResearchNode): string | null {
  if (!node.nation) return null;
  const nation = playerNation(state);
  if (!nation) return "Choose a national caliber before researching its weapons.";
  if (nation !== node.nation) return `${node.name} stays on another nation's line.`;
  return null;
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
  const foreign = nationBlocked(state, node);
  if (foreign) return { ok: false, reason: foreign, node };
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

/** @deprecated Flat stipend removed — use awardLabRp from labs.ts. */
export function awardMonthlyRp(state: GameState): GameState {
  if (RP_PER_MONTH <= 0) return state;
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
    if (nationBlocked(state, n)) return false;
    if (n.earliestYear != null && state.year < n.earliestYear) return false;
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
  const path = FAMILY_PATHS.find((entry) => entry.familyId === familyId);
  const primary = path?.weapons[0];
  if (!path || !primary) return state;
  return grantResearch(state, [caliberNodeId(path.familyId), weaponNodeId(primary.id)]);
}
