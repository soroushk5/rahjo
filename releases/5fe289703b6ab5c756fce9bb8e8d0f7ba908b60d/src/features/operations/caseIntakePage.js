import { appShell } from "../../app/appShell.js";
import { entityHref, requestNavigation } from "../../app/entityRoutes.js";
import { icon } from "../../components/icons.js";
import { escapeHtml } from "../../lib/html.js";
import { createCase, getOperationalState } from "../../services/operationalStore.js";

/** @param {Array<Record<string, any>>} items @param {string} valueKey @param {(item:Record<string, any>) => string} label */
function options(items, valueKey, label) {
  return items.map((item) => `<option value="${escapeHtml(item[valueKey])}">${escapeHtml(label(item))}</option>`).join("");
}

export function renderCaseIntakePage() {
  const state = getOperationalState();
  const firstAccount = state.accounts[0];
  const firstService = state.services[0];
  const contacts = state.contacts.filter((item) => item.accountId === firstAccount.accountId);
  const content = `<section class="ops-heading"><div><small>Guided intake · browser-local</small><h1>ورود پرونده جدید</h1><p>Context را کامل کنید، مرز evidence و ریسک را ببینید و پروندهٔ مصنوعی را برای Gate انسانی بسازید.</p></div><div class="ops-heading__actions"><a data-link class="button button--secondary" href="/dashboard">انصراف و بازگشت</a></div></section>
    <div class="demo-notice" role="note">${icon("shield", { size: 17 })}<div><strong>فقط حافظه محلی دمو</strong><span>این جریان هیچ provider، API، پیام، پرداخت، eligibility زنده یا تصمیم AI را فراخوانی نمی‌کند.</span></div></div>
    <form id="case-intake" class="intake-layout" novalidate>
      <section class="ops-panel intake-step"><header><span>۱</span><div><h2>Account و منبع</h2><small>موجودیت مالک Case را مشخص کنید</small></div></header>
        <label class="select-control"><span>حساب *</span><select name="accountId" id="intake-account" required>${options(state.accounts, "accountId", (item) => `${item.accountId} — ${item.name}`)}</select></label>
        <label class="select-control"><span>تماس یا منبع</span><select name="contactId" id="intake-contact">${options(contacts, "contactId", (item) => `${item.fullName} — ${item.role}`)}<option value="operator">ورودی مستقیم اپراتور — دمو</option></select></label>
      </section>
      <section class="ops-panel intake-step"><header><span>۲</span><div><h2>ServiceCapability و هدف</h2><small>حداقل Context لازم؛ بدون ادعای دسترسی</small></div></header>
        <label class="select-control"><span>سرویس *</span><select name="serviceId" id="intake-service" required>${options(state.services, "serviceId", (item) => `${item.serviceId} — ${item.name}`)}</select></label>
        <label class="field-control"><span>هدف پرونده *</span><textarea name="purpose" id="intake-purpose" rows="3" maxlength="240" required placeholder="مثلاً بررسی داخلی امکان پایلوت دمو"></textarea></label>
        <div class="claim-boundary" id="intake-evidence"><span>${icon("shield", { size: 19 })}</span><div><strong>${escapeHtml(firstService.eligibilityStatus)}</strong><p>Risk: ${escapeHtml(firstService.riskClass)} · Environment: ${escapeHtml(firstService.environmentStatus)} · فقط خلاصه fixture</p></div></div>
      </section>
      <section class="ops-panel intake-step"><header><span>۳</span><div><h2>مالک، اقدام بعدی و مرور</h2><small>ساخت Case به معنی تأیید یا اجرا نیست</small></div></header>
        <label class="select-control"><span>مالک *</span><select name="owner" id="intake-owner" required>${state.accounts.map((item) => `<option value="${escapeHtml(item.owner)}">${escapeHtml(item.owner)}</option>`).join("")}</select></label>
        <label class="field-control"><span>اقدام بعدی *</span><input name="nextAction" id="intake-next-action" maxlength="180" required value="تصمیم انسانی درباره eligibility" /></label>
        <dl class="intake-review" aria-label="مرور پرونده"><div><dt>Account</dt><dd id="review-account">${escapeHtml(firstAccount.name)}</dd></div><div><dt>Service</dt><dd id="review-service">${escapeHtml(firstService.name)}</dd></div><div><dt>Status</dt><dd>Waiting/Approval</dd></div><div><dt>Execution</dt><dd>Blocked until human approval</dd></div></dl>
        <p id="intake-error" class="interaction-feedback" role="alert"></p>
        <div class="intake-actions"><a data-link class="button button--secondary" href="/dashboard">انصراف</a><button class="button button--primary" type="submit">مرور و ساخت Case محلی ${icon("arrow", { size: 16 })}</button></div>
      </section>
    </form>`;
  return appShell({ content, activePath: "/services", title: "ورود هدایت‌شده پرونده" });
}

export function mountCaseIntakePage() {
  const state = getOperationalState();
  const form = document.querySelector("#case-intake");
  const account = document.querySelector("#intake-account");
  const contact = document.querySelector("#intake-contact");
  const service = document.querySelector("#intake-service");
  const evidence = document.querySelector("#intake-evidence");
  const reviewAccount = document.querySelector("#review-account");
  const reviewService = document.querySelector("#review-service");
  const error = document.querySelector("#intake-error");

  const sync = () => {
    const selectedAccount = state.accounts.find((item) => item.accountId === (account instanceof HTMLSelectElement ? account.value : "")) ?? state.accounts[0];
    const selectedService = state.services.find((item) => item.serviceId === (service instanceof HTMLSelectElement ? service.value : "")) ?? state.services[0];
    if (reviewAccount) reviewAccount.textContent = selectedAccount.name;
    if (reviewService) reviewService.textContent = selectedService.name;
    if (evidence) evidence.innerHTML = `<span>${icon("shield", { size: 19 })}</span><div><strong>${escapeHtml(selectedService.eligibilityStatus)}</strong><p>Risk: ${escapeHtml(selectedService.riskClass)} · Environment: ${escapeHtml(selectedService.environmentStatus)} · فقط خلاصه fixture</p></div>`;
    if (contact instanceof HTMLSelectElement) {
      contact.innerHTML = `${options(state.contacts.filter((item) => item.accountId === selectedAccount.accountId), "contactId", (item) => `${item.fullName} — ${item.role}`)}<option value="operator">ورودی مستقیم اپراتور — دمو</option>`;
    }
  };
  account?.addEventListener("change", sync);
  service?.addEventListener("change", sync);
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!(form instanceof HTMLFormElement)) return;
    if (!form.reportValidity()) {
      if (error) error.textContent = "فیلدهای ستاره‌دار را کامل کنید؛ هیچ پرونده‌ای ساخته نشد.";
      return;
    }
    const values = new FormData(form);
    const result = createCase({
      accountId: String(values.get("accountId") ?? ""),
      serviceId: String(values.get("serviceId") ?? ""),
      purpose: String(values.get("purpose") ?? ""),
      owner: String(values.get("owner") ?? ""),
      sourceChannel: `Guided intake · ${String(values.get("contactId") ?? "Operator")} · Local demo`,
      nextAction: String(values.get("nextAction") ?? "")
    });
    const created = result.state.cases.find((item) => item.caseId === result.caseId);
    requestNavigation(entityHref({ type: "case", id: result.caseId, caseId: result.caseId, serviceId: created?.serviceId }));
  });
  sync();
}
