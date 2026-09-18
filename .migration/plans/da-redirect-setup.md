# DA Redirect Implementation Guide: `/` → `/us/en`

This documents exactly what was changed in Document Authoring (DA) to implement the root redirect, written as a reproducible step-by-step guide. **No repo/code was changed** — EDS server-side redirects live in the content tree, not the codebase.

## What was created
A single DA content file — the **redirects sheet** — at the **root of the content tree**:

- **DA path:** `/heyrahulraj/wknd-capstone/redirects.json`
- **DA edit URL:** `https://da.live/edit#/heyrahulraj/wknd-capstone/redirects.json`
- **Served as:** `https://main--wknd-capstone--heyrahulraj.aem.live/redirects.json`

Its content (single-sheet JSON):
```json
{ "total":1, "offset":0, "limit":1,
  "data":[ { "Source":"/", "Destination":"/us/en" } ],
  ":type":"sheet" }
```
As a spreadsheet that's one row: **Source** `/` → **Destination** `/us/en`. (301 is the EDS edge default, so no status/Type column was needed.)

## Step-by-step (what I did via the DA APIs)
1. **Confirmed starting state** — live root `/` returned 200 (boilerplate index), `/us/en` returned 200, and `/redirects.json` was 404 (no redirects existed).
2. **Built the redirects sheet** JSON locally with the single `Source=/`, `Destination=/us/en` row.
3. **Uploaded it to DA** via the DA Source API (a `POST` of the file to `admin.da.live/source/heyrahulraj/wknd-capstone/redirects.json`). DA returned **201 Created** with the edit/content/preview/live URLs. Credentials were injected automatically — no token handled in chat.
4. **Published to Preview** — `POST admin.hlx.page/preview/heyrahulraj/wknd-capstone/main/redirects.json` → 200.
5. **Published to Live** — `POST admin.hlx.page/live/heyrahulraj/wknd-capstone/main/redirects.json` → 200.
6. **Verified** — root now returns **HTTP 301** with `location: /us/en` on both preview and live; `/us/en` still 200; following the chain lands on `/us/en` in one hop.

## The equivalent using the DA UI (no APIs, if you want to reproduce/edit by hand)
1. Open **`https://da.live/#/heyrahulraj/wknd-capstone`**.
2. At the **site root** (top level, same level as `us/`), create a new **sheet** named **`redirects`** (DA sheets publish as `/redirects.json`).
3. Give it two columns: **Source** and **Destination**.
4. Add one row: Source = `/`, Destination = `/us/en`.
5. **Save** (DA persists it), then **Publish** the `redirects` sheet (Preview + Publish) so the AEM edge picks it up.
6. Test in a fresh/incognito tab (301s cache hard): visiting the root should land on `/us/en`.

## How it works / notes
- EDS reads `redirects.json` at the content root and the **AEM edge applies the rule before serving the page** — a true server-side HTTP 301, no page flash, no JavaScript.
- **Scope is exact-root only:** only `/` redirects; every other path is untouched. The `/index` fallback row was not needed — the edge matched `/` directly.
- **301 = permanent**, so browsers cache it aggressively; if the destination ever changes, verify in a fresh session.
- To **change the destination later:** edit the Destination cell in the `redirects` sheet and re-publish. To **remove the redirect:** clear the row (or delete the sheet) and re-publish.

## Checklist (reproduction steps)
- [ ] Open DA at `https://da.live/#/heyrahulraj/wknd-capstone`
- [ ] Create a `redirects` sheet at the **content root** (publishes as `/redirects.json`)
- [ ] Add columns **Source** and **Destination**
- [ ] Add row: Source `/`, Destination `/us/en`
- [ ] Save the sheet in DA
- [ ] Publish `redirects` to **Preview**
- [ ] Publish `redirects` to **Live**
- [ ] Verify `curl -I https://main--wknd-capstone--heyrahulraj.aem.live/` → **301**, `location: /us/en`
- [ ] Verify `/us/en` still returns **200**

> Note: This artifact is documentation of an already-completed change (the redirect is live now). No further execution is required. If you'd like me to also capture this guide as a file in the repo (e.g. under `docs/`), that would be a new change requiring **Execute mode**.
