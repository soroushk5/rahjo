// @ts-nocheck
import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";

const coreFlow = Object.freeze([
  ["درخواست", "نیاز وارد می‌شود", "requests"],
  ["پرونده", "مالک و وضعیت روشن می‌شود", "identity"],
  ["تأیید", "تصمیم مهم ثبت می‌شود", "shield"],
  ["اقدام", "کار اجرا و پیگیری می‌شود", "workflow"],
  ["نتیجه", "خروجی به سابقه برمی‌گردد", "check"]
]);

const benefits = Object.freeze([
  ["یک سابقهٔ مشترک", "مشتری، پرونده و کارهای مرتبط در یک مسیر می‌مانند.", "users"],
  ["اقدام بعدی روشن", "هر پرونده مالک، وضعیت و قدم بعدی مشخص دارد.", "check"],
  ["کنترل قابل پیگیری", "تأییدها، اجرا و نتیجه با تاریخچهٔ روشن ثبت می‌شوند.", "shield"]
]);

function productPreview() {
  return `
    <div class="mp-product" aria-label="پیش‌نمایش محیط رهجو">
      <div class="mp-product__top"><div><i></i><strong>رهجو</strong></div><span>آریا صنعت</span></div>
      <div class="mp-product__body">
        <aside>
          <span class="is-active">${icon("dashboard", { size: 16 })} داشبورد</span>
          <span>${icon("users", { size: 16 })} مشتریان</span>
          <span>${icon("requests", { size: 16 })} پرونده‌ها</span>
          <span>${icon("workflow", { size: 16 })} عملیات</span>
        </aside>
        <section class="mp-product__content">
          <header><div><small>اقدام بعدی</small><h3>تأیید شروع اجرای خدمت</h3></div><b>نیازمند تصمیم</b></header>
          <article class="mp-case">
            <div><small>پرونده فعال</small><strong>راه‌اندازی عملیات فروش</strong><span>مالک: نسترن احمدی</span></div>
            <em>CASE-1028</em>
          </article>
          <ol class="mp-progress">
            <li class="is-done"><i></i><span>ثبت</span></li>
            <li class="is-done"><i></i><span>پرونده</span></li>
            <li class="is-current"><i></i><span>تأیید</span></li>
            <li><i></i><span>اقدام</span></li>
            <li><i></i><span>نتیجه</span></li>
          </ol>
          <div class="mp-product__mini"><span><small>مشتری</small><strong>آریا صنعت</strong></span><span><small>وضعیت</small><strong>در جریان</strong></span><span><small>آخرین رویداد</small><strong>مدارک تکمیل شد</strong></span></div>
        </section>
      </div>
    </div>`;
}

function flowStrip() {
  return `<ol class="mp-flow">${coreFlow.map(([title, desc, glyph], index) => `
    <li><b>۰${index + 1}</b><span>${icon(glyph, { size: 19 })}</span><div><strong>${title}</strong><small>${desc}</small></div></li>`).join("")}</ol>`;
}

export function renderMinimalHomePage() {
  return siteShell({
    activePath: "/",
    content: `
      <section class="mp-hero">
        <div class="container mp-hero__grid">
          <div class="mp-hero__copy">
            <p class="mp-kicker">عملیات مشتری، ساده و روشن</p>
            <h1>کار مشتری را از درخواست تا نتیجه، یک‌جا پیش ببرید.</h1>
            <p class="mp-lead">رهجو مشتری، پرونده، تصمیم و اجرای کار را در یک مسیر قابل پیگیری نگه می‌دارد.</p>
            <div class="button-row mp-actions"><a data-link class="button button--primary button--large" href="/contact">شروع بررسی ${icon("arrow")}</a><a data-link class="button button--outline button--large" href="/login">ورود</a></div>
          </div>
          ${productPreview()}
        </div>
      </section>

      <section class="mp-benefits"><div class="container mp-benefit-grid">${benefits.map(([title, desc, glyph]) => `
        <article><span>${icon(glyph, { size: 21 })}</span><h2>${title}</h2><p>${desc}</p></article>`).join("")}</div></section>

      <section class="mp-how" id="how-it-works"><div class="container">
        <div class="mp-section-head"><p>نحوهٔ کار</p><h2>پنج مرحله؛ از ورودی تا نتیجه.</h2></div>
        ${flowStrip()}
      </div></section>

      <section class="mp-product-note"><div class="container mp-product-note__grid">
        <div><p class="mp-kicker">خود محصول، نه یک ویترین جدا</p><h2>اطلاعات مشتری وقتی ارزش دارد که به کار روزانه وصل باشد.</h2></div>
        <div><p>رهجو سابقهٔ مشتری را کنار پرونده‌های باز، تصمیم‌های لازم و اقدام‌های بعدی نگه می‌دارد؛ تا تیم بداند الآن چه چیزی باید جلو برود.</p><a data-link class="text-link" href="/product">دیدن محصول ${icon("arrow", { size: 16 })}</a></div>
      </div></section>

      <section class="mp-final"><div class="container mp-final__inner"><div><h2>از یک جریان واقعی شروع کنید.</h2><p>یک مسیر مشتری را انتخاب کنید و ببینید رهجو چطور آن را ساده و قابل پیگیری می‌کند.</p></div><a data-link class="button button--light button--large" href="/contact">شروع بررسی</a></div></section>`
  });
}

export function renderMinimalProductPage() {
  const capabilities = [
    ["مشتری", "یک سابقه برای حساب، افراد و تعامل‌های مهم.", "users"],
    ["پرونده", "وضعیت، مالک، مدارک و اقدام بعدی در یک جا.", "requests"],
    ["تصمیم و اجرا", "تأییدهای لازم قبل از اقدام و اجرای قابل پیگیری.", "workflow"],
    ["نتیجه", "ثبت خروجی و بازگشت آن به سابقهٔ مشتری.", "signal"]
  ];
  return siteShell({
    activePath: "/product",
    content: `
      <section class="mp-page-hero"><div class="container mp-page-hero__grid"><div><p class="mp-kicker">محصول</p><h1>یک فضای کاری برای مشتری، پرونده و اجرای کار.</h1><p>به‌جای چند ابزار جدا، تیم روی یک سابقهٔ مشترک کار می‌کند و اقدام بعدی همیشه معلوم است.</p><div class="button-row mp-actions"><a data-link class="button button--primary button--large" href="/contact">شروع بررسی ${icon("arrow")}</a><a data-link class="button button--outline button--large" href="/login">ورود</a></div></div>${productPreview()}</div></section>
      <section class="mp-capabilities"><div class="container"><div class="mp-section-head"><p>هستهٔ محصول</p><h2>چهار بخش کافی است.</h2></div><div class="mp-capability-grid">${capabilities.map(([title, desc, glyph]) => `<article><span>${icon(glyph, { size: 21 })}</span><h3>${title}</h3><p>${desc}</p></article>`).join("")}</div></div></section>
      <section class="mp-control"><div class="container mp-control__inner"><div><h2>کنترل و سابقه، جزئی از جریان کار است.</h2><p>فضای کاری، سطح دسترسی، تأییدهای مهم و تاریخچهٔ تغییرات در همان مسیر عملیاتی نگه داشته می‌شوند.</p></div><div class="mp-control__facts"><span>${icon("shield", { size: 18 })} مرز فضای کاری</span><span>${icon("check", { size: 18 })} تأیید انسانی</span><span>${icon("signal", { size: 18 })} تاریخچهٔ قابل بازبینی</span></div></div></section>
      <section class="mp-final"><div class="container mp-final__inner"><div><h2>رهجو را روی کار واقعی خودتان ببینید.</h2><p>از یک نوع مشتری و یک پروندهٔ مشخص شروع کنید.</p></div><a data-link class="button button--light button--large" href="/contact">شروع</a></div></section>`
  });
}

export function renderMinimalContactPage() {
  const steps = [
    ["۱", "یک جریان را انتخاب می‌کنیم", "مثلاً فروش یک خدمت، دریافت درخواست یا یک فرایند چندمرحله‌ای."],
    ["۲", "مسیر فعلی را کوتاه می‌کنیم", "ورودی، مسئول، تصمیم‌ها و نتیجهٔ مورد انتظار را روشن می‌کنیم."],
    ["۳", "همان جریان را در رهجو می‌سازیم", "با یک پروندهٔ واقعی و معیار پذیرش مشخص شروع می‌کنیم."]
  ];
  return siteShell({
    activePath: "/contact",
    content: `
      <section class="mp-contact-hero"><div class="container mp-contact-hero__inner"><p class="mp-kicker">شروع</p><h1>از یک فرایند واقعی شروع کنیم.</h1><p>نه فهرست قابلیت‌ها؛ فقط یک مسیر مشخص که باید از درخواست تا نتیجه بهتر پیش برود.</p><div class="button-row mp-actions"><a data-link class="button button--primary button--large" href="/cases/new">شروع ثبت پرونده ${icon("arrow")}</a><a data-link class="button button--outline button--large" href="/login">ورود به رهجو</a></div></div></section>
      <section class="mp-start"><div class="container mp-start__grid">${steps.map(([index, title, desc]) => `<article><b>${index}</b><h2>${title}</h2><p>${desc}</p></article>`).join("")}</div></section>`
  });
}

export function renderMinimalTrackPage() {
  return siteShell({
    activePath: "/contact",
    content: `<section class="mp-contact-hero"><div class="container mp-contact-hero__inner"><p class="mp-kicker">پیگیری</p><h1>پیگیری پرونده داخل محیط امن رهجو انجام می‌شود.</h1><p>برای دیدن وضعیت پرونده، وارد فضای کاری خود شوید.</p><div class="button-row mp-actions"><a data-link class="button button--primary button--large" href="/login">ورود ${icon("arrow")}</a></div></div></section>`
  });
}
