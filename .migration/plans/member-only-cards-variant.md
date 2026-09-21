Let me inspect the current cards block, how the member-only content is authored, and how other card variants render, before finalizing the plan.Now let me check how the current "Members Only" section is authored/migrated (the magazine page uses a `cards-secure` parser) and its rendered structure.Bash is blocked in plan mode. Let me use read-only tools.I don't have that file in this session's context yet. Let me read it and the cards.css and CSS variant-region.The Members Only cards currently use the `article` variant (image, title, description, no link — since the content is gated). Now let me check the cards.css to understand the article variant styling I'll override, and the section-metadata mechanism for the divider.I have enough to understand the structure. Let me confirm a few implementation choices with the user before finalizing, since the plan spec leaves some specifics open (how the variant is wired into the importer, and the section divider authoring).# Cards `member-only` Variant (WKND Members Only)

## Goal
Add a new **`member-only`** variant to the Cards block for the WKND "Members Only" section. Authored as **`Cards (member-only)`** → classes `cards member-only`. All variant styling scoped under `.cards.member-only`; all JS guarded by `block.classList.contains('member-only')`. Default cards and other variants untouched. Wire it end-to-end: block code + importer + re-migrate the magazine page, plus a section-level divider.

## Confirmed decisions
- **Wire-up:** implement the variant in `cards.js`/`cards.css` **and** update the `cards-secure` parser (+ magazine importer & bundle) to emit `cards member-only`, then re-import the magazine page.
- **READ MORE target:** use the card's authored link if present; otherwise render an **inert `<button>`** labelled "READ MORE" (no destination) — content is gated.
- **Section divider:** reuse the existing **`custom-separator`** section-metadata style (already in `styles.css`) on the Members Only section — authored at section level, not in the block.

## Current state (verified)
- `cards.js` `decorate()` branches: `adventures` → `dynamic` → then base loop (which also handles `people`). Each `<li>` gets `.cards-card-image` (cell with `<picture>`) and `.cards-card-body` (everything else). I'll add a `member-only` branch.
- Members Only is currently authored via `tools/importer/parsers/cards-secure.js` → emits `cards` **article** variant, cells `[image, [title(h3), description(p)]]`, **no link** (gated).
- `cards.css`: base `.cards` grid `repeat(auto-fill, minmax(257px,1fr))`; `.cards.article` overrides. I'll append a `.cards.member-only` block only.
- Default card DOM per `<li>`: `.cards-card-image` (picture) then `.cards-card-body` (h3 + p). Member-only needs order: title(+lock) → subtitle → READ MORE → image.

## Design

### A. `cards.js` — `member-only` branch (guarded)
Add near the top of `decorate()`:
```js
const isMemberOnly = block.classList.contains('member-only');
```
Reuse the existing base loop to build `<li>`s (image cell → `.cards-card-image`, rest → `.cards-card-body`), then when `isMemberOnly`, per `<li>`:
1. **Lock badge:** prepend `<span class="card-lock">` containing an inline SVG padlock (black) to the `<li>`. The yellow triangle ribbon is drawn in CSS (`.card-lock::before`); the SVG sits on top. `<li>` gets `position: relative` via CSS.
2. **READ MORE CTA:** in `.cards-card-body`, find an authored `<a>`. If present, add class `cards-readmore` (keep its href). If none, create `<a class="cards-readmore" role="button">READ MORE</a>` with no href (inert). Insert **after the subtitle**.
3. **Layout order:** move `.cards-card-image` to the **end** of the `<li>` (DOM reorder: `li.append(imageDiv)`), so order is body(title→subtitle→button) then image. (DOM reorder preferred per spec; CSS `order` as fallback.)
- Guard everything so default/article/people/dynamic paths are unchanged.

### B. `cards.css` — `.cards.member-only` scope (append only)
- `.cards.member-only > ul > li { position: relative; overflow: hidden; }` (anchor badge; clip ribbon).
- **Lock badge:** `.cards.member-only .card-lock` absolute top-left; `::before` = yellow right-triangle ribbon (borders trick or clip-path) using `--brand-primary, #ffea00`; the SVG padlock positioned over it, black fill.
- **Title:** `.cards.member-only .cards-card-body h3 { text-transform: uppercase; font-family: <sans>; font-weight: 700; color: <muted gray>; }` (override the article serif/title-case/dark).
- **Subtitle:** keep uppercase gray (reuse article's description styling, scoped).
- **READ MORE button:** `.cards.member-only .cards-readmore { display:inline-block; background:<light-gray>; color:<gray>; text-transform:uppercase; border-radius:0; padding:…; text-decoration:none; }`.
- **Image at bottom:** since DOM is reordered, just ensure image spacing; (fallback `order` rules if needed).
- Keep the two-column grid — do **not** touch `.cards > ul` base or `.cards.article` grid; member-only can set its own `grid-template-columns: repeat(2, 1fr)` if the section needs exactly two columns (matches current Members Only 2-up).

### C. Importer — emit `cards member-only`
- Update `tools/importer/parsers/cards-secure.js`: change `variants: ['article']` → `variants: ['member-only']`. (Optionally rename file/registry key, but keeping `cards-secure` as the parser name is fine.)
- Mirror in the magazine bundle (`import-magazine.bundle.js`) inline `parseCardsSecure` and any `page-templates.json` reference.
- Re-import the magazine page; verify the Members Only block renders `cards member-only`.

### D. Section divider (section-level, not block)
- In the magazine importer, add `custom-separator` to the Members Only section's `style` (section-metadata) so a full-width rule sits between the "Sign in to un-lock…" intro and the cards. Confirm `custom-separator` in `styles.css` renders a top rule; if it's a below-rule, use it on the appropriate section or add a minimal `border-top` variant. Keep the "Members Only" heading + yellow underline unchanged.

## Verification
- Local preview `/us/en/magazine`: each Members Only card shows **title(+lock badge top-left: yellow triangle + black padlock) → subtitle → READ MORE → image at bottom**; two-column grid; dark-on-light styling; heading/underline unchanged; a thin full-width rule above the cards.
- Confirm **default cards** (home/adventures/article/people/dynamic) are visually unchanged (scoped selectors).
- `npm run lint` (eslint + stylelint) passes.

## Risks / notes
- **Scope discipline:** every new CSS rule under `.cards.member-only`; every JS mutation under the `isMemberOnly` guard — no regression to other variants.
- **Lock ribbon:** CSS triangle + absolutely-positioned SVG; ensure `overflow:hidden` on `<li>` clips the ribbon corner cleanly and the badge doesn't overlap the title text (add top padding to body if needed).
- **Inert button a11y:** if no link, use `<a class="cards-readmore" role="button" aria-disabled="true">` or a real `<button type="button">` so it's not a broken link. Will pick the lint-clean option.
- **Bundle parity:** the hand-assembled magazine bundle must mirror the parser change or the re-import won't emit the variant.
- Content re-import publishes via DA separately; the block/CSS/importer changes go in the PR.

## Checklist
- [ ] Add `member-only` branch in `blocks/cards/cards.js` (guarded by `classList.contains('member-only')`): build lock badge span+SVG, insert READ MORE (authored link or inert button), reorder image to bottom
- [ ] Append `.cards.member-only` rules to `blocks/cards/cards.css`: `li` position/relative + overflow, lock ribbon (`::before` yellow triangle) + padlock, uppercase bold gray title, gray uppercase subtitle, light-gray rectangular READ MORE, image-at-bottom spacing, two-column grid
- [ ] Verify default `.cards` + article/people/dynamic/adventures unaffected (scoped selectors only)
- [ ] Update `tools/importer/parsers/cards-secure.js` to emit `variants: ['member-only']`
- [ ] Mirror the change in `tools/importer/import-magazine.bundle.js` (inline parser) + any `page-templates.json` ref
- [ ] Add `custom-separator` section style to the Members Only section (magazine importer) for the divider; keep heading + yellow underline unchanged
- [ ] Re-import the magazine page; confirm Members Only emits `cards member-only` with correct order + badge
- [ ] Verify in preview at desktop + mobile: layout order, lock badge, READ MORE, divider, two-column grid, dark/light styling
- [ ] `npm run lint` passes
- [ ] Commit on current branch, push, open PR with before/after test URLs (no AI-attribution footer)

> Note: not yet executed — switching to **Execute mode** is required. Content re-import/publish happens via DA separately; the code + importer changes go through the PR.
