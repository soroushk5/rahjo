import test from "node:test";
import assert from "node:assert/strict";
import {
  renderAlignedAboutPage,
  renderAlignedContactPage,
  renderAlignedPilotPage,
  renderAlignedTrackRequestPage,
  renderAlignedTrustPage
} from "../src/features/public/alignedEntryPages.js";

test("W14 entry surfaces do not render legacy browser-local contact or tracking forms", () => {
  const html = [renderAlignedContactPage(), renderAlignedTrackRequestPage()].join("\n");
  assert.doesNotMatch(html, /id="contact-form"/);
  assert.doesNotMatch(html, /id="track-form"/);
  assert.doesNotMatch(html, /درخواست شما در دموی محلی ثبت شد/);
});

test("W14 contact starts through the secure operational case entry", () => {
  const html = renderAlignedContactPage();
  assert.match(html, /href="\/cases\/new"/);
  assert.match(html, /شروع ثبت پرونده/);
  assert.match(html, /مرز داده روشن است/);
});

test("W14 trust surface states the current live versus production-ready boundary", () => {
  const html = renderAlignedTrustPage();
  assert.match(html, /Live است، اما هنوز production-ready کامل اعلام نشده/);
  assert.match(html, /Workspace isolation/);
  assert.match(html, /Fail closed/);
  assert.match(html, /Relaticle\/MCP/);
});

test("W14 pilot and about pages preserve operations-before-AI principles", () => {
  const html = `${renderAlignedPilotPage()}\n${renderAlignedAboutPage()}`;
  assert.match(html, /Operational Loop/);
  assert.match(html, /عملیات قبل از AI/);
  assert.match(html, /شواهد قبل از ادعا/);
});
