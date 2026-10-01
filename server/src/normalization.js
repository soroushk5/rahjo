import { problems } from "./errors.js";
import { randomUUID } from "node:crypto";
import { isValidJalaaliDate, toGregorian, toJalaali } from "jalaali-js";

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
const rawAttributionKeys = Object.freeze(["utmSource", "utmMedium", "utmCampaign", "utmTerm", "utmContent", "referrer", "landingPath"]);

// No identifier type has been declared canonical-unique for CRM yet.
// Add an entry only after the owner approves its authority and uniqueness scope.
export const CANONICAL_UNIQUE_IDENTIFIER_SCOPES = Object.freeze({});

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

function validation(message) {
  throw problems.validation(message);
}

function dateParts(value, calendar) {
  if (typeof value !== "string") validation("Date must be a string with an explicit calendar");
  const normalized = asciiDigits(normalizePersianText(value, { max: 32, required: true }));
  const separator = calendar === "jalali" ? "[-/]" : "-";
  const match = normalized.match(new RegExp(`^(\\d{4})${separator}(\\d{1,2})${separator}(\\d{1,2})$`));
  if (!match) validation("Date format is invalid for the declared calendar");
  return match.slice(1).map(Number);
}

function validGregorianDate(year, month, day) {
  if (!Number.isInteger(year) || year < 1 || year > 9999 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const lengths = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= lengths[month - 1];
}

function jalaliToGregorian(year, month, day) {
  try {
    if (!isValidJalaaliDate(year, month, day)) validation("Jalali date is invalid");
    const converted = toGregorian(year, month, day);
    return `${String(converted.gy).padStart(4, "0")}-${String(converted.gm).padStart(2, "0")}-${String(converted.gd).padStart(2, "0")}`;
  } catch {
    validation("Jalali date is invalid or outside the supported conversion range");
  }
}

/** Convert a strict Gregorian date-only value to the approved Jalali display calendar. */
export function toJalaliDate(value) {
  const [year, month, day] = dateParts(value, "gregorian");
  if (!validGregorianDate(year, month, day)) validation("Gregorian date is invalid");
  try {
    const converted = toJalaali(year, month, day);
    return `${String(converted.jy).padStart(4, "0")}-${String(converted.jm).padStart(2, "0")}-${String(converted.jd).padStart(2, "0")}`;
  } catch {
    validation("Gregorian date is outside the supported Jalali conversion range");
  }
}

function validateTimeZone(timeZone) {
  if (typeof timeZone !== "string" || !timeZone) validation("An IANA timezone identifier is required");
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(0);
  } catch {
    validation("Timezone identifier is not recognized by IANA data");
  }
  return timeZone;
}

/** Normalize a calendar date or an offset-explicit RFC 3339 instant. */
export function normalizeCrmDate(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) validation("Date input must declare date-only or instant kind");
  if (input.kind === "date-only") {
    const calendar = input.calendar;
    if (calendar !== "gregorian" && calendar !== "jalali") validation("Date calendar must be explicitly gregorian or jalali");
    const [year, month, day] = dateParts(input.value, calendar);
    const gregorian = calendar === "jalali"
      ? jalaliToGregorian(year, month, day)
      : validGregorianDate(year, month, day) ? `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` : null;
    if (!gregorian) validation("Gregorian date is invalid");
    return Object.freeze({ kind: "date-only", value: gregorian, displayCalendar: calendar });
  }
  if (input.kind === "instant") {
    if (typeof input.value !== "string") validation("Instant must be an RFC 3339 string");
    const value = asciiDigits(normalizePersianText(input.value, { max: 64, required: true }));
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/i);
    if (!match) validation("Instant must include RFC 3339 Z or an explicit numeric offset");
    const [, year, month, day, hour, minute, second, , offset] = match;
    if (!validGregorianDate(Number(year), Number(month), Number(day))
      || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) validation("RFC 3339 instant is invalid");
    if (!/^[Zz]$/.test(offset) && (Number(offset.slice(1, 3)) > 23 || Number(offset.slice(4, 6)) > 59)) {
      validation("RFC 3339 offset is invalid");
    }
    const timeZone = validateTimeZone(input.timeZone ?? "Asia/Tehran");
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) validation("RFC 3339 instant is invalid");
    return Object.freeze({ kind: "instant", value: new Date(timestamp).toISOString(), timeZone });
  }
  validation("Date input must declare date-only or instant kind");
}

/** Validate a three-letter currency against the runtime's ISO 4217 currency data. */
export function normalizeCurrencyCode(value) {
  if (typeof value !== "string") validation("Currency code must be an ISO 4217 string");
  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) validation("Currency code must contain three ISO 4217 letters");
  const currencies = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("currency") : null;
  if (currencies && !currencies.includes(code)) validation("Currency code is not present in runtime ISO 4217 data");
  try {
    new Intl.NumberFormat("en-US", { style: "currency", currency: code });
  } catch {
    validation("Currency code is invalid");
  }
  return code;
}

/** Convert explicitly labelled IRR or toman text to an exact integer IRR string. */
export function normalizeIranMoney(amount, unit) {
  if (typeof amount !== "string") validation("Money must be supplied as an exact decimal string");
  const input = asciiDigits(normalizePersianText(amount, { max: 64, required: true })).replace("٫", ".");
  const match = input.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
  if (!match) validation("Money must be an ungrouped exact decimal string");
  const normalizedUnit = typeof unit === "string" ? unit.trim().toUpperCase() : "";
  const isToman = normalizedUnit === "TOMAN" || unit === "تومان";
  if (!isToman && normalizedUnit !== "IRR") validation("Money unit must be explicitly IRR or TOMAN");
  if (!isToman) normalizeCurrencyCode("IRR");
  let fraction = match[3] ?? "";
  let factor = 1n;
  if (isToman) {
    if (fraction.length > 1 && /[1-9]/.test(fraction.slice(1))) validation("Toman amount has sub-rial precision and cannot be rounded");
    fraction = (fraction.slice(0, 1) || "0").padEnd(1, "0");
    factor = 10n;
  } else if (/[1-9]/.test(fraction)) {
    validation("IRR amount must be an integer; fractional rials are not accepted");
  }
  const whole = BigInt(match[2]);
  const fractionalIrr = isToman ? BigInt(fraction) : 0n;
  let amountIrr = whole * factor + fractionalIrr;
  if (match[1] === "-") amountIrr = -amountIrr;
  return Object.freeze({ currency: "IRR", amount: amountIrr.toString(), inputUnit: isToman ? "TOMAN" : "IRR" });
}

/** Keep identifier input separate from its type-specific canonical equality key. */
export function normalizeIdentifier(type, rawValue, { numeric = false, caseInsensitive = false } = {}) {
  const identifierType = normalizePersianText(type, { max: 80, required: true }).toLowerCase();
  if (!/^[a-z][a-z0-9._:-]*$/.test(identifierType)) validation("Identifier type is invalid");
  if (typeof rawValue !== "string") validation("Identifier value must be a string");
  const raw = rawValue;
  let normalizedValue = normalizePersianText(rawValue, { max: 256, required: true });
  if (numeric) normalizedValue = asciiDigits(normalizedValue);
  if (caseInsensitive) normalizedValue = normalizedValue.toLocaleLowerCase("fa-IR");
  const uniqueScope = Object.hasOwn(CANONICAL_UNIQUE_IDENTIFIER_SCOPES, identifierType)
    ? CANONICAL_UNIQUE_IDENTIFIER_SCOPES[identifierType]
    : null;
  if (uniqueScope !== null && !["workspace", "system"].includes(uniqueScope)) validation("Identifier uniqueness scope is invalid");
  return Object.freeze({
    canonical: Object.freeze({ type: identifierType, normalizedValue, uniqueScope }),
    raw: Object.freeze({ value: raw })
  });
}

/** Produce an equality key using only the declared canonical field profile. */
export function normalizeEqualityValue(field, value, options = {}) {
  if (field === "text") return normalizePersianText(value, { max: 1200, required: true });
  if (field === "email") return normalizeEmail(value);
  if (field === "phone") return normalizePhone(value);
  if (field === "identifier") return normalizeIdentifier(options.type, value, options).canonical;
  validation("Equality field profile is not supported");
}

/** Rank caller-supplied dedupe candidates; fuzzy candidates must already be marked for review. */
export function rankDedupeCandidates(incoming, candidates, fuzzyCandidateIds = []) {
  if (!incoming || !Array.isArray(candidates) || !Array.isArray(fuzzyCandidateIds)) validation("Dedupe input is invalid");
  const fuzzy = new Set(fuzzyCandidateIds.map(String));
  const ranked = [];
  for (const candidate of candidates) {
    if (!candidate || String(candidate.workspaceId ?? incoming.workspaceId ?? "") !== String(incoming.workspaceId ?? candidate.workspaceId ?? "")) continue;
    let evidence = "";
    const identifiers = Array.isArray(incoming.identifiers) ? incoming.identifiers : [];
    const otherIdentifiers = Array.isArray(candidate.identifiers) ? candidate.identifiers : [];
    if (identifiers.some((left) => left.uniqueScope && otherIdentifiers.some((right) =>
      left.type === right.type && left.uniqueScope === right.uniqueScope && left.scopeKey === right.scopeKey
      && left.normalizedValue === right.normalizedValue))) evidence = "authoritative_identifier";
    else if (incoming.phone && candidate.phone && incoming.phone === candidate.phone) evidence = "exact_phone";
    else if (incoming.email && candidate.email && incoming.email === candidate.email) evidence = "exact_email";
    else if (fuzzy.has(String(candidate.id))) evidence = "fuzzy_review";
    if (evidence) ranked.push({ candidateId: candidate.id, evidence, reviewRequired: true, autoMerge: false });
  }
  const rank = { authoritative_identifier: 0, exact_phone: 1, exact_email: 2, fuzzy_review: 3 };
  return ranked.sort((left, right) => rank[left.evidence] - rank[right.evidence] || String(left.candidateId).localeCompare(String(right.candidateId)));
}

function rawIntakeValues(input) {
  const raw = {};
  for (const key of ["organization", "contactName", "email", "phone", "purpose", "serviceId", "sourceChannel"]) {
    if (typeof input?.[key] === "string") raw[key] = input[key];
  }
  if (input?.attribution && typeof input.attribution === "object" && !Array.isArray(input.attribution)) {
    const attribution = {};
    for (const key of rawAttributionKeys) if (typeof input.attribution[key] === "string") attribution[key] = input.attribution[key];
    if (Object.keys(attribution).length) raw.attribution = attribution;
  }
  if (Array.isArray(input?.identifiers)) {
    raw.identifiers = input.identifiers.filter((item) => item && typeof item.type === "string" && typeof item.value === "string")
      .map(({ type, value }) => ({ type, value }));
  }
  return raw;
}

function normalizeIntakeAttribution(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const attribution = {};
  for (const key of rawAttributionKeys) {
    if (typeof value[key] !== "string") continue;
    const normalized = normalizePersianText(value[key], { max: key === "referrer" ? 500 : 180 });
    if (normalized) attribution[key] = normalized;
  }
  return attribution;
}

export function requiredIdempotencyKey(value) {
  const key = normalizePersianText(value, { max: 180, required: true });
  if (key.length < 8 || !/^[A-Za-z0-9._:-]+$/.test(key)) throw problems.validation("Idempotency-Key must be 8-180 URL-safe characters");
  return key;
}

export function publicId(prefix) {
  return `${prefix}-${randomUUID()}`;
}

export function normalizeIntake(input, { rawInput = input } = {}) {
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
    attribution: normalizeIntakeAttribution(input.attribution),
    rawValues: rawIntakeValues(rawInput)
  };
}
