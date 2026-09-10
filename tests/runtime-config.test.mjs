import assert from "node:assert/strict";
import test from "node:test";
import { RuntimeConfigurationError, parseRuntimeConfig } from "../src/config/runtimeConfig.js";

test("runtime mode accepts only explicit demo or server values", () => {
  for (const mode of ["", "Demo", "production", "server "]) {
    assert.throws(
      () => parseRuntimeConfig({ mode, apiBase: "", buildSha: "test-sha" }),
      (error) => error instanceof RuntimeConfigurationError && error.code === "invalid-mode"
    );
  }
});

test("explicit demo mode remains isolated from every server API base", () => {
  assert.deepEqual(
    parseRuntimeConfig({ mode: "demo", apiBase: "", buildSha: "demo-sha" }),
    { mode: "demo", apiBase: "", buildSha: "demo-sha" }
  );
  assert.throws(
    () => parseRuntimeConfig({ mode: "demo", apiBase: "https://api.rahjo.example", buildSha: "demo-sha" }),
    (error) => error instanceof RuntimeConfigurationError && error.code === "mixed-runtime-mode"
  );
});

test("server mode requires a safe absolute API base", () => {
  assert.equal(
    parseRuntimeConfig({ mode: "server", apiBase: "https://api.rahjo.example/", buildSha: "server-sha" }).apiBase,
    "https://api.rahjo.example"
  );
  assert.equal(
    parseRuntimeConfig({ mode: "server", apiBase: "http://localhost:8787/", buildSha: "local-sha" }).apiBase,
    "http://localhost:8787"
  );
  for (const apiBase of ["", "api.rahjo.example", "http://api.rahjo.example", "https://token@api.rahjo.example", "https://api.rahjo.example?token=x"]) {
    assert.throws(() => parseRuntimeConfig({ mode: "server", apiBase, buildSha: "server-sha" }));
  }
});
