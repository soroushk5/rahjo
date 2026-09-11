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

const pillars = Object.freeze([
  {
    number: "۰۱",
    title: "حافظهٔ مشتری",
    description:
      "مشتری، افراد مرتبط، آخرین تعاملات و پرونده‌های باز در یک سابقه نگه‌داری می‌شوند تا تیم از صفر شروع نکند.",
    bullets: ["حساب و مخاطب", "سابقهٔ رابطه", "آخرین فعالیت‌ها"],
    visual: miniCustomers()
  },
  {
    number: "۰۲",
    title: "فروش و پیگیری",
    description:
      "فرصت‌ها بر اساس مرحله، ارزش و اقدام بعدی دیده می‌شوند تا پیگیری عقب نیفتد و هیچ سرنخی گم نشود.",
    bullets: ["خط فروش روشن", "اقدام بعدی", "مالک مشخص"],
    visual: miniPipeline()
  },
  {
    number: "۰۳",
    title: "پرونده و اجرا",
    description:
      "از ثبت درخواست تا تأیید، اقدام، رسید و نتیجه، مسیر انجام کار و شواهدش در همان پرونده می‌ماند.",
    bullets: ["خط زمانی", "تأیید", "رسید و نتیجه"],
    visual: miniCase()
  }
]);

function productMiniFrame({ title, badge = "رهجو", content }) {
  return `
    <div class="sw-mini-frame" aria-label="${title}">
      <div class="sw-mini-frame__bar">
        <div><i></i><strong>${badge}</strong></div>
        <span>${title}</span>
      </div>
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

function heroPreview() {
  return `
    <div class="sw-hero-card" aria-label="خلاصه محیط محصول رهجو">
      <div class="sw-hero-card__rail">
        <span class="is-active">داشبورد</span>
        <span>مشتریان</span>
        <span>فروش</span>
        <span>پرونده‌ها</span>
      </div>
      <div class="sw-hero-card__main">
        <div class="sw-hero-card__top">
          <div>
            <small>در یک نگاه</small>
            <h3>امروز چه چیزی باز است؟</h3>
          </div>
          <b>مدیر عملیات</b>
        </div>
        <div class="sw-hero-metrics">
          <article><small>پرونده باز</small><strong>۱۲</strong></article>
          <article><small>کار امروز</small><strong>۷</strong></article>
          <article><small>فرصت فعال</small><strong>۵</strong></article>
        </div>
        <div class="sw-hero-next">
          <div>
            <small>اقدام بعدی</small>
            <strong>تأیید شروع اجرای خدمت</strong>
            <span>آریا صنعت · CASE-1028</span>
          </div>
          <em>امروز</em>
        </div>
      </div>
    </div>`;
}

function schematicJourney() {
  const items = [
    ["ورود", "ثبت سرنخ یا درخواست", "requests"],
    ["مشتری", "حساب و مخاطب", "users"],
    ["فروش", "فرصت و پیگیری", "reports"],
    ["پرونده", "اجرا و کارها", "requests"],
    ["نتیجه", "رسید و سابقه", "check"]
  ];
  return `<div class="sw-journey" aria-label="مسیر کار در رهجو">${items
    .map(
      ([title, desc, glyph], index) => `
        <article>
          <span>${icon(glyph, { size: 17 })}</span>
          <b>${title}</b>
          <small>${desc}</small>
          ${index < items.length - 1 ? '<i class="sw-journey__line"></i>' : ""}
        </article>`
    )
    .join("")}</div>`;
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

function capabilityCards() {
  const items = [
    ["سابقهٔ متمرکز", "هر مشتری و تعاملاتش در یکجا دیده می‌شود.", "users"],
    ["کارهای بعدی", "هر فرصت و پرونده اقدام بعدی و مالک دارد.", "check"],
    ["شفافیت اجرا", "پرونده‌ها با خط زمانی و وضعیت قابل پیگیری‌اند.", "workflow"],
    ["گزارش کاربردی", "تیم می‌فهمد چه چیزی باز است و کجا باید رسیدگی کند.", "dashboard"]
  ];
  return `<div class="sw-capability-grid">${items
    .map(
      ([title, desc, glyph]) => `
        <article>
          <span>${icon(glyph, { size: 18 })}</span>
          <h3>${title}</h3>
          <p>${desc}</p>
        </article>`
    )
    .join("")}</div>`;
}

export function renderMinimalHomePage() {
  return siteShell({
    activePath: "/",
    content: `
      <section class="sw-hero sw-hero--compact">
        <div class="container sw-hero__grid">
          <div class="sw-hero__copy">
            <p class="sw-kicker">CRM ساده برای پیگیری رابطه با مشتری، فروش و اجرای کار</p>
            <h1>همه‌چیز را خلاصه، روشن و قابل پیگیری نگه دارید.</h1>
            <p class="sw-lead">رهجو برای تیم‌هایی است که می‌خواهند مشتری، فرصت، پرونده و کارهای بعدی را در یک سیستم منظم ببینند؛ بدون شلوغی صفحه و بدون گم‌شدن پیگیری‌ها.</p>
            <div class="sw-actions">
              <a class="button button--primary button--large" href="#product">نگاهی سریع به محصول ${icon("arrow")}</a>
              <a data-link class="button button--outline button--large" href="/contact">شروع با رهجو</a>
            </div>
            <div class="sw-fit-tags">${fitTags.map((item) => `<span>${item}</span>`).join("")}</div>
          </div>
          <div class="sw-hero__visual">
            ${schematicJourney()}
            ${heroPreview()}
          </div>
        </div>
      </section>

      <section class="sw-summary-strip">
        <div class="container sw-summary-strip__inner">
          <article><b>یک نمای کوتاه</b><p>به‌جای چندین تصویر بزرگ، یک نمای فشرده از وضعیت امروز و اقدام بعدی.</p></article>
          <article><b>سه مفهوم اصلی</b><p>حافظهٔ مشتری، پیگیری فروش و اجرای پرونده؛ همین‌ها هستهٔ صفحه را می‌سازند.</p></article>
          <article><b>برای چند دسته کسب‌وکار</b><p>روایت صفحه فقط محدود به خدماتی نیست و می‌تواند فروش، پروژه و پشتیبانی را هم پوشش بدهد.</p></article>
        </div>
      </section>

      <section class="sw-pillars" id="product">
        <div class="container sw-section-head">
          <p class="sw-kicker">سه چیز مهم در محصول</p>
          <h2>به‌جای نمایش چند صفحه کامل، ایدهٔ اصلی رهجو را ببینید.</h2>
          <p>هر بخش یک استفادهٔ واقعی از محصول را در چند خط و یک preview کوچک نشان می‌دهد.</p>
        </div>
        <div class="container sw-pillar-grid">${pillars.map((item) => pillarCard(item)).join("")}</div>
      </section>

      <section class="sw-capabilities">
        <div class="container sw-section-head">
          <p class="sw-kicker">چرا جواب می‌دهد</p>
          <h2>چیزی که صفحه باید منتقل کند، وضوح است نه شلوغی.</h2>
          <p>رهجو قرار نیست صرفاً چند ماژول را ردیف کند؛ باید نشان دهد تیم چگونه وضعیت، مسئول و اقدام بعدی را سریع پیدا می‌کند.</p>
        </div>
        <div class="container">${capabilityCards()}</div>
      </section>

      <section class="sw-final">
        <div class="container sw-final__inner">
          <div>
            <p class="sw-kicker">شروع با رهجو</p>
            <h2>اگر می‌خواهید پیگیری‌ها جمع‌وجور و منظم شوند، از همین‌جا شروع کنید.</h2>
            <p>برای شناخت محصول یا راه‌اندازی، وارد مسیر شروع شوید و بعد محیط کار را ببینید.</p>
          </div>
          <div class="sw-actions">
            <a data-link class="button button--primary button--large" href="/contact">شروع با رهجو</a>
            <a data-link class="button button--outline button--large" href="/login">ورود</a>
          </div>
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
            <h1>رهجو برای تیم‌هایی است که می‌خواهند مسیر مشتری را از رابطه تا نتیجه گم نکنند.</h1>
            <p class="sw-lead">به‌جای انبوه قابلیت‌ها، این صفحه فقط روی هستهٔ محصول تمرکز می‌کند: مشتری، فروش، پرونده و اقدام بعدی.</p>
            <div class="sw-fit-tags">${fitTags.map((item) => `<span>${item}</span>`).join("")}</div>
          </div>
          <div class="sw-page-hero__visual">
            ${schematicJourney()}
          </div>
        </div>
      </section>

      <section class="sw-pillars sw-pillars--product">
        <div class="container sw-section-head">
          <p class="sw-kicker">ساختار محصول</p>
          <h2>سه لایه‌ای که CRM را از اجرای کار جدا نمی‌کنند.</h2>
          <p>رهجو رابطه با مشتری، پیگیری تجاری و اجرای پرونده را در یک مسیر به هم متصل نگه می‌دارد.</p>
        </div>
        <div class="container sw-pillar-grid">${pillars.map((item) => pillarCard(item)).join("")}</div>
      </section>

      <section class="sw-product-proof">
        <div class="container sw-product-proof__grid">
          <div>
            <p class="sw-kicker">خروجی صفحه</p>
            <h2>بازدیدکننده باید سریع بفهمد با چه جور نرم‌افزاری روبه‌روست.</h2>
            <ul class="sw-check-list">
              <li>${icon("check", { size: 16 })}<span>مشتری فقط یک رکورد نیست؛ به فرصت‌ها و پرونده‌ها وصل است.</span></li>
              <li>${icon("check", { size: 16 })}<span>فروش با اقدام بعدی و مسئول روشن دنبال می‌شود.</span></li>
              <li>${icon("check", { size: 16 })}<span>پرونده‌ها خط زمانی، تأیید و نتیجه دارند.</span></li>
              <li>${icon("check", { size: 16 })}<span>همه‌چیز ساده و فشرده نمایش داده می‌شود.</span></li>
            </ul>
          </div>
          <div class="sw-product-proof__card">
            ${heroPreview()}
          </div>
        </div>
      </section>

      <section class="sw-final sw-final--light">
        <div class="container sw-final__inner">
          <div>
            <p class="sw-kicker">مرحله بعد</p>
            <h2>اگر می‌خواهید ببینید رهجو برای تیم شما مناسب است، از صفحه شروع ادامه بدهید.</h2>
          </div>
          <div class="sw-actions">
            <a data-link class="button button--primary button--large" href="/contact">شروع با رهجو</a>
            <a data-link class="button button--outline button--large" href="/login">ورود به رهجو</a>
          </div>
        </div>
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
          <h1>شروع با رهجو باید ساده باشد.</h1>
          <p class="sw-lead">اگر می‌خواهید رهجو را برای فروش، پیگیری مشتری یا اجرای کار بررسی کنید، از همین مسیر جلو بروید. این نسخه روی معرفی روشن محصول تمرکز دارد، نه فرم‌های طولانی و شلوغ.</p>
          <div class="sw-actions">
            <a data-link class="button button--primary button--large" href="/login">ورود به رهجو</a>
            <a data-link class="button button--outline button--large" href="/product">دیدن محصول</a>
          </div>
        </div>
      </section>

      <section class="sw-start-grid">
        <div class="container sw-start-grid__inner">
          <article>
            <b>۱</b>
            <h2>محصول را ببینید</h2>
            <p>در صفحه محصول، ساختار مشتری، فروش و پرونده را مرور کنید.</p>
          </article>
          <article>
            <b>۲</b>
            <h2>مسئلهٔ خود را مشخص کنید</h2>
            <p>آیا مسئله شما پیگیری فروش است، نظم پرونده‌هاست یا دیده‌شدن کارهای بعدی؟</p>
          </article>
          <article>
            <b>۳</b>
            <h2>وارد محیط شوید</h2>
            <p>بعد از شروع، می‌توانید محیط کار رهجو را در context واقعی خودتان ببینید.</p>
          </article>
        </div>
      </section>

      <section class="sw-final sw-final--light">
        <div class="container sw-final__inner">
          <div>
            <p class="sw-kicker">راه ورود</p>
            <h2>برای ادامه، وارد رهجو شوید یا ابتدا محصول را مرور کنید.</h2>
          </div>
          <div class="sw-actions">
            <a data-link class="button button--primary button--large" href="/login">ورود به رهجو</a>
            <a data-link class="button button--outline button--large" href="/product">محصول</a>
          </div>
        </div>
      </section>`
  });
}

export function renderMinimalTrackPage() {
  return siteShell({
    activePath: "/contact",
    content: `
      <section class="sw-contact-hero">
        <div class="container sw-contact-hero__inner">
          <p class="sw-kicker">پیگیری</p>
          <h1>وضعیت پرونده را داخل فضای کاری رهجو ببینید.</h1>
          <p class="sw-lead">برای دیدن پرونده، اقدام‌های باز و آخرین رویدادها وارد محیط کار شوید.</p>
          <div class="sw-actions"><a data-link class="button button--primary button--large" href="/login">ورود ${icon("arrow")}</a></div>
        </div>
      </section>`
  });
}
