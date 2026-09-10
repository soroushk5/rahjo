import { escapeHtml } from "../lib/html.js";
import { readRuntimeConfig } from "../config/runtimeConfig.js";
import { RUNTIME_DATA_STATES, runtimeData } from "../services/runtimeDataFacade.js";

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
 * Resolve the public runtime configuration and initialize its data source before
 * any route is rendered.
 *
 * @param {Document} [target]
 * @param {ReturnType<import("../services/runtimeDataFacade.js").createRuntimeDataFacade>} [facade]
 * @param {{fetchImpl?: typeof fetch, timeoutMs?: number}} [options]
 */
export async function initializeRuntimeFromDocument(target = document, facade = runtimeData, options = {}) {
  try {
    return await facade.initialize(readRuntimeConfig(target), options);
  } catch (error) {
    return facade.configurationFailure(error);
  }
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
          <form id="rahjo-server-login" class="auth-form" novalidate>
            <label>فضای کاری<input name="workspaceSlug" type="text" autocomplete="organization" required /></label>
            <label>ایمیل<input name="email" type="email" autocomplete="username" required /></label>
            <label>گذرواژه<input name="password" type="password" autocomplete="current-password" required /></label>
            <button class="button button--primary" type="submit">ورود امن به سرور</button>
          </form>` : "";

  return `
    <div class="phase-site" data-runtime-mode="server" data-runtime-state="${escapeHtml(state)}">
      <main id="main-content" class="container public-section public-section--first">
        <section class="workspace-panel">
          <header><div><small>Rahjo Server Runtime</small><h1>${escapeHtml(displayTitle)}</h1></div></header>
          <div class="empty-state" role="status" aria-live="polite">
            <strong>${escapeHtml(label)}</strong>
            <p>${escapeHtml(snapshot.message || "وضعیت سرویس داده مشخص نیست.")}</p>
            <p>${escapeHtml(readyNote)}</p>
            ${loginForm}
          </div>
          <dl class="financial-summary">
            <div><dt>حالت داده</dt><dd>Server</dd></div>
            <div><dt>فضای کاری</dt><dd>${escapeHtml(String(workspaceName))}</dd></div>
            <div><dt>نسخهٔ رابط</dt><dd>${escapeHtml(String(snapshot.buildSha || "نامشخص"))}</dd></div>
          </dl>
        </section>
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
    const passwordField = form.elements.namedItem("password");
    try {
      await runtimeData.authenticate({
        workspaceSlug: String(fields.get("workspaceSlug") ?? ""),
        email: String(fields.get("email") ?? ""),
        password: String(fields.get("password") ?? "")
      });
    } finally {
      if (passwordField instanceof HTMLInputElement) passwordField.value = "";
    }
  });
}

/**
 * Demo mode delegates to the unchanged W7/W11/W12 renderer and mount function.
 * Every other mode is fail-closed and cannot execute browser-local mutations.
 *
 * @param {{render:() => string, mount?:() => void, title?:string}} route
 */
export function applyRuntimeBoundary(route) {
  return {
    ...route,
    render: () => {
      const snapshot = runtimeData.read();
      return snapshot.mode === "demo"
        ? route.render()
        : renderServerRuntimeState(snapshot, route.title);
    },
    mount: () => {
      if (runtimeData.read().mode === "demo") route.mount?.();
      else mountServerRuntimeState();
    }
  };
}
