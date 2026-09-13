// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Fetches the nav fragment. Metadata-independent dual-fetch:
 * /content first (localhost / aem up), then root (DA/EDS production).
 * Returns the parsed document plus the base path the fragment was served
 * from, so relative image paths in the fragment can be resolved correctly.
 * @returns {Promise<{doc: Document, base: string}|null>}
 */
async function fetchNav() {
  let base = '/content/';
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) {
    base = '/';
    resp = await fetch('/nav.plain.html');
  }
  if (!resp.ok) return null;
  const html = await resp.text();
  return { doc: new DOMParser().parseFromString(html, 'text/html'), base };
}

/**
 * Rewrites relative `images/...` src references to be absolute against the
 * fragment's base path (fragment lives at /content/, page may be elsewhere).
 * @param {Element} scope The nav element
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
 * Builds the inline search form from a `:search:` marker paragraph.
 * The marker lives in nav.plain.html; the form controls are created here.
 * @param {Element} scope The section that may contain the search marker
 */
function buildSearch(scope) {
  const marker = [...scope.querySelectorAll('p')].find((p) => p.textContent.trim() === ':search:');
  if (!marker) return;
  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = '/us/en/search.html';
  form.innerHTML = `
    <span class="nav-search-icon" aria-hidden="true"></span>
    <input type="text" name="q" aria-label="Search" placeholder="Search">
  `;
  marker.replaceWith(form);
}

/**
 * Wires the locale selector: the first list in the utility section becomes a
 * click-toggle dropdown whose trigger shows the current locale + flag.
 * @param {Element} section The utility section
 */
function buildLocale(section) {
  const list = section.querySelector('ul');
  if (!list) return;
  const current = list.querySelector('li a');
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nav-locale-toggle';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-label', `Toggle Language ${current ? current.textContent.trim() : ''}`);
  const flag = current ? current.querySelector('img') : null;
  trigger.innerHTML = `${flag ? flag.outerHTML : ''}<span>${current ? current.textContent.trim() : 'Language'}</span>`;

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-locale';
  list.classList.add('nav-locale-list');
  wrapper.append(trigger, list);
  section.append(wrapper);

  trigger.addEventListener('click', () => {
    const open = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
  });
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) trigger.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Toggles the mobile nav open/closed.
 * @param {Element} nav The nav element
 * @param {boolean|null} forceExpanded Force a state, or null to toggle
 */
let savedScrollY = 0;

function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  const willOpen = !expanded && !isDesktop.matches;
  const { body } = document;

  if (willOpen) {
    // lock scroll: pin the body at the current position (robust on mobile)
    savedScrollY = window.scrollY;
    body.style.top = `-${savedScrollY}px`;
    body.classList.add('nav-drawer-open');
  } else if (body.classList.contains('nav-drawer-open')) {
    body.classList.remove('nav-drawer-open');
    body.style.top = '';
    window.scrollTo(0, savedScrollY);
  }

  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (button) button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
}

/**
 * loads and decorates the header nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  const { body } = fragment.doc;
  while (body.firstElementChild) nav.append(body.firstElementChild);
  resolveImagePaths(nav, fragment.base);

  // section 0: utility (sign-in + locale), 1: brand (logo), 2: main nav + search
  const classes = ['utility', 'brand', 'sections'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navUtility = nav.querySelector('.nav-utility');
  if (navUtility) buildLocale(navUtility);

  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    navBrand.querySelectorAll('.button, .button-container').forEach((el) => { el.className = ''; });
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) buildSearch(navSections);

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // reset to a clean state on breakpoint change (close mobile menu on desktop)
  isDesktop.addEventListener('change', () => toggleMenu(nav, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // scroll state: shrink padding + add shadow once the page scrolls (source parity)
  const header = block.closest('header') || block;
  const onScroll = () => {
    header.classList.toggle('scrolly', window.scrollY > 0);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}
