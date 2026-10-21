# Design

## Context

`companyPower` already sums damage × weapon factors × soldierCombatFactor. Combat months still ignore range/pen and treat opposition as a fixed HP pool with flat return fire. Need one engagement pass per end-turn month.

## Goals / Non-Goals

**Goals:** Documented power formula; initiative by combat type; damage from hit/range/pen/size; low incoming when out-ranging or out-armoring; combat log surfaces the model; demo still wins local Border Patrol in ~2 months.

**Non-Goals:** Real-time tick combat; simultaneous multi-mission fights; full armor catalog (gear armor is a stub derived from loadout/pen).

## Decisions

### Force profile
Both sides expose:
```
size, loadoutQuality (0–100), morale (0–100), experience (0–100),
rangeM, penetration, damagePerEntity, hpPerEntity, armor, power
```

**Friendly power** (also replaces readiness `companyPower` internals):
```
loadoutQ = avg(clamp(weapon damage+pen factors → 0–100))
morale   = avg(loyalty)
exp      = avg(min(experience, 100))
quality  = 0.45*loadoutQ/100 + 0.25*morale/100 + 0.20*exp/100 + 0.10
power    = size * quality * avg(weaponFire×reli×soldierCombatFactor) * 22
```
(Scale `*22` keeps numbers near prior readiness gates ~140 for 20 Gewehr troops.)

**Enemy** from contract:
```
size     = max(1, round(manpowerRequired * 0.85))
hp/ent   = oppositionHp / size
dmg/ent  = oppositionDamagePerTurn / size
rangeM   = tier baseline (local 350 … global 550)
pen/armor= tier baselines
morale/exp/loadout from tier
```

### Initiative
| Type | First strike |
|------|----------------|
| defense | Enemy |
| offense | Friendly |
| scout | Friendly |
| convoy | Friendly |
| escort | See frontline/backline |

**Escort zone** (deterministic from contract id hash):
- `frontline` → standard enemy engagement; enemy may strike first (ambush-ish, 50%).
- `backline` → thieves/robbers: smaller size (~40%), lower pen/range; thieves strike first if surprise.

### Hit chance at engagement range
Engagement range = min(attacker.effectiveRange, defender.effectiveRange) for mutual fights; attacker may choose standoff = attacker.effectiveRange when out-ranging.

```
rangeFactor = 1.0 if eng ≤ effectiveRange80
            = lerp(0.8→0.3) between effective and maxRange30
            = 0.15 beyond max
hitChance   = clamp(0.05, 0.95, (accuracy/100)*0.7 + 0.25) * rangeFactor * reliability/100
```

### Damage formula (one volley)
```
rawPool     = damagePerEntity * attackerSize * hitChance
penFactor   = clamp(0.35, 1.4, attackerPen / max(1, defenderArmor))
damageDealt = rawPool * penFactor
```
Applied to defender HP pool (`oppositionHp` or distributed as casualties ≈ damage / hpPerEntity).

Friendly casualties from enemy volley: `floor(damageDealt / friendly.hpPerEntity)` (capped).

### Range / armor advantage (incoming mitigation)
If `friendly.rangeM > enemy.rangeM * 1.1` **or** `friendly.pen > enemy.armor * 1.15`:
- Enemy return-fire hitChance *= **0.12** (very low chance to land meaningful damage).
Logged as `outRange` / `outArmor`.

### Monthly step
1. Build profiles; log power comparison.
2. Resolve initiative / escort encounter.
3. First striker volley → apply.
4. If both alive, second striker volley (with advantage mitigation).
5. Ammo burn + stamina as today; resolve win/retreat/timeline.

### Demo retune
Keep local oppositionHp ~380 and ensure ~20 Gewehr troops can clear in 2 months under the new formulas (adjust scale constants, not contract gates, if needed).

## Risks

- **[Risk] Readiness gates drift** → keep power scale near current companyPower for local (~140–170).
- **[Risk] Demo retreat** → verify `npm run demo` victory after engagement wire-up.
