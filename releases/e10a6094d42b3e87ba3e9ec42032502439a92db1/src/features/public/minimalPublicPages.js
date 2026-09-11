// @ts-nocheck
import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";

const softwareBenefits = Object.freeze([
  ["مشتری و فروش", "حساب مشتری، افراد مرتبط و فرصت‌های فروش کنار هم می‌مانند.", "users"],
  ["پرونده و کارها", "هر درخواست مالک، وضعیت، موعد و اقدام بعدی مشخص دارد.", "requests"],
  ["اجرا و تاریخچه", "تصمیم‌ها، کار انجام‌شده و نتیجه در سابقهٔ همان مشتری ثبت می‌شوند.", "check"]
]);

const productAreas = Object.freeze([
  ["مشتریان", "اطلاعات مشتری فقط یک دفترچه تلفن نیست؛ فروش، پرونده‌ها و پیگیری‌ها به همان سابقه وصل‌اند.", "users"],
  ["فروش", "فرصت‌ها بر اساس مرحله، ارزش و اقدام بعدی دیده می‌شوند تا پیگیری از دست نرود.", "reports"],
  ["پرونده و عملیات", "از ثبت درخواست تا تأیید، اقدام و نتیجه، تیم روی یک مسیر مشترک کار می‌کند.", "workflow"]
]);

function frameNav(active = "dashboard") {
  const items = [
    ["dashboard", "داشبورد", "dashboard"],
    ["customers", "مشتریان", "users"],
    ["sales", "فروش", "reports"],
    ["requests", "پرونده‌ها", "requests"],
    ["tasks", "کارها", "check"]
  ];
  return `<aside class="sw-app-nav">${items.map(([key, label, glyph]) => `<span class="${key === active ? "is-active" : ""}">${icon(glyph, { size: 15 })}<b>${label}</b></span>`).join("")}</aside>`;
}

function softwareFrame({ active = "dashboard", label, content }) {
  return `<div class="sw-screen" aria-label="${label}">
    <div class="sw-screen__bar"><div><i></i><strong>رهجو</strong></div><span>آریا صنعت</span></div>
    <div class="sw-screen__body">${frameNav(active)}<div class="sw-screen__main">${content}</div></div>
  </div>`;
}

function dashboardPreview() {
  return softwareFrame({
    active: "dashboard",
    label: "نمای داشبورد رهجو",
    content: `
      <div class="sw-app-head"><div><small>امروز</small><h3>صبح بخیر، نسترن</h3><p>اقدام‌های مهم و وضعیت عملیات در یک نگاه.</p></div><span class="sw-role">مدیر عملیات</span></div>
      <div class="sw-metrics">
        <article><small>پرونده‌های باز</small><strong>۱۲</strong><span>۳ نیازمند توجه</span></article>
        <article><small>کارهای امروز</small><strong>۷</strong><span>۲ با اولویت بالا</span></article>
        <article><small>فرصت‌های فعال</small><strong>۵</strong><span>۱ پیگیری امروز</span></article>
      </div>
      <div class="sw-panel">
        <div class="sw-panel__head"><div><strong>اقدام بعدی من</strong><small>بر اساس موعد و اولویت</small></div><span>همه کارها</span></div>
        <div class="sw-task-row"><b class="is-high">فوری</b><div><strong>تأیید شروع اجرای خدمت</strong><small>آریا صنعت · CASE-1028</small></div><time>امروز</time><em>در انتظار</em></div>
        <div class="sw-task-row"><b>عادی</b><div><strong>پیگیری پیشنهاد فروش</strong><small>پارس تجهیز · OPP-204</small></div><time>امروز</time><em>باز</em></div>
        <div class="sw-task-row"><b>عادی</b><div><strong>تکمیل مدارک پرونده</strong><small>راهکار نو · CASE-1031</small></div><time>فردا</time><em>باز</em></div>
      </div>`
  });
}

function customersPreview() {
  return softwareFrame({
    active: "customers",
    label: "نمای مشتریان رهجو",
    content: `
      <div class="sw-app-head"><div><small>مشتریان</small><h3>سابقهٔ رابطه در یک مکان</h3><p>حساب، شخص تماس، فروش و پرونده‌های جاری.</p></div><span class="sw-add">+ مشتری جدید</span></div>
      <div class="sw-search">${icon("search", { size: 15 })}<span>جست‌وجوی نام، صنعت یا مسئول…</span></div>
      <div class="sw-table">
        <div class="sw-table__head"><span>مشتری</span><span>مسئول</span><span>فرصت جاری</span><span>پرونده</span><span>وضعیت</span></div>
        <div class="sw-table__row"><span><i>آ</i><b>آریا صنعت</b><small>تجهیزات صنعتی</small></span><span>نسترن احمدی</span><span>پیشنهاد</span><span>۲ باز</span><em class="is-ok">فعال</em></div>
        <div class="sw-table__row"><span><i>پ</i><b>پارس تجهیز</b><small>خدمات سازمانی</small></span><span>سارا زمانی</span><span>نیازسنجی</span><span>۱ باز</span><em class="is-ok">فعال</em></div>
        <div class="sw-table__row"><span><i>ر</i><b>راهکار نو</b><small>فناوری</small></span><span>علی رضایی</span><span>—</span><span>۱ باز</span><em>بالقوه</em></div>
      </div>`
  });
}

function salesPreview() {
  return softwareFrame({
    active: "sales",
    label: "نمای فروش رهجو",
    content: `
      <div class="sw-app-head"><div><small>فروش</small><h3>فرصت‌ها و اقدام بعدی</h3><p>هیچ فرصت بازی بدون مالک و پیگیری بعدی نمی‌ماند.</p></div><span class="sw-add">+ فرصت جدید</span></div>
      <div class="sw-pipeline">
        <section><header><strong>نیازسنجی</strong><span>۲</span></header><article><small>OPP-204</small><b>راه‌اندازی CRM خدمات</b><p>پارس تجهیز</p><footer><span>۱۸۰ م.ت</span><time>پیگیری امروز</time></footer></article><article><small>OPP-209</small><b>بازطراحی فرایند فروش</b><p>آتیه ساز</p><footer><span>۹۵ م.ت</span><time>فردا</time></footer></article></section>
        <section><header><strong>پیشنهاد</strong><span>۱</span></header><article><small>OPP-198</small><b>عملیات فروش سازمانی</b><p>آریا صنعت</p><footer><span>۲۴۰ م.ت</span><time>منتظر پاسخ</time></footer></article></section>
        <section><header><strong>مذاکره</strong><span>۱</span></header><article><small>OPP-191</small><b>پشتیبانی و عملیات مشتری</b><p>مهراز</p><footer><span>۱۳۰ م.ت</span><time>جلسه شنبه</time></footer></article></section>
      </div>`
  });
}

function casePreview() {
  return softwareFrame({
    active: "requests",
    label: "نمای پرونده در رهجو",
    content: `
      <div class="sw-case-head"><div><small>CASE-1028 · آریا صنعت</small><h3>راه‌اندازی عملیات فروش</h3><p>مالک پرونده: نسترن احمدی</p></div><em>در حال اجرا</em></div>
      <div class="sw-case-grid">
        <section class="sw-panel"><div class="sw-panel__head"><div><strong>اقدام بعدی</strong><small>پیش از شروع مرحلهٔ اجرا</small></div></div><div class="sw-next-action"><span>${icon("shield", { size: 18 })}</span><div><strong>تأیید شروع اجرای خدمت</strong><p>تصمیم ثبت می‌شود و بعد از تأیید، اقدام اجرایی آزاد می‌شود.</p></div><b>نیازمند تصمیم</b></div></section>
        <section class="sw-panel sw-timeline"><div class="sw-panel__head"><div><strong>آخرین رویدادها</strong><small>تاریخچهٔ پرونده</small></div></div><div><i class="is-done"></i><span><b>مدارک تکمیل شد</b><small>امروز · نسترن احمدی</small></span></div><div><i class="is-done"></i><span><b>نیازسنجی ثبت شد</b><small>دیروز · سارا زمانی</small></span></div><div><i></i><span><b>شروع اجرا</b><small>پس از تأیید</small></span></div></section>
      </div>`
  });
}

function benefitStrip() {
  return `<div class="sw-benefit-strip">${softwareBenefits.map(([title, desc, glyph]) => `<article><span>${icon(glyph, { size: 19 })}</span><div><strong>${title}</strong><p>${desc}</p></div></article>`).join("")}</div>`;
}

export function renderMinimalHomePage() {
  return siteShell({
    activePath: "/",
    content: `
      <section class="sw-hero">
        <div class="container sw-hero__copy">
          <p class="sw-kicker">CRM و عملیات مشتری برای کسب‌وکارهای خدماتی</p>
          <h1>مشتری، فروش و اجرای خدمت را در یک سیستم پیگیری کنید.</h1>
          <p class="sw-lead">رهجو اطلاعات مشتری، فرصت فروش، پرونده، کارهای امروز و نتیجه را کنار هم نگه می‌دارد؛ تا تیم بداند چه چیزی باز است و قدم بعدی چیست.</p>
          <div class="sw-actions"><a class="button button--primary button--large" href="#product">دیدن محیط رهجو ${icon("arrow")}</a><a data-link class="button button--outline button--large" href="/login">ورود</a></div>
        </div>
        <div class="container sw-hero__screen">${dashboardPreview()}</div>
      </section>

      <section class="sw-benefits"><div class="container">${benefitStrip()}</div></section>

      <section class="sw-product-story" id="product">
        <div class="container sw-section-head"><p class="sw-kicker">محصول در عمل</p><h2>چیزی که تیم هر روز با آن کار می‌کند.</h2><p>به‌جای توضیح‌های کلی، سه بخش اصلی رهجو را ببینید.</p></div>
        <div class="container sw-showcases">
          <article class="sw-showcase"><div class="sw-showcase__copy"><span>۰۱</span><h3>${productAreas[0][0]}</h3><p>${productAreas[0][1]}</p><a data-link href="/product">جزئیات محصول ${icon("arrow", { size: 15 })}</a></div><div>${customersPreview()}</div></article>
          <article class="sw-showcase sw-showcase--reverse"><div class="sw-showcase__copy"><span>۰۲</span><h3>${productAreas[1][0]}</h3><p>${productAreas[1][1]}</p><a data-link href="/product">جزئیات محصول ${icon("arrow", { size: 15 })}</a></div><div>${salesPreview()}</div></article>
          <article class="sw-showcase"><div class="sw-showcase__copy"><span>۰۳</span><h3>${productAreas[2][0]}</h3><p>${productAreas[2][1]}</p><a data-link href="/product">جزئیات محصول ${icon("arrow", { size: 15 })}</a></div><div>${casePreview()}</div></article>
        </div>
      </section>

      <section class="sw-final"><div class="container sw-final__inner"><div><p class="sw-kicker">شروع با رهجو</p><h2>از یک فرایند واقعی شروع کنید.</h2><p>یک مسیر مشتری یا خدمت را انتخاب کنید و همان را در رهجو راه‌اندازی کنید.</p></div><div class="sw-actions"><a data-link class="button button--primary button--large" href="/contact">شروع با رهجو</a><a data-link class="button button--outline button--large" href="/login">ورود</a></div></div></section>`
  });
}

export function renderMinimalProductPage() {
  return siteShell({
    activePath: "/product",
    content: `
      <section class="sw-page-hero"><div class="container sw-page-hero__inner"><p class="sw-kicker">محصول</p><h1>CRM را از اجرای کار جدا نکنید.</h1><p>مشتری، فروش، پرونده و کارهای تیم در یک محیط قرار می‌گیرند تا سابقهٔ رابطه و کار جاری از هم جدا نباشند.</p><div class="sw-actions"><a data-link class="button button--primary button--large" href="/contact">شروع با رهجو ${icon("arrow")}</a><a data-link class="button button--outline button--large" href="/login">ورود</a></div></div></section>
      <section class="sw-product-page"><div class="container sw-product-grid">
        <div class="sw-product-copy"><span>مشتریان</span><h2>سابقهٔ مشتری، فروش و پرونده‌های باز کنار هم.</h2><p>کاربر برای فهمیدن وضعیت مشتری بین فایل‌ها و ابزارهای مختلف جابه‌جا نمی‌شود.</p></div><div>${customersPreview()}</div>
        <div class="sw-product-copy"><span>فروش</span><h2>هر فرصت یک مرحله، مالک و اقدام بعدی دارد.</h2><p>تیم فروش دقیقاً می‌بیند چه چیزی باید امروز پیگیری شود و چه چیزی منتظر پاسخ است.</p></div><div>${salesPreview()}</div>
        <div class="sw-product-copy"><span>عملیات</span><h2>پرونده تا نتیجه، قابل پیگیری می‌ماند.</h2><p>تصمیم، اقدام، رویداد و خروجی در همان سابقه ثبت می‌شود و از دید تیم گم نمی‌شود.</p></div><div>${casePreview()}</div>
      </div></section>
      <section class="sw-plain-facts"><div class="container">${benefitStrip()}</div></section>
      <section class="sw-final"><div class="container sw-final__inner"><div><p class="sw-kicker">راه‌اندازی</p><h2>رهجو را روی جریان واقعی خودتان ببینید.</h2><p>از یک مشتری، یک نوع پرونده و یک تیم کوچک شروع کنید.</p></div><a data-link class="button button--primary button--large" href="/contact">شروع</a></div></section>`
  });
}

export function renderMinimalContactPage() {
  const steps = [
    ["۱", "یک جریان واقعی انتخاب کنید", "مثلاً فروش یک خدمت یا رسیدگی به درخواست مشتری."],
    ["۲", "مسئول و مراحل را مشخص کنید", "چه کسی مالک است، چه تصمیمی لازم است و نتیجه چیست."],
    ["۳", "همان جریان را در رهجو اجرا کنید", "با یک پروندهٔ واقعی و معیار پذیرش روشن شروع کنید."]
  ];
  return siteShell({
    activePath: "/contact",
    content: `
      <section class="sw-contact"><div class="container sw-contact__inner"><div><p class="sw-kicker">شروع</p><h1>رهجو را با یک فرایند واقعی راه‌اندازی کنید.</h1><p>برای شروع لازم نیست همه‌چیز را یک‌باره منتقل کنید. یک مسیر مشخص را انتخاب کنید و همان را وارد محیط کار کنید.</p><div class="sw-actions"><a data-link class="button button--primary button--large" href="/cases/new">ثبت اولین پرونده ${icon("arrow")}</a><a data-link class="button button--outline button--large" href="/login">ورود به رهجو</a></div></div>${casePreview()}</div></section>
      <section class="sw-start"><div class="container sw-start__grid">${steps.map(([index, title, desc]) => `<article><b>${index}</b><h2>${title}</h2><p>${desc}</p></article>`).join("")}</div></section>`
  });
}

export function renderMinimalTrackPage() {
  return siteShell({
    activePath: "/contact",
    content: `<section class="sw-page-hero"><div class="container sw-page-hero__inner"><p class="sw-kicker">پیگیری</p><h1>وضعیت پرونده را داخل فضای کاری رهجو ببینید.</h1><p>برای دیدن پرونده، اقدام‌های باز و آخرین رویدادها وارد محیط کار شوید.</p><div class="sw-actions"><a data-link class="button button--primary button--large" href="/login">ورود ${icon("arrow")}</a></div></div></section>`
  });
}
