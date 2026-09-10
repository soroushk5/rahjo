import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";
import { publicModules } from "../../data/publicOperationalContent.js";

const architectureLayers = Object.freeze([
  { index: "01", icon: "external", title: "Website / Channels", text: "سطح discovery و intake؛ منبع ورودی، context و attribution را حمل می‌کند و نباید رکورد را در یک فرم جدا نگه دارد.", output: "Lead / Request context" },
  { index: "02", icon: "users", title: "Commercial Memory", text: "Account، Contact، Lead، Opportunity، Case، Interaction، Task، Proposal و Outcome هسته حافظه تجاری مشترک‌اند.", output: "Shared identity & history" },
  { index: "03", icon: "api", title: "Service & API Layer", text: "Capability، eligibility، access request، approval، adapter، execution status و receipt برای سرویس‌های واجد شرایط مدیریت می‌شوند.", output: "Controlled service execution" },
  { index: "04", icon: "workflow", title: "Workflow & Action", text: "Rule، Task، Approval، Action، retry/failure و handoff انسانی عملیات را deterministic و قابل بازبینی نگه می‌دارند.", output: "Action / handoff / receipt" },
  { index: "05", icon: "audit", title: "Governance & Audit", text: "Actor، source، timestamp، permission scope، state، duplicate/missing/stale data و رخداد حساس ثبت می‌شوند.", output: "Traceability & data quality" },
  { index: "06", icon: "dashboard", title: "Dashboard", text: "نمای مدیریتی از همان objectها و eventهای مشترک ساخته می‌شود؛ نه از fixture یا silo مستقل در نسخه production آینده.", output: "Shared operational visibility" },
  { index: "07", icon: "spark", title: "Think Room — Future", text: "Context، Evidence، Decision و Recommendation بعداً روی همین حافظه و Outcome سوار می‌شوند؛ مدل AI dependency فاز اول نیست.", output: "Future intelligence layer" }
]);

function layerCards() {
  return architectureLayers.map((layer) => `
    <article class="public-architecture-card ${layer.index === "07" ? "public-architecture-card--future" : ""}">
      <div class="public-architecture-card__index">${layer.index}</div>
      <span>${icon(layer.icon, { size: 22 })}</span>
      <h3>${layer.title}</h3>
      <p>${layer.text}</p>
      <footer><small>خروجی</small><strong>${layer.output}</strong></footer>
    </article>`).join("");
}

function workspaceMap() {
  return publicModules.map((item) => `
    <a data-link href="${item.path}" class="public-workspace-row ${item.id === "think-room" ? "public-workspace-row--future" : ""}">
      <span>${icon(item.icon, { size: 18 })}</span>
      <div><small>${item.eyebrow}</small><strong>${item.title}</strong></div>
      <em>${item.state}</em>
      ${icon("arrow", { size: 14 })}
    </a>`).join("");
}

export function renderPlatformPage() {
  const content = `
    <section class="public-page-hero">
      <div class="container public-page-hero__grid">
        <div>
          <span class="public-kicker"><i></i>PRODUCT ARCHITECTURE</span>
          <h1>رهجو یک Dashboard نیست؛<br><span>یک زنجیره عملیاتی مشترک است.</span></h1>
        </div>
        <div><p>Website، CRM، فروش، Service/API، Workflow، Governance و Dashboard قرار نیست ابزارهای جدا باشند. همه روی یک identity، Case spine، event model و Outcome کار می‌کنند.</p><div class="public-page-hero__actions"><a data-link class="button button--primary" href="/login">دیدن Workspace</a><a data-link class="button button--secondary" href="/map">دیدن جریان انتها‌به‌انتها</a></div></div>
      </div>
    </section>

    <section class="public-section">
      <div class="container">
        <header class="public-section__head"><div><span>هفت لایه محصول</span><h2>Operational Foundation first → Intelligence on top.</h2></div><p>شش لایه اول باید با AI خاموش کار کنند. Think Room بعداً همان Account، Case، Decision، Approval، Action و Outcome را مصرف می‌کند.</p></header>
        <div class="public-architecture-grid">${layerCards()}</div>
      </div>
    </section>

    <section class="public-section public-section--muted">
      <div class="container public-two-column public-two-column--architecture">
        <div>
          <span class="public-kicker public-kicker--plain">SHARED SPINE</span>
          <h2>Account → Case → Decision/Approval → Action → Outcome</h2>
          <p>این spine به رهجو اجازه می‌دهد CRM، سرویس، اتوماسیون، ممیزی و هوشمندی آینده بدون ساختن شناسه و حافظه‌های جدا با هم کار کنند.</p>
          <div class="public-spine">
            ${["Account", "Case", "Decision / Approval", "Action", "Outcome"].map((item, index) => `<span><i>0${index + 1}</i><strong>${item}</strong></span>`).join("")}
          </div>
        </div>
        <div class="public-workspace-list"><header><small>همین معماری در Workspace</small><strong>سطوح فعلی محصول</strong></header>${workspaceMap()}</div>
      </div>
    </section>

    <section class="public-section">
      <div class="container public-principle-grid">
        ${[
          ["layers", "No-AI baseline", "قابلیت حیاتی فاز اول برای کار پایه به LLM یا provider خارجی وابسته نیست."],
          ["node", "Shared identity", "Website و App باید از object و ID مشترک استفاده کنند تا re-entry و silo کم شود."],
          ["shield", "Human gate", "اقدام پرریسک و تعهد تجاری/امنیتی بدون approval انسانی انجام نمی‌شود."],
          ["audit", "Audit by design", "Mutation مهم باید actor، source، time، scope و result قابل بازبینی داشته باشد."]
        ].map(([name, title, text]) => `<article><span>${icon(name, { size: 21 })}</span><h3>${title}</h3><p>${text}</p></article>`).join("")}
      </div>
    </section>`;

  return siteShell({ content, activePath: "/platform" });
}
