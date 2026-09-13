/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-banner. Base: hero.
 * Source: https://wknd.site/us/en.html (.teaser.cmp-teaser--hero)
 * Generated: 2026-09-12
 *
 * Structure (from library-description.txt): 1 column, 3 rows.
 * Row 1 = block name.
 * Row 2 (single cell): background image (optional).
 * Row 3 (single cell): title, subheading/description, CTA (all optional).
 */
export default function parse(element, { document }) {
  const bgImage = element.querySelector('.cmp-teaser__image img, .cmp-image img, img[class*="background"], img');

  const heading = element.querySelector('h1, h2, h3, .cmp-teaser__title, [class*="title"]:not([class*="pretitle"])');
  const description = element.querySelector('.cmp-teaser__description, [class*="description"], p');
  const ctaLinks = Array.from(
    element.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a, a[class*="action"]'),
  );

  const textCell = [];
  if (heading) textCell.push(heading);
  if (description) textCell.push(description);
  textCell.push(...ctaLinks);

  // Empty-block guard.
  if (!bgImage && !textCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // 1-column block: each row is one cell. Image row only if present.
  const cells = [];
  if (bgImage) cells.push([[bgImage]]);
  cells.push([textCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', variants: ['banner'], cells });
  element.replaceWith(block);
}
