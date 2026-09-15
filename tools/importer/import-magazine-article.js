/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS (magazine article template)
import breadcrumbParser from './parsers/breadcrumb.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY - keys match page-templates.json block names
const parsers = {
  breadcrumb: breadcrumbParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded (magazine article template)
// A magazine article is mostly default content: a hero image, the H1 title, a
// "By <author>" byline, then the article body (section headings + paragraphs +
// images) and a "Share this Story" heading. The only block is the dynamic
// breadcrumb; everything else flows through as authored default content.
const PAGE_TEMPLATE = {
  name: 'magazine-article',
  description: 'Magazine article detail page: breadcrumb, hero image, title, byline, article body, and share heading.',
  urls: [
    'https://wknd.site/us/en/magazine/arctic-surfing.html',
  ],
  blocks: [
    { name: 'breadcrumb', instances: ['.breadcrumb.cmp-breadcrumb', '.breadcrumb'] },
  ],
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
      name: 'Article Title',
      selector: ['.title:not(.cmp-title--underline):not(.cmp-title--black)', '.title'],
      style: 'yellow-underline',
      blocks: [],
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
      const elements = document.querySelectorAll(selector);
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

    // one breadcrumb only — take the first match, ignore duplicates
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    const seen = new Set();
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      if (seen.has(block.name)) { return; }
      seen.add(block.name);
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
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
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
