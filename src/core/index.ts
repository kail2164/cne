export type * from "./types.js";

export {
  CALIBERS,
  CALIBER_FAMILIES,
  RIFLES,
  START,
  WEAPON_STATS_COMBAT_LIVE,
  LOAD_SUBTYPES,
  LOAD_SUBTYPE_LABEL,
  LOAD_SUBTYPE_MULT,
  ammoId,
  getCaliber,
  getCaliberFamily,
  getAmmo,
  getSelectedAmmo,
  getRifle,
  getRifleForCaliber,
  effectiveDamage,
  effectivePenetration,
} from "./catalog.js";

export {
  BOARD_SIZE,
  COMPLETIONS_PER_TIER,
  TIER_ORDER,
  CONTRACT_POOL,
  LOCAL_CONTRACT,
  tierIndex,
  tierLabel,
  isTierUnlocked,
  nextTier,
  getContract,
  listContracts,
  listBoardContracts,
  fillContractBoard,
  removeFromBoard,
  getTierProgress,
  applyJobResolution,
} from "./board.js";

export {
  createCampaign,
  listStartingCalibers,
  selectCaliber,
  setLoadSubtype,
  parseLoadSubtype,
} from "./campaign.js";

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

export {
  FACTORY_TIERS,
  GRENADES,
  MAX_FACTORY_STAGE,
  getFactoryTier,
  getGrenade,
  stageOutputMult,
  slotCountForStage,
  normalizeProduct,
  createOwnedFactory,
  startingBlacksmith,
  nextTierPrice,
  upgradeCost,
  describeFactories,
  buyFactory,
  upgradeFactory,
  setFactorySlotProduct,
  setFactoryProduct,
  unlockAllFactorySlots,
  resolveFactoryMonth,
} from "./factory.js";

export { endTurn, formatDate } from "./turn.js";

export {
  companyTroopCount,
  companyReserveCount,
  companyTotalAmmo,
  companyPower,
  soldierWeaponFactor,
  livingPop,
  countByDuty,
  listSoldiers,
  recruitSoldiers,
  armSoldiers,
  issueCompanyAmmo,
  isArmed,
  carryCapacityKg,
  describeCarry,
} from "./barracks.js";

export {
  assessReadiness,
  checkContractAcceptance,
  estimateSuccessChance,
  describeBoard,
} from "./logistics.js";

export { startContract, progressCombatMonth } from "./combat.js";

export {
  computeFriendlyProfile,
  computeEnemyProfile,
  companyForcePower,
  planInitiative,
  resolveVolley,
  hitChanceAtRange,
  hasRangeAdvantage,
  hasArmorAdvantage,
  escortZoneFor,
  describeMatchup,
  casualtiesFromDamage,
  moaToWeaponAccuracy,
  combinedAccuracy,
  reliabilityAfterWear,
  weaponTempoFactor,
} from "./power.js";
export type {
  ForceProfile,
  VolleyResult,
  InitiativePlan,
  EscortZone,
  EncounterKind,
} from "./power.js";

export {
  EXHAUSTION_FACTOR,
  WEIGHT_MIN_KG,
  WEIGHT_MAX_KG,
  MAX_PERK_SLOTS,
  STAMINA_DRAIN_PER_TICK,
  PERKS,
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
  weaponConditionOf,
  createRecruitSoldier,
  soldierCombatFactor,
} from "./soldier.js";

export {
  GEARS,
  getGear,
  carriedWeightKg,
  maxAmmoCarry,
  canCarryAmmo,
} from "./gear.js";

export {
  doctrineConsumption,
  createSquad,
  combineSquads,
  assignSoldiersToSquad,
  ensureDefaultSquadFilled,
  terrainExperienceBonus,
} from "./composition.js";

export {
  ECHELON_LABEL,
  ECHELON_CHILD_RANGE,
  FIRE_TEAM_SIZE,
  createOrgUnit,
  formFireTeam,
  formSquadFromTeams,
  formHigherEchelon,
  listFormations,
  describeOrg,
} from "./org.js";

export {
  MEALS_PER_MONTH,
  LOYALTY_DESERT_THRESHOLD,
  setMealPlan,
  resolveMonthlyUpkeep,
  applyMissionMorale,
} from "./upkeep.js";

export { FOODS, getFood, isFoodUnlocked } from "./food.js";
