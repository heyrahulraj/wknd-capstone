/**
 * Shared query-index helpers for index-driven listings.
 *
 * Edge Delivery publishes a query index (default `/us/en/query-index.json`) with
 * one row per page. These helpers fetch and filter it. When no index is
 * published every fetch 404s and the helpers return an empty array, so callers
 * can fall back to authored content and never hard-fail.
 */

// Index locations tried in order (locale index first, then the site root).
const INDEX_PATHS = ['/us/en/query-index.json', '/query-index.json'];

/** Normalise a path: drop `/content` preview prefix, `.html`, trailing slash. */
export function normalisePath(p) {
  return (p || '')
    .replace(/^\/content/, '')
    .replace(/\.html$/, '')
    .replace(/\/$/, '');
}

/** Fetch the query-index rows from the first location that resolves; [] if none. */
export async function fetchIndex() {
  for (let i = 0; i < INDEX_PATHS.length; i += 1) {
    try {
      /* eslint-disable no-await-in-loop */
      const resp = await fetch(INDEX_PATHS[i]);
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

/**
 * True when `path` sits directly below `prefix` (one segment down), excluding
 * the prefix page itself. e.g. prefix `/us/en/adventures` matches
 * `/us/en/adventures/bali` but not `/us/en/adventures` or `.../asia/bali`.
 */
export function isDirectChild(path, prefix) {
  const clean = normalisePath(path);
  const base = normalisePath(prefix);
  if (!clean.startsWith(`${base}/`)) return false;
  const rest = clean.slice(base.length + 1);
  return rest.length > 0 && !rest.includes('/');
}

/**
 * Query the index for pages under `prefix`.
 * @param {object} opts
 * @param {string} opts.prefix       path prefix to match (e.g. `/us/en/magazine`)
 * @param {boolean} [opts.directOnly=true]  only direct children (not deeper)
 * @param {string} [opts.category]   optional exact match on the row's `category`/`template`
 * @param {number} [opts.limit]      optional cap (after sorting)
 * @param {Array}  [opts.rows]       pre-fetched index rows (avoids a second fetch)
 * @returns {Promise<Array>} matching rows, newest first when a date column exists
 */
export async function queryPages({
  prefix, directOnly = true, category, limit, rows,
} = {}) {
  const data = rows || await fetchIndex();
  const base = normalisePath(prefix || '');

  let matched = data.filter((r) => {
    const path = normalisePath(r.path || '');
    if (!path) return false;
    if (base) {
      const under = directOnly ? isDirectChild(path, base) : path.startsWith(`${base}/`);
      if (!under) return false;
    }
    if (category) {
      const rowCat = (r.category || r.template || '').toLowerCase();
      if (rowCat !== category.toLowerCase()) return false;
    }
    return true;
  });

  // newest first when the index exposes a date-like column
  const dateOf = (r) => Number(r.lastModified || r.date || r.published || 0);
  if (matched.some(dateOf)) {
    matched = matched.slice().sort((a, b) => dateOf(b) - dateOf(a));
  }

  if (Number.isFinite(limit) && limit > 0) matched = matched.slice(0, limit);
  return matched;
}
