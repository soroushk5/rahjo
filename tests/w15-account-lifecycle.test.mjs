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

  // It is useful for the UI to explicitly say that public signup is closed.
  // What must stay absent is an actual open registration route, endpoint, or form.
  assert.doesNotMatch(bootstrap, /path:\s*["']\/(?:signup|sign-up|register)["']/i);
  assert.doesNotMatch(pages, /\/api\/v1\/(?:signup|sign-up|register)\b/i);
  assert.doesNotMatch(pages, /id=["'][^"']*(?:signup|register)[^"']*["']/i);
});

test("new account passwords require at least 8 characters in the public flows", () => {
  assert.match(pages, /minlength="8"/);
  assert.match(pages, /password\.length < 8/);
  assert.doesNotMatch(pages, /minlength="14"|password\.length < 14/);
});

test("authenticated console exposes account management without putting credentials in browser storage", () => {
  assert.match(shell, /href=\"\/account\"/);
  assert.match(pages, /runtimeData\.sessionRequest/);
  assert.match(pages, /\/api\/v1\/members\/invitations/);
  assert.match(pages, /\/api\/v1\/account\/password/);
  assert.match(pages, /\/api\/v1\/account\/recovery-codes/);
  assert.doesNotMatch(pages, /\/api\/v1\/session\/csrf/);
  assert.doesNotMatch(pages, /localStorage|sessionStorage/);
});

test("owner identity is not prefilled on public login or recovery forms", () => {
  assert.doesNotMatch(boundary, /value=\"owner@rahjo\.local\"/);
  assert.doesNotMatch(pages, /value=\"owner@rahjo\.local\"/);
});
