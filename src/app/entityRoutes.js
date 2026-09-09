const knownKeys = ["account", "case", "lead", "opportunity", "service", "run", "issue"];

/** @typedef {{path:string, account?:string, case?:string, lead?:string, opportunity?:string, service?:string, run?:string, issue?:string}} RouteContext */
/** @typedef {{type:string, id?:string, accountId?:string, caseId?:string, leadId?:string, opportunityId?:string, serviceId?:string, runId?:string, issueId?:string}} EntityTarget */

/** @param {string} path @param {Record<string, string | undefined>} [context] */
export function routeWithContext(path, context = {}) {
  const query = new URLSearchParams();
  knownKeys.forEach((key) => {
    const value = context[key];
    if (typeof value === "string" && value.trim()) query.set(key, value.trim());
  });
  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}

/** @param {string} [source] @returns {RouteContext} */
export function readRouteContext(source) {
  const href = source ?? (typeof window !== "undefined" ? window.location.href : "http://rahjo.local/");
  const url = new URL(href, "http://rahjo.local");
  /** @type {RouteContext} */
  const context = { path: url.pathname };
  knownKeys.forEach((key) => {
    const value = url.searchParams.get(key);
    if (value) /** @type {Record<string, string>} */ (context)[key] = value;
  });
  return context;
}

/** @param {EntityTarget} entity */
export function entityHref(entity) {
  switch (entity.type) {
    case "account":
      return routeWithContext("/crm", { account: entity.accountId ?? entity.id });
    case "case":
      return routeWithContext("/services", { service: entity.serviceId, case: entity.caseId ?? entity.id });
    case "service":
      return routeWithContext("/services", { service: entity.serviceId ?? entity.id });
    case "lead":
      return routeWithContext("/sales", { account: entity.accountId, lead: entity.leadId ?? entity.id });
    case "opportunity":
      return routeWithContext("/sales", { account: entity.accountId, opportunity: entity.opportunityId ?? entity.id });
    case "run":
      return routeWithContext("/automation", { case: entity.caseId, run: entity.runId ?? entity.id });
    case "audit":
      return routeWithContext("/governance", { case: entity.caseId, issue: entity.issueId });
    default:
      return "/dashboard";
  }
}

/** @param {string} path */
export function requestNavigation(path) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("rahjo:navigate", { detail: path }));
}
