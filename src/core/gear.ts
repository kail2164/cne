import { getCaliber, getRifle } from "./catalog.js";
import type { GearDef, Loadout, Soldier } from "./types.js";

/** Pouches → armor / demo suits. Ammo bonus shares the same carry pool. */
export const GEARS: GearDef[] = [
  { id: "basic-pouch", name: "Basic Pouches", weightKg: 1.2, ammoCapacityBonus: 20, armorBonus: 0, productionCost: 4 },
  { id: "ammo-bandolier", name: "Ammo Bandolier", weightKg: 2.5, ammoCapacityBonus: 60, armorBonus: 0, productionCost: 8 },
  { id: "steel-helmet", name: "Steel Helmet", weightKg: 1.4, ammoCapacityBonus: 0, armorBonus: 8, productionCost: 12 },
  { id: "body-armor", name: "Body Armor", weightKg: 8, ammoCapacityBonus: 0, armorBonus: 25, productionCost: 28 },
  { id: "demo-suit", name: "Demolition Suit", weightKg: 14, ammoCapacityBonus: 10, armorBonus: 40, productionCost: 40 },
];

export function getGear(id: string): GearDef | undefined {
  return GEARS.find((g) => g.id === id);
}

/** Shared carry capacity in kg from strength. */
export function carryCapacityKg(strength: number): number {
  return Number((8 + strength * 0.35).toFixed(2));
}

export function gearWeightKg(loadout: Loadout | null): number {
  if (!loadout) return 0;
  return (loadout.gearIds ?? []).reduce((n, id) => n + (getGear(id)?.weightKg ?? 0), 0);
}

export function ammoWeightKg(loadout: Loadout | null): number {
  if (!loadout || loadout.ammoRounds <= 0) return 0;
  const cal = getCaliber(loadout.ammoCaliberId);
  const per = cal?.weightPerRound ?? 0.025;
  return loadout.ammoRounds * per;
}

/** Grenades stub — no inventory yet; reserved weight 0. */
export function grenadeWeightKg(_loadout: Loadout | null): number {
  return 0;
}

export function carriedWeightKg(soldier: Soldier): number {
  return (
    ammoWeightKg(soldier.loadout) +
    gearWeightKg(soldier.loadout) +
    grenadeWeightKg(soldier.loadout)
  );
}

export function ammoCapacityBonus(soldier: Soldier): number {
  if (!soldier.loadout) return 0;
  return (soldier.loadout.gearIds ?? []).reduce(
    (n, id) => n + (getGear(id)?.ammoCapacityBonus ?? 0),
    0,
  );
}

/** Max rounds from strength base + gear bonus. */
export function maxAmmoCarry(soldier: Soldier): number {
  const base = Math.floor(20 + soldier.strength * 0.9);
  return base + ammoCapacityBonus(soldier);
}

export function canCarryAmmo(soldier: Soldier, additionalRounds: number): boolean {
  if (!soldier.loadout) return false;
  const nextRounds = soldier.loadout.ammoRounds + additionalRounds;
  if (nextRounds > maxAmmoCarry(soldier)) return false;
  const cal = getCaliber(soldier.loadout.ammoCaliberId);
  const per = cal?.weightPerRound ?? 0.025;
  const nextWeight =
    gearWeightKg(soldier.loadout) +
    grenadeWeightKg(soldier.loadout) +
    nextRounds * per;
  return nextWeight <= carryCapacityKg(soldier.strength) + 0.01;
}

export function isArmed(soldier: Soldier): boolean {
  if (!soldier.alive || !soldier.loadout?.weaponId) return false;
  const w = getRifle(soldier.loadout.weaponId);
  if (!w) return false;
  return soldier.loadout.ammoRounds >= Math.max(1, w.ammoCapacity);
}

export function describeCarry(soldier: Soldier): string {
  const cap = carryCapacityKg(soldier.strength);
  const used = carriedWeightKg(soldier);
  return `${used.toFixed(1)}/${cap.toFixed(1)} kg`;
}
