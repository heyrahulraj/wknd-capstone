/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS (adventures landing template — children variant)
import breadcrumbParser from './parsers/breadcrumb.js';
import introParser from './parsers/adventures-intro.js';
import adventureListChildrenParser from './parsers/adventure-list-children.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY - keys match page-templates.json block names
const parsers = {
  breadcrumb: breadcrumbParser,
  carousel: introParser,
  'adventure-list': adventureListChildrenParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded (adventures landing, children variant)
// Same as import-adventures-landing, but the adventure-list block is authored
// as the `children` variant: a single parent path that lists its child pages.
const PAGE_TEMPLATE = {
  name: 'adventures-landing',
  description: 'Adventures landing page: intro promo + adventure-list (children) driven by the parent path.',
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
      // children variant needs only ONE marker; take the first .image-list.list
      const first = elements[0];
      if (first) pageBlocks.push({ name: blockDef.name, selector, element: first });
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

    // drop the source's static tab labels — the block renders its own filters
    WebImporter.DOMUtils.remove(main, ['.cmp-tabs__tablist']);

    // the children variant emits ONE marker; remove any extra source lists so
    // duplicates don't linger in the output
    const lists = [...main.querySelectorAll('.image-list.list')];
    lists.slice(1).forEach((el) => el.remove());

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
