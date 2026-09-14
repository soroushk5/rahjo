// @ts-nocheck
import { readRuntimeConfig } from "../../config/runtimeConfig.js";
import { escapeHtml } from "../../lib/html.js";
import { runtimeData } from "../../services/runtimeDataFacade.js";

function shell(title, lead, body) {
  return `<div class="phase-site server-auth-page">
    <main id="main-content" class="server-auth-layout">
      <section class="server-auth-story">
        <a data-link href="/" class="server-auth-brand">رهجو <small>RAHJO</small></a>
        <div><span class="server-live-pill">حساب امن</span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(lead)}</p>
        <ul><li>نشست سروری روی هر دستگاه</li><li>دعوت یک‌بارمصرف</li><li>بازیابی بدون نمایش رمز</li></ul></div>
      </section>
      <section class="server-auth-panel"><div class="server-auth-card">${body}</div></section>
    </main>
  </div>`;
}

function feedback(id) {
  return `<p id="${id}" class="interaction-feedback" role="alert" aria-live="polite"></p>`;
}

function passwordFields(prefix = "") {
  return `<label>گذرواژه جدید<input name="${prefix}password" type="password" autocomplete="new-password" minlength="8" maxlength="256" required /></label>
    <label>تکرار گذرواژه<input name="${prefix}confirm" type="password" autocomplete="new-password" minlength="8" maxlength="256" required /></label>`;
}

export function renderAcceptInvitePage() {
  return shell("فعال‌کردن حساب رهجو", "دعوت را روی هر دستگاهی باز کنید و برای حساب خود گذرواژه تعیین کنید.", `
    <header><small>دعوت فضای کاری</small><h2>ساخت حساب</h2><p>لینک دعوت یک‌بارمصرف و زمان‌دار است.</p></header>
    <form id="rahjo-invite-accept" class="auth-form server-login-form" novalidate>
      ${passwordFields()}
      ${feedback("invite-feedback")}
      <button class="button button--primary button--large" type="submit">فعال‌کردن حساب</button>
    </form>
    <a data-link class="text-link" href="/login">بازگشت به ورود</a>`);
}

export function renderRecoverAccountPage() {
  return shell("بازیابی دسترسی", "با لینک بازیابی یک‌بارمصرف یا یکی از کدهای بازیابی ذخیره‌شده، گذرواژه جدید تعیین کنید.", `
    <header><small>بازیابی حساب</small><h2>تعیین گذرواژه جدید</h2><p id="recovery-mode-copy">اگر لینک بازیابی دارید همان لینک را باز کنید؛ در غیر این صورت از کد بازیابی استفاده کنید.</p></header>
    <form id="rahjo-account-recovery" class="auth-form server-login-form" novalidate>
      <div data-recovery-identity>
        <label>فضای کاری<input name="workspaceSlug" value="rahjo" autocomplete="organization" required /></label>
        <label>ایمیل<input name="email" type="email" autocomplete="username" required /></label>
        <label>کد بازیابی<input name="recoveryCode" autocomplete="one-time-code" /></label>
      </div>
      ${passwordFields("new-")}
      ${feedback("recovery-feedback")}
      <button class="button button--primary button--large" type="submit">بازیابی و ورود</button>
    </form>
    <a data-link class="text-link" href="/login">بازگشت به ورود</a>`);
}

export function renderAccountSecurityPage() {
  return shell("حساب و اعضای فضای کاری", "عضو جدید را با لینک دعوت اضافه کنید، گذرواژه را عوض کنید و کدهای بازیابی را در جای امن نگه دارید.", `
    <header><small>مدیریت حساب</small><h2 id="account-heading">در حال بررسی نشست…</h2><p id="account-session-copy">این صفحه فقط با نشست معتبر سرور کار می‌کند.</p></header>
    ${feedback("account-feedback")}
    <section class="workspace-panel" data-account-admin hidden>
      <header><h3>دعوت عضو جدید</h3><p>ثبت‌نام عمومی باز نیست؛ مالک یا مدیر لینک دعوت یک‌بارمصرف می‌سازد.</p></header>
      <form id="rahjo-member-invite" class="auth-form" novalidate>
        <label>نام<input name="displayName" maxlength="160" required /></label>
        <label>ایمیل<input name="email" type="email" autocomplete="email" required /></label>
        <label>نقش<select name="role"><option value="operator">کاربر عملیاتی</option><option value="admin">مدیر</option><option value="viewer">فقط مشاهده</option></select></label>
        <button class="button button--primary" type="submit">ساخت لینک دعوت</button>
      </form>
      <div id="invite-result" class="interaction-feedback" aria-live="polite"></div>
      <div id="member-list"></div>
    </section>
    <section class="workspace-panel">
      <header><h3>تغییر گذرواژه</h3><p>با تغییر گذرواژه، نشست‌های قبلی باطل می‌شوند.</p></header>
      <form id="rahjo-password-change" class="auth-form" novalidate>
        <label>گذرواژه فعلی<input name="currentPassword" type="password" autocomplete="current-password" required /></label>
        ${passwordFields("change-")}
        <button class="button button--outline" type="submit">تغییر گذرواژه</button>
      </form>
    </section>
    <section class="workspace-panel">
      <header><h3>کدهای بازیابی</h3><p>کدها فقط یک‌بار نمایش داده می‌شوند. آن‌ها را در یک محل امن ذخیره کنید.</p></header>
      <button id="rahjo-generate-recovery" class="button button--outline" type="button">ساخت کدهای جدید</button>
      <pre id="recovery-codes-output" hidden></pre>
    </section>
    <a data-link class="text-link" href="/dashboard">بازگشت به محیط کار</a>`);
}

function lifecycleConfig() {
  const config = readRuntimeConfig(document);
  if (config.mode !== "server" || !config.apiBase) throw new Error("این قابلیت فقط در محیط سروری رهجو فعال است.");
  return config;
}

async function publicApi(config, path, options = {}) {
  const response = await fetch(`${config.apiBase}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) }
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.detail || "عملیات انجام نشد.");
    error.status = response.status;
    throw error;
  }
  return payload;
}

function tokenFromFragment(expectedMode = "") {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const mode = params.get("mode") || "";
  const token = params.get("token") || "";
  if (token) history.replaceState({}, "", `${location.pathname}${location.search}`);
  return { token, mode: expectedMode && mode !== expectedMode ? "" : mode };
}

function validatePair(form, passwordName, confirmName) {
  const password = String(new FormData(form).get(passwordName) || "");
  const confirm = String(new FormData(form).get(confirmName) || "");
  if (password.length < 8) throw new Error("گذرواژه باید حداقل ۸ کاراکتر باشد.");
  if (password !== confirm) throw new Error("تکرار گذرواژه یکسان نیست.");
  return password;
}

function setText(id, message, tone = "") {
  const node = document.getElementById(id);
  if (!node) return;
  node.textContent = message;
  node.dataset.tone = tone;
}

export function mountAcceptInvitePage() {
  const form = document.querySelector("#rahjo-invite-accept");
  if (!(form instanceof HTMLFormElement)) return;
  const { token } = tokenFromFragment();
  if (!token) {
    setText("invite-feedback", "لینک دعوت معتبر نیست یا توکن آن حذف شده است.", "error");
    form.querySelector("button")?.setAttribute("disabled", "");
    return;
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button[type=submit]");
    try {
      const password = validatePair(form, "password", "confirm");
      if (button) button.disabled = true;
      setText("invite-feedback", "در حال فعال‌سازی حساب…");
      const config = lifecycleConfig();
      await publicApi(config, "/api/v1/invitations/accept", { method: "POST", body: JSON.stringify({ token, password }) });
      location.replace("/dashboard");
    } catch (error) {
      if (button) button.disabled = false;
      setText("invite-feedback", error instanceof Error ? error.message : "فعال‌سازی انجام نشد.", "error");
    }
  });
}

export function mountRecoverAccountPage() {
  const form = document.querySelector("#rahjo-account-recovery");
  if (!(form instanceof HTMLFormElement)) return;
  const { token, mode } = tokenFromFragment("reset");
  const identity = form.querySelector("[data-recovery-identity]");
  if (token && mode === "reset") {
    identity?.setAttribute("hidden", "");
    setText("recovery-mode-copy", "لینک بازیابی شناسایی شد. گذرواژه جدید را تعیین کنید.");
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button[type=submit]");
    try {
      const password = validatePair(form, "new-password", "new-confirm");
      const fields = new FormData(form);
      if (button) button.disabled = true;
      setText("recovery-feedback", "در حال بازیابی امن حساب…");
      const config = lifecycleConfig();
      if (token && mode === "reset") {
        await publicApi(config, "/api/v1/account/reset", { method: "POST", body: JSON.stringify({ token, password }) });
      } else {
        await publicApi(config, "/api/v1/account/recovery", {
          method: "POST",
          body: JSON.stringify({
            workspaceSlug: String(fields.get("workspaceSlug") || "").trim(),
            email: String(fields.get("email") || "").trim(),
            recoveryCode: String(fields.get("recoveryCode") || "").trim(),
            password
          })
        });
      }
      location.replace("/dashboard");
    } catch (error) {
      if (button) button.disabled = false;
      setText("recovery-feedback", error instanceof Error ? error.message : "بازیابی انجام نشد.", "error");
    }
  });
}

function memberTable(members) {
  const host = document.getElementById("member-list");
  if (!host) return;
  host.innerHTML = `<div class="table-wrap"><table class="workspace-table"><thead><tr><th>عضو</th><th>نقش</th><th>وضعیت</th><th>بازیابی</th></tr></thead><tbody>${members.map((member) => `
    <tr><td><strong>${escapeHtml(member.display_name)}</strong><small>${escapeHtml(member.email)}</small></td><td>${escapeHtml(member.role)}</td><td>${escapeHtml(member.status)}</td>
    <td><button type="button" class="button button--outline" data-member-reset="${escapeHtml(member.membership_id)}">ساخت لینک بازیابی</button></td></tr>`).join("")}</tbody></table></div>`;
  host.querySelectorAll("[data-member-reset]").forEach((button) => button.addEventListener("click", async () => {
    try {
      button.disabled = true;
      const result = await runtimeData.sessionRequest(`/api/v1/members/${encodeURIComponent(button.dataset.memberReset)}/reset-link`, { method: "POST", body: {} });
      setText("account-feedback", `لینک بازیابی تا ${new Date(result.reset.expiresAt).toLocaleString("fa-IR")} معتبر است: ${result.reset.url}`, "success");
    } catch (error) {
      setText("account-feedback", error instanceof Error ? error.message : "ساخت لینک انجام نشد.", "error");
    } finally {
      button.disabled = false;
    }
  }));
}

export async function mountAccountSecurityPage() {
  try {
    const session = await runtimeData.sessionRequest("/api/v1/session");
    setText("account-heading", `${session.user.name || session.user.email} · ${session.workspace.name}`);
    setText("account-session-copy", "نشست این دستگاه از سرور تأیید شد.");

    const isAdmin = ["owner", "admin"].includes(session.user.role);
    const adminSection = document.querySelector("[data-account-admin]");
    if (isAdmin) {
      adminSection?.removeAttribute("hidden");
      const members = await runtimeData.sessionRequest("/api/v1/members");
      memberTable(members.members || []);
    }

    const invite = document.querySelector("#rahjo-member-invite");
    invite?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!(invite instanceof HTMLFormElement) || !invite.reportValidity()) return;
      const fields = new FormData(invite);
      const button = invite.querySelector("button[type=submit]");
      try {
        if (button) button.disabled = true;
        const result = await runtimeData.sessionRequest("/api/v1/members/invitations", {
          method: "POST",
          body: {
            displayName: String(fields.get("displayName") || ""),
            email: String(fields.get("email") || ""),
            role: String(fields.get("role") || "operator")
          }
        });
        const output = document.getElementById("invite-result");
        if (output) output.textContent = `لینک دعوت تا ${new Date(result.invitation.expiresAt).toLocaleString("fa-IR")} معتبر است: ${result.invitation.url}`;
        invite.reset();
      } catch (error) {
        setText("invite-result", error instanceof Error ? error.message : "دعوت ساخته نشد.", "error");
      } finally {
        if (button) button.disabled = false;
      }
    });

    const passwordForm = document.querySelector("#rahjo-password-change");
    passwordForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!(passwordForm instanceof HTMLFormElement)) return;
      try {
        const fields = new FormData(passwordForm);
        const newPassword = validatePair(passwordForm, "change-password", "change-confirm");
        await runtimeData.sessionRequest("/api/v1/account/password", {
          method: "POST",
          body: { currentPassword: String(fields.get("currentPassword") || ""), newPassword }
        });
        location.replace("/login");
      } catch (error) {
        setText("account-feedback", error instanceof Error ? error.message : "تغییر گذرواژه انجام نشد.", "error");
      }
    });

    document.getElementById("rahjo-generate-recovery")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      try {
        button.disabled = true;
        const result = await runtimeData.sessionRequest("/api/v1/account/recovery-codes", { method: "POST", body: {} });
        const output = document.getElementById("recovery-codes-output");
        if (output) {
          output.hidden = false;
          output.textContent = result.codes.join("\n");
        }
        setText("account-feedback", "کدهای قبلی باطل شدند. کدهای جدید را همین حالا در جای امن ذخیره کنید.", "success");
      } catch (error) {
        setText("account-feedback", error instanceof Error ? error.message : "ساخت کدها انجام نشد.", "error");
      } finally {
        button.disabled = false;
      }
    });
  } catch (error) {
    setText("account-feedback", error instanceof Error ? error.message : "نشست معتبر نیست.", "error");
    if (error?.status === 401) setTimeout(() => location.replace("/login"), 500);
  }
}
