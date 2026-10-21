export type * from "./types.js";

export {
  CALIBERS,
  CALIBER_FAMILIES,
  RIFLES,
  START,
  LOCAL_CONTRACT,
  LOCKED_TIERS,
  WEAPON_STATS_COMBAT_LIVE,
  getCaliber,
  getCaliberFamily,
  getRifle,
  getRifleForCaliber,
  listContracts,
  effectiveDamage,
  effectivePenetration,
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

export { setFactoryProduct, resolveFactoryMonth } from "./factory.js";

export { endTurn, formatDate } from "./turn.js";

export {
  companyTroopCount,
  companyTotalAmmo,
  companyPower,
  soldierWeaponFactor,
  livingPop,
  countByDuty,
  recruitSoldiers,
  issueCompanyAmmo,
} from "./barracks.js";

export {
  getContract,
  assessReadiness,
  checkContractAcceptance,
  estimateSuccessChance,
} from "./logistics.js";

export { startContract, progressCombatMonth } from "./combat.js";

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

export {
  doctrineConsumption,
  createSquad,
  combineSquads,
  assignSoldiersToSquad,
  ensureDefaultSquadFilled,
  terrainExperienceBonus,
} from "./composition.js";

export { FOODS, getFood, isFoodUnlocked } from "./food.js";
