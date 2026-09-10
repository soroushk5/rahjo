import test from "node:test";
import assert from "node:assert/strict";
import {
  canContinue,
  createVerificationState,
  nextVerificationStep,
  selectService,
  updateVerificationFields
} from "../src/domain/verification.js";

test("cluster selection unlocks the first step", () => {
  const initial = createVerificationState();
  assert.equal(canContinue(initial), false);
  const selected = selectService(initial, "identity");
  assert.equal(canContinue(selected), true);
});

test("access details require organization, purpose and volume", () => {
  let state = nextVerificationStep(selectService(createVerificationState(), "identity"));
  state = updateVerificationFields(state, {
    organization: "شرکت نمونه",
    purpose: "پذیرش مشتری در فرایند سازمانی",
    monthlyVolume: "pilot"
  });
  assert.equal(canContinue(state), true);
});
