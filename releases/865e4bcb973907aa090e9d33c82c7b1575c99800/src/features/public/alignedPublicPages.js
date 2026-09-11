// @ts-nocheck
import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";

const journey = Object.freeze([
  ["ورودی", "نیاز از سایت، تماس یا کانال فروش وارد می‌شود"],
  ["مشتری", "حساب و افراد مرتبط در حافظهٔ تجاری مشترک قرار می‌گیرند"],
  ["فرصت / پرونده", "فروش یا درخواست خدمت با مالک و وضعیت روشن شکل می‌گیرد"],
  ["خدمت", "شرایط، مدارک و مسیر اجرای خدمت مشخص می‌شود"],
  ["تأیید", "تصمیم انسانی در نقاط حساس ثبت می‌شود"],
  ["اقدام", "اجرای کنترل‌شده با وضعیت و رسید انجام می‌شود"],
  ["نتیجه", "خروجی و اقدام بعدی به سابقهٔ مشتری برمی‌گردد"]
]);

function pageHero({ eyebrow, title, description, primary = ["/contact", "بررسی کسب‌وکار من"], secondary = ["/login", "ورود به رهجو"] }) {
  return `
    <section class="w14-subhero">
      <div class="container w14-subhero__inner">
        <span class="w14-eyebrow">${eyebrow}</span>
        <h1>${title}</h1>
        <p>${description}</p>
        <div class="button-row"><a data-link class="button button--primary button--large" href="${primary[0]}">${primary[1]} ${icon("arrow")}</a><a data-link class="button button--outline button--large" href="${secondary[0]}">${secondary[1]}</a></div>
      </div>
    </section>`;
}

function journeyBand() {
  return `<section class="w14-journey-band"><div class="container"><div class="w14-journey-band__head"><span>زنجیرهٔ مشترک رهجو</span><p>همین مسیر در سایت، محیط عملیاتی و سابقهٔ مشتری ادامه پیدا می‌کند.</p></div><ol>${journey.map(([title, desc], index) => `<li><b>${index + 1}</b><strong>${title}</strong><small>${desc}</small></li>`).join("")}</ol></div></section>`;
}

export function renderAlignedProductPage() {
  return siteShell({
    activePath: "/product",
    content: `${pageHero({ eyebrow: "محصول", title: "یک سیستم برای حافظهٔ مشتری و اجرای کار، نه مجموعه‌ای از صفحه‌های جدا.", description: "رهجو فروش و CRM را به پروندهٔ خدمت، تأیید انسانی، اجرای کنترل‌شده و نتیجه وصل می‌کند تا تیم برای فهم وضعیت مشتری بین ابزارها و افراد جابه‌جا نشود." })}
      <section class="w14-page-section"><div class="container"><header class="w14-page-heading"><span>هستهٔ محصول</span><h2>چهار لایه که روی یک سابقهٔ مشترک کار می‌کنند</h2></header><div class="w14-capability-grid">
        <article><span>${icon("users")}</span><h3>حافظهٔ تجاری</h3><p>Account، Contact، Lead، Opportunity، Interaction و Task سابقهٔ رابطه را نگه می‌دارند.</p></article>
        <article><span>${icon("requests")}</span><h3>پروندهٔ خدمت</h3><p>Case نیاز مشتری را به Service، مدارک، مالک، وضعیت و تعهدات مرتبط می‌کند.</p></article>
        <article><span>${icon("workflow")}</span><h3>اجرای کنترل‌شده</h3><p>Approval، Action، Run و Receipt مسیر تصمیم و اجرا را قابل پیگیری می‌کنند.</p></article>
        <article><span>${icon("signal")}</span><h3>نتیجه و ممیزی</h3><p>Outcome و Audit نشان می‌دهند چه شد، چه کسی تصمیم گرفت و اقدام بعدی چیست.</p></article>
      </div></div></section>
      ${journeyBand()}
      <section class="w14-page-section w14-page-section--tint"><div class="container w14-split"><div><span class="w14-eyebrow">مرز هوشمندی</span><h2>AI کمک می‌کند؛ هستهٔ کار به آن وابسته نیست.</h2></div><div><p>جست‌وجو، مجوز، پرونده، تأیید، اجرای قطعی، ممیزی و ثبت نتیجه باید حتی با خاموش بودن تمام مدل‌ها کار کنند. قابلیت‌های هوشمند در آینده می‌توانند پیشنهاد، خلاصه و تحلیل اضافه کنند، نه اینکه مالک تصمیم یا تعهد قطعی باشند.</p><a data-link class="text-link" href="/trust">اعتماد و کنترل ${icon("arrow", { size: 16 })}</a></div></div></section>`
  });
}

export function renderAlignedServicesPage() {
  return siteShell({
    activePath: "/services",
    content: `${pageHero({ eyebrow: "خدمات", title: "خدمت در رهجو یک صفحهٔ معرفی نیست؛ یک قرارداد اجرایی قابل پیگیری است.", description: "هر خدمت باید مشخص کند چه ورودی‌ای لازم دارد، چه شرایطی دارد، چه کسی مسئول است، کجا تأیید انسانی لازم است و نتیجه چگونه ثبت می‌شود.", primary: ["/request-service", "ثبت درخواست خدمت"], secondary: ["/how-it-works", "دیدن مسیر اجرا"] })}
      <section class="w14-page-section"><div class="container"><header class="w14-page-heading"><span>قرارداد خدمت</span><h2>چیزی که قبل از اجرا باید روشن باشد</h2></header><div class="w14-service-contract">
        <article><b>01</b><h3>ورودی و شرایط</h3><p>اطلاعات، مدارک و پیش‌شرط‌های لازم قبل از شروع مشخص‌اند.</p></article>
        <article><b>02</b><h3>مالک و SLA</h3><p>مسئول، وضعیت، زمان مورد انتظار و اقدام بعدی قابل مشاهده است.</p></article>
        <article><b>03</b><h3>ریسک و تأیید</h3><p>نقاطی که تصمیم انسانی یا سطح دسترسی بالاتر می‌خواهند از قبل تعریف می‌شوند.</p></article>
        <article><b>04</b><h3>رسید و نتیجه</h3><p>اجرای خدمت بدون Receipt و Outcome نهایی تلقی نمی‌شود.</p></article>
      </div></div></section>
      ${journeyBand()}
      <section class="w14-page-section"><div class="container w14-callout"><div><span>${icon("requests")}</span><div><h2>هر درخواست، یک Case واقعی</h2><p>درخواست مشتری به رکوردی با شناسه، منبع، مشتری، خدمت، مالک، تأییدها، اقدام‌ها و نتیجه تبدیل می‌شود؛ نه یک پیام یا فرم رهاشده.</p></div></div><a data-link class="button button--primary" href="/request-service">شروع درخواست</a></div></section>`
  });
}

export function renderAlignedUseCasesPage() {
  return siteShell({
    activePath: "/use-cases",
    content: `${pageHero({ eyebrow: "موارد استفاده", title: "رهجو برای جایی است که فروش و ارائهٔ خدمت باید یک مسیر مشترک داشته باشند.", description: "اگر مشتری از چند کانال وارد می‌شود، پیگیری‌ها بین افراد پخش است و بعد از فروش اجرای خدمت در ابزار دیگری ادامه پیدا می‌کند، رهجو همان شکاف را هدف می‌گیرد." })}
      <section class="w14-page-section"><div class="container"><div class="w14-usecase-grid">
        <article><span>${icon("reports")}</span><small>فروش خدماتی</small><h3>از Lead تا Case بدون دوباره‌کاری</h3><p>مشتری و فرصت فروش بعد از توافق از بین نمی‌روند؛ همان سابقه وارد اجرای خدمت می‌شود.</p><ul><li>مالک و اقدام بعدی</li><li>Opportunity مرتبط</li><li>تبدیل به Case با حفظ منبع</li></ul></article>
        <article><span>${icon("workflow")}</span><small>عملیات چندمرحله‌ای</small><h3>کارهایی که تأیید و تحویل دارند</h3><p>برای خدماتی که چند مرحله، چند مسئول و نقاط تصمیم انسانی دارند.</p><ul><li>Approval مشخص</li><li>Action و Run قابل پیگیری</li><li>Receipt و Outcome</li></ul></article>
        <article><span>${icon("document")}</span><small>خدمات مدرک‌محور</small><h3>پرونده‌ای که با فایل گم نمی‌شود</h3><p>مدرک بخشی از Case است و وضعیت آن به کار، تأیید و نتیجه وصل می‌شود.</p><ul><li>رابطه با مشتری و خدمت</li><li>نسخه و وضعیت</li><li>تاریخچهٔ قابل ممیزی</li></ul></article>
        <article><span>${icon("users")}</span><small>مدیریت رابطه</small><h3>وقتی Account 360 باید عملیاتی باشد</h3><p>برای تیمی که فقط اطلاعات تماس نمی‌خواهد و باید تعهدات باز، پرونده‌ها و نتیجه‌ها را هم ببیند.</p><ul><li>Contact و Interaction</li><li>تعهد و Task باز</li><li>Outcomeهای قبلی</li></ul></article>
      </div></div></section>
      ${journeyBand()}`
  });
}

export function renderAlignedHowItWorksPage() {
  return siteShell({
    activePath: "/how-it-works",
    content: `${pageHero({ eyebrow: "نحوهٔ کار", title: "رهجو هر مرحله را به مرحلهٔ بعد تحویل می‌دهد؛ بدون شکستن سابقهٔ مشتری.", description: "هدف این نیست که یک فرم جدید یا داشبورد جدید اضافه شود. هدف این است که ورودی، تصمیم، اجرا و نتیجه روی یک زنجیرهٔ قابل بازسازی حرکت کنند.", primary: ["/contact", "بررسی مسیر فعلی من"], secondary: ["/product", "ساختار محصول"] })}
      <section class="w14-page-section"><div class="container"><ol class="w14-how-steps">${journey.map(([title, desc], index) => `<li><b>0${index + 1}</b><div><h3>${title}</h3><p>${desc}</p>${index === 0 ? `<small>منبع و attribution ثبت می‌شود</small>` : index === 4 ? `<small>تصمیم حساس بدون انسان جلو نمی‌رود</small>` : index === 5 ? `<small>idempotency و وضعیت اجرا قابل کنترل است</small>` : index === 6 ? `<small>نتیجه به Account/Case برمی‌گردد</small>` : ""}</div></li>`).join("")}</ol></div></section>
      <section class="w14-page-section w14-page-section--dark"><div class="container w14-split"><div><span class="w14-eyebrow">اصل طراحی</span><h2>هر مرحله باید سه سؤال را جواب دهد.</h2></div><div class="w14-question-grid"><article><b>۱</b><h3>الان چه وضعیتی داریم؟</h3><p>State از دادهٔ canonical خوانده می‌شود، نه از برداشت افراد.</p></article><article><b>۲</b><h3>اقدام بعدی چیست و با چه کسی؟</h3><p>مالک، سررسید، مجوز و پیش‌شرط روشن است.</p></article><article><b>۳</b><h3>بعداً چطور ثابت می‌کنیم چه شد؟</h3><p>رویداد، Receipt و Outcome زنجیرهٔ قابل ممیزی می‌سازند.</p></article></div></div></section>`
  });
}
