Let me examine the footer CSS structure and its existing breakpoints before planning.Let me confirm a couple of layout specifics the instruction leaves open before finalizing the plan.# Footer Mobile/Tablet Two-Column Layout Fix

## Goal
On **mobile and tablet only** (below the existing `900px` breakpoint), lay out the footer's **logo + nav links side-by-side**: WKND logo on the left, the nav links (MAGAZINE, ADVENTURES, FAQS, ABOUT US) as a vertical column to its right on the same horizontal band, top-aligned with even spacing. **Desktop (≥900px) stays exactly as-is.**

## Confirmed decisions
- **Scope of the two-column band:** logo + nav only. **Social icons and credits stay stacked full-width below**, as they are now.
- **Vertical alignment:** **top-aligned** (`align-items: flex-start`).
- **Viewport scope:** mobile/tablet = the default (mobile-first) rules, i.e. everything *outside* the existing `@media (width >= 900px)` block. Desktop rules are untouched.

## Current state (from the code)
- `blocks/footer/footer.js` wraps the four fetched sections in `.footer-content` and tags them in order: `.footer-brand` (logo), `.footer-nav`, `.footer-social`, `.footer-credits`.
- `blocks/footer/footer.css`:
  - Base (`.footer-content`) is a **single-column grid** with `gap: 24px` → everything stacks (logo, then nav, then social, then credits). This is the current mobile/tablet layout.
  - `.footer-nav ul` is already `flex-direction: column; gap: 12px` (base) → links stack vertically. **Good — the right column already wants a vertical list.**
  - The desktop 3-column grid + row nav lives entirely inside `@media (width >= 900px)` (lines 102–134).

## Design approach
Add a **mobile/tablet-scoped** rule (either the base `.footer-content`, or a `@media (width < 900px)` block to be explicit and avoid touching the base that the desktop grid overrides). Cleanest given the existing structure:

- Make `.footer-content` place **brand + nav on one flex row**, with social + credits still below. Two viable techniques:
  - **Option A (grid, minimal):** keep the grid but give it `grid-template-columns: auto 1fr` and areas `'brand nav' / 'social social' / 'credits credits'`, `align-items: start`. Reuses the existing grid model; social/credits span full width below.
  - **Option B (flex wrapper):** wrap just brand+nav — but they're siblings of social/credits, so this needs the grid/areas approach anyway. Option A is the natural fit.
- The instruction says "use a horizontal flex layout for the footer container." I'll reconcile that intent with the existing grid: the **logo + nav band** is horizontal (flex/grid row), the **nav links stay a vertical flex column** (already are). I'll implement the horizontal band + vertical link column and, if you specifically want the container itself to be `display: flex` rather than grid, I can do that in a `@media (width < 900px)` block — I'll note the grid-areas route is less disruptive and achieves the same visual. (Flagging this as the one interpretation choice; I'll default to the least-disruptive grid-areas approach unless you prefer literal flex.)

### Concrete change (default plan)
Add, scoped to `@media (width < 900px)` (so it can't leak into desktop and is self-documenting):
```css
@media (width < 900px) {
  footer .footer-content {
    grid-template-columns: auto 1fr;
    grid-template-areas:
      'brand nav'
      'social social'
      'credits credits';
    align-items: start;      /* top-aligned */
    column-gap: 24px;
  }
  footer .footer-brand { grid-area: brand; }
  footer .footer-nav { grid-area: nav; }
  footer .footer-social { grid-area: social; }
  footer .footer-credits { grid-area: credits; }
  /* nav links already column + gap:12px (even spacing) — no change */
}
```
- Preserves dark bg, typography, link styling (only positioning changes).
- Nav links remain the existing vertical `flex-direction: column; gap: 12px` → even vertical spacing, to the right of the logo.
- Social + credits span both columns underneath (stacked, full-width) — matches your "leave stacked below" choice.

> If the boilerplate's stylelint disallows `width < 900px` range syntax, fall back to `max-width: 899.98px` (or fold into the base rules since desktop already overrides `grid-template-columns`/areas). I'll confirm which the linter accepts during implementation.

## Verification
- Local preview at **375px (mobile)** and **768px (tablet)**: logo left, nav column right on one band, top-aligned, even gaps; social + credits stacked below; dark theme + link styles unchanged.
- **1280px (desktop)**: confirm the 3-column `brand nav social / credits` layout is **identical to before** (row nav, centered alignment) — no regression.
- `npm run lint` (stylelint) passes.

## Risks / notes
- **Don't touch the `@media (width >= 900px)` block** — desktop must stay pixel-identical.
- Range-syntax (`width < 900px`) vs `max-width` — pick whatever stylelint accepts to keep desktop cleanly excluded.
- Long nav labels + narrow phones: `1fr` nav column can wrap text; acceptable since links are short (MAGAZINE, ADVENTURES, FAQS, ABOUT US). Logo is fixed 128px so it won't shrink.
- Pure CSS change in `blocks/footer/footer.css`; no JS/content change. (The footer content itself is authored in DA, unaffected.)

## Checklist
- [ ] Add a mobile/tablet-scoped rule (`@media (width < 900px)`, or `max-width` fallback) putting `.footer-content` into a two-column band: `brand | nav`, with `social` and `credits` spanning full width below
- [ ] Set `align-items: start` (top-aligned) and a sensible `column-gap`
- [ ] Assign `grid-area`s (brand/nav/social/credits) for the mobile/tablet scope
- [ ] Confirm nav links keep the existing vertical column (`flex-direction: column; gap: 12px`) — even spacing, no style change
- [ ] Do NOT modify the `@media (width >= 900px)` desktop block
- [ ] Verify at 375px + 768px: logo left, nav column right, top-aligned, stacked social/credits below; dark bg + typography + link styles preserved
- [ ] Verify at 1280px: desktop layout unchanged (no regression)
- [ ] `npm run lint` passes
- [ ] Commit on the current branch, push, open PR with before/after test URLs

> Note: not yet executed — switching to **Execute mode** is required. One interpretation to confirm during build: I'll implement the horizontal logo+nav band via the existing grid-areas model (least disruptive) rather than converting the container to literal `display: flex`; both yield the same visual, and I'll flag if you specifically require flex.
