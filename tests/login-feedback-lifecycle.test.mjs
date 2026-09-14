import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { loginFeedbackMessage } from "../src/app/runtimeBoundary.js";
import { RUNTIME_DATA_STATES } from "../src/services/runtimeDataFacade.js";

test("failed login feedback stays non-specific and actionable", () => {
  assert.equal(
    loginFeedbackMessage({ state: RUNTIME_DATA_STATES.AUTH, httpStatus: 401 }),
    "اطلاعات ورود یا فضای کاری درست نیست."
  );
  assert.equal(
    loginFeedbackMessage({ state: RUNTIME_DATA_STATES.FORBIDDEN, httpStatus: 403 }),
    "این حساب به فضای کاری درخواستی دسترسی ندارد."
  );
  assert.match(
    loginFeedbackMessage({ state: RUNTIME_DATA_STATES.UNAVAILABLE }),
    /ارتباط با سرویس ورود/
  );
});

test("login mount re-queries the current form after authenticate can rerender the route", async () => {
  const source = await readFile(new URL("../src/app/runtimeBoundary.js", import.meta.url), "utf8");
  const authenticateIndex = source.indexOf("const result = await runtimeData.authenticate");
  const syncIndex = source.indexOf("syncCurrentLoginForm(submitted, result)", authenticateIndex);
  const currentFormIndex = source.indexOf('document.querySelector("#rahjo-server-login")');

  assert.ok(authenticateIndex >= 0, "authenticate call must remain explicit");
  assert.ok(syncIndex > authenticateIndex, "failed login must repair the current DOM after authenticate resolves");
  assert.ok(currentFormIndex >= 0, "login recovery must query the currently rendered form");
  assert.match(source, /currentPassword\.focus\(\)/, "failed login should return focus to the password field");
  assert.match(source, /currentWorkspace\.value = submitted\.workspaceSlug/, "workspace input should survive a failed login rerender");
  assert.match(source, /currentEmail\.value = submitted\.email/, "email input should survive a failed login rerender");
});
