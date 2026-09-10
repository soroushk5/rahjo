import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";
import { publicJourneySteps, publicModules } from "../../data/publicOperationalContent.js";

function moduleCards() {
  return publicModules.map((item) => `
    <article class="public-module-card ${item.id === "think-room" ? "public-module-card--future" : ""}">
      <div class="public-module-card__head">
        <span>${icon(item.icon, { size: 21 })}</span>
        <small>${item.eyebrow}</small>
        <em>${item.state}</em>
      </div>
      <h3>${item.title}</h3>
      <p>${item.text}</p>
      <a data-link href="${item.path}">${item.id === "think-room" ? "دیدن مسیر آینده" : "دیدن در Workspace"} ${icon("arrow", { size: 14 })}</a>
    </article>`).join("");
}

function flowRail() {
  return publicJourneySteps.slice(0, 7).map((step) => `
    <div class="public-flow-step">
      <span class="public-flow-step__index">${step.index}</span>
      <span class="public-flow-step__icon">${icon(step.icon, { size: 18 })}</span>
      <div><small>${step.title}</small><strong>${step.label}</strong></div>
    </div>`).join("");
}

function operationalPreview() {
  return `
    <div class="public-cockpit" aria-label="پیش‌نمایش محیط Operational Foundation">
      <aside class="public-cockpit__sidebar">
        <div class="public-cockpit__brand">ر</div>
        <span class="active">${icon("dashboard", { size: 16 })}<b>داشبورد</b></span>
        <span>${icon("users", { size: 16 })}<b>مشتریان</b></span>
        <span>${icon("reports", { size: 16 })}<b>فروش</b></span>
        <span>${icon("api", { size: 16 })}<b>سرویس‌ها</b></span>
        <span>${icon("workflow", { size: 16 })}<b>اتوماسیون</b></span>
        <span>${icon("audit", { size: 16 })}<b>ممیزی</b></span>
      </aside>
      <div class="public-cockpit__main">
        <header>
          <div><small>رهجو / داشبورد</small><strong>مرکز عملیات</strong></div>
          <em><i></i> Demo / Synthetic</em>
        </header>
        <div class="public-cockpit__metrics">
          <article><small>پرونده‌های نیازمند اقدام</small><strong>Case</strong><span>مالک + اقدام بعدی</span></article>
          <article><small>فرصت‌های فروش</small><strong>Pipeline</strong><span>Lead → Opportunity</span></article>
          <article><small>وضعیت سرویس</small><strong>Service</strong><span>Review / Pilot / Evidence</span></article>
        </div>
        <div class="public-cockpit__grid">
          <section>
            <header><strong>صف اقدام امروز</strong><small>نمونه</small></header>
            <div class="public-cockpit__row"><span>${icon("requests", { size: 15 })}</span><p><strong>CASE-DEMO-101</strong><small>تکمیل مدارک و Approval</small></p><em>امروز</em></div>
            <div class="public-cockpit__row"><span>${icon("users", { size: 15 })}</span><p><strong>Account 360</strong><small>پیگیری تعامل و Opportunity</small></p><em>بعدی</em></div>
            <div class="public-cockpit__row"><span>${icon("workflow", { size: 15 })}</span><p><strong>Workflow receipt</strong><small>اجرای deterministic + audit</small></p><em>Demo</em></div>
          </section>
          <section>
            <header><strong>کیفیت و کنترل</strong><small>No-AI</small></header>
            <div class="public-control-line"><span>Ownerless records</span><i><b style="--progress:30%"></b></i><em>بررسی</em></div>
            <div class="public-control-line"><span>Service evidence</span><i><b style="--progress:58%"></b></i><em>Gate</em></div>
            <div class="public-control-line"><span>Audit completeness</span><i><b style="--progress:82%"></b></i><em>Demo</em></div>
          </section>
        </div>
      </div>
    </div>`;
}

export function renderPresentationMarketingPage() {
  const content = `
    <section class="public-hero">
      <div class="container public-hero__grid">
        <div class="public-hero__copy">
          <span class="public-kicker"><i></i>PHASE 1 · OPERATIONAL FOUNDATION</span>
          <h1>عملیات تجاری امروز؛<br><span>زیرساخت هوشمندی فردا.</span></h1>
          <p>رهجو ورودی‌های دیجیتال، CRM، فروش، پرونده‌ها، سرویس‌ها، گردش‌کار و ممیزی را روی یک حافظه عملیاتی مشترک جمع می‌کند؛ طوری که محصول با AI خاموش هم ارزش واقعی داشته باشد و Think Room بعداً روی همان داده و Outcome ساخته شود.</p>
          <div class="public-hero__actions">
            <a data-link class="button button--primary" href="/login">دیدن دموی محصول ${icon("arrow", { size: 15 })}</a>
            <a data-link class="button button--secondary" href="/platform">محصول چگونه کار می‌کند؟</a>
          </div>
          <div class="public-hero__boundary">
            ${icon("shield", { size: 19 })}
            <div><strong>دمو، نه ادعای Production</strong><small>داده‌ها مصنوعی‌اند؛ سرویس/API فقط وقتی live محسوب می‌شود که evidence و eligibility آن تأیید شده باشد.</small></div>
          </div>
        </div>
        <div class="public-hero__visual">${operationalPreview()}</div>
      </div>
    </section>

    <section class="public-proof-strip">
      <div class="container">
        ${[
          ["external", "Website / Intake", "کشف نیاز و ثبت منبع ورودی"],
          ["users", "Commercial Memory", "Account، Lead، Case و Outcome"],
          ["workflow", "Deterministic Ops", "Rule، Gate، Task و Receipt"],
          ["audit", "Audit & Quality", "Actor، Source، State و Data Quality"]
        ].map(([name, title, text]) => `<article><span>${icon(name, { size: 20 })}</span><div><strong>${title}</strong><small>${text}</small></div></article>`).join("")}
      </div>
    </section>

    <section class="public-section public-section--flow">
      <div class="container">
        <header class="public-section__head">
          <div><span>یک سیستم، نه چند ابزار</span><h2>از اولین ورودی تا Outcome، Context نباید گم شود.</h2></div>
          <p>Website یک brochure جدا نیست و CRM هم یک silo مستقل نیست. هر ورودی باید به objectهای مشترک تبدیل شود و در عملیات، سرویس و داشبورد همان مسیر را ادامه دهد.</p>
        </header>
        <div class="public-flow-rail">${flowRail()}</div>
        <div class="public-flow-summary">
          <strong>Website / Channel</strong><span>→</span><strong>Lead / Account</strong><span>→</span><strong>Opportunity / Case</strong><span>→</span><strong>Approval / Action</strong><span>→</span><strong>Outcome / Dashboard</strong>
        </div>
        <a data-link class="text-link" href="/map">دیدن مسیر کامل ${icon("arrow", { size: 14 })}</a>
      </div>
    </section>

    <section class="public-section public-section--modules">
      <div class="container">
        <header class="public-section__head">
          <div><span>محصول امروز</span><h2>Operational Foundation در هفت سطح دیده می‌شود.</h2></div>
          <p>شش سطح اول باید مستقل از مدل خارجی کار کنند. Think Room سطح آینده است و به‌جای ساخت حافظه جدا، همان Account/Case/Decision/Outcome را مصرف می‌کند.</p>
        </header>
        <div class="public-module-grid">${moduleCards()}</div>
      </div>
    </section>

    <section class="public-section public-section--split">
      <div class="container public-two-column">
        <article class="public-story-card">
          <span>${icon("api", { size: 22 })}</span>
          <small>سرویس‌ها و APIها</small>
          <h2>کاتالوگ باید وضعیت واقعی را نشان دهد، نه وعده مبهم.</h2>
          <p>هر capability با برچسب‌هایی مثل Demo، Under Review، Pilot Candidate، Evidence Required یا TBD نمایش داده می‌شود. Catalogue به‌تنهایی مجوز عرضه نیست.</p>
          <a data-link class="button button--secondary" href="/data">مرور سرویس‌ها و وضعیت‌ها</a>
        </article>
        <article class="public-story-card public-story-card--dark">
          <span>${icon("spark", { size: 22 })}</span>
          <small>AI-Compatible، نه AI-Dependent</small>
          <h2>Think Room وقتی می‌آید که حافظه و Outcome واقعی وجود داشته باشد.</h2>
          <p>لایه هوشمندی آینده Context و Evidence را از همان هسته می‌گیرد. فاز اول برای ارزش پایه به LLM وابسته نیست.</p>
          <a data-link class="button button--light" href="/trust">دیدن مرزها و کنترل‌ها</a>
        </article>
      </div>
    </section>

    <section class="public-final-cta">
      <div class="container">
        <div><span>READY TO EXPLORE</span><h2>محصول را از داخل Workspace ببینید، نه فقط از روی وعده.</h2><p>دموی فعلی با داده مصنوعی مسیر Dashboard، CRM، Sales، Services، Automation، Audit و Think Room آینده را نشان می‌دهد.</p></div>
        <div><a data-link class="button button--light" href="/login">ورود به دمو</a><a data-link class="button button--ghost public-final-cta__secondary" href="/request">درخواست نمونه در Workspace</a></div>
      </div>
    </section>`;

  return siteShell({ content, activePath: "/" });
}

export function mountPresentationMarketingPage() {}
