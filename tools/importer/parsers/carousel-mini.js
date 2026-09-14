/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero-img (adventures template). Base: carousel.
 * Source: https://wknd.site/us/en/adventures/*.html (.carousel.cmp-carousel--mini)
 *
 * Carousel convention: 2 columns, one row per slide — cell 1 = image (mandatory),
 * cell 2 = optional text content. The mini carousel is an image-only hero (one
 * slide, no text), so each row has the image in cell 1 and an empty text cell.
 */
export default function parse(element, { document }) {
  // Each carousel item is one slide; fall back to any images if item markup differs.
  let slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));
  if (!slides.length) slides = [element];

  const cells = [];
  slides.forEach((slide) => {
    const image = slide.querySelector('img, .cmp-image img, [class*="image"] img');
    if (!image) return;
    // 2-column slide row: [image, emptyTextCell]
    cells.push([image, '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel', variants: ['hero-img'], cells });
  element.replaceWith(block);
}
