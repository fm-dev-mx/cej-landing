# Changelog - Phase 2 Growth Plan

## [Unreleased]

### Phase 2 Blueprint defined (2026-02-28)
- ✅ Strategic Pillars established: Attribution, CRM, Safeguards, XLSX.
- ✅ Sequence prioritized: 1A -> 4B -> 3A -> 2A.
- ✅ Detailed blueprints created for each pillar.

---

## [2026-02-28]
- ✅ Data Attribution Layer (ROI Tracking) implemented.
    - Persistent UTM tracking in `orders` and `leads`.
    - Automated normalization helper for attribution data.
    - Synchronized `gclid` and `fbclid` capture via `proxy.ts`.
    - New `getAttributionStats` server action for admin reporting.
