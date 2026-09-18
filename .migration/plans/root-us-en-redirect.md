Let me investigate how this project is set up before planning the redirect approach.Bash is blocked in plan mode. Let me use read-only tools to inspect the setup.Let me look at how the root is configured and the head/config setup.# Root → /us/en Redirect Plan

## Goal
Redirect the site root `https://main--wknd-capstone--heyrahulraj.aem.live/` to `https://main--wknd-capstone--heyrahulraj.aem.live/us/en` using EDS's standard server-side redirects mechanism.

## Decisions (confirmed)
- **Mechanism:** `redirects.json` sheet (server-side edge redirect — no repo/code change, no flash, applies to preview + live).
- **Type:** Permanent **301**.
- **Scope:** **Exact root only** — `/` (and its `/index` equivalent). No other paths touched.

## How EDS redirects work (context)
- EDS reads a **redirects spreadsheet** published in the content tree — conventionally at the site root as `redirects` (served as `/redirects.json`). Columns: **Source**, **Destination** (some setups also support a **Type**/status column; default is 301).
- The AEM edge applies these **before** serving the page, so it's a true HTTP redirect.
- The sheet must be **created in DA and published** (preview + live) to take effect. It is content, not repo code — so nothing to commit, and `content/` is gitignored here.
- The site currently has **no** `redirects.json` (needs to be created). The repo has no redirect handling in `scripts.js` (confirmed), so the sheet is the clean path.

## Source value nuance
- EDS matches redirect **Source** against the request path. The root is normally represented as `/` — but because the boilerplate maps the root doc to `/index`, the sheet should cover the root robustly. Since you chose "exact root only," the sheet will contain the single canonical root entry (`/`). During verification I'll confirm whether the edge normalizes the root as `/` or `/index`; if `/` alone doesn't fire, add the `/index` row (still "root only," no scope creep).

## Proposed redirects sheet
| Source | Destination |
| --- | --- |
| `/` | `/us/en` |

(Single-sheet JSON: `{ total:1, offset:0, limit:1, data:[{ Source:"/", Destination:"/us/en" }], ":type":"sheet" }`. 301 is the EDS default, so no Type column needed; I'll add a `Type`/`302?`-style column only if you later want to override — not for this permanent case.)

## Delivery steps (require Execute mode)
1. Build the redirects sheet JSON locally (mirror of the DA doc) — under `content/` for reference; the authoritative copy is uploaded to DA.
2. Upload it to the DA Source API at `…/heyrahulraj/wknd-capstone/redirects.json` (root of the content tree). Auth is injected — no token in chat.
3. Publish `redirects` to **preview + live** via `admin.hlx.page` so the edge picks it up.
4. Verify with a non-following request to the live root — expect **301** with `Location: /us/en` (and confirm `/us/en` still returns 200). If the root only fires as `/index`, add that row and re-publish.
5. Report the before/after status codes.

## Risks / notes
- **Root-only by design:** deep links and every other path are unaffected.
- **No code/PR:** this is a DA content + publish operation; there's nothing to merge. (If you'd instead prefer it tracked in the repo, that would mean the client-side JS approach — not what you chose.)
- **Propagation:** publishing may take a few seconds to reflect at the edge; I'll re-check if the first probe misses.
- **301 caching:** browsers cache 301s hard. If the destination ever changes, it may require a cache-busting test in a fresh/incognito session — acceptable for a canonical homepage.

## Checklist
- [ ] Construct `redirects.json` single-sheet payload with `Source=/`, `Destination=/us/en`
- [ ] Upload `redirects.json` to the DA Source API at the site content root
- [ ] Publish `redirects` to preview (`admin.hlx.page/preview/...`)
- [ ] Publish `redirects` to live (`admin.hlx.page/live/...`)
- [ ] Verify live root: `curl -I /` → **301** with `Location` ending `/us/en`
- [ ] Verify `/us/en` still returns **200** (redirect target intact)
- [ ] If root only matches as `/index`, add the `/index` row, re-publish, re-verify (still root-only)
- [ ] Report before/after status codes to the user

> Note: this plan is not yet executed — switching to **Execute mode** is required to create and publish the redirects sheet.
