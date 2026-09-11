// @ts-nocheck
import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";
import { runtimeData } from "../../services/runtimeDataFacade.js";

function hero({ activePath, eyebrow, title, description, actions = "" }) {
  return `
    <section class="w14-subhero">
      <div class="container w14-subhero__inner">
        <span class="w14-eyebrow">${eyebrow}</span>
        <h1>${title}</h1>
        <p>${description}</p>
        ${actions ? `<div class="button-row">${actions}</div>` : ""}
      </div>
    </section>`;
}

function workspaceAction(label = "ورود به محیط رهجو") {
  return `<a data-link class="button button--primary button--large" href="/cases/new">${label} ${icon("arrow")}</a>`;
}

export function renderAlignedContactPage() {
  const serverMode = runtimeData.read().mode === "server";
  const modeNote = serverMode
    ? "در نسخهٔ زنده، درخواست عملیاتی از مسیر امن رهجو ثبت می‌شود و هیچ فرم عمومی با دادهٔ مرورگر جایگزین آن نمی‌شود."
    : "در Golden Demo، داده‌ها ساختگی و مرورگرمحلی‌اند و برای ارزیابی تجربهٔ محصول استفاده می‌شوند.";
  return siteShell({
    activePath: "/contact",
    content: `${hero({
      activePath: "/contact",
      eyebrow: "شروع همکاری",
      title: "از یک جریان واقعی شروع کنیم، نه از فهرست قابلیت‌ها.",
      description: "برای شروع، یک مسیر مشخص را انتخاب می‌کنیم: مشتری از کجا وارد می‌شود، چه پرونده‌ای ساخته می‌شود، کجا تصمیم انسانی لازم است و نتیجه کجا ثبت می‌شود.",
      actions: `${workspaceAction("شروع ثبت پرونده")}<a data-link class="button button--outline button--large" href="/how-it-works">مرور مسیر رهجو</a>`
    })}
      <section class="w14-page-section"><div class="container w14-start-grid">
        <article><b>01</b><div><h2>مسیر فعلی</h2><p>یک سناریوی واقعی مشتری را از ورودی تا نتیجه روی میز می‌گذاریم؛ نه نمودار سازمانی و نه لیست نرم‌افزارها.</p></div></article>
        <article><b>02</b><div><h2>نقاط اصطکاک</h2><p>دوباره‌کاری، گم‌شدن پیگیری، شکست handoff، نبود مالک و جاهایی که سابقهٔ مشتری تکه‌تکه می‌شود مشخص می‌شوند.</p></div></article>
        <article><b>03</b><div><h2>پایلوت محدود</h2><p>یک flow با Account/Case/Service/Approval/Outcome تعریف می‌شود و قبل از گسترش با داده و کاربر واقعی ارزیابی می‌شود.</p></div></article>
      </div></section>
      <section class="w14-page-section w14-page-section--tint"><div class="container w14-safety-note">${icon("shield", { size: 24 })}<div><h2>مرز داده روشن است</h2><p>${modeNote}</p></div></div></section>`
  });
}

export function renderAlignedPilotPage() {
  return siteShell({
    activePath: "/pilot",
    content: `${hero({
      activePath: "/pilot",
      eyebrow: "راه‌اندازی",
      title: "پایلوت رهجو باید یک حلقهٔ کامل را ثابت کند.",
      description: "موفقیت پایلوت با تعداد صفحه یا تنظیمات سنجیده نمی‌شود؛ با این سنجیده می‌شود که یک ورودی واقعی بدون دوباره‌کاری تا نتیجه و سابقهٔ قابل ممیزی حرکت کند.",
      actions: `${workspaceAction("شروع جریان عملیاتی")}<a data-link class="button button--outline button--large" href="/product">ساختار محصول</a>`
    })}
      <section class="w14-page-section"><div class="container"><ol class="w14-pilot-steps">
        <li><b>01</b><div><h3>Scope Lock</h3><p>یک نوع مشتری، یک مسیر ورودی، یک خدمت و یک outcome مشخص.</p><small>خروجی: تعریف acceptance و ownerها</small></div></li>
        <li><b>02</b><div><h3>Data & Identity</h3><p>Account، Contact، شناسه‌ها، normalization فارسی و قواعد duplicate روشن می‌شوند.</p><small>خروجی: سابقهٔ تجاری بدون هویت تکراری</small></div></li>
        <li><b>03</b><div><h3>Operational Loop</h3><p>Case، Service، Approval، Action، Receipt و Outcome روی همان flow متصل می‌شوند.</p><small>خروجی: مسیر قطعی و قابل اجرا بدون AI</small></div></li>
        <li><b>04</b><div><h3>Acceptance</h3><p>امنیت workspace، reload، failure state، audit و بازیابی بررسی می‌شوند.</p><small>خروجی: تصمیم evidence-based برای گسترش</small></div></li>
      </ol></div></section>
      <section class="w14-page-section w14-page-section--dark"><div class="container w14-split"><div><span class="w14-eyebrow">Gate پایلوت</span><h2>یک مشتری، یک Case، یک نتیجه؛ قابل بازسازی از ابتدا تا انتها.</h2></div><div><p>تا زمانی که ورودی، هویت، مجوز، تأیید، اجرا و outcome در یک زنجیرهٔ قابل ممیزی دیده نشوند، افزایش تعداد ماژول‌ها یا اتصال AI نشانهٔ موفقیت پایلوت نیست.</p></div></div></section>`
  });
}

export function renderAlignedTrustPage() {
  return siteShell({
    activePath: "/trust",
    content: `${hero({
      activePath: "/trust",
      eyebrow: "اعتماد و کنترل",
      title: "اعتماد از محدودکردن اختیار سیستم شروع می‌شود.",
      description: "رهجو وضعیت، workspace، actor و مسیر تغییر را صریح نگه می‌دارد. تصمیم‌های حساس پشت تأیید انسانی می‌مانند و شکست Server mode با دادهٔ Demo پنهان نمی‌شود.",
      actions: `<a data-link class="button button--primary button--large" href="/login">ورود امن به رهجو ${icon("arrow")}</a><a data-link class="button button--outline button--large" href="/how-it-works">نحوهٔ کار</a>`
    })}
      <section class="w14-page-section"><div class="container w14-trust-grid">
        <article><span>${icon("shield")}</span><h3>Workspace isolation</h3><p>scope فضای کاری در سمت سرور مشتق می‌شود و client نمی‌تواند با شناسه یا header دلخواه آن را عوض کند.</p></article>
        <article><span>${icon("users")}</span><h3>Human approval</h3><p>تعهد و اقدام حساس پیش از اجرا یک نقطهٔ تصمیم انسانی قابل ثبت دارد.</p></article>
        <article><span>${icon("signal")}</span><h3>Audit & provenance</h3><p>رویداد، منبع و correlation برای بازسازی تغییرهای مهم حفظ می‌شوند.</p></article>
        <article><span>${icon("workflow")}</span><h3>Fail closed</h3><p>اگر Server mode در دسترس نباشد، Golden Demo یا localStorage به‌عنوان موفقیت واقعی نمایش داده نمی‌شود.</p></article>
      </div></section>
      <section class="w14-page-section w14-page-section--tint"><div class="container w14-split"><div><span class="w14-eyebrow">وضعیت فعلی</span><h2>Live است، اما هنوز production-ready کامل اعلام نشده.</h2></div><div><p>زیرساخت server-backed، session امن، PostgreSQL، مسیر no-LLM و تست دو Workspace زنده‌اند. استقرار نهایی Relaticle/MCP و restore کامل دادهٔ production هنوز gateهای باز هستند؛ بنابراین سایت نباید آن‌ها را انجام‌شده معرفی کند.</p></div></div></section>`
  });
}

export function renderAlignedAboutPage() {
  return siteShell({
    activePath: "/about",
    content: `${hero({
      activePath: "/about",
      eyebrow: "دربارهٔ رهجو",
      title: "رهجو از یک مسئلهٔ ساده شروع می‌کند: کار مشتری نباید بین ابزارها گم شود.",
      description: "هدف رهجو ساختن یک حافظهٔ تجاری و عملیاتی مشترک است؛ جایی که تیم بداند مشتری کیست، چه چیزی خواسته، چه تصمیمی گرفته شده، چه اقدامی انجام شده و نتیجه چه بوده است.",
      actions: `<a data-link class="button button--primary button--large" href="/product">دیدن محصول ${icon("arrow")}</a><a data-link class="button button--outline button--large" href="/contact">شروع از یک جریان واقعی</a>`
    })}
      <section class="w14-page-section"><div class="container w14-principles-grid">
        <article><b>01</b><h3>عملیات قبل از AI</h3><p>اگر هویت، داده و workflow درست نباشند، هوشمندی فقط ابهام را سریع‌تر می‌کند.</p></article>
        <article><b>02</b><h3>نتیجه قبل از صفحه</h3><p>ارزش محصول در بستن حلقهٔ مشتری تا outcome است، نه تعداد dashboardها و فرم‌ها.</p></article>
        <article><b>03</b><h3>شواهد قبل از ادعا</h3><p>قابلیت live، امنیت، backup و اتصال‌ها فقط وقتی claim می‌شوند که acceptance evidence داشته باشند.</p></article>
        <article><b>04</b><h3>هستهٔ قابل تعویض</h3><p>Frontend با قرارداد Rahjo-native کار می‌کند تا CRM، provider یا مدل آینده بدون بازسازی تجربه جایگزین شود.</p></article>
      </div></section>`
  });
}

export function renderAlignedTrackRequestPage() {
  const serverMode = runtimeData.read().mode === "server";
  return siteShell({
    activePath: "/track-request",
    content: `${hero({
      activePath: "/track-request",
      eyebrow: "پیگیری پرونده",
      title: serverMode ? "وضعیت پرونده از منبع سرور خوانده می‌شود، نه از حافظهٔ مرورگر." : "پیگیری در Golden Demo فقط با دادهٔ ساختگی انجام می‌شود.",
      description: serverMode
        ? "در نسخهٔ فعلی، مشاهدهٔ وضعیت Case داخل محیط امن workspace انجام می‌شود. صفحهٔ عمومی بدون احراز هویت نباید رکورد مشتری یا Case را افشا کند."
        : "این محیط برای نمایش جریان محصول است و کدهای پیگیری آن به پروندهٔ واقعی متصل نیستند.",
      actions: serverMode
        ? `<a data-link class="button button--primary button--large" href="/login">ورود امن برای پیگیری ${icon("arrow")}</a><a data-link class="button button--outline button--large" href="/trust">اعتماد و کنترل</a>`
        : `<a data-link class="button button--primary button--large" href="/login">ورود به Golden Demo ${icon("arrow")}</a>`
    })}
      <section class="w14-page-section"><div class="container w14-safety-note">${icon("shield", { size: 24 })}<div><h2>عدم افشای وضعیت با شناسهٔ قابل حدس</h2><p>تا زمانی که قرارداد امن public tracking طراحی و تست نشود، رهجو Caseهای واقعی را با یک فرم عمومی و کد ساده در اختیار مرورگر ناشناس قرار نمی‌دهد.</p></div></div></section>`
  });
}
