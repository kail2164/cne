import { effectiveDamage, getCaliber, getRifle } from "./catalog.js";
import { getGear } from "./gear.js";
import type { FireGroup, GameState, Soldier } from "./types.js";

/** One hex is 50 m. A 250 m gun reaches 5 hexes, a 600 m gun reaches 12. */
export const METERS_PER_HEX = 50;

/** Burst fires at this share of the weapon's own rate, then the magazine cycle. */
export const BURST_RATE = 0.35;

/** Take aim fires at this share of the weapon's own rate, then the magazine cycle. */
export const AIM_RATE = 0.15;

/** Aimed fire still connects this far past the effective range. */
export const SINGLE_REACH = 1.25;

/** A round this close to the armor thickness can still punch through. */
export const PARTIAL_PEN_RATIO = 0.75;

/** Chance that a round in that band penetrates. At or above the armor, it always does. */
export const PARTIAL_PEN_CHANCE = 0.25;

/** Standing target: 1.8 m tall, and the middle of a 0.6–0.8 m shoulder width. */
export const TARGET_HEIGHT_M = 1.8;
export const TARGET_WIDTH_M = 0.7;

/**
 * One minute of angle, as meters of group diameter at 200 m.
 * Chosen so a service rifle's listed group is about 1 m across at its effective range.
 */
export const METERS_PER_MOA_AT_200M = 0.16;

/** Accuracy mark for a recruit. Experience raises it, and it does not pass 5. */
export const ACCURACY_BASELINE = 3;
export const ACCURACY_CAP = 5;

/** Each mark above the baseline tightens the group by this share. A 5 is 150% of baseline. */
export const ACCURACY_STEP = 0.25;

export function accuracyMark(experience: number): number {
  const gained = Math.max(0, Math.min(100, experience) - 10);
  return ACCURACY_BASELINE + (gained / 90) * (ACCURACY_CAP - ACCURACY_BASELINE);
}

export function accuracyFactor(mark: number): number {
  return Math.max(0.25, 1 + (mark - ACCURACY_BASELINE) * ACCURACY_STEP);
}

/** Group diameter in meters at `distanceM`. A smaller MoA, or a higher mark, drifts less. */
export function driftMeters(moaAt200: number, distanceM: number, mark: number): number {
  return (Math.max(0, moaAt200) * METERS_PER_MOA_AT_200M * Math.max(0, distanceM)) / 200 / accuracyFactor(mark);
}

/** Distance where this gun and mark still throw a 1 m group, which is an 80% hit. */
export function effectiveRangeMeters(moaAt200: number, mark: number): number {
  const moa = Math.max(0.05, moaAt200);
  return (200 * accuracyFactor(mark)) / (METERS_PER_MOA_AT_200M * moa);
}

/** Men carrying the same weapon share one mark and one reach. A different weapon keeps its own. */
function weaponKey(group: FireGroup): string {
  return `${group.moa}|${group.rpm}|${group.magazine}|${group.reload}|${group.fullAuto ? 1 : 0}`;
}

/**
 * Average the men on each weapon, then give that weapon its own reach.
 * Damage, penetration, and MoA stay on the weapon.
 */
export function applyStackAccuracy(groups: FireGroup[]): FireGroup[] {
  const live = groups.filter((group) => group.guns > 0 && group.damage > 0);
  const byWeapon = new Map<string, FireGroup[]>();
  for (const group of live) {
    const key = weaponKey(group);
    const bucket = byWeapon.get(key);
    if (bucket) bucket.push(group);
    else byWeapon.set(key, [group]);
  }
  const stamped: FireGroup[] = [];
  for (const bucket of byWeapon.values()) {
    const guns = bucket.reduce((total, group) => total + group.guns, 0);
    const aim = bucket.reduce((total, group) => total + group.aim * group.guns, 0) / guns;
    const meters =
      bucket.reduce((total, group) => total + effectiveRangeMeters(group.moa, group.aim) * group.guns, 0) / guns;
    const range = rangeHexes(meters);
    for (const group of bucket) stamped.push({ ...group, aim, range });
  }
  return mergeGroups(stamped);
}

function circleRectArea(radius: number, halfWidth: number, halfHeight: number): number {
  if (radius <= 0) return 0;
  const y0 = -Math.min(halfHeight, radius);
  const y1 = Math.min(halfHeight, radius);
  const steps = 96;
  const dy = (y1 - y0) / steps;
  let area = 0;
  for (let i = 0; i < steps; i++) {
    const y = y0 + (i + 0.5) * dy;
    const halfChord = Math.sqrt(Math.max(0, radius * radius - y * y));
    area += 2 * Math.min(halfWidth, halfChord) * dy;
  }
  return area;
}

/** Share of a centered group that lands on the target. The drift is the group diameter. */
export function hitChance(
  driftDiameterM: number,
  width = TARGET_WIDTH_M,
  height = TARGET_HEIGHT_M,
): number {
  if (driftDiameterM <= 0) return 1;
  const radius = driftDiameterM / 2;
  const circle = Math.PI * radius * radius;
  if (circle <= 0) return 1;
  return Math.min(1, Math.max(0, circleRectArea(radius, width / 2, height / 2) / circle));
}

export type FireMode = "aim" | "burst" | "auto";

export interface FireLine {
  pen: number;
  damage: number;
}

export interface Volley {
  damage: number;
  pen: number | null;
  guns: number;
  /** Rounds that produced `damage`, before the ammunition supply is applied. */
  rounds: number;
  /** Rounds leaving the barrel, including a partial volley that fails to penetrate. */
  fired: number;
  /** Share of those rounds that land on the target. */
  hit: number;
}

export function rangeHexes(meters: number): number {
  return Math.max(1, Math.round(meters / METERS_PER_HEX));
}

function roundPen(pen: number): number {
  return Math.round(pen * 10) / 10;
}

/**
 * Rounds one gun actually fires in one minute.
 * A 600 rpm gun with a 30-round magazine and a 2 second reload dumps a magazine
 * in 3 seconds and cycles every 5 seconds, so it fires 360 rounds.
 */
export function sustainedRounds(
  rpm: number,
  magazine: number,
  reloadSeconds: number,
  rpmCap = Number.POSITIVE_INFINITY,
): number {
  const rate = Math.max(1, Math.min(Math.max(1, rpm), rpmCap));
  const mag = Math.max(1, magazine);
  const dumpSeconds = (mag / rate) * 60;
  const cycle = dumpSeconds + Math.max(0, reloadSeconds);
  return (mag * 60) / cycle;
}

/** Merge weapon rows that share penetration, reach, and rate of fire. */
export function mergeGroups(groups: FireGroup[]): FireGroup[] {
  const map = new Map<string, FireGroup>();
  for (const group of groups) {
    if (group.guns <= 0 || group.damage <= 0) continue;
    const pen = roundPen(group.pen);
    const key = `${pen}|${group.range}|${group.rpm}|${group.magazine}|${group.reload}|${group.fullAuto ? 1 : 0}|${group.moa}|${group.aim}`;
    const existing = map.get(key);
    if (existing) {
      existing.damage += group.damage;
      existing.guns += group.guns;
    } else {
      map.set(key, {
        pen,
        range: group.range,
        damage: group.damage,
        guns: group.guns,
        rpm: group.rpm,
        magazine: group.magazine,
        reload: group.reload,
        fullAuto: group.fullAuto,
        moa: group.moa,
        aim: group.aim,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.pen - b.pen || b.range - a.range);
}

/** One armed soldier: caliber damage plus the weapon, the chambered round's penetration, the weapon's reach. */
export function groupFromSoldier(soldier: Soldier): FireGroup | null {
  const loadout = soldier.loadout;
  if (!loadout?.weaponId) return null;
  const weapon = getRifle(loadout.weaponId);
  if (!weapon) return null;
  const ammo = loadout.ammoCaliberId ? getCaliber(loadout.ammoCaliberId) : undefined;
  const paired = loadout.ammoCaliberId ? effectiveDamage(loadout.weaponId, loadout.ammoCaliberId) : 0;
  return {
    pen: roundPen(ammo?.basePenetration ?? weapon.penetration),
    range: rangeHexes(weapon.effectiveRangeM80pct),
    damage: paired > 0 ? paired : weapon.damage,
    guns: 1,
    rpm: weapon.fireRateRpm,
    magazine: Math.max(1, weapon.ammoCapacity),
    reload: Math.max(0, weapon.reloadSeconds),
    fullAuto: weapon.fullAuto === true,
    moa: weapon.accuracyMoaAt200m,
    aim: accuracyMark(soldier.experience),
  };
}

export function stackHasFullAuto(groups: FireGroup[]): boolean {
  return groups.some((group) => group.fullAuto);
}

/** Steel rating of the gear a soldier is wearing, in the same millimeters as penetration. */
export function soldierArmor(soldier: Soldier): number {
  return (soldier.loadout?.gearIds ?? []).reduce(
    (total, id) => total + (getGear(id)?.armorBonus ?? 0),
    0,
  );
}

/**
 * Cumulative lines for guns that reach `distance`.
 * A higher penetration is included in every lower line (overpenetration).
 * Distance 0 keeps every gun.
 */
export function fireLines(groups: FireGroup[], distance = 0): FireLine[] {
  const eligible = groups.filter((group) => group.range >= distance && group.damage > 0);
  const pens = [...new Set(eligible.map((group) => group.pen))].sort((a, b) => a - b);
  return pens.map((pen) => ({
    pen,
    damage: eligible
      .filter((group) => group.pen >= pen)
      .reduce((total, group) => total + group.damage, 0),
  }));
}

function prepareGroup(group: FireGroup, distance: number, mode: FireMode): (FireGroup & { rounds: number; hit: number }) | null {
  if (mode === "auto" && !group.fullAuto) return null;
  const reach = mode === "aim" ? group.range * SINGLE_REACH : group.range;
  if (distance > reach) return null;
  const hit = hitChance(driftMeters(group.moa, distance * METERS_PER_HEX, group.aim));
  if (mode === "aim") {
    const perGun = sustainedRounds(group.rpm, group.magazine, group.reload, group.rpm * AIM_RATE);
    return {
      ...group,
      damage: group.damage * perGun * hit,
      rounds: group.guns * perGun,
      hit,
    };
  }
  const perGun =
    mode === "burst"
      ? sustainedRounds(group.rpm, group.magazine, group.reload, group.rpm * BURST_RATE)
      : sustainedRounds(group.rpm, group.magazine, group.reload);
  const ratio = group.range <= 0 ? 1 : distance / group.range;
  const factor =
    mode === "burst"
      ? 0.7 + 0.3 * Math.min(1, ratio)
      : ratio <= 0.5
        ? 1
        : 1 - ((ratio - 0.5) / 0.5) * 0.75;
  return {
    ...group,
    damage: group.damage * perGun * factor * hit,
    rounds: group.guns * perGun,
    range: Math.max(group.range, distance),
    hit,
  };
}

function tallyGroups(groups: (FireGroup & { rounds: number; hit: number })[]): {
  damage: number;
  pen: number | null;
  guns: number;
  rounds: number;
  hit: number;
} {
  if (groups.length === 0) return { damage: 0, pen: null, guns: 0, rounds: 0, hit: 1 };
  const line = fireLines(groups, 0).sort((a, b) => a.pen - b.pen)[0];
  if (!line) return { damage: 0, pen: null, guns: 0, rounds: 0, hit: 1 };
  const rounds = groups.reduce((total, group) => total + group.rounds, 0);
  return {
    damage: line.damage,
    pen: line.pen,
    guns: groups.reduce((total, group) => total + group.guns, 0),
    rounds,
    hit: rounds > 0 ? groups.reduce((total, group) => total + group.hit * group.rounds, 0) / rounds : 1,
  };
}

/**
 * The one line that gets through `armor` for this fire mode.
 * At or above the armor, the round always penetrates.
 * From 75% of the armor up to that thickness, `roll` under 0.25 penetrates; omit `roll` to use that 25% as the expected share.
 * Below 75%, nothing is inflicted.
 */
export function volleyDamage(
  groups: FireGroup[],
  distance: number,
  armor: number,
  mode: FireMode = "aim",
  roll?: number,
): Volley {
  const prepared = groups.flatMap((group) => {
    const shot = prepareGroup(group, distance, mode);
    return shot ? [shot] : [];
  });
  if (prepared.length === 0) return { damage: 0, pen: null, guns: 0, rounds: 0, fired: 0, hit: 1 };
  const full = prepared.filter((group) => armor <= 0 || group.pen >= armor);
  const partial = prepared.filter(
    (group) => armor > 0 && group.pen < armor && group.pen >= armor * PARTIAL_PEN_RATIO,
  );
  const guns = prepared.reduce((total, group) => total + group.guns, 0);
  if (full.length === 0 && partial.length === 0) {
    return { damage: 0, pen: null, guns, rounds: 0, fired: 0, hit: 1 };
  }
  const partialFactor = roll === undefined ? PARTIAL_PEN_CHANCE : roll < PARTIAL_PEN_CHANCE ? 1 : 0;
  const sure = tallyGroups(full);
  const maybe = tallyGroups(partial);
  const scored = partialFactor === 1 ? [...full, ...partial] : full;
  const scoredLine = tallyGroups(scored);
  return {
    damage: sure.damage + maybe.damage * partialFactor,
    pen: scoredLine.pen ?? maybe.pen,
    guns,
    rounds: scoredLine.rounds,
    fired: sure.rounds + maybe.rounds,
    hit: scoredLine.rounds > 0 ? scoredLine.hit : maybe.hit,
  };
}

export function formatFireLines(groups: FireGroup[], distance = 0): string {
  const lines = fireLines(groups, distance);
  if (lines.length === 0) return "no guns in range";
  return lines.map((line) => `${line.pen}mm ${Math.round(line.damage)}`).join(" · ");
}

export function longestRange(groups: FireGroup[]): number {
  if (groups.length === 0) return 1;
  return groups.reduce((reach, group) => Math.max(reach, group.range), 1);
}

interface MenTally {
  groups: FireGroup[];
  armorSum: number;
  men: number;
  hp: number;
  ammo: number;
}

function livingSoldier(state: GameState, id: string): Soldier | undefined {
  return state.company.soldiers.find(
    (soldier) => soldier.id === id && soldier.alive && soldier.duty !== "wounded",
  );
}

function descendantSoldierIds(state: GameState, childIds: string[], seen: Set<string>): Set<string> {
  const ids = new Set<string>();
  const walk = (unitId: string) => {
    if (seen.has(unitId)) return;
    const unit = state.squads.find((entry) => entry.id === unitId);
    if (!unit) return;
    seen.add(unitId);
    if (unit.commanderSoldierId) ids.add(unit.commanderSoldierId);
    for (const soldierId of unit.soldierIds) ids.add(soldierId);
    for (const childId of unit.childUnitIds) walk(childId);
  };
  for (const childId of childIds) walk(childId);
  return ids;
}

/**
 * Weapon groups and men for a formation.
 * A fire team is its soldiers. A larger formation adds its own commander to the sum of its children.
 */
export function formationFirepower(state: GameState, formationId: string): MenTally {
  const tally = rollup(state, formationId, new Set());
  return {
    ...tally,
    groups: applyStackAccuracy(tally.groups),
  };
}

function rollup(state: GameState, formationId: string, seen: Set<string>): MenTally {
  const empty: MenTally = { groups: [], armorSum: 0, men: 0, hp: 0, ammo: 0 };
  if (seen.has(formationId)) return empty;
  const unit = state.squads.find((entry) => entry.id === formationId);
  if (!unit) return empty;
  seen.add(formationId);

  const inChildren = descendantSoldierIds(state, unit.childUnitIds, new Set(seen));
  const ownIds = new Set(unit.soldierIds);
  if (unit.commanderSoldierId) ownIds.add(unit.commanderSoldierId);
  for (const id of inChildren) ownIds.delete(id);

  const tally: MenTally = { groups: [], armorSum: 0, men: 0, hp: 0, ammo: 0 };
  for (const id of ownIds) {
    const soldier = livingSoldier(state, id);
    if (!soldier) continue;
    tally.men += 1;
    tally.hp += Math.max(1, soldier.hp);
    tally.armorSum += soldierArmor(soldier);
    tally.ammo += soldier.loadout?.ammoRounds ?? 0;
    const group = groupFromSoldier(soldier);
    if (group) tally.groups.push(group);
  }
  for (const childId of unit.childUnitIds) {
    const child = rollup(state, childId, seen);
    tally.groups.push(...child.groups);
    tally.armorSum += child.armorSum;
    tally.men += child.men;
    tally.hp += child.hp;
    tally.ammo += child.ammo;
  }
  return tally;
}

export function averageArmor(armorSum: number, men: number): number {
  if (men <= 0) return 0;
  return armorSum / men;
}
