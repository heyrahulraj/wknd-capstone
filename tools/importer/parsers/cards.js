/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-article. Base: cards.
 * Source: https://wknd.site/us/en.html (.image-list.list)
 * Generated: 2026-09-12
 *
 * Structure: 2 columns, multiple rows. First row = block name.
 * Each subsequent row = one card:
 *   cell 1: linked image + linked title (both point at the article href)
 *   cell 2: description text
 */
export default function parse(element, { document }) {
  const items = Array.from(
    element.querySelectorAll('.cmp-image-list__item, li'),
  );

  const cells = [];

  items.forEach((item) => {
    const image = item.querySelector('.cmp-image-list__item-image img, .cmp-image img, img');

    // Title text + the article href (from the title link or the image link).
    const titleLink = item.querySelector('.cmp-image-list__item-title-link, a[class*="title"]');
    const imageLink = item.querySelector('.cmp-image-list__item-image-link, a[class*="image-link"]');
    const titleTextEl = item.querySelector('.cmp-image-list__item-title, [class*="item-title"]');
    const titleSource = titleTextEl || titleLink;
    const titleText = titleSource ? titleSource.textContent.trim() : '';
    const href = (titleLink && titleLink.getAttribute('href'))
      || (imageLink && imageLink.getAttribute('href'))
      || '';

    const description = item.querySelector('.cmp-image-list__item-description, [class*="description"], p');

    // Skip stray items with neither image nor title.
    if (!image && !titleText) return;

    // Cell 1: linked image, then linked title (both use the article href).
    const mediaCell = [];
    if (image) {
      if (href) {
        const imgAnchor = document.createElement('a');
        imgAnchor.setAttribute('href', href);
        imgAnchor.append(image);
        mediaCell.push(imgAnchor);
      } else {
        mediaCell.push(image);
      }
    }
    if (titleText) {
      const titleAnchor = document.createElement('a');
      if (href) titleAnchor.setAttribute('href', href);
      titleAnchor.textContent = titleText;
      mediaCell.push(titleAnchor);
    }

    // Cell 2: description text.
    const descCell = [];
    if (description) descCell.push(description);

    // 2-column row: [linkedImage + linkedTitle, description]
    cells.push([mediaCell, descCell]);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', variants: ['article'], cells });
  element.replaceWith(block);
}
