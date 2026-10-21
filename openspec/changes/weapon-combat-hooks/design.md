# Design

## Context

Engagement (`power.ts` / `progressCombatMonth`) already has range bands and reliability in hit chance, but uses soldier accuracy only and approximates max range as `effective × 1.8`. Weapon MoA, true `maxRangeM30pct` / `effectiveRangeM80pct`, wear, recoil, handling, and reload are catalogued but unused.

## Goals / Non-Goals

**Goals:**
- MoA + real range bands drive friendly hit chance.
- Per-loadout weapon condition wears by magazines expended each month.
- Recoil / handling / reload (+ capacity) scale volley output (tempo/control).
- Demo still clears local Border Patrol in ~2 months.

**Non-Goals:**
- Per-shot jam RNG tables.
- Separate elite/individual fire simulator.
- Repair/armorer UI (condition only degrades for now).

## Decisions

### 1. MoA → weapon accuracy
```
weaponAcc = clamp(100 - accuracyMoaAt200m * 12, 35, 98)
combined  = 0.55 * soldierAccuracy + 0.45 * weaponAcc
```
ForceProfile.accuracy stores the combined value for friendly; enemies keep tier baselines.

### 2. Range bands (unchanged shape, real max)
```
rangeFactor = 1.0 if eng ≤ effectiveRangeM80pct
            = lerp(0.8→0.3) between effective and maxRangeM30pct
            = 0.15 beyond max
hitChance   = clamp(0.05, 0.95, (combined/100)*0.7 + 0.25)
              * rangeFactor * effectiveReliability/100
```
Friendly profiles carry avg `effectiveRangeM80pct` and `maxRangeM30pct` from equipped rifles.

### 3. Wear / condition
- `Loadout.weaponCondition` 0–100, starts at 100 when issued/armed.
- Magazines expended ≈ `roundsSpent / ammoCapacity`.
- `condition -= magazines * wearPerMagazine` (floor 0).
- `effectiveReliability = reliabilityPct * (0.5 + 0.5 * condition/100)`.

### 4. Tempo / control (recoil, handling, reload, capacity)
Per armed soldier:
```
magCycleSec = ammoCapacity / (fireRateRpm/60) + reloadSeconds
reloadTempo = clamp(refCycle / magCycleSec, 0.75, 1.3)  // refCycle ≈ G98-like ~32.5s
recoilCtrl  = clamp(1.08 - (recoil - strength*0.65)/180, 0.75, 1.12)
handlingF   = clamp(0.88 + handling/450 + agility/600, 0.8, 1.15)
tempo       = reloadTempo * recoilCtrl * handlingF
```
ForceProfile.tempoFactor = average; `resolveVolley` multiplies damageDealt by attacker.tempoFactor (enemies default 1.0).

### 5. Logging
Volley notes may mention hit % as today; monthly note already includes matchup — no mandatory new CLI surface beyond existing combat log.

## Risks

- **[Risk] Hit/tempo buffs break demo balance** → keep factors near 1.0 for Gewehr; verify `npm run demo`.
- **[Risk] Missing weaponCondition on old loadouts** → treat undefined as 100.

## Migration

1. OpenSpec artifacts.
2. Types + power/combat/soldier/barracks + catalog live-stats list.
3. Mark weapon-stats 3.x done; validate; demo; commit.
