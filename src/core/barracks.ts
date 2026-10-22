import { START, getAmmo, getCaliber, getRifle, getRifleForCaliber, getSelectedAmmo } from "./catalog.js";
import { ensureDefaultSquadFilled } from "./composition.js";
import {
  canCarryAmmo,
  carryCapacityKg,
  carriedWeightKg,
  describeCarry,
  getGear,
  isArmed,
  maxAmmoCarry,
} from "./gear.js";
import { companyForcePower } from "./power.js";
import { isGearUnlocked, isLoadSubtypeUnlocked, isWeaponUnlocked } from "./research.js";
import { createRecruitSoldier } from "./soldier.js";
import type { ActionResult, GameState, Loadout, Soldier } from "./types.js";
import { getQuantity, storeItems, withdrawItems } from "./warehouse.js";

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

/** +20% compound per 10 lifetime hires: base × (1.2)^floor(n/10). */
export const RECRUIT_COST_STEP = 10;
export const RECRUIT_COST_MULT = 1.2;

/** Unit hire cost given lifetime hires already completed. */
export function recruitUnitCostAt(lifetimeHired: number): number {
  const tier = Math.floor(Math.max(0, lifetimeHired) / RECRUIT_COST_STEP);
  return Math.round(START.recruitCostPerSoldier * Math.pow(RECRUIT_COST_MULT, tier));
}

/** Current next-hire unit price. */
export function currentRecruitUnitCost(state: GameState): number {
  return recruitUnitCostAt(state.lifetimeRecruitsHired);
}

/**
 * Progressive batch cost for `count` hires starting at `lifetimeHired`.
 * Returns how many can be afforded with `funds` and the total cost.
 */
export function quoteRecruitBatch(
  lifetimeHired: number,
  count: number,
  funds: number,
): { recruited: number; cost: number } {
  let cost = 0;
  let recruited = 0;
  for (let i = 0; i < count; i++) {
    const unit = recruitUnitCostAt(lifetimeHired + i);
    if (cost + unit > funds) break;
    cost += unit;
    recruited += 1;
  }
  return { recruited, cost };
}

/**
 * Recruit: money + 1 pop each. No weapon required → reserve.
 * Cost scales +20% per 10 lifetime hires (progressive within a batch).
 */
export function recruitSoldiers(
  state: GameState,
  count: number,
): ActionResult<{ recruited: number; unitCost: number; cost: number }> {
  if (count <= 0) {
    return {
      ok: false,
      state,
      message: "Recruit at least 1 soldier.",
      data: { recruited: 0, unitCost: currentRecruitUnitCost(state), cost: 0 },
    };
  }

  const openSlots = Math.max(0, state.barracksPopSlots - livingPop(state));
  const want = Math.min(count, openSlots);
  const quote = quoteRecruitBatch(state.lifetimeRecruitsHired, want, state.funds);
  const recruited = quote.recruited;
  const unitCost = currentRecruitUnitCost(state);

  if (recruited <= 0) {
    const reasons: string[] = [];
    if (state.funds < unitCost) reasons.push(`insufficient funds (need $${unitCost}/ea)`);
    if (openSlots <= 0) reasons.push("barracks pop slots full");
    return {
      ok: false,
      state,
      message: `Cannot recruit (${reasons.join(", ") || "none"}).`,
      data: { recruited: 0, unitCost, cost: 0 },
    };
  }

  const cost = quote.cost;
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
      ? ` (capped from ${count}: funds/slots; next $${recruitUnitCostAt(state.lifetimeRecruitsHired + recruited)}/ea)`
      : "";

  const nextLifetime = state.lifetimeRecruitsHired + recruited;
  const nextPrice = recruitUnitCostAt(nextLifetime);

  return {
    ok: true,
    state: {
      ...state,
      funds: state.funds - cost,
      lifetimeRecruitsHired: nextLifetime,
      company: {
        ...state.company,
        soldiers: [...state.company.soldiers, ...newSoldiers],
      },
    },
    message: `Recruited ${recruited} ($${cost}, was $${unitCost}/ea → next $${nextPrice}/ea, lifetime ${nextLifetime}).${capped}${warn}`,
    data: { recruited, unitCost, cost },
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
  soldierIds?: string[],
): ActionResult<{ issued: number }> {
  if (!state.selectedCaliberId) {
    return {
      ok: false,
      state,
      message: "No caliber selected.",
      data: { issued: 0 },
    };
  }
  const idSet = soldierIds && soldierIds.length > 0 ? new Set(soldierIds) : null;
  const troops = livingSoldiers(state).filter(
    (s) => s.loadout?.weaponId && s.duty !== "wounded" && (!idSet || idSet.has(s.id)),
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

export interface EquipChoice {
  weaponId?: string;
  ammoId?: string;
  gearIds?: string[];
}

function blankLoadout(weaponId: string, ammoId: string): Loadout {
  return {
    weaponId,
    ammoCaliberId: ammoId,
    ammoRounds: 0,
    weaponCondition: 100,
    gearIds: [],
  };
}

/**
 * Draw the chosen warehouse items onto specific soldiers.
 * One rifle and one ammunition type replace what they carry; equipment is added.
 * Ammunition fills up to one magazine of the rifle they end up holding.
 */
export function equipSoldiers(
  state: GameState,
  soldierIds: string[],
  choice: EquipChoice,
): ActionResult<{ equipped: number }> {
  const weaponId = choice.weaponId?.trim() || "";
  const ammoId = choice.ammoId?.trim() || "";
  const gearIds = [...new Set((choice.gearIds ?? []).map((id) => id.trim()).filter(Boolean))];
  if (!weaponId && !ammoId && gearIds.length === 0) {
    return { ok: false, state, message: "Select items to equip.", data: { equipped: 0 } };
  }
  if (soldierIds.length === 0) {
    return {
      ok: false,
      state,
      message: "Choose soldiers or a formation to equip.",
      data: { equipped: 0 },
    };
  }

  const idSet = new Set(soldierIds);
  let next = state;
  const soldiers = next.company.soldiers.map((soldier) => ({
    ...soldier,
    loadout: soldier.loadout
      ? { ...soldier.loadout, gearIds: [...(soldier.loadout.gearIds ?? [])] }
      : null,
  }));
  const targets = soldiers.filter(
    (soldier) => soldier.alive && soldier.duty !== "wounded" && idSet.has(soldier.id),
  );
  if (targets.length === 0) {
    return { ok: false, state, message: "No soldiers to equip.", data: { equipped: 0 } };
  }

  const notes: string[] = [];
  let equipped = 0;
  let rifles = 0;
  let rounds = 0;
  let pieces = 0;

  for (const target of targets) {
    const idx = soldiers.findIndex((soldier) => soldier.id === target.id);
    if (idx < 0) continue;
    let soldier = soldiers[idx]!;
    let changed = false;

    if (weaponId && soldier.loadout?.weaponId !== weaponId) {
      const rifle = getRifle(weaponId);
      if (!rifle) {
        notes.push(`unknown weapon ${weaponId}`);
      } else if (!isWeaponUnlocked(next, rifle.id)) {
        notes.push(`${rifle.name} is not researched`);
      } else if (getQuantity(next.warehouse, "weapon", rifle.id) < 1) {
        notes.push(`no ${rifle.name} in warehouse`);
      } else {
        const taken = withdrawItems(next, "weapon", rifle.id, 1);
        if (!taken.ok) {
          notes.push(`no ${rifle.name} in warehouse`);
        } else {
          let working = taken.state;
          const previous = soldier.loadout?.weaponId ? getRifle(soldier.loadout.weaponId) : undefined;
          let gaveRifle = !previous;
          if (previous) {
            const stored = storeItems(working, "weapon", previous.id, 1, previous.weight, previous.volume);
            if (!stored.ok) {
              const undo = storeItems(working, "weapon", rifle.id, 1, rifle.weight, rifle.volume);
              next = undo.ok ? undo.state : working;
              notes.push(`no room to store ${previous.name}`);
            } else {
              working = stored.state;
              gaveRifle = true;
            }
          }
          if (gaveRifle) {
            const ammoCaliberId =
              soldier.loadout?.ammoCaliberId ?? getAmmo(rifle.caliberId, "fmj")?.id ?? `${rifle.caliberId}-fmj`;
            soldier = {
              ...soldier,
              loadout: soldier.loadout
                ? { ...soldier.loadout, weaponId: rifle.id, weaponCondition: 100 }
                : blankLoadout(rifle.id, ammoCaliberId),
              duty: soldier.squadId ? "ready" : "unassigned",
            };
            next = working;
            changed = true;
            rifles += 1;
          }
        }
      }
    }

    if (gearIds.length > 0 && !soldier.loadout) {
      notes.push(`${soldier.name} needs a weapon before equipment`);
    } else if (soldier.loadout) {
      let kit = soldier.loadout;
      for (const gearId of gearIds) {
        if (kit.gearIds.includes(gearId)) continue;
        const gear = getGear(gearId);
        if (!gear) {
          notes.push(`unknown equipment ${gearId}`);
          continue;
        }
        if (!isGearUnlocked(next, gear.id)) {
          notes.push(`${gear.name} is not researched`);
          continue;
        }
        if (getQuantity(next.warehouse, "gear", gear.id) < 1) {
          notes.push(`no ${gear.name} in warehouse`);
          continue;
        }
        const worn = carriedWeightKg({ ...soldier, loadout: kit }) + gear.weightKg;
        if (worn > carryCapacityKg(soldier.strength) + 0.01) {
          notes.push(`${gear.name} is too heavy for ${soldier.name}`);
          continue;
        }
        const taken = withdrawItems(next, "gear", gear.id, 1);
        if (!taken.ok) {
          notes.push(`no ${gear.name} in warehouse`);
          continue;
        }
        kit = { ...kit, gearIds: [...kit.gearIds, gear.id] };
        soldier = { ...soldier, loadout: kit };
        next = taken.state;
        changed = true;
        pieces += 1;
      }
    }

    if (ammoId) {
      const ammo = getCaliber(ammoId);
      if (!ammo) {
        notes.push(`unknown ammunition ${ammoId}`);
      } else if (!isLoadSubtypeUnlocked(next, ammo.familyId, ammo.variant)) {
        notes.push(`${ammo.name} is not researched`);
      } else if (!soldier.loadout?.weaponId) {
        notes.push(`${soldier.name} needs a weapon before ammunition`);
      } else {
        const rifle = getRifle(soldier.loadout.weaponId);
        const magazine = Math.max(1, rifle?.ammoCapacity ?? 5);
        let loadout = soldier.loadout;
        let working = next;
        let swapped = false;
        if (loadout.ammoCaliberId !== ammo.id && loadout.ammoRounds > 0) {
          if (getQuantity(working.warehouse, "ammo", ammo.id) < 1) {
            notes.push(`no ${ammo.name} in warehouse`);
          } else {
            const previous = getCaliber(loadout.ammoCaliberId);
            const stored = previous
              ? storeItems(
                  working,
                  "ammo",
                  previous.id,
                  loadout.ammoRounds,
                  previous.weightPerRound,
                  previous.volumePerRound,
                )
              : { ok: true as const, state: working };
            if (!stored.ok) {
              notes.push(`no room to store ${loadout.ammoRounds} returned rounds`);
            } else {
              working = stored.state;
              loadout = { ...loadout, ammoCaliberId: ammo.id, ammoRounds: 0 };
              swapped = true;
            }
          }
        } else if (loadout.ammoCaliberId !== ammo.id) {
          loadout = { ...loadout, ammoCaliberId: ammo.id, ammoRounds: 0 };
          swapped = true;
        }

        let add = Math.max(0, magazine - loadout.ammoRounds);
        const carrier = { ...soldier, loadout };
        const maxCarry = maxAmmoCarry(carrier);
        if (loadout.ammoRounds + add > maxCarry) {
          add = Math.max(0, maxCarry - loadout.ammoRounds);
          notes.push(`${soldier.name} carry cap ${maxCarry}`);
        }
        while (add > 0 && !canCarryAmmo(carrier, add)) add -= 1;
        const available = getQuantity(working.warehouse, "ammo", ammo.id);
        const take = Math.min(add, available);
        if (add > 0 && take <= 0) notes.push(`no ${ammo.name} in warehouse`);
        if (take > 0) {
          const taken = withdrawItems(working, "ammo", ammo.id, take);
          if (taken.ok) {
            working = taken.state;
            loadout = { ...loadout, ammoCaliberId: ammo.id, ammoRounds: loadout.ammoRounds + take };
            rounds += take;
            swapped = true;
          }
        }
        if (swapped) {
          soldier = { ...soldier, loadout, duty: soldier.squadId ? "ready" : soldier.duty };
          next = working;
          changed = true;
        }
      }
    }

    if (changed) {
      soldiers[idx] = soldier;
      equipped += 1;
    }
  }

  next = { ...next, company: { ...next.company, soldiers } };
  const parts = [
    rifles > 0 ? `${rifles} rifle${rifles === 1 ? "" : "s"}` : "",
    rounds > 0 ? `${rounds} rd` : "",
    pieces > 0 ? `${pieces} equipment` : "",
  ].filter(Boolean);
  const note = notes.length ? ` (${[...new Set(notes)].slice(0, 3).join("; ")})` : "";
  return {
    ok: equipped > 0,
    state: next,
    message:
      equipped > 0
        ? `Equipped ${equipped}: ${parts.join(", ") || "loadout updated"}.${note}`
        : `Could not equip.${note || " Nothing in the warehouse."}`,
    data: { equipped },
  };
}

/** Remove a living soldier from the roster and from any formation. */
export function dismissSoldier(state: GameState, soldierId: string): ActionResult {
  const soldier = state.company.soldiers.find((s) => s.id === soldierId && s.alive);
  if (!soldier) {
    return { ok: false, state, message: "Soldier not found." };
  }
  const soldiers = state.company.soldiers.filter((s) => s.id !== soldierId);
  const squads = state.squads.map((unit) => ({
    ...unit,
    soldierIds: unit.soldierIds.filter((id) => id !== soldierId),
    commanderSoldierId:
      unit.commanderSoldierId === soldierId ? null : unit.commanderSoldierId,
  }));
  return {
    ok: true,
    state: {
      ...state,
      company: { ...state.company, soldiers },
      squads,
    },
    message: `Dismissed ${soldier.name}.`,
  };
}

export { isArmed, carryCapacityKg, describeCarry };
