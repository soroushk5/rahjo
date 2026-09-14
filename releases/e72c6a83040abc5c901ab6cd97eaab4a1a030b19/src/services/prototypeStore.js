const STORAGE_KEY = "rahjo.prototype.v1";

/** @typedef {{step: "service" | "details" | "review" | "result", payload: {serviceId: string | null, organization: string, purpose: string, monthlyVolume: string}, referenceId: string | null}} RequestDraft */
/** @typedef {{referenceId: string, serviceId: string, organization: string, purpose: string, monthlyVolume: string, status: string, createdAt: string}} PrototypeAccessRequest */
/** @typedef {{query: string, sensitivity: string}} AtlasFilters */
/** @typedef {{query: string, status: string}} DashboardFilters */
/** @typedef {{preferredClusterId: string | null, requestDraft: RequestDraft | null, accessRequests: PrototypeAccessRequest[], atlasFilters: AtlasFilters, dashboardFilters: DashboardFilters}} PrototypeSnapshot */

const requestSteps = new Set(["service", "details", "review", "result"]);
const volumeOptions = new Set(["", "pilot", "small", "medium", "large"]);
const sensitivityOptions = new Set(["all", "بسیار حساس", "حساس", "متوسط", "کنترل‌شده"]);
const dashboardStatusOptions = new Set(["all", "در بررسی", "بررسی حقوقی", "نیازمند مدرک", "قابل پایلوت"]);

/** @param {unknown} value @param {number} [maxLength] */
function safeString(value, maxLength = 2000) {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

/** @returns {PrototypeSnapshot} */
function defaultSnapshot() {
  return {
    preferredClusterId: null,
    requestDraft: null,
    accessRequests: [],
    atlasFilters: { query: "", sensitivity: "all" },
    dashboardFilters: { query: "", status: "all" }
  };
}

/** @param {unknown} input @returns {RequestDraft | null} */
function sanitizeDraft(input) {
  if (!input || typeof input !== "object") return null;
  const candidate = /** @type {{step?: unknown, payload?: unknown, referenceId?: unknown}} */ (input);
  if (typeof candidate.step !== "string" || !requestSteps.has(candidate.step)) return null;
  if (!candidate.payload || typeof candidate.payload !== "object") return null;

  const payload = /** @type {{serviceId?: unknown, organization?: unknown, purpose?: unknown, monthlyVolume?: unknown}} */ (candidate.payload);
  const serviceId = typeof payload.serviceId === "string" ? safeString(payload.serviceId, 80) : null;
  const monthlyVolume = safeString(payload.monthlyVolume, 20);

  return /** @type {RequestDraft} */ ({
    step: candidate.step,
    payload: {
      serviceId,
      organization: safeString(payload.organization, 180),
      purpose: safeString(payload.purpose, 2000),
      monthlyVolume: volumeOptions.has(monthlyVolume) ? monthlyVolume : ""
    },
    referenceId: typeof candidate.referenceId === "string" ? safeString(candidate.referenceId, 120) : null
  });
}

/** @param {unknown} input @returns {PrototypeAccessRequest | null} */
function sanitizeAccessRequest(input) {
  if (!input || typeof input !== "object") return null;
  const candidate = /** @type {Record<string, unknown>} */ (input);
  const referenceId = safeString(candidate.referenceId, 120);
  const serviceId = safeString(candidate.serviceId, 80);
  if (!referenceId || !serviceId) return null;

  const monthlyVolume = safeString(candidate.monthlyVolume, 20);
  return {
    referenceId,
    serviceId,
    organization: safeString(candidate.organization, 180),
    purpose: safeString(candidate.purpose, 2000),
    monthlyVolume: volumeOptions.has(monthlyVolume) ? monthlyVolume : "",
    status: safeString(candidate.status, 80) || "در بررسی",
    createdAt: safeString(candidate.createdAt, 80)
  };
}

/** @returns {Storage | null} */
function browserStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** @returns {PrototypeSnapshot} */
export function readPrototypeSnapshot() {
  const storage = browserStorage();
  if (!storage) return defaultSnapshot();

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return defaultSnapshot();
    const parsed = /** @type {Record<string, unknown>} */ (JSON.parse(raw));
    const atlas = parsed.atlasFilters && typeof parsed.atlasFilters === "object"
      ? /** @type {Record<string, unknown>} */ (parsed.atlasFilters)
      : {};
    const dashboard = parsed.dashboardFilters && typeof parsed.dashboardFilters === "object"
      ? /** @type {Record<string, unknown>} */ (parsed.dashboardFilters)
      : {};
    const sensitivity = safeString(atlas.sensitivity, 40);
    const status = safeString(dashboard.status, 80);

    return {
      preferredClusterId: typeof parsed.preferredClusterId === "string" ? safeString(parsed.preferredClusterId, 80) : null,
      requestDraft: sanitizeDraft(parsed.requestDraft),
      accessRequests: Array.isArray(parsed.accessRequests)
        ? parsed.accessRequests.map(sanitizeAccessRequest).filter((item) => item !== null).slice(0, 30)
        : [],
      atlasFilters: {
        query: safeString(atlas.query, 240),
        sensitivity: sensitivityOptions.has(sensitivity) ? sensitivity : "all"
      },
      dashboardFilters: {
        query: safeString(dashboard.query, 240),
        status: dashboardStatusOptions.has(status) ? status : "all"
      }
    };
  } catch {
    return defaultSnapshot();
  }
}

/** @param {PrototypeSnapshot} snapshot */
function writePrototypeSnapshot(snapshot) {
  const storage = browserStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Prototype state is a convenience. The app remains usable if storage is unavailable.
  }
}

/** @param {(snapshot: PrototypeSnapshot) => PrototypeSnapshot} updater */
function updateSnapshot(updater) {
  writePrototypeSnapshot(updater(readPrototypeSnapshot()));
}

/** @returns {string | null} */
export function getPreferredClusterId() {
  return readPrototypeSnapshot().preferredClusterId;
}

/** @param {string | null} clusterId */
export function setPreferredClusterId(clusterId) {
  updateSnapshot((snapshot) => ({ ...snapshot, preferredClusterId: clusterId }));
}

/** @returns {RequestDraft | null} */
export function loadRequestDraft() {
  return readPrototypeSnapshot().requestDraft;
}

/** @param {RequestDraft} draft */
export function saveRequestDraft(draft) {
  updateSnapshot((snapshot) => ({ ...snapshot, requestDraft: draft }));
}

export function clearRequestDraft() {
  updateSnapshot((snapshot) => ({ ...snapshot, requestDraft: null }));
}

/** @param {PrototypeAccessRequest} request */
export function addPrototypeAccessRequest(request) {
  updateSnapshot((snapshot) => ({
    ...snapshot,
    accessRequests: [request, ...snapshot.accessRequests.filter((item) => item.referenceId !== request.referenceId)].slice(0, 30)
  }));
}

/** @returns {PrototypeAccessRequest[]} */
export function listPrototypeAccessRequests() {
  return readPrototypeSnapshot().accessRequests;
}

export function clearPrototypeAccessRequests() {
  updateSnapshot((snapshot) => ({ ...snapshot, accessRequests: [] }));
}

/** @returns {AtlasFilters} */
export function getAtlasFilters() {
  return readPrototypeSnapshot().atlasFilters;
}

/** @param {Partial<AtlasFilters>} filters */
export function setAtlasFilters(filters) {
  updateSnapshot((snapshot) => ({ ...snapshot, atlasFilters: { ...snapshot.atlasFilters, ...filters } }));
}

/** @returns {DashboardFilters} */
export function getDashboardFilters() {
  return readPrototypeSnapshot().dashboardFilters;
}

/** @param {Partial<DashboardFilters>} filters */
export function setDashboardFilters(filters) {
  updateSnapshot((snapshot) => ({ ...snapshot, dashboardFilters: { ...snapshot.dashboardFilters, ...filters } }));
}
