Let me review the current adventure-list implementation before planning.Let me check the parser too, then I'll confirm a couple of decisions.# Adventure-List "children" Variant Plan

## Goal
Add a new **variant** of the `adventure-list` block that takes a single **parent page path** and automatically lists its **direct child pages** (via the EDS query-index), instead of requiring an authored list of URLs. The existing `adventure-list` block is left unchanged.

## Decisions (confirmed)
- **Discovery:** query-index, filtered by the authored parent path prefix.
- **Depth:** direct children only (one path segment below the parent; the parent landing page itself is excluded).
- **No fallback:** if the query-index is unavailable or returns no children, the block renders **nothing** (no authored-link fallback).
- **New variant, not a rewrite:** implement as a variant token on the existing block (`adventure-list children`); the current URL-list behavior stays intact.

## Design

### Authoring shape
```
| adventure-list (children) |
| /us/en/adventures         |
```
One cell holding the parent path — as a link **or** plain text. The variant reads that path; no per-page links needed.

### Runtime behaviour (`adventure-list.js`, variant branch)
1. Detect the variant: `block.classList.contains('children')`.
2. Read the authored parent path from the block's single cell (anchor `href` or text); normalize (strip `/content`, `.html`, trailing slash).
3. Fetch the query-index (`/query-index.json`, then locale `/us/en/query-index.json` as a secondary location).
4. Keep rows whose `path` is a **direct child** of the parent prefix: starts with `${parent}/` and has **no further slash** after that segment; exclude the parent path itself.
5. If zero children (or index fetch fails), leave the block **empty and hidden** — no fallback, no error UI.
6. Build cards + activity filter tabs reusing the existing block's helpers (`fetchCardData`, `buildCard`, `buildTabs`). Prefer query-index columns (`title`, `image`, `description`, `activity`) when present to avoid N per-page fetches; fall back to fetching each child's `.plain.html` only for fields the index doesn't expose.

### Shared vs variant code
- Refactor the existing `decorate` so the card/tab/render helpers are shared; add a `collectChildPaths(parentPath)` used only by the variant. The default (URL-list) path is untouched functionally.

### Importer wiring (new parser variant)
- New parser `tools/importer/parsers/adventure-list-children.js` (or a variant flag on the existing parser) that emits `<div class="adventure-list children">` with a single cell = the parent path, instead of one row per link.
- Wire it into a landing importer + bundle (mirroring the existing `import-adventures-landing` pattern) — used only if/when a landing page is re-migrated to the new variant. Existing landing content keeps working on the base block.

### DA library
- Add a **Adventure List (children)** sample to `all-blocks` and confirm `blocks.json` (variants live in the all-blocks doc; no new top-level entry required). Publish preview + live.

## Query-index prerequisite (call out to user)
The variant depends on a published query-index that includes the adventure pages with at least a `path` column (ideally `title`, `image`, `description`, `activity` to skip per-page fetches). This is configured at **tools.aem.live**, not in the repo. If it isn't set up, the variant will render empty by design. Verification on `localhost:3000` will therefore only work if the index is reachable there; otherwise verify on the `.aem.page` preview.

## Checklist
- [ ] Refactor `blocks/adventure-list/adventure-list.js` to share card/tab/render helpers between the default and the new variant (no behavior change to default)
- [ ] Add `collectChildPaths(parentPath)`: fetch query-index, filter to direct children of the prefix, exclude the parent
- [ ] Add variant branch in `decorate`: read authored parent path, use query-index only, render empty+hidden when no children/index
- [ ] Prefer query-index columns for title/image/description/activity; fetch `.plain.html` only for missing fields
- [ ] Add variant styles if needed in `blocks/adventure-list/adventure-list.css` (reuse existing; keep `.adventure-card[hidden]` fix)
- [ ] Update `blocks/adventure-list/metadata.json` + `README.md` to document the `children` variant and authoring shape
- [ ] Create `tools/importer/parsers/adventure-list-children.js` emitting `adventure-list children` with the parent-path cell
- [ ] Add/adjust a landing importer + hand-assembled bundle for the variant (mirror `import-adventures-landing`)
- [ ] `npm run lint` (eslint + stylelint) passes
- [ ] Verify on preview (`.aem.page`) that a parent path lists its direct children and the activity filters work; confirm empty render when index is absent
- [ ] Add **Adventure List (children)** sample to the DA `all-blocks` doc; publish preview + live
- [ ] Confirm with user whether the `/us/en/adventures` landing should switch to the new variant (and re-migrate if yes)
- [ ] Commit on a fresh branch off `main`, push, open PR with before/after preview URLs

> Note: this plan is not yet executed — switching to **Execute mode** is required to implement it.
