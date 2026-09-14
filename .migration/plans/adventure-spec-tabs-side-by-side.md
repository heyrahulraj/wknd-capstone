# Bali Surf Camp — Side-by-Side Spec + Tabs Layout Plan

**Answer to your question:** Yes — a **section-metadata style is exactly the right tool here.** In EDS, two blocks only sit side by side when they live in the **same section**; a section-metadata style class then lets us lay that section out as a two-column grid. Today the spec block and the tabs block are in **separate sections** (so they stack). The fix is to (1) merge them into one section, (2) tag it with a section-metadata style, and (3) add the grid CSS.

## Current state (from the imported adventure page)
- Section `rc4` = H1 "Bali Surf Camp" (default content, full width) — stays as-is, above the two columns.
- Section `rc-cf` = `columns (spec)` block + "Share this Adventure" heading (default content).
- Section `rc5` = `tabs (adventure)` block.
- `rc-cf` and `rc5` are distinct sections → they render stacked, causing the full-width layout instead of the source's side-by-side.

## Target (matches source image)
- H1 full width on top (unchanged).
- One row below it: **left column (~1/3)** = spec list + "Share this Adventure"; **right column (~2/3)** = tabs (Overview / Itinerary / What to Bring) + panel.
- Mobile/tablet: stack (spec on top, tabs below).

## Approach
Merge `rc-cf` + `rc5` into a **single section** carrying both blocks (`["columns", "tabs"]`) plus the Share default content, and give it a section-metadata style token **`adventure-body`** (descriptive, reusable; scoped so it won't affect the home page). CSS grid places spec+share in the left column and tabs in the right.

Proposed CSS (in `styles/styles.css`, mobile-first):
```css
/* adventure-body: narrow spec/share sidebar beside the wider tabs panel */
@media (width >= 900px) {
  main .section.adventure-body > div { /* .section wrapper */
    display: grid;
    grid-template-columns: minmax(220px, 1fr) 2fr;
    column-gap: 48px;
    align-items: start;
  }
  main .section.adventure-body .columns-wrapper { grid-column: 1; grid-row: 1; }
  main .section.adventure-body .default-content-wrapper { grid-column: 1; grid-row: 2; }
  main .section.adventure-body .tabs-wrapper { grid-column: 2; grid-row: 1 / span 2; }
}
```
(Below 900px no grid is applied → natural stacking.)

## Files to change
- `tools/importer/import-adventures.js` — merge `rc-cf` and `rc5` into one section: `blocks: ["columns", "tabs"]`, keep the spec + share default content, drop the separate tabs section, set `style: "adventure-body"`.
- `tools/importer/import-adventures.bundle.js` — mirror the same section-config change (hand-assembled bundle).
- `tools/importer/page-templates.json` — mirror the merged section on the `adventures` template.
- `styles/styles.css` — add the `.section.adventure-body` grid rules above.
- Re-run the adventures import so `content/us/en/adventures/bali-surf-camp.plain.html` regenerates with the single merged section carrying `section-metadata → adventure-body`.

## Checklist
- [ ] Confirm the `adventure-body` section-metadata approach and the ~1fr / 2fr split ratio
- [ ] Merge `rc-cf` (spec + Share) and `rc5` (tabs) into one section with `blocks: ["columns","tabs"]` and `style: "adventure-body"` in `import-adventures.js`
- [ ] Mirror the merged-section change in `import-adventures.bundle.js`
- [ ] Mirror the merged-section change on the `adventures` template in `page-templates.json`
- [ ] Add `.section.adventure-body` two-column grid CSS (desktop only) to `styles/styles.css`
- [ ] Re-run the adventures import; confirm the content has a single section with `section-metadata → adventure-body` wrapping both blocks
- [ ] Verify in preview: desktop shows spec+Share left / tabs right; mobile stacks; H1 stays full-width above
- [ ] Confirm no regression to the home page (which also uses `columns`/`.columns-container`)
- [ ] Lint `styles/styles.css`

## Notes
- Uses the same section-metadata mechanism already in the repo (`grey`, `yellow-underline`, `primary-cta`, `custom-separator`), so it's consistent and authorable in DA.
- Scoped to `.section.adventure-body` so the home page's `columns`/`tabs` usage is unaffected.
- **Execution requires Execute mode** — this plan makes no changes yet.
