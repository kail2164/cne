# Design

## Context

`AmmoCaliber` already has `familyId` + `variant`, but only one ball entry per family is seeded. Factory/issue use `selectedCaliberId` as both family lock and ammo stock key.

## Goals / Non-Goals

**Goals:** Three subtypes with documented multipliers; all starter families seeded; default FMJ; factory/combat/CLI pick subtype; demo stays green.

**Non-Goals:** Tracer/specialty loads; research unlock gates for AP; mixed-loadout squads in one issue command.

## Decisions

### Subtype enum
`LoadSubtype = "fmj" | "hollow_point" | "ap"` (replaces play use of ball/steel_tip/tracer/hollow).

### Multipliers (locked)
| Subtype | cost | damage | penetration |
|---------|------|--------|-------------|
| fmj | 1.0× | 1.0× | 1.0× |
| hollow_point | 1.2× | 1.4× | 0.5× |
| ap | 2.0× | 1.0× | 1.55× |

Applied to each family's FMJ baseline (`baseCost`, `baseDamage`, `basePenetration`).

### Ids
- Family lock: `selectedCaliberId` remains family id (`792x57`, …).
- Ammo catalog/stock id: `${familyId}-fmj` | `-hollow_point` | `-ap`.
- `GameState.selectedLoadSubtype` defaults to `"fmj"` on caliber select; CLI can change it.
- Loadout `ammoCaliberId` stores the full ammo id.

### Helpers
- `ammoId(family, subtype)`, `getAmmo(family, subtype)`, `getCaliber(ammoId)`
- `getRifleForCaliber(familyId)` unchanged (rifles chamber the family)
- Factory/issue resolve active ammo via selected family + subtype

### CLI
- Starting list shows families (FMJ baseline cost/dmg).
- Menu action to set load subtype (or prompt when setting factory to ammo / issuing).
- Status line shows active subtype.

## Risks

- **[Risk] Demo stock key change** → demo still selects family `792x57`; production stores `792x57-fmj`; issue uses same — verify demo.
- **[Risk] listStartingCalibers length** → return one row per family (FMJ), not 15 rows.
