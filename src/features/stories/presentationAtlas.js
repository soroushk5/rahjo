import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";
import { dataClusters, useCases } from "../../data/siteContent.js";
import { demoPortfolio } from "../../data/presentationData.js";
import { getPreferredClusterId, setPreferredClusterId } from "../../services/prototypeStore.js";
import { escapeHtml } from "../../lib/html.js";

let activeClusterId = "vehicle";
let activeSensitivity = "all";
let query = "";

function hydratePreferredCluster() {
  const preferred = getPreferredClusterId();
  if (preferred && dataClusters.some((item) => item.id === preferred)) activeClusterId = preferred;
}

function activeCluster() {
  return dataClusters.find((item) => item.id === activeClusterId) ?? dataClusters[0];
}

/** @param {string} id */
function portfolioFor(id) {
  const index = dataClusters.findIndex((item) => item.id === id);
  return demoPortfolio[index] ?? demoPortfolio[0];
}

/** @param {string} value */
function sensitivityClass(value) {
  if (value.includes("بسیار")) return "critical";
  if (value === "حساس") return "high";
  if (value === "متوسط") return "medium";
  return "controlled";
}

function atlasCards() {
  return dataClusters.map((cluster) => {
    const readiness = portfolioFor(cluster.id);
    const searchable = [cluster.title, cluster.shortTitle, cluster.description, cluster.sensitivity, cluster.access, ...cluster.examples, ...cluster.useCases].join(" ").toLocaleLowerCase("fa");
    return `
      <button class="atlas-cluster-card atlas-cluster-card--${sensitivityClass(cluster.sensitivity)}" type="button" data-atlas-cluster="${cluster.id}" data-search="${escapeHtml(searchable)}" data-sensitivity="${cluster.sensitivity}" aria-pressed="${cluster.id === activeClusterId}">
        <header><span>${icon(cluster.icon, { size: 23 })}</span><div><small>${cluster.sensitivity}</small><strong>${cluster.title}</strong></div><em>${readiness.progress}%</em></header>
        <p>${cluster.description}</p>
        <div class="atlas-cluster-card__tags">${cluster.examples.map((item) => `<span>${item}</span>`).join("")}</div>
        <footer><span>${cluster.access}</span><i><b style="--progress:${readiness.progress}%"></b></i></footer>
      </button>`;
  }).join("");
}

function clusterDetail() {
  const cluster = activeCluster();
  const readiness = portfolioFor(cluster.id);
  return `
    <div class="atlas-detail__head"><span class="atlas-detail__icon">${icon(cluster.icon, { size: 26 })}</span><div><small>خوشه انتخاب‌شده</small><h2>${cluster.title}</h2></div><span class="sensitivity-pill sensitivity-pill--${sensitivityClass(cluster.sensitivity)}">${cluster.sensitivity}</span></div>
    <p>${cluster.description}</p>
    <dl class="atlas-detail__facts"><div><dt>مدل دسترسی</dt><dd>${cluster.access}</dd></div><div><dt>وضعیت سبد</dt><dd>${cluster.status}</dd></div><div><dt>آمادگی نمایشی</dt><dd>${readiness.progress}%</dd></div><div><dt>وضعیت عرضه</dt><dd>${readiness.launch}</dd></div></dl>
    <div class="atlas-detail__section"><small>نمونه داده‌های احتمالی</small><div class="tag-row">${cluster.examples.map((item) => `<span>${item}</span>`).join("")}</div></div>
    <div class="atlas-detail__section"><small>کاربردهای محتمل</small><ul>${cluster.useCases.map((item) => `<li>${item}</li>`).join("")}</ul></div>
    <div class="atlas-detail__gate">${icon("shield", { size: 19 })}<div><strong>Gate این خوشه هنوز بسته است.</strong><small>انتخاب خوشه فقط context دمو را نگه می‌دارد و به معنی دسترسی یا فعال بودن سرویس نیست.</small></div></div>
    <div class="atlas-detail__actions">
      <a data-link data-context-cluster="${cluster.id}" class="button button--secondary" href="/map">دیدن مسیر در نقشه</a>
      <a data-link id="atlas-request-link" data-context-cluster="${cluster.id}" class="button button--primary" href="/request">بررسی مسیر دسترسی ${icon("arrow", { size: 15 })}</a>
    </div>`;
}

function industryRows() {
  return useCases.map((item, index) => `
    <article class="atlas-usecase-row"><span>0${index + 1}</span><div><small>${item.industry}</small><h3>${item.title}</h3><p>${item.problem}</p></div><div>${item.data.map((entry) => `<em>${entry}</em>`).join("")}</div><footer>${icon("lock", { size: 17 })}${item.control}</footer></article>`).join("");
}

export function renderPresentationAtlasPage() {
  hydratePreferredCluster();
  const content = `
    <section class="atlas-hero"><div class="container"><div><h1>اطلس داده رهجو</h1><p>سبد اولیه در شش خوشه دیده می‌شود؛ همراه با حساسیت، مدل دسترسی، کاربرد و وضعیت آمادگی. انتخاب شما بین اطلس، مپ و درخواست حفظ می‌شود.</p></div><div class="atlas-hero__stats"><span><strong>۵۲</strong><small>عنوان در سبد بررسی</small></span><span><strong>۰۶</strong><small>خوشه داده</small></span><span><strong>۰۰</strong><small>ادعای عمومی تأییدشده</small></span></div></div></section>

    <section class="container atlas-workspace">
      <div class="atlas-toolbar"><label class="atlas-search">${icon("search", { size: 18 })}<input id="presentation-atlas-search" type="search" placeholder="جست‌وجو در خوشه، کاربرد یا نمونه داده…" /></label><div class="atlas-filters">${["all", "بسیار حساس", "حساس", "متوسط", "کنترل‌شده"].map((value) => `<button type="button" data-atlas-filter="${value}" aria-pressed="${activeSensitivity === value}">${value === "all" ? "همه" : value}</button>`).join("")}</div><span id="atlas-visible-count">۶ خوشه</span></div>
      <div class="atlas-master-detail"><div id="atlas-card-grid" class="atlas-card-grid">${atlasCards()}</div><aside id="atlas-detail" class="atlas-detail">${clusterDetail()}</aside></div>
    </section>

    <section class="atlas-usecases"><div class="container"><header><div><small>کاربرد سازمانی</small><h2>داده زمانی معنا پیدا می‌کند که در یک تصمیم واقعی مصرف شود.</h2></div><a data-link class="text-link" href="/map">نقشه منبع تا کاربرد ${icon("arrow")}</a></header><div>${industryRows()}</div></div></section>`;
  return siteShell({ content, activePath: "/data" });
}

function applyFilters() {
  let visible = 0;
  document.querySelectorAll("[data-atlas-cluster]").forEach((card) => {
    const matchesQuery = !query || (card.getAttribute("data-search") ?? "").includes(query);
    const matchesSensitivity = activeSensitivity === "all" || card.getAttribute("data-sensitivity") === activeSensitivity;
    const show = matchesQuery && matchesSensitivity;
    card.toggleAttribute("hidden", !show);
    if (show) visible += 1;
  });
  const count = document.querySelector("#atlas-visible-count");
  if (count instanceof HTMLElement) count.textContent = `${visible} خوشه`;
}

function mountContextLinks() {
  document.querySelectorAll("[data-context-cluster]").forEach((link) => link.addEventListener("click", () => {
    const cluster = link.getAttribute("data-context-cluster");
    if (cluster) setPreferredClusterId(cluster);
  }, { once: true }));
}

export function mountPresentationAtlasPage() {
  const search = document.querySelector("#presentation-atlas-search");
  search?.addEventListener("input", () => {
    if (search instanceof HTMLInputElement) query = search.value.trim().toLocaleLowerCase("fa");
    applyFilters();
  });

  document.querySelectorAll("[data-atlas-filter]").forEach((filter) => {
    filter.addEventListener("click", () => {
      activeSensitivity = filter.getAttribute("data-atlas-filter") ?? "all";
      document.querySelectorAll("[data-atlas-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === filter)));
      applyFilters();
    });
  });

  document.querySelectorAll("[data-atlas-cluster]").forEach((card) => {
    card.addEventListener("click", () => {
      activeClusterId = card.getAttribute("data-atlas-cluster") ?? dataClusters[0].id;
      setPreferredClusterId(activeClusterId);
      document.querySelectorAll("[data-atlas-cluster]").forEach((item) => item.setAttribute("aria-pressed", String(item === card)));
      const detail = document.querySelector("#atlas-detail");
      if (detail instanceof HTMLElement) detail.innerHTML = clusterDetail();
      mountContextLinks();
    });
  });

  applyFilters();
  mountContextLinks();
}
