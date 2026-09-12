/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND section breaks + Section Metadata.
 * Driven by payload.template.sections. Selectors verified against
 * migration-work/cleaned.html.
 *
 * DOM-required adaptations (the raw template selectors are ambiguous on this page):
 *   - `.image-list.list` matches two elements (rc5 → line 281, rc12 → line 391).
 *     A plain querySelector returns the first for both, so we resolve section
 *     elements in document order with a "used" set to pick successive matches.
 *   - rc9 `.teaser.cmp-teaser--hero` also matches the three carousel teasers
 *     (lines 169/190/211) which precede the real banner. The banner is uniquely
 *     `.teaser.cmp-teaser--imagebottom` (line 364), added as an override below.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

// Per-section-id selector overrides tried before the template selectors.
const SELECTOR_OVERRIDES = {
  rc9: ['.teaser.cmp-teaser--imagebottom'],
};

// Resolve each section to a distinct element in document order. A shared "used"
// set ensures repeated selectors (e.g. `.image-list.list`) pick successive matches.
function resolveSections(root, sections) {
  const used = new Set();
  return sections.map((section) => {
    const candidates = [
      ...(SELECTOR_OVERRIDES[section.id] || []),
      ...(section.selector || []),
    ];
    for (const sel of candidates) {
      const matches = root.querySelectorAll(sel);
      for (const el of matches) {
        if (!used.has(el)) {
          used.add(el);
          return el;
        }
      }
    }
    return null;
  });
}

export default function transform(hookName, element, payload) {
  const sections = (payload.template && payload.template.sections) || [];

  if (hookName === 'beforeTransform') {
    // Resolve up front (all section elements still present), then insert the
    // <hr> breaks. Holding references means insertion order can't disturb the
    // remaining lookups; bare <hr> also never affects any parser's :nth-of-type.
    const resolved = resolveSections(element, sections);
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      if (i === 0) continue; // first section: no leading break
      const el = resolved[i];
      if (!el) continue; // no selector matched — skip, never guess

      const hr = document.createElement('hr');
      if (sections[i].style) hr.setAttribute(SECTION_MARKER_ATTR, sections[i].id);
      el.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Parsers may have replaced styled sections' elements; anchor Section
    // Metadata to the marker <hr> inserted above (it always survives).
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const anchor = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      if (!anchor) continue; // marker missing (selector never matched) — skip

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);
      anchor.removeAttribute(SECTION_MARKER_ATTR);
    }
  }
}
