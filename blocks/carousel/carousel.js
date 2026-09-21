function updateActiveSlide(slide) {
  const block = slide.closest('.carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-slide');

  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  indicators.forEach((indicator, idx) => {
    const button = indicator.querySelector('button');
    if (idx !== slideIndex) {
      button.removeAttribute('disabled');
      button.removeAttribute('aria-current');
    } else {
      button.setAttribute('disabled', true);
      button.setAttribute('aria-current', true);
    }
  });
}

export function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    });
  });

  block.querySelector('.slide-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  });

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    if (colIdx === 0) {
      column.classList.add('carousel-slide-image');
      slide.append(column);
      return;
    }
    // The content cell is optional: an image-only slide authors an empty second
    // cell. Keep it only when it holds real content, otherwise drop it so the
    // hero-img content card doesn't render as an empty white box.
    const hasContent = column.textContent.trim()
      || column.querySelector('img, picture, a, h1, h2, h3, h4, h5, h6, ul, ol, button');
    if (hasContent) {
      column.classList.add('carousel-slide-content');
      slide.append(column);
    }
  });

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-${carouselId}`);
  const rows = block.querySelectorAll(':scope > div');

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');
  block.prepend(slidesWrapper);

  // Always render the slide controls — even a single-slide carousel shows the
  // indicator dot and prev/next arrows (source parity).
  // A single <nav> holds both the indicator dots and the prev/next buttons as
  // siblings, so they lay out on one control row (dots centered, arrows right).
  const slideControlsNav = document.createElement('nav');
  slideControlsNav.setAttribute('aria-label', 'Carousel Slide Controls');

  const slideIndicators = document.createElement('ol');
  slideIndicators.classList.add('carousel-slide-indicators');
  slideControlsNav.append(slideIndicators);

  const slideNavButtons = document.createElement('div');
  slideNavButtons.classList.add('carousel-navigation-buttons');
  slideNavButtons.innerHTML = `
    <button type="button" class= "slide-prev" aria-label="Previous Slide"></button>
    <button type="button" class="slide-next" aria-label="Next Slide"></button>
  `;
  slideControlsNav.append(slideNavButtons);

  block.append(slideControlsNav);

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="Show Slide ${idx + 1} of ${rows.length}"></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  // hero-img variant (homepage hero): promote the first slide's heading to <h1>
  // so the page has exactly one top-level heading (SEO + a11y). Only when the
  // page has no <h1> yet, and preserving the heading's id (used by
  // aria-labelledby on the slide).
  if (block.classList.contains('hero-img') && !document.querySelector('main h1')) {
    const firstHeading = slidesWrapper.querySelector('.carousel-slide h2, .carousel-slide h3');
    if (firstHeading) {
      const h1 = document.createElement('h1');
      h1.innerHTML = firstHeading.innerHTML;
      [...firstHeading.attributes].forEach((attr) => h1.setAttribute(attr.name, attr.value));
      firstHeading.replaceWith(h1);
    }
  }

  bindEvents(block);
}
