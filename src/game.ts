export type UnitKind = "infantry" | "archers" | "cavalry";

export interface Army {
  name: string;
  units: Record<UnitKind, number>;
}

export interface Conflict {
  id: string;
  name: string;
  blurb: string;
  oppositionStrength: number;
}

export const CONFLICTS: Conflict[] = [
  {
    id: "border-skirmish",
    name: "Border Skirmish",
    blurb: "Raiders probe the frontier. Light opposition, quick resolution.",
    oppositionStrength: 18,
  },
  {
    id: "river-crossing",
    name: "River Crossing",
    blurb: "Hold the ford while the enemy tries to push across.",
    oppositionStrength: 28,
  },
  {
    id: "siege-of-ashvale",
    name: "Siege of Ashvale",
    blurb: "Storm the walls or starve them out — either way, it will hurt.",
    oppositionStrength: 42,
  },
];

const WEIGHTS: Record<UnitKind, number> = {
  infantry: 2,
  archers: 3,
  cavalry: 4,
};

export function createArmy(name: string, units: Record<UnitKind, number>): Army {
  return {
    name: name.trim() || "Nameless Host",
    units: {
      infantry: Math.max(0, Math.floor(units.infantry)),
      archers: Math.max(0, Math.floor(units.archers)),
      cavalry: Math.max(0, Math.floor(units.cavalry)),
    },
  };
}

export function armyStrength(army: Army): number {
  return (Object.keys(WEIGHTS) as UnitKind[]).reduce(
    (sum, kind) => sum + army.units[kind] * WEIGHTS[kind],
    0,
  );
}

export function totalTroops(army: Army): number {
  return army.units.infantry + army.units.archers + army.units.cavalry;
}

export interface FightResult {
  conflict: Conflict;
  army: Army;
  yourStrength: number;
  oppositionStrength: number;
  won: boolean;
  margin: number;
  summary: string;
}

export function resolveFight(army: Army, conflict: Conflict): FightResult {
  const yourStrength = armyStrength(army);
  const oppositionStrength = conflict.oppositionStrength;
  const margin = yourStrength - oppositionStrength;
  const won = margin >= 0;

  const summary = won
    ? `${army.name} prevails in ${conflict.name} (strength ${yourStrength} vs ${oppositionStrength}).`
    : `${army.name} is driven back from ${conflict.name} (strength ${yourStrength} vs ${oppositionStrength}).`;

  return {
    conflict,
    army,
    yourStrength,
    oppositionStrength,
    won,
    margin,
    summary,
  };
}
