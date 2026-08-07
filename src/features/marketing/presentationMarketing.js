import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";
import { dataClusters, controlLayers, useCases } from "../../data/siteContent.js";
import { demoOverviewMetrics, demoPortfolio, demoSeedRequests } from "../../data/presentationData.js";
import { setPreferredClusterId } from "../../services/prototypeStore.js";

let activeClusterId = "vehicle";
let activeControlId = "policy";

function cluster() {
  return dataClusters.find((item) => item.id === activeClusterId) ?? dataClusters[0];
}

function control() {
  return controlLayers.find((item) => item.id === activeControlId) ?? controlLayers[0];
}

/** @param {string} sensitivity */
function tone(sensitivity) {
  if (sensitivity.includes("بسیار")) return "critical";
  if (sensitivity === "حساس") return "high";
  if (sensitivity === "متوسط") return "medium";
  return "controlled";
}

function heroDataStage() {
  return `
    <div class="hero-data-stage" aria-label="نمایش تعاملی خوشه‌های داده">
      <div class="hero-data-stage__halo"></div>
      <svg class="hero-data-stage__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        ${dataClusters.map((item) => `<line x1="50" y1="50" x2="${item.x}" y2="${item.y}" />`).join("")}
        <circle cx="50" cy="50" r="26" />
        <circle cx="50" cy="50" r="34" />
      </svg>
      <div class="hero-data-stage__core">
        <span>${icon("lock", { size: 26 })}</span>
        <strong>رهجو</strong>
        <small>کنترل دسترسی</small>
      </div>
      ${dataClusters.map((item) => `
        <button class="hero-data-node hero-data-node--${tone(item.sensitivity)}" style="--x:${item.x}%;--y:${item.y}%" type="button" data-hero-cluster="${item.id}" aria-pressed="${activeClusterId === item.id}">
          <span>${icon(item.icon, { size: 18 })}</span><b>${item.shortTitle}</b><small>${item.sensitivity}</small>
        </button>`).join("")}
      <div id="hero-cluster-detail" class="hero-cluster-detail">${clusterDetail()}</div>
    </div>`;
}

function clusterDetail() {
  const item = cluster();
  return `
    <div><span class="hero-cluster-detail__icon">${icon(item.icon, { size: 20 })}</span><div><small>خوشه انتخاب‌شده</small><strong>${item.title}</strong></div></div>
    <p>${item.description}</p>
    <footer><span>${item.access}</span><a data-link data-request-selected-cluster="${item.id}" href="/request">بررسی مسیر دسترسی ${icon("arrow", { size: 15 })}</a></footer>`;
}

function controlRail() {
  return controlLayers.map((layer) => `
    <button type="button" class="control-rail__item" data-control-layer="${layer.id}" aria-pressed="${activeControlId === layer.id}">
      <span>${layer.number}</span><div><strong>${layer.label}</strong><small>${layer.artifact}</small></div>
    </button>`).join("");
}

function controlDetail() {
  const layer = control();
  return `
    <div class="control-focus__copy"><span class="control-focus__number">${layer.number}</span><div><h3>${layer.title}</h3><p>${layer.text}</p><div class="control-focus__meta">${icon(layer.icon, { size: 18 })}<strong>${layer.artifact}</strong><span>${layer.meta}</span></div></div></div>
    <div class="control-focus__visual">
      <span class="control-focus__visual-icon">${icon(layer.icon, { size: 30 })}</span>
      <div><small>تصمیم این لایه</small><strong>${layer.label}</strong><p>هر پاسخ باید از این Gate عبور کند تا به کانال تحویل برسد.</p></div>
      <span class="control-focus__status">Demo policy</span>
    </div>`;
}

function useCaseCards() {
  return useCases.map((item, index) => `
    <article class="usecase-story">
      <span class="usecase-story__index">0${index + 1}</span>
      <div><small>${item.industry}</small><h3>${item.title}</h3><p>${item.problem}</p></div>
      <div class="usecase-story__data"><small>داده مورد نیاز</small>${item.data.map((entry) => `<span>${entry}</span>`).join("")}</div>
      <footer>${icon("shield", { size: 17 })}<span>${item.control}</span></footer>
    </article>`).join("");
}

function miniConsole() {
  const sampleRows = demoSeedRequests.slice(0, 3);
  return `
    <div class="landing-console" aria-label="پیش‌نمایش کنسول رهجو">
      <aside><div class="landing-console__mark">${icon("node", { size: 22 })}</div><span class="active">${icon("dashboard", { size: 17 })}نمای کلی</span><span>${icon("requests", { size: 17 })}درخواست‌ها</span><span>${icon("database", { size: 17 })}سبد داده</span><span>${icon("audit", { size: 17 })}ممیزی</span></aside>
      <div class="landing-console__main">
        <header><div><small>محیط نمایشی</small><strong>کنسول کنترل داده</strong></div><span class="demo-badge">Sandbox</span></header>
        <div class="landing-console__metrics">${demoOverviewMetrics.slice(0, 3).map((metric) => `<div><small>${metric.label}</small><strong>${metric.value}</strong></div>`).join("")}</div>
        <div class="landing-console__body">
          <section><small>آمادگی خوشه‌ها</small>${demoPortfolio.slice(0, 4).map((row) => `<div class="console-readiness"><span>${row.cluster}</span><i><b style="--progress:${row.progress}%"></b></i><em>${row.progress}%</em></div>`).join("")}</section>
          <section><small>درخواست‌های اخیر</small>${sampleRows.map((row) => `<div class="console-request"><span>${icon("requests", { size: 15 })}</span><div><strong>${row.referenceId}</strong><small>${row.organization}</small></div><em>${row.status}</em></div>`).join("")}</section>
        </div>
      </div>
    </div>`;
}

export function renderPresentationMarketingPage() {
  const content = `
    <section class="present-hero">
      <div class="container present-hero__grid">
        <div class="present-hero__copy">
          <h1>داده‌ای که همه‌جا نیست، باید با کنترل بیشتری حرکت کند.</h1>
          <p>رهجو لایه‌ای میان منابع داده حساس و فرایندهای سازمانی می‌سازد؛ منبع، حق استفاده، سطح دسترسی و رد مصرف را در یک جریان قابل‌کنترل کنار هم قرار می‌دهد.</p>
          <div class="present-hero__actions"><a data-link class="button button--primary" href="/data">دیدن اطلس داده ${icon("arrow")}</a><a data-link class="button button--secondary" href="/login">ورود به دموی کنسول</a></div>
          <div class="present-hero__proof"><span>${icon("shield", { size: 20 })}</span><div><strong>۵۲ عنوان در سبد بررسی، نه ۵۲ سرویس فعال</strong><small>نسخه ارائه عمداً بین موجودی سبد، مدرک منبع و امکان عرضه تفاوت می‌گذارد.</small></div></div>
        </div>
        <div class="present-hero__visual">${heroDataStage()}</div>
      </div>
    </section>

    <section class="principle-strip"><div class="container">${[
      ["shield", "اعتماد", "دسترسی فقط با Gate"],
      ["node", "دقت", "منبع و Purpose روشن"],
      ["layers", "ساختار", "قراردادهای داده پایدار"],
      ["audit", "قابلیت بازبینی", "رد تصمیم و رخداد"]
    ].map(([iconName, title, text]) => `<div><span>${icon(iconName, { size: 21 })}</span><p><strong>${title}</strong><small>${text}</small></p></div>`).join("")}</div></section>

    <section class="present-control-section">
      <div class="container">
        <header class="present-section-head"><div><small>مدل محصول</small><h2>داده قبل از پاسخ، چهار تصمیم را طی می‌کند.</h2></div><p>به‌جای فهرست‌کردن APIهای پراکنده، معماری رهجو روی مسیر «منبع → دسترسی → تحویل → ممیزی» بنا شده است.</p></header>
        <div class="present-control-layout"><nav class="control-rail" aria-label="لایه‌های کنترل">${controlRail()}</nav><article id="control-focus" class="control-focus">${controlDetail()}</article></div>
      </div>
    </section>

    <section class="present-product-section">
      <div class="container present-product-grid"><div class="present-product-copy"><small>محصول در عمل</small><h2>همان منطق کنترل، داخل کنسول تبدیل به تصمیم قابل‌نمایش می‌شود.</h2><p>کاربر سازمانی می‌تواند درخواست را ثبت کند، وضعیت Gate را ببیند، سبد داده را مرور کند و رد ممیزی را دنبال کند؛ همه در یک Workspace واحد.</p><ul><li>${icon("check", { size: 17 })}Login و Session نمایشی</li><li>${icon("check", { size: 17 })}درخواست چندمرحله‌ای با Draft</li><li>${icon("check", { size: 17 })}Dashboard، Portfolio و Audit</li></ul><a data-link class="button button--primary" href="/login">باز کردن محیط نمایشی ${icon("arrow")}</a></div><div>${miniConsole()}</div></div>
    </section>

    <section class="present-usecases"><div class="container"><header class="present-section-head"><div><small>کاربرد</small><h2>ارزش داده از مسئله‌ای شروع می‌شود که قرار است حل شود.</h2></div><a data-link class="text-link" href="/map">دیدن نقشه کامل اکوسیستم ${icon("arrow")}</a></header><div class="usecase-story-list">${useCaseCards()}</div></div></section>

    <section class="present-final-cta"><div class="container"><div><span>${icon("lock", { size: 24 })}</span><h2>اول کاربرد و شرایط دسترسی را مشخص کنید؛ بعد اتصال معنا پیدا می‌کند.</h2><p>برای ارائه، می‌توانید مسیر کامل را از Login تا ثبت درخواست و مشاهده آن در داشبورد اجرا کنید.</p></div><div><a data-link class="button button--light" href="/login">ورود به کنسول</a><a data-link class="button button--ghost present-final-cta__secondary" href="/request">شروع درخواست نمونه</a></div></div></section>`;

  return siteShell({ content, activePath: "/" });
}

export function mountPresentationMarketingPage() {
  document.querySelectorAll("[data-hero-cluster]").forEach((button) => {
    button.addEventListener("click", () => {
      activeClusterId = button.getAttribute("data-hero-cluster") ?? dataClusters[0].id;
      document.querySelectorAll("[data-hero-cluster]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      const detail = document.querySelector("#hero-cluster-detail");
      if (detail instanceof HTMLElement) detail.innerHTML = clusterDetail();
      mountSelectedClusterLink();
    });
  });

  document.querySelectorAll("[data-control-layer]").forEach((button) => {
    button.addEventListener("click", () => {
      activeControlId = button.getAttribute("data-control-layer") ?? controlLayers[0].id;
      document.querySelectorAll("[data-control-layer]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      const detail = document.querySelector("#control-focus");
      if (detail instanceof HTMLElement) detail.innerHTML = controlDetail();
    });
  });

  mountSelectedClusterLink();
}

function mountSelectedClusterLink() {
  document.querySelectorAll("[data-request-selected-cluster]").forEach((link) => {
    if (!(link instanceof HTMLElement) || link.dataset.bound) return;
    link.dataset.bound = "true";
    link.addEventListener("click", () => {
      const id = link.getAttribute("data-request-selected-cluster");
      if (id) setPreferredClusterId(id);
    });
  });
}
