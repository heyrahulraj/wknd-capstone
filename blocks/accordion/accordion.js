/*
 * Accordion Block
 * Recreate an accordion: each row is one item (question + answer). The first
 * cell becomes the clickable summary, the second cell the collapsible body.
 * Built on the native <details>/<summary> element so it works without JS too.
 * https://www.aem.live/developer/block-collection/accordion
 */

export default function decorate(block) {
  [...block.children].forEach((row) => {
    // decorate accordion item label (question)
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    if (label) summary.append(...label.childNodes);

    // decorate accordion item body (answer)
    const body = row.children[1];
    if (body) body.className = 'accordion-item-body';

    // decorate accordion item
    const details = document.createElement('details');
    details.className = 'accordion-item';
    details.append(summary);
    if (body) details.append(body);
    row.replaceWith(details);
  });
}
