import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function tokenDigest(token, pepper) {
  return createHmac("sha256", pepper).update(token, "utf8").digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export function payloadDigest(value) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value)), "utf8").digest("hex");
}

export function opaqueToken(prefix = "rahjo_live") {
  return `${prefix}_${randomBytes(32).toString("base64url")}`;
}

export function passwordCredential(password, saltHex = randomBytes(16).toString("hex")) {
  if (typeof password !== "string" || password.length < 14 || password.length > 256) {
    throw new Error("Password must be 14-256 characters");
  }
  return {
    salt: saltHex,
    hash: scryptSync(password.normalize("NFKC"), Buffer.from(saltHex, "hex"), 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("hex")
  };
}

export function verifyPassword(password, saltHex, expectedHash) {
  try {
    const actual = passwordCredential(password, saltHex).hash;
    return safeEqual(actual, expectedHash);
  } catch {
    return false;
  }
}

export function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function redact(value) {
  if (!value || typeof value !== "object") return value;
  const hidden = new Set(["authorization", "cookie", "password", "token", "secret", "apiKey", "api_key"]);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    hidden.has(key) || hidden.has(key.toLowerCase()) ? "[REDACTED]" : (item && typeof item === "object" ? redact(item) : item)
  ]));
}
