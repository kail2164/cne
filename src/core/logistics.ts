import {
  getContract,
  isTierUnlocked,
  listBoardContracts,
  tierLabel,
} from "./board.js";
import { companyPower, companyTotalAmmo, companyTroopCount } from "./barracks.js";
import { terrainExperienceBonus } from "./composition.js";
import type { ActionResult, Contract, GameState, ReadinessReport } from "./types.js";

export { getContract } from "./board.js";

export function assessReadiness(state: GameState, contract: Contract): ReadinessReport {
  const troopCount = companyTroopCount(state);
  const power = companyPower(state);
  const totalAmmo = companyTotalAmmo(state);
  const failures: string[] = [];

  if (!isTierUnlocked(state, contract.tier)) {
    failures.push(
      `Tier "${tierLabel(contract.tier)}" locked (unlocked: ${tierLabel(state.currentTier)})`,
    );
  }
  if (!state.contractBoard.includes(contract.id)) {
    failures.push("Job is not on the current contract board");
  }
  if (troopCount < contract.manpowerRequired) {
    failures.push(
      `Need ${contract.manpowerRequired} manpower (have ${troopCount})`,
    );
  }
  if (power < contract.minPower) {
    failures.push(`Need power ≥ ${contract.minPower} (have ${power.toFixed(1)})`);
  }
  if (totalAmmo <= 0) {
    failures.push("Company carries no ammo");
  }

  return {
    troopCount,
    power,
    totalAmmo,
    ready: failures.length === 0,
    failures,
  };
}

export function checkContractAcceptance(
  state: GameState,
  contractId: string,
): ActionResult<ReadinessReport> {
  const contract = getContract(contractId);
  if (!contract) {
    return {
      ok: false,
      state,
      message: `Unknown contract: ${contractId}`,
      data: { troopCount: 0, power: 0, totalAmmo: 0, ready: false, failures: ["unknown"] },
    };
  }
  const report = assessReadiness(state, contract);
  return {
    ok: report.ready,
    state,
    message: report.ready
      ? `Ready for ${contract.name}.`
      : `Not ready: ${report.failures.join("; ")}`,
    data: report,
  };
}

export function estimateSuccessChance(state: GameState, contract: Contract): number {
  const assignedSquads = Math.max(
    1,
    state.squads.filter((s) => s.soldierIds.length > 0).length,
  );
  const manpower = companyTroopCount(state);
  const ratio = manpower / Math.max(1, contract.manpowerRequired);

  let chance = contract.baseSuccessChance;
  chance += Math.min(12, (assignedSquads - 1) * 4);
  if (assignedSquads > 3) {
    chance -= (assignedSquads - 3) * 3;
  }
  chance += Math.min(10, Math.max(-15, (ratio - 1) * 20));

  for (const squad of state.squads) {
    if (squad.soldierIds.length === 0) continue;
    chance += terrainExperienceBonus(squad, contract.terrain) * 0.25;
  }

  return Math.round(Math.min(100, Math.max(5, chance)));
}

export function describeBoard(state: GameState): string[] {
  return listBoardContracts(state).map((c, i) => {
    const gate = `men ${c.manpowerRequired} / pwr ${c.minPower}`;
    return `${i + 1}. [${c.tier}] ${c.name} — ${c.turnsNeeded} mo, $${c.cashReward}, ${gate}`;
  });
}
