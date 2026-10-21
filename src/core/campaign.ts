import { fillContractBoard } from "./board.js";
import {
  CALIBER_FAMILIES,
  LOAD_SUBTYPE_LABEL,
  LOAD_SUBTYPES,
  START,
  getAmmo,
  getCaliberFamily,
  getRifleForCaliber,
} from "./catalog.js";
import type {
  ActionResult,
  CaliberId,
  GameState,
  LoadSubtype,
  StockEntry,
} from "./types.js";

function materialStock(qty: number): StockEntry {
  return {
    kind: "raw_materials",
    itemId: "raw",
    quantity: qty,
    weightPerUnit: 1,
    volumePerUnit: 0.8,
  };
}

export function createCampaign(companyName = "1st Provisional Company"): GameState {
  const base: GameState = {
    year: START.startYear,
    month: START.startMonth,
    turn: 1,
    funds: START.funds,
    selectedCaliberId: null,
    selectedLoadSubtype: "fmj",
    warehouse: {
      id: "wh-small-1",
      name: "Small Warehouse",
      maxWeight: START.warehouseMaxWeight,
      maxVolume: START.warehouseMaxVolume,
      stocks: [materialStock(START.rawMaterials)],
    },
    factory: {
      product: null,
      locked: false,
      monthlyCapacity: START.factoryMonthlyCapacity,
    },
    company: { name: companyName, soldiers: [] },
    barracksPopSlots: START.barracksPopSlots,
    squads: [],
    garage: [],
    researchUnlocked: [],
    activeMission: null,
    currentTier: "local",
    jobsCompletedTowardNext: 0,
    jobsCompletedTotal: 0,
    contractBoard: [],
  };
  return fillContractBoard(base);
}

/** One row per family (FMJ baseline) for starting pick UI. */
export function listStartingCalibers() {
  return CALIBER_FAMILIES.map((f) => {
    const fmj = getAmmo(f.id, "fmj")!;
    return {
      id: f.id,
      name: f.name,
      rifle: getRifleForCaliber(f.id)?.name ?? fmj.rifleId,
      productionCost: fmj.productionCost,
      weightPerRound: fmj.weightPerRound,
      volumePerRound: fmj.volumePerRound,
      baseDamage: fmj.baseDamage,
      basePenetration: fmj.basePenetration,
      gunPowderAmount: fmj.gunPowderAmount,
      familyId: f.id,
      variant: fmj.variant as LoadSubtype,
      supplyEfficiency: fmj.supplyEfficiency,
      subtypes: LOAD_SUBTYPES.map((s) => {
        const a = getAmmo(f.id, s)!;
        return {
          subtype: s,
          label: LOAD_SUBTYPE_LABEL[s],
          id: a.id,
          productionCost: a.productionCost,
          baseDamage: a.baseDamage,
          basePenetration: a.basePenetration,
        };
      }),
    };
  });
}

export function selectCaliber(state: GameState, caliberId: CaliberId): ActionResult {
  if (state.selectedCaliberId) {
    return {
      ok: false,
      state,
      message: `Caliber already locked: ${state.selectedCaliberId}. Reset not available in Phase 1.`,
    };
  }
  const family = getCaliberFamily(caliberId);
  if (!family) {
    return { ok: false, state, message: `Unknown caliber family: ${caliberId}` };
  }
  const rifle = getRifleForCaliber(caliberId);
  return {
    ok: true,
    state: {
      ...state,
      selectedCaliberId: caliberId,
      selectedLoadSubtype: "fmj",
    },
    message: `Selected ${family.name}. Unlocked rifle: ${rifle?.name ?? "?"}. Load default: FMJ.`,
  };
}

export function setLoadSubtype(
  state: GameState,
  subtype: LoadSubtype,
): ActionResult {
  if (!state.selectedCaliberId) {
    return { ok: false, state, message: "Select a caliber family first." };
  }
  if (!LOAD_SUBTYPES.includes(subtype)) {
    return { ok: false, state, message: `Unknown load subtype: ${subtype}` };
  }
  const ammo = getAmmo(state.selectedCaliberId, subtype);
  if (!ammo) {
    return { ok: false, state, message: `No ${subtype} load for ${state.selectedCaliberId}.` };
  }
  return {
    ok: true,
    state: { ...state, selectedLoadSubtype: subtype },
    message: `Load subtype: ${LOAD_SUBTYPE_LABEL[subtype]} (${ammo.name}) — cost $${ammo.productionCost}/rd, dmg ${ammo.baseDamage}, pen ${ammo.basePenetration}.`,
  };
}

export function parseLoadSubtype(raw: string): LoadSubtype | null {
  const s = raw.trim().toLowerCase();
  if (s === "fmj" || s === "f" || s === "1") return "fmj";
  if (s === "hollow_point" || s === "hollow" || s === "hp" || s === "h" || s === "2") {
    return "hollow_point";
  }
  if (s === "ap" || s === "a" || s === "3") return "ap";
  return null;
}
