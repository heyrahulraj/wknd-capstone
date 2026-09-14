/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the about-us people grids. Base: cards (people).
 * Source: https://wknd.site/us/en/about-us.html
 *         (.experiencefragment.cmp-experience-fragment--contributor)
 *
 * Cards convention: 2 columns, one row per card. Cell 1 = image (mandatory),
 * cell 2 = text content (title heading + description + CTA links). Each person
 * is an experience fragment with an image, a name (h3), a role subtitle, and
 * three social buttons (Facebook / Twitter / Instagram). The page has two
 * people groups — "Our Contributors" and "WKND Guides" — separated by the
 * second underline title. We emit ONE `cards` (people) block per group, one row
 * per person:
 *   cell 1: image
 *   cell 2: name (heading) + role + social links (CTAs)
 *
 * Idempotent: the first fragment builds both blocks from all siblings; the rest
 * are removed.
 */
function buildRow(fragment, document) {
  const image = fragment.querySelector('img, .cmp-image img, [class*="image"] img');

  // Each person has two titles: the first is the name, the second is the role
  // subtitle (e.g. "Artist | Photographer | Traveler"). Only some fragments tag
  // the role with `cmp-title--black`, so select by order rather than that class.
  const titles = Array.from(fragment.querySelectorAll('.cmp-title__text, h1, h2, h3, h4, h5, h6'));
  const nameEl = titles[0] || null;
  const roleEl = titles[1] || null;

  // social buttons -> keep as links (CTAs)
  const buttons = Array.from(fragment.querySelectorAll('a.cmp-button, a[class*="button"]'));

  // Cell 1: image (mandatory per cards convention).
  const mediaCell = [];
  if (image) mediaCell.push(image);

  // Cell 2: name heading, role description, social CTA links.
  const textCell = [];
  if (nameEl) {
    const h = document.createElement('h3');
    h.textContent = nameEl.textContent.trim();
    textCell.push(h);
  }
  if (roleEl && roleEl !== nameEl) {
    const p = document.createElement('p');
    p.textContent = roleEl.textContent.trim();
    textCell.push(p);
  }
  buttons.forEach((btn) => {
    // Prefer the visible button text ("Facebook"/"Twitter"/"Instagram") — the
    // aria-labels on the source are inconsistent ("Facebook Social Media",
    // "instagram Ian provo", etc.), so use them only as a last resort.
    const labelEl = btn.querySelector('[class*="button__text"]');
    const label = (labelEl && labelEl.textContent.trim())
      || btn.textContent.trim()
      || btn.getAttribute('aria-label');
    const href = btn.getAttribute('href') || '';
    if (!label && !href) return;
    const link = document.createElement('a');
    if (href) link.setAttribute('href', href);
    link.textContent = label || href;
    const wrap = document.createElement('p');
    wrap.append(link);
    textCell.push(wrap);
  });

  if (!mediaCell.length && !textCell.length) return null;
  return [mediaCell, textCell];
}

export default function parse(element, { document }) {
  if (document.body.dataset.cardsPeopleDone) {
    element.remove();
    return;
  }
  document.body.dataset.cardsPeopleDone = 'true';

  const fragments = Array.from(document.querySelectorAll('.cmp-experience-fragment--contributor, .experiencefragment.cmp-experience-fragment--contributor'));
  if (!fragments.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Split the fragments into groups at each "underline" section title between
  // them (e.g. "WKND Guides"). Each run of fragments becomes one cards block.
  const dividers = Array.from(document.querySelectorAll('.title.cmp-title--underline'));

  // number of dividers appearing before a given node in document order
  const groupIndexOf = (node) => dividers.reduce((acc, d) => (
    d.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING ? acc + 1 : acc
  ), 0);

  const groups = new Map();
  fragments.forEach((frag) => {
    const key = groupIndexOf(frag);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(frag);
  });

  // Build a cards block per group and insert it at the position of that group's
  // first fragment; remove all fragments afterwards.
  [...groups.values()].forEach((groupFrags) => {
    const cells = [];
    groupFrags.forEach((frag) => {
      const row = buildRow(frag, document);
      if (row) cells.push(row);
    });
    if (!cells.length) return;
    const block = WebImporter.Blocks.createBlock(document, { name: 'cards', variants: ['people'], cells });
    groupFrags[0].before(block);
  });

  fragments.forEach((frag) => {
    if (frag.parentNode) frag.remove();
  });
}
