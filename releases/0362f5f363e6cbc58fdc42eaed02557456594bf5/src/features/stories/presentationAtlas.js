import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";
import { publicCapabilityFamilies, publicStatusLegend } from "../../data/publicOperationalContent.js";

function capabilityCards() {
  return publicCapabilityFamilies.map((item, index) => `
    <article class="public-capability-card" data-tone="${item.tone}">
      <header>
        <span class="public-capability-card__index">0${index + 1}</span>
        <span class="public-capability-card__icon">${icon(item.icon, { size: 22 })}</span>
        <em>${item.status}</em>
      </header>
      <h2>${item.title}</h2>
      <p>${item.text}</p>
      <div class="public-capability-card__items">${item.includes.map((entry) => `<span>${entry}</span>`).join("")}</div>
      <footer>${icon("shield", { size: 15 })}<span>وضعیت این خانواده، entitlement یا SLA عمومی ایجاد نمی‌کند.</span></footer>
    </article>`).join("");
}

function statusRows() {
  return publicStatusLegend.map((item) => `
    <div class="public-status-row">
      <span></span>
      <strong>${item.label}</strong>
      <p>${item.text}</p>
    </div>`).join("");
}

export function renderPresentationAtlasPage() {
  const content = `
    <section class="public-page-hero public-page-hero--services">
      <div class="container public-page-hero__grid">
        <div>
          <span class="public-kicker"><i></i>SERVICE & CAPABILITY CATALOG</span>
          <h1>سرویس را از وضعیتش جدا نکنیم.</h1>
        </div>
        <div><p>رهجو capabilityها را به‌عنوان خانواده‌های قابل بررسی نمایش می‌دهد؛ اما فقط evidence، eligibility، امنیت، owner و شرایط عرضه می‌توانند یک capability را به سرویس Production تبدیل کنند.</p><div class="public-page-hero__actions"><a data-link class="button button--primary" href="/login">دیدن کاتالوگ در Workspace</a><a data-link class="button button--secondary" href="/trust">مرز ادعا و عرضه</a></div></div>
      </div>
    </section>

    <section class="public-section">
      <div class="container">
        <header class="public-section__head"><div><span>خانواده قابلیت‌ها</span><h2>از CRM تا Data/API و Workflow؛ با وضعیت صریح.</h2></div><p>این صفحه جایگزین روایت قدیمی «اطلس داده = محصول» می‌شود. داده و API بخش مهمی از رهجو هستند، اما در کنار CRM، Case، عملیات، Automation و Audit.</p></header>
        <div class="public-capability-grid">${capabilityCards()}</div>
      </div>
    </section>

    <section class="public-section public-section--muted">
      <div class="container public-two-column public-two-column--status">
        <div>
          <span class="public-kicker public-kicker--plain">STATUS VOCABULARY</span>
          <h2>پنج برچسب برای جلوگیری از وعده‌های مبهم.</h2>
          <p>تا وقتی قرارداد، منبع، permitted purpose، security، SLA/error ownership و owner سرویس روشن نشده، وب‌سایت نباید آن capability را «فعال» یا «آماده استفاده عمومی» نشان دهد.</p>
          <a data-link class="text-link" href="/platform">جایگاه سرویس در معماری ${icon("arrow", { size: 14 })}</a>
        </div>
        <div class="public-status-list">${statusRows()}</div>
      </div>
    </section>

    <section class="public-section">
      <div class="container public-callout-grid">
        <article><span>${icon("database", { size: 20 })}</span><h3>Data / Verification</h3><p>نیازمند source/right/evidence مشخص و حداقل‌سازی داده است.</p></article>
        <article><span>${icon("api", { size: 20 })}</span><h3>API / Service</h3><p>نیازمند eligibility، lifecycle، failure ownership و audit روشن است.</p></article>
        <article><span>${icon("workflow", { size: 20 })}</span><h3>Workflow</h3><p>Rule-based و deterministic است؛ high-risk action انسانی می‌ماند.</p></article>
        <article><span>${icon("spark", { size: 20 })}</span><h3>Think Room</h3><p>Future layer است و امروز به‌عنوان سرویس فعال یا AI autonomous معرفی نمی‌شود.</p></article>
      </div>
    </section>`;

  return siteShell({ content, activePath: "/data" });
}

export function mountPresentationAtlasPage() {}
