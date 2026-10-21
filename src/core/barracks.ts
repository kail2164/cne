import { START, getRifle, getRifleForCaliber, getSelectedAmmo } from "./catalog.js";
import { ensureDefaultSquadFilled } from "./composition.js";
import {
  canCarryAmmo,
  carryCapacityKg,
  describeCarry,
  isArmed,
  maxAmmoCarry,
} from "./gear.js";
import { companyForcePower } from "./power.js";
import { createRecruitSoldier } from "./soldier.js";
import type { ActionResult, GameState, Soldier } from "./types.js";
import { getQuantity, withdrawItems } from "./warehouse.js";

function livingSoldiers(state: GameState): Soldier[] {
  return state.company.soldiers.filter((s) => s.alive);
}

export function livingPop(state: GameState): number {
  return livingSoldiers(state).length;
}

export function countByDuty(state: GameState, duty: Soldier["duty"]): number {
  return livingSoldiers(state).filter((s) => s.duty === duty).length;
}

/** Combat-ready armed troops (weapon + ≥1 magazine). */
export function companyTroopCount(state: GameState): number {
  return livingSoldiers(state).filter(isArmed).length;
}

export function companyReserveCount(state: GameState): number {
  return livingSoldiers(state).filter((s) => !isArmed(s)).length;
}

export function companyTotalAmmo(state: GameState): number {
  return livingSoldiers(state).reduce((n, s) => n + (s.loadout?.ammoRounds ?? 0), 0);
}

export function soldierWeaponFactor(weaponId: string): number {
  const weapon = getRifle(weaponId);
  if (!weapon) return 0;
  const fireFactor = Math.min(1.3, Math.max(0.7, weapon.fireRateRpm / 15));
  const reliFactor = Math.min(1, Math.max(0.5, weapon.reliabilityPct / 100));
  return fireFactor * reliFactor;
}

export function companyPower(state: GameState): number {
  return companyForcePower(state);
}

export function listSoldiers(state: GameState): string[] {
  return livingSoldiers(state).map((s, i) => {
    const status = isArmed(s) ? "armed" : "RESERVE";
    const w = s.loadout?.weaponId ?? "—";
    const ammo = s.loadout?.ammoRounds ?? 0;
    const unit = s.squadId ?? "unassigned";
    return (
      `${i + 1}. ${s.id} ${s.name} [${status}] loy ${s.loyalty} ` +
      `str ${s.strength} ${describeCarry(s)} | ${w} ×${ammo} | unit ${unit}`
    );
  });
}

/**
 * Recruit: money + 1 pop each. No weapon required → reserve.
 * Warns when adding unpaid mouths.
 */
export function recruitSoldiers(
  state: GameState,
  count: number,
): ActionResult<{ recruited: number }> {
  if (count <= 0) {
    return { ok: false, state, message: "Recruit at least 1 soldier.", data: { recruited: 0 } };
  }

  const affordable = Math.floor(state.funds / START.recruitCostPerSoldier);
  const openSlots = Math.max(0, state.barracksPopSlots - livingPop(state));
  const recruited = Math.min(count, affordable, openSlots);

  if (recruited <= 0) {
    const reasons: string[] = [];
    if (affordable <= 0) reasons.push("insufficient funds");
    if (openSlots <= 0) reasons.push("barracks pop slots full");
    return {
      ok: false,
      state,
      message: `Cannot recruit (${reasons.join(", ")}).`,
      data: { recruited: 0 },
    };
  }

  const cost = recruited * START.recruitCostPerSoldier;
  const baseId = state.company.soldiers.length;
  const newSoldiers: Soldier[] = Array.from({ length: recruited }, (_, i) => {
    const id = `s-${baseId + i + 1}`;
    return createRecruitSoldier(id, `Private ${baseId + i + 1}`, null, {
      duty: "unassigned",
    });
  });

  const reservesAfter = companyReserveCount(state) + recruited;
  const warn =
    reservesAfter > 0
      ? ` ${recruited} reserves still draw salary+food — arm them or trim the roster.`
      : "";

  const capped =
    recruited < count
      ? ` (capped from ${count}: funds allow ${affordable}, slots ${openSlots})`
      : "";

  return {
    ok: true,
    state: {
      ...state,
      funds: state.funds - cost,
      company: {
        ...state.company,
        soldiers: [...state.company.soldiers, ...newSoldiers],
      },
    },
    message: `Recruited ${recruited} ($${cost}) into reserve.${capped}${warn}`,
    data: { recruited },
  };
}

/**
 * Arm reserves: 1 rifle + 1 magazine of selected ammo each.
 * Targets all unarmed living, or specific ids.
 */
export function armSoldiers(
  state: GameState,
  soldierIds?: string[],
): ActionResult<{ armed: number }> {
  if (!state.selectedCaliberId) {
    return {
      ok: false,
      state,
      message: "Select a caliber before arming.",
      data: { armed: 0 },
    };
  }
  const rifle = getRifleForCaliber(state.selectedCaliberId);
  const ammo = getSelectedAmmo(state);
  if (!rifle || !ammo) {
    return {
      ok: false,
      state,
      message: "No rifle/ammo for selected family.",
      data: { armed: 0 },
    };
  }

  const mag = Math.max(1, rifle.ammoCapacity);
  const targets = livingSoldiers(state).filter((s) => {
    if (isArmed(s)) return false;
    if (soldierIds && soldierIds.length > 0) return soldierIds.includes(s.id);
    return true;
  });

  if (targets.length === 0) {
    return { ok: false, state, message: "No reserves to arm.", data: { armed: 0 } };
  }

  let next = state;
  let armed = 0;
  const soldiers = [...next.company.soldiers];

  for (const t of targets) {
    const riflesLeft = getQuantity(next.warehouse, "weapon", rifle.id);
    const ammoLeft = getQuantity(next.warehouse, "ammo", ammo.id);
    if (riflesLeft < 1 || ammoLeft < mag) break;

    const wdR = withdrawItems(next, "weapon", rifle.id, 1);
    if (!wdR.ok) break;
    next = wdR.state;
    const wdA = withdrawItems(next, "ammo", ammo.id, mag);
    if (!wdA.ok) {
      // best-effort: should not happen if qty checked
      break;
    }
    next = wdA.state;

    const idx = soldiers.findIndex((s) => s.id === t.id);
    if (idx < 0) continue;
    const s = soldiers[idx]!;
    const loadout = {
      weaponId: rifle.id,
      ammoCaliberId: ammo.id,
      ammoRounds: mag,
      weaponCondition: s.loadout?.weaponCondition ?? 100,
      gearIds: s.loadout?.gearIds ?? ["basic-pouch"],
    };
    const updated: Soldier = {
      ...s,
      loadout,
      duty: s.squadId ? "ready" : "unassigned",
    };
    // Carry check with pouch
    if (!canCarryAmmo({ ...updated, loadout: { ...loadout, ammoRounds: 0 } }, mag)) {
      // still allow magazine — pouch should fit; skip if absurd
    }
    soldiers[idx] = updated;
    armed += 1;
  }

  next = {
    ...next,
    company: { ...next.company, soldiers },
  };

  if (armed > 0) {
    next = ensureDefaultSquadFilled(
      next,
      START.defaultSquadSize,
      "balance",
      rifle.id,
    );
  }

  const short =
    armed < targets.length
      ? ` (stopped at ${armed}/${targets.length}: need rifle+${mag} rd each)`
      : "";

  return {
    ok: armed > 0,
    state: next,
    message:
      armed > 0
        ? `Armed ${armed} with ${rifle.name} + ${mag} ${ammo.name}.${short}`
        : `Could not arm (need rifles and ${mag} rounds each).`,
    data: { armed },
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
  const troops = livingSoldiers(state).filter(
    (s) => s.loadout?.weaponId && s.duty !== "wounded",
  );
  if (troops.length === 0) {
    return {
      ok: false,
      state,
      message: "No armed soldiers to load out (arm reserves first).",
      data: { issued: 0 },
    };
  }
  if (roundsPerSoldier < 0) {
    return { ok: false, state, message: "Ammo per soldier cannot be negative.", data: { issued: 0 } };
  }

  const ammo = getSelectedAmmo(state);
  if (!ammo) {
    return {
      ok: false,
      state,
      message: "No ammo load for selected family/subtype.",
      data: { issued: 0 },
    };
  }

  // Per-soldier fill up to min(requested, carry cap), shared weight pool
  let next = state;
  let issued = 0;
  const soldiers = [...next.company.soldiers];
  const notes: string[] = [];

  for (const t of troops) {
    const idx = soldiers.findIndex((s) => s.id === t.id);
    if (idx < 0 || !soldiers[idx]!.loadout) continue;
    const s = soldiers[idx]!;
    const cur = s.loadout!.ammoRounds;
    const wantTotal = roundsPerSoldier;
    let add = Math.max(0, wantTotal - cur);
    const maxCarry = maxAmmoCarry(s);
    if (cur + add > maxCarry) {
      add = Math.max(0, maxCarry - cur);
      notes.push(`${s.id} carry cap ${maxCarry}`);
    }
    // Weight check
    while (add > 0 && !canCarryAmmo(s, add)) {
      add -= 1;
    }
    if (add <= 0) continue;
    const available = getQuantity(next.warehouse, "ammo", ammo.id);
    const take = Math.min(add, available);
    if (take <= 0) {
      notes.push("warehouse empty");
      break;
    }
    const wd = withdrawItems(next, "ammo", ammo.id, take);
    if (!wd.ok) break;
    next = wd.state;
    soldiers[idx] = {
      ...s,
      loadout: {
        ...s.loadout!,
        ammoCaliberId: ammo.id,
        ammoRounds: cur + take,
        gearIds: s.loadout!.gearIds ?? [],
      },
      duty: s.squadId ? "ready" : s.duty,
    };
    // refresh s reference for canCarry in loop — mutate local
    Object.assign(s, soldiers[idx]);
    issued += take;
  }

  next = { ...next, company: { ...next.company, soldiers } };
  const note = notes.length ? ` (${[...new Set(notes)].slice(0, 3).join("; ")})` : "";

  return {
    ok: issued > 0 || roundsPerSoldier === 0,
    state: next,
    message: `Issued ${issued} ${ammo.name} toward ${roundsPerSoldier}/soldier.${note}`,
    data: { issued },
  };
}

export { isArmed, carryCapacityKg, describeCarry };
