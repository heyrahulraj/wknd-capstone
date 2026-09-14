/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS (adventures landing template)
import breadcrumbParser from './parsers/breadcrumb.js';
import introParser from './parsers/adventures-intro.js';
import adventureListParser from './parsers/adventure-list.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY - keys match page-templates.json block names
const parsers = {
  breadcrumb: breadcrumbParser,
  carousel: introParser,
  'adventure-list': adventureListParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded (adventures landing template)
const PAGE_TEMPLATE = {
  name: 'adventures-landing',
  description: 'Adventures landing page: intro promo + dynamic filterable adventure listing.',
  urls: [
    'https://wknd.site/us/en/adventures.html',
  ],
  blocks: [
    { name: 'breadcrumb', instances: ['.breadcrumb.cmp-breadcrumb--fixed'] },
    { name: 'carousel', instances: ['.teaser.cmp-teaser--hero'] },
    { name: 'adventure-list', instances: ['.image-list.list'] },
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
      name: 'Adventures Title',
      selector: ['.title.cmp-title--underline', '.title'],
      style: 'yellow-underline',
      blocks: [],
      defaultContent: ['.title.cmp-title--underline', '.title'],
    },
    {
      id: 'rc3',
      name: 'Intro Promo',
      selector: ['.teaser.cmp-teaser--hero'],
      style: null,
      blocks: ['carousel'],
      defaultContent: [],
    },
    {
      id: 'rc4',
      name: 'Current Adventures',
      selector: ['.title.cmp-title--underline'],
      style: 'yellow-underline',
      blocks: ['adventure-list'],
      defaultContent: ['.title.cmp-title--underline'],
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

    // drop the source's static tab labels (All/Climbing/Cycling/…) — the
    // adventure-list block renders its own dynamic activity filter tabs
    WebImporter.DOMUtils.remove(main, ['.cmp-tabs__tablist']);

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
