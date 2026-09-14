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

  // tools/importer/import-magazine.js
  var import_magazine_exports = {};
  __export(import_magazine_exports, {
    default: () => import_magazine_default
  });

  // tools/importer/parsers/columns.js
  function parseColumns(element, { document: document2 }) {
    const image = element.querySelector('img, .cmp-image img, [class*="image"] img');
    const eyebrow = element.querySelector('.cmp-teaser__pretitle, [class*="pretitle"], [class*="eyebrow"]');
    const heading = element.querySelector('h1, h2, h3, .cmp-teaser__title, [class*="title"]:not([class*="pretitle"]):not([class*="eyebrow"])');
    const description = element.querySelector('.cmp-teaser__description, [class*="description"], p:not([class*="pretitle"])');
    const ctaLinks = Array.from(
      element.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a, a[class*="action"]')
    );
    const textCell = [];
    if (eyebrow) textCell.push(eyebrow);
    if (heading) textCell.push(heading);
    if (description) textCell.push(description);
    textCell.push(...ctaLinks);
    if (!image && !textCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[image || "", textCell]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns", variants: ["featured"], cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards.js
  function parseCards(element, { document: document2 }) {
    const items = Array.from(element.querySelectorAll(".cmp-image-list__item, li"));
    const cells = [];
    items.forEach((item) => {
      const image = item.querySelector(".cmp-image-list__item-image img, .cmp-image img, img");
      const titleLink = item.querySelector('.cmp-image-list__item-title-link, a[class*="title"]');
      const imageLink = item.querySelector('.cmp-image-list__item-image-link, a[class*="image-link"]');
      const titleTextEl = item.querySelector('.cmp-image-list__item-title, [class*="item-title"]');
      const titleSource = titleTextEl || titleLink;
      const titleText = titleSource ? titleSource.textContent.trim() : "";
      const href = titleLink && titleLink.getAttribute("href") || imageLink && imageLink.getAttribute("href") || "";
      const description = item.querySelector('.cmp-image-list__item-description, [class*="description"], p');
      if (!image && !titleText) return;
      const mediaCell = [];
      if (image) {
        if (href) {
          const imgAnchor = document2.createElement("a");
          imgAnchor.setAttribute("href", href);
          imgAnchor.append(image);
          mediaCell.push(imgAnchor);
        } else {
          mediaCell.push(image);
        }
      }
      if (titleText) {
        const titleAnchor = document2.createElement("a");
        if (href) titleAnchor.setAttribute("href", href);
        titleAnchor.textContent = titleText;
        mediaCell.push(titleAnchor);
      }
      const descCell = [];
      if (description) descCell.push(description);
      cells.push([mediaCell, descCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards", variants: ["article"], cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-secure.js
  function parseCardsSecure(element, { document: document2 }) {
    if (document2.body.dataset.cardsSecureDone) {
      element.remove();
      return;
    }
    document2.body.dataset.cardsSecureDone = "true";
    const teasers = Array.from(document2.querySelectorAll(".teaser.cmp-teaser--secure, .cmp-teaser--secure"));
    const cells = [];
    teasers.forEach((teaser) => {
      const image = teaser.querySelector('img, .cmp-image img, [class*="image"] img');
      const heading = teaser.querySelector('h1, h2, h3, .cmp-teaser__title, [class*="title"]');
      const description = teaser.querySelector('.cmp-teaser__description, [class*="description"], p');
      if (!image && !heading) return;
      const mediaCell = [];
      if (image) mediaCell.push(image);
      const textCell = [];
      if (heading) {
        const h = document2.createElement("h3");
        h.textContent = heading.textContent.trim();
        textCell.push(h);
      }
      if (description) textCell.push(description);
      cells.push([mediaCell, textCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards", variants: ["article"], cells });
    element.replaceWith(block);
    teasers.forEach((t) => {
      if (t !== element && t.parentNode) t.remove();
    });
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

  // tools/importer/import-magazine.js
  var parsers = {
    columns: parseColumns,
    cards: parseCards,
    "cards-secure": parseCardsSecure
  };
  var PAGE_TEMPLATE = {
    name: "magazine",
    description: "WKND magazine hub: featured article, All Articles card grid, and Members Only locked promos.",
    urls: ["https://wknd.site/us/en/magazine.html"],
    blocks: [
      { name: "columns", instances: [".teaser.cmp-teaser--featured"] },
      { name: "cards", instances: [".image-list.list"] },
      { name: "cards-secure", instances: [".teaser.cmp-teaser--secure"] }
    ],
    sections: [
      { id: "rc1", name: "Magazine Title", selector: [".title:not(.cmp-title--underline)", ".title"], style: null, blocks: [], defaultContent: [".title"] },
      { id: "rc2", name: "Featured Article", selector: [".teaser.cmp-teaser--featured"], style: null, blocks: ["columns"], defaultContent: [] },
      { id: "rc3", name: "All Articles", selector: [".title.cmp-title--underline"], style: "yellow-underline", blocks: ["cards"], defaultContent: [".title.cmp-title--underline"] },
      { id: "rc4", name: "Members Only", selector: [".title.cmp-title--underline"], style: "yellow-underline", blocks: ["cards-secure"], defaultContent: [".title.cmp-title--underline", ".text"] }
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
        elements.forEach((element) => { pageBlocks.push({ name: blockDef.name, selector, element }); });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }

  var import_magazine_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
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
  return __toCommonJS(import_magazine_exports);
})();
