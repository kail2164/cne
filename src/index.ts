import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  CONFLICTS,
  armyStrength,
  createArmy,
  resolveFight,
  totalTroops,
} from "./game.js";

async function askNumber(rl: readline.Interface, prompt: string, fallback = 0): Promise<number> {
  const raw = (await rl.question(prompt)).trim();
  if (raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

function printResult(
  armyName: string,
  units: { infantry: number; archers: number; cavalry: number },
  conflictIndex: number,
): void {
  const army = createArmy(armyName, units);
  const conflict = CONFLICTS[conflictIndex]!;

  console.log(
    `\n${army.name} fielded: ${army.units.infantry} infantry, ${army.units.archers} archers, ${army.units.cavalry} cavalry`,
  );
  console.log(`Estimated strength: ${armyStrength(army)}`);
  console.log(`\nMarching to: ${conflict.name}...\n`);

  const result = resolveFight(army, conflict);
  console.log(result.won ? "VICTORY" : "DEFEAT");
  console.log(result.summary);
  console.log(
    result.won
      ? "One conflict ends. Others still burn — Conflict Never Ends."
      : "Fall back, rebuild, choose another conflict. Conflict Never Ends.",
  );
}

async function interactive(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  console.log("=== Conflict Never Ends ===");
  console.log("Build an army. Pick a conflict. See who holds the field.\n");

  const name = (await rl.question("Name your army: ")).trim() || "Nameless Host";

  console.log("\nRecruit units (enter counts; blank = 0):");
  const infantry = await askNumber(rl, "  Infantry: ");
  const archers = await askNumber(rl, "  Archers:  ");
  const cavalry = await askNumber(rl, "  Cavalry:  ");

  const army = createArmy(name, { infantry, archers, cavalry });

  if (totalTroops(army) === 0) {
    console.log("\nYou fielded no troops. Conflict waits — come back with an army.");
    rl.close();
    return;
  }

  console.log(
    `\n${army.name} fielded: ${army.units.infantry} infantry, ${army.units.archers} archers, ${army.units.cavalry} cavalry`,
  );
  console.log(`Estimated strength: ${armyStrength(army)}\n`);

  console.log("Available conflicts:");
  CONFLICTS.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.name} — ${c.blurb} (opp. strength ~${c.oppositionStrength})`);
  });

  const choice = await askNumber(rl, "\nChoose a conflict (number): ", 1);
  const index = Math.min(Math.max(choice, 1), CONFLICTS.length) - 1;

  printResult(name, { infantry, archers, cavalry }, index);
  rl.close();
}

function demo(): void {
  console.log("=== Conflict Never Ends (demo) ===");
  console.log("Non-interactive stub: Iron Legion → River Crossing\n");
  console.log("Available conflicts:");
  CONFLICTS.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.name} — opp. strength ~${c.oppositionStrength}`);
  });
  printResult("Iron Legion", { infantry: 10, archers: 5, cavalry: 2 }, 1);
}

async function main(): Promise<void> {
  if (process.argv.includes("--demo")) {
    demo();
    return;
  }
  await interactive();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
