# Changelog — v1-quick-wins

All notable changes to these plan documents are tracked here.

## [2026-02-27] — Proxy Alignment (v3)

### Changed
- **`02-admin-dashboard.md`** — replaced all 24 `middleware` references with `proxy.ts` equivalents:
  - Items #2 (`lib/supabase/middleware.ts`) marked as N/A (absorbed by proxy).
  - Item #3 upgraded ⬜→✅ (`proxy.ts` IS the edge guard).
  - Item #9 rewritten as `proxy.test.ts` tests.
  - Removed obsolete sections 2 and 3 (middleware code snippets).
  - Simplified commit strategy from 3 to 2 commits.
  - Completion: 70% → **80%**.
- **`README.md`** — updated Step 02 description (middleware → proxy.ts).
- **`EXECUTE.md`** — updated Step 02 scope boundary (removed `middleware.ts` and `lib/supabase/middleware.ts` from file list).

### Updated Metrics
| Document | Prev | New | Δ |
| --- | --- | --- | --- |
| 02-admin-dashboard.md | 70% | 80% | +10 |
| Others | — | — | 0 |
| **Total** | **72%** | **74%** | **+2** |

## [2026-02-27] — Sync Audit v2

### Changed
- Re-audited all plan documents against current codebase state.
- No item status changes detected for quick-wins; all percentages remain the same.
- Audit dates updated across all files.

### Metrics
| Document | Completion | ✅ | 🔶 | ⬜ |
| --- | --- | --- | --- | --- |
| 00-tracking-fixes.md | 88% | 7 | 0 | 1 |
| 01-remove-public-login.md | 100% | 4 | 0 | 0 |
| 02-admin-dashboard.md | 70% | 6 | 2 | 2 |
| 03-optional-form-ux.md | 75% | 5 | 2 | 1 |
| 04-calculator-conversion.md | 36% | 2 | 1 | 4 |
| **Total** | **72%** | **24** | **5** | **8** |

## [2026-02-27] — Implementation Progress Audit

### Added
- Implementation progress tracker injected into all plan documents.
- Per-item status (✅/🔶/⬜) with codebase evidence for each action item.

### Metrics
| Document | Completion | Implemented | Partial | Not Started |
| --- | --- | --- | --- | --- |
| 00-tracking-fixes.md | 88% | 7 | 0 | 1 |
| 01-remove-public-login.md | 100% | 4 | 0 | 0 |
| 02-admin-dashboard.md | 70% | 6 | 2 | 2 |
| 03-optional-form-ux.md | 75% | 5 | 2 | 1 |
| 04-calculator-conversion.md | 36% | 2 | 1 | 4 |
| **Total** | **72%** | **24** | **5** | **8** |
