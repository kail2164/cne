import { listContracts } from "./catalog.js";
import { companyPower, companyTotalAmmo, companyTroopCount } from "./barracks.js";
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
  if (troopCount < contract.minTroops) {
    failures.push(`Need ${contract.minTroops} troops (have ${troopCount})`);
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
