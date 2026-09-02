import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";
import { publicJourneySteps } from "../../data/publicOperationalContent.js";

function journeyCards() {
  return publicJourneySteps.map((step) => `
    <article class="public-journey-card">
      <div class="public-journey-card__index">${step.index}</div>
      <span class="public-journey-card__icon">${icon(step.icon, { size: 21 })}</span>
      <small>${step.title}</small>
      <h3>${step.label}</h3>
      <p>${step.text}</p>
    </article>`).join("");
}

function systemMap() {
  const nodes = [
    ["external", "Website / Channel", "Acquisition + source"],
    ["users", "Lead / Account", "Commercial identity"],
    ["requests", "Opportunity / Case", "Need + ownership"],
    ["api", "Service", "Qualification + status"],
    ["shield", "Approval", "Human / rule gate"],
    ["workflow", "Action", "Task / execution"],
    ["check", "Outcome", "Result / learning"],
    ["dashboard", "Dashboard", "Shared visibility"]
  ];
  return `<div class="public-system-map">${nodes.map(([iconName, title, meta], index) => `
    <div class="public-system-node"><span>${icon(iconName, { size: 19 })}</span><div><strong>${title}</strong><small>${meta}</small></div></div>${index < nodes.length - 1 ? '<i class="public-system-arrow">→</i>' : ""}`).join("")}</div>`;
}

export function renderPresentationMapPage() {
  const content = `
    <section class="public-page-hero public-page-hero--journey">
      <div class="container public-page-hero__grid">
        <div><span class="public-kicker"><i></i>END-TO-END OPERATING FLOW</span><h1>Context باید از ورودی تا نتیجه زنده بماند.</h1></div>
        <div><p>رهجو یک مسیر مرجع می‌سازد که Website، CRM، Case، سرویس، Gate، Action، Outcome و Dashboard را به هم وصل می‌کند. هدف نهایی این است که re-entry دستی و حافظه‌های جدا کم شوند.</p><div class="public-page-hero__actions"><a data-link class="button button--primary" href="/login">دیدن جریان در Workspace</a><a data-link class="button button--secondary" href="/platform">معماری محصول</a></div></div>
      </div>
    </section>

    <section class="public-section public-section--system-map">
      <div class="container">
        <header class="public-section__head"><div><span>مسیر مرجع Phase 1</span><h2>Visitor → Outcome → Dashboard</h2></div><p>Think Room در آینده همین مسیر را می‌خواند؛ نه اینکه برای Context، مشتری یا Outcome یک سیستم موازی بسازد.</p></header>
        ${systemMap()}
      </div>
    </section>

    <section class="public-section">
      <div class="container">
        <header class="public-section__head"><div><span>هشت مرحله</span><h2>هر مرحله owner، state و خروجی قابل ردیابی دارد.</h2></div><p>جریان production نهایی هنوز به current systems، integration contract و pilot inputs وابسته است؛ این صفحه contract تجربه و sequencing را نشان می‌دهد.</p></header>
        <div class="public-journey-grid">${journeyCards()}</div>
      </div>
    </section>

    <section class="public-section public-section--muted">
      <div class="container public-two-column">
        <article class="public-story-card">
          <span>${icon("external", { size: 22 })}</span><small>وب‌سایت</small><h2>Website باید intake surface باشد، نه جزیره محتوا.</h2><p>هر Lead/RFQ آینده باید source و context خود را تا Account/Case حفظ کند. اتصال واقعی هنوز تا قفل‌شدن integration contract و SOR production-gated است.</p><a data-link class="button button--secondary" href="/trust">دیدن مرز کنترل</a>
        </article>
        <article class="public-story-card public-story-card--dark">
          <span>${icon("spark", { size: 22 })}</span><small>هوشمندی آینده</small><h2>Decision Assistant روی Outcome واقعی ساخته می‌شود.</h2><p>Case، Decision، Approval، Action و Outcome از امروز در مدل در نظر گرفته می‌شوند تا فاز بعد به migration معماری بزرگ نیاز نداشته باشد.</p><a data-link class="button button--light" href="/login">دیدن Think Room دمو</a>
        </article>
      </div>
    </section>`;

  return siteShell({ content, activePath: "/map" });
}

export function mountPresentationMapPage() {}
