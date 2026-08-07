import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";

const gates = Object.freeze([
  { title: "منبع و قرارداد", text: "مالک داده، قرارداد فعال و حق پردازش یا عرضه روشن باشد.", icon: "database" },
  { title: "مشتری واجد شرایط", text: "نوع سازمان، نقش کاربر و کاربرد مجاز تعریف شده باشد.", icon: "users" },
  { title: "هدف و رضایت", text: "هدف مصرف، مبنای رضایت و حداقل فیلد لازم ثبت شود.", icon: "legal" },
  { title: "امنیت و دسترسی", text: "احراز کلاینت، سهمیه، Masking و جداسازی محیط اجرا شود.", icon: "lock" },
  { title: "نگهداشت و حذف", text: "دوره نگهداشت، حذف و ممنوعیت ثبت داده حساس در لاگ مشخص باشد.", icon: "timeline" },
  { title: "SLA و رخداد", text: "مالک خطا، قطع امن، پاسخ‌گویی و Incident Response تعیین شود.", icon: "shield" }
]);

export function renderTrustPage() {
  const gateMarkup = gates
    .map(
      (gate, index) => `
        <article class="access-gate-card">
          <span class="access-gate-card__index">${String(index + 1).padStart(2, "0")}</span>
          <span class="access-gate-card__icon">${icon(gate.icon, { size: 22 })}</span>
          <h3>${gate.title}</h3>
          <p>${gate.text}</p>
        </article>`
    )
    .join("");

  const content = `
    <section class="page-hero trust-hero">
      <div class="container hero__grid">
        <div>
          <p class="eyebrow">CONTROLLED ACCESS</p>
          <h1>داده حساس قبل از API شدن باید شش پاسخ داشته باشد.</h1>
          <p>
            رهجو دسترسی را پیش‌فرض باز در نظر نمی‌گیرد. هر سرویس باید منبع، مشتری،
            هدف، کنترل امنیتی، دوره نگهداشت و مالک رخداد مشخص داشته باشد.
          </p>
        </div>
        <div class="trust-seal">
          ${icon("lock", { size: 50 })}
          <strong>Access before response</strong>
          <small>مجوز پیش از پاسخ</small>
        </div>
      </div>
    </section>

    <section class="container trust-intro">
      <div>
        <p class="eyebrow">دروازه عرضه</p>
        <h2>هیچ اتصال واقعی با یک تیک کلی فعال نمی‌شود.</h2>
      </div>
      <p>
        ارزیابی برای هر سرویس، هر مشتری و هر کاربرد جدا انجام می‌شود؛
        بنابراین عبور یک محصول از ممیزی، مجوز عمومی برای کل سبد ایجاد نمی‌کند.
      </p>
    </section>

    <section class="container access-gate-grid">${gateMarkup}</section>

    <section class="container transparency-grid transparency-grid--four">
      <article><span>${icon("eye")}</span><h3>حداقل نمایش</h3><p>فقط فیلد لازم برای هدف تأییدشده.</p></article>
      <article><span>${icon("lock")}</span><h3>تفکیک دسترسی</h3><p>سطح دسترسی بر اساس سازمان و نقش.</p></article>
      <article><span>${icon("audit")}</span><h3>رد ممیزی</h3><p>ثبت تصمیم دسترسی بدون انباشت داده اضافه.</p></article>
      <article><span>${icon("shield")}</span><h3>توقف امن</h3><p>نبود مدرک کافی به معنی عدم پاسخ است.</p></article>
    </section>`;

  return siteShell({ content, activePath: "/trust" });
}
