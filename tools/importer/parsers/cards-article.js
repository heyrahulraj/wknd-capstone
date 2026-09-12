/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-article. Base: cards.
 * Source: https://wknd.site/us/en.html (.image-list.list)
 * Generated: 2026-09-12
 *
 * Structure (from library-description.txt): 2 columns, multiple rows.
 * First row = block name. Each subsequent row = one card:
 *   cell 1: image (mandatory)
 *   cell 2: text content (title, description, optional CTA)
 */
export default function parse(element, { document }) {
  const items = Array.from(
    element.querySelectorAll('.cmp-image-list__item, li'),
  );

  const cells = [];

  items.forEach((item) => {
    const image = item.querySelector('.cmp-image-list__item-image img, .cmp-image img, img');

    // Title: prefer the linked title so the href is preserved.
    const titleLink = item.querySelector('.cmp-image-list__item-title-link, a[class*="title"]');
    const titleText = item.querySelector('.cmp-image-list__item-title, [class*="item-title"]');
    const description = item.querySelector('.cmp-image-list__item-description, [class*="description"], p');

    const textCell = [];
    if (titleLink) textCell.push(titleLink);
    else if (titleText) textCell.push(titleText);
    if (description) textCell.push(description);

    // Skip stray items with neither image nor text.
    if (!image && !textCell.length) return;

    // 2-column row: [image, textContent]
    cells.push([image || '', textCell]);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
}
