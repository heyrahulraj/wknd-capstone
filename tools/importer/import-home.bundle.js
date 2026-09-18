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

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/carousel.js
  function parse(element, { document: document2 }) {
    let slides = Array.from(element.querySelectorAll(".cmp-carousel__item"));
    if (!slides.length) {
      slides = Array.from(element.querySelectorAll('.teaser, [class*="teaser"]'));
    }
    const cells = [];
    slides.forEach((slide) => {
      const image = slide.querySelector('img, .cmp-image img, [class*="image"] img');
      const title = slide.querySelector('h1, h2, h3, .cmp-teaser__title, [class*="title"]');
      const description = slide.querySelector('.cmp-teaser__description, [class*="description"], p');
      const ctaLinks = Array.from(
        slide.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a, a[class*="action"]')
      );
      if (!image && !title && !description && !ctaLinks.length) return;
      const textCell = [];
      if (title) textCell.push(title);
      if (description) textCell.push(description);
      textCell.push(...ctaLinks);
      cells.push([image || "", textCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel", variants: ["hero-img"], cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  function parse2(element, { document: document2 }) {
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
  function parse3(element, { document: document2 }, opts = {}) {
    // index-driven marker: derive the path prefix from the list's own links and
    // author a single cell (`prefix | limit`); cards.js builds the grid at render
    const hrefs = [...element.querySelectorAll("a[href]")]
      .map((a) => (a.getAttribute("href") || "").replace(/\.html?$/, ""))
      .filter((h) => h.startsWith("/us/en/"));
    let prefix = opts.prefix || "";
    if (!prefix && hrefs.length) {
      prefix = `/${hrefs[0].split("/").filter(Boolean).slice(0, 3).join("/")}`;
    }
    if (!prefix) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const value = opts.limit ? `${prefix} | ${opts.limit}` : prefix;
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards", variants: ["article", "dynamic"], cells: [[value]] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero.js
  function parse4(element, { document: document2 }) {
    const bgImage = element.querySelector('.cmp-teaser__image img, .cmp-image img, img[class*="background"], img');
    const heading = element.querySelector('h1, h2, h3, .cmp-teaser__title, [class*="title"]:not([class*="pretitle"])');
    const description = element.querySelector('.cmp-teaser__description, [class*="description"], p');
    const ctaLinks = Array.from(
      element.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a, a[class*="action"]')
    );
    const textCell = [];
    if (heading) textCell.push(heading);
    if (description) textCell.push(description);
    textCell.push(...ctaLinks);
    if (!bgImage && !textCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (bgImage) cells.push([[bgImage]]);
    cells.push([textCell]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero", variants: ["banner"], cells });
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

  // tools/importer/import-home.js
  var parsers = {
    carousel: parse,
    columns: parse2,
    cards: (element, ctx) => parse3(element, ctx, { limit: 4 }),
    hero: parse4
  };
  var PAGE_TEMPLATE = {
    name: "home",
    description: "WKND homepage: hero carousel, featured article, recent articles cards, mid-page banner, and destination cards.",
    urls: [
      "https://wknd.site/us/en.html"
    ],
    blocks: [
      {
        name: "carousel",
        instances: [".carousel.cmp-carousel--hero"]
      },
      {
        name: "columns",
        instances: [".teaser.cmp-teaser--featured"]
      },
      {
        name: "cards",
        instances: [".image-list.list"]
      },
      {
        name: "hero",
        instances: [".teaser.cmp-teaser--hero"]
      }
    ],
    sections: [
      {
        id: "rc2",
        name: "Hero Carousel",
        selector: [".carousel.cmp-carousel--hero"],
        style: null,
        blocks: ["carousel"],
        defaultContent: []
      },
      {
        id: "rc3",
        name: "Featured Article",
        selector: [".teaser.cmp-teaser--featured"],
        style: "yellow-underline",
        blocks: ["columns"],
        defaultContent: []
      },
      {
        id: "rc5",
        name: "Recent Articles",
        selector: [".image-list.list"],
        style: "yellow-underline, primary-cta, custom-separator",
        blocks: ["cards"],
        defaultContent: [".title.cmp-title--underline"]
      },
      {
        id: "rc9",
        name: "Next Adventures / Climbing New Zealand",
        selector: [".teaser.cmp-teaser--hero"],
        style: null,
        blocks: ["hero"],
        defaultContent: [".title"]
      },
      {
        id: "rc12",
        name: "Where do you want to go?",
        selector: [".image-list.list"],
        style: "primary-cta, custom-separator",
        blocks: ["cards"],
        defaultContent: [".title"]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_home_default = {
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
  return __toCommonJS(import_home_exports);
})();
