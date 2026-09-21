Let me inspect the current implementation to build an accurate plan.Now let me check the JS to understand the actual rendered DOM (where the social bar lives).Let me check how the social icon SVGs get their color, and confirm the name heading level and social markup.# Fix Cards (people, horizontal) Contributor Card — Responsive Behavior

## Goal
Correct the breakpoint behavior of the LA Skateparks author/byline block (migrated as **Cards (people, horizontal)**) so it matches the original WKND `.cmp-byline` + social bar across mobile / tablet / desktop.

## Findings (actual rendered DOM vs. the supplied CSS)
The provided CSS targets a DOM that differs from what this block actually renders, so selectors must be retargeted:

| Supplied CSS assumes | Real DOM (from `blocks/cards/cards.js` + `cards-byline` parser) |
|---|---|
| `.social` as a **third child of the `<li>`** | Social bar is `p.cards-social`, currently appended **inside** `.cards-card-body` |
| name is `<h2>` | name is `<h3>` (byline parser emits `h3`) |
| `.social a svg` | `a.cards-social-link svg` (white via `fill: currentcolor`, already set on base `.cards.people`) |
| `min-width` breakpoints @768/1024 | codebase convention is `@media (width >= …)`; current horizontal rules break at **600px** |

Other current state to reconcile:
- `.cards.people.horizontal` has `max-width: 768px; margin-right: auto` (keeps the byline aligned to the article's left column) — **keep**.
- Base `.cards.people .cards-social` is `width: 164px` dark strip — must be **overridden** in the horizontal variant.
- Base `.cards.people .cards-social-link svg` is `24px` — horizontal override will set `22px` per target.
- The block lives in the `aside` section left column at desktop; the byline separator (`border-top`, 14px side padding on mobile/tablet) added previously must remain intact.

## Approach
1. **JS (scoped to horizontal only):** place `p.cards-social` as a **direct third child of the `<li>`** (after `.cards-card-image` and `.cards-card-body`) so the `<li>` flex-wrap can drop the social bar to its own line. Leave the base (non-horizontal) `people` variant unchanged (its social bar stays centered inside the body).
2. **CSS:** replace the current `.cards.people.horizontal` rules (including the `@media (width >= 600px)` block) with mobile-first rules retargeted to the real classes (`.cards-social`, `h3`) and the project's `width >=` breakpoints at **768px** and **1024px**.
3. Verify layout, lint, and (since the parser/JS changed) re-import + republish is **not** needed — the social bar is moved at decorate time in JS, and the byline content DOM is unchanged. Only code (JS/CSS) changes.

## Target responsive behavior
- **Mobile (< 768px):** `<li>` is `flex-wrap: wrap`; avatar (circle, ~72px) + name/role on line 1; dark social bar `flex: 1 0 100%` wraps to its own line, left-aligned.
- **Tablet (≥ 768px, < 1024px):** same stacked behavior; name larger; social bar sized to content, still on its own line.
- **Desktop (≥ 1024px):** `flex-wrap: nowrap; justify-content: space-between` — avatar + name/role left, dark social bar pushed hard-right on the same row (`margin-left: auto`).

## Checklist
- [ ] Read `blocks/cards/cards.js` `decorate()` people branch and confirm where `.cards-social` is appended
- [ ] JS: for the **horizontal** variant only, append `socialRow` to the `<li>` (third child) instead of `.cards-card-body`; keep base `people` behavior (social inside body) unchanged
- [ ] CSS: make avatar a circle — `.cards.people.horizontal .cards-card-image img { width/height 72px; border-radius: 50%; object-fit: cover }`
- [ ] CSS base/mobile: `.cards.people.horizontal > ul > li { display:flex; flex-wrap:wrap; align-items:center; gap:16px 24px }`
- [ ] CSS: name `h3` serif 28px/line-height 1.1; role `p` uppercase, muted (`#6e6e6e`), 14px, letter-spacing .04em
- [ ] CSS: override base dark bar — `.cards.people.horizontal .cards-social { flex:1 0 100%; display:flex; align-items:center; gap:28px; width:auto; background:#1d1d1d; padding:18px 24px; margin:0 }`
- [ ] CSS: social icons white at 22px — `.cards.people.horizontal .cards-social-link svg { width:22px; height:22px }` (color already white on base)
- [ ] CSS tablet `@media (width >= 768px)`: name 34px; `.cards-social { flex:0 0 auto }` (own line, content-sized)
- [ ] CSS desktop `@media (width >= 1024px)`: `li { flex-wrap:nowrap; justify-content:space-between }`; name 40px; `.cards-social { flex:0 0 auto; margin-left:auto }`
- [ ] Remove the superseded `@media (width >= 600px)` horizontal rules and the old `.cards-card-body { flex-direction:row; justify-content:space-between }` byline approach
- [ ] Confirm the byline separator (border-top + 14px mobile/tablet side padding) and the aside grid placement (byline in left column) still hold
- [ ] `node --check blocks/cards/cards.js` and `npm run lint` pass
- [ ] Verify in preview at **320px, 768px, 1024px, 1440px**: circle avatar; serif name; uppercase/muted role; white icons on dark bar; social wraps below on mobile/tablet, hard-right on desktop; **no horizontal overflow**
- [ ] Commit to `mags-remigrate` and push to PR #33

## Acceptance criteria
- ✓ Desktop (≥1024px): avatar + name/role left, social bar hard-right on the same row
- ✓ Tablet & mobile: social bar wraps to its own line under the name/role
- ✓ Avatar is a perfect circle; name is serif; role is uppercase/muted
- ✓ Social icons render white on the dark bar
- ✓ No horizontal overflow at 320px, 768px, 1024px, and 1440px

## Notes
- Deviations from the supplied snippet are intentional selector fixes for the real DOM: `.social` → `.cards-social`, `h2` → `h3`, `min-width` → `width >=`, plus overriding the base `.cards.people .cards-social` width/size. Behavior and breakpoints match the request.
- **Execution requires Execute mode** — this plan makes JS + CSS edits, runs lint, and pushes to PR #33.
