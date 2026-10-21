# Design

## Context

See proposal.md. Existing `Weapon` has `caliberId`, `productionCost`, `materialCost`, `weight`, `volume`, `basePower`. Warehouse uses `weight`/`volume`; factory uses `productionCost`/`materialCost`. Combat uses `basePower + caliber.stoppingPower`.

## Goals / Non-Goals

**Goals:**
- Single extended `Weapon` interface with documented units.
- Seed five 1910 rifles with differentiated placeholders.
- Small combat hook: `damage`, `fireRateRpm`, `reliabilityPct`.
- Keep factory/warehouse fields working without parallel cost models.

**Non-Goals:**
- Full ballistic hit-chance by engagement range.
- Per-magazine wear state on soldiers.
- Stochastic jam simulation every shot.
- Changing caliber-level stoppingPower model (still additive).

## Decisions

### 1. Field naming (TypeScript)
| Spec concept | Field | Unit |
|---|---|---|
| Muzzle velocity | `muzzleVelocityMps` | m/s |
| Accuracy at 200 m | `accuracyMoaAt200m` | MoA |
| Max range ~30% | `maxRangeM30pct` | m |
| Effective range ~80% | `effectiveRangeM80pct` | m |
| Fire rate | `fireRateRpm` | rpm (practical aimed) |
| Reliability | `reliabilityPct` | 0–100 % |
| Manufacture cost | `productionCost` | funds (existing) |
| Weight | `weight` | kg (existing) |
| Length | `lengthMm` | mm |
| Barrel length | `barrelLengthMm` | mm |
| Ammo capacity | `ammoCapacity` | rounds |
| Gun handling | `handling` | 0–100 |
| Reload rate | `reloadSeconds` | seconds / full mag |
| Ammo caliber | `caliberId` | existing id |
| Wear per mag | `wearPerMagazine` | condition pts (0–100 scale loss) |
| Recoil | `recoil` | 0–100 |
| Penetration | `penetration` | 0–100 |
| Damage | `damage` | combat points |

Remove `basePower`; migrate callers to `damage`.

Keep `volume` (warehouse m³-ish abstract units) and `materialCost` as logistics-only extras not listed in the user stats list.

### 2. Combat hook (Phase 1, small)
Per soldier contribution:
`damage + cal.stoppingPower`, then multiply by  
`fireFactor = clamp(fireRateRpm / 15, 0.7, 1.3)` and  
`reliFactor = reliabilityPct / 100` (floored at 0.5 for Phase 1 so bad guns hurt but don't null out).

Company power uses the same formula without the tick scale.

Ammo want per tick stays supply-efficiency based; optional tiny bump from fire rate deferred to tasks if needed.

### 3. Placeholder numerics
Historically flavored, not simulation-accurate. SMLE: 10-rd mag, higher rpm; Lebel: 8-rd tube, lower handling; Springfield/G98: high velocity/damage; Mosin: rugged reliability, middling elsewhere.

## Risks / Trade-offs

- **[Risk] Replacing basePower breaks balance** → Retune demo after hook; damage≈old basePower.
- **[Risk] Unused stats confuse players** → Document deferred hooks in tasks/README briefly.
- **[Trade-off] productionCost dual-named as manufacture cost** → Avoid duplicate fields; document in types JSDoc.

## Migration Plan

1. OpenSpec artifacts.
2. Extend types + catalog + combat/barracks.
3. `npm run demo` + `tsc`.
4. Commit locally.

## Open Questions

- Exact engagement-range model for MoA (defer).
- Whether wear should live on Weapon definition only or on instance state (defer to instance when elite loadouts land).
