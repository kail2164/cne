import type { AmmoId, Loadout, PerkDef, Soldier } from "./types.js";

/** Exhausted soldiers fight at −40% effective combat stats. */
export const EXHAUSTION_FACTOR = 0.6;

export const WEIGHT_MIN_KG = 45; // ~100 lb
export const WEIGHT_MAX_KG = 100;
export const MAX_PERK_SLOTS = 5;

/** Stamina lost per combat tick while actively fighting. */
export const STAMINA_DRAIN_PER_TICK = 8;

/** Empty perk catalog — definitions land in a later change. */
export const PERKS: PerkDef[] = [];

export function clampWeightKg(weightKg: number): number {
  return Math.min(WEIGHT_MAX_KG, Math.max(WEIGHT_MIN_KG, weightKg));
}

/** Lighter → higher agility ceiling. */
export function agilityCapForWeight(weightKg: number): number {
  const w = clampWeightKg(weightKg);
  return Math.round(Math.min(95, Math.max(35, 95 - (w - WEIGHT_MIN_KG) * 1.1)));
}

/** Heavier → higher strength ceiling; ~45 kg cannot reach top strength. */
export function strengthCapForWeight(weightKg: number): number {
  const w = clampWeightKg(weightKg);
  return Math.round(Math.min(95, Math.max(35, 35 + (w - WEIGHT_MIN_KG) * 1.1)));
}

export function clampAgility(agility: number, weightKg: number): number {
  return Math.min(agilityCapForWeight(weightKg), Math.max(0, Math.round(agility)));
}

export function clampStrength(strength: number, weightKg: number): number {
  return Math.min(strengthCapForWeight(weightKg), Math.max(0, Math.round(strength)));
}

export function isExhausted(soldier: Soldier): boolean {
  return soldier.stamina <= 0;
}

export function exhaustionMultiplier(soldier: Soldier): number {
  return isExhausted(soldier) ? EXHAUSTION_FACTOR : 1;
}

/** Soft carry hint for ammo payload (hard encumbrance deferred). */
export function maxAmmoForStrength(strength: number): number {
  return Math.floor(20 + strength * 0.9);
}

export function sumPerkPercent(
  perkIds: string[],
  target: "soldier" | "weapon",
  stat: string,
): number {
  let total = 0;
  for (const id of perkIds) {
    const def = PERKS.find((p) => p.id === id);
    if (!def) continue;
    for (const b of def.boosts) {
      if (b.target === target && b.stat === stat) total += b.percent;
    }
  }
  return total;
}

export function assignPerk(
  soldier: Soldier,
  perkId: string,
): { ok: boolean; soldier: Soldier; message: string } {
  if (soldier.perkIds.includes(perkId)) {
    return { ok: false, soldier, message: `Perk already assigned: ${perkId}` };
  }
  if (soldier.perkIds.length >= MAX_PERK_SLOTS) {
    return {
      ok: false,
      soldier,
      message: `At most ${MAX_PERK_SLOTS} specialty perks.`,
    };
  }
  return {
    ok: true,
    soldier: { ...soldier, perkIds: [...soldier.perkIds, perkId] },
    message: `Assigned perk ${perkId}.`,
  };
}

export function emptyLoadout(
  weaponId: string,
  ammoCaliberId: AmmoId,
  ammoRounds = 0,
): Loadout {
  return { weaponId, ammoCaliberId, ammoRounds, gearIds: [] };
}

export function createRecruitSoldier(
  id: string,
  name: string,
  loadout: Loadout | null,
  overrides: Partial<Soldier> = {},
): Soldier {
  const weightKg = clampWeightKg(overrides.weightKg ?? 72);
  const agility = clampAgility(overrides.agility ?? 58, weightKg);
  const strength = clampStrength(overrides.strength ?? 55, weightKg);
  const maxHp = overrides.maxHp ?? 100;
  const maxStamina = overrides.maxStamina ?? 100;

  return {
    id,
    name,
    loadout,
    alive: true,
    hp: overrides.hp ?? maxHp,
    maxHp,
    stamina: overrides.stamina ?? maxStamina,
    maxStamina,
    accuracy: overrides.accuracy ?? 55,
    agility,
    strength,
    weightKg,
    salary: overrides.salary ?? 8,
    loyalty: overrides.loyalty ?? 70,
    experience: overrides.experience ?? 10,
    perkIds: (overrides.perkIds ?? []).slice(0, MAX_PERK_SLOTS),
    duty: overrides.duty ?? "unassigned",
    squadId: overrides.squadId ?? null,
    woundedRestTicks: overrides.woundedRestTicks ?? 0,
  };
}

/** Combat contribution multipliers from soldier sheet (before weapon factors). */
export function soldierCombatFactor(soldier: Soldier): number {
  const accuracyFactor = 0.5 + soldier.accuracy / 200;
  const strengthFactor = 0.9 + soldier.strength / 500;
  const agilityFactor = 0.9 + soldier.agility / 500;
  const expFactor = 0.85 + (Math.min(soldier.experience, 100) / 100) * 0.15;
  const perkAccuracy = 1 + sumPerkPercent(soldier.perkIds, "soldier", "accuracy") / 100;
  return (
    accuracyFactor *
    strengthFactor *
    agilityFactor *
    expFactor *
    perkAccuracy *
    exhaustionMultiplier(soldier)
  );
}
