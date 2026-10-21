import { listContracts } from "./catalog.js";
import { companyPower, companyTotalAmmo, companyTroopCount } from "./barracks.js";
import { terrainExperienceBonus } from "./composition.js";
import type { ActionResult, Contract, GameState, ReadinessReport } from "./types.js";

export function getContract(id: string): Contract | undefined {
  return listContracts().find((c) => c.id === id);
}

export function assessReadiness(state: GameState, contract: Contract): ReadinessReport {
  const troopCount = companyTroopCount(state);
  const power = companyPower(state);
  const totalAmmo = companyTotalAmmo(state);
  const failures: string[] = [];

  if (contract.tier !== "local") {
    failures.push(`Contract tier "${contract.tier}" is locked in Phase 1`);
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

/**
 * Success chance 0–100: base + squad bonus − over-assign waste + terrain XP.
 * More squads help up to a point; excess burns resources for little gain (soft penalty).
 */
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
