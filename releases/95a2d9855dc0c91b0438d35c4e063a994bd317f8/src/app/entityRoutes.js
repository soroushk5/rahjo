const knownKeys = [
  "customer", "request", "lead", "opportunity", "service", "document", "task", "run", "issue",
  // Read legacy deep links without making them the canonical links for phase one.
  "account", "case"
];

/** @typedef {{path:string, customer?:string, request?:string, lead?:string, opportunity?:string, service?:string, document?:string, task?:string, run?:string, issue?:string, account?:string, case?:string}} RouteContext */
/** @typedef {{type:string, id?:string, customerId?:string, requestId?:string, accountId?:string, caseId?:string, leadId?:string, opportunityId?:string, serviceId?:string, documentId?:string, taskId?:string, runId?:string, issueId?:string, auditId?:string}} EntityTarget */

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
  const browserHref = typeof window !== "undefined" && window.location?.href
    ? window.location.href
    : "http://rahjo.local/";
  const url = new URL(source ?? browserHref, "http://rahjo.local");
  const hashRoute = url.hash.startsWith("#/") ? new URL(url.hash.slice(1), "http://rahjo.local") : null;
  const routeUrl = hashRoute ?? url;
  /** @type {RouteContext} */
  const context = { path: routeUrl.pathname };
  knownKeys.forEach((key) => {
    const value = routeUrl.searchParams.get(key);
    if (value) /** @type {Record<string, string>} */ (context)[key] = value;
  });
  return context;
}

/** @param {EntityTarget} entity */
export function entityHref(entity) {
  switch (entity.type) {
    case "customer":
    case "account":
      return routeWithContext("/customers/detail", { customer: entity.customerId ?? entity.accountId ?? entity.id });
    case "request":
    case "case":
      return routeWithContext("/requests/detail", { request: entity.requestId ?? entity.caseId ?? entity.id });
    case "service":
      return routeWithContext("/services-admin", { service: entity.serviceId ?? entity.id });
    case "lead":
      return routeWithContext("/sales", { lead: entity.leadId ?? entity.id });
    case "opportunity":
      return routeWithContext("/sales", { opportunity: entity.opportunityId ?? entity.id });
    case "document":
      return routeWithContext("/documents", { document: entity.documentId ?? entity.id });
    case "task":
      return routeWithContext("/tasks", { task: entity.taskId ?? entity.id });
    case "run":
      return routeWithContext("/operations", { run: entity.runId ?? entity.id });
    case "issue":
    case "audit":
      return routeWithContext("/audit", { issue: entity.issueId ?? entity.auditId ?? entity.id });
    default:
      return "/dashboard";
  }
}

/** @param {string} path */
export function requestNavigation(path) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("rahjo:navigate", { detail: path }));
}
