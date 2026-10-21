import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  LOCAL_CONTRACT,
  companyPower,
  companyTotalAmmo,
  companyTroopCount,
  createCampaign,
  getQuantity,
  issueCompanyAmmo,
  listContracts,
  listStartingCalibers,
  recruitSoldiers,
  remainingCapacity,
  runFactoryTick,
  selectCaliber,
  setFactoryAllocation,
  simulateCombat,
  type CaliberId,
  type GameState,
} from "./core/index.js";

function printHeader(title: string): void {
  console.log(`\n=== ${title} ===`);
}

function printWarehouse(state: GameState): void {
  const rem = remainingCapacity(state.warehouse);
  console.log(
    `Warehouse "${state.warehouse.name}": funds $${state.funds.toFixed(0)} | materials ${getQuantity(state.warehouse, "raw_materials", "raw")} | free wt ${rem.weight.toFixed(0)} / vol ${rem.volume.toFixed(0)}`,
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

function runProduction(state: GameState, ticks: number): GameState {
  let next = state;
  for (let i = 0; i < ticks; i++) {
    const tick = runFactoryTick(next);
    next = tick.state;
    console.log(`  tick ${i + 1}: ${tick.message}`);
    if (tick.data?.warehouseNotes?.length) {
      for (const n of tick.data.warehouseNotes) console.log(`    ! ${n}`);
    }
  }
  return next;
}

function printCombat(state: GameState, contractId: string): GameState {
  const result = simulateCombat(state, contractId);
  console.log(`\n${result.message}`);
  if (result.data?.log.length) {
    console.log("\nCombat log:");
    for (const e of result.data.log) {
      console.log(
        `  T${e.tick}: ammo ${e.ammoBefore}→${e.ammoAfter} | cas ${e.friendlyCasualties} | living ${e.livingAfter} | oppHP ${e.oppositionHpAfter} | ${e.note}`,
      );
    }
    console.log(
      `\nOutcome: ${result.data.won ? "VICTORY" : result.data.retreated ? "RETREAT" : "DEFEAT"} | casualties ${result.data.casualties} | ammo expended ${result.data.ammoExpended} | loot +$${result.data.lootFunds} / +${result.data.lootMaterials} mat`,
    );
  }
  return result.state;
}

function runDemo(): void {
  printHeader("Conflict Never Ends — Phase 1 Demo (1910)");
  console.log("Scripted loop: caliber → factory → recruit/loadout → local contract → combat\n");

  let state = createCampaign("Iron Company");
  console.log("Start: Small Warehouse, Basic Barracks, Workshop/Factory.");
  printWarehouse(state);

  const pick = selectCaliber(state, "792x57");
  state = pick.state;
  console.log(`\n1) ${pick.message}`);

  const alloc = setFactoryAllocation(state, { ammo: 0.55, rifles: 0.45 });
  state = alloc.state;
  console.log(`2) ${alloc.message}`);
  console.log("   Running 10 production ticks...");
  state = runProduction(state, 10);
  printWarehouse(state);

  const recruit = recruitSoldiers(state, 20);
  state = recruit.state;
  console.log(`\n3) ${recruit.message}`);

  const loadout = issueCompanyAmmo(state, 35);
  state = loadout.state;
  console.log(`4) ${loadout.message}`);
  console.log(
    `   Readiness: ${companyTroopCount(state)} troops, power ${companyPower(state).toFixed(1)}, ammo ${companyTotalAmmo(state)}`,
  );

  console.log(`\n5) Accepting local contract: ${LOCAL_CONTRACT.name}`);
  state = printCombat(state, LOCAL_CONTRACT.id);

  console.log("\nConflict Never Ends — Phase 1 demo complete.");
}

async function interactive(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  printHeader("Conflict Never Ends — Phase 1 (1910)");
  console.log("Logistical army-building: caliber, factory, warehouse, loadout, local contract.\n");

  let state = createCampaign(
    (await ask(rl, "Company name [1st Provisional Company]: ", "1st Provisional Company")),
  );
  printWarehouse(state);

  const calibers = listStartingCalibers();
  console.log("\nStarting caliber families:");
  calibers.forEach((c, i) => {
    console.log(
      `  ${i + 1}. ${c.name} → ${c.rifle} (cost ${c.productionCost}/rd, power ${c.stoppingPower}, supply ${c.supplyEfficiency})`,
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

  const ammoPct = await askNumber(rl, "Factory ammo % [70]: ", 70);
  const alloc = setFactoryAllocation(state, {
    ammo: Math.min(100, Math.max(0, ammoPct)) / 100,
    rifles: 1 - Math.min(100, Math.max(0, ammoPct)) / 100,
  });
  state = alloc.state;
  console.log(alloc.message);

  const ticks = await askNumber(rl, "Production ticks [8]: ", 8);
  state = runProduction(state, Math.max(1, ticks));
  printWarehouse(state);

  const want = await askNumber(rl, "Recruit soldiers [20]: ", 20);
  const rec = recruitSoldiers(state, Math.max(0, want));
  state = rec.state;
  console.log(rec.message);

  const per = await askNumber(
    rl,
    `Ammo per soldier [${LOCAL_CONTRACT.recommendedAmmoPerSoldier}]: `,
    LOCAL_CONTRACT.recommendedAmmoPerSoldier,
  );
  const iss = issueCompanyAmmo(state, Math.max(0, per));
  state = iss.state;
  console.log(iss.message);
  console.log(
    `Readiness: ${companyTroopCount(state)} troops, power ${companyPower(state).toFixed(1)}, ammo ${companyTotalAmmo(state)}`,
  );

  console.log("\nContracts:");
  listContracts().forEach((c, i) => {
    const lock = c.tier === "local" ? "" : " [LOCKED]";
    console.log(`  ${i + 1}. ${c.name} (${c.tier})${lock} — ${c.blurb}`);
  });
  console.log(`Accepting: ${LOCAL_CONTRACT.name}`);
  state = printCombat(state, LOCAL_CONTRACT.id);

  console.log("\nDone. Rebuild, retool, choose the next conflict — Conflict Never Ends.");
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
