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

const store = await import("../src/services/prototypeStore.js");

test("prototype store persists cluster, draft and submitted request", () => {
  storage.clear();
  store.setPreferredClusterId("identity");
  store.saveRequestDraft({
    step: "details",
    payload: {
      serviceId: "identity",
      organization: "سازمان نمونه",
      purpose: "احراز هویت متقاضی در فرایند پذیرش",
      monthlyVolume: "pilot"
    },
    referenceId: null
  });
  store.addPrototypeAccessRequest({
    referenceId: "RA-IDENTITY-001",
    serviceId: "identity",
    organization: "سازمان نمونه",
    purpose: "احراز هویت متقاضی در فرایند پذیرش",
    monthlyVolume: "pilot",
    status: "در بررسی",
    createdAt: "2026-08-07T14:00:00.000Z"
  });

  assert.equal(store.getPreferredClusterId(), "identity");
  assert.equal(store.loadRequestDraft()?.payload.organization, "سازمان نمونه");
  assert.equal(store.listPrototypeAccessRequests()[0]?.referenceId, "RA-IDENTITY-001");
});

test("prototype store falls back safely when persisted data is malformed", () => {
  storage.clear();
  storage.setItem("rahjo.prototype.v1", JSON.stringify({
    preferredClusterId: 42,
    requestDraft: { step: "made-up", payload: null },
    accessRequests: [{ referenceId: null }, { referenceId: "RA-X", serviceId: "vehicle", purpose: 20 }],
    atlasFilters: { query: "x".repeat(400), sensitivity: "invalid" },
    dashboardFilters: { query: 123, status: "invalid" }
  }));

  const snapshot = store.readPrototypeSnapshot();
  assert.equal(snapshot.preferredClusterId, null);
  assert.equal(snapshot.requestDraft, null);
  assert.equal(snapshot.accessRequests.length, 1);
  assert.equal(snapshot.accessRequests[0].referenceId, "RA-X");
  assert.equal(snapshot.accessRequests[0].purpose, "");
  assert.equal(snapshot.atlasFilters.query.length, 240);
  assert.equal(snapshot.atlasFilters.sensitivity, "all");
  assert.equal(snapshot.dashboardFilters.query, "");
  assert.equal(snapshot.dashboardFilters.status, "all");
});

test("prototype store clears draft and local requests independently", () => {
  storage.clear();
  store.saveRequestDraft({
    step: "service",
    payload: { serviceId: "vehicle", organization: "", purpose: "", monthlyVolume: "" },
    referenceId: null
  });
  store.addPrototypeAccessRequest({
    referenceId: "RA-VEHICLE-002",
    serviceId: "vehicle",
    organization: "نمونه",
    purpose: "کاربرد نمونه برای تست",
    monthlyVolume: "small",
    status: "در بررسی",
    createdAt: "2026-08-07T14:00:00.000Z"
  });

  store.clearRequestDraft();
  assert.equal(store.loadRequestDraft(), null);
  assert.equal(store.listPrototypeAccessRequests().length, 1);

  store.clearPrototypeAccessRequests();
  assert.equal(store.listPrototypeAccessRequests().length, 0);
});
