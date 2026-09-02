import { icon } from "../components/icons.js";
import { allDestinations } from "./navigation.js";
import { signOut } from "../services/authStore.js";
import { demoAction, demoHero, getDemoScenario, resetDemoScenario } from "../services/demoScenarioStore.js";

let keyboardBound = false;
let demoBound = false;

function commandMarkup() {
  return `<div class="command-backdrop" data-command-close></div><section class="command-dialog" role="dialog" aria-modal="true" aria-labelledby="command-title"><header><div><small>Quick navigation</small><h2 id="command-title">کجا می‌خواهید بروید؟</h2></div><button type="button" class="icon-button" data-command-close aria-label="بستن">${icon("close")}</button></header><label class="command-search">${icon("search")}<input id="command-query" autocomplete="off" placeholder="جست‌وجوی صفحه یا مفهوم…" /></label><nav class="command-results" aria-label="نتایج جست‌وجوی سریع">${allDestinations.map((item) => `<a data-link data-command-item data-command-text="${item.label} ${item.meta}" href="${item.path}"><strong>${item.label}</strong><small>${item.meta}</small><span>${icon("arrow")}</span></a>`).join("")}</nav><footer><kbd>Esc</kbd> بستن · <kbd>Ctrl K</kbd> باز کردن</footer></section>`;
}

function ensureCommandPalette() {
  const existing = document.querySelector("#command-palette");
  if (existing instanceof HTMLElement) return existing;
  const palette = document.createElement("div");
  palette.id = "command-palette";
  palette.className = "command-palette";
  palette.hidden = true;
  palette.innerHTML = commandMarkup();
  document.body.append(palette);
  return palette;
}

function closeCommandPalette() {
  const palette = document.querySelector("#command-palette");
  if (!(palette instanceof HTMLElement)) return;
  palette.hidden = true;
  document.body.classList.remove("command-open");
}

function openCommandPalette() {
  const palette = ensureCommandPalette();
  palette.hidden = false;
  document.body.classList.add("command-open");
  const input = palette.querySelector("#command-query");
  if (input instanceof HTMLInputElement) {
    input.value = "";
    palette.querySelectorAll("[data-command-item]").forEach((item) => item.removeAttribute("hidden"));
    requestAnimationFrame(() => input.focus());
  }
}

function mountCommandPalette() {
  const palette = ensureCommandPalette();
  document.querySelectorAll("#global-search,[data-open-command]").forEach((button) => button.addEventListener("click", openCommandPalette));
  palette.querySelectorAll("[data-command-close]").forEach((button) => button.addEventListener("click", closeCommandPalette));
  palette.querySelectorAll("[data-command-item]").forEach((item) => {
    if (!(item instanceof HTMLElement) || item.dataset.closeBound) return;
    item.dataset.closeBound = "true";
    item.addEventListener("click", closeCommandPalette);
  });

  const query = palette.querySelector("#command-query");
  if (query instanceof HTMLInputElement && !query.dataset.bound) {
    query.dataset.bound = "true";
    query.addEventListener("input", () => {
      const needle = query.value.trim().toLocaleLowerCase("fa");
      palette.querySelectorAll("[data-command-item]").forEach((item) => {
        const text = (item.getAttribute("data-command-text") ?? "").toLocaleLowerCase("fa");
        item.toggleAttribute("hidden", Boolean(needle) && !text.includes(needle));
      });
    });
  }

  if (!keyboardBound) {
    keyboardBound = true;
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeCommandPalette();
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase("fa") === "k") {
        event.preventDefault();
        openCommandPalette();
      }
    });
  }
}

function mountMobileNavigation() {
  const siteToggle = document.querySelector("#mobile-nav-toggle");
  const siteNav = document.querySelector("#site-nav");
  if (siteToggle instanceof HTMLButtonElement && siteNav instanceof HTMLElement) {
    siteToggle.addEventListener("click", () => {
      const open = siteNav.toggleAttribute("data-open");
      siteToggle.setAttribute("aria-expanded", String(open));
    });
    siteNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
      siteNav.removeAttribute("data-open");
      siteToggle.setAttribute("aria-expanded", "false");
    }));
  }

  const appToggle = document.querySelector("#app-menu-toggle");
  const sidebar = document.querySelector(".app-sidebar");
  if (appToggle instanceof HTMLButtonElement && sidebar instanceof HTMLElement) {
    appToggle.addEventListener("click", () => {
      const open = sidebar.toggleAttribute("data-open");
      appToggle.setAttribute("aria-expanded", String(open));
    });
    sidebar.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
      sidebar.removeAttribute("data-open");
      appToggle.setAttribute("aria-expanded", "false");
    }));
  }
}

function mountLogout() {
  document.querySelectorAll("[data-logout]").forEach((control) => {
    if (!(control instanceof HTMLElement) || control.dataset.logoutBound) return;
    control.dataset.logoutBound = "true";
    control.addEventListener("click", () => signOut());
  });
}

/** @param {Element | null} container @param {string} text */
function setPositiveStatus(container, text) {
  if (!container) return;
  const chip = container.querySelector(".status-chip");
  if (chip instanceof HTMLElement) {
    chip.className = "status-chip status-chip--positive";
    chip.textContent = text;
  }
}

function syncGoldenDemoDom() {
  const state = getDemoScenario();
  const caseStatus = state.outcomeStatus === "Recorded" ? "Resolved" : state.actionStatus === "succeeded" ? "Action/Execution" : state.approvalStatus === "Approved" ? "Approved" : "Waiting/Approval";
  const nextAction = state.outcomeStatus === "Recorded" ? "Outcome ثبت شد؛ آماده follow-up" : state.actionStatus === "succeeded" ? "Receipt ثبت شد؛ آماده Outcome" : state.approvalStatus === "Approved" ? "آماده اجرای bounded" : "تکمیل مدارک و تأیید انسانی";

  document.querySelectorAll(".compact-list small").forEach((small) => {
    if (!small.textContent?.includes(demoHero.caseId)) return;
    const row = small.closest("div");
    if (!row) return;
    small.textContent = `${demoHero.caseId} · ${nextAction}`;
    setPositiveStatus(row, caseStatus);
  });

  const capability = document.querySelector("#capability-detail");
  capability?.querySelectorAll("tr").forEach((row) => {
    const cells = row.querySelectorAll("td");
    const caseCode = row.querySelector("code");
    if (caseCode?.textContent !== demoHero.caseId || cells.length < 5) return;
    if (state.approvalStatus === "Approved") cells[3].innerHTML = '<span class="status-chip status-chip--positive">Approved</span>';
    if (state.actionStatus === "succeeded") {
      cells[2].innerHTML = '<span class="status-chip status-chip--positive">Action/Execution</span>';
      cells[4].innerHTML = '<span class="status-chip status-chip--positive">succeeded</span> · Receipt';
    }
    if (state.outcomeStatus === "Recorded") {
      cells[2].innerHTML = '<span class="status-chip status-chip--positive">Resolved</span>';
      cells[4].innerHTML = '<span class="status-chip status-chip--positive">Recorded</span> · Outcome';
    }
  });

  const runRows = document.querySelector("#run-rows");
  runRows?.querySelectorAll("tr").forEach((row) => {
    const cells = row.querySelectorAll("td");
    const codes = [...row.querySelectorAll("code")];
    if (!codes.some((code) => code.textContent === demoHero.caseId) || cells.length < 8) return;
    if (state.approvalStatus === "Approved") cells[3].textContent = "Approved demo";
    if (state.actionStatus === "succeeded") {
      cells[4].innerHTML = '<span class="status-chip status-chip--positive">succeeded</span>';
      cells[6].innerHTML = `<code>${demoHero.receiptId}</code>`;
      cells[7].textContent = "—";
    }
  });

  const auditRows = document.querySelector("#audit-rows");
  if (auditRows instanceof HTMLElement) {
    const events = [];
    if (state.approvalStatus === "Approved") events.push(["دمو", "مدیر عملیات", "Golden Demo approval approved", "Local demo state", "Requested → Approved"]);
    if (state.actionStatus === "succeeded") events.push(["دمو", "Workflow runner", `Golden Demo action succeeded · ${demoHero.receiptId}`, "Local deterministic runner", "Approved → Action/Execution"]);
    if (state.outcomeStatus === "Recorded") events.push(["دمو", "مدیر عملیات", `Golden Demo outcome recorded · ${demoHero.outcomeId}`, "Local demo state", "Action/Execution → Resolved"]);
    events.forEach((event, index) => {
      if (auditRows.querySelector(`[data-demo-audit="${index}"]`)) return;
      const row = document.createElement("tr");
      row.dataset.demoAudit = String(index);
      row.innerHTML = `<td>${event[0]}</td><td>${event[1]}</td><td>${event[2]}</td><td>${event[3]}</td><td>${event[4]}</td><td><code>${demoHero.caseId}</code></td>`;
      auditRows.prepend(row);
    });
  }

  if (state.outcomeStatus === "Recorded") {
    const dashboardRow = [...document.querySelectorAll("#dashboard-task-rows tr")].find((row) => row.textContent?.includes(demoHero.caseId));
    if (dashboardRow) {
      const cells = dashboardRow.querySelectorAll("td");
      const title = dashboardRow.querySelector("strong");
      if (title) title.textContent = "Outcome ثبت شد؛ حلقه پرونده بسته شد";
      if (cells[2]) cells[2].textContent = "انجام شد";
      if (cells[3]) cells[3].innerHTML = '<span class="status-chip status-chip--positive">Resolved</span>';
    }

    const outcomeSection = [...document.querySelectorAll(".account-section")].find((section) => section.querySelector("h2")?.textContent?.includes("خلاصه نتیجه"));
    const list = outcomeSection?.querySelector(".compact-list");
    if (list && !list.querySelector("[data-demo-outcome]")) {
      const row = document.createElement("div");
      row.dataset.demoOutcome = "true";
      row.innerHTML = `<span>${icon("check", { size: 17 })}</span><p><strong>Outcome سناریوی زنده ثبت شد</strong><small>${demoHero.outcomeId} · ${demoHero.caseId}</small></p><span class="status-chip status-chip--positive">Recorded</span>`;
      list.prepend(row);
    }
  }
}

function rerenderCurrentRoute() {
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function mountGoldenDemo() {
  if (demoBound) return;
  demoBound = true;
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const reset = target.closest("[data-demo-reset]");
    if (reset) {
      resetDemoScenario();
      window.setTimeout(rerenderCurrentRoute, 20);
      return;
    }

    const presenterAction = target.closest("[data-demo-action]");
    if (presenterAction instanceof HTMLElement) {
      const action = presenterAction.dataset.demoAction;
      if (action) {
        demoAction(action);
        rerenderCurrentRoute();
      }
      return;
    }

    if (target.closest("[data-log-followup]")) {
      demoAction("followup");
      window.setTimeout(rerenderCurrentRoute, 20);
      return;
    }
    if (target.closest("#sales-handoff")) {
      demoAction("qualify");
      window.setTimeout(rerenderCurrentRoute, 20);
      return;
    }
    if (target.closest("#new-service-request")) {
      demoAction("case");
      window.setTimeout(rerenderCurrentRoute, 20);
    }
  });
}

export function mountPrototypeChrome() {
  mountMobileNavigation();
  mountCommandPalette();
  mountLogout();
  mountGoldenDemo();
  syncGoldenDemoDom();
}
