/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS (faqs template)
import accordionParser from './parsers/accordion.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY - keys match page-templates.json block names
const parsers = {
  accordion: accordionParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded (faqs template)
const PAGE_TEMPLATE = {
  name: 'faqs',
  description: 'WKND FAQs page: intro copy, an accordion of question/answer items, and a "Need more help?" contact block.',
  urls: [
    'https://wknd.site/us/en/faqs.html',
  ],
  blocks: [
    { name: 'accordion', instances: ['.accordion.panelcontainer'] },
  ],
  sections: [
    {
      id: 'rc1',
      name: 'FAQs Intro',
      selector: ['.title.cmp-title--underline', '.title'],
      style: 'yellow-underline',
      blocks: [],
      defaultContent: ['.title.cmp-title--underline', '.text'],
    },
    {
      id: 'rc2',
      name: 'FAQ Accordion',
      selector: ['.accordion.panelcontainer'],
      style: null,
      blocks: ['accordion'],
      defaultContent: [],
    },
    {
      id: 'rc3',
      name: 'Need More Help',
      selector: ['.title:not(.cmp-title--underline)', '.title'],
      style: null,
      blocks: [],
      defaultContent: ['.title', '.text'],
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
    // De-dupe: a selector list can match the same accordion twice.
    const seen = new Set();
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      if (seen.has(block.element)) return;
      seen.add(block.element);
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
