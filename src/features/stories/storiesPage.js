import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";
import { dataClusters, useCases } from "../../data/siteContent.js";
import { getAtlasFilters, setAtlasFilters, setPreferredClusterId } from "../../services/prototypeStore.js";

/** @param {(typeof dataClusters)[number]} cluster */
function clusterCard(cluster) {
  const searchable = [cluster.title, cluster.shortTitle, cluster.description, cluster.sensitivity, cluster.access, ...cluster.examples, ...cluster.useCases]
    .join(" ")
    .toLocaleLowerCase("fa");

  return `
    <article
      class="catalog-card"
      data-catalog-card
      data-cluster-id="${cluster.id}"
      data-sensitivity="${cluster.sensitivity}"
      data-search="${searchable}"
      data-match="true"
    >
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
      <div class="catalog-card__actions">
        <a data-link data-request-cluster="${cluster.id}" class="text-link" href="/request">بررسی دسترسی این خوشه ${icon("arrow")}</a>
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

function filterControls() {
  const filters = getAtlasFilters();
  const sensitivities = ["all", "بسیار حساس", "حساس", "متوسط", "کنترل‌شده"];
  return `
    <div class="prototype-toolbar" aria-label="فیلتر اطلس داده">
      <label class="prototype-search">
        ${icon("search", { size: 18 })}
        <input id="atlas-search" type="search" value="${filters.query}" placeholder="جست‌وجو در خوشه، کاربرد یا نمونه داده…" />
      </label>
      ${sensitivities.map((value) => `
        <button
          type="button"
          class="filter-chip"
          data-atlas-sensitivity="${value}"
          aria-pressed="${filters.sensitivity === value}"
        >${value === "all" ? "همه سطوح" : value}</button>`).join("")}
      <span id="atlas-result-count" class="prototype-result-count">۶ خوشه</span>
    </div>`;
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

    <section class="container">
      ${filterControls()}
      <div class="catalog-grid">${clusters}</div>
    </section>

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

function applyAtlasFilters() {
  const search = document.querySelector("#atlas-search");
  const activeChip = document.querySelector("[data-atlas-sensitivity][aria-pressed='true']");
  const query = search instanceof HTMLInputElement ? search.value.trim().toLocaleLowerCase("fa") : "";
  const sensitivity = activeChip instanceof HTMLElement ? activeChip.getAttribute("data-atlas-sensitivity") ?? "all" : "all";
  let visible = 0;

  document.querySelectorAll("[data-catalog-card]").forEach((card) => {
    const haystack = card.getAttribute("data-search") ?? "";
    const cardSensitivity = card.getAttribute("data-sensitivity") ?? "";
    const matchesQuery = !query || haystack.includes(query);
    const matchesSensitivity = sensitivity === "all" || cardSensitivity === sensitivity;
    const matches = matchesQuery && matchesSensitivity;
    card.setAttribute("data-match", String(matches));
    if (matches) visible += 1;
  });

  const count = document.querySelector("#atlas-result-count");
  if (count instanceof HTMLElement) count.textContent = `${visible} خوشه`;
  setAtlasFilters({ query, sensitivity });
}

export function mountDataCatalogPage() {
  const filters = getAtlasFilters();
  const search = document.querySelector("#atlas-search");
  if (search instanceof HTMLInputElement) search.value = filters.query;

  document.querySelectorAll("[data-atlas-sensitivity]").forEach((chip) => {
    chip.setAttribute("aria-pressed", String(chip.getAttribute("data-atlas-sensitivity") === filters.sensitivity));
    chip.addEventListener("click", () => {
      document.querySelectorAll("[data-atlas-sensitivity]").forEach((item) => item.setAttribute("aria-pressed", String(item === chip)));
      applyAtlasFilters();
    });
  });

  search?.addEventListener("input", applyAtlasFilters);

  document.querySelectorAll("[data-request-cluster]").forEach((link) => {
    link.addEventListener("click", () => {
      const id = link.getAttribute("data-request-cluster");
      if (id) setPreferredClusterId(id);
    });
  });

  applyAtlasFilters();
}

export const renderStoriesPage = renderDataCatalogPage;
