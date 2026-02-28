# Changelog — v1-architecture-blueprint

All notable changes to these plan documents are tracked here.

## [2026-02-27] — Audit v3 — Full Codebase Re-verification

### Key Findings (status changes)

- **structure.md #4** — 🔶→✅ `useCejStore` is now a deprecated bridge re-exporting `usePublicStore`
- **01-architectural-audit.md #7** — 🔶→✅ Store split complete; all production components migrated

### Metrics

| Document | Prev % | New % | Δ | ✅ | 🔶 | ⬜ |
| --- | --- | --- | --- | --- | --- | --- |
| structure.md | 60% | 65% | +5 | 7 | 0 | 3 |
| 01-architectural-audit.md | 54% | 58% | +4 | 6 | 1 | 5 |
| 02-conversion-capi-strategy.md | 60% | 60% | 0 | 7 | 1 | 2 |
| 03-ux-friction-reduction.md | 56% | 56% | 0 | 3 | 4 | 2 |
| 04-dashboard-roadmap.md | 25% | 25% | 0 | 1 | 2 | 5 |
| 05-compliance-checklist.md | 50% | 50% | 0 | 5 | 1 | 4 |
| **Total** | **51%** | **53%** | **+2** | **29** | **9** | **21** |

## [2026-02-27] — Sync Audit v2

### Changed
- Re-audited all plan documents against current codebase state.
- Major corrections: previous audit underreported progress on 4 items.

### Key Findings (vs. previous audit)
- **`track-contact` endpoint** — `app/api/track-contact/route.ts` exists with tests. Blueprint-02 item #2 upgraded ⬜→✅.
- **`normalizePhone`** — exists in `submitLead.ts`. Blueprint-02 item #4 upgraded ⬜→✅.
- **Fire-before-navigate tracking** — `visitor.ts` `trackContact()` uses `keepalive`. Blueprint-02 item #7 upgraded ⬜→✅, Blueprint-03 item #5 upgraded ⬜→✅.
- **UTM consolidation** — `proxy.ts` now captures `cej_utm` cookie. Blueprint-01 item #5 and Blueprint-02 item #8 upgraded ⬜→🔶.
- **Store migration** — all production components use `usePublicStore`; `useCejStore` only in test files. Structure item #4 evidence updated.

### Metrics
| Document | Prev % | New % | Δ | ✅ | 🔶 | ⬜ |
| --- | --- | --- | --- | --- | --- | --- |
| 01-architectural-audit.md | 38% | 54% | +16 | 5 | 3 | 4 |
| 02-conversion-capi-strategy.md | 35% | 60% | +25 | 6 | 1 | 3 |
| 03-ux-friction-reduction.md | 44% | 56% | +12 | 3 | 4 | 2 |
| 04-dashboard-roadmap.md | 25% | 25% | 0 | 1 | 2 | 5 |
| 05-compliance-checklist.md | 40% | 50% | +10 | 4 | 2 | 4 |
| structure.md | 50% | 60% | +10 | 5 | 1 | 4 |
| **Total** | **39%** | **51%** | **+12** | **24** | **13** | **22** |

## [2026-02-27] — Implementation Progress Audit

### Added
- Implementation progress tracker injected into all plan documents.
- Per-item status (✅/🔶/⬜) with codebase evidence for each action item.

### Metrics
| Document | Completion | Implemented | Partial | Not Started |
| --- | --- | --- | --- | --- |
| 01-architectural-audit.md | 38% | 3 | 3 | 6 |
| 02-conversion-capi-strategy.md | 35% | 3 | 1 | 6 |
| 03-ux-friction-reduction.md | 44% | 2 | 4 | 3 |
| 04-dashboard-roadmap.md | 25% | 1 | 2 | 5 |
| 05-compliance-checklist.md | 40% | 3 | 2 | 5 |
| structure.md | 50% | 4 | 2 | 4 |
| **Total** | **39%** | **16** | **14** | **29** |
