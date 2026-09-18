/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the index-driven card listings. Base: cards (article dynamic).
 * Source: https://wknd.site/us/en.html and /us/en/magazine.html (.image-list.list)
 *
 * NOTE: this is a MARKER block, not a standard authored cards table. Instead of
 * one row per card (image + text), the `dynamic` variant authors a single cell
 * holding the path prefix to list (optionally `| limit`). At render time
 * cards.js reads the query-index and builds the article-style cards for every
 * page under that prefix (newest first) — so publishing a new page updates the
 * listing with no document edit. Same rationale as the adventure-list block.
 * The prefix is derived from the source list's own links; an optional
 * per-instance limit is passed in via opts.
 *
 * Emits: <div class="cards article dynamic"><div><div>/us/en/magazine | 4</div></div></div>
 */
export default function parse(element, { document }, opts = {}) {
  // derive the common prefix from the authored links (e.g. /us/en/magazine)
  const hrefs = [...element.querySelectorAll('a[href]')]
    .map((a) => (a.getAttribute('href') || '').replace(/\.html?$/, ''))
    .filter((h) => h.startsWith('/us/en/'));
  let prefix = opts.prefix || '';
  if (!prefix && hrefs.length) {
    // first three path segments after the leading slash: /us/en/<section>
    prefix = `/${hrefs[0].split('/').filter(Boolean).slice(0, 3).join('/')}`;
  }
  if (!prefix) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const value = opts.limit ? `${prefix} | ${opts.limit}` : prefix;
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cards',
    variants: ['article', 'dynamic'],
    cells: [[value]],
  });
  element.replaceWith(block);
}
