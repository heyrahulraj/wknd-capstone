/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS (LA skateparks article — two-column aside layout)
import breadcrumbParser from './parsers/breadcrumb.js';
import cardsButtonParser from './parsers/cards-button.js';
import cardsBylineParser from './parsers/cards-byline.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

const parsers = {
  breadcrumb: breadcrumbParser,
  'cards-button': cardsButtonParser,
  'cards-byline': cardsBylineParser,
};

// The article renders in the LEFT column; the "Share This Story" rail (.download)
// becomes cards (button) in the RIGHT aside; the author byline (.cmp-byline)
// becomes cards (people, horizontal) as a full-width section below.
const PAGE_TEMPLATE = {
  name: 'skateparks-article',
  description: 'LA Skateparks article: two-column aside layout (article + share rail) + author bio.',
  urls: ['https://wknd.site/us/en/magazine/guide-la-skateparks.html'],
  blocks: [
    { name: 'breadcrumb', instances: ['.breadcrumb.cmp-breadcrumb', '.breadcrumb'] },
    { name: 'cards-byline', instances: ['.cmp-experiencefragment--stacey-roswells', '.cmp-byline'] },
    { name: 'cards-button', instances: ['.cmp-layoutcontainer--sidebar'] },
  ],
  // Source order (preserved): article → author byline → "Share This Story" rail.
  // All three live in one `aside` section so mobile stacks article → byline →
  // share (matching the source); at desktop the layout puts article + byline in
  // the left column and the share rail in the right column.
  sections: [
    {
      id: 'rc1',
      name: 'Breadcrumb',
      selector: ['.breadcrumb.cmp-breadcrumb', '.breadcrumb'],
      style: null,
      blocks: ['breadcrumb'],
      defaultContent: [],
    },
    {
      id: 'rc2',
      name: 'Article + Byline + Share (aside)',
      selector: ['.title:not(.cmp-title--underline):not(.cmp-title--black)', '.title'],
      style: 'aside',
      blocks: ['cards-byline', 'cards-button'],
      defaultContent: ['.title'],
    },
  ],
};

const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // Source order is preserved: [breadcrumb][H1 + article][byline][share rail].
    // The byline stays before the share rail so mobile stacks article → byline
    // → share exactly like the source (with a separator above the byline).
    executeTransformers('beforeTransform', main, payload);

    // parse blocks (one instance each; first match wins)
    const seen = new Set();
    findBlocksOnPage(document, PAGE_TEMPLATE).forEach((block) => {
      if (!block.element.parentNode || seen.has(block.name)) return;
      seen.add(block.name);
      const parser = parsers[block.name];
      if (parser) {
        try { parser(block.element, { document, url, params }); } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      }
    });

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name },
    }];
  },
};
