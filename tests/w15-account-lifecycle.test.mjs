import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const bootstrap = await readFile(new URL("../src/app/bootstrap.js", import.meta.url), "utf8");
const boundary = await readFile(new URL("../src/app/runtimeBoundary.js", import.meta.url), "utf8");
const pages = await readFile(new URL("../src/features/auth/accountLifecyclePages.js", import.meta.url), "utf8");
const shell = await readFile(new URL("../src/app/appShell.js", import.meta.url), "utf8");

test("account lifecycle routes stay available in fail-closed server mode", () => {
  for (const path of ["/accept-invite", "/recover-account", "/account"]) {
    assert.match(bootstrap, new RegExp(`path: \\"${path.replaceAll("/", "\\/")}\\"`));
    assert.match(boundary, new RegExp(path.replaceAll("/", "\\/")));
  }
});

test("public account flows keep secrets in URL fragments and never add open signup", () => {
  assert.match(pages, /location\.hash/);
  assert.match(pages, /history\.replaceState/);
  assert.match(pages, /\/api\/v1\/invitations\/accept/);
  assert.match(pages, /\/api\/v1\/account\/reset/);
  assert.match(pages, /\/api\/v1\/account\/recovery/);
  assert.doesNotMatch(pages, /signup|ثبت.?نام عمومی/i);
});

test("authenticated console exposes account management without putting credentials in browser storage", () => {
  assert.match(shell, /href=\"\/account\"/);
  assert.match(pages, /credentials: \"include\"/);
  assert.match(pages, /\/api\/v1\/members\/invitations/);
  assert.match(pages, /\/api\/v1\/account\/password/);
  assert.match(pages, /\/api\/v1\/account\/recovery-codes/);
  assert.doesNotMatch(pages, /localStorage|sessionStorage/);
});
