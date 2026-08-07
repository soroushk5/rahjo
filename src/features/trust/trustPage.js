import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";

const gates = Object.freeze([
  { id: "source", title: "منبع و قرارداد", text: "مالک داده، قرارداد فعال و حق پردازش یا عرضه روشن باشد.", icon: "database" },
  { id: "customer", title: "مشتری واجد شرایط", text: "نوع سازمان، نقش کاربر و کاربرد مجاز تعریف شده باشد.", icon: "users" },
  { id: "purpose", title: "هدف و رضایت", text: "هدف مصرف، مبنای رضایت و حداقل فیلد لازم ثبت شود.", icon: "legal" },
  { id: "security", title: "امنیت و دسترسی", text: "احراز کلاینت، سهمیه، Masking و جداسازی محیط اجرا شود.", icon: "lock" },
  { id: "retention", title: "نگهداشت و حذف", text: "دوره نگهداشت، حذف و ممنوعیت ثبت داده حساس در لاگ مشخص باشد.", icon: "timeline" },
  { id: "incident", title: "SLA و رخداد", text: "مالک خطا، قطع امن، پاسخ‌گویی و Incident Response تعیین شود.", icon: "shield" }
]);

const completedGates = new Set();

function gateMarkup() {
  return gates.map((gate, index) => `
    <button class="access-gate-card access-gate-card--interactive" type="button" data-gate-id="${gate.id}" aria-pressed="${completedGates.has(gate.id)}">
      <span class="access-gate-card__index">${String(index + 1).padStart(2, "0")}</span>
      <span class="access-gate-card__icon">${icon(gate.icon, { size: 22 })}</span>
      <h3>${gate.title}</h3>
      <p>${gate.text}</p>
      <span class="access-gate-card__state">${completedGates.has(gate.id) ? `${icon("check", { size: 14 })} تکمیل در دمو` : "برای تکمیل انتخاب کنید"}</span>
    </button>`).join("");
}

function gateStatusMarkup() {
  const count = completedGates.size;
  const complete = count === gates.length;
  return `
    <div class="gate-simulator__status" data-complete="${complete}">
      <div><span>${icon(complete ? "check" : "shield", { size: 22 })}</span><div><small>Gate simulation</small><strong>${complete ? "شش کنترل دمو تکمیل شد" : `${count} از ${gates.length} کنترل تکمیل شده`}</strong></div></div>
      <p>${complete ? "در دمو می‌توان مسیر درخواست را ادامه داد؛ Production همچنان تا وجود مدارک واقعی و تأیید نهایی بسته می‌ماند." : "برای دیدن منطق تصمیم، کنترل‌ها را یکی‌یکی تکمیل کنید. این شبیه‌سازی هیچ مجوز واقعی ایجاد نمی‌کند."}</p>
      <div class="gate-simulator__bar"><span style="--progress:${Math.round((count / gates.length) * 100)}%"></span></div>
      <div class="gate-simulator__actions"><button id="reset-gate-simulator" class="button button--secondary" type="button" ${count ? "" : "disabled"}>بازنشانی</button><a data-link class="button button--primary" href="/request">ادامه به درخواست ${icon("arrow", { size: 15 })}</a></div>
    </div>`;
}

export function renderTrustPage() {
  const content = `
    <section class="page-hero trust-hero">
      <div class="container hero__grid">
        <div>
          <p class="eyebrow">CONTROLLED ACCESS</p>
          <h1>داده حساس قبل از API شدن باید شش پاسخ داشته باشد.</h1>
          <p>رهجو دسترسی را پیش‌فرض باز در نظر نمی‌گیرد. هر سرویس باید منبع، مشتری، هدف، کنترل امنیتی، دوره نگهداشت و مالک رخداد مشخص داشته باشد.</p>
          <div class="hero__actions"><a data-link class="button button--secondary" href="/platform">دیدن جایگاه Gate در معماری</a><a data-link class="button button--primary" href="/request">ساخت درخواست نمونه ${icon("arrow", { size: 15 })}</a></div>
        </div>
        <div class="trust-seal">${icon("lock", { size: 50 })}<strong>Access before response</strong><small>مجوز پیش از پاسخ</small></div>
      </div>
    </section>

    <section class="container trust-intro">
      <div><p class="eyebrow">دروازه عرضه</p><h2>هیچ اتصال واقعی با یک تیک کلی فعال نمی‌شود.</h2></div>
      <p>ارزیابی برای هر سرویس، هر مشتری و هر کاربرد جدا انجام می‌شود؛ بنابراین عبور یک محصول از ممیزی، مجوز عمومی برای کل سبد ایجاد نمی‌کند.</p>
    </section>

    <section class="container gate-simulator">
      <div class="gate-simulator__intro"><div><small>INTERACTIVE DEMO</small><h2>Gate را مرحله‌به‌مرحله شبیه‌سازی کنید</h2></div><p>هر کارت یک شرط مستقل است. در نسخه واقعی وضعیت این کارت‌ها از مدرک، قرارداد، سیاست و کنترل فنی تغذیه می‌شود.</p></div>
      <div id="access-gate-grid" class="access-gate-grid">${gateMarkup()}</div>
      <div id="gate-simulator-status">${gateStatusMarkup()}</div>
    </section>

    <section class="container transparency-grid transparency-grid--four">
      <article><span>${icon("eye")}</span><h3>حداقل نمایش</h3><p>فقط فیلد لازم برای هدف تأییدشده.</p></article>
      <article><span>${icon("lock")}</span><h3>تفکیک دسترسی</h3><p>سطح دسترسی بر اساس سازمان و نقش.</p></article>
      <article><span>${icon("audit")}</span><h3>رد ممیزی</h3><p>ثبت تصمیم دسترسی بدون انباشت داده اضافه.</p></article>
      <article><span>${icon("shield")}</span><h3>توقف امن</h3><p>نبود مدرک کافی به معنی عدم پاسخ است.</p></article>
    </section>`;

  return siteShell({ content, activePath: "/trust" });
}

/** @param {() => void} rerender */
export function mountTrustPage(rerender) {
  document.querySelectorAll("[data-gate-id]").forEach((card) => card.addEventListener("click", () => {
    const id = card.getAttribute("data-gate-id");
    if (!id) return;
    if (completedGates.has(id)) completedGates.delete(id); else completedGates.add(id);
    rerender();
  }));

  document.querySelector("#reset-gate-simulator")?.addEventListener("click", () => {
    completedGates.clear();
    rerender();
  });
}
