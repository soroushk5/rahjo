// @ts-nocheck
import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";

const fitTags = Object.freeze([
  "فروش B2B",
  "شرکت‌های خدماتی",
  "بازرگانی",
  "کسب‌وکارهای پروژه‌ای",
  "آموزش و مشاوره",
  "تیم‌های در حال رشد"
]);

function productMiniFrame({ title, content }) {
  return `
    <div class="sw-mini-frame" aria-label="${title}">
      <div class="sw-mini-frame__bar"><div><i></i><strong>رهجو</strong></div><span>${title}</span></div>
      <div class="sw-mini-frame__body">${content}</div>
    </div>`;
}

function miniCustomers() {
  return productMiniFrame({
    title: "مشتریان",
    content: `
      <div class="sw-micro-list">
        <div><b>آریا صنعت</b><span>۲ پرونده باز · نسترن احمدی</span></div>
        <div><b>پارس تجهیز</b><span>فرصت در مرحله پیشنهاد</span></div>
        <div><b>راهکار نو</b><span>آخرین تماس: امروز</span></div>
      </div>`
  });
}

function miniPipeline() {
  return productMiniFrame({
    title: "فروش",
    content: `
      <div class="sw-micro-pipeline">
        <section><small>نیازسنجی</small><b>۲</b><span>OPP-204</span></section>
        <section><small>پیشنهاد</small><b>۱</b><span>OPP-198</span></section>
        <section><small>مذاکره</small><b>۱</b><span>OPP-191</span></section>
      </div>`
  });
}

function miniCase() {
  return productMiniFrame({
    title: "پرونده",
    content: `
      <div class="sw-micro-case">
        <header><b>CASE-1028</b><span>در حال اجرا</span></header>
        <ol>
          <li class="is-done"><span>درخواست</span><i></i></li>
          <li class="is-done"><span>تأیید</span><i></i></li>
          <li class="is-current"><span>اقدام</span><i></i></li>
          <li><span>رسید</span><i></i></li>
          <li><span>نتیجه</span><i></i></li>
        </ol>
      </div>`
  });
}

const pillars = Object.freeze([
  {
    number: "۰۱",
    title: "حافظهٔ مشتری",
    description: "اطلاعات، افراد مرتبط و آخرین تعاملات هر مشتری در یک سابقه می‌مانند.",
    bullets: ["حساب و مخاطب", "سابقهٔ رابطه"],
    visual: miniCustomers()
  },
  {
    number: "۰۲",
    title: "فروش و پیگیری",
    description: "فرصت‌ها با مرحله، مالک و اقدام بعدی روشن دنبال می‌شوند.",
    bullets: ["خط فروش", "اقدام بعدی"],
    visual: miniPipeline()
  },
  {
    number: "۰۳",
    title: "پرونده و اجرا",
    description: "درخواست، تأیید، اقدام، رسید و نتیجه در همان مسیر کاری ثبت می‌شوند.",
    bullets: ["خط زمانی", "رسید و نتیجه"],
    visual: miniCase()
  }
]);

function heroPreview() {
  return `
    <div class="sw-hero-card" aria-label="خلاصه محیط محصول رهجو">
      <div class="sw-hero-card__rail">
        <span class="is-active">داشبورد</span><span>مشتریان</span><span>فروش</span><span>پرونده‌ها</span>
      </div>
      <div class="sw-hero-card__main">
        <div class="sw-hero-card__top"><div><small>در یک نگاه</small><h3>امروز چه چیزی باز است؟</h3></div><b>مدیر عملیات</b></div>
        <div class="sw-hero-metrics">
          <article><small>پرونده باز</small><strong>۱۲</strong></article>
          <article><small>کار امروز</small><strong>۷</strong></article>
          <article><small>فرصت فعال</small><strong>۵</strong></article>
        </div>
        <div class="sw-hero-next"><div><small>اقدام بعدی</small><strong>تأیید شروع اجرای خدمت</strong><span>آریا صنعت · CASE-1028</span></div><em>امروز</em></div>
      </div>
    </div>`;
}

function schematicJourney() {
  const items = [
    ["ورود", "سرنخ یا درخواست", "requests"],
    ["مشتری", "حساب و مخاطب", "users"],
    ["فرصت", "فروش و پیگیری", "reports"],
    ["پرونده", "اجرا و کارها", "requests"],
    ["نتیجه", "رسید و سابقه", "check"]
  ];
  return `<div class="sw-journey" aria-label="مسیر کار در رهجو">${items.map(([title, desc, glyph], index) => `
    <article><span>${icon(glyph, { size: 17 })}</span><b>${title}</b><small>${desc}</small>${index < items.length - 1 ? '<i class="sw-journey__line"></i>' : ""}</article>`).join("")}</div>`;
}

function pillarCard({ number, title, description, bullets, visual }) {
  return `
    <article class="sw-pillar-card">
      <div class="sw-pillar-card__copy">
        <span class="sw-pill-number">${number}</span>
        <h3>${title}</h3>
        <p>${description}</p>
        <ul>${bullets.map((item) => `<li>${item}</li>`).join("")}</ul>
      </div>
      <div class="sw-pillar-card__visual">${visual}</div>
    </article>`;
}

export function renderMinimalHomePage() {
  return siteShell({
    activePath: "/",
    content: `
      <section class="sw-hero sw-hero--compact">
        <div class="container sw-hero__grid">
          <div class="sw-hero__copy">
            <p class="sw-kicker">CRM برای مدیریت مشتری، فروش و کارهای جاری</p>
            <h1>مشتری‌ها و فرصت‌ها را منظم جلو ببرید.</h1>
            <p class="sw-lead">رهجو کمک می‌کند اطلاعات مشتری، پیگیری فروش، پرونده‌ها و اقدام بعدی در یک مسیر روشن کنار هم بمانند.</p>
            <div class="sw-actions">
              <a class="button button--primary button--large" href="#product">محصول را ببینید ${icon("arrow")}</a>
              <a data-link class="button button--outline button--large" href="/contact">شروع با رهجو</a>
            </div>
            <div class="sw-fit-tags">${fitTags.map((item) => `<span>${item}</span>`).join("")}</div>
          </div>
          <div class="sw-hero__visual">${heroPreview()}</div>
        </div>
      </section>

      <section class="sw-journey-section">
        <div class="container sw-journey-section__head"><div><p class="sw-kicker">یک مسیر، نه چند ابزار پراکنده</p><h2>از سرنخ تا نتیجه، یک مسیر روشن.</h2></div><p>ورودی‌ها به مشتری و فرصت تبدیل می‌شوند و کار تا پرونده و نتیجه دنبال می‌شود.</p></div>
        <div class="container">${schematicJourney()}</div>
      </section>

      <section class="sw-pillars" id="product">
        <div class="container sw-section-head"><p class="sw-kicker">سه بخش اصلی</p><h2>همان چیزهایی که تیم هر روز باید سریع ببیند.</h2><p>نه یک کاتالوگ بلند از قابلیت‌ها؛ سه بخش اصلی برای رابطه با مشتری، پیگیری فروش و اجرای کار.</p></div>
        <div class="container sw-pillar-grid">${pillars.map((item) => pillarCard(item)).join("")}</div>
      </section>

      <section class="sw-final">
        <div class="container sw-final__inner">
          <div><p class="sw-kicker">شروع با رهجو</p><h2>پیگیری‌ها را از فایل‌ها و ابزارهای پراکنده جمع کنید.</h2><p>محصول را ببینید و بعد یک مسیر واقعی را در رهجو شروع کنید.</p></div>
          <div class="sw-actions"><a data-link class="button button--primary button--large" href="/contact">شروع با رهجو</a><a data-link class="button button--outline button--large" href="/login">ورود</a></div>
        </div>
      </section>`
  });
}

export function renderMinimalProductPage() {
  return siteShell({
    activePath: "/product",
    content: `
      <section class="sw-page-hero">
        <div class="container sw-page-hero__grid">
          <div>
            <p class="sw-kicker">محصول</p>
            <h1>CRM را با پیگیری کارهای واقعی تیم در یک مسیر نگه دارید.</h1>
            <p class="sw-lead">رهجو رابطه با مشتری، فرصت‌های فروش و اجرای پرونده را به هم وصل می‌کند تا اقدام بعدی روشن بماند.</p>
            <div class="sw-fit-tags">${fitTags.map((item) => `<span>${item}</span>`).join("")}</div>
          </div>
          <div class="sw-page-hero__visual">${schematicJourney()}</div>
        </div>
      </section>

      <section class="sw-pillars sw-pillars--product">
        <div class="container sw-section-head"><p class="sw-kicker">هستهٔ محصول</p><h2>سه بخش کافی است تا مسیر مشتری گم نشود.</h2><p>اطلاعات مشتری، پیگیری تجاری و اجرای پرونده در یک جریان متصل می‌مانند.</p></div>
        <div class="container sw-pillar-grid">${pillars.map((item) => pillarCard(item)).join("")}</div>
      </section>

      <section class="sw-product-proof">
        <div class="container sw-product-proof__grid">
          <div>
            <p class="sw-kicker">اقدام بعدی همیشه معلوم</p>
            <h2>اطلاعات فقط ذخیره نمی‌شوند؛ کار بعدی هم کنارشان می‌ماند.</h2>
            <ul class="sw-check-list">
              <li>${icon("check", { size: 16 })}<span>مشتری به فرصت‌ها و پرونده‌هایش وصل است.</span></li>
              <li>${icon("check", { size: 16 })}<span>هر فرصت مالک و اقدام بعدی دارد.</span></li>
              <li>${icon("check", { size: 16 })}<span>پرونده‌ها تاریخچه، تأیید و نتیجه دارند.</span></li>
            </ul>
          </div>
          <div class="sw-product-proof__card">${heroPreview()}</div>
        </div>
      </section>

      <section class="sw-final sw-final--light">
        <div class="container sw-final__inner"><div><p class="sw-kicker">مرحله بعد</p><h2>محصول را در یک مسیر واقعی از کسب‌وکارتان امتحان کنید.</h2></div><div class="sw-actions"><a data-link class="button button--primary button--large" href="/contact">شروع با رهجو</a><a data-link class="button button--outline button--large" href="/login">ورود به رهجو</a></div></div>
      </section>`
  });
}

export function renderMinimalContactPage() {
  return siteShell({
    activePath: "/contact",
    content: `
      <section class="sw-contact-hero">
        <div class="container sw-contact-hero__inner">
          <p class="sw-kicker">شروع</p>
          <h1>از یک مسئلهٔ واقعی شروع کنید.</h1>
          <p class="sw-lead">پیگیری فروش، سابقهٔ مشتری یا اجرای پرونده؛ یک مسیر مشخص را انتخاب کنید و همان را وارد رهجو کنید.</p>
          <div class="sw-actions"><a data-link class="button button--primary button--large" href="/login">ورود به رهجو</a><a data-link class="button button--outline button--large" href="/product">دیدن محصول</a></div>
        </div>
      </section>

      <section class="sw-start-grid">
        <div class="container sw-start-grid__inner">
          <article><b>۱</b><h2>مسئله را مشخص کنید</h2><p>فروش، مشتری یا اجرای کار؛ فقط یک مسیر را برای شروع انتخاب کنید.</p></article>
          <article><b>۲</b><h2>ساختار محصول را ببینید</h2><p>مشتری، فرصت، پرونده و اقدام بعدی را در یک جریان مرور کنید.</p></article>
          <article><b>۳</b><h2>وارد محیط شوید</h2><p>همان مسیر را در فضای کاری رهجو ادامه بدهید.</p></article>
        </div>
      </section>`
  });
}

export function renderMinimalTrackPage() {
  return siteShell({
    activePath: "/contact",
    content: `<section class="sw-contact-hero"><div class="container sw-contact-hero__inner"><p class="sw-kicker">پیگیری</p><h1>وضعیت پرونده را داخل فضای کاری رهجو ببینید.</h1><p class="sw-lead">برای دیدن پرونده، اقدام‌های باز و آخرین رویدادها وارد محیط کار شوید.</p><div class="sw-actions"><a data-link class="button button--primary button--large" href="/login">ورود ${icon("arrow")}</a></div></div></section>`
  });
}
