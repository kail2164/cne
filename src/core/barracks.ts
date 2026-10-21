import { START, getCaliber, getRifle, getRifleForCaliber } from "./catalog.js";
import type { ActionResult, GameState, Soldier } from "./types.js";
import { getQuantity, withdrawItems } from "./warehouse.js";

function livingSoldiers(state: GameState): Soldier[] {
  return state.company.soldiers.filter((s) => s.alive);
}

export function companyTroopCount(state: GameState): number {
  return livingSoldiers(state).length;
}

export function companyTotalAmmo(state: GameState): number {
  return livingSoldiers(state).reduce((n, s) => n + (s.loadout?.ammoRounds ?? 0), 0);
}

/** Phase 1 power estimate: damage + caliber, scaled by fire rate & reliability. */
export function soldierWeaponFactor(weaponId: string): number {
  const weapon = getRifle(weaponId);
  if (!weapon) return 0;
  const fireFactor = Math.min(1.3, Math.max(0.7, weapon.fireRateRpm / 15));
  const reliFactor = Math.min(1, Math.max(0.5, weapon.reliabilityPct / 100));
  return fireFactor * reliFactor;
}

export function companyPower(state: GameState): number {
  return livingSoldiers(state).reduce((sum, s) => {
    if (!s.loadout) return sum;
    const weapon = getRifle(s.loadout.weaponId);
    const cal = getCaliber(s.loadout.ammoCaliberId);
    if (!weapon || !cal) return sum;
    const base = weapon.damage + cal.stoppingPower;
    return sum + base * soldierWeaponFactor(weapon.id) * (0.85 + s.skill * 0.15);
  }, 0);
}

export function recruitSoldiers(
  state: GameState,
  count: number,
): ActionResult<{ recruited: number }> {
  if (!state.selectedCaliberId) {
    return {
      ok: false,
      state,
      message: "Select a caliber before recruiting.",
      data: { recruited: 0 },
    };
  }
  if (count <= 0) {
    return { ok: false, state, message: "Recruit at least 1 soldier.", data: { recruited: 0 } };
  }

  const rifle = getRifleForCaliber(state.selectedCaliberId)!;
  const availableRifles = getQuantity(state.warehouse, "weapon", rifle.id);
  const affordable = Math.floor(state.funds / START.recruitCostPerSoldier);
  const recruited = Math.min(count, availableRifles, affordable);

  if (recruited <= 0) {
    const reasons: string[] = [];
    if (availableRifles <= 0) reasons.push("no rifles in warehouse");
    if (affordable <= 0) reasons.push("insufficient funds");
    return {
      ok: false,
      state,
      message: `Cannot recruit (${reasons.join(", ")}).`,
      data: { recruited: 0 },
    };
  }

  let next = state;
  const wd = withdrawItems(next, "weapon", rifle.id, recruited);
  if (!wd.ok) {
    return { ok: false, state, message: wd.message, data: { recruited: 0 } };
  }
  next = wd.state;

  const cost = recruited * START.recruitCostPerSoldier;
  const baseId = next.company.soldiers.length;
  const newSoldiers: Soldier[] = Array.from({ length: recruited }, (_, i) => ({
    id: `s-${baseId + i + 1}`,
    name: `Private ${baseId + i + 1}`,
    loadout: {
      weaponId: rifle.id,
      ammoCaliberId: state.selectedCaliberId!,
      ammoRounds: 0,
    },
    alive: true,
    skill: 1,
  }));

  next = {
    ...next,
    funds: next.funds - cost,
    company: {
      ...next.company,
      soldiers: [...next.company.soldiers, ...newSoldiers],
    },
  };

  const capped =
    recruited < count
      ? ` (capped from ${count}: rifles=${availableRifles}, funds allow ${affordable})`
      : "";

  return {
    ok: true,
    state: next,
    message: `Recruited ${recruited} soldiers with ${rifle.name}.${capped}`,
    data: { recruited },
  };
}

export function issueCompanyAmmo(
  state: GameState,
  roundsPerSoldier: number,
): ActionResult<{ issued: number }> {
  if (!state.selectedCaliberId) {
    return {
      ok: false,
      state,
      message: "No caliber selected.",
      data: { issued: 0 },
    };
  }
  const troops = livingSoldiers(state);
  if (troops.length === 0) {
    return { ok: false, state, message: "No soldiers to load out.", data: { issued: 0 } };
  }
  if (roundsPerSoldier < 0) {
    return { ok: false, state, message: "Ammo per soldier cannot be negative.", data: { issued: 0 } };
  }

  const calId = state.selectedCaliberId;
  const need = troops.length * roundsPerSoldier;
  const available = getQuantity(state.warehouse, "ammo", calId);
  if (available < need) {
    return {
      ok: false,
      state,
      message: `Need ${need} rounds, warehouse has ${available}.`,
      data: { issued: 0 },
    };
  }

  let next = state;
  if (need > 0) {
    const wd = withdrawItems(next, "ammo", calId, need);
    if (!wd.ok) return { ok: false, state, message: wd.message, data: { issued: 0 } };
    next = wd.state;
  }

  next = {
    ...next,
    company: {
      ...next.company,
      soldiers: next.company.soldiers.map((s) =>
        s.alive && s.loadout
          ? {
              ...s,
              loadout: { ...s.loadout, ammoRounds: roundsPerSoldier },
            }
          : s,
      ),
    },
  };

  return {
    ok: true,
    state: next,
    message: `Issued ${roundsPerSoldier} rounds × ${troops.length} soldiers (${need} total).`,
    data: { issued: need },
  };
}
