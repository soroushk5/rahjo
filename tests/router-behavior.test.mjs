import assert from "node:assert/strict";
import test from "node:test";
import { Router } from "../src/app/router.js";

test("RawGitHack hash routes remain stable after repeated rewrites", () => {
  const previousWindow = global.window;
  global.window = {
    location: {
      pathname: "/soroushk5/rahjo/presentation-v2-connected/index.html",
      origin: "https://raw.githack.com"
    }
  };

  try {
    const router = new Router({
      root: /** @type {any} */ ({}),
      routes: [],
      basePath: "",
      routingMode: "hash"
    });

    assert.equal(
      router.browserPath("/data"),
      "/soroushk5/rahjo/presentation-v2-connected/index.html#/data"
    );

    const fakeLink = {
      dataset: {},
      getAttribute(name) {
        if (name === "href") return "/data";
        return null;
      }
    };

    assert.equal(router.logicalPathForLink(/** @type {any} */ (fakeLink)), "/data");

    fakeLink.dataset.routePath = "/data";
    fakeLink.getAttribute = (name) => name === "href"
      ? "/soroushk5/rahjo/presentation-v2-connected/index.html#/data"
      : null;

    assert.equal(router.logicalPathForLink(/** @type {any} */ (fakeLink)), "/data");
  } finally {
    global.window = previousWindow;
  }
});
