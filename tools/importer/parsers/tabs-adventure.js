/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-adventure (adventures template). Base: tabs.
 * Source: https://wknd.site/us/en/adventures/*.html (.tabs.panelcontainer → .cmp-tabs)
 *
 * Tabs convention: 2 columns, one row per tab — cell 1 = tab label (mandatory),
 * cell 2 = tab content (mandatory). The source pairs each `.cmp-tabs__tab` label
 * (in document order) with the `.cmp-tabs__tabpanel` at the same index.
 */
export default function parse(element, { document }) {
  const tabs = Array.from(element.querySelectorAll('.cmp-tabs__tab'));
  const panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));

  const cells = [];
  tabs.forEach((tab, i) => {
    const labelText = tab.textContent.trim();
    const panel = panels[i];
    if (!labelText || !panel) return;

    const labelEl = document.createElement('p');
    labelEl.textContent = labelText;

    // Panel content: keep meaningful nodes (paragraphs, images, headings, lists),
    // drop empty grid scaffolding and the redundant content-fragment title.
    const contentNodes = [];
    const source = panel.querySelector('.cmp-contentfragment') || panel;
    source.querySelectorAll('p, img, h2, h3, h4, ul, ol').forEach((node) => {
      if (node.classList && node.classList.contains('cmp-contentfragment__title')) return;
      if (node.tagName === 'IMG' || node.textContent.trim() || node.querySelector('img')) {
        contentNodes.push(node);
      }
    });
    if (!contentNodes.length) contentNodes.push(panel);

    // one tab per row, 2 columns: [label, content]
    cells.push([[labelEl], contentNodes]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs', variants: ['adventure'], cells });
  element.replaceWith(block);
}
