import { isArmed } from "./gear.js";
import type {
  CombatTerrain,
  Doctrine,
  GameState,
  OrgUnit,
  Soldier,
  SquadConsumption,
} from "./types.js";

export function doctrineConsumption(doctrine: Doctrine): SquadConsumption {
  switch (doctrine) {
    case "offensive":
      return { foodPerDay: 12, ammoPerDay: 40, suppliesPerDay: 6 };
    case "defensive":
      return { foodPerDay: 10, ammoPerDay: 20, suppliesPerDay: 8 };
    case "support":
      return { foodPerDay: 11, ammoPerDay: 15, suppliesPerDay: 10 };
    case "balance":
    default:
      return { foodPerDay: 10, ammoPerDay: 28, suppliesPerDay: 7 };
  }
}

/** Legacy flat squad helper — creates an OrgUnit at squad echelon without children. */
export function createSquad(
  id: string,
  name: string,
  size: number,
  doctrine: Doctrine = "balance",
  appointedWeaponId: string | null = null,
): OrgUnit {
  return {
    id,
    name,
    echelon: "squad",
    size: Math.max(1, Math.floor(size)),
    soldierIds: [],
    childUnitIds: [],
    commanderSoldierId: null,
    parentUnitId: null,
    doctrine,
    appointedWeaponId,
    consumption: doctrineConsumption(doctrine),
    fieldExperience: {},
  };
}

export function combineSquads(
  child: OrgUnit,
  parent: OrgUnit,
): { child: OrgUnit; parent: OrgUnit } {
  return {
    child: { ...child, parentUnitId: parent.id },
    parent: {
      ...parent,
      childUnitIds: parent.childUnitIds.includes(child.id)
        ? parent.childUnitIds
        : [...parent.childUnitIds, child.id],
    },
  };
}

export function assignSoldiersToSquad(
  state: GameState,
  squadId: string,
  soldierIds: string[],
): { ok: boolean; state: GameState; message: string } {
  const squad = state.squads.find((s) => s.id === squadId);
  if (!squad) {
    return { ok: false, state, message: `Unknown unit: ${squadId}` };
  }

  const room = Math.max(0, squad.size - squad.soldierIds.length);
  const take = soldierIds.slice(0, room);
  if (take.length === 0) {
    return { ok: false, state, message: "Unit is full or no soldiers provided." };
  }

  const takeSet = new Set(take);
  const soldiers: Soldier[] = state.company.soldiers.map((s) => {
    if (!takeSet.has(s.id) || !s.alive) return s;
    return {
      ...s,
      squadId,
      duty: isArmed(s) ? "ready" : "assigned",
      woundedRestTicks: 0,
    };
  });

  const squads = state.squads.map((s) =>
    s.id === squadId
      ? { ...s, soldierIds: [...s.soldierIds, ...take] }
      : s,
  );

  return {
    ok: true,
    state: {
      ...state,
      company: { ...state.company, soldiers },
      squads,
    },
    message: `Assigned ${take.length} soldiers to ${squad.name}.`,
  };
}

/**
 * Demo helper: put unassigned armed troops into a holding squad so logistics
 * still sees assigned formations. Prefer formFireTeam in interactive play.
 */
export function ensureDefaultSquadFilled(
  state: GameState,
  size = 20,
  doctrine: Doctrine = "balance",
  appointedWeaponId: string | null = null,
): GameState {
  let next = state;
  let squad = next.squads.find((s) => s.id === "holding-1");
  if (!squad) {
    squad = createSquad("holding-1", "Holding Pool", size, doctrine, appointedWeaponId);
    next = { ...next, squads: [...next.squads, squad] };
  } else if (appointedWeaponId && !squad.appointedWeaponId) {
    next = {
      ...next,
      squads: next.squads.map((s) =>
        s.id === squad!.id ? { ...s, appointedWeaponId } : s,
      ),
    };
  }

  const unassigned = next.company.soldiers
    .filter((s) => s.alive && s.squadId == null && isArmed(s))
    .map((s) => s.id);
  if (unassigned.length === 0) return next;

  const result = assignSoldiersToSquad(next, "holding-1", unassigned);
  return result.ok ? result.state : next;
}

export function terrainExperienceBonus(
  squad: OrgUnit,
  terrain: CombatTerrain,
): number {
  return Math.min(15, squad.fieldExperience[terrain] ?? 0);
}
