/**
 * Fetches the footer fragment. Metadata-independent dual-fetch:
 * /content first (localhost / aem up), then root (DA/EDS production).
 * Returns the parsed document plus the base path it was served from.
 * @returns {Promise<{doc: Document, base: string}|null>}
 */
async function fetchFooter() {
  let base = '/content/';
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) {
    base = '/';
    resp = await fetch('/footer.plain.html');
  }
  if (!resp.ok) return null;
  const html = await resp.text();
  return { doc: new DOMParser().parseFromString(html, 'text/html'), base };
}

/**
 * Rewrites relative `images/...` src references to be absolute against the
 * fragment's base path (fragment lives at /content/, page may be elsewhere).
 * @param {Element} scope The footer element
 * @param {string} base The fragment base path
 */
function resolveImagePaths(scope, base) {
  scope.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:)?\/\//.test(src) && !src.startsWith('/')) {
      img.setAttribute('src', `${base}${src}`);
    }
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;

  const footer = document.createElement('div');
  footer.className = 'footer-content';
  const { body } = fragment.doc;
  while (body.firstElementChild) footer.append(body.firstElementChild);
  resolveImagePaths(footer, fragment.base);

  // tag sections: 0 brand/logo, 1 nav, 2 social, 3 credits
  const sections = [...footer.children];
  const classes = ['footer-brand', 'footer-nav', 'footer-social', 'footer-credits'];
  sections.forEach((section, i) => {
    if (classes[i]) section.classList.add(classes[i]);
  });

  block.append(footer);
}
