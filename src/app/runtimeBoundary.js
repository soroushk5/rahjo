import { escapeHtml } from "../lib/html.js";
import { readRuntimeConfig } from "../config/runtimeConfig.js";
import { RUNTIME_DATA_STATES, runtimeData } from "../services/runtimeDataFacade.js";
import { mountPrototypeChrome } from "./prototypeChrome.js";
import { mountServerOperationalRoute, renderServerOperationalRoute } from "../features/operations/serverOperationalPages.js";

const PUBLIC_SERVER_PATHS = new Set(["/", "/product", "/services", "/use-cases", "/how-it-works", "/pilot", "/trust", "/about", "/contact", "/privacy", "/terms", "/track-request", "/accept-invite", "/recover-account", "/account"]);

/** @param {{render:() => string}} route */
function renderServerPublicRoute(route) {
  return route.render()
    .replaceAll("دیدن دموی رهجو", "ورود به رهجو")
    .replaceAll("دیدن در دمو", "ورود به محیط عملیاتی")
    .replaceAll("دموی تعاملی", "محیط عملیاتی");
}

/** @type {Readonly<Record<string, string>>} */
const labels = Object.freeze({
  connecting: "در حال اتصال",
  ready: "متصل به سرور",
  unavailable: "سرویس در دسترس نیست",
  auth: "نیازمند ورود امن",
  forbidden: "دسترسی ممنوع",
  conflict: "تعارض نسخهٔ داده",
  validation: "پیکربندی یا پاسخ نامعتبر"
});

/**
 * Keep failed-login copy intentionally non-specific so authentication does not
 * disclose whether the workspace, email, or password was the failing field.
 * @param {Record<string, any>} snapshot
 */
export function loginFeedbackMessage(snapshot = {}) {
  switch (snapshot.state) {
    case RUNTIME_DATA_STATES.AUTH:
      return "اطلاعات ورود یا فضای کاری درست نیست.";
    case RUNTIME_DATA_STATES.FORBIDDEN:
      return "این حساب به فضای کاری درخواستی دسترسی ندارد.";
    case RUNTIME_DATA_STATES.UNAVAILABLE:
      return "ارتباط با سرویس ورود برقرار نشد؛ دوباره تلاش کنید.";
    case RUNTIME_DATA_STATES.CONFLICT:
      return "وضعیت نشست تغییر کرده است؛ دوباره تلاش کنید.";
    case RUNTIME_DATA_STATES.VALIDATION:
      return "اطلاعات ورود معتبر نیست؛ فیلدها را بررسی کنید.";
    default:
      return snapshot.message || "ورود انجام نشد.";
  }
}

/**
 * Runtime state publications can replace the login DOM while authenticate() is
 * awaiting the server. Always update the CURRENT form instead of references
 * captured before the request, otherwise users see a silent failed login.
 * @param {{workspaceSlug:string,email:string}} submitted
 * @param {Record<string, any>} result
 */
function syncCurrentLoginForm(submitted, result) {
  const currentForm = document.querySelector("#rahjo-server-login");
  if (!(currentForm instanceof HTMLFormElement)) return;
  const currentWorkspace = currentForm.elements.namedItem("workspaceSlug");
  const currentEmail = currentForm.elements.namedItem("email");
  const currentPassword = currentForm.elements.namedItem("password");
  const currentButton = currentForm.querySelector("button[type=submit]");
  const currentFeedback = currentForm.querySelector("#rahjo-login-feedback");
  if (currentWorkspace instanceof HTMLInputElement) currentWorkspace.value = submitted.workspaceSlug;
  if (currentEmail instanceof HTMLInputElement) currentEmail.value = submitted.email;
  if (currentPassword instanceof HTMLInputElement) {
    currentPassword.value = "";
    currentPassword.focus();
  }
  if (currentButton instanceof HTMLButtonElement) currentButton.disabled = false;
  if (currentFeedback) currentFeedback.textContent = loginFeedbackMessage(result);
}

/**
 * Resolve the public runtime configuration and initialize its data source before
 * any route is rendered.
 *
 * @param {Document} [target]
 * @param {ReturnType<import("../services/runtimeDataFacade.js").createRuntimeDataFacade>} [facade]
 * @param {{fetchImpl?: typeof fetch, timeoutMs?: number}} [options]
 */
export async function initializeRuntimeFromDocument(target = document, facade = runtimeData, options = {}) {
  let config;
  try {
    config = readRuntimeConfig(target);
    const snapshot = await facade.initialize(config, options);
    maybeStartBrowserBootstrap(config, snapshot);
    return snapshot;
  } catch (error) {
    return facade.configurationFailure(error);
  }
}

const API_BOOTSTRAP_MARKER = "rahjoApiBootstrap";

/**
 * Resolve Hostinger's one-time browser challenge through a safe top-level hop.
 * The return URL is same-origin with the current Rahjo UI and is validated again
 * by the server against RAHJO_CORS_ORIGINS before redirecting.
 *
 * @param {{mode:string,apiBase:string}} config
 * @param {{state?:string,reason?:string}} snapshot
 * @param {Window} [browserWindow]
 */
export function maybeStartBrowserBootstrap(config, snapshot, browserWindow = globalThis.window) {
  if (!browserWindow || config.mode !== "server"
    || snapshot.state !== RUNTIME_DATA_STATES.UNAVAILABLE
    || snapshot.reason !== "request-failed") return false;

  const current = new URL(browserWindow.location.href);
  const apiOrigin = new URL(config.apiBase).origin;
  if (PUBLIC_SERVER_PATHS.has(current.pathname)
    || current.origin === apiOrigin
    || current.searchParams.has(API_BOOTSTRAP_MARKER)) return false;

  current.searchParams.set(API_BOOTSTRAP_MARKER, "1");
  const bootstrap = new URL("/browser-bootstrap", apiOrigin);
  bootstrap.searchParams.set("return", current.toString());
  browserWindow.location.replace(bootstrap.toString());
  return true;
}

/** @param {Record<string, any>} snapshot @param {string} title */
export function renderServerRuntimeState(snapshot, title = "رهجو") {
  const state = String(snapshot.state || RUNTIME_DATA_STATES.UNAVAILABLE);
  const label = labels[state] ?? labels.unavailable;
  const displayTitle = state === RUNTIME_DATA_STATES.AUTH ? "ورود امن رهجو" : title;
  const workspaceName = snapshot.workspace?.name || snapshot.workspace?.id || "هنوز تأیید نشده";
  const readyNote = state === RUNTIME_DATA_STATES.READY
    ? "تصویر همگام سرور دریافت و در حافظهٔ موقت نگه‌داری شده است. نمایش عملیاتی زنده فقط از آداپتر سرور خوانده می‌شود."
    : "حالت Server بسته مانده است؛ دادهٔ Golden Demo یا دادهٔ مرورگر به‌عنوان جایگزین نمایش داده نمی‌شود.";

  const loginForm = state === RUNTIME_DATA_STATES.AUTH ? `
          <form id="rahjo-server-login" class="auth-form server-login-form" novalidate>
            <label>فضای کاری<input name="workspaceSlug" type="text" autocomplete="organization" value="rahjo" required /></label>
            <label>ایمیل<input name="email" type="email" autocomplete="username" value="owner@rahjo.local" required /></label>
            <label>گذرواژه<input name="password" type="password" autocomplete="current-password" required autofocus /></label>
            <p id="rahjo-login-feedback" class="interaction-feedback" role="alert"></p>
            <button class="button button--primary button--large" type="submit">ورود به محیط عملیاتی</button>
            <a data-link class="text-link" href="/recover-account">بازیابی دسترسی</a>
          </form>` : "";

  return `
    <div class="phase-site server-auth-page" data-runtime-mode="server" data-runtime-state="${escapeHtml(state)}">
      <main id="main-content" class="server-auth-layout">
        <section class="server-auth-story"><a data-link href="/" class="server-auth-brand">رهجو <small>RAHJO</small></a><div><span class="server-live-pill">${escapeHtml(label)}</span><h1>${escapeHtml(displayTitle)}</h1><p>مشتری، Case، تأیید انسانی، اقدام، رسید و نتیجه در یک جریان امن و قابل ممیزی.</p><ul><li>دادهٔ واقعی سرور</li><li>جداسازی فضای کاری</li><li>مسیر عملیاتی کنترل‌شده</li></ul></div></section>
        <section class="server-auth-panel"><div class="server-auth-card"><header><small>محیط عملیاتی</small><h2>${escapeHtml(displayTitle)}</h2><p>${escapeHtml(snapshot.message || "وضعیت سرویس داده مشخص نیست.")}</p><p class="server-boundary-note">${escapeHtml(readyNote)}</p></header>${loginForm}<dl class="server-auth-meta"><div><dt>داده</dt><dd>Server</dd></div><div><dt>Workspace</dt><dd>${escapeHtml(String(workspaceName))}</dd></div></dl><small class="server-version">نسخه ${escapeHtml(String(snapshot.buildSha || "نامشخص"))}</small></div></section>
      </main>
    </div>`;
}

/** Mount only the server-owned login exchange; never import demo auth here. */
function mountServerRuntimeState() {
  if (runtimeData.read().state !== RUNTIME_DATA_STATES.AUTH) return;
  const form = document.querySelector("#rahjo-server-login");
  if (!(form instanceof HTMLFormElement)) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fields = new FormData(form);
    const submitted = {
      workspaceSlug: String(fields.get("workspaceSlug") ?? "").trim(),
      email: String(fields.get("email") ?? "").trim()
    };
    const password = String(fields.get("password") ?? "");
    const button = form.querySelector("button[type=submit]");
    const feedback = form.querySelector("#rahjo-login-feedback");
    if (button instanceof HTMLButtonElement) button.disabled = true;
    if (feedback) feedback.textContent = "در حال بررسی امن نشست…";
    try {
      const result = await runtimeData.authenticate({
        workspaceSlug: submitted.workspaceSlug,
        email: submitted.email,
        password
      });
      if (result.state === RUNTIME_DATA_STATES.READY) {
        history.replaceState({}, "", "/dashboard");
        window.dispatchEvent(new PopStateEvent("popstate"));
      } else {
        syncCurrentLoginForm(submitted, result);
      }
    } finally {
      // If no runtime publication replaced the form, restore the original
      // controls too. Detached controls are harmless; current controls are
      // handled by syncCurrentLoginForm above.
      const passwordField = form.elements.namedItem("password");
      if (passwordField instanceof HTMLInputElement) passwordField.value = "";
      if (button instanceof HTMLButtonElement) button.disabled = false;
    }
  });
}

/**
 * Demo mode delegates to the unchanged W7/W11/W12 renderer and mount function.
 * Every other mode is fail-closed and cannot execute browser-local mutations.
 *
 * @param {{path?:string, render:() => string, mount?:() => void, title?:string}} route
 */
export function applyRuntimeBoundary(route) {
  return {
    ...route,
    render: () => {
      const snapshot = runtimeData.read();
      if (snapshot.mode === "demo") return route.render();
      if (PUBLIC_SERVER_PATHS.has(route.path ?? "")) return renderServerPublicRoute(route);
      return snapshot.state === RUNTIME_DATA_STATES.READY
        ? renderServerOperationalRoute(route.path ?? "/dashboard")
        : renderServerRuntimeState(snapshot, route.path === "/login" ? "ورود امن رهجو" : route.title);
    },
    mount: () => {
      if (runtimeData.read().mode === "demo") route.mount?.();
      else if (PUBLIC_SERVER_PATHS.has(route.path ?? "")) route.mount?.();
      else if (runtimeData.read().state === RUNTIME_DATA_STATES.READY) {
        mountPrototypeChrome();
        mountServerOperationalRoute();
      } else mountServerRuntimeState();
    }
  };
}
