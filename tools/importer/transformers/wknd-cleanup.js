/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup.
 * Removes non-authorable site chrome and stray markup.
 * All selectors verified against migration-work/cleaned.html.
 */
const H = { before: 'beforeTransform', after: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === H.before) {
    // Overlays / off-canvas nav that could interfere with block parsing.
    // Verified in cleaned.html: #toggleNav (line 568), #mobileNav (line 574),
    // ID-sync iframe (line 566).
    WebImporter.DOMUtils.remove(element, [
      '#toggleNav',
      '#mobileNav',
      '#destination_publishing_iframe_wkndsite_0',
    ]);
  }

  if (hookName === H.after) {
    // Non-authorable global chrome.
    // Verified in cleaned.html:
    //   header.cmp-experiencefragment--header (line 5)
    //   footer.cmp-experiencefragment--footer (line 471)
    //   iframe (line 566)
    WebImporter.DOMUtils.remove(element, [
      'header.experiencefragment',
      'footer.experiencefragment',
      'iframe',
      'meta',
      'noscript',
    ]);
  }
}
