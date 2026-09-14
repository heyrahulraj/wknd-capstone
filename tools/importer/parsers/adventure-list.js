/* eslint-disable */
/* global WebImporter */
/**
 * Parser for adventure-list (adventures landing template). Base: adventure-list.
 * Source: https://wknd.site/us/en/adventures.html (.image-list.list)
 *
 * The listing is built dynamically at render time, but we author the block with
 * one link per adventure page so it works without a published query-index (the
 * block fetches each linked page for image/description/activity). One cell per
 * row: the article link.
 */
export default function parse(element, { document }) {
  // the source repeats the list per activity tab; only the first instance
  // becomes the block — later instances are dropped so we emit one list.
  if (document.body.dataset.adventureListDone) {
    element.remove();
    return;
  }
  document.body.dataset.adventureListDone = 'true';

  const seen = new Set();
  const cells = [];

  // collect links from every .image-list.list on the page (the "All" tab plus
  // per-activity tabs), deduped, so the single block covers all adventures
  document.querySelectorAll('.image-list.list a[href], a[href]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    // only adventure detail pages, once each
    if (!/\/adventures\/[^/]+\.html?$/.test(href)) return;
    const clean = href.replace(/\.html?$/, '');
    if (seen.has(clean)) return;
    seen.add(clean);

    const link = document.createElement('a');
    link.setAttribute('href', clean);
    link.textContent = (a.textContent || '').trim() || clean;
    cells.push([[link]]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'adventure-list', cells });
  element.replaceWith(block);
}
