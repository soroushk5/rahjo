import { icon } from "./icons.js";
import { journeyNeighbors, publicJourney } from "../app/navigation.js";

/** @param {string} activePath */
export function journeyRail(activePath) {
  const { previous, next } = journeyNeighbors(activePath);
  const currentIndex = publicJourney.findIndex((item) => item.path === activePath);
  if (currentIndex < 0) return "";

  const steps = publicJourney.map((item, index) => `
    <a data-link class="journey-step" href="${item.path}" aria-current="${index === currentIndex ? "step" : "false"}" data-complete="${index < currentIndex}">
      <span>${item.index}</span>
      <div><small>${item.label}</small><strong>${item.title}</strong></div>
      ${index < currentIndex ? icon("check", { size: 14 }) : ""}
    </a>`).join("");

  return `
    <section class="journey-rail-section" aria-label="مسیر پیشنهادی مشاهده محصول">
      <div class="container journey-rail">
        <header class="journey-rail__head">
          <div><small>PRODUCT WALKTHROUGH</small><strong>مسیر پیشنهادی مشاهده رهجو</strong></div>
          <span>${currentIndex + 1} از ${publicJourney.length}</span>
        </header>
        <nav class="journey-rail__steps">${steps}</nav>
        <footer class="journey-rail__actions">
          ${previous ? `<a data-link class="journey-back" href="${previous.path}">${icon("arrow", { size: 15 })}<span><small>مرحله قبل</small><strong>${previous.label}</strong></span></a>` : '<span></span>'}
          ${next ? `<a data-link class="journey-next" href="${next.path}"><span><small>مرحله بعد</small><strong>${next.label}</strong></span>${icon("arrow", { size: 16 })}</a>` : `<a data-link class="journey-next" href="/dashboard"><span><small>ادامه در محصول</small><strong>نمای کلی کنسول</strong></span>${icon("arrow", { size: 16 })}</a>`}
        </footer>
      </div>
    </section>`;
}
