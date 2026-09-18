# Adventures → Cards (adventures) Migration Plan

## Goal
Convert the adventures listing to the shared **`cards` block** — the same index-driven mechanism now powering home and magazine — while **preserving its activity filter tabs**. Introduce a dedicated **`cards (adventures)`** variant that renders the index-driven grid **plus** the activity filter tabs, migrate the landing page to it, remove the standalone `adventure-list` block, and re-index + verify.

## Confirmed decisions
- **Variant name:** **`cards (adventures)`** (authored class `cards adventures`, layered on the dynamic index-reading behavior). Self-documenting in the DA library.
- **Keep filters:** `cards (adventures)` renders the auto-derived activity filter tabs (All / Camping / Cycling / …) above the grid, exactly like today.
- **Remove `adventure-list`:** delete the block + its parser once the landing page is migrated (after confirming no other page references it).
- **Re-index to confirm:** re-index + republish the adventures pages and verify the new variant renders live from the index.

## Current state (context)
- `cards (dynamic)` (PR #24, live on home+magazine): reads `/us/en/query-index.json` by path prefix via shared `scripts/query-index.js`, builds article-style cards, `prefix | limit | category` marker, renders nothing without an index.
- `adventure-list` block: same index-first idea **plus** activity filter tabs (auto-derived from each card's `activity`, toggles `hidden` on non-matching cards). Landing importer maps `.image-list.list` → `adventure-list`.
- The live index already carries `activity` for all 16 adventure rows, so the filter runs entirely off the index — no per-page fetch.

## Design

### A. Add the `cards (adventures)` variant
- **`blocks/cards/cards.js`:**
  - Treat `adventures` as a dynamic, index-driven variant (same fetch/build path as `dynamic`). Detect via `block.classList.contains('adventures')` (reuse `decorateDynamic`; `dynamic` OR `adventures` both trigger index reading).
  - For the `adventures` variant, default the prefix to `/us/en/adventures`, list all (no limit), and enable the **activity filter tabs**: stamp each card with `data-activity` from the index row, auto-derive the distinct activities, render the tab nav, and toggle `hidden` on non-matching cards.
  - Factor the tab-build + filter logic into a small helper so behavior matches the retired adventure-list exactly.
- **`blocks/cards/cards.css`:** port the filter-tab styles from `adventure-list.css`, scoped to `.cards.adventures` (grid itself already covered by `.cards.article`).

### B. Migrate the adventures landing importer
- New/updated parser emits `cards adventures` marker (prefix `/us/en/adventures`, activity filter, no limit) instead of `adventure-list`.
- Update `import-adventures-landing.js` + `.bundle.js` and `page-templates.json` (rc4 block `adventure-list` → `cards`, variant `adventures`).
- Re-import the landing page; "Current Adventures" now emits `cards article adventures`.

### C. Remove the `adventure-list` block
- Grep all references; confirm only the landing page used it.
- Delete `blocks/adventure-list/` and `tools/importer/parsers/adventure-list.js` (and the orphaned `adventure-list-children` parser/landing bundle if present and unused — verify first).
- Remove `adventure-list` from `page-templates.json`.
- Update DA block library (`all-blocks` + `blocks.json`): drop `Adventure List` entries, add **`Cards (adventures)`**; publish preview + live.

### D. Re-index + verify
- Re-index + republish adventures landing + detail pages.
- Verify live `/us/en/adventures`: card grid **with** activity filter tabs from the index; filtering hides/shows correctly; a newly published adventure would appear automatically.
- `npm run lint`; commit on a fresh branch; open PR with before/after URLs.

## Open items to check during implementation
- **Authoring shape:** `cards adventures` marker cell — prefix derived from the source list's links (as home/magazine do); activity filter implied by the variant (no extra token needed since the variant name carries the intent).
- **Landing republish:** migrated landing `.plain.html` is gitignored (publishes via DA) — block/importer/library changes go in the PR; the page must be republished to DA to go live.
- **Orphan check:** `adventure-list-children` variant/importer from an earlier PR — if unused, remove too; flag before deleting.

## Risks / notes
- Removing `adventure-list` is destructive — gated on the grep showing no other references. If anything still references it, keep a thin deprecated alias instead.
- Filter tabs depend on the index `activity` column (already populated). A row missing activity still shows under "All", no error.
- No regression for home/magazine: they stay on plain `cards (dynamic)`; `adventures` is a separate variant.

## Checklist
- [ ] Create a fresh branch off `main` (e.g. `adventures-cards-dynamic`)
- [ ] Add `cards (adventures)` variant in `cards.js`: index-driven grid (reuse `decorateDynamic`) + activity filter tabs (default prefix `/us/en/adventures`, no limit)
- [ ] Extract shared filter-tab helper so `adventures` filtering matches the retired adventure-list behavior
- [ ] Port filter-tab CSS from `adventure-list.css` into `cards.css`, scoped to `.cards.adventures`
- [ ] Update the adventures-landing parser/importer + bundle to emit `cards adventures`; update `page-templates.json` rc4 (`adventure-list` → `cards` / variant `adventures`)
- [ ] Re-import adventures landing; confirm the `cards article adventures` marker is correct
- [ ] Grep for `adventure-list` references; confirm safe to remove
- [ ] Delete `blocks/adventure-list/` + `parsers/adventure-list.js` (+ orphaned children variant if unused); remove from `page-templates.json`
- [ ] Update DA block library (all-blocks + blocks.json): drop Adventure List, add Cards (adventures); publish preview + live
- [ ] Re-index + republish adventures landing + detail pages
- [ ] Verify live `/us/en/adventures`: grid + activity filter tabs render from the index; filtering works
- [ ] `npm run lint` passes
- [ ] Commit, push, open PR with before/after preview URLs

> Note: this plan is not yet executed — switching to **Execute mode** is required. Indexing/library/publish steps run against tools.aem.live + DA (outside the repo); the block/importer changes go through the PR.
