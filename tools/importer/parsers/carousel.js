/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero. Base: carousel.
 * Source: https://wknd.site/us/en.html (.carousel.cmp-carousel--hero)
 * Generated: 2026-09-12
 *
 * Structure (from library-description.txt): 2 columns, multiple rows.
 * First row = block name. Each subsequent row = one slide:
 *   cell 1: image (mandatory)
 *   cell 2: text content (title, description, CTA)
 */
export default function parse(element, { document }) {
  // Each slide is a carousel item containing a teaser. Fall back to teasers if
  // the item wrapper markup differs across pages.
  let slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));
  if (!slides.length) {
    slides = Array.from(element.querySelectorAll('.teaser, [class*="teaser"]'));
  }

  const cells = [];

  slides.forEach((slide) => {
    // Image cell
    const image = slide.querySelector('img, .cmp-image img, [class*="image"] img');

    // Text cell content
    const title = slide.querySelector('h1, h2, h3, .cmp-teaser__title, [class*="title"]');
    const description = slide.querySelector('.cmp-teaser__description, [class*="description"], p');
    const ctaLinks = Array.from(
      slide.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a, a[class*="action"]'),
    );

    // Skip empty slides (e.g. stray non-slide items).
    if (!image && !title && !description && !ctaLinks.length) return;

    const textCell = [];
    if (title) textCell.push(title);
    if (description) textCell.push(description);
    textCell.push(...ctaLinks);

    // 2-column row: [image, textContent]
    cells.push([image || '', textCell]);
  });

  // Empty-block guard: if no slides were extracted, unwrap and bail.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel', variants: ['hero-img'], cells });
  element.replaceWith(block);
}
