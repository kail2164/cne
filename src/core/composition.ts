import type {
  CombatTerrain,
  Doctrine,
  GameState,
  Soldier,
  Squad,
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

export function createSquad(
  id: string,
  name: string,
  size: number,
  doctrine: Doctrine = "balance",
  appointedWeaponId: string | null = null,
): Squad {
  return {
    id,
    name,
    size: Math.max(1, Math.floor(size)),
    soldierIds: [],
    doctrine,
    appointedWeaponId,
    parentSquadId: null,
    consumption: doctrineConsumption(doctrine),
    fieldExperience: {},
  };
}

export function combineSquads(
  child: Squad,
  parent: Squad,
): { child: Squad; parent: Squad } {
  return {
    child: { ...child, parentSquadId: parent.id },
    parent: { ...parent },
  };
}

export function assignSoldiersToSquad(
  state: GameState,
  squadId: string,
  soldierIds: string[],
): { ok: boolean; state: GameState; message: string } {
  const squad = state.squads.find((s) => s.id === squadId);
  if (!squad) {
    return { ok: false, state, message: `Unknown squad: ${squadId}` };
  }

  const room = Math.max(0, squad.size - squad.soldierIds.length);
  const take = soldierIds.slice(0, room);
  if (take.length === 0) {
    return { ok: false, state, message: "Squad is full or no soldiers provided." };
  }

  const takeSet = new Set(take);
  const soldiers: Soldier[] = state.company.soldiers.map((s) => {
    if (!takeSet.has(s.id) || !s.alive) return s;
    const armed = Boolean(s.loadout?.weaponId);
    return {
      ...s,
      squadId,
      duty: armed ? "ready" : "assigned",
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

/** Ensure a default squad exists and fill it with unassigned armed troops. */
export function ensureDefaultSquadFilled(
  state: GameState,
  size = 20,
  doctrine: Doctrine = "balance",
  appointedWeaponId: string | null = null,
): GameState {
  let next = state;
  let squad = next.squads.find((s) => s.id === "squad-1");
  if (!squad) {
    squad = createSquad("squad-1", "1st Squad", size, doctrine, appointedWeaponId);
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
    .filter((s) => s.alive && s.duty === "unassigned" && s.loadout)
    .map((s) => s.id);
  if (unassigned.length === 0) return next;

  const result = assignSoldiersToSquad(next, "squad-1", unassigned);
  return result.ok ? result.state : next;
}

export function terrainExperienceBonus(
  squad: Squad,
  terrain: CombatTerrain,
): number {
  return Math.min(15, squad.fieldExperience[terrain] ?? 0);
}
