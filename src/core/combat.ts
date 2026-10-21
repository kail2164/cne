import { applyJobResolution, getContract } from "./board.js";
import { getCaliber, getRifle } from "./catalog.js";
import {
  checkContractAcceptance,
  estimateSuccessChance,
} from "./logistics.js";
import {
  casualtiesFromDamage,
  computeEnemyProfile,
  computeFriendlyProfile,
  describeMatchup,
  hasArmorAdvantage,
  hasRangeAdvantage,
  planInitiative,
  resolveVolley,
} from "./power.js";
import { RP_PER_CONTRACT_WIN, awardContractWinRp } from "./research.js";
import { STAMINA_DRAIN_PER_TICK, weaponConditionOf } from "./soldier.js";
import { applyMissionMorale } from "./upkeep.js";
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

/**
 * Spend ammo across living loadouts and apply magazine wear.
 * Wear = (roundsSpent / ammoCapacity) × wearPerMagazine → weaponCondition.
 */
function consumeAmmo(soldiers: Soldier[], amount: number): number {
  let remaining = amount;
  let spent = 0;
  for (const s of living(soldiers)) {
    if (!s.loadout || remaining <= 0) continue;
    const take = Math.min(s.loadout.ammoRounds, remaining);
    if (take <= 0) continue;
    s.loadout.ammoRounds -= take;
    remaining -= take;
    spent += take;

    const w = getRifle(s.loadout.weaponId);
    if (w) {
      const mag = Math.max(1, w.ammoCapacity);
      const magazines = take / mag;
      const before = weaponConditionOf(s.loadout);
      s.loadout.weaponCondition = Math.max(
        0,
        Number((before - magazines * w.wearPerMagazine).toFixed(3)),
      );
    }
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

function avgWeaponCondition(soldiers: Soldier[]): number {
  const live = living(soldiers).filter((s) => s.loadout);
  if (live.length === 0) return 100;
  const sum = live.reduce((n, s) => n + weaponConditionOf(s.loadout), 0);
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

  const board = applyJobResolution(next, mission.contractId, won);
  next = board.state;
  next = applyMissionMorale(next, won);
  let rpNote = "";
  if (won) {
    next = awardContractWinRp(next);
    rpNote = ` +${RP_PER_CONTRACT_WIN} RP.`;
  }

  const moraleNote = won ? "Morale +6." : "Morale −12.";
  const summary = won
    ? `Victory at ${contract.name} (success ~${mission.successChance}%). KIA ${woundPass.kiaKept}, wounded ${woundPass.wounded}, ammo ${ammoExpended}, loot +$${lootFunds}. ${moraleNote}${rpNote} ${board.message}`
    : retreated
      ? `Retreat from ${contract.name}. KIA ${woundPass.kiaKept}, wounded ${woundPass.wounded}, ammo ${ammoExpended}. ${moraleNote} ${board.message}`
      : `Defeat at ${contract.name}. KIA ${woundPass.kiaKept}, wounded ${woundPass.wounded}, ammo ${ammoExpended}. ${moraleNote} ${board.message}`;

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
 * Uses force power + engagement (initiative, hit/range/pen, size damage).
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
      ? {
          ...s.loadout,
          weaponCondition: weaponConditionOf(s.loadout),
          gearIds: [...(s.loadout.gearIds ?? [])],
        }
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

  const initiative = planInitiative(contract);
  const friendly = computeFriendlyProfile(soldiers);
  const enemy = computeEnemyProfile(contract, {
    oppositionHp,
    thieves: initiative.encounter === "thieves",
  });

  const outRange = hasRangeAdvantage(friendly, enemy);
  const outArmor = hasArmorAdvantage(friendly, enemy);
  const advantages: string[] = [];
  if (outRange) advantages.push("outRange");
  if (outArmor) advantages.push("outArmor");
  const mitigateEnemy = outRange || outArmor;

  let friendlyDamage = 0;
  let enemyDamage = 0;
  const parts: string[] = [
    `Month ${monthIndex}/${mission.turnsNeeded}`,
    initiative.reason,
    describeMatchup(friendly, enemy),
  ];
  if (advantages.length) parts.push(`adv [${advantages.join("+")}]`);
  const condBefore = avgWeaponCondition(soldiers);

  if (liveBefore === 0) {
    parts.push("No combat-ready troops left.");
    retreated = true;
  } else if (!ammoExhausted) {
    const eff = avgSupplyEfficiency(soldiers);
    const want = Math.max(
      liveBefore,
      Math.ceil((liveBefore * 3) / Math.max(0.5, eff)),
    );
    const spent = consumeAmmo(soldiers, want);

    const standoff = outRange ? friendly.rangeM : undefined;

    const fireFriendly = () => {
      const volley = resolveVolley(friendly, enemy, { standoffRange: standoff });
      // Scale so ~20 Gewehr clear local ~380 HP in ~2 months
      const dealt = volley.damageDealt * 0.95;
      oppositionHp = Math.max(0, oppositionHp - dealt);
      friendlyDamage += dealt;
      parts.push(`our volley −${spent} ammo, ${volley.note} (→${dealt.toFixed(1)})`);
    };

    const fireEnemy = () => {
      if (oppositionHp <= 0 || living(soldiers).length === 0) return;
      const volley = resolveVolley(enemy, friendly, {
        mitigateIncoming: mitigateEnemy,
      });
      enemyDamage += volley.damageDealt;
      const deaths = casualtiesFromDamage(
        volley.damageDealt,
        friendly.hpPerEntity,
        living(soldiers).length,
      );
      // Soft floor: at least some pressure if not mitigated and damage landed
      const applied =
        deaths > 0
          ? deaths
          : !mitigateEnemy && volley.damageDealt >= friendly.hpPerEntity * 0.4
            ? 1
            : 0;
      friendlyCasualties += applyCasualties(soldiers, applied);
      parts.push(
        `${enemy.label} return ${volley.note}${applied ? ` (${applied} down)` : " (no KIA)"}`,
      );
    };

    if (initiative.firstStriker === "friendly") {
      fireFriendly();
      if (oppositionHp > 0) fireEnemy();
    } else {
      fireEnemy();
      if (living(soldiers).length > 0 && oppositionHp > 0) fireFriendly();
    }

    dryMonths = 0;
  } else {
    dryMonths += 1;
    parts.push("ammo out — bayonets");
    const bayonet = resolveVolley(
      { ...friendly, damagePerEntity: friendly.damagePerEntity * 0.2 },
      enemy,
    );
    oppositionHp = Math.max(0, oppositionHp - bayonet.damageDealt);
    friendlyDamage += bayonet.damageDealt;
    friendlyCasualties += applyCasualties(
      soldiers,
      Math.max(1, Math.ceil(liveBefore * 0.2)),
    );
    if (dryMonths >= 2) {
      retreated = true;
      parts.push("Forced retreat.");
    }
  }

  drainStamina(soldiers);
  const condAfter = avgWeaponCondition(soldiers);
  if (condAfter < condBefore - 0.01) {
    parts.push(`wear cond ${condBefore.toFixed(1)}→${condAfter.toFixed(1)}`);
  }
  note = parts.join(". ") + ".";

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
    friendlyPower: friendly.power,
    enemyPower: enemy.power,
    firstStriker: initiative.firstStriker,
    escortZone: initiative.escortZone,
    encounter: initiative.encounter,
    friendlyDamage: Number(friendlyDamage.toFixed(1)),
    enemyDamage: Number(enemyDamage.toFixed(1)),
    advantages,
  };

  const log = [...mission.log, entry];
  if (oppositionHp <= 0) won = true;
  if (living(soldiers).length === 0) retreated = true;
  if (!won && !retreated && turnsRemaining <= 0 && oppositionHp > 0) {
    retreated = true;
    note += " Timeline expired — withdraw.";
    entry.note = note;
  }

  const nextMission: ActiveMission = {
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
