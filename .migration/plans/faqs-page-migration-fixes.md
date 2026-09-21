Let me investigate the current FAQ migration — content structure, accordion block, and importer — before writing the plan.The content has 3 sections: (1) H1+hero+intro, (2) accordion, (3) "Need more help?". No section-metadata or columns block currently. Let me examine the accordion block and importer.Now let me check the FAQ importer and the existing `aside` section CSS (from the magazine work) that I can reuse, plus the source page's actual DOM structure.Let me check the existing `.section.aside` CSS I built for magazine pages (reusable) and the styles for section layouts.# FAQ Page Re-Migration — Source Parity Fixes

## Objective
Fix 8 layout/styling/content-placement discrepancies on the migrated FAQs page so it is visually indistinguishable from the source (`wknd.site/us/en/faqs.html`) at desktop, while preserving all text/links (including source typos like "WKDN").

## Approach decisions (from clarification)
- **Two-column layout:** use a **section-metadata grid** — one `aside`-style section holding main content (left ~65%) + "Need more help?" (right ~30%), stacking on mobile. Reuse the established `.section.aside`/grid pattern from the magazine pages (new style token, e.g. `faq-aside`, to avoid coupling to the article-specific rules).
- **DA:** re-import + verify **locally only**; do **not** upload. Report the content path to sync to DA manually.

## Current state (from inspection)
- Content = 3 stacked sections: (1) H1 + hero + intro, (2) `accordion`, (3) "Need more help?" — no columns/aside, so it renders one full-width column with the aside at the bottom (matches the reported bug).
- Importer `import-faqs.js` emits `rc1` (intro, `yellow-underline`), `rc2` (accordion), `rc3` (Need more help) as **separate sections**.
- `accordion.css`: full `1px` borders around each item (boxed) + a **chevron** `::after`; `[open]` body has a yellow top border. Summary is `font-weight:700` but not uppercase/sans-serif-forced/smaller.
- The `yellow-underline` section style already exists in `styles.css` (short 84px yellow rule under h1/h2) — item #3 may already be wired via `rc1` style; must verify it actually renders (the review says it's missing on target).

## Fixes mapped to work

**Structural (importer + re-import) — items 1, 2:**
- Restructure the importer so the intro (H1/hero/intro), accordion, and "Need more help?" land in **one section** styled for the two-column grid: main-content wrapper (left) + a distinct aside wrapper (right). Likely approach: emit a section with `style` = `faq-aside yellow-underline`, put "Need more help?" content in its own default-content wrapper that CSS assigns to grid-column 2, and everything else to column 1. Confirm aside text is exactly the three source lines with phone + `mailto:` links (source currently uses `href="#"`; match source — keep as-is unless source uses real `tel:`/`mailto:`, to verify from source DOM).
- Re-import → verify structure in `faqs.plain.html` → **do not upload** (report path).

**CSS-only — items 3, 4, 5, 6, 7, 8** (apply to `styles.css` for the section layout + `blocks/accordion/accordion.css` for accordion):
3. **Heading accent:** ensure the short yellow underline renders beneath the FAQs H1 (verify `yellow-underline` style is applied to the section; add if missing).
4. **Accordion icon:** replace chevron `::after` with a **plus** (＋) that becomes **minus** (−) on `[open]`.
5. **Item dividers:** remove full `1px` box borders; use only a **bottom divider** rule per row (open, minimal look). Remove the yellow `[open]` top border if it deviates from source.
6. **Question text:** `text-transform: uppercase`, bold, **sans-serif** (`--body-font-family`), smaller size — replace the current serif/sentence-case look.
7. **Hero image:** constrain to the main (left) column width and match source aspect ratio/crop (contain within column, not full-width landscape).
8. **Intro paragraph:** `text-align: justify`, source body font-size + larger line-height.

## Verification
- Re-render locally at **desktop (1280)** and **mobile (390)**; compare against source screenshot/DOM for each of the 8 items.
- Desktop: two columns (main ~65% left, aside ~30% right, top-aligned); yellow underline under H1; accordion = plus/minus icon, divider-only rows, uppercase bold sans-serif questions; hero constrained to left column; justified intro.
- Mobile: aside stacks below; no overflow.
- Confirm FAQ question wording unchanged (incl. "WKDN" typo) and all links preserved.

## Checklist
- [ ] Read source FAQ DOM to confirm exact aside markup, link types (`tel:`/`mailto:` vs `#`), hero aspect ratio, and accordion classes
- [ ] Restructure `import-faqs.js` + `.bundle.js`: single two-column section (main left + "Need more help?" aside right) with the grid style token; keep accordion in the left/main column
- [ ] Add `.section.<faq-style>` grid CSS in `styles.css` (main ~2fr / aside ~1fr at ≥900px, stacked on mobile, top-aligned)
- [ ] Ensure the yellow underline renders under the FAQs H1 (item 3)
- [ ] Accordion icon → plus/minus (item 4) in `accordion.css`
- [ ] Accordion rows → bottom-divider only, remove box borders + `[open]` yellow top border (item 5)
- [ ] Accordion questions → uppercase, bold, sans-serif, smaller (item 6)
- [ ] Hero image → constrained to main column + source aspect ratio (item 7)
- [ ] Intro paragraph → justified, source font-size + line-height (item 8)
- [ ] Re-import FAQs locally; verify `faqs.plain.html` structure (aside content intact, wording/links preserved incl. "WKDN")
- [ ] Playwright verify at 1280 + 390 against source for all 8 items; assert two-column desktop, stacked mobile, no overflow
- [ ] `npm run lint`
- [ ] Commit on `faq-remig`; push; open PR with before/after test URLs
- [ ] **Report the local content path(s) to sync to DA manually** (FAQs doc) — no upload performed

## Acceptance criteria
- ✓ Desktop: two-column layout — main content left (~65%), "Need more help?" aside right (~30%), top-aligned (not bottom)
- ✓ Aside has all three lines with phone + email links; serif "Need more help?" heading matches source
- ✓ Yellow underline beneath FAQs H1
- ✓ Accordion: plus/minus icon, divider-only rows (no boxes), uppercase/bold/sans-serif smaller questions
- ✓ Hero constrained to main column with source aspect ratio; intro justified with source font-size/line-height
- ✓ All text/links preserved (incl. "WKDN" typo); mobile stacks cleanly, no overflow
- ✓ User receives the content path to sync to DA (no DA upload done)

## Notes
- **Execution requires Execute mode** — this edits the FAQ importer + bundle, `styles.css`, `accordion.css`, runs a local re-import, Playwright verification, lint, and opens a PR.
- Accordion CSS changes are global to the `accordion` block (only used on FAQs today) — will confirm no other page uses it before finalizing.
- The `aside` grid token will be named distinctly (e.g. `faq-aside`) so it doesn't inherit the magazine article's `.section.aside` blockquote/byline rules.
