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
  // Second weapons (research-gated) — shorter / carbine variants
  {
    id: "mosin-dragoon",
    name: "Mosin Dragoon",
    caliberId: "762x54r",
    productionCost: 42,
    materialCost: 11,
    weight: 3.7,
    volume: 2.9,
    muzzleVelocityMps: 840,
    accuracyMoaAt200m: 3.4,
    maxRangeM30pct: 1600,
    effectiveRangeM80pct: 350,
    fireRateRpm: 12,
    reliabilityPct: 93,
    lengthMm: 1238,
    barrelLengthMm: 730,
    ammoCapacity: 5,
    handling: 68,
    reloadSeconds: 8,
    wearPerMagazine: 0.85,
    recoil: 56,
    penetration: 58,
    damage: 7.5,
  },
  {
    id: "springfield-m1903a1",
    name: "Springfield M1903A1",
    caliberId: "3006",
    productionCost: 55,
    materialCost: 14,
    weight: 3.9,
    volume: 3.1,
    muzzleVelocityMps: 825,
    accuracyMoaAt200m: 2.2,
    maxRangeM30pct: 2000,
    effectiveRangeM80pct: 560,
    fireRateRpm: 12,
    reliabilityPct: 92,
    lengthMm: 1097,
    barrelLengthMm: 610,
    ammoCapacity: 5,
    handling: 72,
    reloadSeconds: 7,
    wearPerMagazine: 0.65,
    recoil: 62,
    penetration: 74,
    damage: 9.2,
  },
  {
    id: "lee-enfield-no1mk3",
    name: "Lee–Enfield No.1 Mk III",
    caliberId: "303br",
    productionCost: 50,
    materialCost: 13,
    weight: 3.9,
    volume: 3.0,
    muzzleVelocityMps: 744,
    accuracyMoaAt200m: 2.7,
    maxRangeM30pct: 1600,
    effectiveRangeM80pct: 460,
    fireRateRpm: 20,
    reliabilityPct: 91,
    lengthMm: 1132,
    barrelLengthMm: 640,
    ammoCapacity: 10,
    handling: 80,
    reloadSeconds: 4.5,
    wearPerMagazine: 1.0,
    recoil: 54,
    penetration: 58,
    damage: 8.5,
  },
  {
    id: "berthier-m1907",
    name: "Berthier M1907",
    caliberId: "8x50r",
    productionCost: 44,
    materialCost: 12,
    weight: 3.8,
    volume: 3.0,
    muzzleVelocityMps: 700,
    accuracyMoaAt200m: 3.3,
    maxRangeM30pct: 1400,
    effectiveRangeM80pct: 360,
    fireRateRpm: 12,
    reliabilityPct: 90,
    lengthMm: 1175,
    barrelLengthMm: 685,
    ammoCapacity: 3,
    handling: 70,
    reloadSeconds: 6,
    wearPerMagazine: 1.0,
    recoil: 55,
    penetration: 52,
    damage: 7.2,
  },
  {
    id: "karabiner-98a",
    name: "Karabiner 98a",
    caliberId: "792x57",
    productionCost: 48,
    materialCost: 12,
    weight: 3.7,
    volume: 2.8,
    muzzleVelocityMps: 860,
    accuracyMoaAt200m: 2.8,
    maxRangeM30pct: 1800,
    effectiveRangeM80pct: 450,
    fireRateRpm: 12,
    reliabilityPct: 93,
    lengthMm: 1090,
    barrelLengthMm: 590,
    ammoCapacity: 5,
    handling: 74,
    reloadSeconds: 7,
    wearPerMagazine: 0.8,
    recoil: 64,
    penetration: 70,
    damage: 8.5,
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

/**
 * Primary (first catalog) rifle chambered for a caliber family.
 * Prefer research-unlocked primary when multiple exist.
 */
export function getRifleForCaliber(familyId: string): Weapon | undefined {
  const PRIMARY: Record<string, string> = {
    "762x54r": "mosin-m91",
    "3006": "springfield-m1903",
    "303br": "lee-enfield-smle",
    "8x50r": "lebel-m1886",
    "792x57": "gewehr-98",
  };
  const preferred = PRIMARY[familyId];
  if (preferred) {
    const w = getRifle(preferred);
    if (w) return w;
  }
  return RIFLES.find((r) => r.caliberId === familyId);
}

/** All rifles for a family (primary + researched seconds). */
export function getRiflesForCaliber(familyId: string): Weapon[] {
  return RIFLES.filter((r) => r.caliberId === familyId);
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

/** Combat-consumed weapon fields (engagement + factory/logistics). */
export const WEAPON_STATS_COMBAT_LIVE = [
  "damage",
  "fireRateRpm",
  "reliabilityPct",
  "accuracyMoaAt200m",
  "effectiveRangeM80pct",
  "maxRangeM30pct",
  "wearPerMagazine",
  "ammoCapacity",
  "recoil",
  "handling",
  "reloadSeconds",
  "penetration",
  "productionCost",
  "weight",
] as const;
