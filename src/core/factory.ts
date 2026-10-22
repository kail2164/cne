import {
  CALIBER_FAMILIES,
  LOAD_SUBTYPES,
  RIFLES,
  getCaliber,
  getRifle,
  getRifleForCaliber,
  getSelectedAmmo,
} from "./catalog.js";
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
  StockKind,
} from "./types.js";
import { storeAsMany } from "./warehouse.js";

export const MAX_FACTORY_STAGE = 5;

/** Each stage doubles the previous stage's output and the funds it spends. */
export const STAGE_SCALE = 2;

/** Each higher tier makes twice as much as the previous tier. */
export const TIER_OUTPUT_SCALE = 2;

/** Each higher tier spends 2.5× the funds of the previous tier. */
export const TIER_INPUT_SCALE = 2.5;

const BLACKSMITH_BUILD = 800;
const BLACKSMITH_OUTPUT = {
  ammo: 250,
  weapons: 5,
  gears: 6,
  grenades: 15,
} as const;

const TIER_ROWS: { id: FactoryTierId; name: string }[] = [
  { id: "blacksmith", name: "Local Blacksmith" },
  { id: "workshop", name: "Workshop" },
  { id: "manufactory", name: "Manufactory" },
  { id: "arsenal", name: "Arsenal" },
  { id: "industrial", name: "Industrial Works" },
];

export const FACTORY_TIERS: FactoryTierDef[] = TIER_ROWS.map((row, index) => {
  const output = TIER_OUTPUT_SCALE ** index;
  const input = TIER_INPUT_SCALE ** index;
  return {
    id: row.id,
    name: row.name,
    baseBuildCost: BLACKSMITH_BUILD * 2 ** index,
    baseAmmo: BLACKSMITH_OUTPUT.ammo * output,
    baseWeapons: BLACKSMITH_OUTPUT.weapons * output,
    baseGears: BLACKSMITH_OUTPUT.gears * output,
    baseGrenades: BLACKSMITH_OUTPUT.grenades * output,
    unitCostMult: input / output,
  };
});

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

export interface ManufacturableItem {
  kind: Exclude<FactoryProductKind, "vehicles">;
  itemId: string;
  name: string;
  /** Catalog funds per unit, before the factory tier multiplier. */
  catalogCost: number;
}

export interface ManufactureQuote {
  name: string;
  quantity: number;
  unitCost: number;
  funds: number;
}

export function getFactoryTier(id: string): FactoryTierDef | undefined {
  return FACTORY_TIERS.find((t) => t.id === id);
}

export function getGrenade(id: string) {
  return GRENADES.find((g) => g.id === id);
}

/** Stage throughput versus stage 1. Stage 2 is ×2, stage 3 is ×4, and so on. */
export function stageOutputMult(stage: number): number {
  const s = Math.min(MAX_FACTORY_STAGE, Math.max(1, Math.floor(stage)));
  return STAGE_SCALE ** (s - 1);
}

export function describeTierEconomy(tierId: FactoryTierId): string {
  const index = FACTORY_TIERS.findIndex((t) => t.id === tierId);
  const tier = FACTORY_TIERS[index];
  if (!tier || index <= 0) {
    return "Cheapest unit cost. Each stage doubles output and the funds spent.";
  }
  const prev = FACTORY_TIERS[index - 1]!;
  return `Twice the output of the ${prev.name} and 2.5× the funds (unit cost ×${tier.unitCostMult.toFixed(2)} vs a blacksmith).`;
}

export function slotCountForStage(stage: number): number {
  return stage >= MAX_FACTORY_STAGE ? 2 : 1;
}

export function normalizeProduct(product: FactoryProduct): FactoryProductKind {
  return product === "rifles" ? "weapons" : product;
}

function emptySlot(): FactorySlot {
  return { product: null, itemId: null, locked: false };
}

function roundUnit(n: number): number {
  return Number(n.toFixed(4));
}

function roundFunds(n: number): number {
  return Number(n.toFixed(2));
}

function formatMoney(n: number): string {
  const rounded = roundFunds(n);
  return Number.isInteger(rounded) ? `$${rounded}` : `$${rounded.toFixed(2)}`;
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

interface ItemSpec {
  name: string;
  catalogCost: number;
  stockKind: StockKind;
  weight: number;
  volume: number;
}

function itemSpec(kind: FactoryProductKind, itemId: string): ItemSpec | null {
  if (kind === "ammo") {
    const cal = getCaliber(itemId);
    if (!cal) return null;
    return {
      name: cal.name,
      catalogCost: cal.productionCost,
      stockKind: "ammo",
      weight: cal.weightPerRound,
      volume: cal.volumePerRound,
    };
  }
  if (kind === "weapons") {
    const rifle = getRifle(itemId);
    if (!rifle) return null;
    return {
      name: rifle.name,
      catalogCost: rifle.productionCost,
      stockKind: "weapon",
      weight: rifle.weight,
      volume: rifle.volume,
    };
  }
  if (kind === "gears") {
    const gear = getGear(itemId);
    if (!gear) return null;
    return {
      name: gear.name,
      catalogCost: gear.productionCost,
      stockKind: "gear",
      weight: gear.weightKg,
      volume: Math.max(0.2, gear.weightKg * 0.15),
    };
  }
  if (kind === "grenades") {
    const grenade = getGrenade(itemId);
    if (!grenade) return null;
    return {
      name: grenade.name,
      catalogCost: grenade.productionCost,
      stockKind: "grenade",
      weight: grenade.weight,
      volume: grenade.volume,
    };
  }
  return null;
}

function defaultItemId(state: GameState, kind: FactoryProductKind): string | null {
  if (kind === "ammo") return getSelectedAmmo(state)?.id ?? null;
  if (kind === "weapons") {
    if (!state.selectedCaliberId) return null;
    return getRifleForCaliber(state.selectedCaliberId)?.id ?? null;
  }
  if (kind === "gears") {
    const prefer = ["demo-suit", "body-armor", "ammo-bandolier", "steel-helmet", "basic-pouch"];
    return prefer.find((id) => isGearUnlocked(state, id) && getGear(id)) ?? null;
  }
  if (kind === "grenades") return GRENADES[0]?.id ?? null;
  return null;
}

function rejectItem(state: GameState, kind: FactoryProductKind, itemId: string): string | null {
  if (kind === "vehicles") return null;
  if (kind === "ammo") {
    const cal = getCaliber(itemId);
    if (!cal) return `Unknown ammunition: ${itemId}`;
    if (!isLoadSubtypeUnlocked(state, cal.familyId, cal.variant)) {
      return `${cal.name} is not researched.`;
    }
    return null;
  }
  if (kind === "weapons") {
    const rifle = getRifle(itemId);
    if (!rifle) return `Unknown weapon: ${itemId}`;
    if (!isWeaponUnlocked(state, rifle.id)) return `${rifle.name} is not researched.`;
    return null;
  }
  if (kind === "gears") {
    const gear = getGear(itemId);
    if (!gear) return `Unknown equipment: ${itemId}`;
    if (!isGearUnlocked(state, gear.id)) return `${gear.name} is not researched.`;
    return null;
  }
  if (kind === "grenades") {
    if (!getGrenade(itemId)) return `Unknown grenade: ${itemId}`;
    return null;
  }
  return `Unknown product: ${kind}`;
}

/** Unlocked catalog rows the player can assign to a manufacture slot. */
export function listManufacturable(
  state: GameState,
  kind?: FactoryProductKind,
): ManufacturableItem[] {
  const items: ManufacturableItem[] = [];
  const want = (next: FactoryProductKind) => !kind || kind === next;

  if (want("ammo")) {
    for (const family of CALIBER_FAMILIES) {
      for (const subtype of LOAD_SUBTYPES) {
        if (!isLoadSubtypeUnlocked(state, family.id, subtype)) continue;
        const ammo = getCaliber(`${family.id}-${subtype}`);
        if (!ammo) continue;
        items.push({
          kind: "ammo",
          itemId: ammo.id,
          name: ammo.name,
          catalogCost: ammo.productionCost,
        });
      }
    }
  }
  if (want("weapons")) {
    for (const rifle of RIFLES) {
      if (!isWeaponUnlocked(state, rifle.id)) continue;
      items.push({
        kind: "weapons",
        itemId: rifle.id,
        name: rifle.name,
        catalogCost: rifle.productionCost,
      });
    }
  }
  if (want("gears")) {
    for (const gear of GEARS) {
      if (!isGearUnlocked(state, gear.id)) continue;
      items.push({
        kind: "gears",
        itemId: gear.id,
        name: gear.name,
        catalogCost: gear.productionCost,
      });
    }
  }
  if (want("grenades")) {
    for (const grenade of GRENADES) {
      items.push({
        kind: "grenades",
        itemId: grenade.id,
        name: grenade.name,
        catalogCost: grenade.productionCost,
      });
    }
  }
  return items;
}

export function quoteManufacture(
  state: GameState,
  tierId: FactoryTierId,
  stage: number,
  kind: FactoryProductKind,
  itemId: string,
): ManufactureQuote | null {
  const tier = getFactoryTier(tierId);
  const spec = itemSpec(kind, itemId);
  if (!tier || !spec || kind === "vehicles") return null;
  const quantity = Math.floor(
    targetQty(tier, stage, kind) * productionOutputMult(state),
  );
  const unitCost = roundUnit(spec.catalogCost * tier.unitCostMult);
  return {
    name: spec.name,
    quantity,
    unitCost,
    funds: roundFunds(quantity * unitCost),
  };
}

function slotSummary(state: GameState, factory: OwnedFactory, slot: FactorySlot, index: number): string {
  const lock = slot.locked ? "*" : "";
  if (!slot.product) return `S${index + 1}:idle`;
  if (slot.product === "vehicles") return `S${index + 1}:vehicles${lock}`;
  if (!slot.itemId) return `S${index + 1}:${slot.product}${lock}`;
  const quote = quoteManufacture(state, factory.tierId, factory.stage, slot.product, slot.itemId);
  if (!quote) return `S${index + 1}:${slot.itemId}${lock}`;
  return `S${index + 1}:${quote.name} ${quote.quantity} @ ${formatMoney(quote.unitCost)} = ${formatMoney(quote.funds)}${lock}`;
}

export function describeFactories(state: GameState): string[] {
  return state.factories.map((f, i) => {
    const tier = getFactoryTier(f.tierId)!;
    const mult = stageOutputMult(f.stage);
    const slots = f.slots.map((s, si) => slotSummary(state, f, s, si)).join(" ");
    return (
      `${i + 1}. [${f.id}] ${tier.name} stage ${f.stage}/${MAX_FACTORY_STAGE} ` +
      `(output ×${mult}, unit ×${tier.unitCostMult.toFixed(2)}) ${slots}`
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
  const economy =
    tierId === "blacksmith"
      ? "Cheapest unit cost."
      : describeTierEconomy(tierId);
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
    message: `Bought ${tier.name} for $${price}. ${economy} Next ${tier.name} costs $${nextPrice}.`,
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
    newStage === MAX_FACTORY_STAGE ? " Second manufacture slot unlocked." : "";

  return {
    ok: true,
    state: { ...state, funds: state.funds - cost, factories },
    message: `Upgraded ${fac.id} to stage ${newStage} (−$${cost}). Output and monthly funds both double.${unlock}`,
    data: { factory: updated },
  };
}

export function setFactorySlotProduct(
  state: GameState,
  factoryId: string,
  slotIndex: number,
  product: FactoryProduct,
  itemId?: string,
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

  const explicit = itemId != null && itemId.trim() !== "";
  const resolved = explicit ? itemId!.trim() : defaultItemId(state, kind);
  if (kind !== "vehicles" && !resolved) {
    const noun =
      kind === "ammo" ? "an ammunition type" : kind === "weapons" ? "a weapon" : `a ${kind} item`;
    return { ok: false, state, message: `Choose ${noun} to manufacture.` };
  }
  if (resolved) {
    const reason = rejectItem(state, kind, resolved);
    if (reason) return { ok: false, state, message: reason };
  }

  const slot = fac.slots[slotIndex]!;
  const sameAssignment =
    slot.product === kind && (kind === "vehicles" || slot.itemId === resolved);
  if (slot.locked && slot.product && !sameAssignment) {
    const current = slot.itemId
      ? itemSpec(slot.product, slot.itemId)?.name ?? slot.product
      : slot.product;
    return {
      ok: false,
      state,
      message: `${fac.id} slot ${slotIndex + 1} locked to ${current} this month. End turn to change.`,
    };
  }

  const slots = fac.slots.map((s, i) =>
    i === slotIndex ? { product: kind, itemId: resolved, locked: true } : s,
  );
  const factories = state.factories.map((f, i) => (i === idx ? { ...f, slots } : f));
  const quote =
    resolved && kind !== "vehicles"
      ? quoteManufacture(state, fac.tierId, fac.stage, kind, resolved)
      : null;
  const detail = quote
    ? `${quote.name} (${quote.quantity} @ ${formatMoney(quote.unitCost)} = ${formatMoney(quote.funds)}/mo)`
    : kind;

  return {
    ok: true,
    state: { ...state, factories },
    message: `${fac.id} slot ${slotIndex + 1} → ${detail} (locked until end turn).`,
  };
}

/** Convenience: set first factory, first slot (demo / simple CLI). */
export function setFactoryProduct(
  state: GameState,
  product: FactoryProduct,
  itemId?: string,
): ActionResult {
  const first = state.factories[0];
  if (!first) {
    return { ok: false, state, message: "No factories owned." };
  }
  return setFactorySlotProduct(state, first.id, 0, product, itemId);
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

      const itemId = slot.itemId ?? defaultItemId(next, slot.product);
      if (!itemId) {
        agg.shortfalls.push(`${fac.id} S${si + 1}: no ${slot.product} selected`);
        continue;
      }
      const reason = rejectItem(next, slot.product, itemId);
      if (reason) {
        agg.shortfalls.push(`${fac.id} S${si + 1}: ${reason}`);
        continue;
      }
      const spec = itemSpec(slot.product, itemId);
      if (!spec) {
        agg.shortfalls.push(`${fac.id} S${si + 1}: unknown ${itemId}`);
        continue;
      }

      let qty = Math.floor(targetQty(tier, fac.stage, slot.product) * productionOutputMult(next));
      const unitCost = roundUnit(spec.catalogCost * tier.unitCostMult);
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

      const spent = roundFunds(qty * unitCost);
      next = { ...next, funds: next.funds - spent };
      const st = storeAsMany(next, spec.stockKind, itemId, qty, spec.weight, spec.volume);
      const stored = st.data?.stored ?? 0;
      next = st.state;
      if (stored < qty) {
        agg.warehouseNotes.push(`${fac.id} S${si + 1}: stored ${stored}/${qty} ${spec.name}.`);
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
        note: spec.name,
      });
    }
  }

  agg.lines = lines;
  const made =
    agg.producedAmmo + agg.producedRifles + agg.producedGears + agg.producedGrenades;

  const msg =
    made > 0
      ? `Month production: ${agg.producedAmmo} rd, ${agg.producedRifles} guns, ${agg.producedGears} gear, ${agg.producedGrenades} grenades (−${formatMoney(agg.fundsSpent)}).`
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
