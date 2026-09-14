/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS (adventures template — distinct from home parsers)
import breadcrumbParser from './parsers/breadcrumb.js';
import carouselMiniParser from './parsers/carousel-mini.js';
import columnsSpecParser from './parsers/columns-spec.js';
import tabsAdventureParser from './parsers/tabs-adventure.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY - keys match page-templates.json block names
const parsers = {
  breadcrumb: breadcrumbParser,
  carousel: carouselMiniParser,
  columns: columnsSpecParser,
  tabs: tabsAdventureParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded (adventures template)
const PAGE_TEMPLATE = {
  name: 'adventures',
  description: 'Adventure detail page: top hero image, title, spec details, and content tabs.',
  urls: [
    'https://wknd.site/us/en/adventures/bali-surf-camp.html',
  ],
  blocks: [
    { name: 'breadcrumb', instances: ['.breadcrumb.cmp-breadcrumb--fixed'] },
    { name: 'carousel', instances: ['.carousel.cmp-carousel--mini'] },
    { name: 'columns', instances: ['.contentfragment.cmp-contentfragment--elements'] },
    { name: 'tabs', instances: ['.tabs.panelcontainer'] },
  ],
  sections: [
    {
      id: 'rc1',
      name: 'Breadcrumb',
      selector: ['.breadcrumb.cmp-breadcrumb--fixed'],
      style: null,
      blocks: ['breadcrumb'],
      defaultContent: [],
    },
    {
      id: 'rc2',
      name: 'Top Hero Image',
      selector: ['.carousel.cmp-carousel--mini'],
      style: null,
      blocks: ['carousel'],
      defaultContent: [],
    },
    {
      id: 'rc4',
      name: 'Adventure Title',
      selector: ['.title.cmp-title--underline'],
      style: 'yellow-underline',
      blocks: [],
      defaultContent: ['.title.cmp-title--underline'],
    },
    {
      id: 'rc-body',
      name: 'Adventure Body (spec + share + tabs)',
      selector: ['.contentfragment.cmp-contentfragment--elements'],
      style: 'adventure-body',
      blocks: ['columns', 'tabs'],
      defaultContent: [],
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
