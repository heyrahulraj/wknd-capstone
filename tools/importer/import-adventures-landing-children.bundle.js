/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-adventures-landing-children.js
  var import_landing_exports = {};
  __export(import_landing_exports, {
    default: () => import_landing_default
  });

  // tools/importer/parsers/breadcrumb.js
  function parseBreadcrumb(element, { document: document2 }) {
    const block = WebImporter.Blocks.createBlock(document2, { name: "breadcrumb", cells: [[""]] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/adventures-intro.js (carousel hero-img intro)
  function parseIntro(element, { document: document2 }) {
    const image = element.querySelector('img, .cmp-image img, [class*="image"] img');
    const heading = element.querySelector('h1, h2, h3, .cmp-teaser__title, [class*="title"]:not([class*="pretitle"]):not([class*="eyebrow"])');
    const description = element.querySelector('.cmp-teaser__description, [class*="description"], p:not([class*="pretitle"])');
    const textCell = [];
    if (heading) textCell.push(heading);
    if (description) textCell.push(description);
    if (!image && !textCell.length) { element.replaceWith(...element.childNodes); return; }
    const cells = [[image || "", textCell]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel", variants: ["hero-img"], cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/adventure-list-children.js
  var PARENT_PATH = "/us/en/adventures";
  function parseAdventureListChildren(element, { document: document2 }) {
    const link = document2.createElement("a");
    link.setAttribute("href", PARENT_PATH);
    link.textContent = PARENT_PATH;
    const block = WebImporter.Blocks.createBlock(document2, {
      name: "adventure-list",
      variants: ["children"],
      cells: [[[link]]]
    });
    element.replaceWith(block);
  }

  // tools/importer/transformers/wknd-cleanup.js
  var H = { before: "beforeTransform", after: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === H.before) {
      WebImporter.DOMUtils.remove(element, [
        "#toggleNav",
        "#mobileNav",
        "#destination_publishing_iframe_wkndsite_0"
      ]);
    }
    if (hookName === H.after) {
      WebImporter.DOMUtils.remove(element, [
        "header.experiencefragment",
        "footer.experiencefragment",
        "iframe",
        "meta",
        "noscript"
      ]);
    }
  }

  // tools/importer/transformers/wknd-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  var SELECTOR_OVERRIDES = {
    rc9: [".teaser.cmp-teaser--imagebottom"]
  };
  function resolveSections(root, sections) {
    const used = /* @__PURE__ */ new Set();
    return sections.map((section) => {
      const candidates = [
        ...SELECTOR_OVERRIDES[section.id] || [],
        ...section.selector || []
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
  function transform2(hookName, element, payload) {
    const sections = payload.template && payload.template.sections || [];
    if (hookName === "beforeTransform") {
      const resolved = resolveSections(element, sections);
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        if (i === 0) continue;
        const el = resolved[i];
        if (!el) continue;
        const hr = document.createElement("hr");
        if (sections[i].style) hr.setAttribute(SECTION_MARKER_ATTR, sections[i].id);
        el.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const anchor = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        anchor.removeAttribute(SECTION_MARKER_ATTR);
      }
    }
  }

  // tools/importer/import-adventures-landing-children.js
  var parsers = {
    breadcrumb: parseBreadcrumb,
    carousel: parseIntro,
    "adventure-list": parseAdventureListChildren
  };
  var PAGE_TEMPLATE = {
    name: "adventures-landing",
    description: "Adventures landing page: intro promo + adventure-list (children) driven by the parent path.",
    urls: ["https://wknd.site/us/en/adventures.html"],
    blocks: [
      { name: "breadcrumb", instances: [".breadcrumb.cmp-breadcrumb--fixed"] },
      { name: "carousel", instances: [".teaser.cmp-teaser--hero"] },
      { name: "adventure-list", instances: [".image-list.list"] }
    ],
    sections: [
      { id: "rc1", name: "Breadcrumb", selector: [".breadcrumb.cmp-breadcrumb--fixed"], style: null, blocks: ["breadcrumb"], defaultContent: [] },
      { id: "rc2", name: "Adventures Title", selector: [".title.cmp-title--underline, .title"], style: "yellow-underline", blocks: [], defaultContent: [".title.cmp-title--underline, .title"] },
      { id: "rc3", name: "Intro Promo", selector: [".teaser.cmp-teaser--hero"], style: null, blocks: ["carousel"], defaultContent: [] },
      { id: "rc4", name: "Current Adventures", selector: [".title.cmp-title--underline"], style: "yellow-underline", blocks: ["adventure-list"], defaultContent: [".title.cmp-title--underline"] }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try { transformerFn.call(null, hookName, element, enhancedPayload); }
      catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        const first = elements[0];
        if (first) pageBlocks.push({ name: blockDef.name, selector, element: first });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }

  var import_landing_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      WebImporter.DOMUtils.remove(main, [".cmp-tabs__tablist"]);
      const lists = [...main.querySelectorAll(".image-list.list")];
      lists.slice(1).forEach((el) => el.remove());
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_landing_exports);
})();
