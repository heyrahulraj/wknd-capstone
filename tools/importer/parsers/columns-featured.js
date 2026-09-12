/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-featured. Base: columns.
 * Source: https://wknd.site/us/en.html (.teaser.cmp-teaser--featured)
 * Generated: 2026-09-12
 *
 * Structure (from library-description.txt): multiple columns/rows, first row = block name.
 * This variant: one content row with 2 columns:
 *   cell 1: image
 *   cell 2: text content (eyebrow/pretitle, heading, description, CTA)
 */
export default function parse(element, { document }) {
  const image = element.querySelector('img, .cmp-image img, [class*="image"] img');

  const eyebrow = element.querySelector('.cmp-teaser__pretitle, [class*="pretitle"], [class*="eyebrow"]');
  // Note: [class*="title"] must exclude pretitle/eyebrow, otherwise "cmp-teaser__pretitle"
  // (which contains the substring "title") would be captured as the heading.
  const heading = element.querySelector('h1, h2, h3, .cmp-teaser__title, [class*="title"]:not([class*="pretitle"]):not([class*="eyebrow"])');
  const description = element.querySelector('.cmp-teaser__description, [class*="description"], p:not([class*="pretitle"])');
  const ctaLinks = Array.from(
    element.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a, a[class*="action"]'),
  );

  const textCell = [];
  if (eyebrow) textCell.push(eyebrow);
  if (heading) textCell.push(heading);
  if (description) textCell.push(description);
  textCell.push(...ctaLinks);

  // Empty-block guard: nothing meaningful to place.
  if (!image && !textCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Single 2-column content row: [image, textContent]
  const cells = [[image || '', textCell]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-featured', cells });
  element.replaceWith(block);
}
