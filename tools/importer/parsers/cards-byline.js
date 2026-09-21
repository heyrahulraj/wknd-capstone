/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the article author byline. Base: cards (people, horizontal).
 * Source: .../guide-la-skateparks.html
 * Element: the byline experience fragment (.cmp-experiencefragment--stacey-roswells)
 * which contains the avatar/name/role (.cmp-byline) AND the author's social
 * links in a sibling button list — so the whole XF must be the element, not
 * the inner `.cmp-byline` (which excludes the socials).
 *
 * Cards convention: 2 columns, one row per card. One row here:
 *   cell 1: avatar image
 *   cell 2: name (h3) + role (p) + social links (Facebook / Twitter / Instagram)
 * cards.js (people variant) turns the social links into the dark icon bar and
 * the horizontal variant lays it out avatar-left / socials-right.
 */
export default function parse(element, { document }) {
  const image = element.querySelector('.cmp-byline__image img, .cmp-image img, img');
  const name = element.querySelector('.cmp-byline__name, h1, h2, h3, [class*="name"]');
  const role = element.querySelector('.cmp-byline__occupations, [class*="occupation"], [class*="role"]');
  // Social links: the network may be encoded in the href (#facebook-…), the
  // link/aria text ("Facebook"), or the button icon class
  // (.cmp-button__icon--facebook). Some pages use href="#" for all three, so
  // collect every anchor and classify below rather than filtering by href.
  const socialSel = [
    'a[href*="facebook"]', 'a[href*="twitter"]', 'a[href*="insta"]',
    '.cmp-button a', '.social a', 'a:has([class*="icon"])',
  ].join(', ');
  let socials = Array.from(element.querySelectorAll(socialSel));
  // de-dupe and keep only anchors that resolve to a known network
  const NETWORKS = [
    ['facebook', 'Facebook'],
    ['twitter', 'Twitter'],
    ['insta', 'Instagram'],
  ];
  const networkOf = (a) => {
    const hay = `${a.getAttribute('href') || ''} ${a.getAttribute('aria-label') || ''} ${a.textContent} ${a.querySelector('[class*="icon"]')?.className || ''}`;
    const m = NETWORKS.find(([k]) => new RegExp(k, 'i').test(hay));
    return m ? m[1] : null;
  };
  socials = socials.filter((a, i) => socials.indexOf(a) === i && networkOf(a));

  const mediaCell = [];
  if (image) mediaCell.push(image);

  const textCell = [];
  if (name) {
    const h = document.createElement('h3');
    h.textContent = name.textContent.trim();
    textCell.push(h);
  }
  if (role) {
    const p = document.createElement('p');
    p.textContent = role.textContent.replace(/\s+/g, ' ').trim();
    textCell.push(p);
  }
  // social links: emit one per network, labelled so cards.js can pick the icon
  const seen = new Set();
  socials.forEach((a) => {
    const network = networkOf(a);
    if (!network || seen.has(network)) return;
    seen.add(network);
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href') || '#');
    link.textContent = network;
    const wrap = document.createElement('p');
    wrap.append(link);
    textCell.push(wrap);
  });

  if (!mediaCell.length && !textCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cards',
    variants: ['people', 'horizontal'],
    cells: [[mediaCell, textCell]],
  });
  element.replaceWith(block);
}
