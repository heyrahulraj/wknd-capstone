/**
 * Adventure list — a dynamic, filterable grid of adventure cards.
 *
 * Two authoring modes:
 *
 *   Default (`adventure-list`): the block lists the adventure pages linked
 *   inside it (or, when a query-index is published, every page under
 *   /us/en/adventures/). One row per authored link.
 *
 *   `children` variant (`adventure-list children`): the block holds a single
 *   parent page path; it lists that parent's DIRECT child pages, discovered
 *   from the query-index by path prefix. No per-page links are authored. If the
 *   query-index is unavailable or has no children, the block renders nothing
 *   (there is intentionally no authored-link fallback for this variant).
 *
 * For each page it reads the image, title, description, and Activity — from the
 * query-index columns when present, otherwise by fetching the page's
 * `.plain.html`. Filter tabs are auto-derived from the distinct activities.
 */

const ADVENTURES_PREFIX = '/us/en/adventures/';
const QUERY_INDEX_PATHS = ['/us/en/query-index.json', '/query-index.json'];

/** Normalise a path: drop `/content` preview prefix, `.html`, trailing slash. */
function normalisePath(p) {
  return p
    .replace(/^\/content/, '')
    .replace(/\.html$/, '')
    .replace(/\/$/, '');
}

/** Fetch the query-index rows from the first location that resolves. */
async function fetchQueryIndex() {
  for (let i = 0; i < QUERY_INDEX_PATHS.length; i += 1) {
    try {
      /* eslint-disable no-await-in-loop */
      const resp = await fetch(QUERY_INDEX_PATHS[i]);
      if (resp.ok) {
        const { data = [] } = await resp.json();
        if (data.length) return data;
      }
      /* eslint-enable no-await-in-loop */
    } catch (e) {
      // try the next location
    }
  }
  return [];
}

/** Read the authored parent path from the block (anchor href or plain text). */
function readParentPath(block) {
  const link = block.querySelector('a[href]');
  const raw = link
    ? new URL(link.href, window.location.origin).pathname
    : (block.textContent || '').trim();
  return raw ? normalisePath(raw) : '';
}

/** True when `path` is a direct child of `parent` (one segment below, not parent itself). */
function isDirectChild(path, parent) {
  if (!path.startsWith(`${parent}/`)) return false;
  const rest = path.slice(parent.length + 1);
  return rest.length > 0 && !rest.includes('/');
}

/**
 * `children` variant: collect the parent's direct child paths from the
 * query-index only. Returns [] (→ empty render) when the index is unavailable
 * or has no children — no authored-link fallback by design.
 */
async function collectChildPaths(block) {
  const parent = readParentPath(block);
  if (!parent) return { paths: [], rows: [] };

  const data = await fetchQueryIndex();
  const rows = data.filter((r) => isDirectChild(normalisePath(r.path || ''), parent));
  const paths = [...new Set(rows.map((r) => normalisePath(r.path)))];
  return { paths, rows };
}

/** Default mode: collect adventure page paths from the query-index, else authored links. */
async function collectPagePaths(block) {
  const authored = [...block.querySelectorAll('a[href]')]
    .map((a) => normalisePath(new URL(a.href, window.location.origin).pathname))
    .filter((p) => p.startsWith(ADVENTURES_PREFIX));

  const data = await fetchQueryIndex();
  const indexed = data
    .map((r) => normalisePath(r.path || ''))
    .filter((p) => p.startsWith(ADVENTURES_PREFIX) && p !== normalisePath('/us/en/adventures'));
  if (indexed.length) return [...new Set(indexed)];

  return [...new Set(authored)];
}

/** Build card data from a query-index row (used when the index exposes the fields). */
function cardFromIndexRow(row) {
  const path = normalisePath(row.path || '');
  const title = (row.title || '').trim();
  const activity = (row.activity || '').trim();
  const desc = (row.description || '').trim();
  const imgSrc = row.image || '';
  // Consider the row "complete enough" only when it has a title; without it the
  // card is meaningless, so the caller falls back to fetching the page.
  return {
    path, title, activity, desc, imgSrc, imgAlt: title,
  };
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

/**
 * Resolve card data for a path, preferring the query-index row when it carries
 * the needed fields (title + activity), otherwise fetching the page's HTML.
 */
async function resolveCard(path, rowByPath) {
  const row = rowByPath.get(path);
  if (row) {
    const card = cardFromIndexRow(row);
    if (card.title && card.activity) return card;
  }
  return fetchCardData(path);
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

/** Render the filter tabs + card grid from resolved card data into the block. */
function renderList(block, cards) {
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

export default async function decorate(block) {
  const isChildren = block.classList.contains('children');

  // Gather candidate paths (and any query-index rows) per mode.
  let paths = [];
  let rows = [];
  if (isChildren) {
    ({ paths, rows } = await collectChildPaths(block));
  } else {
    paths = await collectPagePaths(block);
  }

  block.replaceChildren();
  // children variant: no children (or no index) → render nothing, by design.
  if (!paths.length) return;

  const rowByPath = new Map(rows.map((r) => [normalisePath(r.path || ''), r]));

  const cards = (await Promise.all(paths.map((p) => resolveCard(p, rowByPath))))
    .filter(Boolean)
    .filter((c) => c.title)
    .sort((a, b) => a.title.localeCompare(b.title));
  if (!cards.length) return;

  renderList(block, cards);
}
