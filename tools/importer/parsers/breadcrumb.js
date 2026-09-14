/* eslint-disable */
/* global WebImporter */
/**
 * Parser for breadcrumb (adventures template). Base: breadcrumb.
 * Source: https://wknd.site/us/en/adventures/*.html (.breadcrumb.cmp-breadcrumb--fixed)
 *
 * The breadcrumb is generated dynamically at render time from the URL path, so
 * the authored block carries no content — it's just a marker div. This replaces
 * the source's static breadcrumb list with an empty `breadcrumb` block.
 */
export default function parse(element, { document }) {
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'breadcrumb',
    cells: [['']],
  });
  element.replaceWith(block);
}
