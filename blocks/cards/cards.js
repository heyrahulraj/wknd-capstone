import { createOptimizedPicture } from '../../scripts/aem.js';
import { queryPages, normalisePath } from '../../scripts/query-index.js';

// Inline SVG glyphs for the social links in the `people` variant. Keyed by the
// social network name (matched case-insensitively against the link text).
const SOCIAL_ICONS = {
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H17V3.6c-.29-.04-1.27-.13-2.4-.13-2.38 0-4 1.45-4 4.11V9.9H7.9V13h2.7v8z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M22 5.9c-.7.32-1.5.53-2.3.63.83-.5 1.46-1.28 1.76-2.22-.78.46-1.64.8-2.55.98A4.02 4.02 0 0 0 12 8.94c0 .32.03.62.1.92-3.34-.17-6.3-1.77-8.28-4.2-.35.6-.55 1.28-.55 2.02 0 1.4.71 2.63 1.79 3.35-.66-.02-1.28-.2-1.82-.5v.05c0 1.95 1.39 3.58 3.23 3.95-.34.09-.7.14-1.06.14-.26 0-.51-.03-.76-.07.51 1.6 2 2.76 3.76 2.8A8.07 8.07 0 0 1 2 18.28 11.38 11.38 0 0 0 8.17 20c7.4 0 11.45-6.13 11.45-11.45v-.52A8.13 8.13 0 0 0 22 5.9z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.98c-3.15 0-3.52.01-4.76.07-.9.04-1.38.19-1.7.32-.43.16-.74.36-1.06.68-.32.32-.52.63-.68 1.06-.13.32-.28.8-.32 1.7-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.04.9.19 1.38.32 1.7.16.43.36.74.68 1.06.32.32.63.52 1.06.68.32.13.8.28 1.7.32 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c.9-.04 1.38-.19 1.7-.32.43-.16.74-.36 1.06-.68.32-.32.52-.63.68-1.06.13-.32.28-.8.32-1.7.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.04-.9-.19-1.38-.32-1.7a2.86 2.86 0 0 0-.68-1.06 2.86 2.86 0 0 0-1.06-.68c-.32-.13-.8-.28-1.7-.32-1.24-.06-1.61-.07-4.76-.07zm0 3.37a4.49 4.49 0 1 1 0 8.98 4.49 4.49 0 0 1 0-8.98zm0 7.4a2.91 2.91 0 1 0 0-5.82 2.91 2.91 0 0 0 0 5.82zm5.72-7.6a1.05 1.05 0 1 1-2.1 0 1.05 1.05 0 0 1 2.1 0z"/></svg>',
};

// Replace the text of a social link in the `people` variant with an inline icon
// (keeping the network name as the accessible label).
function decorateSocialLink(a) {
  const key = a.textContent.trim().toLowerCase();
  const icon = SOCIAL_ICONS[key];
  if (!icon) return;
  a.setAttribute('aria-label', a.textContent.trim());
  a.classList.add('cards-social-link');
  a.innerHTML = icon;
}

// Solid black padlock glyph overlaid on the member-only lock ribbon.
const LOCK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm3 8H9V7a3 3 0 0 1 6 0v3z"/></svg>';

/**
 * `member-only` variant: decorate one card <li> for the gated "Members Only"
 * section — a lock ribbon badge (top-left), a READ MORE CTA below the subtitle,
 * and the image moved to the bottom. Title/subtitle restyling is CSS-only.
 * @param {HTMLLIElement} li
 */
function decorateMemberOnlyCard(li) {
  // 1. lock badge (yellow ribbon in CSS, black padlock SVG on top)
  const lock = document.createElement('span');
  lock.className = 'card-lock';
  lock.setAttribute('aria-hidden', 'true');
  lock.innerHTML = LOCK_ICON;
  li.prepend(lock);

  const body = li.querySelector('.cards-card-body');
  const image = li.querySelector('.cards-card-image');

  // 2. READ MORE CTA below the subtitle: reuse an authored link if present,
  //    otherwise an inert button (content is member-gated, no destination).
  if (body) {
    const link = body.querySelector('a[href]');
    let cta;
    if (link) {
      cta = link;
      cta.textContent = 'READ MORE';
    } else {
      cta = document.createElement('button');
      cta.type = 'button';
      cta.textContent = 'READ MORE';
    }
    cta.classList.add('cards-readmore');
    body.append(cta);
  }

  // 3. move the image to the bottom of the card
  if (image) li.append(image);
}

/**
 * Read the dynamic config from the authored block. The block holds a single
 * cell with the parent path prefix (link or text), optionally followed by
 * `| limit`, `| category`, and/or `| filter:<column>`, e.g.
 * `/us/en/magazine | 4` or `/us/en/adventures | filter:activity`.
 *
 * @param {Element} block
 * @param {object} [defaults] fallbacks when the marker omits a value
 *   (used by the `adventures` variant to default prefix + filter column).
 */
function readDynamicConfig(block, defaults = {}) {
  const link = block.querySelector('a[href]');
  const raw = (link
    ? new URL(link.href, window.location.origin).pathname
    : (block.textContent || '')).trim();
  const [prefixRaw, ...rest] = raw.split('|').map((s) => s.trim());
  const prefix = normalisePath(prefixRaw) || defaults.prefix || '';
  if (!prefix) return null;
  let limit;
  let category;
  let filter = defaults.filter || '';
  rest.forEach((token) => {
    const m = /^filter:(.+)$/i.exec(token);
    if (/^\d+$/.test(token)) limit = Number(token);
    else if (m) filter = m[1].trim();
    else if (token) category = token;
  });
  return {
    prefix, limit, category, filter,
  };
}

/**
 * Build the filter-tab nav from the distinct filter values, toggling `hidden`
 * on cards whose `data-<filter>` doesn't match. Mirrors the retired
 * adventure-list block's markup/classes so the ported CSS applies unchanged.
 */
function buildFilterTabs(values, cardEls, filterKey) {
  const nav = document.createElement('nav');
  nav.className = 'cards-filters';
  nav.setAttribute('aria-label', `Filter by ${filterKey}`);
  ['All', ...values].forEach((label, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cards-filter';
    btn.textContent = label;
    btn.dataset.filter = i === 0 ? '' : label;
    btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    btn.addEventListener('click', () => {
      nav.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      const want = btn.dataset.filter;
      cardEls.forEach((el) => {
        el.hidden = !!want && el.dataset[filterKey] !== want;
      });
    });
    nav.append(btn);
  });
  return nav;
}

/** Build one article-style card <li> from a query-index row. */
function buildDynamicCard(row) {
  const path = normalisePath(row.path || '');
  const title = (row.title || '').trim();

  const li = document.createElement('li');

  const media = document.createElement('div');
  media.className = 'cards-card-image';
  if (row.image) {
    const imgLink = document.createElement('a');
    imgLink.href = path;
    const picture = document.createElement('picture');
    const img = document.createElement('img');
    img.src = row.image;
    img.alt = title;
    img.loading = 'lazy';
    picture.append(img);
    imgLink.append(picture);
    media.append(imgLink);
  }
  const titleLink = document.createElement('a');
  titleLink.href = path;
  titleLink.textContent = title;
  media.append(titleLink);

  const body = document.createElement('div');
  body.className = 'cards-card-body';
  if (row.description) {
    const p = document.createElement('p');
    p.textContent = row.description.trim();
    body.append(p);
  }

  li.append(media, body);
  return li;
}

/**
 * Index-driven variants (`dynamic`, `adventures`): list pages under an authored
 * path prefix from the query index, newest first, capped to an optional limit.
 * Renders the same markup as the `article` variant. The authored cell only
 * holds the path prefix marker (never display content), so when the index is
 * unavailable or matches nothing the block is emptied — it renders nothing
 * rather than exposing the raw marker.
 *
 * When `config.filter` is set (e.g. `activity`), auto-derived filter tabs are
 * rendered above the grid and toggle `hidden` on non-matching cards.
 *
 * @param {Element} block
 * @param {object} [defaults] variant defaults for the marker (prefix/filter)
 */
async function decorateDynamic(block, defaults = {}) {
  const config = readDynamicConfig(block, defaults);
  if (!config) {
    block.replaceChildren();
    return;
  }

  const rows = await queryPages({
    prefix: config.prefix,
    directOnly: true,
    category: config.category,
    limit: config.limit,
  });
  if (!rows.length) {
    // no index / no matches → render nothing (don't expose the marker text)
    block.replaceChildren();
    return;
  }

  const ul = document.createElement('ul');
  const cardEls = rows.map((row) => {
    const li = buildDynamicCard(row);
    if (config.filter) li.dataset[config.filter] = (row[config.filter] || '').trim();
    ul.append(li);
    return li;
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));

  // optional filter tabs (e.g. adventures by activity), auto-derived from rows
  if (config.filter) {
    const values = [...new Set(rows.map((r) => (r[config.filter] || '').trim()).filter(Boolean))].sort();
    if (values.length) {
      block.replaceChildren(buildFilterTabs(values, cardEls, config.filter), ul);
      return;
    }
  }
  block.replaceChildren(ul);
}

export default function decorate(block) {
  // adventures: index-driven grid + activity filter tabs (defaults baked in)
  if (block.classList.contains('adventures')) {
    decorateDynamic(block, { prefix: '/us/en/adventures', filter: 'activity' });
    return;
  }
  if (block.classList.contains('dynamic')) {
    decorateDynamic(block);
    return;
  }

  const isPeople = block.classList.contains('people');
  const isMemberOnly = block.classList.contains('member-only');
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      // the media cell holds the picture (article variant also nests a linked
      // title beside it); everything else is the body/description cell
      if (div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });

    // people variant: turn the social links into an icon row
    if (isPeople) {
      const body = li.querySelector('.cards-card-body');
      if (body) {
        const socialLinks = [...body.querySelectorAll('a')]
          .filter((a) => SOCIAL_ICONS[a.textContent.trim().toLowerCase()]);
        if (socialLinks.length) {
          const socialRow = document.createElement('p');
          socialRow.className = 'cards-social';
          socialLinks.forEach((a) => {
            decorateSocialLink(a);
            // unwrap each link from its own <p> and collect into the icon row
            const wrapper = a.closest('p');
            socialRow.append(a);
            const empty = wrapper && wrapper !== socialRow
              && !wrapper.textContent.trim() && !wrapper.children.length;
            if (empty) wrapper.remove();
          });
          body.append(socialRow);
        }
      }
    }

    // member-only variant: lock badge, READ MORE CTA, image moved to bottom
    if (isMemberOnly) decorateMemberOnlyCard(li);

    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}

/* index-driven variants: dynamic (home/magazine) + adventures (filtered). */
