import assert from "node:assert/strict";
import test from "node:test";
import { applyRuntimeBoundary } from "../src/app/runtimeBoundary.js";
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
