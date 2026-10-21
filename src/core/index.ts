export type * from "./types.js";

export {
  CALIBERS,
  RIFLES,
  START,
  LOCAL_CONTRACT,
  LOCKED_TIERS,
  getCaliber,
  getRifle,
  getRifleForCaliber,
  listContracts,
} from "./catalog.js";

export { createCampaign, listStartingCalibers, selectCaliber } from "./campaign.js";

export {
  stockWeight,
  stockVolume,
  remainingCapacity,
  getQuantity,
  canStore,
  storeItems,
  storeAsMany,
  withdrawItems,
} from "./warehouse.js";

export { setFactoryAllocation, runFactoryTick } from "./factory.js";

export {
  companyTroopCount,
  companyTotalAmmo,
  companyPower,
  recruitSoldiers,
  issueCompanyAmmo,
} from "./barracks.js";

export {
  getContract,
  assessReadiness,
  checkContractAcceptance,
} from "./logistics.js";

export { simulateCombat } from "./combat.js";
