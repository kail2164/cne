import { effectiveDamage, effectivePenetration, getCaliber, getRifle } from "./catalog.js";
import { isArmed } from "./gear.js";
import { soldierCombatFactor, weaponConditionOf } from "./soldier.js";
import type {
  CombatType,
  Contract,
  ContractTier,
  GameState,
  Soldier,
  Weapon,
} from "./types.js";

/** Fire-rate / reliability factor (shared with readiness power). */
function weaponFireFactor(weaponId: string): number {
  const weapon = getRifle(weaponId);
  if (!weapon) return 0;
  const fireFactor = Math.min(1.3, Math.max(0.7, weapon.fireRateRpm / 15));
  const reliFactor = Math.min(1, Math.max(0.5, weapon.reliabilityPct / 100));
  return fireFactor * reliFactor;
}

/** Living armed combatants (not wounded reserves). */
function combatants(soldiers: Soldier[]): Soldier[] {
  return soldiers.filter((s) => s.alive && s.duty !== "wounded" && isArmed(s));
}

export type EscortZone = "frontline" | "backline";

export type EncounterKind = "enemy" | "thieves";

export interface ForceProfile {
  label: string;
  size: number;
  loadoutQuality: number;
  morale: number;
  experience: number;
  /** Effective range ~80% hit band (m). */
  rangeM: number;
  /** Max range ~30% hit band (m). */
  maxRangeM: number;
  penetration: number;
  armor: number;
  damagePerEntity: number;
  hpPerEntity: number;
  /** Aggregate readiness / matchup score. */
  power: number;
  /** Combined aim accuracy 0–100 (soldier + MoA for friendly). */
  accuracy: number;
  /** Catalog reliability before wear (enemies: tier stub). */
  reliabilityPct: number;
  /** Wear-adjusted reliability used in hit chance. */
  effectiveReliabilityPct: number;
  /** Average MoA at 200 m (lower = tighter); enemies use a tier stub. */
  moa: number;
  /**
   * Recoil / handling / reload(+capacity) tempo-control multiplier.
   * Enemies default to 1.
   */
  tempoFactor: number;
}

export interface VolleyResult {
  hitChance: number;
  rawPool: number;
  penFactor: number;
  damageDealt: number;
  engagementRangeM: number;
  mitigated: boolean;
  note: string;
}

export interface InitiativePlan {
  firstStriker: "friendly" | "enemy";
  encounter: EncounterKind;
  escortZone: EscortZone | null;
  reason: string;
}

const TIER_ENEMY: Record<
  ContractTier,
  { rangeM: number; maxRangeM: number; pen: number; armor: number; loadoutQ: number; morale: number; exp: number; accuracy: number; moa: number }
> = {
  local: { rangeM: 320, maxRangeM: 900, pen: 45, armor: 40, loadoutQ: 45, morale: 55, exp: 30, accuracy: 48, moa: 3.5 },
  province: { rangeM: 380, maxRangeM: 1100, pen: 52, armor: 48, loadoutQ: 55, morale: 58, exp: 40, accuracy: 52, moa: 3.2 },
  interstate: { rangeM: 420, maxRangeM: 1300, pen: 58, armor: 55, loadoutQ: 62, morale: 60, exp: 50, accuracy: 55, moa: 3.0 },
  national: { rangeM: 480, maxRangeM: 1500, pen: 65, armor: 62, loadoutQ: 70, morale: 65, exp: 60, accuracy: 58, moa: 2.8 },
  global: { rangeM: 550, maxRangeM: 1700, pen: 72, armor: 70, loadoutQ: 78, morale: 70, exp: 70, accuracy: 62, moa: 2.6 },
};

/** Reference mag cycle (~G98: 5 rd @ 12 rpm + 7.5 s reload). */
const REF_MAG_CYCLE_SEC = 5 / (12 / 60) + 7.5;

/** Deterministic escort zone from contract id. */
export function escortZoneFor(contractId: string): EscortZone {
  let h = 0;
  for (let i = 0; i < contractId.length; i++) h = (h * 31 + contractId.charCodeAt(i)) >>> 0;
  return h % 2 === 0 ? "frontline" : "backline";
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function avg(nums: number[], fallback = 0): number {
  if (nums.length === 0) return fallback;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Convert MoA at 200 m to a 0–100 weapon accuracy (lower MoA → higher). */
export function moaToWeaponAccuracy(moa: number): number {
  return clamp(100 - moa * 12, 35, 98);
}

/** Combine soldier aim with weapon MoA accuracy. */
export function combinedAccuracy(soldierAccuracy: number, moa: number): number {
  const weaponAcc = moaToWeaponAccuracy(moa);
  return clamp(0.55 * soldierAccuracy + 0.45 * weaponAcc, 5, 98);
}

/**
 * Reliability after wear: condition 100 → full catalog %; 0 → half.
 */
export function reliabilityAfterWear(reliabilityPct: number, condition: number): number {
  const c = clamp(condition, 0, 100) / 100;
  return reliabilityPct * (0.5 + 0.5 * c);
}

/**
 * Tempo / control from recoil, handling, reload, capacity (+ soldier strength/agility).
 */
export function weaponTempoFactor(
  weapon: Weapon,
  soldier?: { strength: number; agility: number },
): number {
  const fireRps = Math.max(0.05, weapon.fireRateRpm / 60);
  const magCycleSec = weapon.ammoCapacity / fireRps + weapon.reloadSeconds;
  const reloadTempo = clamp(REF_MAG_CYCLE_SEC / Math.max(1, magCycleSec), 0.75, 1.3);
  const strength = soldier?.strength ?? 55;
  const agility = soldier?.agility ?? 55;
  const recoilCtrl = clamp(1.08 - (weapon.recoil - strength * 0.65) / 180, 0.75, 1.12);
  const handlingF = clamp(0.88 + weapon.handling / 450 + agility / 600, 0.8, 1.15);
  return reloadTempo * recoilCtrl * handlingF;
}

/** Loadout quality 0–100 from weapon+ammo pair. */
export function loadoutQualityFor(soldier: Soldier): number {
  if (!soldier.loadout) return 0;
  const w = getRifle(soldier.loadout.weaponId);
  const c = getCaliber(soldier.loadout.ammoCaliberId);
  if (!w || !c) return 0;
  const dmg = c.baseDamage + w.damage;
  const pen = c.basePenetration + w.penetration;
  const fire = clamp(w.fireRateRpm / 20, 0.5, 1.2);
  const reli = reliabilityAfterWear(w.reliabilityPct, weaponConditionOf(soldier.loadout)) / 100;
  const moaQ = moaToWeaponAccuracy(w.accuracyMoaAt200m) / 100;
  const tempo = weaponTempoFactor(w, soldier);
  // Typical 1910 rifle pair → ~55–70
  return clamp(dmg * 2.2 + pen * 0.35 + fire * 15 + reli * 18 + moaQ * 8 + (tempo - 1) * 20, 0, 100);
}

/**
 * Friendly force power — size × (loadout/morale/exp quality) × weapon factors.
 * Scale keeps ~20 Gewehr recruits near prior readiness (~160–180).
 */
export function computeFriendlyProfile(soldiers: Soldier[]): ForceProfile {
  const live = combatants(soldiers);
  const size = live.length;
  if (size === 0) {
    return {
      label: "friendly",
      size: 0,
      loadoutQuality: 0,
      morale: 0,
      experience: 0,
      rangeM: 0,
      maxRangeM: 0,
      penetration: 0,
      armor: 25,
      damagePerEntity: 0,
      hpPerEntity: 100,
      power: 0,
      accuracy: 0,
      reliabilityPct: 0,
      effectiveReliabilityPct: 0,
      moa: 0,
      tempoFactor: 1,
    };
  }

  const loadoutQuality = avg(live.map(loadoutQualityFor));
  const morale = avg(live.map((s) => s.loyalty));
  const experience = avg(live.map((s) => Math.min(100, s.experience)));
  const quality =
    0.45 * (loadoutQuality / 100) +
    0.25 * (morale / 100) +
    0.2 * (experience / 100) +
    0.1;

  let factorSum = 0;
  let rangeSum = 0;
  let maxRangeSum = 0;
  let penSum = 0;
  let dmgSum = 0;
  let reliSum = 0;
  let effReliSum = 0;
  let moaSum = 0;
  let accSum = 0;
  let tempoSum = 0;
  let armed = 0;

  for (const s of live) {
    if (!s.loadout) continue;
    const w = getRifle(s.loadout.weaponId);
    if (!w) continue;
    armed += 1;
    const condition = weaponConditionOf(s.loadout);
    factorSum += weaponFireFactor(w.id) * soldierCombatFactor(s);
    rangeSum += w.effectiveRangeM80pct;
    maxRangeSum += w.maxRangeM30pct;
    penSum += effectivePenetration(s.loadout.weaponId, s.loadout.ammoCaliberId);
    dmgSum += effectiveDamage(s.loadout.weaponId, s.loadout.ammoCaliberId);
    reliSum += w.reliabilityPct;
    effReliSum += reliabilityAfterWear(w.reliabilityPct, condition);
    moaSum += w.accuracyMoaAt200m;
    accSum += combinedAccuracy(s.accuracy, w.accuracyMoaAt200m);
    tempoSum += weaponTempoFactor(w, s);
  }

  const avgFactor = armed > 0 ? factorSum / armed : 0;
  const rangeM = armed > 0 ? rangeSum / armed : 0;
  const maxRangeM = armed > 0 ? maxRangeSum / armed : 0;
  const penetration = armed > 0 ? penSum / armed : 0;
  const damagePerEntity = armed > 0 ? dmgSum / armed : 0;
  const reliabilityPct = armed > 0 ? reliSum / armed : 70;
  const effectiveReliabilityPct = armed > 0 ? effReliSum / armed : 70;
  const moa = armed > 0 ? moaSum / armed : 3;
  const accuracy = armed > 0 ? accSum / armed : avg(live.map((s) => s.accuracy));
  const tempoFactor = armed > 0 ? tempoSum / armed : 1;
  const hpPerEntity = avg(live.map((s) => s.maxHp), 100);
  // Soft armor stub from strength/gear — no full armor catalog yet
  const armor = 28 + avg(live.map((s) => s.strength)) * 0.25;

  // Scale keeps ~20 Gewehr recruits near prior readiness (~160–180 / gate 140).
  const power = size * quality * avgFactor * 22;

  return {
    label: "friendly",
    size,
    loadoutQuality: Number(loadoutQuality.toFixed(1)),
    morale: Number(morale.toFixed(1)),
    experience: Number(experience.toFixed(1)),
    rangeM: Number(rangeM.toFixed(0)),
    maxRangeM: Number(maxRangeM.toFixed(0)),
    penetration: Number(penetration.toFixed(1)),
    armor: Number(armor.toFixed(1)),
    damagePerEntity: Number(damagePerEntity.toFixed(2)),
    hpPerEntity: Number(hpPerEntity.toFixed(1)),
    power: Number(power.toFixed(1)),
    accuracy: Number(accuracy.toFixed(1)),
    reliabilityPct: Number(reliabilityPct.toFixed(1)),
    effectiveReliabilityPct: Number(effectiveReliabilityPct.toFixed(1)),
    moa: Number(moa.toFixed(2)),
    tempoFactor: Number(tempoFactor.toFixed(3)),
  };
}

export function companyForcePower(state: GameState): number {
  return computeFriendlyProfile(state.company.soldiers).power;
}

/** Enemy (or thieves) profile derived from contract + optional HP override mid-mission. */
export function computeEnemyProfile(
  contract: Contract,
  opts: { oppositionHp?: number; thieves?: boolean } = {},
): ForceProfile {
  const base = TIER_ENEMY[contract.tier];
  let size = Math.max(1, Math.round(contract.manpowerRequired * 0.85));
  let loadoutQuality = base.loadoutQ;
  let morale = base.morale;
  let experience = base.exp;
  let rangeM = base.rangeM;
  let maxRangeM = base.maxRangeM;
  let penetration = base.pen;
  let armor = base.armor;
  let accuracy = base.accuracy;
  let moa = base.moa;
  let label = "enemy";

  if (opts.thieves) {
    label = "thieves";
    size = Math.max(2, Math.round(size * 0.4));
    loadoutQuality *= 0.55;
    morale *= 0.7;
    experience *= 0.5;
    rangeM *= 0.65;
    maxRangeM *= 0.65;
    penetration *= 0.55;
    armor *= 0.5;
    accuracy *= 0.75;
    moa *= 1.15;
  }

  const hpPool = opts.oppositionHp ?? contract.oppositionHp;
  const hpPerEntity = hpPool / size;
  const damagePerEntity = (opts.thieves
    ? contract.oppositionDamagePerTurn * 0.55
    : contract.oppositionDamagePerTurn) / size;

  const quality =
    0.45 * (loadoutQuality / 100) +
    0.25 * (morale / 100) +
    0.2 * (experience / 100) +
    0.1;
  // Align scale with friendly power so matchups are readable
  const power = size * quality * 1.05 * 22;
  const reliabilityPct = opts.thieves ? 55 : 70;

  return {
    label,
    size,
    loadoutQuality: Number(loadoutQuality.toFixed(1)),
    morale: Number(morale.toFixed(1)),
    experience: Number(experience.toFixed(1)),
    rangeM: Number(rangeM.toFixed(0)),
    maxRangeM: Number(maxRangeM.toFixed(0)),
    penetration: Number(penetration.toFixed(1)),
    armor: Number(armor.toFixed(1)),
    damagePerEntity: Number(damagePerEntity.toFixed(2)),
    hpPerEntity: Number(hpPerEntity.toFixed(2)),
    power: Number(power.toFixed(1)),
    accuracy: Number(accuracy.toFixed(1)),
    reliabilityPct,
    effectiveReliabilityPct: reliabilityPct,
    moa: Number(moa.toFixed(2)),
    tempoFactor: 1,
  };
}

export function planInitiative(contract: Contract): InitiativePlan {
  const type: CombatType = contract.combatType;

  if (type === "defense") {
    return {
      firstStriker: "enemy",
      encounter: "enemy",
      escortZone: null,
      reason: "Defense — enemy attacks first",
    };
  }

  if (type === "escort") {
    const zone = escortZoneFor(contract.id);
    if (zone === "backline") {
      return {
        firstStriker: "enemy",
        encounter: "thieves",
        escortZone: zone,
        reason: "Escort backline — thieves/robbers (surprise)",
      };
    }
    // Frontline: coin-flip-ish but deterministic
    let h = 0;
    for (let i = 0; i < contract.id.length; i++) h = (h * 17 + contract.id.charCodeAt(i)) >>> 0;
    const enemyFirst = h % 2 === 0;
    return {
      firstStriker: enemyFirst ? "enemy" : "friendly",
      encounter: "enemy",
      escortZone: zone,
      reason: enemyFirst
        ? "Escort frontline — enemy ambush opens"
        : "Escort frontline — column returns fire first",
    };
  }

  // offense, convoy, scout
  return {
    firstStriker: "friendly",
    encounter: "enemy",
    escortZone: null,
    reason: `${type} — friendly strikes first`,
  };
}

/**
 * Hit chance at engagement range.
 * Band: ≤ effectiveRange80 → full; between effective and maxRange30 → lerp 0.8→0.3; beyond → 0.15.
 * Uses wear-adjusted reliability when provided via attacker.effectiveReliabilityPct.
 */
export function hitChanceAtRange(
  attacker: ForceProfile,
  engagementRangeM: number,
  effectiveRange80: number,
  maxRange30: number,
): number {
  let rangeFactor: number;
  if (engagementRangeM <= effectiveRange80) {
    rangeFactor = 1;
  } else if (engagementRangeM >= maxRange30) {
    rangeFactor = 0.15;
  } else {
    const t = (engagementRangeM - effectiveRange80) / Math.max(1, maxRange30 - effectiveRange80);
    rangeFactor = 0.8 - t * 0.5;
  }
  const base = clamp((attacker.accuracy / 100) * 0.7 + 0.25, 0.05, 0.95);
  const reli =
    attacker.effectiveReliabilityPct > 0
      ? attacker.effectiveReliabilityPct
      : attacker.reliabilityPct;
  return clamp(base * rangeFactor * (reli / 100), 0.05, 0.95);
}

export function choosesStandoff(friendly: ForceProfile, enemy: ForceProfile): boolean {
  return friendly.rangeM > enemy.rangeM * 1.1;
}

export function hasArmorAdvantage(friendly: ForceProfile, enemy: ForceProfile): boolean {
  return friendly.penetration > enemy.armor * 1.15;
}

export function hasRangeAdvantage(friendly: ForceProfile, enemy: ForceProfile): boolean {
  return friendly.rangeM > enemy.rangeM * 1.1;
}

/**
 * One volley: damage = damagePerEntity × size × hitChance × penFactor × tempoFactor.
 * When `mitigateIncoming`, hit chance is crushed (out-range / out-armor).
 */
export function resolveVolley(
  attacker: ForceProfile,
  defender: ForceProfile,
  opts: { mitigateIncoming?: boolean; standoffRange?: number } = {},
): VolleyResult {
  const engagementRangeM =
    opts.standoffRange ??
    Math.min(attacker.rangeM || 300, defender.rangeM || 300);

  const effective80 = attacker.rangeM || 300;
  const max30 = attacker.maxRangeM > 0 ? attacker.maxRangeM : effective80 * 1.8;

  let hit = hitChanceAtRange(attacker, engagementRangeM, effective80, max30);
  let mitigated = false;
  if (opts.mitigateIncoming) {
    hit *= 0.12;
    mitigated = true;
  }

  const tempo = attacker.tempoFactor > 0 ? attacker.tempoFactor : 1;
  const rawPool = attacker.damagePerEntity * attacker.size * hit;
  const penFactor = clamp(attacker.penetration / Math.max(1, defender.armor), 0.35, 1.4);
  const damageDealt = rawPool * penFactor * tempo;

  const note = mitigated
    ? `mitigated hit ${(hit * 100).toFixed(0)}% × t${tempo.toFixed(2)} → ${damageDealt.toFixed(1)} dmg`
    : `hit ${(hit * 100).toFixed(0)}% × pen ${penFactor.toFixed(2)} × t${tempo.toFixed(2)} → ${damageDealt.toFixed(1)} dmg`;

  return {
    hitChance: Number(hit.toFixed(3)),
    rawPool: Number(rawPool.toFixed(2)),
    penFactor: Number(penFactor.toFixed(3)),
    damageDealt: Number(damageDealt.toFixed(2)),
    engagementRangeM: Number(engagementRangeM.toFixed(0)),
    mitigated,
    note,
  };
}

/** Casualties from damage vs hp-per-entity (capped). */
export function casualtiesFromDamage(
  damage: number,
  hpPerEntity: number,
  maxLiving: number,
): number {
  if (damage <= 0 || maxLiving <= 0) return 0;
  const raw = Math.floor(damage / Math.max(1, hpPerEntity * 0.85));
  return Math.min(maxLiving, Math.max(0, raw));
}

/** Matchup summary for logs / estimateSuccessChance hooks. */
export function describeMatchup(friendly: ForceProfile, enemy: ForceProfile): string {
  return (
    `pwr ${friendly.power.toFixed(0)} vs ${enemy.power.toFixed(0)} ` +
    `(${friendly.size} men Q${friendly.loadoutQuality.toFixed(0)}/` +
    `M${friendly.morale.toFixed(0)}/E${friendly.experience.toFixed(0)} ` +
    `MoA${friendly.moa.toFixed(1)} t${friendly.tempoFactor.toFixed(2)} vs ` +
    `${enemy.label} ${enemy.size})`
  );
}
