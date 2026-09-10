import { problems } from "./errors.js";
import { randomUUID } from "node:crypto";

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

export function normalizePersianText(value, { max = 1200, required = false } = {}) {
  if (typeof value !== "string") {
    if (required) throw problems.validation("A required text field is missing");
    return "";
  }
  const normalized = value
    .normalize("NFKC")
    .replaceAll("ي", "ی")
    .replaceAll("ى", "ی")
    .replaceAll("ك", "ک")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t\f\v]+/g, " ")
    .trim();
  if (required && !normalized) throw problems.validation("A required text field is empty");
  if (normalized.length > max) throw problems.validation(`Text exceeds ${max} characters`);
  return normalized;
}

export function asciiDigits(value) {
  return String(value ?? "").replace(/[۰-۹٠-٩]/g, (digit) => {
    const persian = persianDigits.indexOf(digit);
    return String(persian >= 0 ? persian : arabicDigits.indexOf(digit));
  });
}

export function normalizeEmail(value) {
  const email = asciiDigits(normalizePersianText(value, { max: 254, required: true })).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw problems.validation("Email is invalid");
  return email;
}

export function normalizePhone(value) {
  const raw = asciiDigits(normalizePersianText(value, { max: 40, required: true }));
  const phone = raw.replace(/[^\d+]/g, "").replace(/^00/, "+");
  if (!/^\+?\d{8,15}$/.test(phone)) throw problems.validation("Phone is invalid");
  return phone;
}

export function requiredIdempotencyKey(value) {
  const key = normalizePersianText(value, { max: 180, required: true });
  if (key.length < 8 || !/^[A-Za-z0-9._:-]+$/.test(key)) throw problems.validation("Idempotency-Key must be 8-180 URL-safe characters");
  return key;
}

export function publicId(prefix) {
  return `${prefix}-${randomUUID()}`;
}

export function normalizeIntake(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw problems.validation();
  const organization = normalizePersianText(input.organization, { max: 255, required: true });
  const contactName = normalizePersianText(input.contactName, { max: 160, required: true });
  const purpose = normalizePersianText(input.purpose, { max: 1200, required: true });
  const serviceId = normalizePersianText(input.serviceId, { max: 120, required: true });
  const email = input.email ? normalizeEmail(input.email) : "";
  const phone = input.phone ? normalizePhone(input.phone) : "";
  if (!email && !phone) throw problems.validation("At least one contact channel is required");
  return {
    organization,
    normalizedOrganization: organization.toLocaleLowerCase("fa-IR"),
    contactName,
    email,
    phone,
    purpose,
    serviceId,
    sourceChannel: normalizePersianText(input.sourceChannel ?? "website", { max: 120, required: true }),
    attribution: input.attribution && typeof input.attribution === "object" && !Array.isArray(input.attribution) ? input.attribution : {}
  };
}
