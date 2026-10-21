# Design

## Context

See proposal.md. Current factory uses `factoryAllocation` ammo%/rifles% and `runFactoryTick` consuming funds + materials. CLI runs multiple ticks mid-session. No calendar month/turn.

## Goals / Non-Goals

**Goals:** Single product lock, money-only monthly resolve on `endTurn`, calendar month = cycle, CLI/demo updated.

**Non-Goals:** Multi-factory buildings, cancel/refund mid-cycle, parallel queues.

## Decisions

### FactoryState
```
{ product: 'ammo'|'rifles'|null, locked: boolean, monthlyCapacity: number }
```
- `setFactoryProduct(state, product)`: requires caliber; if locked && product≠current → fail; else set + lock.
- `resolveFactoryMonth(state)`: if product set, produce qty from capacity (ammo: `floor(cap*2.5)`, rifles: `floor(cap/8)`), funds only, warehouse storeAsMany; materialsSpent always 0.
- On `endTurn`: resolve → `locked=false` (keep product as last choice) → advance month → decrement woundedRestTicks lightly.

### Calendar
`year: number`, `month: 1..12`, `turn: number` starting 1910 / 1 / 1.

### Combat mapping
`durationMinutes` / `maxTicks` remain mission sim only. Ending turn after a fight advances the strategic month (recovery, factory). Documented in README.

### API cleanup
Remove active use of `FactoryAllocation` / `setFactoryAllocation` / `runFactoryTick`. Keep types deprecated or delete; update exports.

### Demo
Caliber → set rifles → endTurn×4 → set ammo → endTurn×3 → recruit → loadout → combat → (optional) endTurn.

## Risks

- **[Risk] Too few rifles in 4 months** → capacity 100 → 12 rifles/month ×4 = 48; OK for 20 recruit.
- **[Risk] Funds** → rifle months ~$2400; ammo cheaper; START 6500 OK.

## Open Questions

- Whether idle factory (null product) should still advance month with no output — yes.
