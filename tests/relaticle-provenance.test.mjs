import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const lock = JSON.parse(await readFile(new URL("../ops/relaticle/provenance.lock.json", import.meta.url), "utf8"));
const patchManifest = JSON.parse(await readFile(new URL("../ops/relaticle/patches/manifest.json", import.meta.url), "utf8"));

test("Relaticle integration is pinned to the reviewed v3.5.7 artifact", () => {
  assert.equal(lock.upstream.release, "v3.5.7");
  assert.match(lock.upstream.commit, /^[a-f0-9]{40}$/);
  assert.match(lock.upstream.image, /^ghcr\.io\/relaticle\/relaticle@sha256:[a-f0-9]{64}$/);
  assert.match(lock.rahjo.baselineCommit, /^[a-f0-9]{40}$/);
});

test("the approved posture is service separation with an intact deep-fork gate", () => {
  assert.equal(lock.rahjo.integrationMode, "separate-service-clean-adapter");
  assert.equal(lock.rahjo.copiedUpstreamSource, false);
  assert.equal(lock.deepForkApproval.required, true);
  assert.equal(lock.deepForkApproval.granted, false);
  assert.deepEqual(patchManifest.patches, []);
  assert.deepEqual(patchManifest.sourceCopies, []);
});
