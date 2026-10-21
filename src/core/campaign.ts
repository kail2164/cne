import { CALIBERS, START, getRifleForCaliber } from "./catalog.js";
import type { ActionResult, CaliberId, GameState, StockEntry } from "./types.js";

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
  return {
    year: 1910,
    funds: START.funds,
    selectedCaliberId: null,
    warehouse: {
      id: "wh-small-1",
      name: "Small Warehouse",
      maxWeight: START.warehouseMaxWeight,
      maxVolume: START.warehouseMaxVolume,
      stocks: [materialStock(START.rawMaterials)],
    },
    factoryAllocation: { ammo: 0.6, rifles: 0.4 },
    factoryCapacityPerTick: START.factoryCapacityPerTick,
    company: { name: companyName, soldiers: [] },
    barracksPopSlots: START.barracksPopSlots,
    squads: [],
    garage: [],
    researchUnlocked: [],
  };
}

export function listStartingCalibers() {
  return CALIBERS.map((c) => ({
    id: c.id,
    name: c.name,
    rifle: getRifleForCaliber(c.id)?.name ?? c.rifleId,
    productionCost: c.productionCost,
    weightPerRound: c.weightPerRound,
    volumePerRound: c.volumePerRound,
    baseDamage: c.baseDamage,
    basePenetration: c.basePenetration,
    gunPowderAmount: c.gunPowderAmount,
    familyId: c.familyId,
    variant: c.variant,
    supplyEfficiency: c.supplyEfficiency,
  }));
}

export function selectCaliber(state: GameState, caliberId: CaliberId): ActionResult {
  if (state.selectedCaliberId) {
    return {
      ok: false,
      state,
      message: `Caliber already locked: ${state.selectedCaliberId}. Reset not available in Phase 1.`,
    };
  }
  const cal = CALIBERS.find((c) => c.id === caliberId);
  if (!cal) {
    return { ok: false, state, message: `Unknown caliber: ${caliberId}` };
  }
  const rifle = getRifleForCaliber(caliberId);
  return {
    ok: true,
    state: { ...state, selectedCaliberId: caliberId },
    message: `Selected ${cal.name}. Unlocked rifle: ${rifle?.name ?? cal.rifleId}.`,
  };
}
