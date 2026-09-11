import assert from "node:assert/strict";
import test from "node:test";
import { applyRuntimeBoundary, maybeStartBrowserBootstrap } from "../src/app/runtimeBoundary.js";
import { runtimeData } from "../src/services/runtimeDataFacade.js";

test("server failure gates existing demo render and mount functions", async () => {
  let renderCalls = 0;
  let mountCalls = 0;
  const guarded = applyRuntimeBoundary({
    title: "داشبورد",
    render: () => { renderCalls += 1; return "ACC-DEMO-001"; },
    mount: () => { mountCalls += 1; }
  });

  await runtimeData.initialize(
    { mode: "server", apiBase: "https://api.rahjo.example", buildSha: "server-sha" },
    { fetchImpl: async () => { throw new Error("offline"); } }
  );
  const html = guarded.render();
  guarded.mount();

  assert.equal(renderCalls, 0);
  assert.equal(mountCalls, 0);
  assert.doesNotMatch(html, /ACC-DEMO-001/);
  assert.match(html, /دادهٔ Golden Demo.*جایگزین نمایش داده نمی‌شود/);
});

test("server authentication state renders a distinct login without demo content", async () => {
  const guarded = applyRuntimeBoundary({
    title: "ورود مهمان به دمو",
    render: () => "GOLDEN-DEMO-LOGIN",
    mount: () => {}
  });
  await runtimeData.initialize(
    { mode: "server", apiBase: "https://api.rahjo.example", buildSha: "server-sha" },
    { fetchImpl: async () => new Response(null, { status: 401 }) }
  );
  const html = guarded.render();
  assert.match(html, /id="rahjo-server-login"/);
  assert.match(html, /workspaceSlug/);
  assert.doesNotMatch(html, /GOLDEN-DEMO-LOGIN/);
  assert.doesNotMatch(html, /ورود مهمان/);
});

test("explicit demo mode delegates to the unchanged render and mount functions", async () => {
  let renderCalls = 0;
  let mountCalls = 0;
  const guarded = applyRuntimeBoundary({
    title: "داشبورد",
    render: () => { renderCalls += 1; return "UNCHANGED-DEMO-ROUTE"; },
    mount: () => { mountCalls += 1; }
  });

  await runtimeData.initialize({ mode: "demo", apiBase: "", buildSha: "demo-sha" });
  assert.equal(guarded.render(), "UNCHANGED-DEMO-ROUTE");
  guarded.mount();
  assert.equal(renderCalls, 1);
  assert.equal(mountCalls, 1);
});

test("server mode preserves the public homepage instead of replacing it with a status wall", async () => {
  const guarded = applyRuntimeBoundary({ path: "/", title: "خانه", render: () => "PUBLIC-RAHJO-HOME" });
  await runtimeData.initialize(
    { mode: "server", apiBase: "https://api.rahjo.example", buildSha: "server-sha" },
    { fetchImpl: async () => new Response(null, { status: 401 }) }
  );
  assert.equal(guarded.render(), "PUBLIC-RAHJO-HOME");
});

test("authenticated server routes render the server projection and never call demo renderers", async () => {
  let demoCalls = 0;
  const guarded = applyRuntimeBoundary({ path: "/dashboard", title: "داشبورد", render: () => { demoCalls += 1; return "CASE-DEMO"; } });
  await runtimeData.initialize(
    { mode: "server", apiBase: "https://api.rahjo.example", buildSha: "server-sha" },
    { fetchImpl: async (url) => String(url).endsWith("/csrf")
      ? new Response(JSON.stringify({ dataMode: "server", csrfToken: "rahjo_csrf_abcdefghijklmnopqrstuvwxyz" }), { status: 200 })
      : new Response(JSON.stringify({
          dataMode: "server", version: 1,
          workspace: { id: "workspace-a", name: "رهجو" },
          user: { name: "مالک رهجو", role: "owner" },
          projection: { cases: [{ id: "CASE-SERVER-001", purpose: "پرونده واقعی", status: "waiting_approval", version: 1 }], approvals: [], runs: [], outcomes: [], receipts: [], auditEvents: [] }
        }), { status: 200, headers: { "Content-Type": "application/json" } }) }
  );
  const html = guarded.render();
  assert.equal(demoCalls, 0);
  assert.match(html, /CASE-SERVER-001/);
  assert.match(html, /محیط زنده/);
  assert.doesNotMatch(html, /CASE-DEMO/);
});

test("a cold Hostinger browser performs one safe API bootstrap hop without looping", () => {
  let replacedWith = "";
  const browserWindow = {
    location: {
      href: "https://rahjo.example.test/login?returnTo=%2Fdashboard",
      replace(value) { replacedWith = value; }
    }
  };
  const config = { mode: "server", apiBase: "https://api.rahjo.example" };

  assert.equal(maybeStartBrowserBootstrap(config, { state: "unavailable", reason: "request-failed" }, browserWindow), true);
  const bootstrap = new URL(replacedWith);
  assert.equal(bootstrap.origin, "https://api.rahjo.example");
  assert.equal(bootstrap.pathname, "/browser-bootstrap");
  const returnUrl = new URL(bootstrap.searchParams.get("return"));
  assert.equal(returnUrl.origin, "https://rahjo.example.test");
  assert.equal(returnUrl.searchParams.get("rahjoApiBootstrap"), "1");

  browserWindow.location.href = returnUrl.toString();
  replacedWith = "";
  assert.equal(maybeStartBrowserBootstrap(config, { state: "unavailable", reason: "request-failed" }, browserWindow), false);
  assert.equal(replacedWith, "");

  browserWindow.location.href = "https://rahjo.example.test/";
  assert.equal(maybeStartBrowserBootstrap(config, { state: "unavailable", reason: "request-failed" }, browserWindow), false);
});
