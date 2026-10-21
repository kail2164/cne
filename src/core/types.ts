export type CaliberId =
  | "762x54r"
  | "3006"
  | "303br"
  | "8x50r"
  | "792x57";

export type CaliberFamilyId = CaliberId;

export type RoundVariant = "ball" | "steel_tip" | "tracer" | "hollow";

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
  /** Variants this family can chamber/produce. */
  variants: RoundVariant[];
}

export interface AmmoCaliber {
  id: CaliberId;
  name: string;
  /** Caliber family this round belongs to. */
  familyId: CaliberFamilyId;
  /** Round construction variant. */
  variant: RoundVariant;
  /** Manufacture cost in funds. */
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

export interface Squad {
  id: string;
  name: string;
  /** Configurable fire-team / squad size target. */
  size: number;
  soldierIds: string[];
  doctrine: Doctrine;
  appointedWeaponId: string | null;
  /** Parent group when combined into a larger formation. */
  parentSquadId: string | null;
  consumption: SquadConsumption;
  /** Field experience by terrain (success-chance bonus later). */
  fieldExperience: Partial<Record<CombatTerrain, number>>;
}

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
  ammoCaliberId: CaliberId;
  ammoRounds: number;
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
  /** Carried mass in kg (encumbrance later). */
  weightKg: number;
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
  /** Squad assignment; null if unassigned reserve. */
  squadId: string | null;
  /** Remaining rest ticks while wounded (0 if healthy). */
  woundedRestTicks: number;
}

export interface FactoryLine {
  product: ProductLine;
  allocation: number;
}

export interface FactoryAllocation {
  ammo: number;
  rifles: number;
}

export type StockKind = "raw_materials" | "weapon" | "ammo";

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
  oppositionDamagePerTick: number;
  maxTicks: number;
  /** Cash reward in funds. */
  cashReward: number;
  lootMaterials: number;
  itemRewards: ContractItemReward[];
  combatType: CombatType;
  terrain: CombatTerrain;
  /** Expected time to complete in minutes. */
  durationMinutes: number;
  /** Base success chance 0–100 before squad/terrain modifiers. */
  baseSuccessChance: number;
}

export interface Company {
  name: string;
  soldiers: Soldier[];
}

export interface GameState {
  year: 1910;
  funds: number;
  selectedCaliberId: CaliberId | null;
  warehouse: Warehouse;
  factoryAllocation: FactoryAllocation;
  factoryCapacityPerTick: number;
  company: Company;
  /** Army size cap from barracks / buildings. */
  barracksPopSlots: number;
  squads: Squad[];
  garage: Vehicle[];
  researchUnlocked: string[];
}

export interface ActionResult<T = void> {
  ok: boolean;
  state: GameState;
  message: string;
  data?: T;
}

export interface CombatLogEntry {
  tick: number;
  ammoBefore: number;
  ammoAfter: number;
  ammoExhausted: boolean;
  friendlyCasualties: number;
  livingAfter: number;
  oppositionHpAfter: number;
  note: string;
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

export interface ProductionTickResult {
  producedAmmo: number;
  producedRifles: number;
  fundsSpent: number;
  materialsSpent: number;
  shortfalls: string[];
  warehouseNotes: string[];
}
