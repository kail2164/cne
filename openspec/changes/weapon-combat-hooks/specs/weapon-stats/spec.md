# Spec Delta

## Purpose

Records that advanced combat hooks from the weapon stats schema are consumed by monthly engagement (completing deferred tasks 3.1–3.3).

## ADDED Requirements

### Requirement: Advanced combat hooks live in engagement
Accuracy-by-range (MoA / 30%–80% range bands), magazine wear affecting reliability, and recoil/handling/reload tempo MUST be consumed by monthly engagement combat. Stochastic per-shot jam rolls remain optional beyond reliability scaling.

#### Scenario: Engagement uses MoA and wear
- **WHEN** Phase 1 monthly combat runs with armed soldiers
- **THEN** hit chance reflects MoA/range bands and wear-adjusted reliability, and volleys apply a recoil/handling/reload tempo factor
