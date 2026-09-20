# Add `helix-query.yaml` to the Repo (index definition in version control)

## Why this wasn't done originally
This project's **`AGENTS.md` explicitly lists `helix-query.yaml` as *retired*** — "Config lives at tools.aem.live." Following that guidance, I defined the query index in the **tools.aem.live config service** instead, and it works: `/us/en/query-index.json` is live with all 26 pages and the columns `path, title, description, image, category, activity, lastModified`. That's why no `helix-query.yaml` exists in the repo — the running index is driven entirely by the config-service definition, which remains the source of truth.

## What you've asked for
Commit a `helix-query.yaml` to the repo that **mirrors the live index**, so the definition is version-controlled, reviewable in PRs, and recoverable from git.

## Important caveat (stated up front)
Because `helix-query.yaml` is marked retired for this project, **committing it may have no runtime effect** — the tools.aem.live config is what actually generates the index. So this file serves as **version-controlled documentation / disaster-recovery of the definition**, not necessarily the live driver. I'll verify after committing whether the pipeline picks it up (by checking if the index rebuilds/changes), and report which is authoritative. If it turns out the repo file *does* drive the index here, even better — but I won't assume it.

## The file to commit
`helix-query.yaml` at the repo root, mirroring the live config exactly:

```yaml
version: 1
indices:
  content:
    include:
      - /us/en/**
    exclude:
      - /us/en/nav
      - /us/en/footer
    target: /us/en/query-index.json
    properties:
      title:
        select: head > meta[property="og:title"]
        value: attribute(el, "content")
      description:
        select: head > meta[name="description"]
        value: attribute(el, "content")
      image:
        select: head > meta[property="og:image"]
        value: attribute(el, "content")
      category:
        select: none
        value: match(path, "/us/en/([^/]+)/")
      activity:
        select: head > meta[name="activity"]
        value: attribute(el, "content")
      lastModified:
        select: none
        value: parseTimestamp(headers["last-modified"], "ddd, DD MMM YYYY hh:mm:ss GMT")
```

(Exact copy of the working tools.aem.live definition — same `include`/`exclude`/`target`/`properties`, including the `headers["last-modified"]` bracket syntax that was the earlier fix.)

## Execution steps (require Execute mode)
1. Branch `bugfixes` is current; add `helix-query.yaml` there (or a fresh branch if you prefer it isolated).
2. Write the file at repo root with the definition above.
3. `git add helix-query.yaml`, commit, push.
4. After the push/merge, check whether the index re-generates from the repo file: re-fetch `/us/en/query-index.json` and confirm columns/rows unchanged (or updated) — and confirm the tools.aem.live config still matches. Report which one is authoritative.
5. Add a short note (in the commit message and/or `.migration/plans/`) that AGENTS.md marks this retired and tools.aem.live remains the source of truth, so future maintainers don't edit the repo file expecting it to take effect.

## Risks / notes
- **May be inert:** per AGENTS.md, the pipeline may ignore it — no harm, but don't expect editing it alone to change the live index.
- **Drift risk:** two definitions (repo file + tools.aem.live) can diverge. The commit note will call out that tools.aem.live is authoritative unless verification proves otherwise.
- **No `.hlxignore` needed:** it's a standard config filename; committing is safe. Does not affect served content.
- Scope is config only — no block/CSS/importer changes.

## Checklist
- [ ] Create/confirm working branch (`bugfixes` or a dedicated `index-config` branch)
- [ ] Write `helix-query.yaml` at repo root mirroring the live tools.aem.live definition (all 7 properties incl. `headers["last-modified"]`)
- [ ] `git add` + commit with a note that AGENTS.md marks it retired; tools.aem.live is authoritative
- [ ] Push branch, open PR with a test URL
- [ ] Verify post-push: re-fetch `/us/en/query-index.json`; confirm it still returns 26 rows with the expected columns (index not broken)
- [ ] Determine & report whether the repo file or tools.aem.live is actually driving the index
- [ ] Record the outcome (which is authoritative) in the PR description / `.migration/plans/`

> Note: this plan is not yet executed — switching to **Execute mode** is required. Heads-up: AGENTS.md marks `helix-query.yaml` retired, so the committed file may be documentation-only while tools.aem.live stays the live source of truth; I'll verify and report which one actually drives the index.
