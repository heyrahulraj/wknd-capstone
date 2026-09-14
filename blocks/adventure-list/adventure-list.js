/**
 * Adventure list — a dynamic, filterable grid of adventure cards.
 *
 * Source of pages (in priority order):
 *   1. /us/en/query-index.json (default EDS index) filtered to /adventures/*,
 *   2. authored links inside the block (fallback when no index is published).
 *
 * For each page it fetches the page's `.plain.html` and reads the image,
 * description, and the Activity value (from the `columns spec` block) to build
 * a card and its activity tag. Filter tabs are auto-derived from the distinct
 * activity values found.
 */

const ADVENTURES_PREFIX = '/us/en/adventures/';

/** Normalise a path: drop `/content` preview prefix, `.html`, trailing slash. */
function normalisePath(p) {
  return p
    .replace(/^\/content/, '')
    .replace(/\.html$/, '')
    .replace(/\/$/, '');
}

/** Collect candidate adventure page paths from the query-index, else authored links. */
async function collectPagePaths(block) {
  // authored links (fallback source, also the reliable path locally)
  const authored = [...block.querySelectorAll('a[href]')]
    .map((a) => normalisePath(new URL(a.href, window.location.origin).pathname))
    .filter((p) => p.startsWith(ADVENTURES_PREFIX));

  // try the default query-index
  try {
    const resp = await fetch('/us/en/query-index.json');
    if (resp.ok) {
      const { data = [] } = await resp.json();
      const indexed = data
        .map((r) => normalisePath(r.path || ''))
        .filter((p) => p.startsWith(ADVENTURES_PREFIX) && p !== normalisePath('/us/en/adventures'));
      if (indexed.length) return [...new Set(indexed)];
    }
  } catch (e) {
    // ignore — fall back to authored links
  }

  return [...new Set(authored)];
}

/** Fetch one page's plain HTML and extract card data (title, image, desc, activity). */
async function fetchCardData(path) {
  try {
    const resp = await fetch(`${path}.plain.html`);
    if (!resp.ok) return null;
    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Activity from the columns spec block: the row whose first cell is "Activity"
    let activity = '';
    doc.querySelectorAll('.columns.spec > div > div:first-child').forEach((label) => {
      if (/^activity$/i.test(label.textContent.trim())) {
        activity = (label.nextElementSibling?.textContent || '').trim();
      }
    });

    const img = doc.querySelector('.carousel img, img');
    const title = (doc.querySelector('h1')?.textContent || '').trim();

    // description: prefer the page's Description metadata when present, else the
    // first meaningful paragraph. The metadata block nests each row as
    // `.metadata > div > div`(label) + div(value); it may be stripped from the
    // served .plain.html, in which case fall back to the first non-empty <p>.
    let desc = '';
    doc.querySelectorAll('.metadata > div').forEach((row) => {
      const label = row.querySelector(':scope > div:first-child');
      const value = row.querySelector(':scope > div:last-child');
      if (label && value && /^description$/i.test(label.textContent.trim())) {
        desc = value.textContent.trim();
      }
    });
    if (!desc) {
      const para = [...doc.querySelectorAll('p')]
        .map((p) => p.textContent.trim())
        .find((t) => t.length > 20 && !/^related trips/i.test(t));
      desc = para || '';
    }

    return {
      path,
      title,
      activity,
      imgSrc: img ? img.getAttribute('src') : '',
      imgAlt: img ? (img.getAttribute('alt') || title) : title,
      desc,
    };
  } catch (e) {
    return null;
  }
}

/** Build one card element. */
function buildCard(card) {
  const li = document.createElement('li');
  li.className = 'adventure-card';
  li.dataset.activity = card.activity;

  const imgLink = document.createElement('a');
  imgLink.href = card.path;
  imgLink.className = 'adventure-card-image';
  if (card.imgSrc) {
    const picture = document.createElement('picture');
    const img = document.createElement('img');
    img.src = card.imgSrc;
    img.alt = card.imgAlt;
    img.loading = 'lazy';
    picture.append(img);
    imgLink.append(picture);
  }

  const titleLink = document.createElement('a');
  titleLink.href = card.path;
  titleLink.className = 'adventure-card-title';
  titleLink.textContent = card.title;

  const body = document.createElement('p');
  body.className = 'adventure-card-desc';
  body.textContent = card.desc;

  li.append(imgLink, titleLink, body);
  return li;
}

/** Build the filter tab row from the distinct activities. */
function buildTabs(activities, onSelect) {
  const nav = document.createElement('nav');
  nav.className = 'adventure-list-filters';
  nav.setAttribute('aria-label', 'Filter adventures by activity');
  const tabs = ['All', ...activities];
  tabs.forEach((label, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'adventure-filter';
    btn.textContent = label;
    btn.dataset.filter = i === 0 ? '' : label;
    btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    btn.addEventListener('click', () => {
      nav.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      onSelect(btn.dataset.filter);
    });
    nav.append(btn);
  });
  return nav;
}

export default async function decorate(block) {
  const paths = await collectPagePaths(block);
  block.replaceChildren();
  if (!paths.length) return;

  const cards = (await Promise.all(paths.map(fetchCardData)))
    .filter(Boolean)
    .filter((c) => c.title)
    .sort((a, b) => a.title.localeCompare(b.title));
  if (!cards.length) return;

  const grid = document.createElement('ul');
  grid.className = 'adventure-list-grid';
  const cardEls = cards.map((c) => {
    const el = buildCard(c);
    grid.append(el);
    return el;
  });

  // distinct activities, alphabetical
  const activities = [...new Set(cards.map((c) => c.activity).filter(Boolean))].sort();

  const filters = buildTabs(activities, (filter) => {
    cardEls.forEach((el) => {
      const show = !filter || el.dataset.activity === filter;
      el.hidden = !show;
    });
  });

  block.append(filters, grid);
}
