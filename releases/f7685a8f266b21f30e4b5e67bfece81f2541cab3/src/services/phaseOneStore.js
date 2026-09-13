// @ts-nocheck
import {
  seedActivities,
  seedApprovals,
  seedCustomers,
  seedDocuments,
  seedOpportunities,
  seedRequests,
  seedTasks,
  seedTransactions,
  serviceCatalog
} from "../data/phaseOneData.js";

const STORAGE_KEY = "rahjo.phase-one.demo.v2";
const MAX_COLLECTION_SIZE = 500;
const unsafeMarkupPattern = /[<>"'`]/g;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function storage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function initialState() {
  return {
    version: 2,
    customers: clone(seedCustomers),
    opportunities: clone(seedOpportunities),
    requests: clone(seedRequests),
    tasks: clone(seedTasks),
    transactions: clone(seedTransactions),
    documents: clone(seedDocuments),
    activities: clone(seedActivities),
    approvals: clone(seedApprovals),
    selectedCustomerId: "arya-sanat",
    selectedRequestId: "rah-1405-0284",
    requestDraft: null,
    contactSubmissions: []
  };
}

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function safeString(value, fallback = "", max = 240) {
  const source = typeof value === "string" || typeof value === "number" ? String(value) : "";
  const normalized = source
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(unsafeMarkupPattern, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
  return normalized || fallback;
}

function safeId(value, fallback = "") {
  const id = safeString(value, "", 120).replace(/[^\p{L}\p{N}._:-]/gu, "");
  return id || fallback;
}

function safeNumber(value, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(0, number)) : fallback;
}

function safeEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function safeList(value, fallback, mapper, { requireNonEmpty = false } = {}) {
  const supplied = Array.isArray(value);
  const source = supplied ? value : clone(fallback);
  let normalized = source.slice(0, MAX_COLLECTION_SIZE).map(mapper).filter(Boolean);
  if ((!supplied || (requireNonEmpty && normalized.length === 0)) && fallback.length) {
    normalized = clone(fallback).slice(0, MAX_COLLECTION_SIZE).map(mapper).filter(Boolean);
  }
  return normalized;
}

function normalizeContact(value) {
  const item = asRecord(value);
  if (!item) return null;
  return {
    name: safeString(item.name, "شخص تماس", 120),
    role: safeString(item.role, "نماینده مجموعه", 120),
    phone: safeString(item.phone, "ثبت‌نشده", 80)
  };
}

function normalizeCustomer(value) {
  const item = asRecord(value);
  const id = safeId(item?.id);
  if (!item || !id) return null;
  return {
    id,
    name: safeString(item.name, "مشتری بدون نام", 160),
    type: safeString(item.type, "سازمان", 80),
    industry: safeString(item.industry, "ثبت‌نشده", 120),
    phone: safeString(item.phone, "ثبت‌نشده", 80),
    email: safeString(item.email, "ثبت‌نشده", 160),
    address: safeString(item.address, "ثبت‌نشده", 240),
    owner: safeString(item.owner, "نسترن احمدی", 120),
    status: safeString(item.status, "مشتری جدید", 80),
    since: safeString(item.since, "۱۴۰۵", 40),
    credit: safeNumber(item.credit),
    balance: safeNumber(item.balance),
    contacts: safeList(item.contacts, [], normalizeContact)
  };
}

function normalizeOpportunity(value) {
  const item = asRecord(value);
  const id = safeId(item?.id);
  if (!item || !id) return null;
  return {
    id,
    accountId: safeId(item.accountId),
    title: safeString(item.title, "فرصت بدون عنوان", 180),
    serviceId: safeId(item.serviceId),
    value: safeNumber(item.value),
    probability: safeNumber(item.probability, 0, 100),
    owner: safeString(item.owner, "ثبت‌نشده", 120),
    source: safeString(item.source, "ثبت‌نشده", 100),
    stage: safeString(item.stage, "نیازسنجی", 80),
    lastInteraction: safeString(item.lastInteraction, "—", 100),
    nextAction: safeString(item.nextAction, "تعیین اقدام بعدی", 240),
    nextDate: safeString(item.nextDate, "—", 80)
  };
}

function normalizeRequestDocument(value) {
  const item = asRecord(value);
  if (!item) return null;
  return {
    name: safeString(item.name, "مدرک بدون نام", 180),
    status: safeString(item.status, "دریافت‌نشده", 80),
    date: safeString(item.date, "—", 80)
  };
}

function normalizeRequest(value) {
  const item = asRecord(value);
  const id = safeId(item?.id);
  if (!item || !id) return null;
  const approvalId = safeId(item.approvalId);
  return {
    id,
    referenceId: safeString(item.referenceId, id, 100),
    accountId: safeId(item.accountId),
    contact: safeString(item.contact, "شخص تماس", 120),
    serviceId: safeId(item.serviceId, serviceCatalog[0].id),
    title: safeString(item.title, "درخواست خدمت", 180),
    channel: safeString(item.channel, "وب‌سایت", 80),
    need: safeString(item.need, "شرح نیاز ثبت نشده است.", 1200),
    status: safeString(item.status, "منتظر اطلاعات", 80),
    paymentStatus: safeString(item.paymentStatus, "تعیین‌نشده", 80),
    operationsStatus: safeString(item.operationsStatus, "در صف", 80),
    owner: safeString(item.owner, "ثبت‌نشده", 120),
    stage: safeString(item.stage, "اطلاعات", 80),
    sla: safeString(item.sla, "پس از بررسی", 100),
    targetDate: safeString(item.targetDate, "پس از تأیید", 100),
    price: safeNumber(item.price),
    discount: safeNumber(item.discount),
    paid: safeNumber(item.paid),
    creditUsed: safeNumber(item.creditUsed),
    createdAt: safeString(item.createdAt, "—", 100),
    closedAt: item.closedAt == null ? null : safeString(item.closedAt, null, 100),
    documents: safeList(item.documents, [], normalizeRequestDocument),
    outcome: safeString(item.outcome, "", 1200),
    nextAction: safeString(item.nextAction, "تعیین اقدام بعدی", 240),
    ...(approvalId ? { approvalId } : {})
  };
}

function normalizeTask(value) {
  const item = asRecord(value);
  const id = safeId(item?.id);
  if (!item || !id) return null;
  return {
    id,
    title: safeString(item.title, "کار بدون عنوان", 240),
    accountId: safeId(item.accountId),
    requestId: safeId(item.requestId),
    opportunityId: safeId(item.opportunityId),
    owner: safeString(item.owner, "ثبت‌نشده", 120),
    due: safeString(item.due, "—", 100),
    priority: safeString(item.priority, "عادی", 80),
    status: safeString(item.status, "امروز", 80),
    result: safeString(item.result, "", 500)
  };
}

function normalizeTransaction(value) {
  const item = asRecord(value);
  const id = safeId(item?.id);
  if (!item || !id) return null;
  return {
    id,
    accountId: safeId(item.accountId),
    requestId: safeId(item.requestId),
    type: safeString(item.type, "تراکنش نمایشی", 120),
    amount: safeNumber(item.amount),
    status: safeString(item.status, "در انتظار", 80),
    date: safeString(item.date, "—", 80)
  };
}

function normalizeDocument(value) {
  const item = asRecord(value);
  const id = safeId(item?.id);
  if (!item || !id) return null;
  return {
    id,
    name: safeString(item.name, "فایل بدون نام", 220),
    type: safeString(item.type, "سند", 100),
    version: safeString(item.version, "۱", 40),
    uploader: safeString(item.uploader, "ثبت‌نشده", 120),
    date: safeString(item.date, "—", 80),
    accountId: safeId(item.accountId),
    requestId: safeId(item.requestId),
    status: safeString(item.status, "نامشخص", 80)
  };
}

function normalizeActivity(value) {
  const item = asRecord(value);
  const id = safeId(item?.id);
  if (!item || !id) return null;
  return {
    id,
    accountId: safeId(item.accountId),
    requestId: safeId(item.requestId),
    type: safeString(item.type, "رخداد", 80),
    title: safeString(item.title, "رخداد ثبت شد", 240),
    detail: safeString(item.detail, "—", 1200),
    actor: safeString(item.actor, "کاربر دمو", 120),
    time: safeString(item.time, "—", 100),
    tone: safeEnum(item.tone, ["neutral", "success", "warning", "danger"], "neutral")
  };
}

function normalizeApproval(value) {
  const item = asRecord(value);
  const id = safeId(item?.id);
  const requestId = safeId(item?.requestId);
  if (!item || !id || !requestId) return null;
  const decidedAt = safeString(item.decidedAt, "", 100);
  const decisionActor = safeString(item.decisionActor, "", 120);
  return {
    id,
    requestId,
    subject: safeString(item.subject, "تأیید انسانی", 240),
    requester: safeString(item.requester, "کاربر دمو", 120),
    approver: safeString(item.approver, "مدیر عملیات", 120),
    reason: safeString(item.reason, "عبور از مرحلهٔ حساس", 500),
    time: safeString(item.time, "—", 100),
    decision: safeEnum(item.decision, ["منتظر تصمیم", "تأیید‌شده", "ردشده"], "منتظر تصمیم"),
    ...(decidedAt ? { decidedAt } : {}),
    ...(decisionActor ? { decisionActor } : {})
  };
}

function normalizeRequestDraft(value) {
  const draft = asRecord(value);
  if (!draft) return null;
  const payload = normalizeRequestPayload(draft.payload);
  const step = Number.isInteger(draft.step) ? Math.min(4, Math.max(0, draft.step)) : 0;
  const referenceId = safeString(draft.referenceId, "", 100);
  const requestId = safeId(draft.requestId);
  return { step, payload, referenceId: referenceId || null, requestId: requestId || null };
}

function normalizeContactSubmission(value) {
  const item = asRecord(value);
  if (!item) return null;
  return {
    id: safeId(item.id),
    createdAt: safeString(item.createdAt, "—", 100),
    name: safeString(item.name, "بدون نام", 120),
    organization: safeString(item.organization, "ثبت‌نشده", 160),
    role: safeString(item.role, "", 120),
    phone: safeString(item.phone, "", 80),
    email: safeString(item.email, "", 160),
    industry: safeString(item.industry, "", 120),
    size: safeString(item.size, "", 80),
    volume: safeString(item.volume, "", 80),
    need: safeString(item.need, "", 1200),
    details: safeString(item.details, "", 1200)
  };
}

function normalizeRequestPayload(value) {
  const payload = asRecord(value) ?? {};
  const serviceId = safeId(payload.serviceId);
  return {
    serviceId: serviceCatalog.some((item) => item.id === serviceId) ? serviceId : serviceCatalog[0].id,
    organization: safeString(payload.organization, "", 160),
    contact: safeString(payload.contact, "", 120),
    role: safeString(payload.role, "", 120),
    phone: safeString(payload.phone, "", 80),
    email: safeString(payload.email, "", 160),
    industry: safeString(payload.industry, "", 120),
    need: safeString(payload.need, "", 1200),
    channel: safeString(payload.channel, "وب‌سایت", 80),
    documentsReady: payload.documentsReady === true
  };
}

function normalize(input) {
  if (!input || typeof input !== "object" || input.version !== 2) return initialState();
  const customers = safeList(input.customers, seedCustomers, normalizeCustomer, { requireNonEmpty: true });
  const requests = safeList(input.requests, seedRequests, normalizeRequest, { requireNonEmpty: true });
  const selectedCustomerId = safeId(input.selectedCustomerId);
  const selectedRequestId = safeId(input.selectedRequestId);
  return {
    version: 2,
    customers,
    opportunities: safeList(input.opportunities, seedOpportunities, normalizeOpportunity),
    requests,
    tasks: safeList(input.tasks, seedTasks, normalizeTask),
    transactions: safeList(input.transactions, seedTransactions, normalizeTransaction),
    documents: safeList(input.documents, seedDocuments, normalizeDocument),
    activities: safeList(input.activities, seedActivities, normalizeActivity),
    approvals: safeList(input.approvals, seedApprovals, normalizeApproval),
    selectedCustomerId: customers.some((item) => item.id === selectedCustomerId) ? selectedCustomerId : customers[0].id,
    selectedRequestId: requests.some((item) => item.id === selectedRequestId) ? selectedRequestId : requests[0].id,
    requestDraft: normalizeRequestDraft(input.requestDraft),
    contactSubmissions: safeList(input.contactSubmissions, [], normalizeContactSubmission).slice(-20)
  };
}

export function readDemoState() {
  const target = storage();
  if (!target) return initialState();
  try {
    const raw = target.getItem(STORAGE_KEY);
    return raw ? normalize(JSON.parse(raw)) : initialState();
  } catch {
    return initialState();
  }
}

function writeDemoState(state) {
  const target = storage();
  if (!target) return;
  try {
    target.setItem(STORAGE_KEY, JSON.stringify(normalize(state)));
  } catch {
    // Persistence is optional for the static demo.
  }
}

function update(mutator) {
  const state = readDemoState();
  const result = mutator(state) ?? state;
  writeDemoState(result);
  return result;
}

export function resetDemoState() {
  const state = initialState();
  writeDemoState(state);
  return state;
}

export function setSelectedCustomerId(customerId) {
  const selectedCustomerId = safeId(customerId);
  update((state) => state.customers.some((item) => item.id === selectedCustomerId) ? { ...state, selectedCustomerId } : state);
}

export function setSelectedRequestId(requestId) {
  const selectedRequestId = safeId(requestId);
  update((state) => state.requests.some((item) => item.id === selectedRequestId) ? { ...state, selectedRequestId } : state);
}

export function saveRequestDraft(draft) {
  update((state) => ({ ...state, requestDraft: normalizeRequestDraft(draft) }));
}

export function clearRequestDraft() {
  update((state) => ({ ...state, requestDraft: null }));
}

export function addContactSubmission(payload) {
  const submission = normalizeContactSubmission({ ...asRecord(payload), id: `CONTACT-${Date.now()}`, createdAt: new Date().toISOString() });
  if (!submission) return null;
  update((state) => ({ ...state, contactSubmissions: [...state.contactSubmissions, submission].slice(-20) }));
  return submission;
}

function nextReference(state) {
  let number = 290 + state.requests.length;
  while (state.requests.some((item) => item.id === `rah-demo-${number}`)) number += 1;
  return {
    id: `rah-demo-${number}`,
    label: `رهـ-دمو-${new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(number)}`
  };
}

function customerIdFromName(name, customers = []) {
  const ascii = name.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  const base = `customer-${ascii || Date.now()}`;
  let id = base;
  let suffix = 2;
  while (customers.some((item) => item.id === id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  return id;
}

export function createServiceRequest(payload) {
  const safePayload = normalizeRequestPayload(payload);
  if (!safePayload.organization) throw new Error("Organization is required");
  let createdRequest;
  update((state) => {
    const service = serviceCatalog.find((item) => item.id === safePayload.serviceId) ?? serviceCatalog[0];
    let customer = state.customers.find((item) => item.name.trim() === safePayload.organization);
    const isNewCustomer = !customer;
    if (!customer) {
      customer = {
        id: customerIdFromName(safePayload.organization, state.customers),
        name: safePayload.organization,
        type: "سازمان",
        industry: safePayload.industry || "ثبت‌نشده",
        phone: safePayload.phone || "ثبت‌نشده",
        email: safePayload.email || "ثبت‌نشده",
        address: "ثبت‌نشده",
        owner: "نسترن احمدی",
        status: "مشتری جدید",
        since: "۱۴۰۵",
        credit: 0,
        balance: 0,
        contacts: [{ name: safePayload.contact || "شخص تماس", role: safePayload.role || "نماینده مجموعه", phone: safePayload.phone || "ثبت‌نشده" }]
      };
      state.customers.unshift(customer);
    }

    const reference = nextReference(state);
    const documentsReady = safePayload.documentsReady;
    const status = documentsReady ? (service.pricingMode === "quote" ? "منتظر پیشنهاد" : "منتظر پرداخت") : "منتظر اطلاعات";
    const stage = documentsReady ? (service.pricingMode === "quote" ? "پیشنهاد" : "پرداخت") : "مدارک";
    createdRequest = {
      id: reference.id,
      referenceId: reference.label,
      accountId: customer.id,
      contact: safePayload.contact || "شخص تماس",
      serviceId: service.id,
      title: service.title,
      channel: safePayload.channel,
      need: safePayload.need || service.summary,
      status,
      paymentStatus: service.price ? "در انتظار" : "تعیین‌نشده",
      operationsStatus: "در صف",
      owner: service.owner,
      stage,
      sla: service.sla,
      targetDate: "پس از تأیید",
      price: service.price,
      discount: 0,
      paid: 0,
      creditUsed: 0,
      createdAt: "همین حالا",
      closedAt: null,
      documents: service.documents.map((name, index) => ({ name, status: documentsReady || index === 0 ? "دریافت‌شده" : "دریافت‌نشده", date: documentsReady || index === 0 ? "امروز" : "—" })),
      outcome: "",
      nextAction: documentsReady ? (service.price ? "ثبت پرداخت نمایشی" : "آماده‌سازی پیشنهاد قیمت") : "تکمیل مدارک موردنیاز"
    };

    state.requests.unshift(createdRequest);
    state.tasks.unshift({
      id: `TK-${500 + state.tasks.length}`,
      title: createdRequest.nextAction,
      accountId: customer.id,
      requestId: createdRequest.id,
      opportunityId: "",
      owner: createdRequest.owner,
      due: "امروز",
      priority: "بالا",
      status: "امروز",
      result: ""
    });
    state.activities.unshift({
      id: `EV-${800 + state.activities.length}`,
      accountId: customer.id,
      requestId: createdRequest.id,
      type: "درخواست",
      title: "درخواست خدمت ثبت شد",
      detail: `${createdRequest.referenceId} از کانال ${createdRequest.channel} ثبت شد.`,
      actor: isNewCustomer ? "مشتری جدید" : customer.name,
      time: "همین حالا",
      tone: "neutral"
    });
    state.selectedCustomerId = customer.id;
    state.selectedRequestId = createdRequest.id;
    state.requestDraft = null;
    return state;
  });
  return createdRequest;
}

function searchText(parts) {
  return safeString(parts.filter(Boolean).join(" "), "", 1600).toLocaleLowerCase("fa");
}

export function searchIndex() {
  const state = readDemoState();
  const customerNames = new Map(state.customers.map((item) => [item.id, item.name]));
  return [
    ...state.customers.map((item) => ({
      type: "customer",
      id: item.id,
      customerId: item.id,
      accountId: item.id,
      label: item.name,
      meta: `مشتری · ${item.status} · ${item.owner}`,
      href: "/customers/detail",
      searchText: searchText([item.id, item.name, item.type, item.industry, item.phone, item.email, item.owner, item.status])
    })),
    ...state.requests.map((item) => ({
      type: "request",
      id: item.id,
      requestId: item.id,
      accountId: item.accountId,
      label: `${item.referenceId} · ${item.title}`,
      meta: `درخواست · ${customerNames.get(item.accountId) ?? "مشتری نامشخص"} · ${item.status}`,
      href: "/requests/detail",
      searchText: searchText([item.id, item.referenceId, item.title, item.need, item.contact, item.owner, item.status, item.stage, customerNames.get(item.accountId)])
    })),
    ...state.opportunities.map((item) => ({
      type: "opportunity",
      id: item.id,
      opportunityId: item.id,
      accountId: item.accountId,
      label: item.title,
      meta: `فرصت · ${customerNames.get(item.accountId) ?? "مشتری نامشخص"} · ${item.stage}`,
      href: "/sales",
      searchText: searchText([item.id, item.title, item.source, item.stage, item.owner, item.nextAction, customerNames.get(item.accountId)])
    })),
    ...state.documents.map((item) => ({
      type: "document",
      id: item.id,
      documentId: item.id,
      requestId: item.requestId,
      accountId: item.accountId,
      label: item.name,
      meta: `سند · ${item.type} · ${customerNames.get(item.accountId) ?? "مشتری نامشخص"}`,
      href: "/documents",
      searchText: searchText([item.id, item.name, item.type, item.status, item.uploader, item.requestId, customerNames.get(item.accountId)])
    })),
    ...state.tasks.map((item) => ({
      type: "task",
      id: item.id,
      taskId: item.id,
      requestId: item.requestId,
      accountId: item.accountId,
      label: item.title,
      meta: `کار · ${item.owner} · ${item.status}`,
      href: "/tasks",
      searchText: searchText([item.id, item.title, item.owner, item.status, item.priority, item.requestId, customerNames.get(item.accountId)])
    }))
  ];
}

export function completeTask(taskId) {
  update((state) => {
    const task = state.tasks.find((item) => item.id === taskId);
    if (task) {
      task.status = "تکمیل‌شده";
      task.result = "در محیط نمایشی تکمیل شد";
    }
    return state;
  });
}

export function completeRequestDocuments(requestId) {
  update((state) => {
    const request = state.requests.find((item) => item.id === requestId);
    if (!request) return state;
    request.documents = request.documents.map((item) => ({ ...item, status: "دریافت‌شده", date: item.date === "—" ? "امروز" : item.date }));
    if (!request.price) request.price = 220000000;
    request.paymentStatus = "در انتظار";
    request.status = "منتظر پرداخت";
    request.stage = "پرداخت";
    request.nextAction = "ثبت پرداخت نمایشی";
    state.activities.unshift({ id: `EV-${840 + state.activities.length}`, accountId: request.accountId, requestId, type: "مدرک", title: "مدارک درخواست تکمیل شد", detail: "پیشنهاد قیمت آماده و درخواست وارد مرحلهٔ پرداخت شد.", actor: "کاربر دمو", time: "همین حالا", tone: "success" });
    return state;
  });
}

export function registerPayment(requestId) {
  update((state) => {
    const request = state.requests.find((item) => item.id === requestId);
    const documentsReady = request?.documents.every((item) => item.status === "دریافت‌شده");
    if (!request || !documentsReady || request.price <= 0 || request.paymentStatus === "پرداخت‌شده") return state;
    const amount = Math.max(0, request.price - request.discount - request.paid - request.creditUsed);
    request.paid += amount;
    request.paymentStatus = "پرداخت‌شده";
    request.status = "آماده اجرا";
    request.stage = "اجرا";
    request.operationsStatus = "آماده تخصیص";
    request.nextAction = "تخصیص کار و شروع اجرا";
    state.transactions.unshift({ id: `TR-${950 + state.transactions.length}`, accountId: request.accountId, requestId, type: "پرداخت نمایشی", amount, status: "ثبت‌شده", date: "امروز" });
    state.activities.unshift({ id: `EV-${850 + state.activities.length}`, accountId: request.accountId, requestId, type: "پرداخت", title: "پرداخت نمایشی تکمیل شد", detail: "درخواست وارد صف اجرا شد.", actor: "کاربر دمو", time: "همین حالا", tone: "success" });
    return state;
  });
}

export function assignAndStartRequest(requestId) {
  update((state) => {
    const request = state.requests.find((item) => item.id === requestId);
    if (!request || request.paymentStatus !== "پرداخت‌شده" || ["در حال اجرا", "تحویل‌شده"].includes(request.status)) return state;
    request.status = "در حال اجرا";
    request.stage = "اجرا";
    request.operationsStatus = "در حال اجرا";
    request.owner = "سارا احمدی";
    request.nextAction = "ثبت تأیید انسانی پیش از تحویل";
    let approval = state.approvals.find((item) => item.requestId === requestId && item.decision === "منتظر تصمیم");
    if (!approval) {
      let approvalNumber = 40 + state.approvals.length;
      while (state.approvals.some((item) => item.id === `AP-DEMO-${approvalNumber}`)) approvalNumber += 1;
      approval = {
        id: `AP-DEMO-${approvalNumber}`,
        requestId,
        subject: "تأیید نتیجه پیش از تحویل",
        requester: request.owner,
        approver: "مدیر عملیات",
        reason: "کنترل انسانی نتیجه پیش از بستن درخواست",
        time: "همین حالا",
        decision: "منتظر تصمیم"
      };
      state.approvals.unshift(approval);
      state.activities.unshift({ id: `EV-${865 + state.activities.length}`, accountId: request.accountId, requestId, type: "تأیید", title: "تأیید انسانی درخواست شد", detail: approval.subject, actor: request.owner, time: "همین حالا", tone: "warning" });
    }
    request.approvalId = approval.id;
    state.activities.unshift({ id: `EV-${860 + state.activities.length}`, accountId: request.accountId, requestId, type: "عملیات", title: "اجرای خدمت آغاز شد", detail: "درخواست به سارا احمدی تخصیص یافت.", actor: "مدیر عملیات", time: "همین حالا", tone: "neutral" });
    return state;
  });
}

function approvalForRequest(state, request, decision) {
  return state.approvals.find((item) => item.requestId === request.id
    && (!request.approvalId || item.id === request.approvalId)
    && (!decision || item.decision === decision));
}

export function decideRequestApproval(requestId, decision, actor = "مدیر عملیات") {
  if (!["تأیید‌شده", "ردشده"].includes(decision)) throw new Error("Unsupported approval decision");
  let decidedApproval = null;
  update((state) => {
    const request = state.requests.find((item) => item.id === requestId);
    if (!request) return state;
    const approval = approvalForRequest(state, request, "منتظر تصمیم");
    if (!approval) return state;
    const previousDecision = approval.decision;
    approval.decision = decision;
    approval.decisionActor = safeString(actor, "مدیر عملیات", 120);
    approval.decidedAt = "همین حالا";
    if (decision === "تأیید‌شده") {
      request.operationsStatus = request.status === "در حال اجرا" ? "در حال اجرا" : request.operationsStatus;
      request.nextAction = request.status === "در حال اجرا" ? "ثبت نتیجه و آماده‌سازی تحویل" : request.nextAction;
    } else {
      request.operationsStatus = "متوقف";
      request.nextAction = "بازبینی تصمیم ردشده توسط مالک درخواست";
    }
    state.activities.unshift({
      id: `EV-${870 + state.activities.length}`,
      accountId: request.accountId,
      requestId,
      type: "تأیید",
      title: decision === "تأیید‌شده" ? "تأیید انسانی ثبت شد" : "تأیید انسانی رد شد",
      detail: `${approval.subject} · ${previousDecision} ← ${decision}`,
      actor: approval.decisionActor,
      time: "همین حالا",
      tone: decision === "تأیید‌شده" ? "success" : "warning"
    });
    decidedApproval = clone(approval);
    return state;
  });
  return decidedApproval;
}

export function approveRequest(requestId, actor) {
  return decideRequestApproval(requestId, "تأیید‌شده", actor);
}

export function rejectRequest(requestId, actor) {
  return decideRequestApproval(requestId, "ردشده", actor);
}

export function deliverRequest(requestId, outcome = "نتیجهٔ خدمت در محیط نمایشی ثبت و تحویل شد.") {
  update((state) => {
    const request = state.requests.find((item) => item.id === requestId);
    if (!request || request.status !== "در حال اجرا" || !approvalForRequest(state, request, "تأیید‌شده")) return state;
    const safeOutcome = safeString(outcome, "نتیجهٔ خدمت در محیط نمایشی ثبت و تحویل شد.", 1200);
    request.status = "تحویل‌شده";
    request.stage = "تحویل";
    request.operationsStatus = "تکمیل";
    request.outcome = safeOutcome;
    request.closedAt = "امروز";
    request.nextAction = "پیگیری رضایت در ۳۰ روز آینده";
    state.documents.unshift({ id: `DOC-${260 + state.documents.length}`, name: `نتیجه ${request.referenceId}.pdf`, type: "نتیجه", version: "۱", uploader: request.owner, date: "امروز", accountId: request.accountId, requestId, status: "تحویل‌شده" });
    state.tasks.unshift({ id: `TK-${550 + state.tasks.length}`, title: "پیگیری رضایت پس از تحویل", accountId: request.accountId, requestId, opportunityId: "", owner: "نسترن احمدی", due: "۳۰ روز دیگر", priority: "عادی", status: "این هفته", result: "" });
    state.activities.unshift({ id: `EV-${880 + state.activities.length}`, accountId: request.accountId, requestId, type: "تحویل", title: "نتیجهٔ خدمت تحویل شد", detail: safeOutcome, actor: request.owner, time: "همین حالا", tone: "success" });
    return state;
  });
}
