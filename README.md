# Conflict Never Ends (CNE)

Army-building game where the player takes part in **multiple conflicts** over time.

## Vision

- **Build and grow an army** — units, composition, and upgrades matter.
- **Enter distinct conflicts** — each fight is a chapter, not one endless battle.
- **Conflicts are the campaign spine** — choose where your army goes next and live with the outcome.

This repo is a minimal local stub: recruit a small force, pick a conflict, resolve a simple fight.

## Requirements

- Node.js 18+

## Setup

```bash
npm install
```

## Play the stub

Interactive:

```bash
npm start
```

Non-interactive demo (no prompts):

```bash
npm run demo
```

You will:

1. Name your army and recruit infantry / archers / cavalry
2. Choose one of several conflicts
3. See a simple strength-based resolution (your force vs the opposition)

## OpenSpec

This repo is set up for [OpenSpec](https://openspec.dev) (spec-driven workflow). The CLI is installed globally on this machine; project files live under `openspec/` and Cursor skills/commands under `.cursor/`.

```bash
# CLI (global)
openspec --version
openspec list

# In Cursor chat (after IDE restart if needed)
/opsx-propose "your idea"
```

Re-init or refresh tooling:

```bash
openspec init --tools cursor
openspec update
```

## Project layout

```
src/
  index.ts   # CLI entry
  game.ts    # army, conflicts, fight resolution
openspec/    # OpenSpec config, specs, changes
.cursor/     # OpenSpec Cursor skills & commands
```

## Status

Scaffold only — core loop is intentional and tiny so later systems (persistence, upgrades, multi-conflict progression) can grow on top.
