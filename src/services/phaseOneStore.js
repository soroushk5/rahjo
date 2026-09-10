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

function validArray(value, fallback) {
  return Array.isArray(value) ? value : clone(fallback);
}

function normalize(input) {
  if (!input || typeof input !== "object" || input.version !== 2) return initialState();
  return {
    version: 2,
    customers: validArray(input.customers, seedCustomers),
    opportunities: validArray(input.opportunities, seedOpportunities),
    requests: validArray(input.requests, seedRequests),
    tasks: validArray(input.tasks, seedTasks),
    transactions: validArray(input.transactions, seedTransactions),
    documents: validArray(input.documents, seedDocuments),
    activities: validArray(input.activities, seedActivities),
    approvals: validArray(input.approvals, seedApprovals),
    selectedCustomerId: typeof input.selectedCustomerId === "string" ? input.selectedCustomerId : "arya-sanat",
    selectedRequestId: typeof input.selectedRequestId === "string" ? input.selectedRequestId : "rah-1405-0284",
    requestDraft: input.requestDraft && typeof input.requestDraft === "object" ? input.requestDraft : null,
    contactSubmissions: Array.isArray(input.contactSubmissions) ? input.contactSubmissions.slice(-20) : []
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
  update((state) => ({ ...state, selectedCustomerId: customerId }));
}

export function setSelectedRequestId(requestId) {
  update((state) => ({ ...state, selectedRequestId: requestId }));
}

export function saveRequestDraft(draft) {
  update((state) => ({ ...state, requestDraft: draft }));
}

export function clearRequestDraft() {
  update((state) => ({ ...state, requestDraft: null }));
}

export function addContactSubmission(payload) {
  const submission = { ...payload, id: `CONTACT-${Date.now()}`, createdAt: new Date().toISOString() };
  update((state) => ({ ...state, contactSubmissions: [...state.contactSubmissions, submission].slice(-20) }));
  return submission;
}

function nextReference(state) {
  const number = 290 + state.requests.length;
  return {
    id: `rah-demo-${number}`,
    label: `رهـ-دمو-${new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(number)}`
  };
}

function customerIdFromName(name) {
  const ascii = name.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  return `customer-${ascii || Date.now()}`;
}

export function createServiceRequest(payload) {
  let createdRequest;
  update((state) => {
    const service = serviceCatalog.find((item) => item.id === payload.serviceId) ?? serviceCatalog[0];
    let customer = state.customers.find((item) => item.name.trim() === payload.organization.trim());
    const isNewCustomer = !customer;
    if (!customer) {
      customer = {
        id: customerIdFromName(payload.organization),
        name: payload.organization.trim(),
        type: "سازمان",
        industry: payload.industry || "ثبت‌نشده",
        phone: payload.phone || "ثبت‌نشده",
        email: payload.email || "ثبت‌نشده",
        address: "ثبت‌نشده",
        owner: "نسترن احمدی",
        status: "مشتری جدید",
        since: "۱۴۰۵",
        credit: 0,
        balance: 0,
        contacts: [{ name: payload.contact || "شخص تماس", role: payload.role || "نماینده مجموعه", phone: payload.phone || "ثبت‌نشده" }]
      };
      state.customers.unshift(customer);
    }

    const reference = nextReference(state);
    const documentsReady = Boolean(payload.documentsReady);
    const status = documentsReady ? (service.pricingMode === "quote" ? "منتظر پیشنهاد" : "منتظر پرداخت") : "منتظر اطلاعات";
    const stage = documentsReady ? (service.pricingMode === "quote" ? "پیشنهاد" : "پرداخت") : "مدارک";
    createdRequest = {
      id: reference.id,
      referenceId: reference.label,
      accountId: customer.id,
      contact: payload.contact || "شخص تماس",
      serviceId: service.id,
      title: service.title,
      channel: payload.channel || "وب‌سایت",
      need: payload.need || service.summary,
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
    request.nextAction = "ثبت نتیجه و آماده‌سازی تحویل";
    state.activities.unshift({ id: `EV-${860 + state.activities.length}`, accountId: request.accountId, requestId, type: "عملیات", title: "اجرای خدمت آغاز شد", detail: "درخواست به سارا احمدی تخصیص یافت.", actor: "مدیر عملیات", time: "همین حالا", tone: "neutral" });
    return state;
  });
}

export function approveRequest(requestId) {
  update((state) => {
    const approval = state.approvals.find((item) => item.requestId === requestId && item.decision === "منتظر تصمیم");
    if (approval) approval.decision = "تأیید‌شده";
    const request = state.requests.find((item) => item.id === requestId);
    if (request) state.activities.unshift({ id: `EV-${870 + state.activities.length}`, accountId: request.accountId, requestId, type: "تأیید", title: "تأیید انسانی ثبت شد", detail: approval?.subject || "مرحلهٔ حساس تأیید شد.", actor: "مدیر عملیات", time: "همین حالا", tone: "success" });
    return state;
  });
}

export function deliverRequest(requestId, outcome = "نتیجهٔ خدمت در محیط نمایشی ثبت و تحویل شد.") {
  update((state) => {
    const request = state.requests.find((item) => item.id === requestId);
    if (!request || request.status !== "در حال اجرا") return state;
    request.status = "تحویل‌شده";
    request.stage = "تحویل";
    request.operationsStatus = "تکمیل";
    request.outcome = outcome;
    request.closedAt = "امروز";
    request.nextAction = "پیگیری رضایت در ۳۰ روز آینده";
    state.documents.unshift({ id: `DOC-${260 + state.documents.length}`, name: `نتیجه ${request.referenceId}.pdf`, type: "نتیجه", version: "۱", uploader: request.owner, date: "امروز", accountId: request.accountId, requestId, status: "تحویل‌شده" });
    state.tasks.unshift({ id: `TK-${550 + state.tasks.length}`, title: "پیگیری رضایت پس از تحویل", accountId: request.accountId, requestId, opportunityId: "", owner: "نسترن احمدی", due: "۳۰ روز دیگر", priority: "عادی", status: "این هفته", result: "" });
    state.activities.unshift({ id: `EV-${880 + state.activities.length}`, accountId: request.accountId, requestId, type: "تحویل", title: "نتیجهٔ خدمت تحویل شد", detail: outcome, actor: request.owner, time: "همین حالا", tone: "success" });
    return state;
  });
}
