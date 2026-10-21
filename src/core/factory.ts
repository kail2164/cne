import { getCaliber, getRifleForCaliber } from "./catalog.js";
import type {
  ActionResult,
  FactoryAllocation,
  GameState,
  ProductionTickResult,
} from "./types.js";
import { getQuantity, storeAsMany, withdrawItems } from "./warehouse.js";

const EPS = 1e-6;

export function setFactoryAllocation(
  state: GameState,
  allocation: FactoryAllocation,
): ActionResult {
  if (!state.selectedCaliberId) {
    return {
      ok: false,
      state,
      message: "Select a caliber family before allocating factory lines.",
    };
  }
  const sum = allocation.ammo + allocation.rifles;
  if (Math.abs(sum - 1) > EPS || allocation.ammo < 0 || allocation.rifles < 0) {
    return {
      ok: false,
      state,
      message: `Allocations must be non-negative and sum to 100% (got ammo=${allocation.ammo}, rifles=${allocation.rifles}).`,
    };
  }
  return {
    ok: true,
    state: { ...state, factoryAllocation: { ...allocation } },
    message: `Factory set to ${Math.round(allocation.ammo * 100)}% ammo / ${Math.round(allocation.rifles * 100)}% rifles.`,
  };
}

export function runFactoryTick(state: GameState): ActionResult<ProductionTickResult> {
  if (!state.selectedCaliberId) {
    return {
      ok: false,
      state,
      message: "Select a caliber before running production.",
      data: {
        producedAmmo: 0,
        producedRifles: 0,
        fundsSpent: 0,
        materialsSpent: 0,
        shortfalls: ["no caliber selected"],
        warehouseNotes: [],
      },
    };
  }

  const cal = getCaliber(state.selectedCaliberId)!;
  const rifle = getRifleForCaliber(state.selectedCaliberId)!;
  const capacity = state.factoryCapacityPerTick;
  const ammoPoints = capacity * state.factoryAllocation.ammo;
  const riflePoints = capacity * state.factoryAllocation.rifles;

  // One "point" ≈ one unit of production effort; ammo is cheap/fast, rifles costly.
  const desiredAmmo = Math.floor(ammoPoints * 2.5);
  const desiredRifles = Math.floor(riflePoints / 8);

  const shortfalls: string[] = [];
  const warehouseNotes: string[] = [];
  let funds = state.funds;
  let next = state;
  let producedAmmo = 0;
  let producedRifles = 0;
  let fundsSpent = 0;
  let materialsSpent = 0;

  const materialsAvailable = getQuantity(next.warehouse, "raw_materials", "raw");

  const ammoFundNeed = desiredAmmo * cal.productionCost;
  const ammoMatNeed = desiredAmmo * cal.materialCost;
  const rifleFundNeed = desiredRifles * rifle.productionCost;
  const rifleMatNeed = desiredRifles * rifle.materialCost;

  let ammoQty = desiredAmmo;
  let rifleQty = desiredRifles;

  // Scale down if funds/materials insufficient for both; prefer proportional cut.
  const totalFundNeed = ammoFundNeed + rifleFundNeed;
  const totalMatNeed = ammoMatNeed + rifleMatNeed;
  let fundScale = totalFundNeed > 0 ? Math.min(1, funds / totalFundNeed) : 1;
  let matScale = totalMatNeed > 0 ? Math.min(1, materialsAvailable / totalMatNeed) : 1;
  const scale = Math.min(fundScale, matScale);

  if (scale < 1 - EPS) {
    if (fundScale < 1 - EPS) shortfalls.push("insufficient funds");
    if (matScale < 1 - EPS) shortfalls.push("insufficient raw materials");
  }

  ammoQty = Math.floor(desiredAmmo * scale);
  rifleQty = Math.floor(desiredRifles * scale);

  const spendFunds =
    ammoQty * cal.productionCost + rifleQty * rifle.productionCost;
  const spendMats =
    ammoQty * cal.materialCost + rifleQty * rifle.materialCost;

  if (spendMats > 0) {
    const wd = withdrawItems(next, "raw_materials", "raw", Math.ceil(spendMats));
    if (!wd.ok) {
      shortfalls.push("raw materials withdraw failed");
      return {
        ok: false,
        state,
        message: wd.message,
        data: {
          producedAmmo: 0,
          producedRifles: 0,
          fundsSpent: 0,
          materialsSpent: 0,
          shortfalls,
          warehouseNotes,
        },
      };
    }
    next = wd.state;
    materialsSpent = Math.ceil(spendMats);
  }

  funds -= spendFunds;
  fundsSpent = spendFunds;
  next = { ...next, funds };

  if (ammoQty > 0) {
    const st = storeAsMany(
      next,
      "ammo",
      cal.id,
      ammoQty,
      cal.weightPerRound,
      cal.volumePerRound,
    );
    producedAmmo = st.data?.stored ?? 0;
    next = st.state;
    if (producedAmmo < ammoQty) {
      warehouseNotes.push(
        `Ammo warehouse limited: stored ${producedAmmo}/${ammoQty} (refund unused inputs not applied in Phase 1).`,
      );
    }
  }

  if (rifleQty > 0) {
    const st = storeAsMany(
      next,
      "weapon",
      rifle.id,
      rifleQty,
      rifle.weight,
      rifle.volume,
    );
    producedRifles = st.data?.stored ?? 0;
    next = st.state;
    if (producedRifles < rifleQty) {
      warehouseNotes.push(
        `Rifle warehouse limited: stored ${producedRifles}/${rifleQty}.`,
      );
    }
  }

  const ok = producedAmmo + producedRifles > 0 || shortfalls.length === 0;
  return {
    ok,
    state: next,
    message:
      producedAmmo + producedRifles > 0
        ? `Produced ${producedAmmo} rounds and ${producedRifles} rifles.`
        : `No production this tick (${shortfalls.join(", ") || "zero allocation yield"}).`,
    data: {
      producedAmmo,
      producedRifles,
      fundsSpent,
      materialsSpent,
      shortfalls,
      warehouseNotes,
    },
  };
}
