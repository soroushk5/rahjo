import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public, login and compact console source surfaces do not introduce intelligence positioning", async () => {
  const [publicPages, publicIntake, login, dashboard] = await Promise.all([
    read("src/features/public/minimalPublicPages.js"),
    read("src/features/public/publicIntakePage.js"),
    read("src/features/auth/loginPage.js"),
    read("src/features/operations/consoleDashboard.js")
  ]);
  const visibleSurface = `${publicPages}\n${publicIntake}\n${login}\n${dashboard}`;
  assert.doesNotMatch(visibleSurface, /\bAI\b|هوش[‌\s-]*مصنوعی/i);
});
