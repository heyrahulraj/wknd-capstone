Let me investigate the current download link and how the PDF would need to be hosted before planning.Let me check how static assets are served in this repo and whether binaries can be committed.I have enough to see the shape of the problem. Let me clarify the two decisions that determine the approach.# Enable Working PDF Download on LA Skateparks

## Objective
Make the "Download PDF" link on the LA Skateparks page actually download the guide instead of 404-ing. Fetch the source PDF, host it on the EDS content bus (Document Authoring), and point the page link at that working URL so it downloads as a file.

## Problem (confirmed)
The link href is `/content/dam/wknd-shared/en/magazine/la-skateparks/ultimateguidetolaskateparks.pdf.coredownload.pdf` — an **AEM-author DAM path** that has no equivalent on the EDS site, so it 404s. The requested target `.../ultimateguidetolaskateparks-pdf-coredownload-pdf` also doesn't exist as a real asset. There is no PDF anywhere in the repo or on the EDS site yet.

## Decisions (from clarification)
- **Host:** upload the real PDF to **Document Authoring** at a servable path under the site, so it serves from the content bus like pages/images.
- **Link update:** fix the `cards-button` parser to emit the working href, **re-import** skateparks, **upload** the updated doc to DA + preview.
- **Behavior:** **force download** (`download` attribute) so it saves `ultimateguidetolaskateparks.pdf`.

## Approach
1. **Fetch the source PDF** from `https://wknd.site/content/dam/wknd-shared/en/magazine/la-skateparks/ultimateguidetolaskateparks.pdf.coredownload.pdf` (verify it's a real PDF, ~139 KB per the page metadata).
2. **Choose a servable DA path.** DA source API serves assets from the content root. Target something clean and co-located with the page, e.g. `us/en/magazine/la-skateparks/ultimateguidetolaskateparks.pdf`. Its public URL becomes `https://main--wknd-capstone--heyrahulraj.aem.page/us/en/magazine/la-skateparks/ultimateguidetolaskateparks.pdf`. (Confirm the DA source API accepts a `.pdf` upload with `type: application/pdf`; adjust path/extension if the platform requires it.)
3. **Upload the PDF** to DA via the source API (auth injected), then **preview** it so it's served.
4. **Update the `cards-button` parser** (`cards-button.js` + bundle): rewrite the download href from the DAM `coredownload` path to the hosted PDF path, and mark the link so `cards.js` adds a `download` attribute (force-download). Keep the existing "Download PDF" label + icon + button styling.
5. **`cards.js`:** where it tags `.cards-download`, also set `download` (and the correct href already comes from the parser). Ensure both the panel title link and the button link point to the working URL.
6. **Re-import** skateparks locally → verify `guide-la-skateparks.plain.html` link href is the new path → **map images to existing DA copies** (as before) → **upload the page doc** to DA + preview.
7. **Verify** on the preview: the PDF URL returns HTTP 200 `application/pdf`; clicking "Download PDF" downloads the file (not 404); the panel renders unchanged otherwise.

## Open considerations (resolve during execution)
- **DA asset serving:** confirm whether DA serves arbitrary `.pdf` from the source API and what the resulting public path is; if `.pdf` isn't directly servable from the content bus, fall back to committing the PDF to the **code bus** (repo, e.g. `/assets/...pdf`) — flag this if the DA upload 404s on fetch.
- **Both link instances:** the panel has the href twice (title line + button). Decide whether both become the working download link (recommended) or only the button.
- **`.hlxignore`/serving:** if the PDF ends up in the repo instead, ensure it isn't excluded.

## Checklist
- [ ] Fetch the source PDF; confirm it's a valid `application/pdf` (~139 KB)
- [ ] Decide the servable DA path (`us/en/magazine/la-skateparks/ultimateguidetolaskateparks.pdf`) and confirm the DA source API accepts a PDF upload
- [ ] Upload the PDF to DA; trigger preview; verify its public URL returns 200 `application/pdf`
- [ ] Update `cards-button.js` + `import-skateparks.bundle.js`: emit the hosted PDF href for the download link(s)
- [ ] Update `cards.js`: add a `download` attribute to the `.cards-download` link (force-download), keep label/icon/styling
- [ ] Re-import skateparks locally; verify the link href in `guide-la-skateparks.plain.html` is the new working path
- [ ] Map page images to existing DA copies; upload the updated skateparks doc to DA + preview
- [ ] Verify on preview: "Download PDF" downloads the file (no 404); PDF opens/saves correctly; panel otherwise unchanged
- [ ] `npm run lint`
- [ ] Commit on the current branch; push; open PR with before/after test URLs (page + PDF URL)
- [ ] If DA can't serve the PDF, fall back to committing it to the repo and report the path used

## Acceptance criteria
- ✓ The PDF is hosted at a real, servable URL on the EDS site (200, `application/pdf`)
- ✓ "Download PDF" on the LA Skateparks page downloads `ultimateguidetolaskateparks.pdf` (force-download), no 404
- ✓ The share panel is otherwise visually unchanged
- ✓ Page content re-imported + uploaded so the working link is live on preview
- ✓ Lint passes; PR opened with test URLs

## Notes
- **Execution requires Execute mode** — this fetches + uploads a binary to DA, edits the parser/bundle + `cards.js`, re-imports, uploads the page doc, lints, and opens a PR.
- The originally-suggested target URL (`...-pdf-coredownload-pdf`) is a sanitized slug, not a real asset; the plan hosts a real `.pdf` and links to it instead so the download genuinely works.
