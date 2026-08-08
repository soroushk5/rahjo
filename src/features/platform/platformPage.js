import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";
import { platformLayers } from "../../data/siteContent.js";

/** @param {(typeof platformLayers)[number]} layer @param {number} index */
function layerMarkup(layer, index) {
  return `
    <article class="platform-layer">
      <div class="platform-layer__index">${String(index + 1).padStart(2, "0")}</div>
      <span class="platform-layer__icon">${icon(layer.icon, { size: 25 })}</span>
      <div class="platform-layer__copy">
        <small>${layer.label}</small>
        <h2>${layer.title}</h2>
        <p>${layer.text}</p>
      </div>
      <ul class="platform-layer__checks">
        ${layer.checks.map((/** @type {string} */ check) => `<li>${icon("check", { size: 15 })}${check}</li>`).join("")}
      </ul>
    </article>`;
}

export function renderPlatformPage() {
  const layers = platformLayers.map(layerMarkup).join("");

  const content = `
    <section class="page-hero page-hero--architecture">
      <div class="container split-heading">
        <div>
          <p class="eyebrow">PLATFORM ARCHITECTURE</p>
          <h1>کنترل باید میان منبع و مصرف قرار بگیرد.</h1>
        </div>
        <p>
          معماری رهجو تأمین‌کننده داده را از تجربه مشتری جدا می‌کند و سیاست دسترسی،
          نرمال‌سازی، تحویل و ممیزی را به لایه‌های مستقل تبدیل می‌کند.
        </p>
      </div>
    </section>

    <section class="container architecture-flow" aria-label="جریان معماری رهجو">
      <div class="flow-stage"><span>منابع داده</span><strong>ناهمگون و حساس</strong></div>
      <div class="flow-arrow">${icon("arrow", { size: 22 })}</div>
      <div class="flow-stage flow-stage--core"><span>لایه کنترل رهجو</span><strong>Policy · Gateway · Audit</strong></div>
      <div class="flow-arrow">${icon("arrow", { size: 22 })}</div>
      <div class="flow-stage"><span>مصرف سازمانی</span><strong>API · Workflow · Message</strong></div>
    </section>

    <section class="container platform-stack">${layers}</section>

    <section class="container principle-grid principle-grid--four">
      <article>
        <span>${icon("link")}</span>
        <h3>Adapter-first</h3>
        <p>تغییر منبع، قرارداد محصول و رابط مشتری را نمی‌شکند.</p>
      </article>
      <article>
        <span>${icon("lock")}</span>
        <h3>Least privilege</h3>
        <p>هر مشتری فقط حداقل فیلد لازم برای هدف تأییدشده را می‌بیند.</p>
      </article>
      <article>
        <span>${icon("eye")}</span>
        <h3>Human-readable</h3>
        <p>وضعیت، محدودیت و خطا برای اپراتور و توسعه‌دهنده قابل فهم است.</p>
      </article>
      <article>
        <span>${icon("audit")}</span>
        <h3>Audit by design</h3>
        <p>ممیزی بخشی از جریان است، نه گزارشی که بعداً ساخته شود.</p>
      </article>
    </section>`;

  return siteShell({ content, activePath: "/platform" });
}
