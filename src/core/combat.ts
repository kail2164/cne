import { getCaliber, getRifle } from "./catalog.js";
import { checkContractAcceptance, getContract } from "./logistics.js";
import type {
  ActionResult,
  CombatLogEntry,
  CombatResult,
  GameState,
  Soldier,
} from "./types.js";
import { storeAsMany } from "./warehouse.js";

function cloneSoldiers(soldiers: Soldier[]): Soldier[] {
  return soldiers.map((s) => ({
    ...s,
    loadout: s.loadout ? { ...s.loadout } : null,
  }));
}

function living(soldiers: Soldier[]): Soldier[] {
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
    const c = getCaliber(s.loadout.ammoCaliberId);
    if (!w || !c) return sum;
    return sum + w.basePower + c.stoppingPower;
  }, 0);
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

export function simulateCombat(
  state: GameState,
  contractId: string,
): ActionResult<CombatResult> {
  const gate = checkContractAcceptance(state, contractId);
  if (!gate.ok) {
    return {
      ok: false,
      state,
      message: gate.message,
      data: {
        won: false,
        retreated: false,
        log: [],
        ammoExpended: 0,
        casualties: 0,
        lootFunds: 0,
        lootMaterials: 0,
        summary: gate.message,
      },
    };
  }

  const contract = getContract(contractId)!;
  const soldiers = cloneSoldiers(state.company.soldiers);
  const startLiving = living(soldiers).length;
  const startAmmo = totalAmmo(soldiers);

  let oppositionHp = contract.oppositionHp;
  let dryTicks = 0;
  const log: CombatLogEntry[] = [];
  let retreated = false;
  let won = false;

  for (let tick = 1; tick <= contract.maxTicks; tick++) {
    const ammoBefore = totalAmmo(soldiers);
    const liveBefore = living(soldiers).length;
    if (liveBefore === 0) break;

    let note = "";
    let ammoExhausted = ammoBefore <= 0;
    let spent = 0;
    let friendlyCasualties = 0;

    if (!ammoExhausted) {
      const eff = avgSupplyEfficiency(soldiers);
      const want = Math.max(1, Math.ceil(liveBefore / Math.max(0.5, eff)));
      spent = consumeAmmo(soldiers, want);
      const dmg = firepower(soldiers) * 0.55;
      oppositionHp = Math.max(0, oppositionHp - dmg);
      note = `Volley — spent ${spent} rounds, hit for ${dmg.toFixed(1)}.`;
      dryTicks = 0;
    } else {
      dryTicks += 1;
      note = "Ammo exhausted — bayonets and sidearms only.";
      const desperation = firepower(soldiers) * 0.12;
      oppositionHp = Math.max(0, oppositionHp - desperation);
      const selfHits = Math.max(1, Math.ceil(liveBefore * 0.25));
      friendlyCasualties += applyCasualties(soldiers, selfHits);
      if (dryTicks >= 2) {
        retreated = true;
        note += " Forced retreat.";
      }
    }

    if (oppositionHp > 0 && living(soldiers).length > 0 && !retreated) {
      const incoming = contract.oppositionDamagePerTick;
      const deaths = Math.max(
        0,
        Math.floor(incoming / 12 + (ammoExhausted ? 1 : 0)),
      );
      friendlyCasualties += applyCasualties(soldiers, deaths);
      note += ` Enemy returns fire (${deaths} down).`;
    }

    const ammoAfter = totalAmmo(soldiers);
    log.push({
      tick,
      ammoBefore,
      ammoAfter,
      ammoExhausted,
      friendlyCasualties,
      livingAfter: living(soldiers).length,
      oppositionHpAfter: Number(oppositionHp.toFixed(1)),
      note,
    });

    if (oppositionHp <= 0) {
      won = true;
      break;
    }
    if (living(soldiers).length === 0 || retreated) {
      break;
    }
  }

  if (!won && !retreated && living(soldiers).length > 0 && oppositionHp > 0) {
    retreated = true;
    log.push({
      tick: log.length + 1,
      ammoBefore: totalAmmo(soldiers),
      ammoAfter: totalAmmo(soldiers),
      ammoExhausted: totalAmmo(soldiers) <= 0,
      friendlyCasualties: 0,
      livingAfter: living(soldiers).length,
      oppositionHpAfter: Number(oppositionHp.toFixed(1)),
      note: "Time expired — withdraw under pressure.",
    });
  }

  const casualties = startLiving - living(soldiers).length;
  const ammoExpended = startAmmo - totalAmmo(soldiers);
  const lootFunds = won ? contract.lootFunds : 0;
  const lootMaterials = won ? contract.lootMaterials : 0;

  let next: GameState = {
    ...state,
    company: { ...state.company, soldiers },
    funds: state.funds + lootFunds,
  };

  if (lootMaterials > 0) {
    const st = storeAsMany(next, "raw_materials", "raw", lootMaterials, 1, 0.8);
    next = st.state;
  }

  const summary = won
    ? `Victory at ${contract.name}. Casualties ${casualties}, ammo spent ${ammoExpended}, loot +${lootFunds} funds / +${lootMaterials} materials.`
    : retreated
      ? `Retreat from ${contract.name}. Casualties ${casualties}, ammo spent ${ammoExpended}.`
      : `Defeat at ${contract.name}. Casualties ${casualties}, ammo spent ${ammoExpended}.`;

  return {
    ok: true,
    state: next,
    message: summary,
    data: {
      won,
      retreated,
      log,
      ammoExpended,
      casualties,
      lootFunds,
      lootMaterials,
      summary,
    },
  };
}
