const STORAGE_KEY = "rahjo.prototype.v1";

/** @typedef {{step: "service" | "details" | "review" | "result", payload: {serviceId: string | null, organization: string, purpose: string, monthlyVolume: string}, referenceId: string | null}} RequestDraft */
/** @typedef {{referenceId: string, serviceId: string, organization: string, purpose: string, monthlyVolume: string, status: string, createdAt: string}} PrototypeAccessRequest */
/** @typedef {{query: string, sensitivity: string}} AtlasFilters */
/** @typedef {{query: string, status: string}} DashboardFilters */
/** @typedef {{preferredClusterId: string | null, requestDraft: RequestDraft | null, accessRequests: PrototypeAccessRequest[], atlasFilters: AtlasFilters, dashboardFilters: DashboardFilters}} PrototypeSnapshot */

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
    const parsed = /** @type {Partial<PrototypeSnapshot>} */ (JSON.parse(raw));
    const defaults = defaultSnapshot();
    return {
      preferredClusterId: typeof parsed.preferredClusterId === "string" ? parsed.preferredClusterId : null,
      requestDraft: parsed.requestDraft ?? null,
      accessRequests: Array.isArray(parsed.accessRequests) ? parsed.accessRequests.slice(0, 30) : [],
      atlasFilters: { ...defaults.atlasFilters, ...(parsed.atlasFilters ?? {}) },
      dashboardFilters: { ...defaults.dashboardFilters, ...(parsed.dashboardFilters ?? {}) }
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
