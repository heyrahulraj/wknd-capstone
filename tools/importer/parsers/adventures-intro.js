/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the adventures landing intro. Base: carousel (variant hero-img).
 * Source: https://wknd.site/us/en/adventures.html (.teaser.cmp-teaser--hero)
 *
 * The intro promo (image + heading + description) becomes a single-slide
 * carousel/hero-img: one row, cell 1 = image, cell 2 = text content.
 */
export default function parse(element, { document }) {
  const image = element.querySelector('img, .cmp-image img, [class*="image"] img');

  const heading = element.querySelector('h1, h2, h3, .cmp-teaser__title, [class*="title"]:not([class*="pretitle"]):not([class*="eyebrow"])');
  const description = element.querySelector('.cmp-teaser__description, [class*="description"], p:not([class*="pretitle"])');
  const ctaLinks = Array.from(
    element.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a, a[class*="action"]'),
  );

  const textCell = [];
  if (heading) textCell.push(heading);
  if (description) textCell.push(description);
  textCell.push(...ctaLinks);

  if (!image && !textCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // single slide row: [image, textContent]
  const cells = [[image || '', textCell]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel', variants: ['hero-img'], cells });
  element.replaceWith(block);
}
