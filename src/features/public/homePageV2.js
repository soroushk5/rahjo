import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";

const operatingFlow = Object.freeze([
  ["ورودی", "نیاز مشتری از سایت، تماس یا کانال فروش", "users"],
  ["مشتری", "حساب، افراد و سابقهٔ رابطه در یک حافظه", "identity"],
  ["پرونده", "فرصت یا Case با مالک، وضعیت و اقدام بعدی", "requests"],
  ["خدمت", "شرایط، مدارک و مسیر اجرای روشن", "settings"],
  ["تأیید", "تصمیم انسانی در نقاط حساس", "shield"],
  ["اقدام", "اجرای کنترل‌شده با رسید و قابلیت پیگیری", "workflow"],
  ["نتیجه", "خروجی ثبت‌شده و پیگیری بعدی", "check"]
]);

const proofItems = Object.freeze([
  ["مشتری و رابطه", "Account 360، مخاطبان، فرصت‌ها و تاریخچهٔ مشترک"],
  ["پرونده و خدمت", "هر درخواست با شناسه، وضعیت، مالک و خدمت مرتبط"],
  ["تأیید و اجرا", "اقدام‌های حساس پشت تأیید انسانی و ثبت رویداد"],
  ["رسید و نتیجه", "هر اجرا به رسید، ممیزی و نتیجهٔ قابل بازخوانی ختم می‌شود"]
]);

function productFrame() {
  return `
    <div class="w14-product-frame" aria-label="نمای محصول عملیاتی رهجو">
      <div class="w14-product-frame__top">
        <span class="w14-live-dot"></span>
        <strong>محیط عملیاتی رهجو</strong>
        <small>مسیر مشتری تا نتیجه</small>
      </div>
      <div class="w14-product-frame__body">
        <aside>
          <span class="is-active">${icon("dashboard", { size: 16 })} داشبورد</span>
          <span>${icon("users", { size: 16 })} مشتریان</span>
          <span>${icon("reports", { size: 16 })} فروش</span>
          <span>${icon("requests", { size: 16 })} پرونده‌ها</span>
          <span>${icon("workflow", { size: 16 })} عملیات</span>
          <span>${icon("shield", { size: 16 })} ممیزی</span>
        </aside>
        <main>
          <header>
            <div><small>پروندهٔ فعال</small><strong>راه‌اندازی عملیات فروش — آریا صنعت</strong></div>
            <span class="w14-state-pill">در جریان</span>
          </header>
          <div class="w14-next-action">
            <small>اقدام بعدی</small>
            <strong>تأیید شروع اجرای خدمت</strong>
            <span>مسئول: نسترن احمدی · امروز</span>
          </div>
          <ol class="w14-case-rail">
            <li class="is-done"><i></i><span>ورودی</span></li>
            <li class="is-done"><i></i><span>پرونده</span></li>
            <li class="is-current"><i></i><span>تأیید</span></li>
            <li><i></i><span>اقدام</span></li>
            <li><i></i><span>رسید</span></li>
            <li><i></i><span>نتیجه</span></li>
          </ol>
          <div class="w14-frame-grid">
            <section><small>وضعیت حساب</small><b>۲ پروندهٔ باز</b><span>۱ اقدام نیازمند تصمیم</span></section>
            <section><small>قابلیت پیگیری</small><b>رویدادها ثبت می‌شوند</b><span>مالک و منبع هر تغییر مشخص است</span></section>
          </div>
        </main>
      </div>
    </div>`;
}

export function renderHomePageV2() {
  return siteShell({
    activePath: "/",
    content: `
      <section class="w14-hero">
        <div class="container w14-hero__grid">
          <div class="w14-hero__copy">
            <span class="w14-eyebrow">زیرساخت عملیاتی مشتری تا نتیجه</span>
            <h1>هر درخواست مشتری را به یک مسیر روشن، قابل اقدام و قابل پیگیری تبدیل کنید.</h1>
            <p>رهجو مشتری، فروش، پروندهٔ خدمت، تأیید انسانی، اجرا و نتیجه را روی یک سابقهٔ مشترک نگه می‌دارد؛ بدون اینکه کار روزمره به هوش مصنوعی وابسته باشد.</p>
            <div class="button-row">
              <a data-link class="button button--primary button--large" href="/contact">بررسی فرایند کسب‌وکار من ${icon("arrow")}</a>
              <a data-link class="button button--outline button--large" href="/login">ورود به محیط رهجو</a>
            </div>
            <div class="w14-trust-row"><span>${icon("shield", { size: 16 })} تأیید انسانی در نقاط حساس</span><span>${icon("check", { size: 16 })} مسیر اصلی بدون وابستگی به AI</span><span>${icon("signal", { size: 16 })} سابقهٔ قابل ممیزی</span></div>
          </div>
          ${productFrame()}
        </div>
      </section>

      <section class="w14-flow-section">
        <div class="container">
          <header class="w14-section-heading"><span>مدل عملیاتی</span><h2>یک مسیر مشترک برای چیزی که امروز بین چند ابزار و چند نفر پخش شده است.</h2><p>همان موجودیت‌هایی که در سایت می‌بینید، در محیط عملیاتی هم ادامه پیدا می‌کنند؛ روایت بازاریابی و محصول دو سیستم جدا نیستند.</p></header>
          <ol class="w14-operating-flow">${operatingFlow.map(([title, desc, glyph]) => `<li><span>${icon(glyph, { size: 20 })}</span><strong>${title}</strong><small>${desc}</small></li>`).join("")}</ol>
        </div>
      </section>

      <section class="w14-proof-section">
        <div class="container w14-proof-grid">
          <div>
            <span class="w14-eyebrow">حافظهٔ تجاری + اجرای عملیاتی</span>
            <h2>رهجو فقط CRM یا داشبورد نیست؛ حلقهٔ کار را تا نتیجه می‌بندد.</h2>
            <p>اطلاعات مشتری زمانی ارزش دارد که به اقدام بعدی، تصمیم، اجرای خدمت و نتیجه وصل باشد. رهجو این زنجیره را روی یک مدل مشترک نگه می‌دارد.</p>
            <a data-link class="text-link" href="/product">دیدن ساختار محصول ${icon("arrow", { size: 16 })}</a>
          </div>
          <div class="w14-proof-list">${proofItems.map(([title, desc], index) => `<article><b>0${index + 1}</b><div><h3>${title}</h3><p>${desc}</p></div></article>`).join("")}</div>
        </div>
      </section>

      <section class="w14-use-section">
        <div class="container w14-use-grid">
          <article><span>${icon("users")}</span><h3>برای فروش</h3><p>سرنخ، مشتری، فرصت و تعهد بعدی در یک سابقهٔ قابل پیگیری می‌ماند.</p></article>
          <article><span>${icon("requests")}</span><h3>برای خدمات</h3><p>هر درخواست به پرونده، شرایط خدمت، مدارک، مالک و وضعیت اجرایی وصل است.</p></article>
          <article><span>${icon("workflow")}</span><h3>برای عملیات</h3><p>تأیید، اقدام، اجرا، رسید و نتیجه از هم جدا نیستند و سابقهٔ تصمیم حفظ می‌شود.</p></article>
          <article><span>${icon("signal")}</span><h3>برای مدیریت</h3><p>به‌جای گزارش‌های جدا، وضعیت رابطهٔ مشتری و اجرای واقعی را از یک زنجیره می‌بینید.</p></article>
        </div>
      </section>

      <section class="w14-boundary-section">
        <div class="container w14-boundary-grid">
          <div><span class="w14-eyebrow">رویکرد رهجو</span><h2>هستهٔ قطعی، قابلیت‌های هوشمند در لایهٔ کمک.</h2></div>
          <div><p>مسیر حیاتی رهجو برای جست‌وجو، پرونده، تأیید، اقدام، ممیزی و نتیجه به مدل زبانی وابسته نیست. قابلیت‌های هوشمند می‌توانند بعداً پیشنهاد و تحلیل اضافه کنند، اما مالک مجوز، قیمت، تعهد یا اجرای قطعی نیستند.</p><a data-link class="button button--outline" href="/trust">اعتماد و کنترل</a></div>
        </div>
      </section>

      <section class="w14-final-cta">
        <div class="container w14-final-cta__inner"><div><span>قدم بعدی</span><h2>اول فرایند واقعی شما را روی مسیر رهجو می‌نشانیم.</h2><p>از یک جریان مشخص شروع می‌کنیم؛ ورودی مشتری، پرونده، خدمت، تأیید و نتیجه.</p></div><div class="button-row"><a data-link class="button button--light button--large" href="/contact">بررسی کسب‌وکار من</a><a data-link class="button button--ghost-light button--large" href="/how-it-works">نحوهٔ کار رهجو</a></div></div>
      </section>`
  });
}
