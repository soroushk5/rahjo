/** @type {Readonly<Record<string, {target: string, keys: readonly string[]}>>} */
const legacyRoutes = Object.freeze({
  "/platform": { target: "/product", keys: [] },
  "/data": { target: "/product", keys: [] },
  "/atlas": { target: "/product", keys: [] },
  "/stories": { target: "/product", keys: [] },
  "/map": { target: "/", keys: [] },
  "/use-cases": { target: "/product", keys: [] },
  "/how-it-works": { target: "/", keys: [] },
  "/trust": { target: "/product", keys: [] },
  "/about": { target: "/", keys: [] },
  "/contact": { target: "/login", keys: [] },
  "/pilot": { target: "/login", keys: [] },
  "/cases/new": { target: "/request-service", keys: ["account", "service", "case"] },
  "/request": { target: "/request-service", keys: ["account", "service", "case"] },
  "/crm": { target: "/customers", keys: ["account", "case"] },
  "/automation": { target: "/operations", keys: ["run", "case"] },
  "/governance": { target: "/audit", keys: ["issue", "case"] },
  "/dashboard/requests": { target: "/requests", keys: ["case", "account"] },
  "/dashboard/data": { target: "/documents", keys: ["service", "account"] },
  "/dashboard/audit": { target: "/audit", keys: ["issue", "case"] },
  "/think-room": { target: "/product", keys: [] }
});

/** @param {string} search @param {readonly string[]} keys */
function encodedLegacyRef(search, keys) {
  const params = new URLSearchParams(search || "");
  for (const key of keys) {
    const value = params.get(key)?.trim();
    if (!value) continue;
    const bounded = value.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 120);
    if (bounded) return new URLSearchParams({ legacyRef: `${key}:${bounded}` }).toString();
  }
  return "";
}

/**
 * Resolve retired live URLs to safe phase-one collection pages. Legacy IDs are
 * carried only as inert reference text; they are never treated as valid new IDs.
 *
 * @param {string} path
 * @param {string} [search]
 */
export function resolveLegacyTarget(path, search = "") {
  if (path === "/services") {
    const params = new URLSearchParams(search);
    if (params.has("case") || params.has("account")) {
      const query = encodedLegacyRef(search, ["case", "account", "service"]);
      return query ? `/requests?${query}` : "/requests";
    }
    if (params.has("service")) {
      const query = encodedLegacyRef(search, ["service"]);
      return query ? `/services-admin?${query}` : "/services-admin";
    }
    return "/product";
  }

  const alias = legacyRoutes[path];
  if (!alias) return null;
  const query = encodedLegacyRef(search, alias.keys);
  return query ? `${alias.target}?${query}` : alias.target;
}

export const legacyRoutePaths = Object.freeze(["/services", ...Object.keys(legacyRoutes)]);
