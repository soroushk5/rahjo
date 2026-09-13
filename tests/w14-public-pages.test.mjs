import test from "node:test";
import assert from "node:assert/strict";
import {
  renderMinimalHomePage,
  renderMinimalProductPage,
  renderMinimalTrackPage
} from "../src/features/public/minimalPublicPages.js";
import { publicNavigation } from "../src/app/navigation.js";
import { runtimeData } from "../src/services/runtimeDataFacade.js";

const canonicalPages = [renderMinimalHomePage, renderMinimalProductPage];

test("canonical public site has only home and product destinations", () => {
  assert.deepEqual(publicNavigation.map((item) => [item.path, item.label]), [
    ["/", "خانه"],
    ["/product", "محصول"]
  ]);
  const html = canonicalPages.map((render) => render()).join("\n");
  for (const path of ["/", "/product", "/login"]) assert.match(html, new RegExp(`href="${path}"`));
  for (const path of ["/contact", "/services", "/use-cases", "/how-it-works", "/trust", "/pilot", "/about"]) {
    assert.doesNotMatch(html, new RegExp(`<a[^>]+href="${path}"`));
  }
});

test("public home explains a broad CRM category without narrowing to one industry", () => {
  const html = renderMinimalHomePage();
  assert.match(html, /CRM برای مدیریت مشتری، فروش و کارهای جاری/);
  for (const phrase of ["فروش B2B", "بازرگانی", "خدمات و پروژه", "آموزش و مشاوره", "تیم‌های در حال رشد"]) {
    assert.match(html, new RegExp(phrase));
  }
  for (const area of ["حافظهٔ مشتری", "فروش و پیگیری", "پرونده و اجرا", "اقدام بعدی"]) {
    assert.match(html, new RegExp(area));
  }
  assert.doesNotMatch(html, /CRM و عملیات مشتری برای کسب‌وکارهای خدماتی|شروع بررسی|sw-showcases/);
});

test("canonical public copy is concise and avoids intelligence positioning", () => {
  const html = canonicalPages.map((render) => render()).join("\n");
  assert.doesNotMatch(html, /\bAI\b|هوش[‌\s-]*مصنوعی/i);
  for (const phrase of ["Relaticle زنده", "MCP زنده", "production-ready", "پرداخت واقعی متصل است"]) {
    assert.doesNotMatch(html, new RegExp(phrase, "i"));
  }
});

test("legacy tracking route remains safe and sends users to secure login", () => {
  const html = renderMinimalTrackPage();
  assert.match(html, /href="\/login"/);
  assert.doesNotMatch(html, /فرم|کد پیگیری/);
});

test("public header uses a validated server user rather than backend readiness as authentication", async () => {
  const config = { mode: "server", apiBase: "https://api.rahjo.example", buildSha: "server-sha" };
  const envelope = {
    dataMode: "server",
    version: 1,
    workspace: { id: "workspace-a", name: "رهجو" },
    user: { id: "user-a", email: "owner@rahjo.example", name: "مالک رهجو", role: "owner" },
    projection: { cases: [] }
  };
  const authenticatedFetch = async (url) => String(url).endsWith("/csrf")
    ? new Response(JSON.stringify({ dataMode: "server", csrfToken: "rahjo_csrf_abcdefghijklmnopqrstuvwxyz" }), { status: 200 })
    : new Response(JSON.stringify(envelope), { status: 200 });

  await runtimeData.initialize(config, { fetchImpl: authenticatedFetch });
  assert.match(renderMinimalHomePage(), /data-cta="header-access"[^>]+href="\/dashboard"/);

  await runtimeData.initialize(config, { fetchImpl: async () => new Response(null, { status: 401 }) });
  assert.match(renderMinimalHomePage(), /data-cta="header-access"[^>]+href="\/login"/);

  await runtimeData.initialize(config, {
    fetchImpl: async () => new Response(JSON.stringify({ ...envelope, user: null }), { status: 200 })
  });
  assert.match(renderMinimalHomePage(), /data-cta="header-access"[^>]+href="\/login"/);
});
