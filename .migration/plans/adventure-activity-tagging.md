Let me investigate the current spec content, the source landing-page structure, and how EDS metadata/indexing works here before drafting the plan.Bash is blocked in plan mode. Let me use Read/Grep instead to gather what I need.Let me check the existing page metadata block and any query-index config before drafting the plan.Let me check the import script's metadata generation and whether any query-index config exists in the repo.Bash is blocked in plan mode, but I have what I need. Key findings:
- **Activity values** across the 16 pages: Surfing, Skiing, Cycling, Rock Climbing, Camping, Social — these come from the `columns (spec)` block's "Activity" row.
- Each page already has a `metadata` block (Title, Description) — I'd add an `activity` (tag) field there.
- **No query-index config in the repo** — per AGENTS.md, `helix-query.yaml` is retired; indexing config lives at tools.aem.live (external).
- The **`/us/en/adventures` landing page isn't migrated yet** (it 404s), so the listing has nowhere to live yet.

A few decisions materially change the build. Let me confirm them.# Adventure Activity Tagging + Dynamic Listing Plan

## Goal
Tag every adventure detail page with its **Activity** (from the `columns (spec)` "Activity" row) as page metadata, then migrate the `/us/en/adventures` landing page with a **dynamic, filterable listing** that groups adventures by activity — tabs auto-derived from the actual tags.

## Findings (from the migrated content)
- All 16 adventure pages carry an Activity value in their spec block. Distinct values today:
  **Surfing · Skiing · Cycling · Rock Climbing · Camping · Social**
  (Surfing×2, Skiing×3, Cycling×4, Rock Climbing×2, Camping×2, Social×3).
- Each page already has a `metadata` block (Title, Description). Adding an **`activity`** field there emits `<meta name="activity" content="…">` at render (via `WebImporter.rules.createMetadata`).
- **No query-index config in the repo** (`helix-query.yaml` is retired; index config lives at tools.aem.live). → per your choice, the listing reads data **client-side** rather than depending on a configured custom index.
- `/us/en/adventures` is **not migrated yet** (404) → will be migrated to host the listing.

## Approach (per your answers)
1. **Tag all adventure pages** — the columns-spec parser also writes the Activity value into the page's `metadata` block as `activity`, so every adventure page exposes `<meta name="activity">`. Re-import all 16.
2. **New `adventure-list` block** (client-side, no index config needed):
   - Discovers the adventure pages from **`/us/en/query-index.json`** (default EDS index — path/title/image/description, no custom config), filtered to `…/adventures/` (excluding the landing page itself). If the index isn't available, falls back to an **authored list of links** in the block.
   - For each page, **fetches its `activity` meta** (client-side) to get the tag.
   - Renders a card grid (image + title + description linking to the page).
   - **Auto tabs**: builds the filter row from the distinct `activity` values found (All + each activity), and filters the grid on click. Cards carry `data-activity` for filtering.
3. **Migrate `/us/en/adventures` landing** — intro (heading + blurb + image) as default content / reuse `columns (featured)` if it fits, then the `adventure-list` block. Add an `adventures` landing entry to the importer (or a small dedicated import script) and import it.

## Files to change
- `blocks/columns/columns-spec` parser (`tools/importer/parsers/columns-spec.js` + inlined copy in `import-adventures.bundle.js`) — additionally set `activity` on the page metadata from the Activity row. *(Alternative: a small transformer that reads the spec and appends to the metadata block — decide at build time; parser is simplest since it already walks the spec rows.)*
- `blocks/adventure-list/` — new block: `adventure-list.js`, `adventure-list.css`, `metadata.json`, `README.md` (client-side fetch + auto tabs + card grid; structural CSS only).
- `tools/importer/` — landing-page import wiring (URL list + parser/section config for `/us/en/adventures`), and re-import of the 16 detail pages so `activity` meta is emitted.
- Re-run imports; verify.

## Open considerations
- **query-index availability**: the default `/us/en/query-index.json` still has to be published for auto-discovery to work live; the authored-links fallback keeps the block working regardless (and on localhost). The block will try index first, then fallback.
- **Landing intro block choice** (default content vs `columns featured`) will be finalized by inspecting the source `/us/en/adventures.html` layout during build.
- Tags are also reusable later if you decide to configure a real query-index at tools.aem.live (the `activity` meta will already be on every page).

## Checklist
- [ ] Inspect source `/us/en/adventures.html` structure (intro + current-adventures list) to finalize landing layout
- [ ] Add `activity` to each adventure page's metadata (from the spec "Activity" row) — update `columns-spec` parser + bundle copy
- [ ] Re-import all 16 adventure detail pages; confirm `<meta name="activity">` present on each
- [ ] Create `blocks/adventure-list/` block: discover pages (query-index → authored-links fallback), fetch each page's `activity` meta, render card grid with `data-activity`
- [ ] Auto-build filter tabs from distinct activity values (All + Surfing/Skiing/Cycling/Rock Climbing/Camping/Social); wire click filtering
- [ ] Structural CSS for the block (card grid + tab row), mobile-first; lint clean
- [ ] Migrate `/us/en/adventures` landing: intro section + `adventure-list` block; add importer wiring + import
- [ ] Verify in preview: landing lists all adventures, tabs filter correctly, cards link through, mobile layout holds
- [ ] Add `adventure-list` (and any new landing template) to `page-templates.json`; keep home/adventures templates intact
- [ ] (Optional) Refresh the DA block library so `adventure-list` is authorable
- [ ] Lint (JS + CSS); then commit/push/PR on a new branch

## Notes
- **Execution requires Execute mode** — this plan makes no changes yet.
- The listing reads data **client-side** (your choice), so it works without external index config; tagging still lands on every page so a query-index upgrade later is drop-in.
