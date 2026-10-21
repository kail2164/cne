import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  LOCAL_CONTRACT,
  companyPower,
  companyTotalAmmo,
  companyTroopCount,
  createCampaign,
  endTurn,
  formatDate,
  getQuantity,
  issueCompanyAmmo,
  listContracts,
  listStartingCalibers,
  recruitSoldiers,
  remainingCapacity,
  selectCaliber,
  setFactoryProduct,
  simulateCombat,
  type CaliberId,
  type FactoryProduct,
  type GameState,
} from "./core/index.js";

function printHeader(title: string): void {
  console.log(`\n=== ${title} ===`);
}

function printStatus(state: GameState): void {
  const rem = remainingCapacity(state.warehouse);
  const lock = state.factory.locked ? "locked" : "open";
  const product = state.factory.product ?? "idle";
  console.log(
    `${formatDate(state)} | funds $${state.funds.toFixed(0)} | factory: ${product} (${lock}) | free wt ${rem.weight.toFixed(0)} / vol ${rem.volume.toFixed(0)}`,
  );
  console.log(
    `  materials ${getQuantity(state.warehouse, "raw_materials", "raw")} (not used by factory)`,
  );
  for (const s of state.warehouse.stocks) {
    if (s.kind === "raw_materials") continue;
    console.log(`  - ${s.kind}:${s.itemId} × ${s.quantity}`);
  }
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
  }
  return next;
}

function printCombat(state: GameState, contractId: string): GameState {
  const result = simulateCombat(state, contractId);
  console.log(`\n${result.message}`);
  if (result.data?.log.length) {
    console.log("\nCombat log (mission ticks — calendar unchanged until end turn):");
    for (const e of result.data.log) {
      console.log(
        `  T${e.tick}: ammo ${e.ammoBefore}→${e.ammoAfter} | cas ${e.friendlyCasualties} | living ${e.livingAfter} | oppHP ${e.oppositionHpAfter} | ${e.note}`,
      );
    }
    console.log(
      `\nOutcome: ${result.data.won ? "VICTORY" : result.data.retreated ? "RETREAT" : "DEFEAT"} | success ~${result.data.successChance}% | KIA ${result.data.casualties} | wounded ${result.data.wounded} | loot +$${result.data.lootFunds}`,
    );
  }
  return result.state;
}

function runDemo(): void {
  printHeader("Conflict Never Ends — Demo (monthly turns)");
  console.log("Caliber → factory product → end turns → recruit → contract → combat\n");

  let state = createCampaign("Iron Company");
  printStatus(state);

  const pick = selectCaliber(state, "792x57");
  state = pick.state;
  console.log(`\n1) ${pick.message}`);

  let set = setFactoryProduct(state, "rifles");
  state = set.state;
  console.log(`2) ${set.message}`);
  console.log("   Ending turn ×4 (rifle months)...");
  state = doEndTurns(state, 4);
  printStatus(state);

  set = setFactoryProduct(state, "ammo");
  state = set.state;
  console.log(`\n3) ${set.message}`);
  console.log("   Ending turn ×3 (ammo months)...");
  state = doEndTurns(state, 3);
  printStatus(state);

  const recruit = recruitSoldiers(state, 20);
  state = recruit.state;
  console.log(`\n4) ${recruit.message}`);

  const loadout = issueCompanyAmmo(state, 35);
  state = loadout.state;
  console.log(`5) ${loadout.message}`);
  console.log(
    `   Readiness: ${companyTroopCount(state)} troops, power ${companyPower(state).toFixed(1)}, ammo ${companyTotalAmmo(state)}`,
  );

  console.log(`\n6) Contract: ${LOCAL_CONTRACT.name}`);
  state = printCombat(state, LOCAL_CONTRACT.id);

  console.log("\n7) End turn after battle (new month)...");
  state = doEndTurns(state, 1);
  printStatus(state);

  console.log("\nDemo complete.");
}

async function interactive(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  printHeader("Conflict Never Ends — Turn-based (1 cycle = 1 month)");
  console.log("Manage, then end turn to produce & advance the calendar.\n");

  let state = createCampaign(
    (await ask(rl, "Company name [1st Provisional Company]: ", "1st Provisional Company")),
  );
  printStatus(state);

  const calibers = listStartingCalibers();
  console.log("\nStarting caliber families:");
  calibers.forEach((c, i) => {
    console.log(
      `  ${i + 1}. ${c.name} → ${c.rifle} (cost ${c.productionCost}/rd, dmg ${c.baseDamage})`,
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
    console.log(`
Actions:
  1) Set factory product (ammo | rifles) — locked until end turn
  2) End turn (resolve production, +1 month)
  3) Recruit
  4) Issue ammo loadout
  5) Take local contract (combat; does not advance month)
  6) Quit
`);
    const choice = await askNumber(rl, "Choice [2]: ", 2);
    switch (choice) {
      case 1: {
        const raw = (
          await ask(rl, "Product [ammo/rifles]: ", state.factory.product ?? "ammo")
        ).toLowerCase();
        const product = (raw.startsWith("r") ? "rifles" : "ammo") as FactoryProduct;
        const r = setFactoryProduct(state, product);
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
      case 5: {
        listContracts().forEach((c, i) => {
          const lock = c.tier === "local" ? "" : " [LOCKED]";
          console.log(`  ${i + 1}. ${c.name} (${c.tier})${lock}`);
        });
        state = printCombat(state, LOCAL_CONTRACT.id);
        break;
      }
      case 6:
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
