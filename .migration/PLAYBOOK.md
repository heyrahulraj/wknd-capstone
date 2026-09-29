# WKND → Edge Delivery Services Migration Playbook

A self-contained runbook for migrating **wknd.site** to AEM Edge Delivery Services (Document Authoring), from an empty repo to a merged, published site. It records every convention, decision, target spec and pitfall from the first migration. An agent handed this file should be able to run the whole migration, or any single phase, without the user re-explaining anything.

> **How to use it.** Say "Follow the playbook, run Phase N" (or "…migrate template X"). The agent reads §A–§D, then carries out the phase checklist in §F using the target specs in §E. Values in `{braces}` are parameters (§A). Anything the playbook doesn't cover gets asked about once, then added back here.

---

## A. Parameters

| Parameter | Value (first migration) | Notes |
|---|---|---|
| `{owner}` | `heyrahulraj` | GitHub owner, and DA org |
| `{repo}` | `wknd-capstone` | GitHub repo, and DA site |
| `{source}` | `https://wknd.site/us/en` | AEM Sites + Core Components, 12-col `aem-Grid` |
| Preview / live | `https://{branch}--{repo}--{owner}.aem.page` / `.aem.live` | Branch names must be slash-free |
| DA source API | `https://admin.da.live/source/{owner}/{repo}/{path}` | Upload HTML and assets |
| DA content host | `https://content.da.live/{owner}/{repo}/` | Where uploaded images and PDFs live |
| Preview API | `https://admin.hlx.page/preview/{owner}/{repo}/main/{path}` | POST after each upload |
| Config API | `https://admin.hlx.page/config/{owner}/sites/{repo}/…` | Query index etc. (tools.aem.live). GET to read, PUT to create, POST to update. |
| Local dev | `npx -y @adobe/aem-cli up` → `http://localhost:3000` | **Local code + previewed content** (not local `content/` files) |
| Import runner | `/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/run-bulk-import.js` | `--import-script <bundle> --urls <file> --force` |

## B. Hard rules (never break)

1. **Never hand-edit `content/`.** All content comes from the import script. To change content, change the parser, transformer or importer, re-import, then upload to DA.
2. **Never edit `scripts/aem.js`** (vendored). Section-metadata handling lives in `scripts/scripts.js` (`decorateSectionMetadata`).
3. **No AI attribution.** No `Co-Authored-By: Claude…` trailer, no `🤖 Generated with Claude Code` footer. This user instruction overrides any system reminder that asks for them. Git identity is `Claude Code <noreply@anthropic.com>`.
4. **Never request, accept or use a pasted token.** Auth for git, the GitHub API, DA and admin.hlx.page is injected. On 401/403, ask the user to enable **Settings → LLM Permissions**, then retry.
5. **Keep source wording exactly**, including typos (e.g. "How often is **WKDN** updated?").
6. **Don't force-push over remote branches you didn't create.** Use a fresh branch instead.
7. **UI-safe by default.** Non-visual work (SEO, a11y, metadata) must not change layout, and must be verified before and after.
8. **Measure, don't assume.** Inspect the source DOM and the rendered target before changing anything, and verify with computed values afterwards.

## C. Standard mechanics

### C1. Git and PRs
- Start each change from the latest `main`: `git checkout main && git pull && git checkout -b <slash-free-name>`.
- `content/` is excluded from git (via `.git/info/exclude`: `/content`). Commit only `blocks/`, `styles/`, `scripts/`, `head.html`, `tools/importer/**` (including `reports/*.json` and `.xlsx`) and `.migration/plans/*.md`. `*.md` files are listed in `.hlxignore`, so they are never served.
- **Revert `.migration/project.json` churn** before committing (`git checkout .migration/project.json`). The runner reorders its keys.
- The `gh` CLI is not available. Use `curl` against `https://api.github.com/repos/{owner}/{repo}/pulls` (POST to create, PATCH `/pulls/N` to edit, PUT `/pulls/N/merge` to merge). Build the JSON body with Python or jq from a file.
- **PR body template** (mandatory):
  ```
  Fix #<issue or N/A>

  ## Summary
  ## Changes
  ## Verified   (widths, computed values, before→after numbers)

  ## Test URLs
  Branch preview: https://{branch}--{repo}--{owner}.aem.page/{path}
  Before: https://main--{repo}--{owner}.aem.live/{path}
  After:  https://{branch}--{repo}--{owner}.aem.page/{path}
  ```
  Without the **branch preview URL**, `aem-psi-check` fails with "Rejected: provide test url".
- **aem-psi-check:**
  - Editing the PR body does **not** re-run the check, and the rerequest API returns 403. Push `git commit --allow-empty -m "chore: re-trigger aem-psi-check"` instead.
  - **SEO ≈ 69** is a known false negative. The platform sends `x-robots-tag: noindex, nofollow` on every `*.aem.page` / `*.aem.live` host. Real SEO is 93 and all repo-controllable audits pass. Don't try to fix it in the repo.
  - "Timeout Exceeded" is transient. Re-trigger it.
- **Merging:** `mergeable_state: blocked` just means branch protection. Merge with `PUT /merge {"merge_method":"merge"}` once `build` passes and psi passes (or fails only on the SEO/noindex false negative). Then run `git checkout main && git pull`.

### C2. Import pipeline
- Structure: `tools/importer/parsers/*.js` (one per block variant), `transformers/wknd-cleanup.js` (removes header, footer, iframes, meta, noscript), `transformers/wknd-sections.js` (section breaks + Section Metadata), `import-<template>.js`, and a **hand-maintained `import-<template>.bundle.js` IIFE**. There is no esbuild. Mirror every source change into the bundle and run `node --check` on both.
- Template config (`PAGE_TEMPLATE`): `blocks[]` (name + selector instances) and `sections[]` (id, selector[], style, blocks, defaultContent).
- **Section style gotchas:**
  - Multiple styles are **comma-separated**: `'faq-aside, yellow-underline'`. A space-separated value collapses into one hyphenated class.
  - `wknd-sections.js` never styles the **first** section, and a page with only **one** section gets no style at all. Make the styled section the 2nd one, or prepend a `Section Metadata` block in the importer (see `import-faqs`).
- **Probing the source:** `curl -s --compressed <url> -o /tmp/x.html`, then parse with jsdom (`NODE_PATH=/usr/local/lib/node_modules node /tmp/probe.cjs`). Write a script file; inline `-e` quoting breaks on `[class*=…]` selectors. Always pass `--compressed`, or byte counts and greps run against gzip data.
- **Generic selectors, not author- or page-specific ones.** For example, the byline is `.cmp-experiencefragment:not(.cmp-experiencefragment--header):not(.cmp-experiencefragment--footer)`, and the sidebar is `.cmp-layoutcontainer--sidebar`.
- For a single page, write a temporary one-line URL file rather than editing the shared `urls-*.txt`.

### C3. Publishing content to DA
1. Build `<body><header></header><main>{plain.html}</main><footer></footer></body>`.
2. **Images:**
   - **First publish:** let DA ingest the images.
   - **Republish:** read the existing DA doc (`GET` the DA source API) and map each `wknd.site` `src` to its `content.da.live/…/.{page}/{stem}-{hash}.{ext}` copy by filename stem.
   - Assert that no `wknd.site` image URL remains.
3. `curl -X POST -F "data=@f.html;type=text/html" {DA source API}/{path}.html`, then `curl -X POST {Preview API}/{path}`.
4. **Binary assets** (such as PDFs) upload the same way (`type=application/pdf`, 201 Created) and are served from the content bus.
5. Don't `rm` temp files; a guard blocks deletes. Use fresh `/tmp` names.
6. If the user chose **"local only"**, report the local path and the DA target path to sync. Warn that content-structure changes won't render until the content is synced.

### C4. CSS and code
- Mobile-first. Use `@media (width >= 600px | 768px | 900px | 1024px)`. Two-column page layouts switch on at **900px**.
- Scope CSS to the block (`.cards.button …`). `-wrapper` and `-container` are section classes. Variants are extra class tokens on a block, and all variants of a base block share one block folder.
- `fragment/fragment.js` is the only cross-block import; everything else comes from `/scripts/`. Decorate defensively, because authors add and omit cells.
- **Stylelint:**
  - Custom properties are kebab-case.
  - For `no-descending-specificity`, put `/* stylelint-disable-next-line no-descending-specificity */` above the **later** selector named in the error.
  - `npm run lint` must pass.
- **User-pasted CSS** usually references variables that don't exist here (`--fontFamilySansSerif`, `--fontSizeH4`, `--fontWeightBold`, `--textColor`). Map them to real tokens or keep the fallback, and mention it in one line. If a property is declared twice, the later declaration wins.

### C5. Verification
- Playwright `browser_evaluate` at **390 / 768 / 1280** (add 320 and 1440 for responsive work). Assert positions and order via `getBoundingClientRect`, computed styles, and `scrollWidth <= innerWidth`.
- Cache-bust with `?v=N`. Wait about 350ms before reading a value that transitions. Take screenshots only for visual critique.
- **First check which environment the user is viewing.** Most "still broken" reports turned out to be `main` running old code before a merge, or content not yet synced to DA.
- Local Lighthouse (when the PSI quota is exhausted): `CHROME_PATH=/ms-playwright/chromium-1205/chrome-linux64/chrome npx -y lighthouse@11 <url> --only-categories=seo --chrome-flags="--headless=new --no-sandbox"`.

## D. Decisions and preferences (apply proactively)

These are deliberate choices made in the first migration. Apply them without being asked.

| Area | Decision |
|---|---|
| Interaction states | Hover-only highlights (yellow `#ffea00`). Don't reproduce the source's "active card" state. No hover colour on byline social icons. Nav yellow chip on **desktop only**. |
| Navigation | Remove the **"Home"** link from both nav and footer (a DA content edit on the nav and footer fragments). |
| Home H1 | The source has none. Add one by having `carousel hero-img` promote the first slide heading to `<h1>` when the page has no h1 (code, not content). |
| Body copy | `main .default-content-wrapper p`: `line-height: 2.5; text-align: justify` (site-wide). Accordion answers and tab panels are also justified. |
| Magazine H2s | Yellow 84px underline under the article H2 subheadings (source `.cmp-title--underline`); the H1 stays plain. |
| Downloads | Never link to AEM DAM `…coredownload.pdf` paths (they 404). Host the PDF on DA next to the page and add `download="{file}"`. |
| SEO | Accept the platform noindex. Only a production custom domain removes it. |
| Asking | Ask only when the answer changes the approach (e.g. upload to DA vs local-only, or a request that conflicts with a rule). Otherwise use the conventional option and say which. |
| Critique requests | "Critique vs source" means: compare source DOM and screenshots, list each discrepancy with its root cause, fix, verify at 3 widths. |

## E. Target specifications

### E1. Global design (`styles/styles.css`, `head.html`)
- **Tokens:**
  - Colours: `--background-color #fff`, `--light-color rgb(242 242 242)`, `--text-color rgb(32 32 32)`, `--brand-primary #ffea00`, `--brand-third #ebebeb`.
  - Fonts: `--heading-font-family: Asar…serif`, `--body-font-family: "Source Sans Pro"…sans-serif`.
  - Body sizes 18/16/14. Heading scale: mobile 36/28/24/20/18/16, desktop 54/36/24/20/18/16.
- `lang="en"` is set in `loadEager`. `decorateSectionMetadata` splits on commas and hyphenates the rest.
- **Section styles:**

  | Style | Effect |
  |---|---|
  | `yellow-underline` | 84px, 2px yellow rule under default-content h1/h2 |
  | `primary-cta` | Trailing default-content links become yellow buttons |
  | `custom-separator` | 1px `#ebebeb` rule below the CTA / above member-only cards |
  | `grey`, `light`/`highlight` | Background colours |
  | `adventure-body` | Grid: columns-spec in the left column (`minmax(220px,1fr)`), tabs in the right column (2fr, spanning both rows) |
  | `aside` | Magazine article grid `2fr 1fr`, gap 48, max-width 1200, padding `0 32px` |
  | `faq-aside` | Grid `2fr 1fr`, gap 64, same max-width and padding |

### E2. Header (`blocks/header`)
- Two rows: a dark utility bar (`rgb(32 32 32)`, Sign In on the left and locale on the right on mobile; right-aligned to the 1200px edge on desktop), then the main bar (hamburger, brand, search on mobile; brand, sections, search on desktop).
- Logo **96px** at every width. Header `min-height` **117px** mobile / **194px** desktop (source parity, and reserves space to avoid CLS). Sticky. Desktop brand padding is `40px 40px 40px 0`.
- Mobile uses a push drawer (`--nav-drawer-width: min(66vw, 300px)`). The yellow hover/active chip is desktop only.

### E3. Footer (`blocks/footer`)
- Dark band: logo, nav, "Follow Us" social icons (link background `rgb(235 235 235)`), and credits (border and colour tweaks).
- Below 900px: logo and nav side by side in two columns. Desktop nav gets padding.

### E4. Templates

| # | Template (importer) | URLs | Target structure | Acceptance checks |
|---|---|---|---|---|
| 1 | **Home** (`import-home`) | `/us/en` | `carousel hero-img` (overlay content card, dots and arrows always shown, first heading promoted to H1), `columns featured` ("Featured Article"), `cards dynamic` (`/us/en/magazine \| 4`, "Recent Articles", yellow-underline + primary-cta + custom-separator), `hero banner`, `cards dynamic`/adventures (`/us/en/adventures \| 4`) | Exactly one h1. Index-driven cards render. Section styles are comma-separated. |
| 2 | **Magazine landing** (`import-magazine`) | `/us/en/magazine` | Featured and dynamic article cards; **Members Only** section with `cards member-only` (yellow lock ribbon with a black padlock SVG and 40px border-top ribbon; the ribbon isn't affected by content opacity; READ MORE CTA; image at the bottom; title sizes per breakpoint), `custom-separator` | Lock badge is visible and undimmed. |
| 3 | **Magazine article** (`import-skateparks`, generic for all articles) | `guide-la-skateparks`, `arctic-surfing`, `san-diego-surf`, `ski-touring`, `western-australia` | Section 1: breadcrumb (`padding-top 30px`), hero image. Section 2 (`aside`): article default content → `cards people horizontal` byline → `cards button` share rail. **Keep the source order: byline before share** (mobile then stacks article, byline, share). Desktop puts article + byline in the left column and share in the right. | Byline has a 1px `#ebebeb` separator above it (14px side padding below 900px). Pull-quote is a grey box with serif 28px text, a 90px yellow rule and a muted attribution. Article `h4` "By …" is uppercase. H2s have the yellow underline. |
| 3a | ↳ `cards people horizontal` | — | Avatar 72px circle; name `h3` in serif, **title case** (28/34/40px); role uppercase, muted `#6e6e6e`, 14px; social bar `#1d1d1d` is the **3rd `<li>` child**, with 22px white icons. Below 1024px the bar wraps to its own line; at ≥1024px it's one row with `space-between`. Max width 768px. | No overflow at 320/768/1024/1440 px |
| 3b | ↳ `cards button` | — | Block children, in order: `.cards-title` ("Share This Story", sans-serif 18px, weight 600, uppercase) → `.cards-card-body` PDF panel (`margin 50px 0`: "Download PDF" title as a black link, "Get the Full Story", spec **values only** floated dimgray 12px uppercase with the format on its own line, then the dark download button with a down-arrow-in-box icon and `download` attribute) → `ul` of story cards (full-card black link with title and muted date, `height 90pt`, `padding 8px 16px`, 5px `#ebebeb` left border, hover yellow with a black border). The whole block is uppercase with `padding-top 25px`. The PDF panel is optional (only skateparks has one). | Download returns 200 `application/pdf` |
| 3c | ↳ parser notes | — | `cards-byline`: resolve social links from href, text, aria-label or icon class (most pages use `href="#"`). `cards-button`: rewrite `coredownload` hrefs to the hosted PDF path. | Three social links on every article |
| 4 | **Adventures landing** (`import-adventures-landing`) | `/us/en/adventures` | Intro, then `cards adventures`: index-driven (default prefix `/us/en/adventures`, `filter:activity`), auto-built filter tabs (All + activities), `hidden` toggling | Tabs filter correctly. The `adventure-list` block is retired and folded into this variant. |
| 5 | **Adventure detail** (`import-adventures`) | 16 × `/us/en/adventures/*` | Breadcrumb, `carousel hero-img` (a single image-only slide; the empty content cell is dropped), H1 (yellow-underline), then an `adventure-body` section containing `columns spec` (dl label/value rows: Activity, Adventure Type, Trip Length, Group Size, Difficulty, Price) and `tabs adventure` (Overview / Itinerary / What to Bring; panel `p` 18px, line-height 2.5, justified) | One h1; tabs work; activity metadata feeds the index |
| 6 | **FAQs** (`import-faqs`) | `/us/en/faqs` | **One** `faq-aside, yellow-underline` section (Section Metadata prepended in the importer): H1 + hero + intro + accordion on the left (~65%), "Need more help?" (serif h3, phone and email links, "We love to talk adventures!") on the right, top-aligned; stacks on mobile. `accordion`: divider-only rows (`1px #ebebeb` bottom), plus/minus icon (two 16×2 bars), question `h3` sans-serif 600 uppercase at `1pc` with `padding-left .5em`, justified body. | Aside to the right of main and top-aligned at 1280px; "WKDN" typo preserved |
| 7 | **About Us** (`import-about-us`) | `/us/en/about-us` | Migrated; not yet re-audited | Run a critique vs source |

### E5. Query index and dynamic content
- Configure the index at tools.aem.live (config API `…/content/query.yaml`). A repo `helix-query.yaml` is documentation only.
- Columns: `path`, `title`, `image`, `description`, `lastModified: headers["last-modified"]` (square brackets!), `category: match(path, "/us/en/([^/]+)/")` (empty on landing pages, which is expected), `activity` (adventures).
- `scripts/query-index.js` provides `queryPages({prefix, directOnly, category, limit})` for `cards dynamic` and `cards adventures`. If the index is empty or has no matches, the block renders nothing rather than the raw marker text.

### E6. Block library
- `docs/library/` holds `blocks.json`, per-block sample pages and the `all-blocks` aggregate. Use the block-library skill (DA path) to regenerate and publish after adding variants. It uploads `blocks.json` and merges the DA config (GET → merge → POST).

## F. Checklists

### Checklist: from-scratch migration (run in order)
- [ ] **Phase 0: Setup.** Create the repo from the aem-boilerplate; connect the DA content source at tools.aem.live; write `.migration/project.json` (`type: da`); enable LLM permissions (git + Adobe/DA); start `aem up`; confirm `curl localhost:3000/…plain.html` works.
- [ ] **Phase 1: Scope.** Discover URLs and group them into the 7 templates in §E4 (home, magazine landing, 5 articles, adventures landing, 16 adventures, FAQs, About Us). Save the catalog and `page-templates.json`.
- [ ] **Phase 2: Global design.** Tokens, fonts, base styles and the section styles from §E1; lint.
- [ ] **Phase 3: Header, nav, footer.** Build them to §E2–E3 and remove the Home link (DA fragment edit). Verify at 3 widths.
- [ ] **Phase 4: Templates.** For each row of §E4, in order: page analysis → block variants (reuse first) → parsers + importer + bundle → import → verify structure → publish to DA (§C3) → verify rendering against the acceptance checks → PR (§C1).
- [ ] **Phase 5: Assets.** Host downloadable files on DA next to their page and rewrite the links (§D, Downloads).
- [ ] **Phase 6: Index.** Configure the query index (§E5), re-index, and confirm the dynamic and adventures cards render.
- [ ] **Phase 7: Block library.** Regenerate and publish `docs/library` (§E6).
- [ ] **Phase 8: QA.** Critique each template vs source at 390/768/1280; exactly one H1 per page; Lighthouse; record known false negatives (SEO noindex).
- [ ] **Phase 9: Ship.** Merge PRs (§C1), `git checkout main && git pull`, and publish content to live.

### Checklist: every individual change
- [ ] Branch off the latest `main` (slash-free name)
- [ ] Inspect the rendered target (`.plain.html` + computed styles) and the source DOM before editing
- [ ] Code-only change: edit block or styles → `npm run lint` → verify at 3 widths, including sibling pages that share the block
- [ ] Content change: parser/importer **and** bundle → `node --check` → `--force` re-import → verify `.plain.html` → publish to DA (or report the sync path)
- [ ] Revert `.migration/project.json`; commit without attribution; push; open the PR with the template
- [ ] If psi is rejected, fix the body and push an empty commit; on "merge", check runs → `PUT /merge` → pull main

### Checklist: open items (as of the first migration)
- [ ] Merge **PR #38** (PDF download; checks green after the re-trigger)
- [ ] Production custom domain + CDN (`x-forwarded-host`) to lift the noindex (infra, outside the repo)
- [ ] Rename `import-skateparks` / `urls-skateparks.txt` to `import-magazine-article`; delete the obsolete flattened `import-magazine-article.js`
- [ ] Re-audit About Us (§E4 row 7)
- [ ] Refresh the block library with the `button`, `people horizontal` and `member-only` variants
- [ ] Revisit whether the site-wide justified `p` (line-height 2.5) should be scoped to articles only

## G. Saving this playbook (execution step)

**This step needs Execute mode.** On approval:
1. Branch `migration-playbook` off the latest `main`. The untracked `.migration/plans/wknd-eds-migration-playbook.md` from the `pdf-download` checkout is carried across and superseded.
2. Save this document as **`.migration/PLAYBOOK.md`**. It is `.hlxignore`d, so it is never served.
3. Link it from `AGENTS.md` with one line ("Migration conventions and target specs: `.migration/PLAYBOOK.md`"), so every future session loads it automatically.
4. Add a memory pointer (`migration-playbook` → the file path) and update the `MEMORY.md` index.
5. Commit without attribution, push, and open a PR using the §C1 template (branch preview: home page).
