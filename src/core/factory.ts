import { getRifleForCaliber, getSelectedAmmo } from "./catalog.js";
import { GEARS, getGear } from "./gear.js";
import {
  isFactoryTierUnlocked,
  isGearUnlocked,
  isLoadSubtypeUnlocked,
  isWeaponUnlocked,
  productionOutputMult,
} from "./research.js";
import type {
  ActionResult,
  CycleProductionLine,
  CycleProductionResult,
  FactoryProduct,
  FactoryProductKind,
  FactorySlot,
  FactoryTierDef,
  FactoryTierId,
  GameState,
  OwnedFactory,
} from "./types.js";
import { storeAsMany } from "./warehouse.js";

export const MAX_FACTORY_STAGE = 5;

export const FACTORY_TIERS: FactoryTierDef[] = [
  {
    id: "blacksmith",
    name: "Local Blacksmith",
    baseBuildCost: 800,
    baseAmmo: 250,
    baseWeapons: 5,
    baseGears: 6,
    baseGrenades: 15,
    unitCostMult: 1.0,
  },
  {
    id: "workshop",
    name: "Workshop",
    baseBuildCost: 1600,
    baseAmmo: 300,
    baseWeapons: 6,
    baseGears: 8,
    baseGrenades: 20,
    unitCostMult: 1.1,
  },
  {
    id: "manufactory",
    name: "Manufactory",
    baseBuildCost: 3200,
    baseAmmo: 375,
    baseWeapons: 8,
    baseGears: 10,
    baseGrenades: 28,
    unitCostMult: 1.25,
  },
  {
    id: "arsenal",
    name: "Arsenal",
    baseBuildCost: 6400,
    baseAmmo: 450,
    baseWeapons: 10,
    baseGears: 14,
    baseGrenades: 36,
    unitCostMult: 1.4,
  },
  {
    id: "industrial",
    name: "Industrial Works",
    baseBuildCost: 12800,
    baseAmmo: 550,
    baseWeapons: 12,
    baseGears: 18,
    baseGrenades: 45,
    unitCostMult: 1.6,
  },
];

/** Default grenade stub. */
export const GRENADES = [
  {
    id: "mills-bomb",
    name: "Mills Bomb",
    productionCost: 2.5,
    weight: 0.7,
    volume: 0.35,
  },
] as const;

export function getFactoryTier(id: string): FactoryTierDef | undefined {
  return FACTORY_TIERS.find((t) => t.id === id);
}

export function getGrenade(id: string) {
  return GRENADES.find((g) => g.id === id);
}

/** Stage output multiplier: +50% each stage vs previous → 1.5^(stage−1). */
export function stageOutputMult(stage: number): number {
  const s = Math.min(MAX_FACTORY_STAGE, Math.max(1, Math.floor(stage)));
  return Math.pow(1.5, s - 1);
}

export function slotCountForStage(stage: number): number {
  return stage >= MAX_FACTORY_STAGE ? 2 : 1;
}

export function normalizeProduct(product: FactoryProduct): FactoryProductKind {
  return product === "rifles" ? "weapons" : product;
}

function emptySlot(): FactorySlot {
  return { product: null, locked: false };
}

export function createOwnedFactory(
  id: string,
  tierId: FactoryTierId,
  stage = 1,
): OwnedFactory {
  const slots = Array.from({ length: slotCountForStage(stage) }, () => emptySlot());
  return { id, tierId, stage, slots };
}

export function startingBlacksmith(): OwnedFactory {
  return createOwnedFactory("fac-1", "blacksmith", 1);
}

export function nextTierPrice(state: GameState, tierId: FactoryTierId): number {
  const tier = getFactoryTier(tierId)!;
  return state.factoryTierNextPrice[tierId] ?? tier.baseBuildCost;
}

export function upgradeCost(factory: OwnedFactory): number | null {
  if (factory.stage >= MAX_FACTORY_STAGE) return null;
  const tier = getFactoryTier(factory.tierId)!;
  return Math.round(tier.baseBuildCost * 0.35 * factory.stage);
}

export function describeFactories(state: GameState): string[] {
  return state.factories.map((f, i) => {
    const tier = getFactoryTier(f.tierId)!;
    const mult = stageOutputMult(f.stage);
    const slots = f.slots
      .map((s, si) => `S${si + 1}:${s.product ?? "idle"}${s.locked ? "*" : ""}`)
      .join(" ");
    return (
      `${i + 1}. [${f.id}] ${tier.name} stage ${f.stage}/${MAX_FACTORY_STAGE} ` +
      `(×${mult.toFixed(2)} → ammo ${Math.floor(tier.baseAmmo * mult)} / guns ${Math.floor(tier.baseWeapons * mult)}) ` +
      `${slots}`
    );
  });
}

export function buyFactory(
  state: GameState,
  tierId: FactoryTierId,
): ActionResult<{ factory: OwnedFactory; price: number }> {
  const tier = getFactoryTier(tierId);
  if (!tier) {
    return { ok: false, state, message: `Unknown factory tier: ${tierId}` };
  }
  if (!isFactoryTierUnlocked(state, tierId)) {
    return {
      ok: false,
      state,
      message: `${tier.name} locked — research building-factory-${tierId} first.`,
    };
  }
  const price = nextTierPrice(state, tierId);
  if (state.funds < price) {
    return {
      ok: false,
      state,
      message: `Need $${price} to buy ${tier.name} (have $${state.funds.toFixed(0)}).`,
    };
  }
  const id = `fac-${state.factories.length + 1}`;
  const factory = createOwnedFactory(id, tierId, 1);
  const nextPrice = price * 2;
  return {
    ok: true,
    state: {
      ...state,
      funds: state.funds - price,
      factories: [...state.factories, factory],
      factoryTierNextPrice: {
        ...state.factoryTierNextPrice,
        [tierId]: nextPrice,
      },
    },
    message: `Bought ${tier.name} for $${price}. Next ${tier.name} costs $${nextPrice}.`,
    data: { factory, price },
  };
}

export function upgradeFactory(
  state: GameState,
  factoryId: string,
): ActionResult<{ factory: OwnedFactory }> {
  const idx = state.factories.findIndex((f) => f.id === factoryId);
  if (idx < 0) {
    return { ok: false, state, message: `Unknown factory: ${factoryId}` };
  }
  const fac = state.factories[idx]!;
  const cost = upgradeCost(fac);
  if (cost == null) {
    return { ok: false, state, message: `${fac.id} already at stage ${MAX_FACTORY_STAGE}.` };
  }
  if (state.funds < cost) {
    return {
      ok: false,
      state,
      message: `Need $${cost} to upgrade ${fac.id} (have $${state.funds.toFixed(0)}).`,
    };
  }
  const newStage = fac.stage + 1;
  const needSlots = slotCountForStage(newStage);
  const slots = [...fac.slots.map((s) => ({ ...s }))];
  while (slots.length < needSlots) slots.push(emptySlot());

  const updated: OwnedFactory = { ...fac, stage: newStage, slots };
  const factories = state.factories.map((f, i) => (i === idx ? updated : f));
  const unlock =
    newStage === MAX_FACTORY_STAGE ? " Second manufacture slot unlocked!" : "";

  return {
    ok: true,
    state: { ...state, funds: state.funds - cost, factories },
    message: `Upgraded ${fac.id} to stage ${newStage} (−$${cost}).${unlock}`,
    data: { factory: updated },
  };
}

export function setFactorySlotProduct(
  state: GameState,
  factoryId: string,
  slotIndex: number,
  product: FactoryProduct,
): ActionResult {
  const kind = normalizeProduct(product);
  const idx = state.factories.findIndex((f) => f.id === factoryId);
  if (idx < 0) {
    return { ok: false, state, message: `Unknown factory: ${factoryId}` };
  }
  const fac = state.factories[idx]!;
  if (slotIndex < 0 || slotIndex >= fac.slots.length) {
    return {
      ok: false,
      state,
      message: `${fac.id} has slots 0–${fac.slots.length - 1} (stage ${fac.stage}).`,
    };
  }
  if (kind === "ammo" || kind === "weapons") {
    if (!state.selectedCaliberId) {
      return {
        ok: false,
        state,
        message: "Select a caliber before setting ammo/weapons production.",
      };
    }
  }
  const slot = fac.slots[slotIndex]!;
  if (slot.locked && slot.product && slot.product !== kind) {
    return {
      ok: false,
      state,
      message: `${fac.id} slot ${slotIndex + 1} locked to ${slot.product} this month. End turn to change.`,
    };
  }

  const slots = fac.slots.map((s, i) =>
    i === slotIndex ? { product: kind, locked: true } : s,
  );
  const factories = state.factories.map((f, i) =>
    i === idx ? { ...f, slots } : f,
  );

  return {
    ok: true,
    state: { ...state, factories },
    message: `${fac.id} slot ${slotIndex + 1} → ${kind} (locked until end turn).`,
  };
}

/** Convenience: set first factory, first slot (demo / simple CLI). */
export function setFactoryProduct(
  state: GameState,
  product: FactoryProduct,
): ActionResult {
  const first = state.factories[0];
  if (!first) {
    return { ok: false, state, message: "No factories owned." };
  }
  return setFactorySlotProduct(state, first.id, 0, product);
}

export function unlockAllFactorySlots(state: GameState): GameState {
  return {
    ...state,
    factories: state.factories.map((f) => ({
      ...f,
      slots: f.slots.map((s) => ({ ...s, locked: false })),
    })),
  };
}

function emptyResult(): CycleProductionResult {
  return {
    producedAmmo: 0,
    producedRifles: 0,
    producedGears: 0,
    producedGrenades: 0,
    fundsSpent: 0,
    shortfalls: [],
    warehouseNotes: [],
    lines: [],
  };
}

function targetQty(
  tier: FactoryTierDef,
  stage: number,
  kind: FactoryProductKind,
): number {
  const m = stageOutputMult(stage);
  switch (kind) {
    case "ammo":
      return Math.floor(tier.baseAmmo * m);
    case "weapons":
      return Math.floor(tier.baseWeapons * m);
    case "gears":
      return Math.floor(tier.baseGears * m);
    case "grenades":
      return Math.floor(tier.baseGrenades * m);
    case "vehicles":
      return 0;
  }
}

/** Resolve all factories/slots for the month (money only). */
export function resolveFactoryMonth(
  state: GameState,
): ActionResult<CycleProductionResult> {
  const agg = emptyResult();
  let next = state;
  const lines: CycleProductionLine[] = [];

  if (next.factories.length === 0) {
    return {
      ok: true,
      state: next,
      message: "No factories — idle.",
      data: agg,
    };
  }

  for (const fac of next.factories) {
    const tier = getFactoryTier(fac.tierId)!;
    for (let si = 0; si < fac.slots.length; si++) {
      const slot = fac.slots[si]!;
      if (!slot.product) continue;

      if (slot.product === "vehicles") {
        lines.push({
          factoryId: fac.id,
          slotIndex: si,
          product: "vehicles",
          quantity: 0,
          fundsSpent: 0,
          note: "vehicles deferred",
        });
        agg.warehouseNotes.push(`${fac.id} S${si + 1}: vehicles deferred.`);
        continue;
      }

      let qty = Math.floor(
        targetQty(tier, fac.stage, slot.product) * productionOutputMult(next),
      );
      let unitCost = 0;
      let itemId = "";
      let kindStock: "ammo" | "weapon" | "gear" | "grenade" = "ammo";
      let weight = 1;
      let volume = 1;

      if (slot.product === "ammo") {
        const cal = getSelectedAmmo(next);
        if (!cal) {
          agg.shortfalls.push(`${fac.id}: no ammo load`);
          continue;
        }
        if (
          next.selectedCaliberId &&
          !isLoadSubtypeUnlocked(next, next.selectedCaliberId, cal.variant)
        ) {
          agg.shortfalls.push(`${fac.id}: load ${cal.variant} not researched`);
          continue;
        }
        unitCost = cal.productionCost * tier.unitCostMult;
        itemId = cal.id;
        kindStock = "ammo";
        weight = cal.weightPerRound;
        volume = cal.volumePerRound;
      } else if (slot.product === "weapons") {
        if (!next.selectedCaliberId) {
          agg.shortfalls.push(`${fac.id}: no caliber`);
          continue;
        }
        const rifle = getRifleForCaliber(next.selectedCaliberId);
        if (!rifle) {
          agg.shortfalls.push(`${fac.id}: no rifle`);
          continue;
        }
        if (!isWeaponUnlocked(next, rifle.id)) {
          agg.shortfalls.push(`${fac.id}: weapon ${rifle.id} not researched`);
          continue;
        }
        unitCost = rifle.productionCost * tier.unitCostMult;
        itemId = rifle.id;
        kindStock = "weapon";
        weight = rifle.weight;
        volume = rifle.volume;
      } else if (slot.product === "gears") {
        // Prefer highest unlocked gear that is researchable; default pouch.
        const prefer = ["demo-suit", "body-armor", "ammo-bandolier", "steel-helmet", "basic-pouch"];
        const gearId =
          prefer.find((id) => isGearUnlocked(next, id) && getGear(id)) ?? "basic-pouch";
        if (!isGearUnlocked(next, gearId)) {
          agg.shortfalls.push(`${fac.id}: no researched gear`);
          continue;
        }
        const gear = getGear(gearId) ?? GEARS[0]!;
        unitCost = 4 * tier.unitCostMult;
        itemId = gear.id;
        kindStock = "gear";
        weight = gear.weightKg;
        volume = Math.max(0.2, gear.weightKg * 0.15);
      } else if (slot.product === "grenades") {
        const g = getGrenade("mills-bomb")!;
        unitCost = g.productionCost * tier.unitCostMult;
        itemId = g.id;
        kindStock = "grenade";
        weight = g.weight;
        volume = g.volume;
      }

      const maxAfford = Math.floor(next.funds / Math.max(0.01, unitCost));
      if (maxAfford < qty) {
        agg.shortfalls.push(`${fac.id} S${si + 1}: insufficient funds`);
        qty = Math.max(0, maxAfford);
      }
      if (qty <= 0) {
        lines.push({
          factoryId: fac.id,
          slotIndex: si,
          product: slot.product,
          quantity: 0,
          fundsSpent: 0,
          note: "no output",
        });
        continue;
      }

      const spent = qty * unitCost;
      next = { ...next, funds: next.funds - spent };
      const st = storeAsMany(next, kindStock, itemId, qty, weight, volume);
      const stored = st.data?.stored ?? 0;
      next = st.state;
      if (stored < qty) {
        agg.warehouseNotes.push(
          `${fac.id} S${si + 1}: stored ${stored}/${qty} ${itemId}.`,
        );
      }

      if (slot.product === "ammo") agg.producedAmmo += stored;
      if (slot.product === "weapons") agg.producedRifles += stored;
      if (slot.product === "gears") agg.producedGears += stored;
      if (slot.product === "grenades") agg.producedGrenades += stored;
      agg.fundsSpent += spent;

      lines.push({
        factoryId: fac.id,
        slotIndex: si,
        product: slot.product,
        quantity: stored,
        fundsSpent: spent,
        note: itemId,
      });
    }
  }

  agg.lines = lines;
  const made =
    agg.producedAmmo +
    agg.producedRifles +
    agg.producedGears +
    agg.producedGrenades;

  const msg =
    made > 0
      ? `Month production: ${agg.producedAmmo} rd, ${agg.producedRifles} guns, ${agg.producedGears} gear, ${agg.producedGrenades} grenades (−$${agg.fundsSpent.toFixed(0)}).`
      : lines.some((l) => l.note === "vehicles deferred")
        ? `No factory goods (vehicles deferred).`
        : `No factory output (${agg.shortfalls.join(", ") || "idle"}).`;

  return {
    ok: made > 0 || agg.shortfalls.length === 0 || lines.length > 0,
    state: next,
    message: msg,
    data: agg,
  };
}
