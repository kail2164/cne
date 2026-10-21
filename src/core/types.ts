/** Caliber family lock / rifle chamber (not a specific load). */
export type CaliberId =
  | "762x54r"
  | "3006"
  | "303br"
  | "8x50r"
  | "792x57";

export type CaliberFamilyId = CaliberId;

/**
 * Playable load subtype for a caliber family.
 * FMJ = default; hollow_point = high dmg / low pen; ap = high pen / normal dmg.
 */
export type LoadSubtype = "fmj" | "hollow_point" | "ap";

/** @deprecated Use LoadSubtype — kept as alias for older OpenSpec wording. */
export type RoundVariant = LoadSubtype;

/** Catalog / warehouse ammo id, e.g. `792x57-fmj`. */
export type AmmoId = string;

export type ProductLine = "ammo" | "rifles";

export type ContractTier =
  | "local"
  | "province"
  | "interstate"
  | "national"
  | "global";

export type CombatType = "offense" | "defense" | "convoy" | "escort" | "scout";

export type CombatTerrain = "urban" | "desert" | "jungle" | "plains" | "forest";

export type Doctrine = "offensive" | "balance" | "defensive" | "support";

export type BarrackDuty = "unassigned" | "assigned" | "wounded" | "ready";

export interface CaliberFamily {
  id: CaliberFamilyId;
  name: string;
  /** Load subtypes this family can produce. */
  variants: LoadSubtype[];
}

export interface AmmoCaliber {
  /** Unique ammo id (`${familyId}-${subtype}`). */
  id: AmmoId;
  name: string;
  /** Caliber family this round belongs to. */
  familyId: CaliberFamilyId;
  /** Load subtype (FMJ / hollow point / AP). */
  variant: LoadSubtype;
  /** Manufacture cost in funds (includes subtype multiplier). */
  productionCost: number;
  materialCost: number;
  weightPerRound: number;
  volumePerRound: number;
  /** Basic damage; weapon.damage adds a flat bonus. */
  baseDamage: number;
  /** Basic penetration; weapon.penetration adds a flat bonus. */
  basePenetration: number;
  /** Propellant charge in grains. */
  gunPowderAmount: number;
  supplyEfficiency: number;
  rifleId: string;
}

export interface FoodDef {
  id: string;
  name: string;
  /** Flat nourishment value. */
  nourishment: number;
  /** Happiness delta; bland/MRE-style food may be negative. */
  happiness: number;
  /** Manufacture cost in funds. */
  productionCost: number;
  /** Required recipe id; null = starter unlocked. */
  recipeId: string | null;
}

export interface SquadConsumption {
  /** Food units per day. */
  foodPerDay: number;
  /** Ammo rounds per day (training/patrol burn). */
  ammoPerDay: number;
  /** Abstract supply points (med/grenade/smoke kit, etc.). */
  suppliesPerDay: number;
}

/** Infantry-only echelons (vehicles excluded). */
export type OrgEchelon =
  | "fire_team"
  | "squad"
  | "platoon"
  | "company"
  | "battalion"
  | "brigade"
  | "division";

/**
 * Infantry formation node.
 * Fire teams hold soldiers; higher echelons hold child units + a roster commander.
 */
export interface OrgUnit {
  id: string;
  name: string;
  echelon: OrgEchelon;
  /** Target headcount for fire teams (3–5); advisory for higher echelons. */
  size: number;
  /** Direct soldier members (fire teams; higher echelons usually empty except CDR tracked separately). */
  soldierIds: string[];
  /** Child formation ids. */
  childUnitIds: string[];
  /** Commander billet — must be a living soldier on the roster. */
  commanderSoldierId: string | null;
  parentUnitId: string | null;
  doctrine: Doctrine;
  appointedWeaponId: string | null;
  consumption: SquadConsumption;
  fieldExperience: Partial<Record<CombatTerrain, number>>;
}

/** @deprecated Prefer OrgUnit — kept for older call sites. */
export type Squad = OrgUnit;

export interface ContractItemReward {
  itemId: string;
  quantity: number;
}

/**
 * Weapon ballistic / handling profile.
 * Units are fixed — see field suffixes and comments.
 * `productionCost` is manufacture cost in campaign funds (factory spends this).
 * `weight` is kg; `volume` is abstract warehouse volume (logistics only).
 */
export interface Weapon {
  id: string;
  name: string;
  /** Ammo caliber family this weapon chambers. */
  caliberId: CaliberId;
  /** Manufacture cost in funds (factory productionCost). */
  productionCost: number;
  /** Raw materials per rifle (logistics). */
  materialCost: number;
  /** Mass in kilograms. */
  weight: number;
  /** Abstract warehouse volume units. */
  volume: number;
  /** Muzzle velocity in m/s. */
  muzzleVelocityMps: number;
  /** Angular accuracy in minutes of angle at 200 m (lower = tighter). */
  accuracyMoaAt200m: number;
  /** Max range in meters where hit potential is ~30%. */
  maxRangeM30pct: number;
  /** Effective range in meters where hit potential is ~80%. */
  effectiveRangeM80pct: number;
  /** Practical aimed fire rate in rounds per minute. */
  fireRateRpm: number;
  /** Percent of discharges without jam (0–100). */
  reliabilityPct: number;
  /** Overall length in millimeters. */
  lengthMm: number;
  /** Barrel length in millimeters. */
  barrelLengthMm: number;
  /** Rounds in magazine/clip/tube. */
  ammoCapacity: number;
  /** Ease of raise / rotate / reload (0–100, higher = easier). */
  handling: number;
  /** Seconds to reload a full magazine/clip. */
  reloadSeconds: number;
  /** Condition points lost per full magazine expended (0–100 scale). */
  wearPerMagazine: number;
  /** Recoil harshness (0–100, higher = harder to control). */
  recoil: number;
  /** Penetration vs soft cover / barriers (0–100). */
  penetration: number;
  /** Base combat damage contribution per soldier volley factor. */
  damage: number;
}

export interface Loadout {
  weaponId: string;
  /** Full ammo catalog id including load subtype. */
  ammoCaliberId: AmmoId;
  ammoRounds: number;
  /**
   * Weapon instance condition 0–100 (100 = fresh).
   * Reduced by wearPerMagazine × magazines expended in combat.
   * Missing/undefined treated as 100 for older saves.
   */
  weaponCondition?: number;
  /** Equipment / gear item ids (kit, armor stubs — catalog later). */
  gearIds: string[];
}

/** Percentage boost applied by a specialty perk (catalog mostly stubbed). */
export interface PerkBoost {
  /** Which side of the sheet the boost targets. */
  target: "soldier" | "weapon";
  /** Stat key name (e.g. accuracy, damage, fireRateRpm). */
  stat: string;
  /** Percent boost, e.g. 10 = +10%. */
  percent: number;
}

export interface PerkDef {
  id: string;
  name: string;
  boosts: PerkBoost[];
}

export interface GearDef {
  id: string;
  name: string;
  /** Carried mass in kg. */
  weightKg: number;
  /** Extra ammo rounds capacity granted by this gear. */
  ammoCapacityBonus: number;
  /** Soft armor contribution (0–100). */
  armorBonus: number;
}

/**
 * Soldier attribute sheet.
 * Weight caps agility/strength — see soldier.ts helpers.
 * Exhausted (stamina ≤ 0) → −40% effective combat stats.
 */
export interface Soldier {
  id: string;
  name: string;
  loadout: Loadout | null;
  alive: boolean;
  /** Current hit points. */
  hp: number;
  /** Maximum hit points. */
  maxHp: number;
  /** Current stamina points (fight/move endurance). */
  stamina: number;
  /** Maximum stamina points. */
  maxStamina: number;
  /** Aim quality 0–100. */
  accuracy: number;
  /** Movement / reload / turn tempo 0–100 (capped by weight). */
  agility: number;
  /** Recoil control & carry capacity 0–100 (capped by weight). */
  strength: number;
  /** Body mass in kilograms. */
  weightKg: number;
  /** Pay in funds per pay period. */
  salary: number;
  /** Morale / loyalty 0–100. */
  loyalty: number;
  /** Combat/training experience points. */
  experience: number;
  /** Specialty perk ids — at most 5. */
  perkIds: string[];
  /** Barracks duty / readiness state. */
  duty: BarrackDuty;
  /** Assigned fire-team / unit id; null if unassigned. */
  squadId: string | null;
  /** Remaining rest ticks while wounded (0 if healthy). */
  woundedRestTicks: number;
}

/** Manufacture product kinds (vehicles stub — no output yet). */
export type FactoryProductKind =
  | "ammo"
  | "weapons"
  | "gears"
  | "grenades"
  | "vehicles";

/**
 * CLI/demo alias. `"rifles"` maps to `"weapons"`.
 * @deprecated Prefer FactoryProductKind.
 */
export type FactoryProduct = FactoryProductKind | "rifles";

export type FactoryTierId =
  | "blacksmith"
  | "workshop"
  | "manufactory"
  | "arsenal"
  | "industrial";

export interface FactorySlot {
  /** Product for this month; null = idle. */
  product: FactoryProductKind | null;
  /** Locked after set until end turn. */
  locked: boolean;
}

export interface OwnedFactory {
  id: string;
  tierId: FactoryTierId;
  /** Upgrade stage 1–5; stage 5 unlocks second slot. */
  stage: number;
  slots: FactorySlot[];
}

/** Catalog row for a factory tier. */
export interface FactoryTierDef {
  id: FactoryTierId;
  name: string;
  /** First-copy build cost in funds. */
  baseBuildCost: number;
  baseAmmo: number;
  baseWeapons: number;
  baseGears: number;
  baseGrenades: number;
  /** Multiplier on unit manufacture costs. */
  unitCostMult: number;
}

export type StockKind = "raw_materials" | "weapon" | "ammo" | "gear" | "grenade";

export interface StockEntry {
  kind: StockKind;
  itemId: string;
  quantity: number;
  weightPerUnit: number;
  volumePerUnit: number;
}

export interface Warehouse {
  id: string;
  name: string;
  maxWeight: number;
  maxVolume: number;
  stocks: StockEntry[];
}

export interface Vehicle {
  id: string;
  name: string;
  range: number;
  supplyCapacity: number;
  speed: number;
}

export interface Contract {
  id: string;
  name: string;
  tier: ContractTier;
  blurb: string;
  /** Manpower required to accept. */
  manpowerRequired: number;
  minPower: number;
  recommendedAmmoPerSoldier: number;
  oppositionHp: number;
  /** Opposition damage applied each monthly combat step. */
  oppositionDamagePerTurn: number;
  /** Months of end-turns needed for the mission timeline. */
  turnsNeeded: number;
  /** Cash reward in funds. */
  cashReward: number;
  lootMaterials: number;
  itemRewards: ContractItemReward[];
  combatType: CombatType;
  terrain: CombatTerrain;
  /** Base success chance 0–100 before squad/terrain modifiers. */
  baseSuccessChance: number;
}

/** In-progress contract mission; advances one combat step per end-turn. */
export interface ActiveMission {
  contractId: string;
  turnsNeeded: number;
  turnsRemaining: number;
  oppositionHp: number;
  successChance: number;
  startAmmo: number;
  startLiving: number;
  dryMonths: number;
  log: CombatLogEntry[];
  /** Set when mission finished this end-turn. */
  resolved?: CombatResult;
}

export interface Company {
  name: string;
  soldiers: Soldier[];
}

/** Research catalog node category. */
export type ResearchKind = "tech" | "building" | "item" | "vehicle";

/** Effect applied when a research node is unlocked. */
export type ResearchEffect =
  | { type: "boost"; target: "manpower" | "morale" | "production" | "successChance"; percent: number }
  | { type: "flat_manpower_slots"; amount: number }
  | { type: "warehouse_mult"; factor: number }
  | { type: "unlock_factory_tier"; tierId: FactoryTierId }
  | { type: "unlock_item"; itemId: string }
  | { type: "stub" };

export interface ResearchNode {
  id: string;
  name: string;
  kind: ResearchKind;
  /** Research point cost to unlock (0 = free grant only). */
  rpCost: number;
  /** Node ids that must already be unlocked. */
  requires: string[];
  /** Optional calendar gate (informational / soft). */
  earliestYear?: number;
  /** Required building research id before this item can be unlocked (optional). */
  requiresBuilding?: string;
  blurb: string;
  effects: ResearchEffect[];
}

export interface GameState {
  /** Calendar year (advances on end turn). */
  year: number;
  /** Calendar month 1–12; 1 cycle = 1 month. */
  month: number;
  /** Absolute turn/cycle index (starts at 1). */
  turn: number;
  funds: number;
  /** Locked caliber family (rifle chamber). */
  selectedCaliberId: CaliberId | null;
  /** Active load subtype for factory / issue (default FMJ). */
  selectedLoadSubtype: LoadSubtype;
  warehouse: Warehouse;
  /** Owned manufacture plants. */
  factories: OwnedFactory[];
  /**
   * Next purchase price per factory tier (2× after each buy).
   * Missing key → use tier baseBuildCost.
   */
  factoryTierNextPrice: Partial<Record<FactoryTierId, number>>;
  company: Company;
  /** Army size cap from barracks / buildings. */
  barracksPopSlots: number;
  /** Infantry formations (fire team → division). */
  squads: OrgUnit[];
  /** Active meal plan food id (monthly upkeep). */
  mealPlanId: string;
  garage: Vehicle[];
  /** Spendable research points. */
  researchPoints: number;
  /** Unlocked research node ids. */
  researchUnlocked: string[];
  /** Current contract mission, or null. */
  activeMission: ActiveMission | null;
  /** Highest unlocked regional tier. */
  currentTier: ContractTier;
  /** Victorious jobs counted toward unlocking the next tier (0–20). */
  jobsCompletedTowardNext: number;
  /** Lifetime victorious job completions. */
  jobsCompletedTotal: number;
  /** Up to 10 available contract ids. */
  contractBoard: string[];
}

export interface ActionResult<T = void> {
  ok: boolean;
  state: GameState;
  message: string;
  data?: T;
}

export interface CombatLogEntry {
  /** Month step index within the mission (1-based). */
  month: number;
  ammoBefore: number;
  ammoAfter: number;
  ammoExhausted: boolean;
  friendlyCasualties: number;
  livingAfter: number;
  oppositionHpAfter: number;
  turnsRemainingAfter: number;
  note: string;
  /** Friendly aggregate power this month. */
  friendlyPower?: number;
  /** Enemy / thieves aggregate power this month. */
  enemyPower?: number;
  /** Who opened the engagement. */
  firstStriker?: "friendly" | "enemy";
  /** Escort zone when applicable. */
  escortZone?: "frontline" | "backline" | null;
  /** Encounter profile. */
  encounter?: "enemy" | "thieves";
  /** Damage dealt by friendly volley. */
  friendlyDamage?: number;
  /** Damage dealt by enemy/thieves volley. */
  enemyDamage?: number;
  /** Out-range / out-armor flags. */
  advantages?: string[];
}

export interface CombatResult {
  won: boolean;
  retreated: boolean;
  log: CombatLogEntry[];
  ammoExpended: number;
  casualties: number;
  wounded: number;
  successChance: number;
  lootFunds: number;
  lootMaterials: number;
  summary: string;
}

export interface ReadinessReport {
  troopCount: number;
  power: number;
  totalAmmo: number;
  ready: boolean;
  failures: string[];
}

export interface CycleProductionLine {
  factoryId: string;
  slotIndex: number;
  product: FactoryProductKind;
  quantity: number;
  fundsSpent: number;
  note: string;
}

export interface CycleProductionResult {
  producedAmmo: number;
  producedRifles: number;
  producedGears: number;
  producedGrenades: number;
  fundsSpent: number;
  shortfalls: string[];
  warehouseNotes: string[];
  lines: CycleProductionLine[];
}

export interface UpkeepResult {
  salaryPaid: number;
  foodPaid: number;
  salaryShort: boolean;
  foodShort: boolean;
  deserted: number;
  loyaltyNotes: string[];
}

export interface EndTurnResult {
  production: CycleProductionResult;
  combatNote: string | null;
  missionResolved: CombatResult | null;
  upkeep: UpkeepResult | null;
  previousMonth: number;
  previousYear: number;
  month: number;
  year: number;
  turn: number;
}
