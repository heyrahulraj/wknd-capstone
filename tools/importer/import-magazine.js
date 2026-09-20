/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS (magazine template)
import columnsParser from './parsers/columns.js';
import cardsDynamicParser from './parsers/cards-dynamic.js';
import cardsSecureParser from './parsers/cards-secure.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY - keys match page-templates.json block names
// "All Articles" is index-driven (cards article dynamic): the parser authors a
// marker cell with the /us/en/magazine prefix (no limit — show all) and the
// grid is built from the query-index at render time. "Members Only" secure
// promos stay authored via cards-secure.
const parsers = {
  columns: columnsParser,
  cards: cardsDynamicParser,
  'cards-secure': cardsSecureParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded (magazine template)
const PAGE_TEMPLATE = {
  name: 'magazine',
  description: 'WKND magazine hub: featured article, All Articles card grid, and Members Only locked promos.',
  urls: [
    'https://wknd.site/us/en/magazine.html',
  ],
  blocks: [
    { name: 'columns', instances: ['.teaser.cmp-teaser--featured'] },
    { name: 'cards', instances: ['.image-list.list'] },
    { name: 'cards-secure', instances: ['.teaser.cmp-teaser--secure'] },
  ],
  sections: [
    {
      id: 'rc1',
      name: 'Magazine Title',
      selector: ['.title:not(.cmp-title--underline)', '.title'],
      style: null,
      blocks: [],
      defaultContent: ['.title'],
    },
    {
      id: 'rc2',
      name: 'Featured Article',
      selector: ['.teaser.cmp-teaser--featured'],
      style: null,
      blocks: ['columns'],
      defaultContent: [],
    },
    {
      id: 'rc3',
      name: 'All Articles',
      selector: ['.title.cmp-title--underline'],
      style: 'yellow-underline',
      blocks: ['cards'],
      defaultContent: ['.title.cmp-title--underline'],
    },
    {
      id: 'rc4',
      name: 'Members Only',
      selector: ['.title.cmp-title--underline'],
      style: 'yellow-underline, custom-separator',
      blocks: ['cards-secure'],
      defaultContent: ['.title.cmp-title--underline', '.text'],
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
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      elements.forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
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
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
