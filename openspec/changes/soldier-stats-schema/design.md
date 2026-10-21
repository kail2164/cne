# Design

## Context

See proposal.md. Current `Soldier` = `{ id, name, loadout, alive, skill }`. `Loadout` = weapon + caliber + ammoRounds. Weapon stats already exist. Company batch recruit/issue ammo is the Phase 1 path.

## Goals / Non-Goals

**Goals:**
- Documented soldier stats + weight↔agility/strength caps.
- Exhaustion = ×0.6 (−40%) on combat contribution.
- 5 perk slots; `%` boost perk shape; stub catalog.
- Loadout `gearIds[]` for equipment refs.
- Recruit defaults; combat stamina drain + accuracy/exhaust hooks.

**Non-Goals:**
- Full perk catalog / UI.
- Food/supply consumption from weight.
- Instance gear encumbrance vs strength checks in warehouse.
- Replacing binary death with full HP wound system (HP present for later).

## Decisions

### 1. Soldier fields (units)
| Field | Unit / scale |
|---|---|
| `hp` / `maxHp` | hit points |
| `stamina` / `maxStamina` | stamina points |
| `accuracy` | 0–100 |
| `agility` | 0–100 (capped by weight) |
| `strength` | 0–100 (capped by weight) |
| `weightKg` | kg body mass |
| `salary` | funds / pay period |
| `loyalty` | 0–100 |
| `experience` | points (replaces `skill` in formulas) |
| `perkIds` | string[] length ≤ 5 |
| `loadout` | existing + `gearIds: string[]` |

Remove `skill`; map old `0.85 + skill*0.15` to `0.85 + min(experience,100)/100 * 0.15`.

### 2. Weight coupling (locked)
Clamp body weight to **45–100 kg** for Phase 1 recruits.

```
agilityCap(w) = round(clamp(95 - (w - 45) * 1.1, 35, 95))
strengthCap(w) = round(clamp(35 + (w - 45) * 1.1, 35, 95))
```

At ~45 kg: agility≤95, strength≤35. At ~90 kg: agility≤45.5→46, strength≤84.5→85.  
`clampStat(value, cap)` when creating/updating soldiers. Recruit default **weightKg = 72** → mid caps.

### 3. Exhaustion
`EXHAUSTION_FACTOR = 0.6`. Effective combat mult = factor when `stamina <= 0`, else 1. Drain **8 stamina / tick** per living shooter (tunable). After combat, restore stamina to `maxStamina` on survivors (Phase 1 simplification).

### 4. Perks
```
PerkDef { id, name, boosts: { target: 'soldier'|'weapon', stat: string, percent: number }[] }
```
`PERKS: PerkDef[] = []` stub (+ maybe 1–2 commented examples in catalog). `assignPerk` enforces max 5. `sumPerkPercent` helper exists but combat may no-op if catalog empty.

### 5. Loadout / gear
`Loadout.gearIds: string[]`. `GEARS: { id, name, weightKg }[]` stub empty or kit items later. Recruit loadout starts `gearIds: []`.

### 6. Combat hook
Per soldier firepower *= `(0.5 + accuracy/200)` * exhaustion * weapon factors * `(0.85 + expFactor)`. Light: `* (0.9 + strength/500)` recoil assist, `* (0.9 + agility/500)` tempo. Drain stamina each tick.

### 7. Carry hint (small)
`maxAmmoForStrength(strength) = floor(20 + strength * 0.9)` — optional soft note in issue ammo message if over; hard-cap deferred to tasks.

## Risks / Trade-offs

- **[Risk] Power drop from accuracy/exhaust** → Defaults accuracy~55, high maxStamina so demo still wins.
- **[Risk] Perk empty catalog unused** → Explicit deferred tasks; helpers ready.
- **[Trade-off] Post-battle full stamina restore** → Avoid mid-campaign rest systems for now.

## Open Questions

- Pay-period length for salary drain (defer economy tick).
- Whether HP absorbs damage before death (defer).
