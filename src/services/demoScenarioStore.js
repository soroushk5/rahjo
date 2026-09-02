const DEMO_STATE_KEY = "rahjo.client.demo.state.v1";

export const demoScenarioSteps = Object.freeze([
  { id: "overview", path: "/dashboard", label: "تصویر عملیات", short: "Dashboard" },
  { id: "account", path: "/crm", label: "حافظه مشتری", short: "Account 360" },
  { id: "sales", path: "/sales", label: "فروش و تحویل", short: "Sales" },
  { id: "service", path: "/services", label: "پرونده و سرویس", short: "Case" },
  { id: "action", path: "/automation", label: "تأیید و اجرا", short: "Approval / Action" },
  { id: "audit", path: "/governance", label: "ممیزی و Receipt", short: "Audit" },
  { id: "outcome", path: "/crm", label: "نتیجه و حلقه بسته", short: "Outcome" }
]);

export const demoHero = Object.freeze({
  accountId: "ACC-DEMO-001",
  accountName: "شرکت نمونه آفتاب",
  leadId: "LEAD-DEMO-001",
  opportunityId: "OPP-DEMO-001",
  caseId: "CASE-DEMO-101",
  serviceId: "SVC-DEMO-001",
  approvalId: "APR-DEMO-LIVE-001",
  actionId: "ACT-DEMO-LIVE-001",
  runId: "RUN-DEMO-LIVE-001",
  receiptId: "RCP-DEMO-LIVE-001",
  outcomeId: "OUT-DEMO-LIVE-001"
});

const seed = Object.freeze({
  version: 1,
  started: false,
  completed: false,
  currentStep: 0,
  followupLogged: false,
  salesQualified: false,
  casePrepared: false,
  approvalStatus: "Requested",
  actionStatus: "queued",
  receiptStatus: "در انتظار اجرا",
  outcomeStatus: "Pending",
  lastEvent: "سناریوی نمایشی آماده شروع است",
  eventCount: 1
});

function cloneSeed() {
  return { ...seed };
}

function storage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function normalize(value) {
  const candidate = value && typeof value === "object" ? value : {};
  return {
    ...cloneSeed(),
    ...candidate,
    version: 1,
    currentStep: Math.min(Math.max(Number(candidate.currentStep ?? 0), 0), demoScenarioSteps.length - 1),
    eventCount: Math.max(Number(candidate.eventCount ?? 1), 1)
  };
}

export function getDemoScenario() {
  const target = storage();
  if (!target) return cloneSeed();
  try {
    const raw = target.getItem(DEMO_STATE_KEY);
    return raw ? normalize(JSON.parse(raw)) : cloneSeed();
  } catch {
    return cloneSeed();
  }
}

function persist(next) {
  const normalized = normalize(next);
  const target = storage();
  if (target) {
    try {
      target.setItem(DEMO_STATE_KEY, JSON.stringify(normalized));
    } catch {
      // Presentation state persistence is optional in restricted browsers.
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("rahjo:demo-state", { detail: normalized }));
  }
  return normalized;
}

export function resetDemoScenario() {
  const target = storage();
  if (target) {
    try {
      target.removeItem(DEMO_STATE_KEY);
    } catch {
      // No-op.
    }
  }
  const initial = cloneSeed();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("rahjo:demo-state", { detail: initial }));
  }
  return initial;
}

export function startDemoScenario() {
  return persist({ ...cloneSeed(), started: true, lastEvent: "دموی مشتری از Dashboard شروع شد", eventCount: 2 });
}

export function demoAction(action) {
  const state = getDemoScenario();
  switch (action) {
    case "followup":
      return persist({ ...state, started: true, currentStep: Math.max(state.currentStep, 1), followupLogged: true, lastEvent: "پیگیری Account 360 ثبت شد", eventCount: state.eventCount + 1 });
    case "qualify":
      return persist({ ...state, started: true, currentStep: Math.max(state.currentStep, 2), salesQualified: true, lastEvent: "فرصت فروش برای تحویل انسانی آماده شد", eventCount: state.eventCount + 1 });
    case "case":
      return persist({ ...state, started: true, currentStep: Math.max(state.currentStep, 3), casePrepared: true, lastEvent: "Case سرویس روی حساب نمونه آماده شد", eventCount: state.eventCount + 1 });
    case "approve":
      return persist({ ...state, started: true, currentStep: Math.max(state.currentStep, 4), casePrepared: true, approvalStatus: "Approved", lastEvent: "تأیید انسانی برای Case ثبت شد", eventCount: state.eventCount + 1 });
    case "execute":
      if (state.approvalStatus !== "Approved") return state;
      return persist({ ...state, currentStep: Math.max(state.currentStep, 4), actionStatus: "succeeded", receiptStatus: "Verified / Demo", lastEvent: "Workflow قطعی اجرا و Receipt نمایشی ثبت شد", eventCount: state.eventCount + 1 });
    case "outcome":
      if (state.actionStatus !== "succeeded") return state;
      return persist({ ...state, currentStep: 6, completed: true, outcomeStatus: "Recorded", lastEvent: "Outcome روی همان Account/Case ثبت و حلقه بسته شد", eventCount: state.eventCount + 1 });
    default:
      return state;
  }
}

export function presenterAction(path, state = getDemoScenario()) {
  if (path === "/crm" && !state.followupLogged) return { action: "followup", label: "ثبت پیگیری سناریو" };
  if (path === "/sales" && !state.salesQualified) return { action: "qualify", label: "تأیید و تحویل به انسان" };
  if (path === "/services" && !state.casePrepared) return { action: "case", label: "ساخت Case نمایشی" };
  if (path === "/automation" && state.approvalStatus !== "Approved") return { action: "approve", label: "تأیید انسانی" };
  if (path === "/automation" && state.actionStatus !== "succeeded") return { action: "execute", label: "اجرای Workflow" };
  if (path === "/governance" && state.outcomeStatus !== "Recorded") return { action: "outcome", label: "ثبت Outcome" };
  return null;
}

export function presenterNext(path, state = getDemoScenario()) {
  if (path === "/dashboard") return { path: "/crm", label: "Account 360" };
  if (path === "/crm" && state.outcomeStatus === "Recorded") return { path: "/dashboard", label: "بازگشت به Dashboard" };
  if (path === "/crm") return { path: "/sales", label: "فروش" };
  if (path === "/sales") return { path: "/services", label: "Case و سرویس" };
  if (path === "/services") return { path: "/automation", label: "Approval و اجرا" };
  if (path === "/automation") return { path: "/governance", label: "Audit و Receipt" };
  if (path === "/governance") return { path: "/crm", label: "Outcome روی Account" };
  return { path: "/dashboard", label: "Dashboard" };
}

export function demoStepIndex(path, state = getDemoScenario()) {
  if (path === "/crm" && state.outcomeStatus === "Recorded") return 6;
  const index = demoScenarioSteps.findIndex((step) => step.path === path);
  return index >= 0 ? index : state.currentStep;
}

export function demoStatusSummary(state = getDemoScenario()) {
  return {
    account: demoHero.accountName,
    caseId: demoHero.caseId,
    approval: state.approvalStatus,
    action: state.actionStatus,
    receipt: state.receiptStatus,
    outcome: state.outcomeStatus,
    eventCount: state.eventCount,
    lastEvent: state.lastEvent
  };
}
