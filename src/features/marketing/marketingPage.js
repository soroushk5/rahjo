import { brandLogo } from "../../components/brandLogo.js";
import { siteShell } from "../../app/siteShell.js";

function previewChart() {
  return `
    <svg viewBox="0 0 480 180" role="img" aria-label="نمودار نمونه درخواست‌ها">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#22D3EE" stop-opacity="0.35"/>
          <stop offset="1" stop-color="#22D3EE" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="M10 142 C58 138,78 95,120 108 S182 156,220 94 S294 43,331 83 S392 145,470 42 L470 170 L10 170Z" fill="url(#chartFill)"/>
      <path d="M10 142 C58 138,78 95,120 108 S182 156,220 94 S294 43,331 83 S392 145,470 42" fill="none" stroke="#22D3EE" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
}

export function renderMarketingPage() {
  const content = `
    <section class="hero">
      <div class="hero__grid container">
        <div>
          <p class="eyebrow">DATA · VERIFICATION · WORKFLOW</p>
          <h1>داده‌ها را تأیید کنید؛ با اطمینان تصمیم بگیرید.</h1>
          <p class="hero__lead">رهجو یک لایه سازمانی برای مدیریت داده، احراز، پیام‌رسانی و گردش‌کارهای قابل ممیزی است؛ بدون ادعای دسترسی یا سرویس اثبات‌نشده.</p>
          <div class="hero__actions">
            <a data-link class="button button--primary" href="/request">شروع درخواست نمایشی <span aria-hidden="true">←</span></a>
            <a data-link class="button button--secondary" href="/dashboard">مشاهده داشبورد</a>
          </div>
        </div>
        <article class="product-preview" aria-label="پیش‌نمایش محصول">
          <div class="product-preview__bar">${brandLogo()}<span class="status-badge">Demo Mode</span></div>
          <div class="product-preview__body">
            <div class="preview-stat-grid">
              <div class="preview-stat"><strong>99.62%</strong><span>موفقیت پردازش</span></div>
              <div class="preview-stat"><strong>320ms</strong><span>میانگین پاسخ</span></div>
              <div class="preview-stat"><strong>128</strong><span>گردش فعال</span></div>
            </div>
            <div class="preview-chart"><strong>روند درخواست‌ها</strong>${previewChart()}</div>
          </div>
        </article>
      </div>
    </section>
    <section class="trust-strip" aria-label="ارزش‌های برند">
      <div class="trust-item"><span aria-hidden="true">✓</span><strong>اعتماد</strong><small class="muted">Trust</small></div>
      <div class="trust-item"><span aria-hidden="true">◎</span><strong>دقت</strong><small class="muted">Accuracy</small></div>
      <div class="trust-item"><span aria-hidden="true">▱</span><strong>ساختار</strong><small class="muted">Structure</small></div>
      <div class="trust-item"><span aria-hidden="true">↗</span><strong>هوشمندی</strong><small class="muted">Intelligence</small></div>
    </section>
    <section id="solutions" class="solutions">
      <div class="container">
        <div class="section-heading">
          <p class="eyebrow">راهکارهای رهجو</p>
          <h2>از داده خام تا فرایند قابل‌ردیابی</h2>
          <p>معماری محصول به‌گونه‌ای طراحی شده که منبع داده، تصمیم، پیام و مداخله انسانی در یک مسیر روشن ثبت شوند.</p>
        </div>
        <div class="solutions__grid">
          <article class="solution-card card"><div class="solution-card__icon">◉</div><h3>احراز و تأیید داده</h3><p>تعریف ورودی، هدف، رضایت و خروجی حداقلی پیش از اتصال به هر منبع واقعی.</p></article>
          <article class="solution-card card"><div class="solution-card__icon">⌘</div><h3>APIهای قابل‌کنترل</h3><p>لایه adapter برای تغییر تأمین‌کننده، fallback و کنترل دسترسی بدون وابستگی صفحات به endpoint.</p></article>
          <article class="solution-card card"><div class="solution-card__icon">⌁</div><h3>گردش‌کار قابل ممیزی</h3><p>هر درخواست، تصمیم، پیام و بررسی انسانی با شناسه و timeline واحد قابل پیگیری است.</p></article>
        </div>
      </div>
    </section>
    <section id="contact" class="container">
      <div class="cta-band">
        <div class="cta-band__inner">
          <div><h2>نسخه اولیه را ببینید و معماری را قبل از اتصال داده تثبیت کنید.</h2><p>این MVP صرفاً برای اعتبارسنجی تجربه، ساختار و مسیر محصول است.</p></div>
          <a data-link class="button button--secondary" href="/request">ورود به جریان درخواست</a>
        </div>
      </div>
    </section>`;

  return siteShell({ content, activePath: "/" });
}
