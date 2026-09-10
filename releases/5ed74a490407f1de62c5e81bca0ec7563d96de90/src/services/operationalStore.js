import {
  demoAccounts,
  demoActions,
  demoApprovals,
  demoAuditEvents,
  demoAutomationRuns,
  demoCases,
  demoContacts,
  demoContracts,
  demoDataQuality,
  demoInteractions,
  demoLeads,
  demoOpportunities,
  demoOutcomes,
  demoProposals,
  demoServiceCapabilities,
  demoTasks,
  demoWorkflows
} from "../data/operationalData.js";

export const OPERATIONAL_STATE_VERSION = 1;
export const OPERATIONAL_STATE_KEY = "rahjo.operational.memory.v1";

/** @typedef {Record<string, any>} Entity */
/** @typedef {{version:number, revision:number, counters:Record<string, number>, accounts:Entity[], contacts:Entity[], leads:Entity[], opportunities:Entity[], cases:Entity[], tasks:Entity[], services:Entity[], approvals:Entity[], actions:Entity[], outcomes:Entity[], interactions:Entity[], proposals:Entity[], contracts:Entity[], workflows:Entity[], runs:Entity[], dataQuality:Entity[], auditEvents:Entity[]}} OperationalState */

/** @type {OperationalState | null} */
let memoryState = null;

/** @param {unknown} value @returns {any} */
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

/** @returns {OperationalState} */
function seedState() {
  return {
    version: OPERATIONAL_STATE_VERSION,
    revision: 0,
    counters: { case: 0, task: 0, interaction: 0, approval: 0, action: 0, run: 0, receipt: 0, outcome: 0, event: 0 },
    accounts: clone(demoAccounts),
    contacts: clone(demoContacts),
    leads: clone(demoLeads),
    opportunities: clone(demoOpportunities),
    cases: clone(demoCases),
    tasks: clone(demoTasks),
    services: clone(demoServiceCapabilities),
    approvals: clone(demoApprovals),
    actions: clone(demoActions),
    outcomes: clone(demoOutcomes),
    interactions: clone(demoInteractions),
    proposals: clone(demoProposals),
    contracts: clone(demoContracts),
    workflows: clone(demoWorkflows),
    runs: clone(demoAutomationRuns),
    dataQuality: clone(demoDataQuality),
    auditEvents: clone(demoAuditEvents)
  };
}

function storage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** @param {unknown} value */
function isValidState(value) {
  const candidate = /** @type {Partial<OperationalState> | null} */ (value && typeof value === "object" ? value : null);
  return Boolean(candidate && candidate.version === OPERATIONAL_STATE_VERSION && Array.isArray(candidate.accounts) && Array.isArray(candidate.cases) && Array.isArray(candidate.auditEvents));
}

/** @returns {OperationalState} */
export function getOperationalState() {
  const target = storage();
  if (target) {
    try {
      const raw = target.getItem(OPERATIONAL_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValidState(parsed)) return parsed;
      }
    } catch {
      // Fall through to the in-memory state or canonical seed.
    }
  }
  return memoryState && isValidState(memoryState) ? clone(memoryState) : seedState();
}

/** @param {OperationalState} next */
function notify(next) {
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof CustomEvent !== "undefined") {
    window.dispatchEvent(new CustomEvent("rahjo:operational-state", { detail: next }));
  }
}

/** @param {OperationalState} next @returns {OperationalState} */
function persist(next) {
  const normalized = { ...next, version: OPERATIONAL_STATE_VERSION, revision: Number(next.revision ?? 0) + 1 };
  memoryState = clone(normalized);
  const target = storage();
  if (target) {
    try {
      target.setItem(OPERATIONAL_STATE_KEY, JSON.stringify(normalized));
    } catch {
      // The deterministic in-memory fallback still supports restricted browsers.
    }
  }
  notify(normalized);
  return clone(normalized);
}

export function resetOperationalState() {
  memoryState = null;
  const target = storage();
  if (target) {
    try {
      target.removeItem(OPERATIONAL_STATE_KEY);
    } catch {
      // No-op: returning the exact seed remains safe.
    }
  }
  const seed = seedState();
  notify(seed);
  return seed;
}

/** @param {OperationalState} state @param {string} counter @param {string} prefix */
function nextId(state, counter, prefix) {
  state.counters[counter] += 1;
  return `${prefix}-${String(state.counters[counter]).padStart(3, "0")}`;
}

/** @param {unknown} value @param {string} fallback @param {number} [max] */
function safeText(value, fallback, max = 240) {
  const text = String(value ?? "").trim().slice(0, max);
  return text || fallback;
}

/** @param {OperationalState} state @param {{actor?:string, source?:string, caseId?:string|null, entityType?:string, entityId?:string|null, change:string, from?:string, to?:string}} input */
function addAudit(state, { actor = "کاربر دمو", source = "Local demo UI", caseId = null, entityType = "Case", entityId = caseId, change, from = "—", to = "—" }) {
  const eventId = nextId(state, "event", "EVT-LOCAL");
  state.auditEvents.unshift({
    eventId,
    caseId,
    entityType,
    entityId,
    actor: safeText(actor, "کاربر دمو", 80),
    source: safeText(source, "Local demo UI", 120),
    time: `محلی #${state.counters.event.toLocaleString("fa-IR")}`,
    change: safeText(change, "Local state updated"),
    state: `${safeText(from, "—", 80)} → ${safeText(to, "—", 80)}`
  });
  return eventId;
}

/** @param {string} accountId */
export function accountMemory(accountId) {
  const state = getOperationalState();
  const account = state.accounts.find((item) => item.accountId === accountId) ?? null;
  if (!account) return null;
  const caseIds = new Set(state.cases.filter((item) => item.accountId === account.accountId).map((item) => item.caseId));
  return {
    account,
    contacts: state.contacts.filter((item) => item.accountId === account.accountId),
    opportunities: state.opportunities.filter((item) => item.accountId === account.accountId),
    cases: state.cases.filter((item) => item.accountId === account.accountId),
    tasks: state.tasks.filter((item) => item.accountId === account.accountId),
    interactions: state.interactions.filter((item) => item.accountId === account.accountId),
    proposals: state.proposals.filter((item) => item.accountId === account.accountId),
    contracts: state.contracts.filter((item) => item.accountId === account.accountId),
    outcomes: state.outcomes.filter((item) => caseIds.has(item.caseId))
  };
}

/** @param {string} caseId */
export function caseContext(caseId) {
  const state = getOperationalState();
  const selectedCase = state.cases.find((item) => item.caseId === caseId) ?? null;
  if (!selectedCase) return null;
  return {
    case: selectedCase,
    account: state.accounts.find((item) => item.accountId === selectedCase.accountId) ?? null,
    service: state.services.find((item) => item.serviceId === selectedCase.serviceId) ?? null,
    approval: state.approvals.find((item) => item.approvalId === selectedCase.approvalId || item.caseId === selectedCase.caseId) ?? null,
    action: state.actions.find((item) => item.actionId === selectedCase.actionId || item.caseId === selectedCase.caseId) ?? null,
    runs: state.runs.filter((item) => item.caseId === selectedCase.caseId),
    outcome: state.outcomes.find((item) => item.outcomeId === selectedCase.outcomeId || item.caseId === selectedCase.caseId) ?? null,
    tasks: state.tasks.filter((item) => item.caseId === selectedCase.caseId),
    events: state.auditEvents.filter((item) => item.caseId === selectedCase.caseId)
  };
}

export function dashboardQueue() {
  const state = getOperationalState();
  const taskItems = state.tasks.filter((item) => item.status !== "Resolved" && item.status !== "Done").map((item) => ({ ...item, type: "task", id: item.taskId, nextAction: item.title }));
  const approvalItems = state.approvals.filter((item) => item.status === "Requested" || item.status === "Expired").map((item) => ({ type: "approval", id: item.approvalId, caseId: item.caseId, owner: item.approver, state: item.status, priority: "بالا", nextAction: item.status === "Expired" ? "بازبینی Gate" : "تصمیم انسانی" }));
  const runItems = state.runs.filter((item) => item.state === "failed" || item.state === "queued").map((item) => ({ type: "run", id: item.runId, runId: item.runId, caseId: item.caseId, owner: "مالک Workflow", state: item.state, priority: item.state === "failed" ? "بالا" : "متوسط", nextAction: item.state === "failed" ? "تلاش مجدد محدود" : "بررسی صف" }));
  return [...taskItems, ...approvalItems, ...runItems];
}

export function searchIndex() {
  const state = getOperationalState();
  return [
    ...state.accounts.map((item) => ({ type: "account", id: item.accountId, label: item.name, meta: `Account · ${item.owner}`, accountId: item.accountId })),
    ...state.cases.map((item) => ({ type: "case", id: item.caseId, label: item.purpose, meta: `Case · ${item.account}`, accountId: item.accountId, caseId: item.caseId, serviceId: item.serviceId })),
    ...state.services.map((item) => ({ type: "service", id: item.serviceId, label: item.name, meta: `Service · ${item.publicStatus}`, serviceId: item.serviceId })),
    ...state.leads.map((item) => ({ type: "lead", id: item.leadId, label: item.account, meta: `Lead · ${item.status}`, accountId: item.accountId, leadId: item.leadId })),
    ...state.opportunities.map((item) => ({ type: "opportunity", id: item.opportunityId, label: item.title, meta: `Opportunity · ${item.account}`, accountId: item.accountId, opportunityId: item.opportunityId })),
    ...state.runs.map((item) => ({ type: "run", id: item.runId, label: item.workflow, meta: `Run · ${item.state}`, caseId: item.caseId, runId: item.runId }))
  ];
}

/** @param {{accountId:string, caseId?:string|null, title?:string, owner?:string, actor?:string, source?:string}} input */
export function logFollowup({ accountId, caseId = null, title = "پیگیری جدید حساب", owner, actor = owner, source = "CRM local demo" }) {
  const state = getOperationalState();
  const account = state.accounts.find((item) => item.accountId === accountId);
  if (!account) throw new Error("Unknown demo account");
  const linkedCase = caseId ? state.cases.find((item) => item.caseId === caseId && item.accountId === accountId) : state.cases.find((item) => item.accountId === accountId && item.status !== "Resolved");
  const taskId = nextId(state, "task", "TASK-LOCAL");
  const interactionId = nextId(state, "interaction", "INT-LOCAL");
  const task = { taskId, accountId, caseId: linkedCase?.caseId ?? null, title: safeText(title, "پیگیری جدید حساب"), owner: safeText(owner, account.owner, 80), dueAt: "امروز · دمو", status: "Open", priority: "متوسط" };
  state.tasks.unshift(task);
  state.interactions.unshift({ interactionId, accountId, caseId: task.caseId, channel: "پیگیری داخلی", occurredAt: `محلی #${state.counters.interaction.toLocaleString("fa-IR")}`, actor: safeText(actor, account.owner, 80), summary: task.title, sourceRef: taskId });
  account.nextAction = task.title;
  account.nextDue = task.dueAt;
  account.taskIds = [...new Set([taskId, ...(account.taskIds ?? [])])];
  addAudit(state, { actor: actor ?? account.owner, source, caseId: task.caseId, entityType: "Task", entityId: taskId, change: "Follow-up logged", from: "Not recorded", to: "Open" });
  return { state: persist(state), taskId, interactionId };
}

/** @param {{leadId:string, actor?:string, source?:string}} input */
export function qualifyLead({ leadId, actor = "سارا نوری", source = "Sales local demo" }) {
  const state = getOperationalState();
  const lead = state.leads.find((item) => item.leadId === leadId);
  if (!lead) throw new Error("Unknown demo lead");
  const from = lead.status;
  lead.status = "Qualified";
  addAudit(state, { actor, source, entityType: "Lead", entityId: leadId, change: "Lead qualified", from, to: lead.status });
  return persist(state);
}

/** @param {{opportunityId?:string, leadId?:string, accountId?:string, actor?:string, source?:string}} input */
export function createHandoffTask({ opportunityId, leadId, accountId, actor = "سارا نوری", source = "Sales local demo" }) {
  const state = getOperationalState();
  const opportunity = state.opportunities.find((item) => item.opportunityId === opportunityId);
  const lead = state.leads.find((item) => item.leadId === leadId) ?? state.leads.find((item) => item.accountId === (accountId ?? opportunity?.accountId));
  const resolvedAccountId = accountId ?? opportunity?.accountId ?? lead?.accountId;
  const account = state.accounts.find((item) => item.accountId === resolvedAccountId);
  if (!account) throw new Error("Unknown handoff account");
  const relatedCase = state.cases.find((item) => item.accountId === account.accountId && item.status !== "Resolved");
  const taskId = nextId(state, "task", "TASK-LOCAL");
  state.tasks.unshift({ taskId, accountId: account.accountId, caseId: relatedCase?.caseId ?? null, leadId: lead?.leadId ?? null, opportunityId: opportunity?.opportunityId ?? null, title: `تحویل انسانی ${opportunity?.title ?? lead?.account ?? account.name}`, owner: account.owner, dueAt: "امروز · دمو", status: "Open", priority: "بالا" });
  account.taskIds = [...new Set([taskId, ...(account.taskIds ?? [])])];
  account.nextAction = "بازبینی انسانی فرصت و تعیین اقدام بعدی";
  addAudit(state, { actor, source, caseId: relatedCase?.caseId ?? null, entityType: "Task", entityId: taskId, change: "Human handoff task created", from: "Not recorded", to: "Open" });
  return { state: persist(state), taskId };
}

/** @param {{accountId:string, serviceId:string, purpose:string, owner?:string, sourceChannel?:string, priority?:string, nextAction?:string}} input */
export function createCase({ accountId, serviceId, purpose, owner, sourceChannel = "Guided intake — Local demo", priority = "متوسط", nextAction = "تصمیم انسانی درباره eligibility" }) {
  const state = getOperationalState();
  const account = state.accounts.find((item) => item.accountId === accountId);
  const service = state.services.find((item) => item.serviceId === serviceId);
  if (!account || !service) throw new Error("Account and service are required");
  const caseId = nextId(state, "case", "CASE-LOCAL");
  const approvalId = nextId(state, "approval", "APR-LOCAL");
  const selectedOwner = safeText(owner, service.owner === "TBD" ? account.owner : service.owner, 80);
  const selectedPurpose = safeText(purpose, `درخواست ${service.name}`);
  state.cases.unshift({ caseId, accountId, account: account.name, serviceId, purpose: selectedPurpose, priority, status: "Waiting/Approval", owner: selectedOwner, sourceChannel: safeText(sourceChannel, "Guided intake — Local demo", 120), openedAt: "اکنون · دمو", nextAction: safeText(nextAction, "تصمیم انسانی درباره eligibility"), approvalId, actionId: null, outcomeId: null });
  state.approvals.unshift({ approvalId, caseId, policyRef: "POL-LOCAL-HUMAN", approver: selectedOwner, status: "Requested", requestedAt: "اکنون · دمو", reason: "Gate انسانی پیش از هر اجرای نمایشی" });
  account.caseIds = [...new Set([caseId, ...(account.caseIds ?? [])])];
  account.nextAction = selectedPurpose;
  addAudit(state, { actor: selectedOwner, source: "Guided intake — Local demo", caseId, entityType: "Case", entityId: caseId, change: "Case created", from: "Not recorded", to: "Waiting/Approval" });
  return { state: persist(state), caseId, approvalId };
}

/** @param {{caseId:string, decision:"Approved"|"Rejected", actor?:string, source?:string}} input */
export function approveOrReject({ caseId, decision, actor = "مدیر عملیات — دمو", source = "Human approval — Local demo" }) {
  if (decision !== "Approved" && decision !== "Rejected") throw new Error("Decision must be Approved or Rejected");
  const state = getOperationalState();
  const selectedCase = state.cases.find((item) => item.caseId === caseId);
  if (!selectedCase) throw new Error("Unknown demo case");
  let approval = state.approvals.find((item) => item.caseId === caseId);
  if (!approval) {
    const approvalId = nextId(state, "approval", "APR-LOCAL");
    approval = { approvalId, caseId, policyRef: "POL-LOCAL-HUMAN", approver: actor, status: "Requested", requestedAt: "اکنون · دمو", reason: "Gate انسانی" };
    state.approvals.unshift(approval);
    selectedCase.approvalId = approvalId;
  }
  const from = approval.status;
  approval.status = decision;
  approval.approver = actor;
  selectedCase.status = decision === "Approved" ? "Ready/Action" : "Blocked";
  selectedCase.nextAction = decision === "Approved" ? "اجرای محدود و محلی Workflow" : "بازبینی دلیل رد توسط مالک";
  addAudit(state, { actor, source, caseId, entityType: "Approval", entityId: approval.approvalId, change: `Approval ${decision.toLowerCase()}`, from, to: decision });
  return persist(state);
}

/** @param {{caseId?:string, runId?:string, mode?:"start"|"retry", actor?:string, source?:string}} input */
export function startOrRetryRun({ caseId, runId, mode = "start", actor = "Workflow runner — Demo", source = "Local deterministic runner" }) {
  const state = getOperationalState();
  if (mode === "retry") {
    const run = state.runs.find((item) => item.runId === runId);
    if (!run) throw new Error("Unknown demo run");
    const from = run.state;
    const receiptId = nextId(state, "receipt", "REC-LOCAL");
    run.state = "queued";
    run.receipt = receiptId;
    run.retry = "تلاش مجدد محلی ثبت شد";
    addAudit(state, { actor, source, caseId: run.caseId, entityType: "Run", entityId: run.runId, change: `Retry queued · ${receiptId}`, from, to: run.state });
    return { state: persist(state), runId: run.runId, receiptId };
  }
  const selectedCase = state.cases.find((item) => item.caseId === caseId);
  if (!selectedCase) throw new Error("Unknown demo case");
  const approval = state.approvals.find((item) => item.caseId === caseId);
  if (approval?.status !== "Approved") throw new Error("Human approval is required");
  const createdRunId = nextId(state, "run", "RUN-LOCAL");
  const receiptId = nextId(state, "receipt", "REC-LOCAL");
  const actionId = nextId(state, "action", "ACT-LOCAL");
  state.actions.unshift({ actionId, caseId, decisionId: approval.approvalId, actionType: "اجرای محدود نمایشی", owner: selectedCase.owner, executionMode: "Local demo", status: "Succeeded", requestedAt: "اکنون · دمو" });
  state.runs.unshift({ runId: createdRunId, workflowId: "WF-DEMO-003", workflow: "Approval → Local demo action", caseId, state: "succeeded", approval: "Approved demo", startedAt: "اکنون · دمو", receipt: receiptId, retry: "—" });
  selectedCase.actionId = actionId;
  selectedCase.status = "Action/Execution";
  selectedCase.nextAction = "بازبینی Receipt و ثبت Outcome";
  addAudit(state, { actor, source, caseId, entityType: "Run", entityId: createdRunId, change: `Local run succeeded · ${receiptId}`, from: "Approved", to: "succeeded" });
  return { state: persist(state), runId: createdRunId, receiptId, actionId };
}

/** @param {{caseId:string, reason?:string, actor?:string, source?:string}} input */
export function recordOutcome({ caseId, reason = "نتیجه اقدام نمایشی ثبت شد", actor = "مدیر عملیات — دمو", source = "Outcome form — Local demo" }) {
  const state = getOperationalState();
  const selectedCase = state.cases.find((item) => item.caseId === caseId);
  if (!selectedCase) throw new Error("Unknown demo case");
  const successfulRun = state.runs.find((item) => item.caseId === caseId && item.state === "succeeded");
  if (!successfulRun) throw new Error("A successful local run is required");
  const outcomeId = nextId(state, "outcome", "OUT-LOCAL");
  state.outcomes.unshift({ outcomeId, caseId, actionId: selectedCase.actionId, outcomeType: "Local demo outcome", resultStatus: "Recorded", reason: safeText(reason, "نتیجه اقدام نمایشی ثبت شد"), recordedBy: actor, recordedAt: "اکنون · دمو" });
  const from = selectedCase.status;
  selectedCase.outcomeId = outcomeId;
  selectedCase.status = "Resolved";
  selectedCase.nextAction = "مرور نتیجه در Account 360";
  const account = state.accounts.find((item) => item.accountId === selectedCase.accountId);
  if (account) {
    account.nextAction = "مرور Outcome و تعیین پیگیری بعدی";
    account.nextDue = "ثبت‌شده · دمو";
  }
  addAudit(state, { actor, source, caseId, entityType: "Outcome", entityId: outcomeId, change: "Outcome recorded", from, to: "Resolved" });
  return { state: persist(state), outcomeId };
}

/** @param {{issueId:string, state:string, actor?:string, source?:string}} input */
export function updateDataQualityIssue({ issueId, state: nextState, actor = "مالک کیفیت داده", source = "Governance local demo" }) {
  if (!["Open", "Reviewing", "Resolved"].includes(nextState)) throw new Error("Unsupported issue state");
  const state = getOperationalState();
  const issue = state.dataQuality.find((item) => item.issueId === issueId);
  if (!issue) throw new Error("Unknown data quality issue");
  const from = issue.state;
  issue.state = nextState;
  addAudit(state, { actor, source, entityType: "DataQuality", entityId: issueId, change: "Data quality state changed", from, to: nextState });
  return persist(state);
}
