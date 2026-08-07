import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";
import { controlLayers, dataClusters, platformLayers, useCases } from "../../data/siteContent.js";

let activeClusterId = "vehicle";
let activeLayerId = "source";

function activeCluster() {
  return dataClusters.find((cluster) => cluster.id === activeClusterId) ?? dataClusters[0];
}

function activeLayer() {
  return controlLayers.find((layer) => layer.id === activeLayerId) ?? controlLayers[0];
}

/** @param {string} sensitivity */
function sensitivityTone(sensitivity) {
  if (sensitivity.includes("بسیار")) return "critical";
  if (sensitivity === "حساس") return "high";
  if (sensitivity === "متوسط") return "medium";
  return "controlled";
}

function networkLines() {
  return dataClusters
    .map((cluster) => `<line x1="50%" y1="50%" x2="${cluster.x}%" y2="${cluster.y}%" />`)
    .join("");
}

function dataNetwork() {
  const nodes = dataClusters
    .map(
      (cluster) => `
        <button
          class="network-node"
          style="--x:${cluster.x}%;--y:${cluster.y}%"
          type="button"
          data-cluster-id="${cluster.id}"
          data-sensitivity="${sensitivityTone(cluster.sensitivity)}"
          aria-pressed="${activeClusterId === cluster.id}"
        >
          <span>${icon(cluster.icon, { size: 18 })}</span>
          ${cluster.shortTitle}
        </button>`
    )
    .join("");

  return `
    <div class="data-network" aria-label="خوشه‌های داده رهجو">
      <svg class="data-network__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        ${networkLines()}
        <circle cx="50" cy="50" r="24" />
      </svg>
      <div class="network-core">
        <span>${icon("lock", { size: 26 })}</span>
        <strong>رهجو</strong>
        <small>کنترل دسترسی</small>
      </div>
      ${nodes}
    </div>`;
}

function clusterPreview() {
  const cluster = activeCluster();
  const examples = cluster.examples.map((item) => `<span>${item}</span>`).join("");
  const useCasesMarkup = cluster.useCases.map((item) => `<li>${item}</li>`).join("");

  return `
    <article class="cluster-preview">
      <div class="cluster-preview__head">
        <span class="cluster-preview__icon">${icon(cluster.icon, { size: 24 })}</span>
        <div>
          <small>خوشه انتخاب‌شده</small>
          <h3>${cluster.title}</h3>
        </div>
      </div>
      <p>${cluster.description}</p>
      <div class="cluster-preview__meta">
        <span><small>حساسیت</small><strong>${cluster.sensitivity}</strong></span>
        <span><small>مدل دسترسی</small><strong>${cluster.access}</strong></span>
        <span><small>وضعیت</small><strong>${cluster.status}</strong></span>
      </div>
      <div class="tag-row">${examples}</div>
      <ul>${useCasesMarkup}</ul>
    </article>`;
}

function controlTabs() {
  return controlLayers
    .map(
      (layer) => `
        <button
          class="control-tab"
          type="button"
          data-layer-id="${layer.id}"
          aria-pressed="${activeLayerId === layer.id}"
        >
          <span>${layer.number}</span>
          ${layer.label}
        </button>`
    )
    .join("");
}

function controlPanel() {
  const layer = activeLayer();
  return `
    <article class="control-panel">
      <div>
        <p class="eyebrow">${layer.number} / ${layer.label}</p>
        <h2>${layer.title}</h2>
        <p>${layer.text}</p>
      </div>
      <div class="control-artifact">
        <span>${icon(layer.icon, { size: 26 })}</span>
        <small>خروجی کنترل</small>
        <strong>${layer.artifact}</strong>
        <p>${layer.meta}</p>
      </div>
    </article>`;
}

function platformCards() {
  return platformLayers
    .slice(0, 4)
    .map(
      (layer) => `
        <article class="architecture-card">
          <span>${icon(layer.icon, { size: 24 })}</span>
          <small>${layer.label}</small>
          <h3>${layer.title}</h3>
          <p>${layer.text}</p>
        </article>`
    )
    .join("");
}

function useCaseCards() {
  return useCases
    .map(
      (item) => `
        <article class="use-case-card">
          <div class="use-case-card__label">${item.industry}</div>
          <h3>${item.title}</h3>
          <p>${item.problem}</p>
          <div>
            <small>داده مورد نیاز</small>
            <ul>${item.data.map((dataItem) => `<li>${dataItem}</li>`).join("")}</ul>
          </div>
          <footer>${icon("shield", { size: 17 })}<span>${item.control}</span></footer>
        </article>`
    )
    .join("");
}

export function renderMarketingPage() {
  const content = `
    <section class="hero hero--data">
      <div class="container hero__grid">
        <div class="hero-copy">
          <p class="eyebrow">CONTROLLED DATA ACCESS PLATFORM</p>
          <h1>داده‌های دشوار، برای استفاده سازمانی قابل‌کنترل می‌شوند.</h1>
          <p class="hero__lead">
            رهجو لایه‌ای میان منابع داده حساس و فرایندهای کسب‌وکار می‌سازد؛
            منبع را روشن می‌کند، دسترسی را محدود می‌کند و مصرف را قابل ممیزی نگه می‌دارد.
          </p>
          <div class="hero__actions">
            <a data-link class="button button--primary" href="/data">مشاهده اطلس داده ${icon("arrow")}</a>
            <a data-link class="button button--secondary" href="/request">بررسی مسیر دسترسی</a>
          </div>
          <div class="hero-proof">
            <span>${icon("shield")}</span>
            <p>
              <strong>۵۲ عنوان در سبد بررسی، نه ۵۲ سرویس فعال</strong>
              <small>هر اتصال فقط پس از اثبات منبع، حق عرضه و شرایط استفاده فعال می‌شود.</small>
            </p>
          </div>
        </div>

        <div class="hero-network-wrap">
          ${dataNetwork()}
          <div class="network-legend" aria-label="راهنمای سطح حساسیت">
            <span><i class="critical"></i>بسیار حساس</span>
            <span><i class="high"></i>حساس</span>
            <span><i class="medium"></i>متوسط</span>
            <span><i class="controlled"></i>کنترل‌شده</span>
          </div>
          <div id="cluster-preview">${clusterPreview()}</div>
        </div>
      </div>
    </section>

    <section class="positioning-band">
      <div class="container positioning-grid">
        <div>
          <p class="eyebrow eyebrow--light">جایگاه رهجو</p>
          <h2>واسط کنترل‌شده میان منبع داده و کاربرد سازمانی</h2>
        </div>
        <p>
          ارزش اصلی در جمع‌کردن APIهای پراکنده نیست؛ در این است که سازمان بداند
          به چه داده‌ای، برای چه هدفی، با چه مجوزی و تا چه زمانی دسترسی دارد.
        </p>
        <div class="positioning-stat">
          <strong>منبع</strong><span>+</span><strong>مجوز</strong><span>+</span><strong>کنترل</strong><span>+</span><strong>ممیزی</strong>
        </div>
      </div>
    </section>

    <section class="control-system">
      <div class="container">
        <div class="section-heading">
          <p class="eyebrow">مدل دسترسی</p>
          <h2>چهار لایه پیش از آنکه داده به پاسخ تبدیل شود</h2>
          <p>این چهار لایه، منطق مشترک سایت، کنسول و فرایند درخواست دسترسی را می‌سازند.</p>
        </div>
        <div class="control-tabs" role="tablist">${controlTabs()}</div>
        <div id="control-panel">${controlPanel()}</div>
      </div>
    </section>

    <section class="architecture-section">
      <div class="container">
        <div class="section-heading section-heading--split">
          <div>
            <p class="eyebrow">معماری پلتفرم</p>
            <h2>از اتصال منبع تا مصرف قابل ممیزی</h2>
          </div>
          <p>هر لایه یک مسئولیت روشن دارد تا UI، منطق دسترسی و تأمین‌کننده داده به هم گره نخورند.</p>
        </div>
        <div class="architecture-grid">${platformCards()}</div>
        <a data-link class="text-link" href="/platform">دیدن معماری کامل ${icon("arrow")}</a>
      </div>
    </section>

    <section class="use-cases-section">
      <div class="container">
        <div class="section-heading">
          <p class="eyebrow">کاربردهای اولویت‌دار</p>
          <h2>داده زمانی ارزش دارد که یک اصطکاک واقعی را حذف کند</h2>
        </div>
        <div class="use-case-grid">${useCaseCards()}</div>
      </div>
    </section>

    <section class="container">
      <div class="cta-band">
        <div>
          <p class="eyebrow eyebrow--light">ACCESS REQUEST</p>
          <h2>اول کاربرد و شرایط دسترسی را مشخص کنید؛ بعد درباره اتصال حرف بزنیم.</h2>
          <p>نسخه فعلی مسیر ارزیابی مشتری، هدف استفاده و سطح دسترسی را به‌صورت نمایشی اجرا می‌کند.</p>
        </div>
        <a data-link class="button button--light" href="/request">ثبت درخواست نمونه</a>
      </div>
    </section>`;

  return siteShell({ content, activePath: "/" });
}

/** @param {() => void} rerender */
export function mountMarketingPage(rerender) {
  void rerender;

  document.querySelectorAll("[data-cluster-id]").forEach((button) => {
    button.addEventListener("click", () => {
      activeClusterId = button.getAttribute("data-cluster-id") ?? dataClusters[0].id;
      document.querySelectorAll("[data-cluster-id]").forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
      const preview = document.querySelector("#cluster-preview");
      if (preview instanceof HTMLElement) preview.innerHTML = clusterPreview();
    });
  });

  document.querySelectorAll("[data-layer-id]").forEach((button) => {
    button.addEventListener("click", () => {
      activeLayerId = button.getAttribute("data-layer-id") ?? controlLayers[0].id;
      document.querySelectorAll("[data-layer-id]").forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
      const panel = document.querySelector("#control-panel");
      if (panel instanceof HTMLElement) panel.innerHTML = controlPanel();
    });
  });
}
