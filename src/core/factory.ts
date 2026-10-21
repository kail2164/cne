import { getRifleForCaliber, getSelectedAmmo } from "./catalog.js";
import type {
  ActionResult,
  CycleProductionResult,
  FactoryProduct,
  GameState,
} from "./types.js";
import { storeAsMany } from "./warehouse.js";

export function setFactoryProduct(
  state: GameState,
  product: FactoryProduct,
): ActionResult {
  if (!state.selectedCaliberId) {
    return {
      ok: false,
      state,
      message: "Select a caliber before setting factory production.",
    };
  }
  if (state.factory.locked && state.factory.product && state.factory.product !== product) {
    return {
      ok: false,
      state,
      message: `Factory locked to ${state.factory.product} this month. End turn to change product.`,
    };
  }
  return {
    ok: true,
    state: {
      ...state,
      factory: {
        ...state.factory,
        product,
        locked: true,
      },
    },
    message: `Factory set to ${product} for ${state.year}-${String(state.month).padStart(2, "0")} (locked until end turn).`,
  };
}

/** Resolve current cycle production (money only). Does not advance calendar. */
export function resolveFactoryMonth(
  state: GameState,
): ActionResult<CycleProductionResult> {
  const empty: CycleProductionResult = {
    producedAmmo: 0,
    producedRifles: 0,
    fundsSpent: 0,
    shortfalls: [],
    warehouseNotes: [],
  };

  if (!state.factory.product) {
    return {
      ok: true,
      state,
      message: "Factory idle — no product this month.",
      data: empty,
    };
  }
  if (!state.selectedCaliberId) {
    return {
      ok: false,
      state,
      message: "No caliber selected.",
      data: { ...empty, shortfalls: ["no caliber"] },
    };
  }

  const cal = getSelectedAmmo(state);
  const rifle = getRifleForCaliber(state.selectedCaliberId)!;
  if (!cal) {
    return {
      ok: false,
      state,
      message: "No ammo load for selected family/subtype.",
      data: { ...empty, shortfalls: ["no ammo load"] },
    };
  }
  const cap = state.factory.monthlyCapacity;
  const shortfalls: string[] = [];
  const warehouseNotes: string[] = [];
  let next = state;
  let producedAmmo = 0;
  let producedRifles = 0;
  let fundsSpent = 0;

  if (state.factory.product === "ammo") {
    let qty = Math.floor(cap * 2.5);
    const unitCost = cal.productionCost;
    const maxAfford = Math.floor(next.funds / unitCost);
    if (maxAfford < qty) {
      shortfalls.push("insufficient funds");
      qty = Math.max(0, maxAfford);
    }
    if (qty > 0) {
      fundsSpent = qty * unitCost;
      next = { ...next, funds: next.funds - fundsSpent };
      const st = storeAsMany(
        next,
        "ammo",
        cal.id,
        qty,
        cal.weightPerRound,
        cal.volumePerRound,
      );
      producedAmmo = st.data?.stored ?? 0;
      next = st.state;
      if (producedAmmo < qty) {
        warehouseNotes.push(`Ammo space limited: stored ${producedAmmo}/${qty}.`);
      }
    }
  } else {
    let qty = Math.floor(cap / 8);
    const unitCost = rifle.productionCost;
    const maxAfford = Math.floor(next.funds / unitCost);
    if (maxAfford < qty) {
      shortfalls.push("insufficient funds");
      qty = Math.max(0, maxAfford);
    }
    if (qty > 0) {
      fundsSpent = qty * unitCost;
      next = { ...next, funds: next.funds - fundsSpent };
      const st = storeAsMany(next, "weapon", rifle.id, qty, rifle.weight, rifle.volume);
      producedRifles = st.data?.stored ?? 0;
      next = st.state;
      if (producedRifles < qty) {
        warehouseNotes.push(`Rifle space limited: stored ${producedRifles}/${qty}.`);
      }
    }
  }

  const made = producedAmmo + producedRifles;
  return {
    ok: made > 0 || shortfalls.length === 0,
    state: next,
    message:
      made > 0
        ? `Month production: ${producedAmmo} rounds, ${producedRifles} rifles (−$${fundsSpent.toFixed(0)}).`
        : `No factory output (${shortfalls.join(", ") || "idle/zero yield"}).`,
    data: {
      producedAmmo,
      producedRifles,
      fundsSpent,
      shortfalls,
      warehouseNotes,
    },
  };
}
