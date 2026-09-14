/* eslint-disable */
/* global WebImporter */
/**
 * Parser for adventure-list (children variant). Base: adventure-list.
 * Source: https://wknd.site/us/en/adventures.html (.image-list.list)
 *
 * Unlike the default adventure-list parser (which authors one link per child
 * page), the `children` variant authors a SINGLE cell holding the parent page
 * path. At render time the block lists that parent's direct child pages from
 * the query-index — no per-page links needed.
 *
 * Emits: <div class="adventure-list children"><div><div>/us/en/adventures</div></div></div>
 */
const PARENT_PATH = '/us/en/adventures';

export default function parse(element, { document }) {
  // one row, one cell = the parent path (as a link so it round-trips cleanly)
  const link = document.createElement('a');
  link.setAttribute('href', PARENT_PATH);
  link.textContent = PARENT_PATH;

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'adventure-list',
    variants: ['children'],
    cells: [[[link]]],
  });
  element.replaceWith(block);
}
