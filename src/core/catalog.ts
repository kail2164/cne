import type {
  AmmoCaliber,
  CaliberFamily,
  Contract,
  Weapon,
} from "./types.js";

export const CALIBER_FAMILIES: CaliberFamily[] = [
  { id: "762x54r", name: "7.62×54mmR family", variants: ["ball", "steel_tip", "tracer"] },
  { id: "3006", name: ".30-06 family", variants: ["ball", "steel_tip", "tracer", "hollow"] },
  { id: "303br", name: ".303 British family", variants: ["ball", "tracer"] },
  { id: "8x50r", name: "8×50mmR Lebel family", variants: ["ball", "tracer"] },
  { id: "792x57", name: "7.92×57mm Mauser family", variants: ["ball", "steel_tip", "tracer"] },
];

export const CALIBERS: AmmoCaliber[] = [
  {
    id: "762x54r",
    name: "7.62×54mmR Ball",
    familyId: "762x54r",
    variant: "ball",
    productionCost: 1.2,
    materialCost: 0.8,
    weightPerRound: 0.025,
    volumePerRound: 0.018,
    baseDamage: 6,
    basePenetration: 55,
    gunPowderAmount: 48,
    supplyEfficiency: 1.0,
    rifleId: "mosin-m91",
  },
  {
    id: "3006",
    name: ".30-06 Ball",
    familyId: "3006",
    variant: "ball",
    productionCost: 1.4,
    materialCost: 0.9,
    weightPerRound: 0.028,
    volumePerRound: 0.02,
    baseDamage: 7.5,
    basePenetration: 62,
    gunPowderAmount: 50,
    supplyEfficiency: 1.0,
    rifleId: "springfield-m1903",
  },
  {
    id: "303br",
    name: ".303 British Ball",
    familyId: "303br",
    variant: "ball",
    productionCost: 1.25,
    materialCost: 0.85,
    weightPerRound: 0.024,
    volumePerRound: 0.017,
    baseDamage: 6.2,
    basePenetration: 52,
    gunPowderAmount: 37,
    supplyEfficiency: 1.25,
    rifleId: "lee-enfield-smle",
  },
  {
    id: "8x50r",
    name: "8×50mmR Lebel Ball",
    familyId: "8x50r",
    variant: "ball",
    productionCost: 1.0,
    materialCost: 0.7,
    weightPerRound: 0.032,
    volumePerRound: 0.026,
    baseDamage: 5.5,
    basePenetration: 48,
    gunPowderAmount: 46,
    supplyEfficiency: 0.75,
    rifleId: "lebel-m1886",
  },
  {
    id: "792x57",
    name: "7.92×57mm Mauser Ball",
    familyId: "792x57",
    variant: "ball",
    productionCost: 1.35,
    materialCost: 0.9,
    weightPerRound: 0.026,
    volumePerRound: 0.019,
    baseDamage: 7.2,
    basePenetration: 65,
    gunPowderAmount: 49,
    supplyEfficiency: 0.9,
    rifleId: "gewehr-98",
  },
];

/** 1910 starter bolt-actions — placeholder-plausible stats (see weapon-stats OpenSpec). */
export const RIFLES: Weapon[] = [
  {
    id: "mosin-m91",
    name: "Mosin–Nagant M1891",
    caliberId: "762x54r",
    productionCost: 45,
    materialCost: 12,
    weight: 4.0,
    volume: 3.2,
    muzzleVelocityMps: 865,
    accuracyMoaAt200m: 3.2,
    maxRangeM30pct: 1800,
    effectiveRangeM80pct: 400,
    fireRateRpm: 12,
    reliabilityPct: 94,
    lengthMm: 1305,
    barrelLengthMm: 800,
    ammoCapacity: 5,
    handling: 62,
    reloadSeconds: 8,
    wearPerMagazine: 0.8,
    recoil: 58,
    penetration: 62,
    damage: 8,
  },
  {
    id: "springfield-m1903",
    name: "Springfield M1903",
    caliberId: "3006",
    productionCost: 52,
    materialCost: 14,
    weight: 3.9,
    volume: 3.1,
    muzzleVelocityMps: 820,
    accuracyMoaAt200m: 2.4,
    maxRangeM30pct: 2000,
    effectiveRangeM80pct: 550,
    fireRateRpm: 12,
    reliabilityPct: 92,
    lengthMm: 1097,
    barrelLengthMm: 610,
    ammoCapacity: 5,
    handling: 70,
    reloadSeconds: 7,
    wearPerMagazine: 0.7,
    recoil: 64,
    penetration: 72,
    damage: 9,
  },
  {
    id: "lee-enfield-smle",
    name: "Lee–Enfield SMLE",
    caliberId: "303br",
    productionCost: 48,
    materialCost: 13,
    weight: 3.9,
    volume: 3.0,
    muzzleVelocityMps: 744,
    accuracyMoaAt200m: 2.8,
    maxRangeM30pct: 1600,
    effectiveRangeM80pct: 450,
    fireRateRpm: 18,
    reliabilityPct: 90,
    lengthMm: 1132,
    barrelLengthMm: 640,
    ammoCapacity: 10,
    handling: 78,
    reloadSeconds: 5,
    wearPerMagazine: 1.0,
    recoil: 55,
    penetration: 58,
    damage: 8.5,
  },
  {
    id: "lebel-m1886",
    name: "Lebel M1886",
    caliberId: "8x50r",
    productionCost: 40,
    materialCost: 11,
    weight: 4.2,
    volume: 3.4,
    muzzleVelocityMps: 710,
    accuracyMoaAt200m: 3.6,
    maxRangeM30pct: 1500,
    effectiveRangeM80pct: 350,
    fireRateRpm: 10,
    reliabilityPct: 88,
    lengthMm: 1300,
    barrelLengthMm: 800,
    ammoCapacity: 8,
    handling: 52,
    reloadSeconds: 14,
    wearPerMagazine: 1.2,
    recoil: 60,
    penetration: 55,
    damage: 7.5,
  },
  {
    id: "gewehr-98",
    name: "Gewehr 98",
    caliberId: "792x57",
    productionCost: 50,
    materialCost: 13,
    weight: 4.1,
    volume: 3.2,
    muzzleVelocityMps: 878,
    accuracyMoaAt200m: 2.5,
    maxRangeM30pct: 2000,
    effectiveRangeM80pct: 500,
    fireRateRpm: 12,
    reliabilityPct: 93,
    lengthMm: 1250,
    barrelLengthMm: 740,
    ammoCapacity: 5,
    handling: 65,
    reloadSeconds: 7.5,
    wearPerMagazine: 0.75,
    recoil: 66,
    penetration: 74,
    damage: 9,
  },
];

export const START = {
  funds: 6500,
  rawMaterials: 1400,
  warehouseMaxWeight: 2500,
  warehouseMaxVolume: 1800,
  factoryCapacityPerTick: 100,
  recruitCostPerSoldier: 25,
  barracksPopSlots: 40,
  defaultSquadSize: 20,
} as const;

export const LOCAL_CONTRACT: Contract = {
  id: "local-border-patrol",
  name: "Border Patrol Skirmish",
  tier: "local",
  blurb: "Drive bandits from the frontier rail spur. Local Region only.",
  manpowerRequired: 12,
  minPower: 140,
  recommendedAmmoPerSoldier: 35,
  oppositionHp: 380,
  oppositionDamagePerTick: 14,
  maxTicks: 12,
  cashReward: 400,
  lootMaterials: 80,
  itemRewards: [],
  combatType: "offense",
  terrain: "plains",
  durationMinutes: 90,
  baseSuccessChance: 72,
};

export const LOCKED_TIERS: Contract[] = [
  {
    id: "province-locked",
    name: "Provincial Relief Column",
    tier: "province",
    blurb: "Locked until later phases.",
    manpowerRequired: 40,
    minPower: 500,
    recommendedAmmoPerSoldier: 50,
    oppositionHp: 800,
    oppositionDamagePerTick: 20,
    maxTicks: 20,
    cashReward: 0,
    lootMaterials: 0,
    itemRewards: [],
    combatType: "escort",
    terrain: "forest",
    durationMinutes: 360,
    baseSuccessChance: 55,
  },
];

export function getCaliber(id: string): AmmoCaliber | undefined {
  return CALIBERS.find((c) => c.id === id);
}

export function getCaliberFamily(id: string): CaliberFamily | undefined {
  return CALIBER_FAMILIES.find((f) => f.id === id);
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

/** Effective ballistic pair: caliber base + flat weapon bonuses. */
export function effectiveDamage(weaponId: string, caliberId: string): number {
  const w = getRifle(weaponId);
  const c = getCaliber(caliberId);
  if (!w || !c) return 0;
  return c.baseDamage + w.damage;
}

export function effectivePenetration(weaponId: string, caliberId: string): number {
  const w = getRifle(weaponId);
  const c = getCaliber(caliberId);
  if (!w || !c) return 0;
  return c.basePenetration + w.penetration;
}

/** Combat live stats today; MoA/range/wear/recoil/handling reserved for later. */
export const WEAPON_STATS_COMBAT_LIVE = [
  "damage",
  "fireRateRpm",
  "reliabilityPct",
  "productionCost",
  "weight",
] as const;
