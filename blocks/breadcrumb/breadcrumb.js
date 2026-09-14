/**
 * Dynamic breadcrumb.
 * Builds the trail from the current URL path: Home › ancestor(s) › current page.
 * Each ancestor's label is fetched from that page's <title> (falling back to a
 * title-cased URL segment when the page can't be fetched, e.g. not yet
 * migrated). The current page (leaf) is not linked.
 */

/** Title-case a URL segment: `bali-surf-camp` → `Bali Surf Camp`. */
function titleCase(segment) {
  return segment
    .replace(/\.html$/, '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Fetch a page and read its <title>, cleaned of the site suffix. Null on any failure. */
async function fetchTitle(path) {
  try {
    const resp = await fetch(path);
    if (!resp.ok) return null;
    const text = await resp.text();
    const match = text.match(/<title>([^<]*)<\/title>/i);
    if (!match) return null;
    const title = match[1].trim();
    if (!title || /page not found/i.test(title)) return null;
    // strip a trailing " | WKND ..." / " - WKND ..." site suffix if present
    return title.replace(/\s*[|–-]\s*WKND.*$/i, '').trim() || null;
  } catch (e) {
    return null;
  }
}

/**
 * Compute the crumb list from the current path.
 * @returns {Array<{label:string, url:string|null, current:boolean, seg:string}>}
 */
function buildCrumbTargets() {
  // normalise: drop the localhost `/content` prefix and any `.html`
  const path = window.location.pathname
    .replace(/^\/content/, '')
    .replace(/\.html$/, '')
    .replace(/\/$/, '');
  const segs = path.split('/').filter(Boolean);
  if (segs.length < 2) return [];

  // trail starts at the first section below the locale root (e.g. /us/en) —
  // no Home crumb
  const crumbs = [];

  // one crumb per segment below the locale root
  for (let i = 2; i < segs.length; i += 1) {
    const seg = segs[i];
    const url = `/${segs.slice(0, i + 1).join('/')}`;
    const isLast = i === segs.length - 1;
    crumbs.push({
      label: titleCase(seg), url: isLast ? null : url, current: isLast, seg,
    });
  }
  return crumbs;
}

export default async function decorate(block) {
  const crumbs = buildCrumbTargets();
  if (!crumbs.length) {
    block.replaceChildren();
    return;
  }

  // resolve labels: leaf from the current document title, linked ancestors from
  // their own page <title> (with a title-cased fallback).
  await Promise.all(crumbs.map(async (crumb) => {
    if (crumb.current) {
      const leaf = (document.title || '').replace(/\s*[|–-]\s*WKND.*$/i, '').trim();
      if (leaf) crumb.label = leaf;
      return;
    }
    const fetched = await fetchTitle(crumb.url);
    if (fetched) crumb.label = fetched;
  }));

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ol = document.createElement('ol');

  crumbs.forEach((crumb) => {
    const li = document.createElement('li');
    if (crumb.url && !crumb.current) {
      const a = document.createElement('a');
      a.href = crumb.url;
      a.textContent = crumb.label;
      li.append(a);
    } else {
      li.setAttribute('aria-current', 'page');
      li.textContent = crumb.label;
    }
    ol.append(li);
  });

  nav.append(ol);
  block.replaceChildren(nav);
}
