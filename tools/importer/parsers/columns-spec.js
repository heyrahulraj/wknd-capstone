/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-spec (adventures template). Base: columns.
 * Source: https://wknd.site/us/en/adventures/*.html
 *   (.contentfragment.cmp-contentfragment--elements → dl.cmp-contentfragment__elements)
 *
 * Columns convention: multiple rows, each with the same number of columns. This
 * variant renders a labelled spec list — one row per spec, each row 2 columns:
 * [label, value] (e.g. "Activity" | "Surfing").
 */
export default function parse(element, { document }) {
  const items = Array.from(
    element.querySelectorAll('.cmp-contentfragment__element'),
  );

  const cells = [];
  items.forEach((item) => {
    const label = item.querySelector('.cmp-contentfragment__element-title, dt');
    const value = item.querySelector('.cmp-contentfragment__element-value, dd');
    const labelText = label ? label.textContent.trim() : '';
    const valueText = value ? value.textContent.trim() : '';
    if (!labelText && !valueText) return;

    const labelEl = document.createElement('p');
    labelEl.textContent = labelText;
    const valueEl = document.createElement('p');
    valueEl.textContent = valueText;

    // one spec per row, 2 columns: [label, value]
    cells.push([[labelEl], [valueEl]]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', variants: ['spec'], cells });
  element.replaceWith(block);
}
