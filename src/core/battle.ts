import { effectiveDamage, getCaliber, weaponsInService } from "./catalog.js";
import { applyJobResolution, getContract, tierIndex } from "./board.js";
import { isArmed } from "./gear.js";
import {
  averageArmor,
  fireLines,
  applyStackAccuracy,
  formationFirepower,
  groupFromSoldier,
  longestRange,
  rangeHexes,
  effectiveRangeMeters,
  SINGLE_REACH,
  soldierArmor,
  volleyDamage,
} from "./firepower.js";
import type { FireLine, FireMode } from "./firepower.js";
import { checkContractAcceptance } from "./logistics.js";
import { ECHELON_LABEL } from "./org.js";
import { RP_PER_CONTRACT_WIN, awardContractWinRp } from "./research.js";
import { applyMissionMorale } from "./upkeep.js";
import type {
  ActionResult,
  BattlePart,
  BattleStack,
  BattleState,
  Contract,
  FireGroup,
  GameState,
  OrgUnit,
  Soldier,
  Weapon,
} from "./types.js";
import { storeAsMany } from "./warehouse.js";

export const BATTLE_COLS = 20;
export const BATTLE_ROWS = 10;
export const BATTLE_MAX_STACKS = 10;

const FRIENDLY_COLS = [0, 1];
const ENEMY_COL = BATTLE_COLS - 1;

/** One speed for the whole stack: the average agility. A fast scout needs his own stack to keep an early turn. */
function stackSpeed(soldiers: Soldier[]): number {
  if (soldiers.length === 0) return 1;
  const agility = soldiers.reduce((total, soldier) => total + soldier.agility, 0) / soldiers.length;
  return Math.max(1, Math.min(6, Math.round(agility / 18)));
}

function menPart(name: string, armor: number, hp: number, count: number, hpEach: number): BattlePart {
  return {
    id: "men",
    name,
    kind: "men",
    armor,
    hp,
    hpEach,
    count,
    maxCount: count,
  };
}

function withMen(stack: Omit<BattleStack, "attack" | "defense" | "range" | "hp" | "count" | "hpEach" | "maxCount"> & {
  groups: FireGroup[];
  parts: BattlePart[];
}): BattleStack {
  const soft = fireLines(stack.groups, 0)[0];
  const men = stack.parts.find((part) => part.kind === "men");
  const hp = stack.parts.reduce((total, part) => total + part.hp, 0);
  const count = stack.parts.reduce((total, part) => total + part.count, 0);
  return {
    ...stack,
    attack: soft?.damage ?? 0,
    defense: men?.armor ?? 0,
    range: longestRange(stack.groups),
    hp,
    hpEach: men?.hpEach ?? 100,
    count,
    maxCount: stack.parts.reduce((total, part) => total + part.maxCount, 0),
  };
}

export interface StackPreview {
  formationId: string;
  name: string;
  echelon: string;
  soldiers: number;
  armed: number;
  attack: number;
  defense: number;
  range: number;
  speed: number;
  ammo: number;
  lines: FireLine[];
}

export function previewFormation(state: GameState, formationId: string): StackPreview | null {
  const unit = state.squads.find((entry) => entry.id === formationId);
  if (!unit) return null;
  const soldiers = soldiersInFormation(state, formationId);
  if (soldiers.length === 0) return null;
  const power = formationFirepower(state, formationId);
  const armor = averageArmor(power.armorSum, power.men);
  const lines = fireLines(power.groups, 0);
  const armed = soldiers.filter((soldier) => isArmed(soldier)).length;
  return {
    formationId,
    name: unit.name,
    echelon: ECHELON_LABEL[unit.echelon],
    soldiers: soldiers.length,
    armed,
    attack: Math.round(lines[0]?.damage ?? 0),
    defense: Number(armor.toFixed(1)),
    range: longestRange(power.groups),
    speed: stackSpeed(soldiers),
    ammo: power.ammo,
    lines,
  };
}

function livingSoldier(state: GameState, id: string): Soldier | undefined {
  return state.company.soldiers.find((soldier) => soldier.id === id && soldier.alive && soldier.duty !== "wounded");
}

/** Soldiers standing in a formation, including child formations and the commander. */
export function soldiersInFormation(state: GameState, formationId: string): Soldier[] {
  const seenUnits = new Set<string>();
  const soldierIds = new Set<string>();
  const walk = (id: string) => {
    if (seenUnits.has(id)) return;
    const unit = state.squads.find((entry) => entry.id === id);
    if (!unit) return;
    seenUnits.add(id);
    if (unit.commanderSoldierId) soldierIds.add(unit.commanderSoldierId);
    for (const soldierId of unit.soldierIds) soldierIds.add(soldierId);
    for (const childId of unit.childUnitIds) walk(childId);
  };
  walk(formationId);
  const soldiers: Soldier[] = [];
  for (const id of soldierIds) {
    const soldier = livingSoldier(state, id);
    if (soldier) soldiers.push(soldier);
  }
  return soldiers;
}

/** Formations the player can bring. One composition is chosen, then split on the field. */
export function listBringableFormations(state: GameState): OrgUnit[] {
  return state.squads.filter((unit) => {
    if (unit.id === "holding-1") return false;
    return soldiersInFormation(state, unit.id).some((soldier) => soldier.loadout?.weaponId);
  });
}

function stackFromSoldiers(
  state: GameState,
  id: string,
  name: string,
  soldiers: Soldier[],
  formationId: string | null,
  side: "friendly" | "enemy",
): BattleStack {
  const groups = applyStackAccuracy(
    soldiers.flatMap((soldier) => {
      const group = groupFromSoldier(soldier);
      return group ? [group] : [];
    }),
  );
  const armorSum = soldiers.reduce((total, soldier) => total + soldierArmor(soldier), 0);
  const hp = soldiers.reduce((total, soldier) => total + Math.max(1, soldier.hp), 0);
  const hpEach = soldiers.length > 0 ? hp / soldiers.length : 100;
  return withMen({
    id,
    side,
    name,
    formationId,
    soldierIds: soldiers.map((soldier) => soldier.id),
    speed: stackSpeed(soldiers),
    ammo: soldiers.reduce((total, soldier) => total + (soldier.loadout?.ammoRounds ?? 0), 0),
    groups,
    doctrine: "balance",
    parts: [menPart("Infantry", averageArmor(armorSum, soldiers.length), hp, soldiers.length, hpEach)],
    col: 0,
    row: 0,
    acted: false,
    moved: false,
    shot: false,
  });
}

function stackFromFormation(
  state: GameState,
  id: string,
  name: string,
  formationId: string,
  side: "friendly" | "enemy",
): BattleStack {
  return stackFromSoldiers(state, id, name, soldiersInFormation(state, formationId), formationId, side);
}

/** The stacks a contract fields in this year. The fight uses the same list. */
export function previewEnemyStacks(contractId: string, year = 1910): BattleStack[] {
  const contract = getContract(contractId);
  if (!contract) return [];
  return enemyStacks(contract, year);
}

function rosterSeed(text: string): number {
  let seed = 0;
  for (let i = 0; i < text.length; i++) seed = (seed * 33 + text.charCodeAt(i)) >>> 0;
  return seed;
}

function pickWeapon(pool: Weapon[], seed: number, slot: number): Weapon | undefined {
  if (pool.length === 0) return undefined;
  return pool[(seed + slot * 5) % pool.length];
}

function enemyStacks(contract: Contract, year: number): BattleStack[] {
  const rank = tierIndex(contract.tier);
  const inService = weaponsInService(year);
  const bolts = inService.filter((weapon) => weapon.fullAuto !== true);
  const autos = inService.filter((weapon) => weapon.fullAuto === true);
  const seed = rosterSeed(contract.id);
  const chosen: Weapon[] = [];
  for (let i = 0; i < 2 + Math.min(4, rank); i++) {
    const weapon = pickWeapon(bolts, seed, i);
    if (weapon) chosen.push(weapon);
  }
  for (let i = 0; i < 1 + Math.min(3, rank); i++) {
    const weapon = pickWeapon(autos, seed, 20 + i);
    if (weapon) chosen.push(weapon);
  }
  const copies = new Map<string, number>();
  return chosen.slice(0, BATTLE_MAX_STACKS).map((weapon, index) => {
    const copy = (copies.get(weapon.id) ?? 0) + 1;
    copies.set(weapon.id, copy);
    const automatic = weapon.fullAuto === true;
    const aim = automatic ? 4 : 3;
    const count = 4;
    const round = effectiveDamage(weapon.id, `${weapon.caliberId}-fmj`);
    const pen = getCaliber(`${weapon.caliberId}-fmj`)?.basePenetration ?? weapon.penetration;
    const range = rangeHexes(effectiveRangeMeters(weapon.accuracyMoaAt200m, aim));
    return withMen({
      id: `enemy-${index + 1}`,
      side: "enemy",
      name: copy > 1 ? `${weapon.name} ${copy}` : weapon.name,
      formationId: null,
      soldierIds: [],
      doctrine: automatic ? "offensive" : index % 2 === 0 ? "defensive" : "balance",
      speed: automatic ? 4 : 3,
      ammo: count * Math.max(20, weapon.ammoCapacity),
      groups: [
        {
          pen: Math.round(pen * 10) / 10,
          range,
          damage: round * count,
          guns: count,
          rpm: weapon.fireRateRpm,
          magazine: Math.max(1, weapon.ammoCapacity),
          reload: Math.max(0, weapon.reloadSeconds),
          fullAuto: automatic,
          moa: weapon.accuracyMoaAt200m,
          aim,
        },
      ],
      parts: [
        menPart(
          "Infantry",
          (automatic ? 8 : 2) + rank,
          count * (automatic ? 110 : 100),
          count,
          automatic ? 110 : 100,
        ),
      ],
      col: 0,
      row: 0,
      acted: false,
      moved: false,
      shot: false,
    });
  });
}

function spreadRows(count: number): number[] {
  if (count >= BATTLE_ROWS) {
    return Array.from({ length: count }, (_, index) => Math.min(BATTLE_ROWS - 1, index));
  }
  const rows: number[] = [];
  for (let i = 0; i < count; i++) {
    rows.push(Math.round(((i + 1) * (BATTLE_ROWS - 1)) / (count + 1)));
  }
  return rows;
}

function placeSides(stacks: BattleStack[]): BattleStack[] {
  const friendly = stacks.filter((stack) => stack.side === "friendly");
  const enemy = stacks.filter((stack) => stack.side === "enemy");
  const friendlyRows = spreadRows(friendly.length);
  const enemyRows = spreadRows(enemy.length);
  return stacks.map((stack) => {
    if (stack.side === "friendly") {
      const index = friendly.indexOf(stack);
      return { ...stack, col: 0, row: friendlyRows[index] ?? 0 };
    }
    const index = enemy.indexOf(stack);
    return { ...stack, col: ENEMY_COL, row: enemyRows[index] ?? 0 };
  });
}

function pushLog(battle: BattleState, line: string): BattleState {
  return { ...battle, log: [...battle.log, line].slice(-40) };
}

export function hexDistance(aCol: number, aRow: number, bCol: number, bRow: number): number {
  const axial = (col: number, row: number) => ({
    q: col - (row - (row & 1)) / 2,
    r: row,
  });
  const a = axial(aCol, aRow);
  const b = axial(bCol, bRow);
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

function neighbors(col: number, row: number): { col: number; row: number }[] {
  const deltas =
    (row & 1) === 1
      ? [
          [1, 0],
          [-1, 0],
          [1, -1],
          [0, -1],
          [1, 1],
          [0, 1],
        ]
      : [
          [1, 0],
          [-1, 0],
          [0, -1],
          [-1, -1],
          [0, 1],
          [-1, 1],
        ];
  return deltas
    .map(([colDelta, rowDelta]) => ({ col: col + colDelta!, row: row + rowDelta! }))
    .filter((hex) => hex.col >= 0 && hex.col < BATTLE_COLS && hex.row >= 0 && hex.row < BATTLE_ROWS);
}

function livingStacks(battle: BattleState): BattleStack[] {
  return battle.stacks.filter((stack) => stack.count > 0 && stack.hp > 0);
}

function occupied(battle: BattleState, col: number, row: number, ignoreId?: string): boolean {
  return livingStacks(battle).some(
    (stack) => stack.id !== ignoreId && stack.col === col && stack.row === row,
  );
}

export function reachableHexes(battle: BattleState, stackId: string): { col: number; row: number }[] {
  const stack = battle.stacks.find((entry) => entry.id === stackId);
  if (!stack || stack.count <= 0) return [];
  const seen = new Set<string>([`${stack.col},${stack.row}`]);
  let edge = [{ col: stack.col, row: stack.row }];
  const found: { col: number; row: number }[] = [];
  for (let step = 0; step < stack.speed; step++) {
    const next: { col: number; row: number }[] = [];
    for (const hex of edge) {
      for (const neighbor of neighbors(hex.col, hex.row)) {
        const key = `${neighbor.col},${neighbor.row}`;
        if (seen.has(key) || occupied(battle, neighbor.col, neighbor.row, stack.id)) continue;
        seen.add(key);
        found.push(neighbor);
        next.push(neighbor);
      }
    }
    edge = next;
  }
  return found;
}

function orderStacks(battle: BattleState): BattleStack[] {
  return livingStacks(battle).sort((a, b) => {
    if (b.speed !== a.speed) return b.speed - a.speed;
    if (b.range !== a.range) return b.range - a.range;
    return a.id.localeCompare(b.id);
  });
}

function activateNext(battle: BattleState): BattleState {
  const waiting = orderStacks(battle).filter((stack) => !stack.acted);
  if (waiting.length === 0) {
    const stacks = battle.stacks.map((stack) => ({ ...stack, acted: false, moved: false, shot: false }));
    const refreshed = { ...battle, stacks, round: battle.round + 1 };
    const first = orderStacks(refreshed)[0];
    return {
      ...refreshed,
      activeStackId: first?.id ?? null,
      stacks: refreshed.stacks.map((stack) =>
        stack.id === first?.id ? { ...stack, moved: false, shot: false } : stack,
      ),
    };
  }
  const next = waiting[0]!;
  return {
    ...battle,
    activeStackId: next.id,
    stacks: battle.stacks.map((stack) =>
      stack.id === next.id ? { ...stack, moved: false, shot: false } : stack,
    ),
  };
}

function outcome(battle: BattleState): BattleState["outcome"] | null {
  const friendly = livingStacks(battle).some((stack) => stack.side === "friendly");
  const enemy = livingStacks(battle).some((stack) => stack.side === "enemy");
  if (!friendly) return "loss";
  if (!enemy) return "win";
  return null;
}

function livingParts(stack: BattleStack): BattlePart[] {
  return stack.parts.filter((part) => part.count > 0 && part.hp > 0);
}

function retotal(stack: BattleStack): BattleStack {
  const men = stack.parts.find((part) => part.kind === "men");
  return {
    ...stack,
    hp: stack.parts.reduce((total, part) => total + Math.max(0, part.hp), 0),
    count: stack.parts.reduce((total, part) => total + part.count, 0),
    defense: men?.armor ?? stack.defense,
  };
}

function applyPartDamage(stack: BattleStack, partId: string, damage: number): BattleStack {
  const parts = stack.parts.map((part) => {
    if (part.id !== partId) return part;
    const hp = Math.max(0, part.hp - damage);
    const count = hp <= 0 ? 0 : Math.min(part.maxCount, Math.max(1, Math.ceil(hp / part.hpEach)));
    return { ...part, hp, count };
  });
  return retotal({ ...stack, parts });
}

function choosePart(
  attacker: BattleStack,
  defender: BattleStack,
  distance: number,
  partId: string | undefined,
  mode: FireMode,
  roll?: number,
): BattlePart | null {
  const living = livingParts(defender);
  if (partId) return living.find((part) => part.id === partId) ?? null;
  const hurt = living
    .map((part) => ({ part, damage: volleyDamage(attacker.groups, distance, part.armor, mode, roll).damage }))
    .filter((entry) => entry.damage > 0)
    .sort((a, b) => b.damage - a.damage || a.part.armor - b.part.armor);
  if (hurt[0]) return hurt[0].part;
  return [...living].sort((a, b) => a.armor - b.armor)[0] ?? null;
}

const FIRE_MODE_VERB: Record<FireMode, string> = {
  aim: "takes aim at",
  burst: "fires a burst at",
  auto: "fires full auto at",
};

/** Doctrine fire mode is chosen this often. The rest takes the harder-hitting legal mode. */
const DOCTRINE_WEIGHT = 0.7;

/** How close this doctrine wants to be, in hexes. Inside this band it stops advancing. */
export function doctrineDistance(stack: BattleStack): number {
  if (stack.doctrine === "defensive") return stack.range * SINGLE_REACH;
  if (stack.doctrine === "balance") return stack.range;
  const autoRanges = stack.groups.filter((group) => group.fullAuto).map((group) => group.range);
  const basis = autoRanges.length > 0 ? Math.max(...autoRanges) : stack.range;
  return Math.max(1, basis * 0.5);
}

function preferredMode(stack: BattleStack): FireMode {
  if (stack.doctrine === "defensive") return "aim";
  if (stack.doctrine === "balance") return "burst";
  return stack.groups.some((group) => group.fullAuto) ? "auto" : "burst";
}

function engagements(
  attacker: BattleStack,
  defender: BattleStack,
  distance: number,
): { mode: FireMode; partId: string; damage: number }[] {
  const modes: FireMode[] = attacker.groups.some((group) => group.fullAuto)
    ? ["auto", "burst", "aim"]
    : ["burst", "aim"];
  const shots: { mode: FireMode; partId: string; damage: number }[] = [];
  for (const mode of modes) {
    let best: { mode: FireMode; partId: string; damage: number } | null = null;
    for (const part of livingParts(defender)) {
      const shot = volleyDamage(attacker.groups, distance, part.armor, mode);
      if (shot.damage <= 0) continue;
      if (!best || shot.damage > best.damage) best = { mode, partId: part.id, damage: shot.damage };
    }
    if (best) shots.push(best);
  }
  return shots.sort((a, b) => b.damage - a.damage);
}

/**
 * 70% the doctrine's fire mode when it can hit.
 * Otherwise the volley that deals the most damage, so a defensive stack
 * can still fire full auto once the enemy is close enough for that to matter.
 */
export function chooseDoctrineFire(
  attacker: BattleStack,
  defender: BattleStack,
  distance: number,
  roll: number,
): { mode: FireMode; partId: string } | null {
  const shots = engagements(attacker, defender, distance);
  if (shots.length === 0) return null;
  const preferred = shots.find((shot) => shot.mode === preferredMode(attacker));
  if (preferred && roll < DOCTRINE_WEIGHT) return preferred;
  return shots[0] ?? null;
}

function strike(
  battle: BattleState,
  attackerId: string,
  defenderId: string,
  partId?: string,
  mode: FireMode = "aim",
): { battle: BattleState; ok: boolean; message: string } {
  const attacker = battle.stacks.find((stack) => stack.id === attackerId);
  const defender = battle.stacks.find((stack) => stack.id === defenderId);
  if (!attacker || !defender || attacker.count <= 0 || defender.count <= 0) {
    return { battle, ok: false, message: "That stack cannot fire." };
  }
  const distance = hexDistance(attacker.col, attacker.row, defender.col, defender.row);
  const penRoll = Math.random();
  const part = choosePart(attacker, defender, distance, partId, mode, penRoll);
  if (!part) return { battle, ok: false, message: "Nothing left to shoot." };
  const targetName = livingParts(defender).length > 1 ? `${defender.name} ${part.name}` : defender.name;
  const melee = distance <= 1 && attacker.ammo <= 0;
  if (melee) {
    if (part.armor > 0) {
      return { battle, ok: false, message: `${attacker.name} cannot harm ${part.armor}mm plate up close.` };
    }
    const men = attacker.parts.find((entry) => entry.kind === "men");
    const damage = Math.max(1, men?.count ?? attacker.count);
    const updated = applyPartDamage(defender, part.id, damage);
    const stacks = battle.stacks.map((stack) => (stack.id === defender.id ? updated : stack));
    const left = updated.count > 0 ? `${updated.count} left` : "wiped out";
    const message = `${attacker.name} closes and strikes ${targetName} for ${damage} (${left}).`;
    return { battle: pushLog({ ...battle, stacks }, message), ok: true, message };
  }
  if (mode === "auto" && !attacker.groups.some((group) => group.fullAuto)) {
    return { battle, ok: false, message: `${attacker.name} has no automatic weapon.` };
  }
  const shot = volleyDamage(attacker.groups, distance, part.armor, mode, penRoll);
  if (shot.guns <= 0) {
    const why =
      mode === "aim"
        ? `Aimed fire reaches 125% of effective range.`
        : mode === "burst"
          ? `A burst reaches the effective range.`
          : `Full auto stays inside the automatic weapon's effective range.`;
    return { battle, ok: false, message: `${targetName} is ${distance} hexes away. ${why}` };
  }
  if (shot.fired <= 0) {
    return { battle, ok: false, message: `${attacker.name} cannot penetrate ${part.armor}mm.` };
  }
  if (attacker.ammo <= 0) {
    return { battle, ok: false, message: `${attacker.name} is out of ammunition.` };
  }
  const spent = Math.min(Math.max(1, Math.round(shot.fired)), attacker.ammo);
  const scoringSpent = Math.min(shot.rounds, attacker.ammo);
  const damage =
    shot.damage <= 0 || shot.rounds <= 0
      ? 0
      : Math.max(1, Math.round(shot.damage * (scoringSpent / shot.rounds)));
  const updated = damage > 0 ? applyPartDamage(defender, part.id, damage) : defender;
  const stacks = battle.stacks.map((stack) => {
    if (stack.id === defender.id) return updated;
    if (stack.id === attacker.id) return { ...stack, ammo: stack.ammo - spent, shot: true };
    return stack;
  });
  const left = updated.count > 0 ? `${updated.count} left` : "wiped out";
  const message =
    damage > 0
      ? `${attacker.name} ${FIRE_MODE_VERB[mode]} ${targetName} for ${damage} (${shot.pen}mm line, ${Math.round(shot.hit * 100)}% hit, ${spent} rounds, ${left}).`
      : `${attacker.name} ${FIRE_MODE_VERB[mode]} ${targetName}, but ${shot.pen}mm does not penetrate ${part.armor}mm (${spent} rounds).`;
  return { battle: pushLog({ ...battle, stacks }, message), ok: true, message };
}

function nearestEnemy(battle: BattleState, stack: BattleStack): BattleStack | null {
  const foes = livingStacks(battle).filter((other) => other.side !== stack.side);
  foes.sort(
    (a, b) =>
      hexDistance(stack.col, stack.row, a.col, a.row) - hexDistance(stack.col, stack.row, b.col, b.row),
  );
  return foes[0] ?? null;
}

function foeDistance(battle: BattleState, stack: BattleStack, col: number, row: number): number {
  const foes = livingStacks(battle).filter((other) => other.side !== stack.side);
  if (foes.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...foes.map((foe) => hexDistance(col, row, foe.col, foe.row)));
}

function chooseEnemyMove(battle: BattleState, stack: BattleStack): { col: number; row: number } | null {
  const stay = foeDistance(battle, stack, stack.col, stack.row);
  const stance = doctrineDistance(stack);
  if (!Number.isFinite(stay) || stay <= stance) return null;
  const hexes = reachableHexes(battle, stack.id);
  let inBand: { col: number; row: number; dist: number } | null = null;
  let closing: { col: number; row: number; dist: number } | null = null;
  for (const hex of hexes) {
    const dist = foeDistance(battle, stack, hex.col, hex.row);
    if (dist <= stance) {
      if (!inBand || dist > inBand.dist) inBand = { ...hex, dist };
    } else if (dist < stay && (!closing || dist < closing.dist)) {
      closing = { ...hex, dist };
    }
  }
  const step = inBand ?? closing;
  return step ? { col: step.col, row: step.row } : null;
}

function directSoldiers(state: GameState, formationId: string): Soldier[] {
  const unit = state.squads.find((entry) => entry.id === formationId);
  if (!unit) return [];
  const ids = new Set(soldiersInFormation(state, formationId).map((soldier) => soldier.id));
  for (const childId of unit.childUnitIds) {
    for (const soldier of soldiersInFormation(state, childId)) ids.delete(soldier.id);
  }
  return [...ids].flatMap((id) => {
    const soldier = livingSoldier(state, id);
    return soldier ? [soldier] : [];
  });
}

export function openBattle(
  state: GameState,
  contractId: string,
  formationId: string,
): ActionResult<{ battle: BattleState }> {
  if (state.battle && state.battle.phase !== "done") {
    return { ok: false, state, message: "A battle is already being prepared." };
  }
  if (state.activeMission) {
    return { ok: false, state, message: "Finish the current mission before opening another battle." };
  }
  const gate = checkContractAcceptance(state, contractId);
  if (!gate.ok) return { ok: false, state, message: gate.message };
  const contract = getContract(contractId);
  if (!contract) return { ok: false, state, message: "Unknown contract." };

  const unit = state.squads.find((entry) => entry.id === formationId);
  const soldiers = soldiersInFormation(state, formationId);
  if (!unit || soldiers.length === 0) {
    return { ok: false, state, message: "Choose a composition to bring." };
  }
  const friendly = [stackFromFormation(state, "friendly-1", unit.name, formationId, "friendly")];
  const armed = friendly[0]!.soldierIds.filter((id) => {
    const soldier = state.company.soldiers.find((entry) => entry.id === id);
    return soldier ? isArmed(soldier) : false;
  }).length;
  if (armed < contract.manpowerRequired) {
    return {
      ok: false,
      state,
      message: `That composition needs at least ${contract.manpowerRequired} armed soldiers (it has ${armed}).`,
    };
  }

  const battle: BattleState = {
    contractId,
    phase: "prepare",
    round: 1,
    stacks: placeSides([...friendly, ...enemyStacks(contract, state.year)]),
    activeStackId: null,
    log: [
      `${contract.name}. Split ${unit.name} into smaller stacks if you want, arrange them on the near edge, then begin.`,
    ],
  };
  return {
    ok: true,
    state: { ...state, battle },
    message: `Preparing ${unit.name} for ${contract.name}.`,
    data: { battle },
  };
}

export function placeBattleStack(
  state: GameState,
  stackId: string,
  col: number,
  row: number,
): ActionResult {
  const battle = state.battle;
  if (!battle || battle.phase !== "prepare") {
    return { ok: false, state, message: "Preparation is closed." };
  }
  const stack = battle.stacks.find((entry) => entry.id === stackId);
  if (!stack || stack.side !== "friendly") {
    return { ok: false, state, message: "Choose one of your stacks to place." };
  }
  if (!FRIENDLY_COLS.includes(col) || row < 0 || row >= BATTLE_ROWS) {
    return { ok: false, state, message: "Your stacks arrange on the two nearest columns." };
  }
  if (occupied(battle, col, row, stack.id)) {
    return { ok: false, state, message: "That hex is already held." };
  }
  const stacks = battle.stacks.map((entry) => (entry.id === stack.id ? { ...entry, col, row } : entry));
  return {
    ok: true,
    state: { ...state, battle: { ...battle, stacks } },
    message: `${stack.name} to column ${col + 1}, row ${row + 1}.`,
  };
}

function nextFriendlyId(stacks: BattleStack[]): string {
  const used = new Set(stacks.map((stack) => stack.id));
  let n = 1;
  while (used.has(`friendly-${n}`)) n += 1;
  return `friendly-${n}`;
}

/** Break a prepared stack into its child formations, or into one stack per soldier. */
export function splitBattleStack(state: GameState, stackId: string): ActionResult<{ stackId: string }> {
  const battle = state.battle;
  if (!battle || battle.phase !== "prepare") {
    return { ok: false, state, message: "Stacks can only be split while preparing." };
  }
  const stack = battle.stacks.find((entry) => entry.id === stackId);
  if (!stack || stack.side !== "friendly" || stack.count <= 0) {
    return { ok: false, state, message: "Choose one of your stacks to split." };
  }
  const unit = stack.formationId ? state.squads.find((entry) => entry.id === stack.formationId) : undefined;
  const pieces: { name: string; formationId: string | null; soldiers: Soldier[] }[] = [];
  if (unit && unit.childUnitIds.length > 0) {
    for (const childId of unit.childUnitIds) {
      const child = state.squads.find((entry) => entry.id === childId);
      const soldiers = soldiersInFormation(state, childId);
      if (!child || soldiers.length === 0) continue;
      pieces.push({ name: child.name, formationId: childId, soldiers });
    }
    const command = directSoldiers(state, unit.id);
    if (command.length > 0) pieces.push({ name: `${unit.name} command`, formationId: null, soldiers: command });
  } else {
    for (const id of stack.soldierIds) {
      const soldier = state.company.soldiers.find((entry) => entry.id === id && entry.alive);
      if (!soldier) continue;
      pieces.push({ name: soldier.name, formationId: null, soldiers: [soldier] });
    }
  }
  if (pieces.length < 2) {
    return { ok: false, state, message: `${stack.name} cannot be split any smaller.` };
  }
  const friendlyCount = battle.stacks.filter((entry) => entry.side === "friendly" && entry.count > 0).length;
  const nextCount = friendlyCount - 1 + pieces.length;
  if (nextCount > BATTLE_MAX_STACKS) {
    return {
      ok: false,
      state,
      message: `Splitting ${stack.name} would field ${nextCount} stacks. The board holds ${BATTLE_MAX_STACKS}.`,
    };
  }
  const hexes: { col: number; row: number }[] = [];
  const taken = new Set(
    battle.stacks
      .filter((entry) => entry.id !== stack.id && entry.count > 0)
      .map((entry) => `${entry.col},${entry.row}`),
  );
  if (FRIENDLY_COLS.includes(stack.col)) hexes.push({ col: stack.col, row: stack.row });
  for (const col of FRIENDLY_COLS) {
    for (let row = 0; row < BATTLE_ROWS; row++) {
      if (taken.has(`${col},${row}`) || hexes.some((hex) => hex.col === col && hex.row === row)) continue;
      hexes.push({ col, row });
    }
  }
  if (hexes.length < pieces.length) {
    return { ok: false, state, message: "Not enough room on the near edge for those stacks." };
  }
  const kept = battle.stacks.filter((entry) => entry.id !== stack.id);
  const created: BattleStack[] = [];
  for (const piece of pieces) {
    const id = nextFriendlyId([...kept, ...created]);
    const built = stackFromSoldiers(state, id, piece.name, piece.soldiers, piece.formationId, "friendly");
    const hex = hexes[created.length]!;
    created.push({ ...built, col: hex.col, row: hex.row });
  }
  const next = pushLog(
    { ...battle, stacks: [...kept, ...created] },
    `${stack.name} splits into ${created.map((entry) => entry.name).join(", ")}.`,
  );
  return {
    ok: true,
    state: { ...state, battle: next },
    message: `${stack.name} is now ${created.length} stacks.`,
    data: { stackId: created[0]!.id },
  };
}

export function beginBattle(state: GameState): ActionResult {
  const battle = state.battle;
  if (!battle || battle.phase !== "prepare") {
    return { ok: false, state, message: "Nothing is waiting to begin." };
  }
  let next = activateNext({ ...battle, phase: "fight", round: 1 });
  const active = next.stacks.find((stack) => stack.id === next.activeStackId);
  next = pushLog(next, `Battle begins. ${active ? `${active.name} acts first (speed ${active.speed}).` : ""}`);
  return {
    ok: true,
    state: { ...state, battle: next },
    message: active ? `${active.name} acts first.` : "Battle begins.",
  };
}

export function moveBattleStack(state: GameState, stackId: string, col: number, row: number): ActionResult {
  const battle = state.battle;
  if (!battle || battle.phase !== "fight") return { ok: false, state, message: "The battle has not started." };
  if (battle.activeStackId !== stackId) return { ok: false, state, message: "That stack does not have the action." };
  const stack = battle.stacks.find((entry) => entry.id === stackId);
  if (!stack || stack.side !== "friendly" || stack.moved) {
    return { ok: false, state, message: "This stack has already moved." };
  }
  const allowed = reachableHexes(battle, stackId).some((hex) => hex.col === col && hex.row === row);
  if (!allowed) return { ok: false, state, message: `${stack.name} cannot reach that hex (speed ${stack.speed}).` };
  const stacks = battle.stacks.map((entry) =>
    entry.id === stack.id ? { ...entry, col, row, moved: true } : entry,
  );
  const next = pushLog({ ...battle, stacks }, `${stack.name} moves to column ${col + 1}, row ${row + 1}.`);
  return { ok: true, state: { ...state, battle: next }, message: `${stack.name} moved.` };
}

export function shootBattleStack(
  state: GameState,
  stackId: string,
  targetId: string,
  partId?: string,
  mode: FireMode = "aim",
): ActionResult {
  const battle = state.battle;
  if (!battle || battle.phase !== "fight") return { ok: false, state, message: "The battle has not started." };
  if (battle.activeStackId !== stackId) return { ok: false, state, message: "That stack does not have the action." };
  const stack = battle.stacks.find((entry) => entry.id === stackId);
  if (!stack || stack.side !== "friendly" || stack.shot) {
    return { ok: false, state, message: "This stack has already fired." };
  }
  const shot = strike(battle, stackId, targetId, partId, mode);
  if (!shot.ok) return { ok: false, state, message: shot.message };
  const finished = passAction(shot.battle, stackId);
  const closed = finishIfOver({ ...state, battle: finished });
  return { ok: true, state: closed.state, message: closed.closing ?? shot.message };
}

function passAction(battle: BattleState, stackId: string): BattleState {
  const stacks = battle.stacks.map((stack) => (stack.id === stackId ? { ...stack, acted: true } : stack));
  return activateNext({ ...battle, stacks });
}

function enemyAct(battle: BattleState, stack: BattleStack): BattleState {
  let next = battle;
  const step = chooseEnemyMove(next, stack);
  if (step) {
    const stacks = next.stacks.map((entry) =>
      entry.id === stack.id ? { ...entry, col: step.col, row: step.row, moved: true } : entry,
    );
    next = pushLog({ ...next, stacks }, `${stack.name} moves to column ${step.col + 1}, row ${step.row + 1}.`);
  }
  const moved = next.stacks.find((entry) => entry.id === stack.id) ?? stack;
  const target = nearestEnemy(next, moved);
  const distance = target ? hexDistance(moved.col, moved.row, target.col, target.row) : 0;
  const reach = moved.range * SINGLE_REACH;
  if (target && distance <= Math.max(reach, moved.ammo <= 0 ? 1 : reach)) {
    const engagement = chooseDoctrineFire(moved, target, distance, Math.random());
    if (engagement) {
      const shot = strike(next, moved.id, target.id, engagement.partId, engagement.mode);
      next = shot.ok ? shot.battle : pushLog(next, shot.message);
    } else if (!step) {
      next = pushLog(next, `${stack.name} holds.`);
    }
  } else if (!step) {
    next = pushLog(next, `${stack.name} holds.`);
  }
  return passAction(next, stack.id);
}

export function finishBattleAction(state: GameState, mode: FireMode = "aim"): ActionResult {
  const battle = state.battle;
  if (!battle || battle.phase !== "fight") return { ok: false, state, message: "No stack is acting." };
  const stack = battle.stacks.find((entry) => entry.id === battle.activeStackId);
  if (!stack || stack.count <= 0) return { ok: false, state, message: "No stack is acting." };
  if (stack.side === "enemy") {
    const next = enemyAct(battle, stack);
    const closed = finishIfOver({ ...state, battle: next });
    const live = closed.state.battle;
    const active = live?.stacks.find((entry) => entry.id === live.activeStackId);
    return {
      ok: true,
      state: closed.state,
      message: closed.closing ?? (active ? `Next: ${active.name}.` : "The round passes."),
    };
  }
  let next = battle;
  if (!stack.shot) {
    const current = next.stacks.find((entry) => entry.id === stack.id) ?? stack;
    const target = nearestEnemy(next, current);
    const reach = mode === "aim" ? current.range * SINGLE_REACH : current.range;
    if (target && hexDistance(current.col, current.row, target.col, target.row) <= Math.max(reach, current.ammo <= 0 ? 1 : reach)) {
      const shot = strike(next, current.id, target.id, undefined, mode);
      next = shot.ok ? shot.battle : pushLog(next, shot.message);
    } else {
      next = pushLog(next, `${stack.name} holds.`);
    }
  }
  next = passAction(next, stack.id);
  const closed = finishIfOver({ ...state, battle: next });
  return {
    ok: true,
    state: closed.state,
    message: closed.closing ?? `${stack.name} finishes.`,
  };
}

function finishIfOver(state: GameState): { state: GameState; closing: string | null } {
  const battle = state.battle;
  if (!battle || battle.phase !== "fight") return { state, closing: null };
  const result = outcome(battle);
  if (!result) return { state, closing: null };
  const closed = concludeBattle(state, result);
  return { state: closed.state, closing: closed.message };
}

function concludeBattle(
  state: GameState,
  result: "win" | "loss" | "retreat",
): ActionResult {
  const battle = state.battle;
  if (!battle) return { ok: false, state, message: "No battle to resolve." };
  const contract = getContract(battle.contractId);
  if (!contract) {
    return { ok: false, state: { ...state, battle: null }, message: "Contract missing; battle cleared." };
  }

  const soldiers = state.company.soldiers.map((soldier) => ({
    ...soldier,
    perkIds: [...soldier.perkIds],
    loadout: soldier.loadout ? { ...soldier.loadout, gearIds: [...(soldier.loadout.gearIds ?? [])] } : null,
  }));
  let killed = 0;
  let ammoSpent = 0;
  for (const stack of battle.stacks.filter((entry) => entry.side === "friendly")) {
    const members = stack.soldierIds
      .map((id) => soldiers.find((soldier) => soldier.id === id))
      .filter((soldier): soldier is Soldier => Boolean(soldier));
    const lost = Math.max(0, stack.maxCount - stack.count);
    const doomed = [...members].sort((a, b) => a.hp - b.hp).slice(0, lost);
    for (const soldier of doomed) {
      soldier.alive = false;
      killed += 1;
    }
    const survivors = members.filter((soldier) => soldier.alive && soldier.loadout);
    for (const soldier of members) {
      if (!soldier.alive) continue;
      soldier.experience = Math.min(100, soldier.experience + (result === "win" ? 10 : 5));
    }
    const rounds = stack.ammo;
    if (survivors.length === 0) {
      ammoSpent += members.reduce((total, soldier) => total + (soldier.loadout?.ammoRounds ?? 0), 0);
      for (const soldier of members) {
        if (soldier.loadout) soldier.loadout.ammoRounds = 0;
      }
    } else {
      const had = members.reduce((total, soldier) => total + (soldier.loadout?.ammoRounds ?? 0), 0);
      ammoSpent += Math.max(0, had - rounds);
      const each = Math.floor(rounds / survivors.length);
      let extra = rounds - each * survivors.length;
      for (const soldier of survivors) {
        soldier.loadout!.ammoRounds = each + (extra > 0 ? 1 : 0);
        if (extra > 0) extra -= 1;
      }
    }
  }

  const won = result === "win";
  let next: GameState = {
    ...state,
    company: { ...state.company, soldiers },
    funds: state.funds + (won ? contract.cashReward : 0),
    battle: {
      ...battle,
      phase: "done",
      outcome: result,
      activeStackId: null,
    },
    activeMission: null,
  };
  if (won && contract.lootMaterials > 0) {
    next = storeAsMany(next, "raw_materials", "raw", contract.lootMaterials, 1, 0.8).state;
  }
  const board = applyJobResolution(next, contract.id, won);
  next = applyMissionMorale(board.state, won);
  if (won) next = awardContractWinRp(next);
  next = { ...next, battle: null };

  const title = won ? "Victory" : result === "retreat" ? "Retreat" : "Defeat";
  const loot = won ? ` Loot +$${contract.cashReward}. +${RP_PER_CONTRACT_WIN} RP.` : "";
  const message = `${title} at ${contract.name}. KIA ${killed}, ammunition spent ${ammoSpent}.${loot} ${board.message}`;
  return { ok: true, state: next, message };
}

export function retreatBattle(state: GameState): ActionResult {
  const battle = state.battle;
  if (!battle || battle.phase === "done") return { ok: false, state, message: "No battle to retreat from." };
  if (battle.phase === "prepare") {
    return { ok: true, state: { ...state, battle: null }, message: "Preparation cancelled." };
  }
  return concludeBattle(state, "retreat");
}

export function battleOrder(battle: BattleState): BattleStack[] {
  return orderStacks(battle);
}
