Let me investigate the source page, the previous migration, the existing cards variants, and the right-rail pattern before planning.There's an existing right-rail-ish pattern (`adventure-body` — a 2-column section grid). Let me examine it, the current flattened migration, and the source page structure.Now let me look at the current flattened migration and the source page's actual structure (the two-column layout + Share This Story + author bio).Now I can see the flattened output clearly — everything (article + author bio + Share This Story + related links) is dumped into one default-content column. Let me examine the source page's DOM structure to identify the selectors for the two columns, the byline aside, and the share section.Bash is blocked in plan mode. I have enough from the flattened output to understand the content, and I've read the existing `adventure-body` right-rail pattern and cards variants. Two things need decisions: which right-rail mechanism to use, and whether new cards variants (`button`, `horizontal`) need building. Let me confirm with the user.# Re-migrate LA Skateparks Article — Two-Column Layout + New Cards Variants

## Goal
Re-migrate `https://wknd.site/us/en/magazine/guide-la-skateparks.html` so the article renders in a **left/main column** and the **"Share This Story" content renders in a right-hand aside** — fixing the previous migration that flattened everything into default content. Add two new Cards variants (`button`, and `people, horizontal`) and a new `aside` section layout.

## Problem with the current migration (confirmed)
`content/us/en/magazine/guide-la-skateparks.plain.html` dumps **everything** into one default-content column: article body **plus** the author bio (`Stacey Roswells` + social links) **plus** the entire "Share This Story" block (Download PDF, Get the Full Story spec list, related-story links). No aside, no author-bio card, no story buttons.

## Confirmed decisions
- **Right rail:** new **`aside`** Section Metadata style (CSS grid: main left, aside right) in `styles.css`, mirroring the existing `adventure-body` 2-col pattern.
- **New variants:** build **both** — `Cards (button)` (story buttons) and extend `people` with a **`horizontal`** variant (avatar-left / name+role / socials-right).
- **Active card:** **ignore** the `.active`/current-page highlight. Implement **hover-only** yellow highlight on story buttons (drop the `.active` rule from the spec).

## Target structure
**LEFT (default content):** hero image + breadcrumb, H1 "Ultimate Guide to LA Skateparks", byline "By Stacey Roswells", intro paragraph + pull quote, then the three skatepark sections (Vans / Moorpark / Venice) with their text/images/address lines.

**RIGHT (aside):** the "Share This Story" section as **Cards (button)** — SHARE THIS STORY label + Download PDF, the "Get the Full Story" panel (filename/size/format + Download PDF link), and the 4 related-story buttons (title + date).

**BOTTOM (full width, below the two columns):** author bio as **Cards (people, horizontal)** — circular avatar left, name "Stacey Roswells" + role "Artist, Photographer, Traveler", social icon group (Facebook/Twitter/Instagram) right.

## Design

### A. `aside` section layout (`styles/styles.css`)
- New rule `main > .section.aside { display: grid; grid-template-columns: 1fr; }` mobile → stacked; `@media (width >= 900px)` → `grid-template-columns: 2fr 1fr` (main wide, aside narrow), reset the boilerplate 1200px wrapper caps (as `adventure-body` does), `align-items: start`.
- Assign `.default-content-wrapper` → left column, the `cards`(button) block wrapper → right column. (Exact wrapper targeting confirmed against the generated DOM during build.)

### B. `Cards (button)` variant — `blocks/cards/cards.js` + `cards.css`
- **JS** (guarded by `classList.contains('button')`): each authored row = one "story button" `.card`: title link (line 1), optional description + date (line 2), optional "Download PDF" button. The SHARE label + top Download PDF and the "Get the Full Story" spec panel render as the rail header/first card.
- **CSS** (scoped `.cards.button`): per the spec — `.card { border-left: 5px solid var(--brand-third, #ebebeb); transition: … }`, `.card:hover { background: var(--brand-primary, #ffea00); border-left-color:#000; }`. **No `.active` rule** (per decision). Use kebab-case tokens `--brand-third`/`--brand-primary` with the literal fallbacks the repo already uses (stylelint rejects camelCase custom props).
- Vertical list layout in the narrow rail.

### C. `Cards (people, horizontal)` variant — `cards.js` + `cards.css`
- Extend the existing `people` handling: when `classList.contains('horizontal')`, lay the card out horizontally — circular avatar left, name+role middle/left, social icon group (existing `.cards-social` dark buttons) right.
- CSS scoped `.cards.people.horizontal`; reuse the existing social-icon SVGs + dark styling already in the people variant.

### D. Importer — `import-magazine-article` (+ bundle) & parsers
- The generic magazine-article importer currently emits only breadcrumb + default content. For this page I need section-aware parsing:
  - **Section 1 (aside):** wrap left article + right "Share This Story" under a section styled `aside`; parse the share/related content into a `cards button` block.
  - **Section 2:** author bio → `cards people horizontal` block.
- Add parsers: `cards-button.js` (story buttons + PDF panel) and reuse/extend the people parser (`cards-people.js`) with the horizontal token; update `import-magazine-article.js` + hand-assembled bundle + `page-templates.json` for this page's template. Given the article's unique two-column structure, this likely becomes a dedicated template/importer variant rather than the generic magazine-article one.
- **Open sub-decision (flag during build):** whether to make this a new `magazine-article-aside` template or special-case the generic one. I'll pick the least-disruptive route (probably a dedicated importer for this layout) and note it.

### E. Re-import + verify
- Re-import the page; confirm the `.plain.html` now has: default-content article (left), a `cards button` block + `section-metadata: aside`, and a `cards people horizontal` block — **nothing** from the aside left in default content.
- Verify in preview at desktop (two columns; aside right) + mobile (stacked): story buttons show left-border + yellow hover; author bio horizontal (avatar-left/socials-right).

## Acceptance criteria (from the request)
- ✓ Article in LEFT column; "Share This Story" in RIGHT aside — nothing from the aside in default content.
- ✓ Story buttons use `Cards (button)` with left-border + **hover** yellow (active highlight intentionally omitted per decision).
- ✓ Author bio uses `Cards (people, horizontal)` — avatar-left / socials-right.

## Risks / notes
- **Scope discipline:** all new CSS scoped to `.cards.button`, `.cards.people.horizontal`, and `.section.aside`; JS guarded by the variant class checks. No change to default cards / other variants / other pages.
- **camelCase custom props:** the spec's `--brandThird`/`--brandPrimary` will fail stylelint — I'll use `--brand-third`/`--brand-primary` with the `#ebebeb`/`#ffea00` fallbacks (same as the rest of the repo). Same visual result.
- **Aside content modeling:** the "Get the Full Story" spec list (filename/size/format) + two Download PDF links need a sensible card structure; I'll model the PDF panel as one card and each related story as its own button card.
- **Content re-import** publishes via DA separately (gitignored); the block/CSS/importer code goes in the PR. Live render of the page requires publishing the re-imported content.
- Dedicated importer vs generic: I'll confirm the cleanest wiring against the source DOM during execution.

## Checklist
- [ ] Add `aside` section layout to `styles/styles.css` (grid: main left / aside right ≥900px, stacked on mobile; reset wrapper caps)
- [ ] Add `Cards (button)` variant to `cards.js` (story buttons: title/date, Download PDF, PDF spec panel) guarded by `button` class
- [ ] Add `.cards.button` CSS: left-border 5px `--brand-third`, hover yellow `--brand-primary` + black left-border; no active rule
- [ ] Add `people, horizontal` variant to `cards.js` (avatar-left, name/role, socials-right) + `.cards.people.horizontal` CSS
- [ ] Add importer parser(s): `cards-button` (+ extend people parser for horizontal); wire a dedicated magazine-article-aside importer + bundle + page-templates entry
- [ ] Emit sections: `aside` section (article left + cards-button right) and author-bio `cards people horizontal` below
- [ ] Re-import the page; verify default content = article only; Share This Story in the aside; author bio as horizontal people card — nothing flattened
- [ ] Verify in preview (desktop two-column + mobile stacked): story-button border/hover, horizontal author bio
- [ ] `npm run lint` passes
- [ ] Commit on `mags-remigrate`, push, open PR with before/after test URLs (no AI-attribution footer)

> Note: not yet executed — switching to **Execute mode** is required. `--brandThird`/`--brandPrimary` will be implemented as kebab-case `--brand-third`/`--brand-primary` (stylelint), and the `.active` highlight is intentionally omitted in favor of hover-only, per your answers. Content re-import/publish happens via DA separately; code goes through the PR.
