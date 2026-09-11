// @ts-nocheck
import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";

const journey = Object.freeze([
  ["ورودی", "نیاز از سایت، تماس یا کانال فروش وارد می‌شود", "users"],
  ["مشتری", "Account و Contact سابقهٔ مشترک می‌سازند", "identity"],
  ["فرصت / پرونده", "فروش یا درخواست خدمت با مالک و وضعیت روشن شکل می‌گیرد", "requests"],
  ["خدمت", "شرایط، مدارک و مسیر اجرای خدمت مشخص می‌شود", "settings"],
  ["تأیید", "تصمیم انسانی در نقاط حساس ثبت می‌شود", "shield"],
  ["اقدام", "اجرای کنترل‌شده با وضعیت و Receipt انجام می‌شود", "workflow"],
  ["نتیجه", "Outcome و اقدام بعدی به سابقهٔ مشتری برمی‌گردد", "check"]
]);

function pageHero({ label, title, description, primary = ["/contact", "شروع بررسی"], secondary = ["/login", "ورود"] }) {
  return `
    <section class="rv-page-hero">
      <div class="container rv-page-hero__inner">
        <p>${label}</p>
        <h1>${title}</h1>
        <span>${description}</span>
        <div class="button-row rv-page-hero__actions">
          <a data-link class="button button--primary button--large" href="${primary[0]}">${primary[1]} ${icon("arrow")}</a>
          <a data-link class="button button--outline button--large" href="${secondary[0]}">${secondary[1]}</a>
        </div>
      </div>
    </section>`;
}

function journeySpine({ compact = false } = {}) {
  return `
    <div class="rv-journey ${compact ? "rv-journey--compact" : ""}" aria-label="مسیر مشتری تا نتیجه">
      <div class="rv-journey__groups" aria-hidden="true">
        <span>حافظهٔ رابطه</span><span>فروش و خدمت</span><span>کنترل و شواهد</span>
      </div>
      <ol>${journey.map(([title, desc, glyph], index) => `
        <li>
          <b>0${index + 1}</b>
          <i>${icon(glyph, { size: 18 })}</i>
          <strong>${title}</strong>
          <small>${desc}</small>
        </li>`).join("")}</ol>
    </div>`;
}

function editorialHeader(label, title, text = "") {
  return `<header class="rv-section-head"><p>${label}</p><h2>${title}</h2>${text ? `<span>${text}</span>` : ""}</header>`;
}

export function renderAlignedProductPage() {
  const layers = [
    ["01", "حافظهٔ تجاری", "Account، Contact، Lead، Opportunity، Interaction و Task", "رابطهٔ مشتری قبل و بعد از هر پرونده حفظ می‌شود.", "users"],
    ["02", "پروندهٔ خدمت", "Case، Service، Document و Owner", "نیاز مشتری به یک واحد کار با وضعیت، مالک و تعهد بعدی تبدیل می‌شود.", "requests"],
    ["03", "اجرای کنترل‌شده", "Approval، Action، Run و Receipt", "تصمیم و اجرا از هم جدا نیستند و actor هر مرحله روشن می‌ماند.", "workflow"],
    ["04", "نتیجه و ممیزی", "Outcome، Audit و Provenance", "آنچه اتفاق افتاد به سابقهٔ مشتری برمی‌گردد و قابل بازسازی می‌ماند.", "signal"]
  ];
  return siteShell({
    activePath: "/product",
    content: `${pageHero({
      label: "محصول",
      title: "یک سیستم برای حافظهٔ مشتری و اجرای کار.",
      description: "رهجو CRM را از یک دفترچهٔ اطلاعات به ستون فقرات عملیات تبدیل می‌کند؛ از رابطهٔ مشتری تا Case، تصمیم، اجرا و Outcome.",
      secondary: ["/how-it-works", "دیدن نقشهٔ محصول"]
    })}
      <section class="rv-page-section">
        <div class="container rv-editorial-grid">
          <div>${editorialHeader("چهار لایهٔ عملیاتی", "همه‌چیز روی یک سابقهٔ مشترک حرکت می‌کند.", "هر لایه یک مسئولیت روشن دارد و handoff بین آن‌ها context را نمی‌شکند.")}</div>
          <div class="rv-layer-table">${layers.map(([index, title, objects, desc, glyph]) => `
            <article><b>${index}</b><span>${icon(glyph, { size: 20 })}</span><div><h3>${title}</h3><small>${objects}</small><p>${desc}</p></div></article>`).join("")}</div>
        </div>
      </section>
      <section class="rv-map-section rv-map-section--page"><div class="container">${editorialHeader("نقشهٔ مشترک", "همان objectها از ورودی تا نتیجه ادامه دارند.", "صفحهٔ عمومی و محیط عملیاتی دو روایت متفاوت از محصول نیستند.")}${journeySpine()}</div></section>
      <section class="rv-boundary-section"><div class="container rv-boundary-grid"><div><p>مرز هوشمندی</p><h2>AI کمک می‌کند؛ هستهٔ کار به آن وابسته نیست.</h2></div><div><p>جست‌وجو، مجوز، Case، Approval، اجرای قطعی، ممیزی و ثبت Outcome باید با خاموش بودن مدل‌ها کار کنند. قابلیت هوشمند می‌تواند پیشنهاد و تحلیل اضافه کند، اما تصمیم و تعهد قطعی در هستهٔ قابل کنترل می‌ماند.</p><a data-link class="text-link" href="/trust">اعتماد و کنترل ${icon("arrow", { size: 16 })}</a></div></div></section>`
  });
}

export function renderAlignedServicesPage() {
  const contract = [
    ["01", "ورودی و شرایط", "اطلاعات، مدارک، eligibility و پیش‌شرط‌ها قبل از شروع روشن‌اند."],
    ["02", "مالک و زمان", "مالک Case، وضعیت، SLA و اقدام بعدی در خود پرونده دیده می‌شوند."],
    ["03", "ریسک و تأیید", "نقاط حساس پیش از اجرا به Approval انسانی یا سطح دسترسی بالاتر می‌رسند."],
    ["04", "اجرا و شواهد", "هر Action به Run و Receipt ختم می‌شود؛ شکست و retry هم وضعیت صریح دارند."],
    ["05", "نتیجه", "Outcome نهایی به Account و Case برمی‌گردد و اقدام بعدی را مشخص می‌کند."]
  ];
  return siteShell({
    activePath: "/services",
    content: `${pageHero({
      label: "خدمات",
      title: "خدمت در رهجو یک قرارداد اجرایی است، نه یک صفحهٔ معرفی.",
      description: "هر خدمت باید بگوید چه چیزی لازم است، چه کسی مسئول است، کجا تصمیم انسانی لازم است و اجرای موفق چگونه اثبات می‌شود.",
      primary: ["/request-service", "ثبت درخواست"],
      secondary: ["/how-it-works", "مسیر اجرا"]
    })}
      <section class="rv-page-section"><div class="container rv-editorial-grid"><div>${editorialHeader("قرارداد خدمت", "قبل از اجرا، پنج چیز باید بدون ابهام روشن باشد.", "این قرارداد پایهٔ Case، کنترل اجرا و پذیرش نتیجه است.")}</div><ol class="rv-contract-list">${contract.map(([index, title, desc]) => `<li><b>${index}</b><div><h3>${title}</h3><p>${desc}</p></div></li>`).join("")}</ol></div></section>
      <section class="rv-map-section rv-map-section--page"><div class="container">${editorialHeader("از درخواست تا Outcome", "هر خدمت روی همان زنجیرهٔ مشتری اجرا می‌شود.")}${journeySpine({ compact: true })}</div></section>
      <section class="rv-page-section"><div class="container rv-inline-cta"><div><span>${icon("requests", { size: 22 })}</span><div><h2>هر درخواست، یک Case واقعی</h2><p>منبع، مشتری، خدمت، مالک، Approvalها، Actionها و نتیجه در یک پرونده باقی می‌مانند.</p></div></div><a data-link class="button button--primary" href="/request-service">شروع درخواست</a></div></section>`
  });
}

export function renderAlignedUseCasesPage() {
  const scenarios = [
    ["فروش خدماتی", "از Lead تا Case بدون دوباره‌کاری", "مشتری و Opportunity بعد از توافق از بین نمی‌روند؛ همان سابقه وارد اجرای خدمت می‌شود.", ["مالک و اقدام بعدی", "Opportunity مرتبط", "تبدیل به Case با حفظ منبع"], "reports"],
    ["عملیات چندمرحله‌ای", "کارهایی که تأیید، اجرا و تحویل دارند", "برای خدماتی که چند مسئول، چند مرحله و نقاط تصمیم انسانی دارند.", ["Approval مشخص", "Action و Run قابل پیگیری", "Receipt و Outcome"], "workflow"],
    ["خدمات مدرک‌محور", "پرونده‌ای که با فایل گم نمی‌شود", "مدرک بخشی از Case است و وضعیت آن به تصمیم، کار و نتیجه وصل می‌شود.", ["رابطه با مشتری و خدمت", "نسخه و وضعیت", "تاریخچهٔ قابل ممیزی"], "document"],
    ["مدیریت رابطه", "Account 360 که به کار روزانه وصل است", "برای تیمی که فقط اطلاعات تماس نمی‌خواهد و باید تعهدات باز، پرونده‌ها و Outcomeهای قبلی را هم ببیند.", ["Contact و Interaction", "Task و تعهد باز", "Outcomeهای قبلی"], "users"]
  ];
  return siteShell({
    activePath: "/use-cases",
    content: `${pageHero({
      label: "موارد استفاده",
      title: "برای جایی که فروش و ارائهٔ خدمت باید یک مسیر مشترک داشته باشند.",
      description: "اگر مشتری از چند کانال وارد می‌شود، handoff بین افراد می‌شکند یا بعد از فروش اجرای خدمت در ابزار دیگری ادامه پیدا می‌کند، رهجو همان شکاف را هدف می‌گیرد.",
      secondary: ["/product", "ساختار محصول"]
    })}
      <section class="rv-page-section"><div class="container">${editorialHeader("سناریوها", "چهار الگوی پرتکرار، یک ستون فقرات مشترک.")}<div class="rv-scenario-list">${scenarios.map(([label, title, desc, bullets, glyph], index) => `
        <article><b>0${index + 1}</b><span>${icon(glyph, { size: 21 })}</span><div><small>${label}</small><h3>${title}</h3><p>${desc}</p></div><ul>${bullets.map((item) => `<li>${item}</li>`).join("")}</ul></article>`).join("")}</div></div></section>
      <section class="rv-map-section rv-map-section--page"><div class="container">${editorialHeader("زنجیرهٔ مشترک", "سناریو عوض می‌شود؛ object model عوض نمی‌شود.")}${journeySpine({ compact: true })}</div></section>`
  });
}

export function renderAlignedHowItWorksPage() {
  const gates = [
    ["Context", "اطلاعات مرحلهٔ قبل همراه Case می‌ماند؛ کاربر دوباره همان واقعیت را وارد نمی‌کند.", "identity"],
    ["Permission", "Workspace، نقش و Approval مشخص می‌کنند چه کسی چه کاری می‌تواند انجام دهد.", "shield"],
    ["Evidence", "Action، Run، Receipt و Outcome مسیر اجرا را بعداً قابل بازسازی می‌کنند.", "signal"]
  ];
  return siteShell({
    activePath: "/how-it-works",
    content: `${pageHero({
      label: "نحوهٔ کار",
      title: "هر مرحله، context را به مرحلهٔ بعد تحویل می‌دهد.",
      description: "رهجو برای اضافه‌کردن یک فرم یا Dashboard دیگر ساخته نشده؛ هدف این است که ورودی، تصمیم، اجرا و نتیجه روی یک زنجیرهٔ قابل بازسازی حرکت کنند.",
      primary: ["/contact", "بررسی مسیر فعلی من"],
      secondary: ["/product", "ساختار محصول"]
    })}
      <section class="rv-map-section rv-map-section--page rv-map-section--primary"><div class="container">${editorialHeader("نقشهٔ عملیاتی", "از اولین تماس تا Outcome، یک spine مشترک.", "سه ناحیهٔ حافظهٔ رابطه، فروش و خدمت، و کنترل و شواهد روی یک مسیر به هم متصل‌اند.")}${journeySpine()}</div></section>
      <section class="rv-page-section"><div class="container rv-gate-layout"><div>${editorialHeader("سه گیت طراحی", "هر handoff باید context، permission و evidence را حفظ کند.")}</div><div class="rv-gate-list">${gates.map(([title, desc, glyph]) => `<article><span>${icon(glyph, { size: 21 })}</span><div><h3>${title}</h3><p>${desc}</p></div></article>`).join("")}</div></div></section>
      <section class="rv-final"><div class="container rv-final__inner"><div><p>Acceptance واقعی</p><h2>یک مشتری، یک Case، یک نتیجه؛ قابل بازسازی از ابتدا تا انتها.</h2><span>اگر این حلقه کار نکند، اضافه‌شدن ماژول یا AI موفقیت محسوب نمی‌شود.</span></div><div class="button-row"><a data-link class="button button--light button--large" href="/contact">شروع بررسی</a><a data-link class="button button--ghost-light button--large" href="/trust">اعتماد و کنترل</a></div></div></section>`
  });
}
