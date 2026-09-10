// @ts-nocheck
import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";
import { implementationSteps, serviceCatalog, useCaseCatalog } from "../../data/phaseOneData.js";
import { addContactSubmission, readDemoState, saveRequestDraft } from "../../services/phaseOneStore.js";

const productModules = [
  ["users", "مشتریان", "پروفایل واحد، اشخاص مرتبط و تاریخچهٔ کامل رابطه"],
  ["reports", "فروش", "سرنخ، فرصت، پیشنهاد و اقدام بعدی در مسیر روشن"],
  ["settings", "خدمات", "قیمت، مدارک، مسئول، زمان و مراحل قابل‌پیکربندی"],
  ["requests", "درخواست‌ها", "یک پروندهٔ قابل‌پیگیری از ثبت تا تحویل"],
  ["check", "کارها و پیگیری", "کار امروز، سررسید، مسئول و نتیجه"],
  ["workflow", "عملیات", "صف اجرا، مراحل، SLA و تأیید انسانی"],
  ["bank", "مالی و اعتبار", "پیشنهاد، پرداخت، دریافتنی و اعتبار مشتری"],
  ["signal", "گزارش و ممیزی", "تصویر مدیریتی و تاریخچهٔ قابل بازبینی"]
];

const journey = [
  ["ورودی", "ثبت نیاز از هر کانال", "users"],
  ["مشتری", "پروفایل و سابقهٔ واحد", "identity"],
  ["فروش", "فرصت، پیشنهاد و قرارداد", "reports"],
  ["خدمت", "درخواست، مدارک و پرداخت", "requests"],
  ["اجرا", "تخصیص، پیگیری و تأیید", "workflow"],
  ["نتیجه", "تحویل و پیگیری بعدی", "check"]
];

function publicHero({ title, description, activePath, content = "" }) {
  return siteShell({
    activePath,
    content: `
      <section class="public-page-hero">
        <div class="container public-page-hero__inner">
          <div><h1>${title}</h1><p>${description}</p></div>
          ${content}`
  });
}

function miniDashboard() {
  return `
    <div class="home-product-preview" aria-label="پیش‌نمایش محیط عملیاتی رهجو">
      <aside>
        <strong>رهجو</strong>
        <span class="is-active">${icon("dashboard", { size: 16 })} داشبورد</span>
        <span>${icon("users", { size: 16 })} مشتریان</span>
        <span>${icon("reports", { size: 16 })} فروش</span>
        <span>${icon("requests", { size: 16 })} درخواست‌ها</span>
        <span>${icon("workflow", { size: 16 })} عملیات</span>
        <span>${icon("bank", { size: 16 })} مالی</span>
      </aside>
      <div class="home-product-preview__main">
        <header><div><strong>صبح بخیر، نسترن</strong><small>امروز همه چیز در جریان است.</small></div><span>${icon("search", { size: 15 })} جست‌وجو…</span></header>
        <div class="preview-kpis"><span><b>۱۲</b><small>درخواست باز</small></span><span><b>۸</b><small>کار امروز</small></span><span><b>۳</b><small>پرداخت در انتظار</small></span></div>
        <section><h3>اقدام بعدی من</h3><ul><li><i class="dot dot--danger"></i><div><strong>پیگیری پرداخت آریا صنعت</strong><small>امروز، ۱۰:۰۰</small></div></li><li><i class="dot dot--warning"></i><div><strong>بازبینی مدرک درخواست جدید</strong><small>امروز، ۱۲:۰۰</small></div></li><li><i class="dot"></i><div><strong>تأیید شروع مرحلهٔ اجرا</strong><small>امروز، ۱۵:۳۰</small></div></li></ul></section>
      </div>
    </div>`;
}

export function renderHomePage() {
  return siteShell({
    activePath: "/",
    content: `
      <section class="home-hero">
        <div class="container home-hero__grid">
          <div class="home-hero__copy">
            <h1>عملیات کسب‌وکارتان را از اولین تماس مشتری تا تحویل خدمت، یکپارچه کنید.</h1>
            <p>رهجو مشتری، فروش، درخواست خدمت، اسناد، پیگیری، پرداخت، اجرا و نتیجه را در یک جریان واحد قرار می‌دهد.</p>
            <div class="button-row"><a data-link class="button button--primary button--large" href="/login">دیدن دموی رهجو ${icon("arrow")}</a><a data-link class="button button--outline button--large" href="/contact">بررسی کسب‌وکار من</a></div>
            <small class="hero-note">یک هستهٔ استاندارد که با فرایند واقعی کسب‌وکار شما پیکربندی می‌شود.</small>
          </div>
          <div class="home-hero__visual">${miniDashboard()}<div class="journey-line" aria-hidden="true"></div></div>
        </div>
      </section>

      <section class="flow-section">
        <div class="container flow-section__grid">
          <div class="flow-intro"><h2>از درخواست تا نتیجه، بدون گم‌شدن کار</h2><p>به‌جای چند ابزار جدا، یک مسیر روشن دارید که مسئول، وضعیت و اقدام بعدی را همیشه مشخص نگه می‌دارد.</p><a data-link class="text-link" href="/how-it-works">نحوهٔ کار رهجو ${icon("arrow", { size: 16 })}</a></div>
          <ol class="journey-flow">${journey.map(([title, desc, glyph]) => `<li><span>${icon(glyph, { size: 24 })}</span><strong>${title}</strong><small>${desc}</small></li>`).join("")}</ol>
        </div>
      </section>

      <section class="problem-section">
        <div class="container problem-section__grid">
          <div><h2>وقتی مسیر مشتری تکه‌تکه است، هیچ‌کس تصویر کامل را ندارد.</h2><p>مشتری از یک کانال وارد می‌شود، فایل در پیام‌رسان می‌ماند، قیمت تلفنی اعلام می‌شود، پرداخت جداست و عملیات با حافظهٔ افراد پیش می‌رود. نتیجه؟ پیگیری فراموش می‌شود و سابقهٔ نهایی کامل نیست.</p></div>
          <div class="fragment-list"><span>${icon("phone")} تماس و پیام</span><span>${icon("document")} فایل و اکسل</span><span>${icon("bank")} پرداخت جدا</span><span>${icon("clock")} پیگیری دستی</span><strong>${icon("link")} رهجو این نقاط را به یک جریان وصل می‌کند.</strong></div>
        </div>
      </section>

      <section class="public-section">
        <div class="container"><header class="section-heading"><div><h2>زیرساخت کار روزمرهٔ کسب‌وکار</h2><p>هر ماژول یک مسئلهٔ مشخص را حل می‌کند و همهٔ ماژول‌ها از یک سابقهٔ مشترک استفاده می‌کنند.</p></div><a data-link class="button button--outline" href="/product">دیدن محصول</a></header><div class="module-grid">${productModules.map(([glyph, title, desc]) => `<article><span>${icon(glyph)}</span><h3>${title}</h3><p>${desc}</p></article>`).join("")}</div></div>
      </section>

      <section class="product-proof-section">
        <div class="container product-proof-section__grid">
          <div class="account-preview">
            <header><div><span class="account-avatar">آ</span><div><strong>شرکت آریا صنعت</strong><small>مشتری فعال · مسئول حساب: نسترن احمدی</small></div></div><button>درخواست جدید</button></header>
            <nav><b>نمای کلی</b><span>فروش</span><span>درخواست‌ها</span><span>مالی</span><span>خط زمانی</span></nav>
            <div class="account-preview__body"><section><h3>رابطهٔ جاری</h3><p>۳ فرصت باز، ۲ درخواست فعال و یک پرداخت نیازمند پیگیری.</p><div class="preview-request"><span class="status status--progress">در حال اجرا</span><strong>راه‌اندازی فرایند فروش</strong><small>رهـ-۱۴۰۵-۰۲۸۴</small></div></section><ol><li><i></i><div><strong>پیشنهاد تأیید شد</strong><small>امروز، ۱۳:۴۸</small></div></li><li><i></i><div><strong>پرداخت مرحلهٔ اول ثبت شد</strong><small>امروز، ۱۴:۲۰</small></div></li><li><i></i><div><strong>کار به عملیات تخصیص یافت</strong><small>اقدام بعدی</small></div></li></ol></div>
          </div>
          <div><h2>Account 360؛ حافظهٔ تجاری مشتری</h2><p>هر تماس، فرصت، درخواست، فایل، پرداخت، کار و نتیجه در یک صفحه کنار هم می‌ماند. تیم شما برای فهم وضعیت مشتری مجبور نیست چند نفر و چند ابزار را جست‌وجو کند.</p><ul class="check-list"><li>${icon("check", { size: 17 })} سابقهٔ واحد و قابل جست‌وجو</li><li>${icon("check", { size: 17 })} اقدام بعدی و مسئول روشن</li><li>${icon("check", { size: 17 })} اتصال فروش، عملیات و مالی</li></ul><a data-link class="button button--primary" href="/login">دیدن در دمو</a></div>
        </div>
      </section>

      <section class="scenario-section">
        <div class="container"><header class="section-heading"><div><h2>یک سناریوی کامل، نه چند صفحهٔ جدا</h2><p>Golden Demo رهجو یک مشتری را از ثبت درخواست تا تحویل نتیجه دنبال می‌کند.</p></div></header><ol class="scenario-rail"><li><b>۱</b><span>درخواست مشتری</span></li><li><b>۲</b><span>تکمیل مدارک</span></li><li><b>۳</b><span>پیشنهاد و تأیید</span></li><li><b>۴</b><span>پرداخت</span></li><li><b>۵</b><span>اجرا و تأیید انسانی</span></li><li><b>۶</b><span>تحویل و پیگیری</span></li></ol></div>
      </section>

      <section class="why-section"><div class="container why-section__grid"><div><h2>چرا رهجو؟</h2><p>چون سیستم باید قبل از هر چیز کار واقعی تیم را راه بیندازد.</p></div><dl><div><dt>یکپارچگی</dt><dd>یک شناسه و سابقه برای کل مسیر مشتری</dd></div><div><dt>پیگیری</dt><dd>کار، مسئول و سررسید فراموش نمی‌شود</dd></div><div><dt>کنترل</dt><dd>نقش، تأیید و تاریخچه در جای لازم</dd></div><div><dt>توسعه‌پذیری</dt><dd>اتصال و قابلیت‌های آینده بدون بازسازی هسته</dd></div></dl></div></section>

      <section class="deployment-section"><div class="container"><header class="section-heading"><div><h2>راه‌اندازی متناسب با کسب‌وکار شما</h2><p>رهجو یک هستهٔ استاندارد دارد؛ خدمات، فرم‌ها، نقش‌ها و گردش‌کارها بر اساس واقعیت عملیات شما تنظیم می‌شوند.</p></div><a data-link class="button button--outline" href="/pilot">جزئیات راه‌اندازی</a></header><ol class="implementation-row">${implementationSteps.map((step) => `<li><b>${step.number}</b><div><strong>${step.title}</strong><p>${step.description}</p></div></li>`).join("")}</ol></div></section>

      <section class="future-section"><div class="container future-section__inner">${icon("link", { size: 28 })}<div><h2>آماده برای اتصال و رشد آینده</h2><p>زیرساخت رهجو برای اتصال به سرویس‌های دیجیتال، اتوماسیون‌های پیچیده‌تر و قابلیت‌های هوشمند آینده طراحی شده است؛ بدون اینکه کارکرد پایه به آن‌ها وابسته باشد.</p></div></div></section>

      <section class="final-cta"><div class="container"><div><h2>مسیر مشتری و عملیات شما کجا از هم جدا می‌شوند؟</h2><p>در یک جلسهٔ کوتاه، جریان موجود را مرور می‌کنیم و نقطهٔ مناسب شروع را مشخص می‌کنیم.</p></div><div class="button-row"><a data-link class="button button--light button--large" href="/contact">بررسی کسب‌وکار من</a><a data-link class="button button--ghost-light button--large" href="/login">دیدن دمو</a></div></div></section>`
  });
}

export function renderProductPage() {
  const content = `
    <div class="public-page-actions"><a data-link class="button button--primary" href="/login">دیدن دموی تعاملی</a><a data-link class="button button--outline" href="/contact">درخواست جلسه</a></div>
    </div></section>
    <section class="public-section public-section--first"><div class="container"><header class="section-heading"><div><h2>یک جریان واقعی از مشتری تا نتیجه</h2><p>هر اتفاق در رهجو به مشتری، خدمت و درخواست درست متصل می‌شود.</p></div></header><ol class="wide-flow">${["مشتری", "نیاز", "فرصت", "خدمت", "درخواست", "مدارک", "قیمت", "پرداخت", "اجرا", "نتیجه"].map((item, index) => `<li><b>${new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2, useGrouping: false }).format(index + 1)}</b><span>${item}</span></li>`).join("")}</ol></div></section>
    <section class="public-section public-section--tint"><div class="container"><div class="module-grid">${productModules.map(([glyph, title, desc]) => `<article><span>${icon(glyph)}</span><h3>${title}</h3><p>${desc}</p></article>`).join("")}</div></div></section>
    <section class="public-section"><div class="container split-copy"><div><h2>فناوری در خدمت عملیات، نه برعکس</h2><p>معماری ماژولار رهجو اجازه می‌دهد خدمات، فرم‌ها، وضعیت‌ها، نقش‌ها و قواعد بدون بازنویسی هسته تغییر کنند. API و Connector در سطح داخلی آماده‌اند اما مسئلهٔ اصلی مشتری معرفی نمی‌شوند.</p></div><div class="architecture-note"><strong>هستهٔ عملیاتی</strong><span>موجودیت‌های مرتبط و تاریخچهٔ مشترک</span><i></i><strong>اتصال‌های مستقل</strong><span>پرداخت، حسابداری، پیام، ایمیل و سرویس ثالث</span><i></i><strong>آیندهٔ اختیاری</strong><span>تحلیل و قابلیت هوشمند، پس از شکل‌گیری دادهٔ درست</span></div></div></section>`;
  return publicHero({ title: "رهجو، سیستم یکپارچهٔ مشتری، فروش و ارائهٔ خدمات", description: "از اولین تعامل تا ثبت درخواست، پرداخت، اجرا و تحویل؛ همهٔ تیم روی یک مسیر و یک سابقه کار می‌کند.", activePath: "/product", content });
}

export function renderServicesPage() {
  const categories = ["همه", ...new Set(serviceCatalog.map((item) => item.category))];
  const content = `
    <div class="public-page-actions"><a data-link class="button button--primary" href="/request-service">ثبت درخواست خدمت</a></div>
    </div></section>
    <section class="public-section public-section--first"><div class="container"><div class="service-toolbar" role="group" aria-label="فیلتر دستهٔ خدمت">${categories.map((category) => `<button type="button" data-service-filter="${category}" ${category === "همه" ? 'aria-pressed="true"' : ""}>${category}</button>`).join("")}</div><div class="service-list">${serviceCatalog.map((service) => `<article data-service-card data-category="${service.category}"><div class="service-list__title"><span>${icon(service.online ? "requests" : "link")}</span><div><small>${service.category}</small><h2>${service.title}</h2></div></div><p>${service.summary}</p><dl><div><dt>زمان تقریبی</dt><dd>${service.duration}</dd></div><div><dt>قیمت</dt><dd>${service.priceLabel}</dd></div><div><dt>خروجی</dt><dd>${service.output}</dd></div></dl><div class="service-list__actions"><button type="button" class="text-link" data-service-expand="${service.id}">مشاهدهٔ الزامات ${icon("arrow", { size: 15 })}</button><a data-link class="button button--outline" href="/request-service" data-service-select="${service.id}">شروع درخواست</a></div><div class="service-requirements" data-service-requirements="${service.id}" hidden><strong>مدارک و اطلاعات موردنیاز</strong><ul>${service.documents.map((item) => `<li>${icon("check", { size: 15 })}${item}</li>`).join("")}</ul><strong>مراحل</strong><p>${service.stages.join(" ← ")}</p></div></article>`).join("")}</div></div></section>`;
  return publicHero({ title: "خدماتی که مشتری واقعاً درخواست می‌کند", description: "هر خدمت در رهجو قیمت، زمان، مدارک، مسئول، مراحل و خروجی روشن دارد. API فقط یکی از راه‌های اجرای یک خدمت است.", activePath: "/services", content });
}

export function renderUseCasesPage() {
  const content = `</div></section><section class="public-section public-section--first"><div class="container"><div class="use-case-list">${useCaseCatalog.map((item, index) => `<article><b>${new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2 }).format(index + 1)}</b><div><h2>${item.title}</h2><p>${item.problem}</p></div><strong>${icon("arrow", { size: 17 })}${item.outcome}</strong></article>`).join("")}</div><div class="inline-cta"><div><h2>مسئلهٔ شما دقیقاً در این فهرست نیست؟</h2><p>رهجو بر اساس فرایند واقعی پیکربندی می‌شود، نه بر اساس یک قالب ثابت.</p></div><a data-link class="button button--primary" href="/contact">مسئله‌ام را بررسی کنید</a></div></div></section>`;
  return publicHero({ title: "رهجو برای چه کسب‌وکاری مناسب است؟", description: "اگر مشتری، درخواست، فایل، پرداخت و عملیات شما در ابزارهای جدا حرکت می‌کند، یکی از این سناریوها احتمالاً آشناست.", activePath: "/use-cases", content });
}

export function renderHowItWorksPage() {
  const steps = ["ورود مشتری از وب‌سایت، تماس، پیام‌رسان، معرفی یا اپراتور", "ساخت پروفایل شخص یا سازمان", "ثبت نیاز و تعامل اولیه", "ایجاد فرصت فروش در صورت نیاز", "انتخاب خدمت مناسب", "دریافت اطلاعات و مدارک", "تعیین قیمت یا پیشنهاد", "تأیید مشتری و پرداخت", "ورود درخواست به عملیات", "تخصیص کار به مسئول", "ثبت ارتباط و اطلاع وضعیت", "تحویل نتیجه", "ماندن سابقه در Account 360", "ایجاد پیگیری یا فروش مجدد"];
  const content = `
    <div class="public-page-actions"><a data-link class="button button--primary" href="/login">اجرای مسیر در دمو</a></div>
    </div></section><section class="public-section public-section--first"><div class="container how-steps">${steps.map((item, index) => `<article><b>${new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2 }).format(index + 1)}</b><p>${item}</p></article>`).join("")}</div></section><section class="public-section public-section--tint"><div class="container split-copy"><div><h2>در هر مرحله سه سؤال جواب دارد</h2><p>چه وضعیتی داریم؟ مسئول اقدام بعدی کیست؟ آخرین تغییر چه زمانی و چرا رخ داده است؟</p></div><ul class="big-checks"><li>${icon("check")} وضعیت روشن</li><li>${icon("users")} مسئول مشخص</li><li>${icon("timeline")} سابقهٔ قابل بازبینی</li></ul></div></section>`;
  return publicHero({ title: "رهجو چگونه کار می‌کند؟", description: "یک مسیر روشن و قابل‌پیگیری از ورود مشتری تا نتیجه و فروش مجدد.", activePath: "/how-it-works", content });
}

export function renderPilotPage() {
  const detailed = [
    ["شناخت فرایند موجود", "کانال‌های ورود، نقش‌ها، ابزارها، گلوگاه‌ها و معیار موفقیت را ثبت می‌کنیم."],
    ["تعریف مشتری و خدمات", "ساختار حساب، اشخاص تماس، خدمت، قیمت، مدارک و خروجی روشن می‌شود."],
    ["طراحی جریان‌های اصلی", "وضعیت‌ها، مسئول‌ها، SLA، کارها و تأییدهای لازم تعیین می‌شوند."],
    ["پیکربندی و ورود داده", "CRM، فرم‌ها، نقش‌ها و دادهٔ اولیه در محیط کنترل‌شده آماده می‌شوند."],
    ["آموزش و پایلوت", "تیم یک سناریوی واقعی را اجرا می‌کند و نقاط نیازمند اصلاح ثبت می‌شوند."],
    ["استقرار", "نسخهٔ پذیرفته‌شده، معیارهای پایش و برنامهٔ توسعه فعال می‌شوند."]
  ];
  const content = `
    <div class="public-page-actions"><a data-link class="button button--primary" href="/contact">درخواست بررسی کسب‌وکار</a></div>
    </div></section><section class="public-section public-section--first"><div class="container pilot-timeline">${detailed.map(([title, desc], index) => `<article><b>${new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2 }).format(index + 1)}</b><div><h2>${title}</h2><p>${desc}</p></div></article>`).join("")}</div></section><section class="public-section public-section--tint"><div class="container split-copy"><div><h2>هستهٔ استاندارد، پیکربندی اختصاصی</h2><p>رهجو یک نرم‌افزار بستهٔ یکسان برای همه نیست. موجودیت‌ها و کنترل‌های پایه ثابت‌اند؛ خدمات، فرم‌ها، نقش‌ها و جریان اجرا بر اساس کسب‌وکار تنظیم می‌شوند.</p></div><div class="scope-pair"><div><strong>ثابت</strong><span>مشتری، درخواست، کار، پرداخت، نتیجه، تاریخچه</span></div><div><strong>قابل‌پیکربندی</strong><span>خدمت، فرم، مرحله، نقش، SLA، پیام، تأیید</span></div></div></div></section>`;
  return publicHero({ title: "راه‌اندازی رهجو برای کسب‌وکار شما", description: "از شناخت عملیات موجود شروع می‌کنیم، یک مسیر محدود را پایلوت می‌کنیم و فقط پس از پذیرش تیم گسترش می‌دهیم.", activePath: "/pilot", content });
}

export function renderTrustPage() {
  const controls = [["users", "سطح دسترسی", "هر نقش فقط اطلاعات و عملیات لازم را می‌بیند."], ["check", "تأیید انسانی", "تخفیف، استرداد یا اقدام حساس در نقطهٔ لازم متوقف می‌شود."], ["timeline", "ثبت تغییرات", "مشخص است چه کسی، چه زمانی و چه چیزی را تغییر داده است."], ["shield", "حفاظت اطلاعات", "احراز هویت، مجوز، نشست، فایل و Secret مرزهای جدا دارند."], ["audit", "قابلیت بازبینی", "رخدادهای مهم به رکورد و مسئول درست متصل‌اند."], ["document", "کیفیت داده", "نقص، رکورد تکراری و ارتباط گمشده به کار اصلاحی تبدیل می‌شوند."]];
  const content = `</div></section><section class="public-section public-section--first"><div class="container control-grid">${controls.map(([glyph, title, desc]) => `<article><span>${icon(glyph)}</span><h2>${title}</h2><p>${desc}</p></article>`).join("")}</div></section><section class="public-section public-section--tint"><div class="container split-copy"><div><h2>کنترل جایی ظاهر می‌شود که لازم است</h2><p>کار روزمره نباید با هشدارهای تکراری کند شود. رهجو کنترل را در نقاط مهم—تغییر حساس، پرداخت، تأیید و تحویل—اعمال و در تاریخچه ثبت می‌کند.</p></div><a data-link class="button button--outline" href="/login">دیدن ممیزی در دمو</a></div></section>`;
  return publicHero({ title: "اعتماد از مسئولیت روشن و سابقهٔ قابل بازبینی می‌آید", description: "زبان ساده، دسترسی متناسب، تأیید انسانی در نقطهٔ لازم و تاریخچه‌ای که پاسخ می‌دهد چه اتفاقی افتاد.", activePath: "/trust", content });
}

export function renderAboutPage() {
  const content = `</div></section><section class="public-section public-section--first"><div class="container editorial-copy"><h2>رهجو چه مسئله‌ای را حل می‌کند؟</h2><p>بسیاری از کسب‌وکارها پیش از نیاز به فناوری پیشرفته، به یک سیستم منظم برای مشتری، فروش، خدمت، درخواست، پرداخت و عملیات نیاز دارند. رهجو همان زیرساخت را می‌سازد.</p><h2>رویکرد توسعه</h2><p>محصول از فرایند واقعی شروع می‌شود؛ ماژولار و قابل‌پیکربندی می‌ماند و بدون وابستگی به هوش مصنوعی ارزش کامل ارائه می‌دهد.</p><blockquote>اول نظم عملیاتی. بعد اتوماسیون. بعد اتصال. بعد هوشمندی.</blockquote><h2>توسعهٔ تدریجی</h2><p>وقتی دادهٔ عملیاتی درست و ساخت‌یافته شکل گرفت، اتصال‌ها و قابلیت‌های آینده می‌توانند روی همان هسته اضافه شوند؛ بدون شروع دوباره از صفر.</p><div class="inline-cta"><div><h2>برای شناختن رهجو از خود محصول شروع کنید.</h2><p>سناریوی کامل مشتری تا نتیجه را در دموی تعاملی ببینید.</p></div><a data-link class="button button--primary" href="/login">شروع دمو</a></div></div></section>`;
  return publicHero({ title: "رهجو برای فرایند واقعی کسب‌وکار ساخته شده است", description: "نه برای نمایش معماری پیچیده؛ برای اینکه مشتری، درخواست و کار روزانه گم نشوند.", activePath: "/about", content });
}

export function renderContactPage() {
  const content = `</div></section><section class="public-section public-section--first"><div class="container contact-layout"><aside><h2>در جلسهٔ اول چه بررسی می‌شود؟</h2><ul class="check-list"><li>${icon("check", { size: 17 })} مسیر ورود و ثبت مشتری</li><li>${icon("check", { size: 17 })} خدمات، مدارک و قیمت‌گذاری</li><li>${icon("check", { size: 17 })} مسئولیت‌ها و گردش کار</li><li>${icon("check", { size: 17 })} نقطهٔ مناسب برای پایلوت</li></ul><p>این فرم در نسخهٔ نمایشی چیزی ارسال نمی‌کند و فقط در همین مرورگر ثبت می‌شود.</p></aside><form id="contact-form" class="phase-form"><div class="form-grid"><label><span>نام *</span><input name="name" required /></label><label><span>نام مجموعه *</span><input name="organization" required /></label><label><span>سمت</span><input name="role" /></label><label><span>شماره تماس *</span><input name="phone" inputmode="tel" required /></label><label><span>ایمیل</span><input name="email" type="email" /></label><label><span>صنعت</span><input name="industry" /></label><label><span>اندازهٔ تقریبی کسب‌وکار</span><select name="size"><option>کمتر از ۱۰ نفر</option><option>۱۰ تا ۵۰ نفر</option><option>۵۱ تا ۲۰۰ نفر</option><option>بیش از ۲۰۰ نفر</option></select></label><label><span>مشتری/درخواست ماهانه</span><select name="volume"><option>کمتر از ۱۰۰</option><option>۱۰۰ تا ۵۰۰</option><option>۵۰۰ تا ۲۰۰۰</option><option>بیش از ۲۰۰۰</option></select></label><label class="form-grid__wide"><span>مسئله یا نیاز *</span><textarea name="need" rows="4" required></textarea></label><label class="form-grid__wide"><span>توضیح تکمیلی</span><textarea name="details" rows="3"></textarea></label></div><div id="contact-result" class="form-result" role="status" hidden></div><button class="button button--primary button--large" type="submit">ثبت درخواست بررسی</button></form></div></section>`;
  return publicHero({ title: "از مسئلهٔ واقعی کسب‌وکار شما شروع کنیم", description: "فرایند موجود را مرور می‌کنیم، شکاف اصلی را مشخص می‌کنیم و یک دامنهٔ کوچک و قابل‌سنجش برای پایلوت پیشنهاد می‌دهیم.", activePath: "/contact", content });
}

export function renderTrackRequestPage() {
  const content = `</div></section><section class="public-section public-section--first"><div class="container track-layout"><form id="track-form" class="track-form"><label><span>کد پیگیری</span><input name="reference" placeholder="مثلاً رهـ-۱۴۰۵-۰۲۸۴" required /></label><button class="button button--primary" type="submit">مشاهدهٔ وضعیت</button></form><div id="track-result" class="track-result"><div class="empty-state">${icon("search", { size: 28 })}<strong>کد پیگیری را وارد کنید</strong><p>در نسخهٔ نمایشی می‌توانید از کد رهـ-۱۴۰۵-۰۲۸۴ استفاده کنید.</p></div></div></div></section>`;
  return publicHero({ title: "پیگیری درخواست خدمت", description: "وضعیت جاری، اقدام موردنیاز و آخرین تغییر درخواست را با کد پیگیری ببینید.", activePath: "/track-request", content });
}

export function renderPrivacyPage() {
  const content = `</div></section><section class="public-section public-section--first"><div class="container editorial-copy"><h2>نسخهٔ نمایشی</h2><p>تمام داده‌ها و عملیات این نسخه ساختگی‌اند و نباید اطلاعات شخصی یا محرمانهٔ واقعی در آن وارد شود.</p><h2>نسخهٔ عملیاتی آینده</h2><p>احراز هویت، مجوز، نقش، نشست، ذخیره‌سازی، ممیزی، دسترسی فایل، Secret و اطلاعات اتصال باید مرزهای مستقل داشته باشند. هیچ کلید یا Credential واقعی در Front-end قرار نمی‌گیرد.</p><h2>حداقل‌سازی</h2><p>هر فرم باید فقط اطلاعات لازم برای خدمت و مرحلهٔ مربوط را دریافت کند و دورهٔ نگه‌داری آن روشن باشد.</p></div></section>`;
  return publicHero({ title: "حریم خصوصی و اصول داده", description: "رهجو اطلاعات را در ارتباط با مشتری، خدمت و هدف عملیاتی روشن نگه می‌دارد.", activePath: "/privacy", content });
}

export function renderTermsPage() {
  const content = `</div></section><section class="public-section public-section--first"><div class="container editorial-copy"><h2>محیط نمایشی</h2><p>این نسخه برای نمایش تجربهٔ محصول است و هیچ پرداخت، پیام، فایل یا اتصال خارجی واقعی ایجاد نمی‌کند.</p><h2>داده و دسترسی</h2><p>از ورود دادهٔ واقعی، شخصی، مالی یا محرمانه خودداری کنید. اطلاعات واردشده فقط در حافظهٔ محلی مرورگر همان دستگاه نگه‌داری می‌شود.</p><h2>ادعاهای محصول</h2><p>اعداد، نام‌ها، زمان‌ها و وضعیت‌های نمایش‌داده‌شده نمونه‌اند و نباید به‌عنوان مشتری، عملکرد یا تعهد عملیاتی واقعی تفسیر شوند.</p></div></section>`;
  return publicHero({ title: "شرایط استفاده از دموی رهجو", description: "مرز این نسخه روشن است: یک نمونهٔ تعاملی با داده و عملیات ساختگی.", activePath: "/terms", content });
}

export function renderNotFoundPage() {
  return siteShell({ activePath: "", content: `<section class="not-found"><div class="container"><span>۴۰۴</span><h1>این مسیر در رهجو پیدا نشد.</h1><p>از صفحهٔ اصلی یا دموی تعاملی ادامه دهید.</p><div class="button-row"><a data-link class="button button--primary" href="/">بازگشت به خانه</a><a data-link class="button button--outline" href="/login">شروع دمو</a></div></div></section>` });
}

export function mountPublicPage() {
  document.querySelectorAll("[data-service-select]").forEach((link) => link.addEventListener("click", () => {
    const serviceId = link.getAttribute("data-service-select") ?? serviceCatalog[0].id;
    saveRequestDraft({ step: 0, payload: { serviceId, organization: "", contact: "", role: "", phone: "", email: "", industry: "", need: "", channel: "وب‌سایت", documentsReady: false }, referenceId: null, requestId: null });
  }));
  document.querySelectorAll("[data-service-filter]").forEach((button) => button.addEventListener("click", () => {
    const category = button.getAttribute("data-service-filter") ?? "همه";
    document.querySelectorAll("[data-service-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    document.querySelectorAll("[data-service-card]").forEach((card) => card.toggleAttribute("hidden", category !== "همه" && card.getAttribute("data-category") !== category));
  }));

  document.querySelectorAll("[data-service-expand]").forEach((button) => button.addEventListener("click", () => {
    const id = button.getAttribute("data-service-expand");
    const detail = document.querySelector(`[data-service-requirements="${id}"]`);
    if (detail instanceof HTMLElement) detail.hidden = !detail.hidden;
  }));

  const form = document.querySelector("#contact-form");
  if (form instanceof HTMLFormElement) form.addEventListener("submit", (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    addContactSubmission(payload);
    const result = document.querySelector("#contact-result");
    if (result instanceof HTMLElement) {
      result.hidden = false;
      result.innerHTML = `${icon("check", { size: 18 })}<div><strong>درخواست شما در دموی محلی ثبت شد.</strong><span>هیچ اطلاعاتی از این مرورگر ارسال نشده است.</span></div>`;
    }
    form.reset();
  });

  const trackForm = document.querySelector("#track-form");
  if (trackForm instanceof HTMLFormElement) trackForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = trackForm.elements.namedItem("reference");
    const query = input instanceof HTMLInputElement ? input.value.trim().replace(/\s/g, "") : "";
    const request = readDemoState().requests.find((item) => item.referenceId.replace(/\s/g, "") === query);
    const result = document.querySelector("#track-result");
    if (!(result instanceof HTMLElement)) return;
    result.innerHTML = request ? `<article class="tracked-request"><header><div><small>کد پیگیری</small><strong>${request.referenceId}</strong></div><span class="status status--progress">${request.status}</span></header><h2>${request.title}</h2><dl><div><dt>مرحلهٔ جاری</dt><dd>${request.stage}</dd></div><div><dt>اقدام بعدی</dt><dd>${request.nextAction}</dd></div><div><dt>تاریخ هدف</dt><dd>${request.targetDate}</dd></div></dl><a data-link class="button button--outline" href="/login">مشاهده در دموی کامل</a></article>` : `<div class="empty-state empty-state--error">${icon("search", { size: 28 })}<strong>درخواستی با این کد پیدا نشد.</strong><p>قالب کد را بررسی کنید یا از کد نمونه استفاده کنید.</p></div>`;
  });
}
