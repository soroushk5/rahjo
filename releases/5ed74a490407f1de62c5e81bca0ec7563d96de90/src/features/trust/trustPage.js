import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";
import { publicTrustPrinciples } from "../../data/publicOperationalContent.js";

const reviewGates = Object.freeze([
  { id: "claim", icon: "eye", title: "Claim / Status", text: "آیا وضعیت capability صریح است و Demo/Review/Pilot/Evidence را با Production اشتباه نمی‌گیرد؟" },
  { id: "owner", icon: "users", title: "Owner / Responsibility", text: "آیا owner تصمیم، سرویس، خطا و اقدام بعدی مشخص است؟" },
  { id: "permission", icon: "lock", title: "Permission / Scope", text: "آیا نقش، context، permitted purpose و حداقل دسترسی مشخص است؟" },
  { id: "approval", icon: "shield", title: "Human Approval", text: "آیا اقدام پرریسک، قیمت استثنایی، SLA/Contract یا دسترسی حساس Gate انسانی دارد؟" },
  { id: "audit", icon: "audit", title: "Audit / Receipt", text: "آیا actor، source، timestamp، state، result و receipt قابل بازبینی‌اند؟" },
  { id: "quality", icon: "layers", title: "Data Quality / Failure", text: "آیا missing/duplicate/stale data و failure/retry بدون side-effect پنهان مدیریت می‌شوند؟" }
]);

const completedGates = new Set();

function gateCards() {
  return reviewGates.map((gate, index) => `
    <button class="public-gate-card" type="button" data-public-gate="${gate.id}" aria-pressed="${completedGates.has(gate.id)}">
      <span class="public-gate-card__index">0${index + 1}</span>
      <span class="public-gate-card__icon">${icon(gate.icon, { size: 20 })}</span>
      <h3>${gate.title}</h3>
      <p>${gate.text}</p>
      <em>${completedGates.has(gate.id) ? `${icon("check", { size: 13 })} بررسی شد` : "برای شبیه‌سازی انتخاب کنید"}</em>
    </button>`).join("");
}

function gateStatus() {
  const count = completedGates.size;
  const complete = count === reviewGates.length;
  return `
    <div class="public-gate-status" data-complete="${complete}">
      <div><span>${icon(complete ? "check" : "shield", { size: 21 })}</span><div><small>Operational review simulation</small><strong>${complete ? "شش کنترل دمو مرور شد" : `${count} از ${reviewGates.length} کنترل مرور شده`}</strong></div></div>
      <p>${complete ? "این فقط شبیه‌سازی contract است؛ برای Production همچنان evidence، owner و approval واقعی لازم است." : "کارت‌ها را مرور کنید تا منطق Gate تجربه محصول را ببینید. هیچ انتخابی در این صفحه مجوز واقعی ایجاد نمی‌کند."}</p>
      <i><b style="--progress:${Math.round((count / reviewGates.length) * 100)}%"></b></i>
      <button id="reset-public-gates" class="button button--secondary" type="button" ${count ? "" : "disabled"}>بازنشانی</button>
    </div>`;
}

function principles() {
  return publicTrustPrinciples.map((item) => `
    <article class="public-trust-card"><span>${icon(item.icon, { size: 21 })}</span><h3>${item.title}</h3><p>${item.text}</p></article>`).join("");
}

export function renderTrustPage() {
  const content = `
    <section class="public-page-hero public-page-hero--trust">
      <div class="container public-page-hero__grid">
        <div><span class="public-kicker"><i></i>TRUST · GOVERNANCE · CLAIM SAFETY</span><h1>اعتماد از «قول» ساخته نمی‌شود؛<br><span>از Gate و Evidence ساخته می‌شود.</span></h1></div>
        <div><p>رهجو در فاز اول باید هم در UI و هم در عملیات نشان دهد چه چیزی Demo است، چه چیزی Evidence می‌خواهد، چه اقدامی human-gated است و هر تغییر مهم چگونه audit می‌شود.</p><div class="public-page-hero__actions"><a data-link class="button button--primary" href="/login">دیدن Governance در Workspace</a><a data-link class="button button--secondary" href="/data">دیدن status سرویس‌ها</a></div></div>
      </div>
    </section>

    <section class="public-section">
      <div class="container">
        <header class="public-section__head"><div><span>شش اصل</span><h2>کنترل در محصول، داده و ادعا باید هم‌زمان دیده شود.</h2></div><p>این اصول جای «Security/SLA قطعی بدون مدرک» را می‌گیرند و با Governance و Data Quality داخل داشبورد هم‌راستا هستند.</p></header>
        <div class="public-trust-grid">${principles()}</div>
      </div>
    </section>

    <section class="public-section public-section--muted">
      <div class="container">
        <header class="public-section__head"><div><span>Interactive review</span><h2>قبل از Action یا Claim، شش سؤال.</h2></div><p>این simulator صرفاً منطق تصمیم را نشان می‌دهد؛ هیچ سرویس، مجوز یا SLA واقعی را فعال نمی‌کند.</p></header>
        <div id="public-gate-grid" class="public-gate-grid">${gateCards()}</div>
        <div id="public-gate-status">${gateStatus()}</div>
      </div>
    </section>

    <section class="public-section">
      <div class="container public-boundary-banner">
        <div><span>${icon("shield", { size: 22 })}</span><div><small>PUBLIC BOUNDARY</small><h2>Catalogue یا Demo = Production eligibility نیست.</h2></div></div>
        <p>برای هر سرویس/API production باید source/right/contract، permitted purpose/fields، security، SLA/error ownership، owner و launch claim جداگانه تأیید شوند.</p>
        <a data-link class="button button--secondary" href="/platform">بازگشت به معماری</a>
      </div>
    </section>`;

  return siteShell({ content, activePath: "/trust" });
}

/** @param {() => void} rerender */
export function mountTrustPage(rerender) {
  document.querySelectorAll("[data-public-gate]").forEach((card) => card.addEventListener("click", () => {
    const id = card.getAttribute("data-public-gate");
    if (!id) return;
    if (completedGates.has(id)) completedGates.delete(id); else completedGates.add(id);
    rerender();
  }));

  document.querySelector("#reset-public-gates")?.addEventListener("click", () => {
    completedGates.clear();
    rerender();
  });
}
