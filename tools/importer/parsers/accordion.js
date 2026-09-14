/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion. Base: accordion.
 * Source: https://wknd.site/us/en/faqs.html (.accordion.cmp-accordion, .cmp-accordion__item)
 *
 * Accordion convention: 2 columns, one row per item. Cell 1 = title (mandatory,
 * the clickable label), cell 2 = content (mandatory, revealed when expanded).
 * Each source accordion item has a header (.cmp-accordion__title — the question)
 * and a panel (.cmp-accordion__panel — the answer content):
 *   cell 1: question (title)
 *   cell 2: answer content (panel body)
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.cmp-accordion__item'));

  const cells = [];
  items.forEach((item) => {
    const title = item.querySelector('.cmp-accordion__title, .cmp-accordion__header, [class*="title"]');
    const panel = item.querySelector('.cmp-accordion__panel, [data-cmp-hook-accordion="panel"], [role="region"]');

    const questionText = title ? title.textContent.trim() : '';
    if (!questionText && !panel) return;

    // Cell 1: the question as a title label. Use an <h3> to preserve the
    // source's heading semantics (each question is an <h3> on wknd.site), so the
    // FAQ remains navigable by heading and eligible for FAQ rich results.
    const labelCell = [];
    if (questionText) {
      const label = document.createElement('h3');
      label.textContent = questionText;
      labelCell.push(label);
    }

    // Cell 2: the answer content. Prefer the meaningful content nodes inside the
    // panel (paragraphs/lists/media); fall back to the panel itself.
    const bodyCell = [];
    if (panel) {
      const paragraphs = Array.from(panel.querySelectorAll('p, ul, ol, img, picture'));
      if (paragraphs.length) bodyCell.push(...paragraphs);
      else bodyCell.push(panel);
    }

    cells.push([labelCell, bodyCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });
  element.replaceWith(block);
}
