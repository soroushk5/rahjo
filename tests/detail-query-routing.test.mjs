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
globalThis.window = { localStorage: storage, location: { href: "https://rahjo.local/" } };

const store = await import("../src/services/phaseOneStore.js");
const { renderCustomerDetailPage, renderRequestDetailPage } = await import("../src/features/operations/detailPages.js");
const { customerLink, requestLink } = await import("../src/features/operations/shared.js");

test("customer detail uses a valid query ID and persists the explicit selection", () => {
  storage.clear();
  const state = store.resetDemoState();
  const target = state.customers[1];
  globalThis.window.location.href = `https://rahjo.local/customers/detail?customer=${encodeURIComponent(target.id)}`;

  const html = renderCustomerDetailPage();

  assert.match(html, new RegExp(target.name));
  assert.equal(store.readDemoState().selectedCustomerId, target.id);
});

test("unknown customer query fails safely without substituting the selected customer", () => {
  storage.clear();
  const state = store.resetDemoState();
  globalThis.window.location.href = "https://rahjo.local/customers/detail?customer=customer-missing-404";

  const html = renderCustomerDetailPage();

  assert.match(html, /مشتری پیدا نشد/);
  assert.match(html, /customer-missing-404/);
  assert.match(html, /هیچ رکورد دیگری جایگزین آن نشد/);
  assert.doesNotMatch(html, new RegExp(state.customers[0].name));
  assert.equal(store.readDemoState().selectedCustomerId, state.selectedCustomerId);
});

test("request detail uses a valid query ID and rejects an unknown request", () => {
  storage.clear();
  const state = store.resetDemoState();
  const target = state.requests[1];
  globalThis.window.location.href = `https://rahjo.local/requests/detail?request=${encodeURIComponent(target.id)}`;
  const validHtml = renderRequestDetailPage();
  assert.match(validHtml, new RegExp(target.referenceId));
  assert.equal(store.readDemoState().selectedRequestId, target.id);

  globalThis.window.location.href = "https://rahjo.local/requests/detail?request=request-missing-404";
  const missingHtml = renderRequestDetailPage();
  assert.match(missingHtml, /درخواست پیدا نشد/);
  assert.match(missingHtml, /request-missing-404/);
  assert.doesNotMatch(missingHtml, new RegExp(state.requests[0].referenceId));
  assert.equal(store.readDemoState().selectedRequestId, target.id);
});

test("shared entity links carry canonical query IDs and escape labels", () => {
  const customerHtml = customerLink({ id: "customer-1", name: "<مشتری>" });
  const requestHtml = requestLink({ id: "request-1", referenceId: "<رهـ-۱>" });
  assert.match(customerHtml, /href="\/customers\/detail\?customer=customer-1"/);
  assert.match(requestHtml, /href="\/requests\/detail\?request=request-1"/);
  assert.match(customerHtml, /&lt;مشتری&gt;/);
  assert.match(requestHtml, /&lt;رهـ-۱&gt;/);
  assert.doesNotMatch(`${customerHtml}${requestHtml}`, /<مشتری>|<رهـ-۱>/);
});
