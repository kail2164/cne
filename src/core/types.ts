export type CaliberId =
  | "762x54r"
  | "3006"
  | "303br"
  | "8x50r"
  | "792x57";

export type ProductLine = "ammo" | "rifles";

export type ContractTier =
  | "local"
  | "province"
  | "interstate"
  | "national"
  | "global";

export interface AmmoCaliber {
  id: CaliberId;
  name: string;
  productionCost: number;
  materialCost: number;
  weightPerRound: number;
  volumePerRound: number;
  stoppingPower: number;
  supplyEfficiency: number;
  rifleId: string;
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
}

export interface Soldier {
  id: string;
  name: string;
  loadout: Loadout | null;
  alive: boolean;
  skill: number;
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
  minTroops: number;
  minPower: number;
  recommendedAmmoPerSoldier: number;
  oppositionHp: number;
  oppositionDamagePerTick: number;
  maxTicks: number;
  lootFunds: number;
  lootMaterials: number;
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
