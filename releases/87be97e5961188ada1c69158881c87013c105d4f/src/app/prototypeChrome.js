// @ts-nocheck
import { icon } from "../components/icons.js";
import { allDestinations } from "./navigation.js";
import { signOut } from "../services/authStore.js";
import { searchIndex } from "../services/phaseOneStore.js";
import { entityHref } from "./entityRoutes.js";
import { escapeHtml } from "../lib/html.js";
import { runtimeData, RUNTIME_DATA_STATES } from "../services/runtimeDataFacade.js";

let keyboardBound = false;

function commandMarkup() {
  return `<div class="command-backdrop" data-command-close></div><section class="command-dialog" role="dialog" aria-modal="true" aria-labelledby="command-title"><header><div><small>جست‌وجوی سریع</small><h2 id="command-title">کجا می‌خواهید بروید؟</h2></div><button type="button" class="icon-button" data-command-close aria-label="بستن">${icon("close")}</button></header><label class="command-search">${icon("search")}<input id="command-query" autocomplete="off" placeholder="مشتری، درخواست، سند یا صفحه را بنویسید…" /></label><nav class="command-results" data-command-results aria-label="نتایج جست‌وجوی سریع"></nav><footer><kbd>Esc</kbd> بستن · <kbd>Ctrl K</kbd> باز کردن</footer></section>`;
}

function itemSearchText(item) {
  return [item.searchText, item.label, item.meta, item.id, item.path]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("fa");
}

/** @param {Array<Record<string, unknown>>} [entities] */
export function commandItems(entities = searchIndex()) {
  const destinations = allDestinations.map((item) => ({
    ...item,
    id: item.path,
    href: item.path,
    resultKind: "destination"
  }));
  const runtime = runtimeData.read();
  const serverEntities = runtime.mode === "server" && runtime.state === RUNTIME_DATA_STATES.READY
    ? [
        ...(runtime.projection?.accounts || []).map((item) => ({ id: item.id, label: item.name || item.id, meta: "مشتری سرور", href: `/customers/detail?account=${encodeURIComponent(item.id)}`, resultKind: "entity" })),
        ...(runtime.projection?.cases || []).map((item) => ({ id: item.id, label: item.purpose || item.id, meta: `Case · ${item.status}`, href: `/requests/detail?case=${encodeURIComponent(item.id)}`, resultKind: "entity" }))
      ]
    : entities.map((item) => ({ ...item, href: entityHref(item), resultKind: "entity" }));
  return [
    ...destinations,
    ...serverEntities
  ];
}

/** @param {Array<Record<string, unknown>>} [items] */
export function commandResultsMarkup(items = commandItems()) {
  const results = items.map((item) => {
    const href = String(item.href || "/dashboard");
    return `<a data-link data-command-item data-command-kind="${escapeHtml(item.resultKind || "entity")}" data-command-text="${escapeHtml(itemSearchText(item))}" data-route-path="${escapeHtml(href)}" href="${escapeHtml(href)}"><strong>${escapeHtml(item.label || item.id || "نتیجه")}</strong><small>${escapeHtml(item.meta || "رکورد رهجو")}</small><span>${icon("arrow")}</span></a>`;
  }).join("");
  return `${results}<p class="command-empty" data-command-empty role="status" hidden>نتیجه‌ای برای این عبارت پیدا نشد.</p>`;
}

function bindCommandResultLinks(palette) {
  palette.querySelectorAll("[data-command-item]").forEach((item) => {
    if (!(item instanceof HTMLElement) || item.dataset.closeBound) return;
    item.dataset.closeBound = "true";
    item.addEventListener("click", closeCommandPalette);
  });
}

function rebuildCommandResults(palette) {
  const results = palette.querySelector("[data-command-results]");
  if (!(results instanceof HTMLElement)) return;
  results.innerHTML = commandResultsMarkup();
  bindCommandResultLinks(palette);
}

function filterCommandResults(palette, value) {
  const needle = value.trim().toLocaleLowerCase("fa");
  let visible = 0;
  palette.querySelectorAll("[data-command-item]").forEach((item) => {
    const text = (item.getAttribute("data-command-text") ?? "").toLocaleLowerCase("fa");
    const hidden = Boolean(needle) && !text.includes(needle);
    item.toggleAttribute("hidden", hidden);
    if (!hidden) visible += 1;
  });
  const empty = palette.querySelector("[data-command-empty]");
  if (empty instanceof HTMLElement) empty.toggleAttribute("hidden", visible > 0);
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
  rebuildCommandResults(palette);
  palette.hidden = false;
  document.body.classList.add("command-open");
  const input = palette.querySelector("#command-query");
  if (input instanceof HTMLInputElement) {
    input.value = "";
    filterCommandResults(palette, "");
    requestAnimationFrame(() => input.focus());
  }
}

function mountCommandPalette() {
  const palette = ensureCommandPalette();
  document.querySelectorAll("#global-search,[data-open-command]").forEach((button) => button.addEventListener("click", openCommandPalette));
  palette.querySelectorAll("[data-command-close]").forEach((button) => button.addEventListener("click", closeCommandPalette));

  const query = palette.querySelector("#command-query");
  if (query instanceof HTMLInputElement && !query.dataset.bound) {
    query.dataset.bound = "true";
    query.addEventListener("input", () => filterCommandResults(palette, query.value));
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
  const sidebar = document.querySelector(".phase-sidebar");
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
  document.querySelectorAll("[data-server-logout]").forEach((control) => {
    if (!(control instanceof HTMLElement) || control.dataset.logoutBound) return;
    control.dataset.logoutBound = "true";
    control.addEventListener("click", async (event) => {
      event.preventDefault();
      await runtimeData.logout();
      history.replaceState({}, "", "/login");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
  });
}

export function mountPrototypeChrome() {
  mountMobileNavigation();
  mountCommandPalette();
  mountLogout();
}
