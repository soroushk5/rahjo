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
