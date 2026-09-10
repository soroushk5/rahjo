import assert from "node:assert/strict";
import test from "node:test";
import { commandItems, commandResultsMarkup } from "../src/app/prototypeChrome.js";

test("command search combines destinations with canonical entity targets", () => {
  const items = commandItems([
    { type: "customer", id: "arya-sanat", customerId: "arya-sanat", label: "آریا صنعت", meta: "مشتری", searchText: "آریا صنعت" },
    { type: "request", id: "rah-1405-0284", requestId: "rah-1405-0284", label: "رهـ-۱۴۰۵-۰۲۸۴", meta: "درخواست", searchText: "رهـ-۱۴۰۵-۰۲۸۴" }
  ]);
  const customer = items.find((item) => item.id === "arya-sanat");
  const request = items.find((item) => item.id === "rah-1405-0284");

  assert.ok(items.some((item) => item.resultKind === "destination" && item.href === "/dashboard"));
  assert.equal(customer.href, "/customers/detail?customer=arya-sanat");
  assert.equal(request.href, "/requests/detail?request=rah-1405-0284");
});

test("command results preserve query navigation, escape record data and include an empty-result state", () => {
  const markup = commandResultsMarkup([{
    resultKind: "entity",
    type: "customer",
    id: "customer-1",
    href: "/customers/detail?customer=customer-1",
    label: "<img src=x onerror=alert(1)>",
    meta: "مشتری \"حساس\"",
    searchText: "needle"
  }]);

  assert.match(markup, /data-route-path="\/customers\/detail\?customer=customer-1"/);
  assert.match(markup, /data-command-text="needle/);
  assert.match(markup, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(markup, /<img src=x/);
  assert.match(markup, /data-command-empty[^>]*hidden/);
  assert.match(markup, /نتیجه‌ای برای این عبارت پیدا نشد/);
});
