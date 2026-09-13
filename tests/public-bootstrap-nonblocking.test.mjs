import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const bootstrapUrl = new URL("../src/app/bootstrap.js", import.meta.url);

test("public shell does not wait for backend runtime initialization before routing", async () => {
  const source = await readFile(bootstrapUrl, "utf8");

  assert.doesNotMatch(source, /await\s+initializeRuntimeFromDocument\s*\(\s*\)/);
  assert.match(source, /void\s+initializeRuntimeFromDocument\s*\(\s*\)/);
  assert.ok(source.indexOf("initializeRuntimeFromDocument") < source.lastIndexOf("router.start()"));
});
