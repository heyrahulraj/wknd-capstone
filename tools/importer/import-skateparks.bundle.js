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

  // tools/importer/import-skateparks.js
  var import_skateparks_exports = {};
  __export(import_skateparks_exports, {
    default: () => import_skateparks_default
  });

  // tools/importer/parsers/breadcrumb.js
  function parseBreadcrumb(element, { document: document2 }) {
    const block = WebImporter.Blocks.createBlock(document2, { name: "breadcrumb", cells: [[""]] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-button.js
  function parseCardsButton(element, { document: document2 }) {
    const cells = [];
    const shareHeading = document2.createElement("h3");
    shareHeading.textContent = "Share This Story";
    cells.push([[shareHeading]]);
    const seen = /* @__PURE__ */ new Set();
    element.querySelectorAll('.cmp-list--upnext a[href], .cmp-list a[href], a[href*="/us/en/magazine/"]').forEach((a) => {
      const href = (a.getAttribute("href") || "").replace(/\.html?$/, "");
      if (!/\/us\/en\/magazine\//.test(href)) return;
      if (seen.has(href)) return;
      seen.add(href);
      const titleEl = a.querySelector('.cmp-list__item-title, [class*="title"]');
      const dateEl = a.querySelector('.cmp-list__item-date, [class*="date"]');
      const link = document2.createElement("a");
      link.setAttribute("href", href);
      if (titleEl) {
        link.textContent = titleEl.textContent.replace(/\s+/g, " ").trim();
        const titleP = document2.createElement("p");
        titleP.append(link);
        const cell = [titleP];
        if (dateEl) {
          const dateP = document2.createElement("p");
          dateP.className = "cards-button-date";
          dateP.textContent = dateEl.textContent.replace(/\s+/g, " ").trim();
          cell.push(dateP);
        }
        cells.push([cell]);
      } else {
        link.textContent = (a.textContent || "").replace(/\s+/g, " ").trim();
        cells.push([[link]]);
      }
    });
    const dl = element.querySelector('.cmp-download, .download');
    if (dl) {
      const panel = [];
      const pdfHref = dl.querySelector('.cmp-download__action, a[href*="coredownload"], a[href*=".pdf"]')?.getAttribute("href");
      const titleText = (dl.querySelector('.cmp-download__title')?.textContent || "Download PDF").replace(/\s+/g, " ").trim();
      const title2 = document2.createElement("p");
      if (pdfHref) {
        const titleLink = document2.createElement("a");
        titleLink.setAttribute("href", pdfHref);
        titleLink.textContent = titleText;
        title2.append(titleLink);
      } else {
        title2.textContent = titleText;
      }
      panel.push(title2);
      const descText = (dl.querySelector('.cmp-download__description')?.textContent || "").replace(/\s+/g, " ").trim();
      if (descText) {
        const desc = document2.createElement("p");
        desc.textContent = descText;
        panel.push(desc);
      }
      dl.querySelectorAll('.cmp-download__property').forEach((row) => {
        const value = row.querySelector('.cmp-download__property-content');
        const t = (value ? value.textContent : row.textContent).replace(/\s+/g, " ").trim();
        if (t) {
          const p = document2.createElement("p");
          p.textContent = t;
          panel.push(p);
        }
      });
      if (pdfHref) {
        const a = document2.createElement("a");
        a.setAttribute("href", pdfHref);
        a.textContent = "Download PDF";
        panel.push(a);
      }
      if (panel.length > 1) cells.push([panel]);
    }
    if (cells.length <= 1) { element.replaceWith(...element.childNodes); return; }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards", variants: ["button"], cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-byline.js
  function parseCardsByline(element, { document: document2 }) {
    const image = element.querySelector('.cmp-byline__image img, .cmp-image img, img');
    const name = element.querySelector('.cmp-byline__name, h1, h2, h3, [class*="name"]');
    const role = element.querySelector('.cmp-byline__occupations, [class*="occupation"], [class*="role"]');
    const socials = Array.from(element.querySelectorAll('a[href*="facebook"], a[href*="twitter"], a[href*="insta"]'));
    const mediaCell = [];
    if (image) mediaCell.push(image);
    const textCell = [];
    if (name) {
      const h = document2.createElement("h3");
      h.textContent = name.textContent.trim();
      textCell.push(h);
    }
    if (role) {
      const p = document2.createElement("p");
      p.textContent = role.textContent.replace(/\s+/g, " ").trim();
      textCell.push(p);
    }
    const labels = [["facebook", "Facebook"], ["twitter", "Twitter"], ["insta", "Instagram"]];
    const seenSocial = /* @__PURE__ */ new Set();
    socials.forEach((a) => {
      const href = a.getAttribute("href") || "";
      const match = labels.find(([k]) => new RegExp(k, "i").test(href) || new RegExp(k, "i").test(a.textContent));
      if (!match || seenSocial.has(match[1])) return;
      seenSocial.add(match[1]);
      const link = document2.createElement("a");
      link.setAttribute("href", href || "#");
      link.textContent = match[1];
      const wrap = document2.createElement("p");
      wrap.append(link);
      textCell.push(wrap);
    });
    if (!mediaCell.length && !textCell.length) { element.replaceWith(...element.childNodes); return; }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards", variants: ["people", "horizontal"], cells: [[mediaCell, textCell]] });
    element.replaceWith(block);
  }

  // tools/importer/transformers/wknd-cleanup.js
  var H = { before: "beforeTransform", after: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === H.before) {
      WebImporter.DOMUtils.remove(element, ["#toggleNav", "#mobileNav", "#destination_publishing_iframe_wkndsite_0"]);
    }
    if (hookName === H.after) {
      WebImporter.DOMUtils.remove(element, ["header.experiencefragment", "footer.experiencefragment", "iframe", "meta", "noscript"]);
    }
  }

  // tools/importer/transformers/wknd-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  var SELECTOR_OVERRIDES = { rc9: [".teaser.cmp-teaser--imagebottom"] };
  function resolveSections(root, sections) {
    const used = /* @__PURE__ */ new Set();
    return sections.map((section) => {
      const candidates = [...SELECTOR_OVERRIDES[section.id] || [], ...section.selector || []];
      for (const sel of candidates) {
        const matches = root.querySelectorAll(sel);
        for (const el of matches) {
          if (!used.has(el)) { used.add(el); return el; }
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
        const metadataBlock = WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: { style: section.style } });
        anchor.after(metadataBlock);
        anchor.removeAttribute(SECTION_MARKER_ATTR);
      }
    }
  }

  // tools/importer/import-skateparks.js
  var parsers = {
    breadcrumb: parseBreadcrumb,
    "cards-button": parseCardsButton,
    "cards-byline": parseCardsByline
  };
  var PAGE_TEMPLATE = {
    name: "skateparks-article",
    description: "LA Skateparks article: two-column aside layout (article + share rail) + author bio.",
    urls: ["https://wknd.site/us/en/magazine/guide-la-skateparks.html"],
    blocks: [
      { name: "breadcrumb", instances: [".breadcrumb.cmp-breadcrumb", ".breadcrumb"] },
      { name: "cards-byline", instances: [".cmp-experiencefragment--stacey-roswells", ".cmp-byline"] },
      { name: "cards-button", instances: [".cmp-layoutcontainer--sidebar"] }
    ],
    sections: [
      { id: "rc1", name: "Breadcrumb", selector: [".breadcrumb.cmp-breadcrumb", ".breadcrumb"], style: null, blocks: ["breadcrumb"], defaultContent: [] },
      { id: "rc2", name: "Article + Byline + Share (aside)", selector: [".title:not(.cmp-title--underline):not(.cmp-title--black)", ".title"], style: "aside", blocks: ["cards-byline", "cards-button"], defaultContent: [".title"] }
    ]
  };
  var transformers = [transform, ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []];
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
        document2.querySelectorAll(selector).forEach((element) => {
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    return pageBlocks;
  }

  var import_skateparks_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;

      // source order preserved: article → byline → share rail (mobile stacks
      // article → byline → share, matching the source)
      executeTransformers("beforeTransform", main, payload);

      const seen = /* @__PURE__ */ new Set();
      findBlocksOnPage(document2, PAGE_TEMPLATE).forEach((block) => {
        if (!block.element.parentNode || seen.has(block.name)) return;
        seen.add(block.name);
        const parser = parsers[block.name];
        if (parser) {
          try { parser(block.element, { document: document2, url, params }); }
          catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
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
      return [{ element: main, path, report: { title: document2.title, template: PAGE_TEMPLATE.name } }];
    }
  };
  return __toCommonJS(import_skateparks_exports);
})();
