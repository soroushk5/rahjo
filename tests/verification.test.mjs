import test from "node:test";
import assert from "node:assert/strict";
import {
  canContinue,
  createVerificationState,
  nextVerificationStep,
  selectService,
  updateVerificationFields
} from "../src/domain/verification.js";

test("service selection unlocks the first step", () => {
  const initial = createVerificationState();
  assert.equal(canContinue(initial), false);
  const selected = selectService(initial, "identity");
  assert.equal(canContinue(selected), true);
});

test("details require valid local shapes", () => {
  let state = nextVerificationStep(selectService(createVerificationState(), "identity"));
  state = updateVerificationFields(state, { nationalId: "1234567890", mobile: "09123456789" });
  assert.equal(canContinue(state), true);
});
