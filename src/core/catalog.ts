import type { AmmoCaliber, Contract, Weapon } from "./types.js";

export const CALIBERS: AmmoCaliber[] = [
  {
    id: "762x54r",
    name: "7.62×54mmR",
    productionCost: 1.2,
    materialCost: 0.8,
    weightPerRound: 0.025,
    volumePerRound: 0.018,
    stoppingPower: 6,
    supplyEfficiency: 1.0,
    rifleId: "mosin-m91",
  },
  {
    id: "3006",
    name: ".30-06 Springfield",
    productionCost: 1.4,
    materialCost: 0.9,
    weightPerRound: 0.028,
    volumePerRound: 0.02,
    stoppingPower: 7.5,
    supplyEfficiency: 1.0,
    rifleId: "springfield-m1903",
  },
  {
    id: "303br",
    name: ".303 British",
    productionCost: 1.25,
    materialCost: 0.85,
    weightPerRound: 0.024,
    volumePerRound: 0.017,
    stoppingPower: 6.2,
    supplyEfficiency: 1.25,
    rifleId: "lee-enfield-smle",
  },
  {
    id: "8x50r",
    name: "8×50mmR Lebel",
    productionCost: 1.0,
    materialCost: 0.7,
    weightPerRound: 0.032,
    volumePerRound: 0.026,
    stoppingPower: 5.5,
    supplyEfficiency: 0.75,
    rifleId: "lebel-m1886",
  },
  {
    id: "792x57",
    name: "7.92×57mm Mauser",
    productionCost: 1.35,
    materialCost: 0.9,
    weightPerRound: 0.026,
    volumePerRound: 0.019,
    stoppingPower: 7.2,
    supplyEfficiency: 0.9,
    rifleId: "gewehr-98",
  },
];

export const RIFLES: Weapon[] = [
  {
    id: "mosin-m91",
    name: "Mosin–Nagant M1891",
    caliberId: "762x54r",
    productionCost: 45,
    materialCost: 12,
    weight: 4.0,
    volume: 3.2,
    basePower: 8,
  },
  {
    id: "springfield-m1903",
    name: "Springfield M1903",
    caliberId: "3006",
    productionCost: 52,
    materialCost: 14,
    weight: 3.9,
    volume: 3.1,
    basePower: 9,
  },
  {
    id: "lee-enfield-smle",
    name: "Lee–Enfield SMLE",
    caliberId: "303br",
    productionCost: 48,
    materialCost: 13,
    weight: 3.9,
    volume: 3.0,
    basePower: 8.5,
  },
  {
    id: "lebel-m1886",
    name: "Lebel M1886",
    caliberId: "8x50r",
    productionCost: 40,
    materialCost: 11,
    weight: 4.2,
    volume: 3.4,
    basePower: 7.5,
  },
  {
    id: "gewehr-98",
    name: "Gewehr 98",
    caliberId: "792x57",
    productionCost: 50,
    materialCost: 13,
    weight: 4.1,
    volume: 3.2,
    basePower: 9,
  },
];

export const START = {
  funds: 6500,
  rawMaterials: 1400,
  warehouseMaxWeight: 2500,
  warehouseMaxVolume: 1800,
  factoryCapacityPerTick: 100,
  recruitCostPerSoldier: 25,
} as const;

export const LOCAL_CONTRACT: Contract = {
  id: "local-border-patrol",
  name: "Border Patrol Skirmish",
  tier: "local",
  blurb: "Drive bandits from the frontier rail spur. Local Region only.",
  minTroops: 12,
  minPower: 140,
  recommendedAmmoPerSoldier: 35,
  oppositionHp: 380,
  oppositionDamagePerTick: 14,
  maxTicks: 12,
  lootFunds: 400,
  lootMaterials: 80,
};

export const LOCKED_TIERS: Contract[] = [
  {
    id: "province-locked",
    name: "Provincial Relief Column",
    tier: "province",
    blurb: "Locked until later phases.",
    minTroops: 40,
    minPower: 500,
    recommendedAmmoPerSoldier: 50,
    oppositionHp: 800,
    oppositionDamagePerTick: 20,
    maxTicks: 20,
    lootFunds: 0,
    lootMaterials: 0,
  },
];

export function getCaliber(id: string): AmmoCaliber | undefined {
  return CALIBERS.find((c) => c.id === id);
}

export function getRifle(id: string): Weapon | undefined {
  return RIFLES.find((r) => r.id === id);
}

export function getRifleForCaliber(caliberId: string): Weapon | undefined {
  const cal = getCaliber(caliberId);
  return cal ? getRifle(cal.rifleId) : undefined;
}

export function listContracts(): Contract[] {
  return [LOCAL_CONTRACT, ...LOCKED_TIERS];
}
