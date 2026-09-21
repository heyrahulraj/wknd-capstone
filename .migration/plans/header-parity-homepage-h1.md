Let me investigate the header block and home page before writing the plan.Let me look at the desktop `.nav-brand` overrides and the header min-height at desktop, then check the home page source for the H1 change.Now I understand the header structure. Let me check the source (wknd.site) header dimensions to confirm the target values, and check the home page content for the H1.Let me check the hero block to understand how its heading renders (relevant to the H1 fix approach).The H1 question needs a decision: the source homepage has no H1, and this is an authoring/content change. Since content lives in Document Authoring (not the repo) and the review note says "promote the hero heading to # Heading in the document," I need to know how the user wants the H1 added. Let me also confirm the home hero's current heading level. Let me check the home importer for hero structure.I have enough to plan. Two decisions materially change the approach — let me confirm them.# Review-Comment Fixes — Header (logo, height) + Home H1

## Objective
Address three review comments on branch `review-comment`, matching the source within tolerance, without regressing the current UI:
1. **Logo width** — candidate 128px everywhere → source **96px** (Δ32, tol ±8).
2. **Header height** — candidate 128/176px → source **117px mobile / 194px desktop**.
3. **Home page H1** — home page has 0 `<h1>`; add exactly one (the strongest SEO/a11y signal). Listing/article templates already have one, so this is the **home page only**.

## Decisions (from clarification)
- **H1:** make it a **Document Authoring content edit** on the home doc (promote the hero title to `# Heading`), **also apply it to the local content copy**, and at the end **produce a list of the exact paths changed** so the user can sync to DA manually. (Not a code/parser change.)
- **Header:** do the logo fix **and** retune header min-height / brand padding so rendered heights land near 117 mobile / 194 desktop (within ±8).

## Current state (from code inspection)
- `header nav .nav-brand img { width: 128px }` — single rule, used at all widths (confirms the review finding: desktop size used everywhere). → change to **96px**.
- `header { min-height: 118px }` (mobile) and `@media (width>=900px){ header { min-height: 166px } }` — candidate ~128/176 rendered. Heights are driven by min-height + `.nav-brand` padding (mobile `padding:16px`, desktop `padding:40px 40px 40px 0`) + utility bar. → retune so rendered ≈ 117 / 194.
- Home hero uses the `hero` (banner) block; its heading currently renders at the level authored in the doc (not `<h1>`). The home doc needs the hero title promoted to `#` (H1).

## Approach & guardrails
- **Logo:** change the one `img` width to 96px. Shrinking the logo slightly reduces the mobile header's natural height, which actually helps hit 117px.
- **Header height:** treat 117/194 as targets within ±8. Adjust `min-height` (mobile→~117, desktop→~194) and, if needed, `.nav-brand` padding, then **measure the real rendered `header` height** at 390/768/1280 via Playwright and iterate until within tolerance. Keep sticky behavior, CLS-safe min-height, and the scrolled-state transition intact.
- **H1 (home only):** in the DA home document, promote the hero heading to `# Heading` so it emits `<h1>`; mirror the same edit in the **local content copy** of the home page. Verify the rendered home page then has **exactly one** `<h1>` and that no other heading was demoted/duplicated. Confirm listing/article templates still have their single H1 (unchanged).
- **No unrelated CSS churn**; changes scoped to `blocks/header/header.css` (+ the home content doc). Re-verify header/nav layout (utility bar, drawer, search, sections) is visually unchanged apart from the intended logo/height deltas.
- **Verification widths:** 390 (mobile), 768 (tablet), 1280 (desktop) — logo width, header height, single-H1 count, no layout regression.

## Checklist
- [ ] `blocks/header/header.css`: set `header nav .nav-brand img { width: 96px }` (replaces 128px, applies at all widths)
- [ ] Retune mobile `header { min-height }` toward ~117px; measure rendered header at 390px, iterate to within ±8
- [ ] Retune desktop `@media (width>=900px) header { min-height }` (and `.nav-brand` padding if needed) toward ~194px; measure at 1280px, iterate to within ±8
- [ ] Confirm logo renders 96px wide at mobile/tablet/desktop (within ±8 of source 96)
- [ ] Locate the home page content doc; promote the hero heading to `# Heading` (H1) in the **local** copy
- [ ] Verify rendered home page has **exactly one `<h1>`** (the hero title) and no duplicate/missing headings elsewhere
- [ ] Confirm listing + article templates still each carry exactly one H1 (no regression)
- [ ] Playwright check at 390/768/1280: logo width, header height (117/194 ±8), single H1, header/nav/drawer/search visually intact
- [ ] `npm run lint`
- [ ] Commit on `review-comment`; push; open PR with before/after test URLs and the measured logo/height/H1 numbers
- [ ] **Output the list of content paths changed** (home doc) so the user can sync them to Document Authoring manually

## Acceptance criteria
- ✓ Logo width 96px at every breakpoint (±8)
- ✓ Header height ≈ 117px mobile / 194px desktop (±8)
- ✓ Home page has exactly one `<h1>`; listing/article templates unchanged (still one each)
- ✓ No header/nav/home layout regression beyond the intended logo/height changes
- ✓ User receives an explicit list of changed content paths to sync to DA

## Notes
- **Execution requires Execute mode** — this plan edits `header.css` + the home content doc, runs Playwright measurements, lints, and opens a PR.
- The home H1 improves on the source (wknd.site also has no H1) — intentional, per the review note.
- Content edits are made locally and reported as paths to sync; DA upload of the home doc is the user's manual step unless they later ask me to push it.
