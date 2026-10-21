import { effectiveDamage, getCaliber, getRifle } from "./catalog.js";
import {
  checkContractAcceptance,
  estimateSuccessChance,
  getContract,
} from "./logistics.js";
import { STAMINA_DRAIN_PER_TICK, soldierCombatFactor } from "./soldier.js";
import type {
  ActionResult,
  ActiveMission,
  CombatLogEntry,
  CombatResult,
  GameState,
  Soldier,
} from "./types.js";
import { storeAsMany } from "./warehouse.js";

function living(soldiers: Soldier[]): Soldier[] {
  return soldiers.filter((s) => s.alive && s.duty !== "wounded");
}

function allLiving(soldiers: Soldier[]): Soldier[] {
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
    s.stamina = Math.max(0, s.stamina - STAMINA_DRAIN_PER_TICK * 2);
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

function emptyResult(summary: string): CombatResult {
  return {
    won: false,
    retreated: false,
    log: [],
    ammoExpended: 0,
    casualties: 0,
    wounded: 0,
    successChance: 0,
    lootFunds: 0,
    lootMaterials: 0,
    summary,
  };
}

/** Accept a contract — starts an active mission; combat steps happen on endTurn. */
export function startContract(
  state: GameState,
  contractId: string,
): ActionResult<{ mission: ActiveMission }> {
  if (state.activeMission) {
    return {
      ok: false,
      state,
      message: `Already on mission ${state.activeMission.contractId} (${state.activeMission.turnsRemaining} turns left).`,
    };
  }
  const gate = checkContractAcceptance(state, contractId);
  if (!gate.ok) {
    return { ok: false, state, message: gate.message };
  }
  const contract = getContract(contractId)!;
  const successChance = estimateSuccessChance(state, contract);
  const mission: ActiveMission = {
    contractId,
    turnsNeeded: contract.turnsNeeded,
    turnsRemaining: contract.turnsNeeded,
    oppositionHp: contract.oppositionHp,
    successChance,
    startAmmo: totalAmmo(state.company.soldiers),
    startLiving: allLiving(state.company.soldiers).length,
    dryMonths: 0,
    log: [],
  };
  return {
    ok: true,
    state: { ...state, activeMission: mission },
    message: `Accepted ${contract.name}: ${contract.turnsNeeded} month(s) needed. End turns to fight.`,
    data: { mission },
  };
}

function finalizeMission(
  state: GameState,
  mission: ActiveMission,
  won: boolean,
  retreated: boolean,
): { state: GameState; result: CombatResult } {
  const contract = getContract(mission.contractId)!;
  const soldiers = state.company.soldiers;
  const woundPass = applySuccessWoundModel(soldiers, mission.successChance);
  const ammoExpended = mission.startAmmo - totalAmmo(soldiers);
  const lootFunds = won ? contract.cashReward : 0;
  const lootMaterials = won ? contract.lootMaterials : 0;

  restoreStamina(soldiers);

  let next: GameState = {
    ...state,
    company: { ...state.company, soldiers: [...soldiers] },
    funds: state.funds + lootFunds,
    activeMission: null,
  };

  if (lootMaterials > 0) {
    const st = storeAsMany(next, "raw_materials", "raw", lootMaterials, 1, 0.8);
    next = st.state;
  }

  const summary = won
    ? `Victory at ${contract.name} (success ~${mission.successChance}%). KIA ${woundPass.kiaKept}, wounded ${woundPass.wounded}, ammo ${ammoExpended}, loot +$${lootFunds}.`
    : retreated
      ? `Retreat from ${contract.name}. KIA ${woundPass.kiaKept}, wounded ${woundPass.wounded}, ammo ${ammoExpended}.`
      : `Defeat at ${contract.name}. KIA ${woundPass.kiaKept}, wounded ${woundPass.wounded}, ammo ${ammoExpended}.`;

  const result: CombatResult = {
    won,
    retreated,
    log: mission.log,
    ammoExpended,
    casualties: woundPass.kiaKept,
    wounded: woundPass.wounded,
    successChance: mission.successChance,
    lootFunds,
    lootMaterials,
    summary,
  };

  return { state: next, result };
}

/**
 * One monthly combat step. Called from endTurn while a mission is active.
 * Mutates soldier loadouts/alive on the returned state.
 */
export function progressCombatMonth(
  state: GameState,
): ActionResult<{ note: string; resolved: CombatResult | null }> {
  const mission = state.activeMission;
  if (!mission) {
    return {
      ok: true,
      state,
      message: "No active mission.",
      data: { note: "", resolved: null },
    };
  }

  const contract = getContract(mission.contractId);
  if (!contract) {
    return {
      ok: false,
      state: { ...state, activeMission: null },
      message: "Mission contract missing; cleared.",
      data: { note: "Mission cleared.", resolved: emptyResult("Contract missing") },
    };
  }

  const soldiers = state.company.soldiers.map((s) => ({
    ...s,
    perkIds: [...s.perkIds],
    loadout: s.loadout
      ? { ...s.loadout, gearIds: [...(s.loadout.gearIds ?? [])] }
      : null,
  }));

  const monthIndex = mission.turnsNeeded - mission.turnsRemaining + 1;
  const ammoBefore = totalAmmo(soldiers);
  const liveBefore = living(soldiers).length;
  let oppositionHp = mission.oppositionHp;
  let dryMonths = mission.dryMonths;
  let retreated = false;
  let won = false;
  let note = "";
  let friendlyCasualties = 0;
  const ammoExhausted = ammoBefore <= 0;

  if (liveBefore === 0) {
    note = "No combat-ready troops left.";
    retreated = true;
  } else if (!ammoExhausted) {
    const eff = avgSupplyEfficiency(soldiers);
    const want = Math.max(
      liveBefore,
      Math.ceil((liveBefore * 3) / Math.max(0.5, eff)),
    );
    const spent = consumeAmmo(soldiers, want);
    const dmg = firepower(soldiers) * 1.35;
    oppositionHp = Math.max(0, oppositionHp - dmg);
    note = `Month ${monthIndex}/${mission.turnsNeeded}: volley −${spent} ammo, hit ${dmg.toFixed(1)}.`;
    dryMonths = 0;
  } else {
    dryMonths += 1;
    note = `Month ${monthIndex}/${mission.turnsNeeded}: ammo out — bayonets.`;
    oppositionHp = Math.max(0, oppositionHp - firepower(soldiers) * 0.15);
    friendlyCasualties += applyCasualties(
      soldiers,
      Math.max(1, Math.ceil(liveBefore * 0.2)),
    );
    if (dryMonths >= 2) {
      retreated = true;
      note += " Forced retreat.";
    }
  }

  drainStamina(soldiers);

  if (oppositionHp > 0 && living(soldiers).length > 0 && !retreated) {
    const deaths = Math.max(
      0,
      Math.floor(contract.oppositionDamagePerTurn / 14 + (ammoExhausted ? 1 : 0)),
    );
    friendlyCasualties += applyCasualties(soldiers, deaths);
    note += ` Enemy returns (${deaths} down).`;
  }

  const turnsRemaining = Math.max(0, mission.turnsRemaining - 1);
  const entry: CombatLogEntry = {
    month: monthIndex,
    ammoBefore,
    ammoAfter: totalAmmo(soldiers),
    ammoExhausted,
    friendlyCasualties,
    livingAfter: living(soldiers).length,
    oppositionHpAfter: Number(oppositionHp.toFixed(1)),
    turnsRemainingAfter: turnsRemaining,
    note,
  };

  const log = [...mission.log, entry];
  if (oppositionHp <= 0) won = true;
  if (living(soldiers).length === 0) retreated = true;
  if (!won && !retreated && turnsRemaining <= 0 && oppositionHp > 0) {
    retreated = true;
    note += " Timeline expired — withdraw.";
    entry.note = note;
  }

  let nextMission: ActiveMission | null = {
    ...mission,
    turnsRemaining,
    oppositionHp,
    dryMonths,
    log,
  };

  let nextState: GameState = {
    ...state,
    company: { ...state.company, soldiers },
    activeMission: nextMission,
  };

  const done = won || retreated || turnsRemaining <= 0;
  if (done) {
    if (!won && !retreated && oppositionHp > 0) retreated = true;
    const fin = finalizeMission(nextState, nextMission, won, retreated);
    return {
      ok: true,
      state: fin.state,
      message: fin.result.summary,
      data: { note, resolved: fin.result },
    };
  }

  return {
    ok: true,
    state: nextState,
    message: `${note} (${turnsRemaining} turn(s) left).`,
    data: { note, resolved: null },
  };
}
