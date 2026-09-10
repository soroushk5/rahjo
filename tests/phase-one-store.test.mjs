import assert from "node:assert/strict";
import test from "node:test";

class FakeStorage {
  constructor() { this.data = new Map(); }
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; }
  setItem(key, value) { this.data.set(key, String(value)); }
  removeItem(key) { this.data.delete(key); }
  clear() { this.data.clear(); }
}

const storage = new FakeStorage();
globalThis.window = { localStorage: storage };
const store = await import("../src/services/phaseOneStore.js");

function newRequestPayload() {
  return {
    serviceId: "sales-process", organization: "شرکت آزمون رهجو", contact: "سارا محمدی", role: "مدیرعامل",
    phone: "۰۹۱۲۱۲۳۴۵۶۷", email: "demo@example.com", industry: "خدمات حرفه‌ای",
    need: "طراحی برنامهٔ رشد و پایش نتیجه", channel: "وب‌سایت", documentsReady: false
  };
}

test("demo state seeds the operational system and persists selections", () => {
  storage.clear();
  const initial = store.resetDemoState();
  assert.ok(initial.customers.length >= 4);
  assert.ok(initial.requests.length >= 4);
  store.setSelectedCustomerId(initial.customers[1].id);
  store.setSelectedRequestId(initial.requests[1].id);
  const saved = store.readDemoState();
  assert.equal(saved.selectedCustomerId, initial.customers[1].id);
  assert.equal(saved.selectedRequestId, initial.requests[1].id);
});

test("new service request creates the customer, request, task and event together", () => {
  storage.clear();
  const before = store.resetDemoState();
  const request = store.createServiceRequest(newRequestPayload());
  const after = store.readDemoState();
  assert.equal(after.customers.length, before.customers.length + 1);
  assert.equal(after.requests.length, before.requests.length + 1);
  assert.equal(after.selectedRequestId, request.id);
  assert.equal(after.requests[0].status, "منتظر اطلاعات");
  assert.ok(after.tasks.some((item) => item.requestId === request.id));
  assert.ok(after.activities.some((item) => item.requestId === request.id));
});

test("golden workflow advances one request from intake through payment, execution and delivery", () => {
  storage.clear();
  store.resetDemoState();
  const request = store.createServiceRequest(newRequestPayload());
  store.completeRequestDocuments(request.id);
  assert.equal(store.readDemoState().requests.find((item) => item.id === request.id).stage, "پرداخت");
  store.registerPayment(request.id);
  assert.equal(store.readDemoState().requests.find((item) => item.id === request.id).paymentStatus, "پرداخت‌شده");
  store.assignAndStartRequest(request.id);
  assert.equal(store.readDemoState().requests.find((item) => item.id === request.id).status, "در حال اجرا");
  assert.equal(store.approveRequest(request.id)?.decision, "تأیید‌شده");
  store.deliverRequest(request.id, "گزارش نهایی تحویل مشتری شد.");
  const delivered = store.readDemoState();
  const result = delivered.requests.find((item) => item.id === request.id);
  assert.equal(result.status, "تحویل‌شده");
  assert.equal(result.outcome, "گزارش نهایی تحویل مشتری شد.");
  assert.ok(delivered.documents.some((item) => item.requestId === request.id && item.type === "نتیجه"));
  assert.ok(delivered.tasks.some((item) => item.requestId === request.id && item.title.includes("رضایت")));
});

test("malformed storage falls back to a valid seeded state", () => {
  storage.clear();
  storage.setItem("rahjo.phase-one.demo.v2", "{bad-json");
  const state = store.readDemoState();
  assert.equal(state.version, 2);
  assert.ok(Array.isArray(state.customers));
});

test("persisted phase-one entities are schema-normalized and markup cannot survive as executable HTML", () => {
  storage.clear();
  const poisoned = store.resetDemoState();
  poisoned.customers[0].name = `<img src=x onerror="globalThis.pwned=1">شرکت`;
  poisoned.customers[0].contacts[0].role = `مدیر' onmouseover='globalThis.pwned=1`;
  poisoned.requests[0].need = `<svg/onload=globalThis.pwned=1>`;
  poisoned.requests[0].documents[0].name = `"><script>globalThis.pwned=1</script>`;
  poisoned.opportunities[0].title = `<b>فرصت</b>`;
  poisoned.documents[0].name = `<iframe srcdoc="bad">`;
  poisoned.tasks[0].title = `<a href=javascript:bad>کار</a>`;
  poisoned.approvals[0].subject = `<img src=x onerror=bad>`;
  poisoned.approvals[0].decision = `تأیید‌شده" onclick="bad`;
  poisoned.customers[0].unexpected = `<script>bad</script>`;
  poisoned.requestDraft = { step: 99, payload: { ...newRequestPayload(), organization: `<em>پیش‌نویس</em>` } };
  poisoned.contactSubmissions = [{ id: "CONTACT-1", createdAt: "now", name: `<b>نام</b>`, organization: "نمونه", need: `<script>bad</script>`, unexpected: "kept?" }];
  storage.setItem("rahjo.phase-one.demo.v2", JSON.stringify(poisoned));

  const state = store.readDemoState();
  const exposedStrings = [
    state.customers[0].name,
    state.customers[0].contacts[0].role,
    state.requests[0].need,
    state.requests[0].documents[0].name,
    state.opportunities[0].title,
    state.documents[0].name,
    state.tasks[0].title,
    state.approvals[0].subject,
    state.requestDraft.payload.organization,
    state.contactSubmissions[0].name
  ];
  exposedStrings.forEach((value) => assert.doesNotMatch(value, /[<>"'`]/));
  assert.equal(state.approvals[0].decision, "منتظر تصمیم");
  assert.equal(state.requestDraft.step, 4);
  assert.equal("unexpected" in state.customers[0], false);
  assert.equal("unexpected" in state.contactSubmissions[0], false);
});

test("new request payloads are sanitized before linked customer, request, task and activity records are created", () => {
  storage.clear();
  store.resetDemoState();
  const request = store.createServiceRequest({
    ...newRequestPayload(),
    organization: `<img src=x onerror="bad">شرکت امن`,
    contact: `سارا" autofocus onfocus="bad`,
    need: `<script>bad</script>نیاز واقعی`,
    channel: `وب' onclick='bad`
  });
  const state = store.readDemoState();
  const customer = state.customers.find((item) => item.id === request.accountId);
  const linked = [customer.name, customer.contacts[0].name, request.need, request.channel, state.tasks[0].title, state.activities[0].detail];
  linked.forEach((value) => assert.doesNotMatch(value, /[<>"'`]/));
  assert.match(customer.id, /^customer-[\p{L}\p{N}._:-]+$/u);
});

test("phase-one search index covers customers, requests, opportunities, documents and tasks with navigable entity ids", () => {
  storage.clear();
  store.resetDemoState();
  const index = store.searchIndex();
  assert.deepEqual(new Set(index.map((item) => item.type)), new Set(["customer", "request", "opportunity", "document", "task"]));
  assert.ok(index.every((item) => item.id && item.label && item.meta && item.href && item.searchText));
  const customer = index.find((item) => item.type === "customer");
  const request = index.find((item) => item.type === "request");
  assert.equal(customer.customerId, customer.id);
  assert.equal(customer.accountId, customer.id);
  assert.equal(request.requestId, request.id);
  assert.ok(request.accountId);
});

test("delivery requires the matching human approval and approval decisions are audited", () => {
  storage.clear();
  store.resetDemoState();
  const request = store.createServiceRequest(newRequestPayload());
  store.completeRequestDocuments(request.id);
  store.registerPayment(request.id);
  const beforeApprovalExists = store.readDemoState().activities.length;
  assert.equal(store.approveRequest(request.id), null);
  assert.equal(store.readDemoState().activities.length, beforeApprovalExists);
  store.assignAndStartRequest(request.id);

  const beforeDecision = store.readDemoState();
  const eventCount = beforeDecision.activities.length;
  assert.ok(beforeDecision.approvals.some((item) => item.requestId === request.id && item.decision === "منتظر تصمیم"));
  assert.equal(store.approveRequest("missing-request"), null);
  assert.equal(store.readDemoState().activities.length, eventCount);

  store.deliverRequest(request.id, "نباید تحویل شود");
  assert.equal(store.readDemoState().requests.find((item) => item.id === request.id).status, "در حال اجرا");
  assert.equal(store.approveRequest(request.id)?.decision, "تأیید‌شده");
  const approved = store.readDemoState();
  assert.ok(approved.activities.some((item) => item.requestId === request.id && item.detail.includes("منتظر تصمیم ← تأیید‌شده")));

  store.deliverRequest(request.id, `<img src=x onerror="bad">نتیجه امن`);
  const delivered = store.readDemoState().requests.find((item) => item.id === request.id);
  assert.equal(delivered.status, "تحویل‌شده");
  assert.doesNotMatch(delivered.outcome, /[<>"'`]/);
});

test("a rejected matching approval is audited and cannot authorize delivery", () => {
  storage.clear();
  store.resetDemoState();
  const request = store.createServiceRequest(newRequestPayload());
  store.completeRequestDocuments(request.id);
  store.registerPayment(request.id);
  store.assignAndStartRequest(request.id);
  assert.equal(store.rejectRequest(request.id, "بازبین انسانی")?.decision, "ردشده");
  store.deliverRequest(request.id);
  const state = store.readDemoState();
  assert.equal(state.requests.find((item) => item.id === request.id).status, "در حال اجرا");
  assert.equal(state.requests.find((item) => item.id === request.id).operationsStatus, "متوقف");
  assert.ok(state.activities.some((item) => item.requestId === request.id && item.title === "تأیید انسانی رد شد"));
});
