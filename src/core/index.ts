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
  NATION_LABEL,
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
  STAGE_SCALE,
  TIER_INPUT_SCALE,
  TIER_OUTPUT_SCALE,
  getFactoryTier,
  getGrenade,
  stageOutputMult,
  describeTierEconomy,
  listManufacturable,
  quoteManufacture,
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
  RECRUIT_COST_STEP,
  RECRUIT_COST_MULT,
  companyTroopCount,
  companyReserveCount,
  companyTotalAmmo,
  companyPower,
  soldierWeaponFactor,
  livingPop,
  countByDuty,
  listSoldiers,
  recruitUnitCostAt,
  currentRecruitUnitCost,
  quoteRecruitBatch,
  recruitSoldiers,
  armSoldiers,
  dismissSoldier,
  equipSoldiers,
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
  BURST_RATE,
  AIM_RATE,
  fireLines,
  formatFireLines,
  formationFirepower,
  PARTIAL_PEN_CHANCE,
  PARTIAL_PEN_RATIO,
  stackHasFullAuto,
  volleyDamage,
} from "./firepower.js";
export type { FireMode } from "./firepower.js";

export {
  BATTLE_COLS,
  BATTLE_MAX_STACKS,
  BATTLE_ROWS,
  battleOrder,
  beginBattle,
  finishBattleAction,
  hexDistance,
  listBringableFormations,
  moveBattleStack,
  openBattle,
  placeBattleStack,
  previewEnemyStacks,
  previewFormation,
  reachableHexes,
  retreatBattle,
  shootBattleStack,
  soldiersInFormation,
  splitBattleStack,
} from "./battle.js";

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
  unassignSoldiers,
  appointCommander,
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

export {
  RESEARCH_CATALOG,
  RP_PER_MONTH,
  RP_PER_CONTRACT_WIN,
  STARTER_UNLOCKS,
  getResearchNode,
  isResearchUnlocked,
  isLoadSubtypeUnlocked,
  isWeaponUnlocked,
  isGearUnlocked,
  isFactoryTierUnlocked,
  canResearch,
  spendResearch,
  grantResearch,
  grantStarterCaliberPath,
  listAvailableResearch,
  describeResearchTree,
  describeAvailableResearch,
  sumBoostPercent,
  productionOutputMult,
  successChanceBoost,
  primaryRifleIdForFamily,
  playerNation,
  caliberResearchId,
  weaponResearchId,
  loadResearchId,
} from "./research.js";

export {
  RESEARCH_FACILITY_TIERS,
  RP_PER_SCIENTIST,
  SCIENTIST_HIRE_COST,
  SCIENTIST_SALARY,
  MAX_FACILITY_STAGE,
  getResearchFacilityTier,
  facilityStageEff,
  facilityCapacity,
  facilityRpMult,
  nextFacilityTierPrice,
  facilityUpgradeCost,
  totalScientistCapacity,
  freeScientistSeats,
  projectedLabRp,
  scientistSalaryBill,
  describeResearchFacilities,
  hireScientist,
  buyResearchFacility,
  upgradeResearchFacility,
  awardLabRp,
  startingResearchShed,
  startingScientist,
} from "./labs.js";
