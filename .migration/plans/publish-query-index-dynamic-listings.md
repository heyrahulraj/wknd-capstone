# Index-Driven Listings Fix Plan

## Problem
No query index is published anywhere on the site — `/query-index.json`, `/us/en/query-index.json`, `/us/en/magazine/query-index.json`, and `/us/en/adventures/query-index.json` all 404. Every listing therefore falls back to hand-authored content:
- **Home:** two `cards (article)` blocks — 8 links + 4 images each, typed by hand.
- **Magazine (`/us/en/magazine`):** one `cards (article)` — 10 links + 5 images, typed by hand.
- **Adventures (`/us/en/adventures`):** `adventure-list` block — 16 authored links; titles/images/descriptions/filter tabs fetched live per page. Link-driven, not index-driven.

Consequence: publishing a new article changes nothing until someone edits those documents by hand.

## Correction to the source remarks
The remarks prescribe committing **`helix-query.yaml`**. This project's `AGENTS.md` explicitly says: *"`fstab.yaml`, `helix-query.yaml`, `paths.json` are retired. Config lives at tools.aem.live."* So a committed `helix-query.yaml` will **not** generate an index here. The real fix is to define the index at **tools.aem.live** and re-index. (You confirmed you'll do this step; I don't have write access — the config API returned 403 previously.)

`adventure-list.js` already requests `/us/en/query-index.json` first and only falls back to authored links on 404 — so **the adventures listing becomes fully dynamic the moment the index is published, with zero code change.**

## Decisions (confirmed)
- **Branch:** create `dynamic-indexing` from remote `main` **before** any execution work.
- **Index mechanism:** configured at **tools.aem.live** by you/an admin (not a repo file).
- **Scope:** convert **adventures + home + magazine** to index-driven.
- **Home/magazine approach:** add a **new `cards (dynamic)` variant** that reads the index by path prefix; the default authored `cards` behavior stays untouched (reversible).

## Index definition (spec to hand to the admin)
Define one index (target `/us/en/query-index.json`) covering `/us/en/**`, with columns:
- `path`, `title`, `description`, `image`, `lastModified`/`date`, and **`activity`** (from `<meta name="activity">`, already emitted on adventure pages via the earlier metadata fix) plus a **`category`/`template`** column (e.g. `magazine` vs `adventures`) so home/magazine listings can filter by section.

Prerequisite: adventure/magazine pages must be **published to live** so the indexer can crawl them (and pick up the `<meta name="activity">` markup).

## Work breakdown

### 0. Branch setup (do first)
- `git checkout main`, `git pull origin main`, then `git checkout -b dynamic-indexing`. All subsequent edits happen on this branch.

### A. Adventures listing — no code
Becomes dynamic automatically once the index exists. Verify only. If the index path/columns differ from what `adventure-list.js` expects, adjust the fetch/column names minimally.

### B. New `cards (dynamic)` variant (home + magazine)
- **`blocks/cards/cards.js`:** add a `dynamic` branch in `decorate`. When `block.classList.contains('dynamic')`:
  1. Read a **path prefix** + optional **category** + optional **limit** from the authored block (a single cell, e.g. `/us/en/magazine` — mirroring the `adventure-list children` authoring shape).
  2. Fetch the query index; filter rows by prefix (and category), sort by date desc, cap to limit.
  3. Build the same `cards (article)` DOM (linked image + linked title + description) from index columns — no per-page fetch needed since the index carries title/image/description.
  4. **No index / no matches → render nothing** (consistent with the `adventure-list children` variant decision) OR keep authored fallback — see open sub-decision below.
- **`blocks/cards/cards.css`:** reuse `.cards.article` styles; add `.cards.dynamic` only if any layout tweak is needed.
- Factor shared index-reading helpers so `cards.js` and `adventure-list.js` don't duplicate logic (small shared util in `/scripts/` or a local helper), without changing `adventure-list.js` behavior.

### C. Author/importer changes for home + magazine
- Update the home and magazine importers/parsers so their listing blocks emit `cards (dynamic)` with a prefix cell **instead of** the hand-typed links (empty the authored link lists).
- Re-import home + magazine; verify the listings render from the index.
- Note: these are content changes (publish via DA separately); code (block + importer) goes through a PR.

### D. Verify + ship
- Local/preview: with the index published, confirm all three listings render dynamically and a newly published article appears without editing documents.
- `npm run lint`; commit block + importer changes on the `dynamic-indexing` branch; open PR with before/after preview URLs.

## Open sub-decision (flag during implementation)
Home page is often an **intentionally curated** set. "Index-driven home" means it auto-lists by recency, which may not be desired for a hand-picked hero grid. I'll confirm whether the home cards should be fully dynamic (recency) or curated-but-index-backed before emptying its authored links.

## Risks / notes
- **Hard dependency on the tools.aem.live step** — none of the dynamic behavior works until the index is live; all code here is inert until then (adventures included).
- **`activity`/`category` columns** must be defined in the index for filter tabs / section filtering to work.
- **301/render caching** and index rebuild latency — verify in a fresh session after re-index.
- Keeping the authored `cards`/`adventure-list` fallbacks intact means **no regression** if the index is ever unavailable.

## Checklist
- [ ] Create branch `dynamic-indexing` from remote `main` (`git checkout main && git pull origin main && git checkout -b dynamic-indexing`)
- [ ] Hand off index spec to admin: define `/us/en/query-index.json` over `/us/en/**` with `path,title,description,image,date,activity,category` (you configure at tools.aem.live)
- [ ] Ensure adventure + magazine pages are published to live so the indexer can crawl them
- [ ] Trigger a bulk re-index; confirm `/us/en/query-index.json` returns 200 with expected columns
- [ ] Verify **adventures** listing renders dynamically (no code change)
- [ ] Confirm home-page intent: fully dynamic (recency) vs curated — before emptying authored links
- [ ] Add `cards (dynamic)` variant to `blocks/cards/cards.js` (prefix/category/limit, index-driven, reversible)
- [ ] Add `.cards.dynamic` CSS only if a layout tweak is needed (else reuse `.cards.article`)
- [ ] Extract shared index-reading helper without changing `adventure-list.js` behavior
- [ ] Update home + magazine importers/parsers to emit `cards (dynamic)` with a prefix cell; empty authored links
- [ ] Re-import home + magazine; verify listings render from the index
- [ ] Verify a newly published article appears on all listings with no document edits
- [ ] `npm run lint` passes
- [ ] Commit on `dynamic-indexing`, push, open PR with before/after preview URLs
- [ ] (Optional) Publish updated home/magazine/adventures content to DA so the fix is live

> Note: this plan is not yet executed — switching to **Execute mode** is required. The first execution step is creating the `dynamic-indexing` branch from remote `main`. Also, the core enabler (publishing the query index) happens at **tools.aem.live** and is outside the repo; the code changes here stay inert until that index is live.
