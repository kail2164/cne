# Tasks

## 1. Schema and factory

- [x] 1.1 Replace factory allocation with `FactoryState` on `GameState`; add year/month/turn; update `createCampaign`; verify `tsc`
- [x] 1.2 Implement `setFactoryProduct`, `resolveFactoryMonth` (money-only), remove tick/allocation path; verify lock rejects mid-cycle switch
- [x] 1.3 Implement `endTurn` (resolve → unlock → advance month → wound tick); verify Dec→Jan rollover

## 2. CLI / demo / docs

- [x] 2.1 Update CLI + demo to set product and end turns; verify `npm run demo`
- [x] 2.2 Update README + project-context; note combat vs calendar
- [x] 2.3 `openspec validate turn-based-factory-months --type change`

## Workflow follow-up

- Archive when requested.
