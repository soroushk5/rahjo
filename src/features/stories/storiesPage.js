import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";
import { dataClusters, useCases } from "../../data/siteContent.js";

/** @param {(typeof dataClusters)[number]} cluster */
function clusterCard(cluster) {
  return `
    <article class="catalog-card">
      <header>
        <span>${icon(cluster.icon, { size: 24 })}</span>
        <div>
          <small>${cluster.status}</small>
          <h2>${cluster.title}</h2>
        </div>
      </header>
      <p>${cluster.description}</p>
      <dl>
        <div><dt>سطح حساسیت</dt><dd>${cluster.sensitivity}</dd></div>
        <div><dt>مدل دسترسی</dt><dd>${cluster.access}</dd></div>
      </dl>
      <div class="catalog-card__section">
        <small>نمونه داده‌های احتمالی</small>
        <div class="tag-row">${cluster.examples.map((/** @type {string} */ item) => `<span>${item}</span>`).join("")}</div>
      </div>
      <div class="catalog-card__section">
        <small>کاربردهای محتمل</small>
        <ul>${cluster.useCases.map((/** @type {string} */ item) => `<li>${item}</li>`).join("")}</ul>
      </div>
      <footer>${icon("shield", { size: 16 })}عرضه فقط پس از تکمیل ممیزی اختصاصی</footer>
    </article>`;
}

/** @param {(typeof useCases)[number]} item @param {number} index */
function useCaseRow(item, index) {
  return `
    <article class="industry-row">
      <span class="industry-row__index">${String(index + 1).padStart(2, "0")}</span>
      <div>
        <small>${item.industry}</small>
        <h3>${item.title}</h3>
        <p>${item.problem}</p>
      </div>
      <ul>${item.data.map((/** @type {string} */ dataItem) => `<li>${dataItem}</li>`).join("")}</ul>
      <div class="industry-row__control">${icon("lock", { size: 17 })}${item.control}</div>
    </article>`;
}

export function renderDataCatalogPage() {
  const clusters = dataClusters.map(clusterCard).join("");
  const industries = useCases.map(useCaseRow).join("");

  const content = `
    <section class="page-hero page-hero--catalog">
      <div class="container split-heading">
        <div>
          <p class="eyebrow">DATA ATLAS</p>
          <h1>اطلس داده رهجو</h1>
        </div>
        <p>
          یک نمای طبقه‌بندی‌شده از حوزه‌های داده‌ای، سطح حساسیت و مدل دسترسی.
          این صفحه فهرست سرویس فعال نیست؛ نقشه سبدی است که باید ممیزی شود.
        </p>
      </div>
    </section>

    <section class="container catalog-summary">
      <div><strong>۵۲</strong><span>عنوان در سبد اولیه</span></div>
      <div><strong>۰۶</strong><span>خوشه داده‌ای</span></div>
      <div><strong>۰۰</strong><span>ادعای عمومی تأییدشده</span></div>
      <p>تفاوت میان «عنوان محصول» و «سرویس آماده عرضه» عمداً در رابط حفظ شده است.</p>
    </section>

    <section class="container catalog-grid">${clusters}</section>

    <section class="industry-section">
      <div class="container">
        <div class="section-heading">
          <p class="eyebrow">کاربردهای سازمانی</p>
          <h2>خوشه‌ها بر اساس مسئله مشتری کنار هم قرار می‌گیرند</h2>
        </div>
        <div class="industry-list">${industries}</div>
      </div>
    </section>`;

  return siteShell({ content, activePath: "/data" });
}

export const renderStoriesPage = renderDataCatalogPage;
