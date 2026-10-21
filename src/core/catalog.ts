import type {
  AmmoCaliber,
  AmmoId,
  CaliberFamily,
  CaliberFamilyId,
  LoadSubtype,
  Weapon,
} from "./types.js";

/** All playable load subtypes (every starter family offers these). */
export const LOAD_SUBTYPES: LoadSubtype[] = ["fmj", "hollow_point", "ap"];

export const LOAD_SUBTYPE_LABEL: Record<LoadSubtype, string> = {
  fmj: "FMJ",
  hollow_point: "Hollow point",
  ap: "AP",
};

/** Cost / damage / penetration multipliers vs family FMJ baseline. */
export const LOAD_SUBTYPE_MULT: Record<
  LoadSubtype,
  { cost: number; damage: number; penetration: number }
> = {
  fmj: { cost: 1.0, damage: 1.0, penetration: 1.0 },
  hollow_point: { cost: 1.2, damage: 1.4, penetration: 0.5 },
  ap: { cost: 2.0, damage: 1.0, penetration: 1.55 },
};

export function ammoId(familyId: CaliberFamilyId | string, subtype: LoadSubtype): AmmoId {
  return `${familyId}-${subtype}`;
}

export const CALIBER_FAMILIES: CaliberFamily[] = [
  { id: "762x54r", name: "7.62×54mmR family", variants: [...LOAD_SUBTYPES] },
  { id: "3006", name: ".30-06 family", variants: [...LOAD_SUBTYPES] },
  { id: "303br", name: ".303 British family", variants: [...LOAD_SUBTYPES] },
  { id: "8x50r", name: "8×50mmR Lebel family", variants: [...LOAD_SUBTYPES] },
  { id: "792x57", name: "7.92×57mm Mauser family", variants: [...LOAD_SUBTYPES] },
];

type FamilyBaseline = {
  familyId: CaliberFamilyId;
  shortName: string;
  baseCost: number;
  materialCost: number;
  weightPerRound: number;
  volumePerRound: number;
  baseDamage: number;
  basePenetration: number;
  gunPowderAmount: number;
  supplyEfficiency: number;
  rifleId: string;
};

const FAMILY_BASELINES: FamilyBaseline[] = [
  {
    familyId: "762x54r",
    shortName: "7.62×54mmR",
    baseCost: 1.2,
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
    familyId: "3006",
    shortName: ".30-06",
    baseCost: 1.4,
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
    familyId: "303br",
    shortName: ".303 British",
    baseCost: 1.25,
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
    familyId: "8x50r",
    shortName: "8×50mmR Lebel",
    baseCost: 1.0,
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
    familyId: "792x57",
    shortName: "7.92×57mm Mauser",
    baseCost: 1.35,
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

function buildLoads(base: FamilyBaseline): AmmoCaliber[] {
  return LOAD_SUBTYPES.map((subtype) => {
    const m = LOAD_SUBTYPE_MULT[subtype];
    return {
      id: ammoId(base.familyId, subtype),
      name: `${base.shortName} ${LOAD_SUBTYPE_LABEL[subtype]}`,
      familyId: base.familyId,
      variant: subtype,
      productionCost: Number((base.baseCost * m.cost).toFixed(4)),
      materialCost: base.materialCost,
      weightPerRound: base.weightPerRound,
      volumePerRound: base.volumePerRound,
      baseDamage: Number((base.baseDamage * m.damage).toFixed(2)),
      basePenetration: Number((base.basePenetration * m.penetration).toFixed(2)),
      gunPowderAmount: base.gunPowderAmount,
      supplyEfficiency: base.supplyEfficiency,
      rifleId: base.rifleId,
    };
  });
}

/** All starter family × FMJ/HP/AP ammo entries. */
export const CALIBERS: AmmoCaliber[] = FAMILY_BASELINES.flatMap(buildLoads);

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
  recruitCostPerSoldier: 25,
  barracksPopSlots: 40,
  defaultSquadSize: 20,
  startYear: 1910,
  startMonth: 1,
} as const;

export function getCaliberFamily(id: string): CaliberFamily | undefined {
  return CALIBER_FAMILIES.find((f) => f.id === id);
}

export function getCaliber(id: string): AmmoCaliber | undefined {
  return CALIBERS.find((c) => c.id === id);
}

export function getAmmo(
  familyId: CaliberFamilyId | string,
  subtype: LoadSubtype,
): AmmoCaliber | undefined {
  return getCaliber(ammoId(familyId, subtype));
}

/** Active factory/issue ammo for the campaign selection. */
export function getSelectedAmmo(state: {
  selectedCaliberId: CaliberFamilyId | string | null;
  selectedLoadSubtype: LoadSubtype;
}): AmmoCaliber | undefined {
  if (!state.selectedCaliberId) return undefined;
  return getAmmo(state.selectedCaliberId, state.selectedLoadSubtype);
}

export function getRifle(id: string): Weapon | undefined {
  return RIFLES.find((r) => r.id === id);
}

/** Rifle chambered for a caliber family (not a load subtype). */
export function getRifleForCaliber(familyId: string): Weapon | undefined {
  return RIFLES.find((r) => r.caliberId === familyId);
}

/** Effective ballistic pair: ammo subtype base + flat weapon bonuses. */
export function effectiveDamage(weaponId: string, ammoCaliberId: string): number {
  const w = getRifle(weaponId);
  const c = getCaliber(ammoCaliberId);
  if (!w || !c) return 0;
  return c.baseDamage + w.damage;
}

export function effectivePenetration(weaponId: string, ammoCaliberId: string): number {
  const w = getRifle(weaponId);
  const c = getCaliber(ammoCaliberId);
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
