import { effectiveDamage, getCaliber, getRifle } from "./catalog.js";
import {
  checkContractAcceptance,
  estimateSuccessChance,
  getContract,
} from "./logistics.js";
import { STAMINA_DRAIN_PER_TICK, soldierCombatFactor } from "./soldier.js";
import type {
  ActionResult,
  CombatLogEntry,
  CombatResult,
  GameState,
  Soldier,
} from "./types.js";
import { storeAsMany } from "./warehouse.js";

function cloneSoldiers(soldiers: Soldier[]): Soldier[] {
  return soldiers.map((s) => ({
    ...s,
    perkIds: [...s.perkIds],
    loadout: s.loadout
      ? { ...s.loadout, gearIds: [...(s.loadout.gearIds ?? [])] }
      : null,
  }));
}

function living(soldiers: Soldier[]): Soldier[] {
  return soldiers.filter((s) => s.alive);
}

function totalAmmo(soldiers: Soldier[]): number {
  return living(soldiers).reduce((n, s) => n + (s.loadout?.ammoRounds ?? 0), 0);
}

function consumeAmmo(soldiers: Soldier[], amount: number): number {
  let remaining = amount;
  let spent = 0;
  for (const s of living(soldiers)) {
    if (!s.loadout || remaining <= 0) continue;
    const take = Math.min(s.loadout.ammoRounds, remaining);
    s.loadout.ammoRounds -= take;
    remaining -= take;
    spent += take;
  }
  return spent;
}

function applyCasualties(soldiers: Soldier[], count: number): number {
  let left = Math.max(0, Math.floor(count));
  let killed = 0;
  for (const s of living(soldiers)) {
    if (left <= 0) break;
    s.alive = false;
    left -= 1;
    killed += 1;
  }
  return killed;
}

/**
 * Firepower: (caliber.baseDamage + weapon.damage) × rate/reliability × soldier factors.
 * Penetration (base+weapon) reserved for cover sim later.
 */
function firepower(soldiers: Soldier[]): number {
  return living(soldiers).reduce((sum, s) => {
    if (!s.loadout) return sum;
    const w = getRifle(s.loadout.weaponId);
    if (!w) return sum;
    const dmg = effectiveDamage(s.loadout.weaponId, s.loadout.ammoCaliberId);
    const fireFactor = Math.min(1.3, Math.max(0.7, w.fireRateRpm / 15));
    const reliFactor = Math.min(1, Math.max(0.5, w.reliabilityPct / 100));
    return sum + dmg * fireFactor * reliFactor * soldierCombatFactor(s);
  }, 0);
}

/** At high success, convert some KIA into wounded-with-rest; at 100% revive all tick KIA. */
function applySuccessWoundModel(
  soldiers: Soldier[],
  successChance: number,
): { wounded: number; kiaKept: number } {
  const dead = soldiers.filter((s) => !s.alive);
  if (dead.length === 0) return { wounded: 0, kiaKept: 0 };

  if (successChance >= 100) {
    for (const s of dead) {
      s.alive = true;
      s.duty = "ready";
      s.woundedRestTicks = 0;
      s.hp = Math.max(1, Math.floor(s.maxHp * 0.8));
    }
    return { wounded: 0, kiaKept: 0 };
  }

  const woundCount = Math.round(dead.length * (successChance / 100));
  let wounded = 0;
  for (let i = 0; i < dead.length; i++) {
    const s = dead[i]!;
    if (i < woundCount) {
      s.alive = true;
      s.duty = "wounded";
      s.woundedRestTicks = Math.max(2, Math.ceil((100 - successChance) / 10));
      s.hp = Math.max(1, Math.floor(s.maxHp * 0.4));
      wounded += 1;
    }
  }
  return { wounded, kiaKept: dead.length - wounded };
}

function drainStamina(soldiers: Soldier[]): void {
  for (const s of living(soldiers)) {
    s.stamina = Math.max(0, s.stamina - STAMINA_DRAIN_PER_TICK);
  }
}

function restoreStamina(soldiers: Soldier[]): void {
  for (const s of soldiers) {
    if (s.alive && s.duty !== "wounded") s.stamina = s.maxStamina;
    else if (s.alive && s.duty === "wounded") {
      s.stamina = Math.min(s.stamina, Math.floor(s.maxStamina * 0.3));
    }
  }
}

function avgSupplyEfficiency(soldiers: Soldier[]): number {
  const live = living(soldiers).filter((s) => s.loadout);
  if (live.length === 0) return 1;
  const sum = live.reduce((n, s) => {
    const c = getCaliber(s.loadout!.ammoCaliberId);
    return n + (c?.supplyEfficiency ?? 1);
  }, 0);
  return sum / live.length;
}

export function simulateCombat(
  state: GameState,
  contractId: string,
): ActionResult<CombatResult> {
  const gate = checkContractAcceptance(state, contractId);
  if (!gate.ok) {
    return {
      ok: false,
      state,
      message: gate.message,
      data: {
        won: false,
        retreated: false,
        log: [],
        ammoExpended: 0,
        casualties: 0,
        wounded: 0,
        successChance: 0,
        lootFunds: 0,
        lootMaterials: 0,
        summary: gate.message,
      },
    };
  }

  const contract = getContract(contractId)!;
  const successChance = estimateSuccessChance(state, contract);
  const soldiers = cloneSoldiers(state.company.soldiers);
  const startLiving = living(soldiers).length;
  const startAmmo = totalAmmo(soldiers);

  let oppositionHp = contract.oppositionHp;
  let dryTicks = 0;
  const log: CombatLogEntry[] = [];
  let retreated = false;
  let won = false;

  for (let tick = 1; tick <= contract.maxTicks; tick++) {
    const ammoBefore = totalAmmo(soldiers);
    const liveBefore = living(soldiers).length;
    if (liveBefore === 0) break;

    let note = "";
    let ammoExhausted = ammoBefore <= 0;
    let spent = 0;
    let friendlyCasualties = 0;

    const exhaustedBefore = living(soldiers).filter((s) => s.stamina <= 0).length;

    if (!ammoExhausted) {
      const eff = avgSupplyEfficiency(soldiers);
      const want = Math.max(1, Math.ceil(liveBefore / Math.max(0.5, eff)));
      spent = consumeAmmo(soldiers, want);
      const dmg = firepower(soldiers) * 0.55;
      oppositionHp = Math.max(0, oppositionHp - dmg);
      note = `Volley — spent ${spent} rounds, hit for ${dmg.toFixed(1)}.`;
      dryTicks = 0;
    } else {
      dryTicks += 1;
      note = "Ammo exhausted — bayonets and sidearms only.";
      const desperation = firepower(soldiers) * 0.12;
      oppositionHp = Math.max(0, oppositionHp - desperation);
      const selfHits = Math.max(1, Math.ceil(liveBefore * 0.25));
      friendlyCasualties += applyCasualties(soldiers, selfHits);
      if (dryTicks >= 2) {
        retreated = true;
        note += " Forced retreat.";
      }
    }

    drainStamina(soldiers);
    if (exhaustedBefore > 0) {
      note += ` Exhausted×0.6: ${exhaustedBefore}.`;
    }

    if (oppositionHp > 0 && living(soldiers).length > 0 && !retreated) {
      const incoming = contract.oppositionDamagePerTick;
      const deaths = Math.max(
        0,
        Math.floor(incoming / 12 + (ammoExhausted ? 1 : 0)),
      );
      friendlyCasualties += applyCasualties(soldiers, deaths);
      note += ` Enemy returns fire (${deaths} down).`;
    }

    const ammoAfter = totalAmmo(soldiers);
    log.push({
      tick,
      ammoBefore,
      ammoAfter,
      ammoExhausted,
      friendlyCasualties,
      livingAfter: living(soldiers).length,
      oppositionHpAfter: Number(oppositionHp.toFixed(1)),
      note,
    });

    if (oppositionHp <= 0) {
      won = true;
      break;
    }
    if (living(soldiers).length === 0 || retreated) {
      break;
    }
  }

  if (!won && !retreated && living(soldiers).length > 0 && oppositionHp > 0) {
    retreated = true;
    log.push({
      tick: log.length + 1,
      ammoBefore: totalAmmo(soldiers),
      ammoAfter: totalAmmo(soldiers),
      ammoExhausted: totalAmmo(soldiers) <= 0,
      friendlyCasualties: 0,
      livingAfter: living(soldiers).length,
      oppositionHpAfter: Number(oppositionHp.toFixed(1)),
      note: "Time expired — withdraw under pressure.",
    });
  }

  const tickCasualties = startLiving - living(soldiers).length;
  const woundPass = applySuccessWoundModel(soldiers, successChance);
  const ammoExpended = startAmmo - totalAmmo(soldiers);
  const lootFunds = won ? contract.cashReward : 0;
  const lootMaterials = won ? contract.lootMaterials : 0;

  restoreStamina(soldiers);

  let next: GameState = {
    ...state,
    company: { ...state.company, soldiers },
    funds: state.funds + lootFunds,
  };

  if (lootMaterials > 0) {
    const st = storeAsMany(next, "raw_materials", "raw", lootMaterials, 1, 0.8);
    next = st.state;
  }

  const summary = won
    ? `Victory at ${contract.name} (success ~${successChance}%). Tick cas ${tickCasualties}, KIA ${woundPass.kiaKept}, wounded ${woundPass.wounded}, ammo ${ammoExpended}, loot +${lootFunds} / +${lootMaterials} mat.`
    : retreated
      ? `Retreat from ${contract.name} (success ~${successChance}%). KIA ${woundPass.kiaKept}, wounded ${woundPass.wounded}, ammo ${ammoExpended}.`
      : `Defeat at ${contract.name} (success ~${successChance}%). KIA ${woundPass.kiaKept}, wounded ${woundPass.wounded}, ammo ${ammoExpended}.`;

  return {
    ok: true,
    state: next,
    message: summary,
    data: {
      won,
      retreated,
      log,
      ammoExpended,
      casualties: woundPass.kiaKept,
      wounded: woundPass.wounded,
      successChance,
      lootFunds,
      lootMaterials,
      summary,
    },
  };
}
