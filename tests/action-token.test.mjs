import test from "node:test";
import assert from "node:assert/strict";
import { parseOneTimeToken } from "../src/features/auth/actionToken.js";

const invite = "crm_invite_" + "a".repeat(43);
const reset = "rahjo_reset_" + "b".repeat(43);

test("account activation accepts a pasted full invitation link when browser strips the fragment", () => {
  assert.equal(parseOneTimeToken("https://crm.example.test/accept-invite#token=" + invite), invite);
  assert.equal(parseOneTimeToken(invite), invite);
});
test("account reset accepts a pasted full reset link or raw one-time token", () => {
  assert.equal(parseOneTimeToken("https://crm.example.test/recover-account#mode=reset&token=" + reset, "reset"), reset);
  assert.equal(parseOneTimeToken(reset, "reset"), reset);
});
test("tokens fail closed on mismatch, missing value, unsafe links and malformed input", () => {
  assert.equal(parseOneTimeToken("https://crm.example.test/recover-account#mode=invite&token=" + reset, "reset"), "");
  assert.equal(parseOneTimeToken("https://example.test/path", "reset"), "");
  assert.equal(parseOneTimeToken("token=bad"), "");
  assert.equal(parseOneTimeToken(""), "");
});
