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

export interface Weapon {
  id: string;
  name: string;
  caliberId: CaliberId;
  productionCost: number;
  materialCost: number;
  weight: number;
  volume: number;
  basePower: number;
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
