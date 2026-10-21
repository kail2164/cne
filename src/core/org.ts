import { doctrineConsumption } from "./composition.js";
import { isArmed } from "./gear.js";
import type {
  ActionResult,
  Doctrine,
  GameState,
  OrgEchelon,
  OrgUnit,
  Soldier,
} from "./types.js";

export const ECHELON_LABEL: Record<OrgEchelon, string> = {
  fire_team: "Fire team",
  squad: "Squad",
  platoon: "Platoon",
  company: "Company",
  battalion: "Battalion",
  brigade: "Brigade",
  division: "Division",
};

/** Child count guides (inclusive). Vehicles excluded. */
export const ECHELON_CHILD_RANGE: Record<
  Exclude<OrgEchelon, "fire_team">,
  { min: number; max: number; child: OrgEchelon }
> = {
  squad: { min: 2, max: 3, child: "fire_team" },
  platoon: { min: 3, max: 4, child: "squad" },
  company: { min: 4, max: 5, child: "platoon" },
  battalion: { min: 4, max: 5, child: "company" },
  brigade: { min: 4, max: 5, child: "battalion" },
  division: { min: 2, max: 5, child: "brigade" },
};

export const FIRE_TEAM_SIZE = { min: 3, max: 5 } as const;

export function createOrgUnit(
  id: string,
  name: string,
  echelon: OrgEchelon,
  opts: {
    size?: number;
    doctrine?: Doctrine;
    appointedWeaponId?: string | null;
    commanderSoldierId?: string | null;
  } = {},
): OrgUnit {
  const doctrine = opts.doctrine ?? "balance";
  return {
    id,
    name,
    echelon,
    size: opts.size ?? (echelon === "fire_team" ? 4 : 0),
    soldierIds: [],
    childUnitIds: [],
    commanderSoldierId: opts.commanderSoldierId ?? null,
    parentUnitId: null,
    doctrine,
    appointedWeaponId: opts.appointedWeaponId ?? null,
    consumption: doctrineConsumption(doctrine),
    fieldExperience: {},
  };
}

function nextOrgId(state: GameState, prefix: string): string {
  const n = state.squads.filter((u) => u.id.startsWith(prefix)).length + 1;
  return `${prefix}-${n}`;
}

function livingById(state: GameState, id: string): Soldier | undefined {
  return state.company.soldiers.find((s) => s.id === id && s.alive);
}

function freeForAssignment(state: GameState, id: string): boolean {
  const s = livingById(state, id);
  if (!s) return false;
  if (s.duty === "wounded") return false;
  return s.squadId == null;
}

/**
 * Form a fire team of 3–5 soldiers; first id (or explicit) is commander.
 * Commander is drawn from the roster and counted in the team.
 */
export function formFireTeam(
  state: GameState,
  soldierIds: string[],
  name?: string,
  commanderId?: string,
): ActionResult<{ unit: OrgUnit }> {
  const unique = [...new Set(soldierIds)];
  if (unique.length < FIRE_TEAM_SIZE.min || unique.length > FIRE_TEAM_SIZE.max) {
    return {
      ok: false,
      state,
      message: `Fire team needs ${FIRE_TEAM_SIZE.min}–${FIRE_TEAM_SIZE.max} soldiers (got ${unique.length}).`,
    };
  }
  for (const id of unique) {
    if (!freeForAssignment(state, id)) {
      return {
        ok: false,
        state,
        message: `Soldier ${id} missing, wounded, or already assigned.`,
      };
    }
  }
  const cdr = commanderId ?? unique[0]!;
  if (!unique.includes(cdr)) {
    return { ok: false, state, message: "Commander must be a team member." };
  }

  const id = nextOrgId(state, "ft");
  const unit = createOrgUnit(id, name ?? `Fire Team ${id}`, "fire_team", {
    size: unique.length,
    commanderSoldierId: cdr,
  });
  unit.soldierIds = [...unique];

  const idSet = new Set(unique);
  const soldiers = state.company.soldiers.map((s) => {
    if (!idSet.has(s.id)) return s;
    return {
      ...s,
      squadId: id,
      duty: isArmed(s) ? ("ready" as const) : ("assigned" as const),
    };
  });

  return {
    ok: true,
    state: {
      ...state,
      company: { ...state.company, soldiers },
      squads: [...state.squads, unit],
    },
    message: `Formed ${unit.name} (${unique.length}) CDR ${cdr}.`,
    data: { unit },
  };
}

/**
 * Form a squad from 2–3 fire teams + one higher commander (not on those teams).
 * Example: 2×4 teams + CDR = 9 headcount under the squad umbrella.
 */
export function formSquadFromTeams(
  state: GameState,
  fireTeamIds: string[],
  commanderSoldierId: string,
  name?: string,
): ActionResult<{ unit: OrgUnit }> {
  const range = ECHELON_CHILD_RANGE.squad;
  const unique = [...new Set(fireTeamIds)];
  if (unique.length < range.min || unique.length > range.max) {
    return {
      ok: false,
      state,
      message: `Squad needs ${range.min}–${range.max} fire teams (got ${unique.length}).`,
    };
  }

  const teams = unique.map((id) => state.squads.find((u) => u.id === id));
  for (let i = 0; i < teams.length; i++) {
    const t = teams[i];
    if (!t || t.echelon !== "fire_team") {
      return { ok: false, state, message: `Not a fire team: ${unique[i]}` };
    }
    if (t.parentUnitId) {
      return { ok: false, state, message: `${t.name} already has a parent.` };
    }
  }

  const cdr = livingById(state, commanderSoldierId);
  if (!cdr) {
    return { ok: false, state, message: `Commander ${commanderSoldierId} not found.` };
  }
  if (cdr.squadId) {
    return {
      ok: false,
      state,
      message: "Squad commander must not already be on a fire team.",
    };
  }

  const id = nextOrgId(state, "sq");
  const unit = createOrgUnit(id, name ?? `Squad ${id}`, "squad", {
    commanderSoldierId,
  });
  unit.childUnitIds = [...unique];
  // CDR is roster billet at squad level (not duplicated into fire team lists)
  unit.soldierIds = [commanderSoldierId];

  const childSet = new Set(unique);
  const formations = state.squads.map((u) =>
    childSet.has(u.id) ? { ...u, parentUnitId: id } : u,
  );
  formations.push(unit);

  const soldiers = state.company.soldiers.map((s) =>
    s.id === commanderSoldierId
      ? {
          ...s,
          squadId: id,
          duty: isArmed(s) ? ("ready" as const) : ("assigned" as const),
        }
      : s,
  );

  return {
    ok: true,
    state: {
      ...state,
      company: { ...state.company, soldiers },
      squads: formations,
    },
    message: `Formed ${unit.name} from ${unique.length} teams + CDR ${commanderSoldierId}.`,
    data: { unit },
  };
}

/** Attach child units under a higher echelon (platoon → division). */
export function formHigherEchelon(
  state: GameState,
  echelon: Exclude<OrgEchelon, "fire_team" | "squad">,
  childIds: string[],
  commanderSoldierId: string,
  name?: string,
): ActionResult<{ unit: OrgUnit }> {
  const range = ECHELON_CHILD_RANGE[echelon];
  const unique = [...new Set(childIds)];
  if (unique.length < range.min || unique.length > range.max) {
    return {
      ok: false,
      state,
      message: `${ECHELON_LABEL[echelon]} needs ${range.min}–${range.max} ${range.child}s (got ${unique.length}).`,
    };
  }

  for (const cid of unique) {
    const child = state.squads.find((u) => u.id === cid);
    if (!child || child.echelon !== range.child) {
      return {
        ok: false,
        state,
        message: `Expected ${range.child}, got ${cid}.`,
      };
    }
    if (child.parentUnitId) {
      return { ok: false, state, message: `${child.name} already attached.` };
    }
  }

  if (!livingById(state, commanderSoldierId)) {
    return { ok: false, state, message: `Commander ${commanderSoldierId} not found.` };
  }

  const prefix =
    echelon === "platoon"
      ? "plt"
      : echelon === "company"
        ? "co"
        : echelon === "battalion"
          ? "bn"
          : echelon === "brigade"
            ? "bde"
            : "div";
  const id = nextOrgId(state, prefix);
  const unit = createOrgUnit(id, name ?? `${ECHELON_LABEL[echelon]} ${id}`, echelon, {
    commanderSoldierId,
  });
  unit.childUnitIds = [...unique];
  unit.soldierIds = [commanderSoldierId];

  const childSet = new Set(unique);
  const formations = state.squads.map((u) =>
    childSet.has(u.id) ? { ...u, parentUnitId: id } : u,
  );
  formations.push(unit);

  const soldiers = state.company.soldiers.map((s) =>
    s.id === commanderSoldierId
      ? {
          ...s,
          squadId: id,
          duty: isArmed(s) ? ("ready" as const) : ("assigned" as const),
        }
      : s,
  );

  return {
    ok: true,
    state: { ...state, company: { ...state.company, soldiers }, squads: formations },
    message: `Formed ${unit.name}.`,
    data: { unit },
  };
}

export function listFormations(state: GameState, echelon?: OrgEchelon): OrgUnit[] {
  return state.squads.filter((u) => (echelon ? u.echelon === echelon : true));
}

export function describeOrg(state: GameState): string[] {
  return state.squads.map((u) => {
    const cdr = u.commanderSoldierId ?? "—";
    const kids = u.childUnitIds.length
      ? ` children=${u.childUnitIds.join(",")}`
      : ` men=${u.soldierIds.length}`;
    return `${ECHELON_LABEL[u.echelon]} ${u.name} [${u.id}] CDR ${cdr}${kids}`;
  });
}
