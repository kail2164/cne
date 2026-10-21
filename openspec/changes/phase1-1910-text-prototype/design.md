# Design

## Context

See proposal.md for motivation. Current code is a tiny stub (`src/game.ts` + `src/index.ts`) with abstract unit kinds and strength comparison. Phase 1 requirements demand typed logistics entities, production ticks, warehouse limits, and timed combat with ammo risk. Stack remains Node/TypeScript; UI must stay swappable (CLI now, Phaser/Pixi/React later).

## Goals / Non-Goals

**Goals:**
- Pure `src/core` domain with immutable-friendly state transitions (functions return new state or explicit results).
- Deterministic combat given a seed (demo reproducibility).
- CLI as a thin adapter over a `runPhase1Demo(state, inputs)` style orchestration API.
- Schemas/interfaces for Soldier, Loadout, Weapon, AmmoCaliber, FactoryLine, Warehouse, Vehicle, Contract.

**Non-Goals:**
- Full Research Center tech tree gameplay (stub types/hooks only).
- Garages/vehicles beyond a typed placeholder and unused inventory slot.
- Elite individual unit UI (batch company loadout only for Phase 1).
- Persistence, multiplayer, or graphical rendering.
- Balance perfection — numbers are tunable constants.

## Decisions

### 1. Module layout
- `src/core/types.ts` — interfaces and IDs
- `src/core/catalog.ts` — five caliber families + matching rifles + local contract template
- `src/core/campaign.ts` — create start state, select caliber
- `src/core/factory.ts` — Factory Engine (allocation + tick)
- `src/core/warehouse.ts` — capacity checks + store/withdraw
- `src/core/barracks.ts` — recruit + issue company loadout
- `src/core/logistics.ts` — Logistics Check (deployment readiness vs contract)
- `src/core/combat.ts` — Combat & Ammo Consumption Simulator (ticks + log)
- `src/core/index.ts` — public API barrel
- `src/cli/` or `src/index.ts` — prompts / `--demo` only

**Why:** Clear seams for later UI; matches deliverable module names.  
**Alt:** Single god-module — rejected (harder to swap UI / test).

### 2. State model
Single `GameState` holding funds, materials, buildings, selectedCaliberId, warehouse stocks, company, factory allocation, and active combat. Mutations via pure functions: `(state, input) => { state, result }`.

**Why:** Easy to unit-test and to drive from CLI or future React state.  
**Alt:** Class-heavy OOP with internal mutation — deferred; functions are enough for Phase 1.

### 3. Caliber catalog (settled numbers)
Five families with differentiated traits (tunable constants):

| Family | Cost/round | Wt | Vol | Power | SupplyEff |
|--------|------------|----|-----|-------|-----------|
| 7.62x54mmR | mid | mid | mid | mid | mid |
| .30-06 Springfield | mid-high | mid-high | mid | high | mid |
| .303 British | mid | mid | mid | mid | high |
| 8x50mmR Lebel | low | high | high | mid-low | low |
| 7.92x57mm Mauser | mid-high | mid | mid | high | mid-low |

Rifles share a base pattern with caliber-linked power modifiers. Selection is one-shot on the campaign.

### 4. Factory tick model
Allocation map `{ ammo: 0–1, rifles: 0–1 }` must sum to 1 (±epsilon). Each full tick has a capacity budget (e.g. 100 points). Ammo yield = f(points × ammo%, cost, materials). Output attempts warehouse insert; overflow fails and that portion is not produced (or rolls back that line) — prefer fail-closed: if warehouse cannot take full batch, produce only what fits.

### 5. Combat tick model
Fixed max ticks (e.g. 12). Each tick:
1. If ammo > 0: fire — consume `ceil(livingSoldiers / supplyEfficiency)` rounds (min 1 per armed soldier group), deal damage = living × power × factor.
2. If ammo == 0: bayonet mode — high friendly casualty rate, low damage; after 2 dry ticks force retreat/fail.
3. Opposition deals return fire scaled by remaining enemy strength.
4. Append `CombatLogEntry`.

Victory when opposition HP ≤ 0; defeat on wipe or forced retreat. Loot on victory: small funds + materials.

**Determinism:** Accept optional `rng`/`seed`; demo uses fixed seed.

### 6. CLI / demo flow
Ordered steps matching requirements. `--demo` hardcodes: Mauser → produce ammo-heavy → recruit 20 → issue 40 rounds/soldier → accept Local Border Patrol → print log. Interactive mode asks at each step with sensible defaults.

### 7. Stub evolution
Delete or move `src/game.ts` stub behind archive; README documents Phase 1 commands. Keep `npm start` / `npm run demo`.

## Risks / Trade-offs

- **[Risk] Balance makes demo always win/lose** → Mitigation: tune demo numbers so victory is likely but ammo-starved path fails; document constants in catalog.
- **[Risk] Warehouse reject mid-tick confuses players** → Mitigation: CLI prints partial production results clearly.
- **[Risk] Over-building research/garage early** → Mitigation: types + no-op stubs only.
- **[Trade-off] Discrete ticks vs wall-clock timers** → Use discrete ticks for CLI determinism; wall-clock can wrap the same simulator later.

## Migration Plan

1. Land OpenSpec artifacts.
2. Implement core modules + CLI; remove stub imports.
3. Verify `npm run demo` and interactive path.
4. Update `docs/project-context.md` with Phase 1 decisions.
5. Commit locally (no push).

Rollback: revert commit; stub remains in git history.

## Open Questions

- Exact numeric balance for long-term campaign (tunable; not blocking MVP).
- Whether elite individual loadouts ship in Phase 1.5 vs Phase 2 (deferred; company batch only now).
- Preferred future renderer (Phaser vs Pixi vs React) — irrelevant to core API.
