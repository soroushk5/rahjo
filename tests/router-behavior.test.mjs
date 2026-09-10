import assert from "node:assert/strict";
import test from "node:test";
import { Router } from "../src/app/router.js";
import { legacyRoutePaths, resolveLegacyTarget } from "../src/app/legacyCompatibility.js";

test("retired live URLs resolve to safe phase-one destinations", () => {
  assert.equal(resolveLegacyTarget("/platform"), "/product");
  assert.equal(resolveLegacyTarget("/data"), "/services");
  assert.equal(resolveLegacyTarget("/map"), "/how-it-works");
  assert.equal(resolveLegacyTarget("/dashboard/requests"), "/requests");
  assert.equal(resolveLegacyTarget("/crm", "?account=ACC-DEMO-001"), "/customers?legacyRef=account%3AACC-DEMO-001");
  assert.equal(resolveLegacyTarget("/services", "?case=CASE-001&service=SVC-001"), "/requests?legacyRef=case%3ACASE-001");
  assert.equal(resolveLegacyTarget("/services", "?service=SVC-001"), "/services-admin?legacyRef=service%3ASVC-001");
  assert.equal(resolveLegacyTarget("/services"), null);
  assert.equal(resolveLegacyTarget("/dashboard"), null);
  assert.ok(legacyRoutePaths.includes("/request"));
});

test("legacy references are bounded and arbitrary query data is discarded", () => {
  const malicious = `<img src=x onerror=alert(1)>${"x".repeat(200)}`;
  const target = resolveLegacyTarget("/crm", `?token=secret&account=${encodeURIComponent(malicious)}`);
  assert.ok(target?.startsWith("/customers?legacyRef=account%3A"));
  assert.ok(!target?.includes("token"));
  assert.ok(!target?.includes("secret"));
  assert.ok((new URL(target, "https://rahjo.local").searchParams.get("legacyRef") ?? "").length <= 128);
});

test("RawGitHack hash routes remain stable after repeated rewrites", () => {
  const previousWindow = global.window;
  global.window = {
    location: {
      pathname: "/soroushk5/rahjo/presentation-v2-connected/index.html",
      origin: "https://raw.githack.com"
    }
  };

  try {
    const router = new Router({
      root: /** @type {any} */ ({}),
      routes: [],
      basePath: "",
      routingMode: "hash"
    });

    assert.equal(
      router.browserPath("/data"),
      "/soroushk5/rahjo/presentation-v2-connected/index.html#/data"
    );
    assert.equal(
      router.browserPath("/crm?account=ACC-DEMO-001"),
      "/soroushk5/rahjo/presentation-v2-connected/index.html#/crm?account=ACC-DEMO-001"
    );

    const fakeLink = {
      dataset: {},
      getAttribute(name) {
        if (name === "href") return "/data";
        return null;
      }
    };

    assert.equal(router.logicalPathForLink(/** @type {any} */ (fakeLink)), "/data");

    fakeLink.dataset.routePath = "/data";
    fakeLink.getAttribute = (name) => name === "href"
      ? "/soroushk5/rahjo/presentation-v2-connected/index.html#/data"
      : null;

    assert.equal(router.logicalPathForLink(/** @type {any} */ (fakeLink)), "/data");

    fakeLink.dataset.routePath = "";
    fakeLink.getAttribute = (name) => name === "href"
      ? "/soroushk5/rahjo/presentation-v2-connected/index.html#/crm?account=ACC-DEMO-001"
      : null;
    assert.equal(router.logicalPathForLink(/** @type {any} */ (fakeLink)), "/crm?account=ACC-DEMO-001");
  } finally {
    global.window = previousWindow;
  }
});
