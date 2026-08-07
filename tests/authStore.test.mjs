import test from "node:test";
import assert from "node:assert/strict";
import { demoCredentials, getSession, isAuthenticated, signIn, signOut } from "../src/services/authStore.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

test("demo login persists a browser-local session", () => {
  globalThis.window = { localStorage: memoryStorage() };
  assert.equal(isAuthenticated(), false);
  const result = signIn(demoCredentials.email, demoCredentials.password);
  assert.equal(result.ok, true);
  assert.equal(isAuthenticated(), true);
  assert.equal(getSession()?.user.email, demoCredentials.email);
  signOut();
  assert.equal(isAuthenticated(), false);
  delete globalThis.window;
});

test("demo login rejects invalid credentials", () => {
  globalThis.window = { localStorage: memoryStorage() };
  const result = signIn("wrong@example.com", "wrong");
  assert.equal(result.ok, false);
  assert.equal(isAuthenticated(), false);
  delete globalThis.window;
});
