import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";

const operatingFlow = Object.freeze([
  ["ورودی", "درخواست از سایت، تماس یا فروش وارد می‌شود", "users"],
  ["مشتری", "Account و Contact سابقهٔ مشترک می‌سازند", "identity"],
  ["پرونده", "Opportunity یا Case با مالک و اقدام بعدی", "requests"],
  ["خدمت", "شرایط، مدارک و مسیر اجرا روشن می‌شود", "settings"],
  ["تأیید", "تصمیم حساس پشت گیت انسانی می‌ماند", "shield"],
  ["اقدام", "اجرای کنترل‌شده با وضعیت و رسید", "workflow"],
  ["نتیجه", "Outcome به سابقهٔ مشتری برمی‌گردد", "check"]
]);

const systemLayers = Object.freeze([
  ["01", "رابطهٔ مشتری", "مشتری، افراد، تعامل‌ها و فرصت‌ها یک سابقهٔ مشترک دارند.", "users"],
  ["02", "کار واقعی", "هر درخواست به Case، Service، مسئول و اقدام بعدی تبدیل می‌شود.", "requests"],
  ["03", "کنترل اجرا", "Approval، Action و Run مشخص می‌کنند چه چیزی با چه اختیاری اجرا شد.", "workflow"],
  ["04", "شواهد و نتیجه", "Receipt، Audit و Outcome نشان می‌دهند چه شد و قدم بعدی چیست.", "signal"]
]);

function productCanvas() {
  return `
    <div class="rv-product" aria-label="نمای محیط عملیاتی رهجو">
      <div class="rv-product__bar">
        <div><span class="rv-product__dot"></span><strong>رهجو</strong><small>محیط عملیاتی</small></div>
        <span>آریا صنعت / عملیات فروش</span>
      </div>
      <div class="rv-product__shell">
        <aside class="rv-product__nav">
          <span class="is-active">${icon("dashboard", { size: 17 })}<b>داشبورد</b></span>
          <span>${icon("users", { size: 17 })}<b>مشتریان</b></span>
          <span>${icon("reports", { size: 17 })}<b>فروش</b></span>
          <span>${icon("requests", { size: 17 })}<b>درخواست‌ها</b></span>
          <span>${icon("workflow", { size: 17 })}<b>عملیات</b></span>
          <span>${icon("shield", { size: 17 })}<b>ممیزی</b></span>
        </aside>
        <main class="rv-product__main">
          <header class="rv-product__headline">
            <div><small>اقدام بعدی</small><strong>تأیید شروع اجرای خدمت</strong></div>
            <span>نیازمند تصمیم</span>
          </header>
          <section class="rv-case-card">
            <div class="rv-case-card__title">
              <div><small>پرونده فعال</small><h3>راه‌اندازی عملیات فروش</h3><p>آریا صنعت · مالک: نسترن احمدی</p></div>
              <b>CASE-1028</b>
            </div>
            <ol class="rv-case-progress">
              <li class="is-done"><i></i><span>ورودی</span></li>
              <li class="is-done"><i></i><span>پرونده</span></li>
              <li class="is-current"><i></i><span>تأیید</span></li>
              <li><i></i><span>اقدام</span></li>
              <li><i></i><span>رسید</span></li>
              <li><i></i><span>نتیجه</span></li>
            </ol>
          </section>
          <div class="rv-product__summary">
            <section><small>مشتری</small><strong>آریا صنعت</strong><span>۲ پروندهٔ باز</span></section>
            <section><small>خدمت</small><strong>عملیات فروش</strong><span>گیت انسانی فعال</span></section>
            <section><small>آخرین رویداد</small><strong>مدارک تکمیل شد</strong><span>امروز ۱۴:۲۰</span></section>
          </div>
        </main>
      </div>
    </div>`;
}

function operatingMap() {
  return `
    <div class="rv-spine" aria-label="نقشهٔ مسیر عملیاتی رهجو">
      <div class="rv-spine__groups" aria-hidden="true">
        <span class="rv-spine__group rv-spine__group--memory">حافظهٔ رابطه</span>
        <span class="rv-spine__group rv-spine__group--work">فروش و خدمت</span>
        <span class="rv-spine__group rv-spine__group--control">کنترل و شواهد</span>
      </div>
      <ol>${operatingFlow.map(([title, desc, glyph], index) => `
        <li>
          <span class="rv-spine__index">0${index + 1}</span>
          <i>${icon(glyph, { size: 19 })}</i>
          <strong>${title}</strong>
          <small>${desc}</small>
        </li>`).join("")}</ol>
    </div>`;
}

export function renderHomePageV2() {
  return siteShell({
    activePath: "/",
    content: `
      <section class="rv-hero">
        <div class="container rv-hero__grid">
          <div class="rv-hero__copy">
            <h1>مشتری را از اولین درخواست تا نتیجه، در یک مسیر نگه دارید.</h1>
            <p>رهجو فروش، پروندهٔ خدمت، تأیید انسانی، اجرا و نتیجه را روی همان سابقهٔ مشتری به هم وصل می‌کند؛ بدون اینکه کار اصلی به AI وابسته باشد.</p>
            <div class="button-row rv-hero__actions">
              <a data-link class="button button--primary button--large" href="/contact">شروع بررسی فرایند ${icon("arrow")}</a>
              <a data-link class="button button--outline button--large" href="/how-it-works">دیدن مسیر کار</a>
            </div>
            <div class="rv-hero__facts" aria-label="ویژگی‌های هستهٔ رهجو">
              <span>${icon("shield", { size: 15 })} تأیید انسانی</span>
              <span>${icon("check", { size: 15 })} مسیر اصلی بدون AI</span>
              <span>${icon("signal", { size: 15 })} سابقهٔ قابل ممیزی</span>
            </div>
          </div>
          ${productCanvas()}
        </div>
        <div class="container rv-proofbar" aria-label="وضعیت محصول">
          <div><strong>Server-backed</strong><span>دادهٔ عملیاتی از سرور</span></div>
          <div><strong>Workspace-scoped</strong><span>مرز داده بر اساس فضای کاری</span></div>
          <div><strong>Human-gated</strong><span>تصمیم حساس بدون تأیید جلو نمی‌رود</span></div>
          <div><strong>AI-optional</strong><span>هستهٔ Phase 1 بدون مدل کار می‌کند</span></div>
        </div>
      </section>

      <section class="rv-map-section">
        <div class="container">
          <header class="rv-section-head rv-section-head--dark">
            <p>نقشهٔ محصول</p>
            <h2>یک زنجیره، نه مجموعه‌ای از ماژول‌های جدا.</h2>
            <span>هر مرحله context مرحلهٔ قبل را نگه می‌دارد؛ از ورودی مشتری تا نتیجه و سابقهٔ بعدی.</span>
          </header>
          ${operatingMap()}
        </div>
      </section>

      <section class="rv-system-section">
        <div class="container rv-system-grid">
          <div class="rv-system-copy">
            <p>مدل عملیاتی</p>
            <h2>CRM زمانی مفید است که به تصمیم و اجرای واقعی وصل باشد.</h2>
            <span>رهجو فقط اطلاعات مشتری را نگه نمی‌دارد. همان اطلاعات باید مشخص کند چه کاری باز است، چه کسی مسئول است، چه چیزی نیازمند تأیید است و خروجی نهایی چه بوده.</span>
            <a data-link class="text-link" href="/product">ساختار محصول ${icon("arrow", { size: 16 })}</a>
          </div>
          <div class="rv-layer-list">${systemLayers.map(([index, title, desc, glyph]) => `
            <article>
              <b>${index}</b>
              <span>${icon(glyph, { size: 20 })}</span>
              <div><h3>${title}</h3><p>${desc}</p></div>
            </article>`).join("")}</div>
        </div>
      </section>

      <section class="rv-use-section">
        <div class="container">
          <header class="rv-section-head">
            <p>برای تیمی که handoff واقعی دارد</p>
            <h2>فروش، خدمات و عملیات روی یک سابقه کار می‌کنند.</h2>
          </header>
          <div class="rv-use-list">
            <article><span>${icon("reports", { size: 22 })}</span><div><h3>فروش خدماتی</h3><p>Lead و Opportunity بعد از توافق از بین نمی‌روند؛ همان مشتری و context وارد Case می‌شود.</p></div><a data-link href="/use-cases">نمونهٔ مسیر ${icon("arrow", { size: 15 })}</a></article>
            <article><span>${icon("requests", { size: 22 })}</span><div><h3>خدمت چندمرحله‌ای</h3><p>مدرک، مالک، SLA، Approval و اقدام بعدی کنار خود پرونده می‌مانند.</p></div><a data-link href="/services">مدل خدمت ${icon("arrow", { size: 15 })}</a></article>
            <article><span>${icon("workflow", { size: 22 })}</span><div><h3>عملیات قابل ممیزی</h3><p>از تصمیم تا اجرا و Outcome، مسیر به Receipt و actor واقعی قابل بازسازی است.</p></div><a data-link href="/trust">اعتماد و کنترل ${icon("arrow", { size: 15 })}</a></article>
          </div>
        </div>
      </section>

      <section class="rv-boundary-section">
        <div class="container rv-boundary-grid">
          <div><p>مرز هوشمندی</p><h2>AI لایهٔ کمک است؛ نه ستون فقرات عملیات.</h2></div>
          <div><p>جست‌وجو، پرونده، تأیید، اقدام، ممیزی و ثبت نتیجه باید با خاموش بودن تمام مدل‌ها کار کنند. قابلیت هوشمند می‌تواند پیشنهاد و تحلیل اضافه کند، اما مجوز، تعهد و اجرای قطعی در هستهٔ قابل کنترل می‌ماند.</p><a data-link class="text-link" href="/trust">مرزهای اعتماد ${icon("arrow", { size: 16 })}</a></div>
        </div>
      </section>

      <section class="rv-final">
        <div class="container rv-final__inner">
          <div><p>شروع از یک جریان واقعی</p><h2>یک مشتری، یک پرونده، یک نتیجهٔ قابل بازسازی.</h2><span>اول مسیر واقعی شما را روشن می‌کنیم؛ بعد سراغ گسترش محصول می‌رویم.</span></div>
          <div class="button-row"><a data-link class="button button--light button--large" href="/contact">شروع بررسی</a><a data-link class="button button--ghost-light button--large" href="/pilot">نحوهٔ راه‌اندازی</a></div>
        </div>
      </section>`
  });
}
