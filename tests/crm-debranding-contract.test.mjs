import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

async function filesUnder(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(path));
    else if (/\.(?:js|mjs|json|html|css|svg)$/i.test(entry.name)) files.push(path);
  }
  return files;
}

test("canonical frontend runtime contains no Rahjo product identity", async () => {
  const files = [
    "index.html",
    "package.json",
    ...await filesUnder("src")
  ];
  const violations = [];
  for (const path of files) {
    const content = await readFile(path, "utf8");
    if (/rahjo|رهجو/i.test(content)) violations.push(path);
  }
  assert.deepEqual(violations, [], `Rahjo identity remains in canonical frontend files: ${violations.join(", ")}`);
});
