# Spec Delta

## Purpose

A thin HTML front end drives the existing TypeScript core without duplicating game rules in the page.

## ADDED Requirements

### Requirement: Core-driven browser UI
The HTML UI MUST call exported core helpers for game mutations and MUST NOT reimplement combat, factory, or research formulas in page scripts.

#### Scenario: End turn from UI
- **WHEN** the player clicks End turn in the HTML UI
- **THEN** the same `endTurn` core path advances month, factories, mission, and upkeep

### Requirement: Phase 1 playable surface
The page MUST show status (date, funds, RP), recruit with current unit price, factory/research highlights, contract board, end turn, and a combat/action log.

#### Scenario: Status visible
- **WHEN** a campaign is loaded in the browser
- **THEN** funds and research points are visible without using the CLI

### Requirement: Serve script
The project MUST provide an npm script that serves the HTML page (e.g. Vite).

#### Scenario: npm run web
- **WHEN** the developer runs the documented web script
- **THEN** the game page is available locally in a browser
