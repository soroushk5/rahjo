import { icon } from "../components/icons.js";
import { allDestinations } from "./navigation.js";
import { signOut } from "../services/authStore.js";

let keyboardBound = false;

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

export function mountPrototypeChrome() {
  mountMobileNavigation();
  mountCommandPalette();
  mountLogout();
}
