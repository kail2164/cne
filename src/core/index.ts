export type * from "./types.js";

export {
  CALIBERS,
  RIFLES,
  START,
  LOCAL_CONTRACT,
  LOCKED_TIERS,
  WEAPON_STATS_COMBAT_LIVE,
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
  soldierWeaponFactor,
  recruitSoldiers,
  issueCompanyAmmo,
} from "./barracks.js";

export {
  getContract,
  assessReadiness,
  checkContractAcceptance,
} from "./logistics.js";

export { simulateCombat } from "./combat.js";

export {
  EXHAUSTION_FACTOR,
  WEIGHT_MIN_KG,
  WEIGHT_MAX_KG,
  MAX_PERK_SLOTS,
  STAMINA_DRAIN_PER_TICK,
  PERKS,
  GEARS,
  clampWeightKg,
  agilityCapForWeight,
  strengthCapForWeight,
  clampAgility,
  clampStrength,
  isExhausted,
  exhaustionMultiplier,
  maxAmmoForStrength,
  sumPerkPercent,
  assignPerk,
  emptyLoadout,
  createRecruitSoldier,
  soldierCombatFactor,
} from "./soldier.js";
