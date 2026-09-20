/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the magazine "Members Only" locked promos. Base: cards (article).
 * Source: https://wknd.site/us/en/magazine.html (.teaser.cmp-teaser--secure)
 *
 * Cards convention: 2 columns, one row per card. Cell 1 = image (mandatory),
 * cell 2 = text content (title + description). Each secure teaser is a locked
 * promo with an image, a title, and a short description but no link (content is
 * gated), so we collect the sibling secure teasers into a single `cards`
 * (article) block:
 *   cell 1: image
 *   cell 2: title (heading) + description
 *
 * The parser is idempotent: the first secure teaser builds the block from all
 * of its siblings; later ones are removed.
 */
export default function parse(element, { document }) {
  if (document.body.dataset.cardsSecureDone) {
    element.remove();
    return;
  }
  document.body.dataset.cardsSecureDone = 'true';

  const teasers = Array.from(document.querySelectorAll('.teaser.cmp-teaser--secure, .cmp-teaser--secure'));
  const cells = [];

  teasers.forEach((teaser) => {
    const image = teaser.querySelector('img, .cmp-image img, [class*="image"] img');
    const heading = teaser.querySelector('h1, h2, h3, .cmp-teaser__title, [class*="title"]');
    const description = teaser.querySelector('.cmp-teaser__description, [class*="description"], p');

    if (!image && !heading) return;

    // Cell 1: image (mandatory per cards convention).
    const mediaCell = [];
    if (image) mediaCell.push(image);

    // Cell 2: title heading + description.
    const textCell = [];
    if (heading) {
      const h = document.createElement('h3');
      h.textContent = heading.textContent.trim();
      textCell.push(h);
    }
    if (description) textCell.push(description);

    cells.push([mediaCell, textCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', variants: ['member-only'], cells });

  // Replace the first teaser with the block; drop the remaining teasers.
  element.replaceWith(block);
  teasers.forEach((t) => {
    if (t !== element && t.parentNode) t.remove();
  });
}
