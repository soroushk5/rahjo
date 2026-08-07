import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const index = fs.readFileSync("index.html", "utf8");
const router = fs.readFileSync("src/app/router.js", "utf8");

test("static entrypoint uses deployment-relative asset paths", () => {
  assert.match(index, /href="assets\/favicon\.svg"/);
  assert.match(index, /href="styles\/tokens\.css"/);
  assert.match(index, /src="src\/app\/bootstrap\.js"/);
  assert.doesNotMatch(index, /(?:href|src)="\/(?:assets|styles|src)\//);
});

test("router supports a GitHub Pages project base path", () => {
  assert.match(router, /github\.io/);
  assert.match(router, /this\.basePath/);
  assert.match(router, /rewriteInternalLinks/);
  assert.match(router, /browserPath/);
});
