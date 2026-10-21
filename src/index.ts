import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  COMPLETIONS_PER_TIER,
  FACTORY_TIERS,
  FOODS,
  LOAD_SUBTYPE_LABEL,
  LOAD_SUBTYPES,
  LOCAL_CONTRACT,
  armSoldiers,
  buyFactory,
  companyPower,
  companyReserveCount,
  companyTotalAmmo,
  companyTroopCount,
  createCampaign,
  describeBoard,
  describeFactories,
  describeOrg,
  endTurn,
  formFireTeam,
  formSquadFromTeams,
  formatDate,
  getContract,
  getFood,
  getQuantity,
  getSelectedAmmo,
  getTierProgress,
  issueCompanyAmmo,
  listBoardContracts,
  listSoldiers,
  listStartingCalibers,
  livingPop,
  nextTierPrice,
  parseLoadSubtype,
  recruitSoldiers,
  remainingCapacity,
  selectCaliber,
  setFactoryProduct,
  setFactorySlotProduct,
  setLoadSubtype,
  setMealPlan,
  startContract,
  upgradeCost,
  upgradeFactory,
  type CaliberId,
  type FactoryProductKind,
  type FactoryTierId,
  type GameState,
} from "./core/index.js";

function printHeader(title: string): void {
  console.log(`\n=== ${title} ===`);
}

function printStatus(state: GameState): void {
  const rem = remainingCapacity(state.warehouse);
  const fac0 = state.factories[0];
  const slot0 = fac0?.slots[0];
  const facNote = fac0
    ? `${fac0.tierId} s${fac0.stage} ${slot0?.product ?? "idle"}${slot0?.locked ? "*" : ""}${state.factories.length > 1 ? ` (+${state.factories.length - 1})` : ""}`
    : "none";
  const tier = getTierProgress(state);
  const load = getSelectedAmmo(state);
  const loadNote = state.selectedCaliberId
    ? ` | load ${LOAD_SUBTYPE_LABEL[state.selectedLoadSubtype]}${load ? ` $${load.productionCost}/rd` : ""}`
    : "";
  console.log(
    `${formatDate(state)} | funds $${state.funds.toFixed(0)} | plant: ${facNote} | free wt ${rem.weight.toFixed(0)} / vol ${rem.volume.toFixed(0)}${loadNote}`,
  );
  const meal = getFood(state.mealPlanId);
  console.log(
    `  Tier: ${tier.currentLabel} | next unlock ${tier.completionsTowardNext}/${tier.completionsRequired}${tier.nextLabel ? ` → ${tier.nextLabel}` : " (max)"} | wins ${tier.jobsCompletedTotal}`,
  );
  console.log(
    `  Roster: ${livingPop(state)}/${state.barracksPopSlots} pop | armed ${companyTroopCount(state)} | reserve ${companyReserveCount(state)} | meal ${meal?.name ?? state.mealPlanId}`,
  );
  if (state.activeMission) {
    const c = getContract(state.activeMission.contractId);
    console.log(
      `  MISSION: ${c?.name ?? state.activeMission.contractId} — ${state.activeMission.turnsRemaining}/${state.activeMission.turnsNeeded} turns left | oppHP ${state.activeMission.oppositionHp.toFixed(0)}`,
    );
  }
  console.log(
    `  materials ${getQuantity(state.warehouse, "raw_materials", "raw")} (not used by factory)`,
  );
  for (const s of state.warehouse.stocks) {
    if (s.kind === "raw_materials") continue;
    console.log(`  - ${s.kind}:${s.itemId} × ${s.quantity}`);
  }
}

function printBoard(state: GameState): void {
  console.log(`\nContract board (${state.contractBoard.length}/10):`);
  const lines = describeBoard(state);
  if (lines.length === 0) console.log("  (empty)");
  else lines.forEach((l) => console.log(`  ${l}`));
  const tier = getTierProgress(state);
  console.log(
    `  Progress to next tier: ${tier.completionsTowardNext}/${COMPLETIONS_PER_TIER}` +
      (tier.nextLabel ? ` (${tier.nextLabel})` : " — Global max"),
  );
}

async function ask(rl: readline.Interface, prompt: string, fallback = ""): Promise<string> {
  const raw = (await rl.question(prompt)).trim();
  return raw === "" ? fallback : raw;
}

async function askNumber(
  rl: readline.Interface,
  prompt: string,
  fallback: number,
): Promise<number> {
  const raw = (await rl.question(prompt)).trim();
  if (raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function doEndTurns(state: GameState, count: number): GameState {
  let next = state;
  for (let i = 0; i < count; i++) {
    const ended = endTurn(next);
    next = ended.state;
    console.log(`  ${ended.message}`);
    const notes = ended.data?.production.warehouseNotes ?? [];
    for (const n of notes) console.log(`    ! ${n}`);
    if (ended.data?.missionResolved) {
      const r = ended.data.missionResolved;
      console.log(`\n  Mission resolved: ${r.summary}`);
      if (r.log.length) {
        console.log("  Combat months:");
        for (const e of r.log) {
          const pwr =
            e.friendlyPower != null
              ? ` pwr ${e.friendlyPower}/${e.enemyPower}`
              : "";
          const first = e.firstStriker ? ` 1st=${e.firstStriker}` : "";
          const dmg =
            e.friendlyDamage != null
              ? ` dmg ${e.friendlyDamage}/${e.enemyDamage}`
              : "";
          console.log(
            `    M${e.month}: ammo ${e.ammoBefore}→${e.ammoAfter} | cas ${e.friendlyCasualties} | living ${e.livingAfter} | oppHP ${e.oppositionHpAfter}${pwr}${first}${dmg}`,
          );
          console.log(`      ${e.note}`);
        }
      }
    }
  }
  return next;
}

function runDemo(): void {
  printHeader("Conflict Never Ends — Demo (monthly combat)");
  console.log("Factory months → recruit → accept contract → end turns until fight resolves\n");

  let state = createCampaign("Iron Company");
  printStatus(state);

  const pick = selectCaliber(state, "792x57");
  state = pick.state;
  console.log(`\n1) ${pick.message}`);

  let set = setFactoryProduct(state, "weapons");
  state = set.state;
  console.log(`2) ${set.message}`);
  console.log("   Ending turn ×4 (weapon months — blacksmith 5 guns/cycle)...");
  state = doEndTurns(state, 4);
  printStatus(state);

  set = setFactoryProduct(state, "ammo");
  state = set.state;
  console.log(`\n3) ${set.message}`);
  console.log("   Ending turn ×3 (ammo months — 250 rd/cycle)...");
  state = doEndTurns(state, 3);
  printStatus(state);

  const recruit = recruitSoldiers(state, 20);
  state = recruit.state;
  console.log(`\n4) ${recruit.message}`);

  const armed = armSoldiers(state);
  state = armed.state;
  console.log(`5) ${armed.message}`);

  const loadout = issueCompanyAmmo(state, 35);
  state = loadout.state;
  console.log(`6) ${loadout.message}`);
  console.log(
    `   Readiness: ${companyTroopCount(state)} armed, ${companyReserveCount(state)} reserve, power ${companyPower(state).toFixed(1)}, ammo ${companyTotalAmmo(state)}`,
  );

  printBoard(state);
  const accept = startContract(state, LOCAL_CONTRACT.id);
  state = accept.state;
  console.log(`\n7) ${accept.message}`);
  printStatus(state);

  console.log("\n8) Ending turns until mission resolves...");
  let guard = 0;
  while (state.activeMission && guard < 10) {
    state = doEndTurns(state, 1);
    guard += 1;
  }
  printStatus(state);

  console.log("\nDemo complete.");
}

async function interactive(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  printHeader("Conflict Never Ends — Monthly turns + combat");
  console.log("Accept a contract, then End turn to fight one month at a time.\n");

  let state = createCampaign(
    (await ask(rl, "Company name [1st Provisional Company]: ", "1st Provisional Company")),
  );
  printStatus(state);

  const calibers = listStartingCalibers();
  console.log("\nStarting caliber families (FMJ baseline; HP 1.2× / AP 2× cost):");
  calibers.forEach((c, i) => {
    console.log(
      `  ${i + 1}. ${c.name} → ${c.rifle} (FMJ $${c.productionCost}/rd, dmg ${c.baseDamage}, pen ${c.basePenetration})`,
    );
  });
  const calChoice = await askNumber(rl, "Choose caliber [5=Mauser]: ", 5);
  const cal = calibers[Math.min(Math.max(calChoice, 1), calibers.length) - 1]!;
  const sel = selectCaliber(state, cal.id as CaliberId);
  state = sel.state;
  console.log(sel.message);
  if (!sel.ok) {
    rl.close();
    return;
  }

  let playing = true;
  while (playing) {
    printStatus(state);
    printBoard(state);
    console.log(`
Actions:
  1) Set factory slot product (ammo|weapons|gears|grenades)
  2) End turn (+1 month; factory + mission + upkeep)
  3) Recruit (money + pop → reserve)
  4) Arm reserves (rifle + magazine)
  5) Issue ammo loadout
  6) Accept job from board (by number)
  7) Set load subtype (FMJ / hollow / AP)
  8) List roster
  9) Set meal plan
  10) Form fire team (roster #s, 3–5)
  11) Form squad (fire team ids + CDR roster #)
  12) List org
  13) List factories
  14) Buy factory (tier)
  15) Upgrade factory
  16) Quit
`);
    const choice = await askNumber(rl, "Choice [2]: ", 2);
    switch (choice) {
      case 1: {
        describeFactories(state).forEach((l) => console.log(`  ${l}`));
        const facIdx = await askNumber(rl, "Factory # [1]: ", 1);
        const fac =
          state.factories[Math.min(Math.max(facIdx, 1), state.factories.length) - 1];
        if (!fac) {
          console.log("No factory.");
          break;
        }
        const slotN = await askNumber(rl, `Slot # [1]: `, 1);
        const raw = (
          await ask(rl, "Product [ammo/weapons/gears/grenades]: ", "ammo")
        ).toLowerCase();
        let product: FactoryProductKind = "ammo";
        if (raw.startsWith("w") || raw.startsWith("r")) product = "weapons";
        else if (raw.startsWith("ge")) product = "gears";
        else if (raw.startsWith("gr")) product = "grenades";
        else if (raw.startsWith("v")) product = "vehicles";
        const r = setFactorySlotProduct(state, fac.id, Math.max(0, slotN - 1), product);
        state = r.state;
        console.log(r.message);
        break;
      }
      case 2: {
        const n = await askNumber(rl, "How many turns to end [1]: ", 1);
        state = doEndTurns(state, Math.max(1, n));
        break;
      }
      case 3: {
        const want = await askNumber(rl, "Recruit count [10]: ", 10);
        const r = recruitSoldiers(state, Math.max(0, want));
        state = r.state;
        console.log(r.message);
        break;
      }
      case 4: {
        const r = armSoldiers(state);
        state = r.state;
        console.log(r.message);
        break;
      }
      case 5: {
        const per = await askNumber(
          rl,
          `Ammo per soldier [${LOCAL_CONTRACT.recommendedAmmoPerSoldier}]: `,
          LOCAL_CONTRACT.recommendedAmmoPerSoldier,
        );
        const r = issueCompanyAmmo(state, Math.max(0, per));
        state = r.state;
        console.log(r.message);
        break;
      }
      case 6: {
        const board = listBoardContracts(state);
        if (board.length === 0) {
          console.log("Board empty.");
          break;
        }
        const idx = await askNumber(rl, `Board job # [1]: `, 1);
        const job = board[Math.min(Math.max(idx, 1), board.length) - 1]!;
        const r = startContract(state, job.id);
        state = r.state;
        console.log(r.message);
        break;
      }
      case 7: {
        console.log(
          "  Loads: " +
            LOAD_SUBTYPES.map(
              (s, i) => `${i + 1}=${LOAD_SUBTYPE_LABEL[s]}`,
            ).join(" / "),
        );
        const raw = await ask(rl, "Subtype [fmj]: ", "fmj");
        const parsed = parseLoadSubtype(raw);
        if (!parsed) {
          console.log("Unknown subtype. Use fmj / hollow / ap (or 1/2/3).");
          break;
        }
        const r = setLoadSubtype(state, parsed);
        state = r.state;
        console.log(r.message);
        break;
      }
      case 8: {
        const lines = listSoldiers(state);
        if (lines.length === 0) console.log("  (empty roster)");
        else lines.forEach((l) => console.log(`  ${l}`));
        break;
      }
      case 9: {
        FOODS.filter((f) => !f.recipeId || state.researchUnlocked.includes(f.recipeId)).forEach(
          (f, i) =>
            console.log(
              `  ${i + 1}. ${f.id} — ${f.name} ($${f.productionCost}, hap ${f.happiness})`,
            ),
        );
        const raw = await ask(rl, "Meal id [army-stew]: ", "army-stew");
        const r = setMealPlan(state, raw);
        state = r.state;
        console.log(r.message);
        break;
      }
      case 10: {
        const lines = listSoldiers(state);
        lines.forEach((l) => console.log(`  ${l}`));
        const raw = await ask(rl, "Roster #s (comma, 3–5) e.g. 1,2,3,4: ", "");
        const living = state.company.soldiers.filter((s) => s.alive);
        const ids = raw
          .split(/[,\s]+/)
          .map((x) => Number(x.trim()))
          .filter((n) => n >= 1 && n <= living.length)
          .map((n) => living[n - 1]!.id);
        const r = formFireTeam(state, ids);
        state = r.state;
        console.log(r.message);
        break;
      }
      case 11: {
        describeOrg(state).forEach((l) => console.log(`  ${l}`));
        listSoldiers(state).forEach((l) => console.log(`  ${l}`));
        const teamsRaw = await ask(rl, "Fire team ids (comma, 2–3): ", "");
        const teamIds = teamsRaw.split(/[,\s]+/).map((x) => x.trim()).filter(Boolean);
        const cdrNum = await askNumber(rl, "Commander roster #: ", 1);
        const living = state.company.soldiers.filter((s) => s.alive);
        const cdr = living[Math.min(Math.max(cdrNum, 1), living.length) - 1];
        if (!cdr) {
          console.log("Bad commander #.");
          break;
        }
        const r = formSquadFromTeams(state, teamIds, cdr.id);
        state = r.state;
        console.log(r.message);
        break;
      }
      case 12: {
        const lines = describeOrg(state);
        if (lines.length === 0) console.log("  (no formations)");
        else lines.forEach((l) => console.log(`  ${l}`));
        break;
      }
      case 13: {
        const lines = describeFactories(state);
        if (lines.length === 0) console.log("  (no factories)");
        else lines.forEach((l) => console.log(`  ${l}`));
        FACTORY_TIERS.forEach((t) => {
          console.log(
            `  buy ${t.id}: $${nextTierPrice(state, t.id)} (base ammo ${t.baseAmmo} / guns ${t.baseWeapons})`,
          );
        });
        break;
      }
      case 14: {
        FACTORY_TIERS.forEach((t, i) =>
          console.log(`  ${i + 1}. ${t.id} — ${t.name} $${nextTierPrice(state, t.id)}`),
        );
        const n = await askNumber(rl, "Tier # [1=blacksmith]: ", 1);
        const tier = FACTORY_TIERS[Math.min(Math.max(n, 1), FACTORY_TIERS.length) - 1]!;
        const r = buyFactory(state, tier.id as FactoryTierId);
        state = r.state;
        console.log(r.message);
        break;
      }
      case 15: {
        describeFactories(state).forEach((l) => console.log(`  ${l}`));
        const n = await askNumber(rl, "Factory # to upgrade [1]: ", 1);
        const fac =
          state.factories[Math.min(Math.max(n, 1), state.factories.length) - 1];
        if (!fac) {
          console.log("No factory.");
          break;
        }
        const cost = upgradeCost(fac);
        console.log(
          cost == null
            ? "  Already max stage."
            : `  Upgrade cost $${cost} → stage ${fac.stage + 1}`,
        );
        const r = upgradeFactory(state, fac.id);
        state = r.state;
        console.log(r.message);
        break;
      }
      case 16:
        playing = false;
        break;
      default:
        console.log("Unknown choice.");
    }
  }

  console.log("\nDone. Conflict Never Ends.");
  rl.close();
}

async function main(): Promise<void> {
  if (process.argv.includes("--demo")) {
    runDemo();
    return;
  }
  await interactive();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
