import assert from "node:assert/strict";
import test from "node:test";
import { entityHref, readRouteContext, routeWithContext } from "../src/app/entityRoutes.js";

test("entity routes preserve stable IDs in query context", () => {
  const href = routeWithContext("/requests/detail", { customer: "arya-sanat", request: "rah-1405-0284", service: "sales-process" });
  assert.equal(href, "/requests/detail?customer=arya-sanat&request=rah-1405-0284&service=sales-process");
  assert.deepEqual(readRouteContext(`https://rahjo.local${href}`), {
    path: "/requests/detail",
    customer: "arya-sanat",
    request: "rah-1405-0284",
    service: "sales-process"
  });
});

test("phase-one search targets resolve to their owning product surfaces", () => {
  assert.equal(entityHref({ type: "customer", customerId: "arya-sanat" }), "/customers/detail?customer=arya-sanat");
  assert.equal(entityHref({ type: "account", accountId: "arya-sanat" }), "/customers/detail?customer=arya-sanat");
  assert.equal(entityHref({ type: "request", requestId: "rah-1405-0284" }), "/requests/detail?request=rah-1405-0284");
  assert.equal(entityHref({ type: "case", caseId: "rah-1405-0284" }), "/requests/detail?request=rah-1405-0284");
  assert.equal(entityHref({ type: "opportunity", opportunityId: "OPP-301" }), "/sales?opportunity=OPP-301");
  assert.equal(entityHref({ type: "service", serviceId: "sales-process" }), "/services-admin?service=sales-process");
  assert.equal(entityHref({ type: "document", documentId: "DOC-201" }), "/documents?document=DOC-201");
  assert.equal(entityHref({ type: "issue", issueId: "DQ-18" }), "/audit?issue=DQ-18");
  assert.equal(entityHref({ type: "audit", auditId: "AUD-18" }), "/audit?issue=AUD-18");
});

test("hash-hosted deep links retain canonical query context", () => {
  assert.deepEqual(readRouteContext("https://raw.githack.com/example/rahjo/main/index.html#/customers/detail?customer=arya-sanat"), {
    path: "/customers/detail",
    customer: "arya-sanat"
  });
});
