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

  // tools/importer/import-about-us.js
  var import_about_us_exports = {};
  __export(import_about_us_exports, {
    default: () => import_about_us_default
  });

  // tools/importer/parsers/cards-people.js
  function buildRow(fragment, document2) {
    const image = fragment.querySelector('img, .cmp-image img, [class*="image"] img');
    const titles = Array.from(fragment.querySelectorAll(".cmp-title__text, h1, h2, h3, h4, h5, h6"));
    const nameEl = titles[0] || null;
    const roleEl = titles[1] || null;
    const buttons = Array.from(fragment.querySelectorAll('a.cmp-button, a[class*="button"]'));
    const mediaCell = [];
    if (image) mediaCell.push(image);
    const textCell = [];
    if (nameEl) {
      const h = document2.createElement("h3");
      h.textContent = nameEl.textContent.trim();
      textCell.push(h);
    }
    if (roleEl && roleEl !== nameEl) {
      const p = document2.createElement("p");
      p.textContent = roleEl.textContent.trim();
      textCell.push(p);
    }
    buttons.forEach((btn) => {
      const labelEl = btn.querySelector('[class*="button__text"]');
      const label = labelEl && labelEl.textContent.trim() || btn.textContent.trim() || btn.getAttribute("aria-label");
      const href = btn.getAttribute("href") || "";
      if (!label && !href) return;
      const link = document2.createElement("a");
      if (href) link.setAttribute("href", href);
      link.textContent = label || href;
      const wrap = document2.createElement("p");
      wrap.append(link);
      textCell.push(wrap);
    });
    if (!mediaCell.length && !textCell.length) return null;
    return [mediaCell, textCell];
  }
  function parseCardsPeople(element, { document: document2 }) {
    if (document2.body.dataset.cardsPeopleDone) {
      element.remove();
      return;
    }
    document2.body.dataset.cardsPeopleDone = "true";
    const fragments = Array.from(document2.querySelectorAll(".cmp-experience-fragment--contributor, .experiencefragment.cmp-experience-fragment--contributor"));
    if (!fragments.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const dividers = Array.from(document2.querySelectorAll(".title.cmp-title--underline"));
    const groupIndexOf = (node) => dividers.reduce((acc, d) => d.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING ? acc + 1 : acc, 0);
    const groups = /* @__PURE__ */ new Map();
    fragments.forEach((frag) => {
      const key = groupIndexOf(frag);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(frag);
    });
    [...groups.values()].forEach((groupFrags) => {
      const cells = [];
      groupFrags.forEach((frag) => {
        const row = buildRow(frag, document2);
        if (row) cells.push(row);
      });
      if (!cells.length) return;
      const block = WebImporter.Blocks.createBlock(document2, { name: "cards", variants: ["people"], cells });
      groupFrags[0].before(block);
    });
    fragments.forEach((frag) => {
      if (frag.parentNode) frag.remove();
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

  // tools/importer/import-about-us.js
  var parsers = {
    "cards-people": parseCardsPeople
  };
  var PAGE_TEMPLATE = {
    name: "about-us",
    description: "WKND About Us: intro title plus two people grids — Our Contributors and WKND Guides.",
    urls: ["https://wknd.site/us/en/about-us.html"],
    blocks: [
      { name: "cards-people", instances: [".experiencefragment.cmp-experience-fragment--contributor"] }
    ],
    sections: [
      { id: "rc1", name: "About Us Title", selector: [".title:not(.cmp-title--underline)", ".title"], style: null, blocks: [], defaultContent: [".title"] },
      { id: "rc2", name: "Our Contributors", selector: [".title.cmp-title--underline"], style: "yellow-underline", blocks: ["cards-people"], defaultContent: [".title.cmp-title--underline", ".text"] },
      { id: "rc3", name: "WKND Guides", selector: [".title.cmp-title--underline"], style: "yellow-underline", blocks: [], defaultContent: [".title.cmp-title--underline", ".text"] }
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

  var import_about_us_default = {
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
  return __toCommonJS(import_about_us_exports);
})();
