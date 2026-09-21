/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the "Share This Story" right rail. Base: cards (button).
 * Source: https://wknd.site/us/en/magazine/guide-la-skateparks.html
 * Element: the whole sidebar rail (.cmp-layoutcontainer--sidebar) which holds
 * the "SHARE THIS STORY" title, the related-stories "up next" list, and the
 * PDF download panel — NOT just `.download` (that is only the PDF panel).
 *
 * Cards (no images) convention: 1 column, one row per card, the single cell
 * holding text content. Row order here:
 *   - "Share This Story" heading (rendered as a plain block title, not a button)
 *   - each related story: a title link + its date
 *   - the PDF panel: "Get the Full Story" + filename/size/format + Download PDF
 * cards.js (button variant) styles each card as a left-bordered "story button"
 * with a hover-yellow highlight, marks any "Download PDF" link as a button, and
 * renders the heading-only first card as the block title.
 */
export default function parse(element, { document }) {
  const cells = [];

  // block title — heading-only card, styled plain by cards.js (.cards-title)
  const shareHeading = document.createElement('h3');
  shareHeading.textContent = 'Share This Story';
  cells.push([[shareHeading]]);

  // related story buttons: title + date, one card each
  const relatedSel = '.cmp-list--upnext a[href], .cmp-list a[href], a[href*="/us/en/magazine/"]';
  const seen = new Set();
  element.querySelectorAll(relatedSel).forEach((a) => {
    const href = (a.getAttribute('href') || '').replace(/\.html?$/, '');
    if (!/\/us\/en\/magazine\//.test(href)) return;
    if (seen.has(href)) return;
    seen.add(href);
    const titleEl = a.querySelector('.cmp-list__item-title, [class*="title"]');
    const dateEl = a.querySelector('.cmp-list__item-date, [class*="date"]');
    const link = document.createElement('a');
    link.setAttribute('href', href);
    if (titleEl) {
      link.textContent = titleEl.textContent.replace(/\s+/g, ' ').trim();
      const titleP = document.createElement('p');
      titleP.append(link);
      const cell = [titleP];
      if (dateEl) {
        const dateP = document.createElement('p');
        dateP.className = 'cards-button-date';
        dateP.textContent = dateEl.textContent.replace(/\s+/g, ' ').trim();
        cell.push(dateP);
      }
      cells.push([cell]);
    } else {
      link.textContent = (a.textContent || '').replace(/\s+/g, ' ').trim();
      cells.push([[link]]);
    }
  });

  // PDF panel — title ("Download PDF") + description ("Get the Full Story")
  // + the spec values (filename / size / format, values only, no labels)
  // + the Download PDF link.
  const dl = element.querySelector('.cmp-download, .download');
  if (dl) {
    const panel = [];
    const rawHref = dl.querySelector('.cmp-download__action, a[href*="coredownload"], a[href*=".pdf"]')?.getAttribute('href');
    // The source href is an AEM-author DAM path
    // (/content/dam/.../ultimateguidetolaskateparks.pdf.coredownload.pdf) that
    // 404s on EDS. Rewrite it to the PDF hosted on the content bus alongside
    // the page so the download actually works.
    const pdfHref = rawHref && /coredownload/.test(rawHref)
      ? '/us/en/magazine/la-skateparks/ultimateguidetolaskateparks.pdf'
      : rawHref;

    // title ("Download PDF") — a link to the same PDF as the button
    const titleText = (dl.querySelector('.cmp-download__title')?.textContent || 'Download PDF').replace(/\s+/g, ' ').trim();
    const title = document.createElement('p');
    if (pdfHref) {
      const titleLink = document.createElement('a');
      titleLink.setAttribute('href', pdfHref);
      titleLink.textContent = titleText;
      title.append(titleLink);
    } else {
      title.textContent = titleText;
    }
    panel.push(title);

    const descText = (dl.querySelector('.cmp-download__description')?.textContent || '').replace(/\s+/g, ' ').trim();
    if (descText) {
      const desc = document.createElement('p');
      desc.textContent = descText;
      panel.push(desc);
    }

    // spec: emit the property VALUE only (source shows values, not the labels)
    dl.querySelectorAll('.cmp-download__property').forEach((row) => {
      const value = row.querySelector('.cmp-download__property-content');
      const t = (value ? value.textContent : row.textContent).replace(/\s+/g, ' ').trim();
      if (t) {
        const p = document.createElement('p');
        p.textContent = t;
        panel.push(p);
      }
    });

    if (pdfHref) {
      const a = document.createElement('a');
      a.setAttribute('href', pdfHref);
      a.textContent = 'Download PDF';
      panel.push(a);
    }
    if (panel.length > 1) cells.push([panel]);
  }

  // only the heading was produced — nothing to share; unwrap rather than emit
  if (cells.length <= 1) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', variants: ['button'], cells });
  element.replaceWith(block);
}
