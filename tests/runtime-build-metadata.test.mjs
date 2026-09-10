import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { injectRuntimeMetadata, runtimeHealthFields } from "../scripts/runtime-metadata.mjs";

test("Hostinger build injects identical non-secret runtime metadata into HTML and health", () => {
  const buildSha = "0123456789abcdef0123456789abcdef01234567";
  const apiBase = "https://api.rahjo.example";
  const expected = { mode: "server", apiBase, buildSha };
  const index = injectRuntimeMetadata(readFileSync("index.html", "utf8"), expected);
  const health = { commit: buildSha, ...runtimeHealthFields(expected) };
  const match = index.match(/<script id="rahjo-runtime-config" type="application\/json">([\s\S]*?)<\/script>/);
  assert.ok(match);
  const runtime = JSON.parse(match[1]);

  assert.deepEqual(runtime, { mode: "server", apiBase, buildSha });
  assert.equal(health.runtimeMode, runtime.mode);
  assert.equal(health.apiBase, runtime.apiBase);
  assert.equal(health.buildSha, runtime.buildSha);
  assert.equal(health.commit, runtime.buildSha);
  assert.doesNotMatch(index, /password|bearer|api[_-]?key/i);
});

test("application runtime initializes before routing and gates every route", () => {
  const bootstrap = readFileSync("src/app/bootstrap.js", "utf8");
  assert.ok(bootstrap.indexOf("await initializeRuntimeFromDocument()") < bootstrap.indexOf("router.start()"));
  assert.match(bootstrap, /\.map\(applyRuntimeBoundary\)/);
});
