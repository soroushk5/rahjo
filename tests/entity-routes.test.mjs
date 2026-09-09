import assert from "node:assert/strict";
import test from "node:test";
import { entityHref, readRouteContext, routeWithContext } from "../src/app/entityRoutes.js";

test("entity routes preserve stable IDs in query context", () => {
  const href = routeWithContext("/services", { account: "ACC-DEMO-001", case: "CASE-DEMO-101", service: "SVC-DEMO-001" });
  assert.equal(href, "/services?account=ACC-DEMO-001&case=CASE-DEMO-101&service=SVC-DEMO-001");
  assert.deepEqual(readRouteContext(`https://rahjo.local${href}`), {
    path: "/services",
    account: "ACC-DEMO-001",
    case: "CASE-DEMO-101",
    service: "SVC-DEMO-001"
  });
});

test("search targets resolve to owning product surfaces", () => {
  assert.equal(entityHref({ type: "account", accountId: "ACC-DEMO-001" }), "/crm?account=ACC-DEMO-001");
  assert.equal(entityHref({ type: "case", caseId: "CASE-DEMO-101", serviceId: "SVC-DEMO-001" }), "/services?case=CASE-DEMO-101&service=SVC-DEMO-001");
  assert.equal(entityHref({ type: "run", runId: "RUN-DEMO-001", caseId: "CASE-DEMO-101" }), "/automation?case=CASE-DEMO-101&run=RUN-DEMO-001");
});
