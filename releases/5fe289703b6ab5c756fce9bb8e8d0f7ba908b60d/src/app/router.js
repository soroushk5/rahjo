import { resolveLegacyTarget } from "./legacyCompatibility.js";

/** @typedef {{path: string, render: () => string, mount?: () => void, title?: string, description?: string}} Route */

/** @param {string} value */
function normalizeBasePath(value) {
  if (!value || value === "/") return "";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

function detectBasePath() {
  const configured = document.documentElement.dataset.basePath;
  if (configured) return normalizeBasePath(configured);

  if (window.location.hostname.endsWith(".github.io")) {
    const [repository] = window.location.pathname.split("/").filter(Boolean);
    return repository ? `/${repository}` : "";
  }

  return "";
}

function detectRoutingMode() {
  const hostname = window.location.hostname;
  return hostname === "raw.githack.com" || hostname === "rawcdn.githack.com" ? "hash" : "history";
}

export class Router {
  /** @param {{root: HTMLElement, routes: Route[], basePath?: string, routingMode?: "history" | "hash"}} options */
  constructor({ root, routes, basePath = detectBasePath(), routingMode = detectRoutingMode() }) {
    this.root = root;
    this.routes = routes;
    this.basePath = normalizeBasePath(basePath);
    this.routingMode = routingMode;
    this.handleNavigation = this.handleNavigation.bind(this);
  }

  /** @param {string} pathname */
  routePath(pathname) {
    let path = (pathname || "/").split(/[?#]/, 1)[0] || "/";

    if (this.basePath && (path === this.basePath || path.startsWith(`${this.basePath}/`))) {
      path = path.slice(this.basePath.length) || "/";
    }

    if (!path.startsWith("/")) path = `/${path}`;
    if (path.length > 1) path = path.replace(/\/+$/, "");
    return path || "/";
  }

  /** @param {string} routePath */
  browserPath(routePath) {
    const match = String(routePath || "/").match(/^([^?#]*)(\?[^#]*)?/);
    const path = this.routePath(match?.[1] ?? "/");
    const search = match?.[2] ?? "";

    if (this.routingMode === "hash") {
      return `${window.location.pathname}#${path}${search}`;
    }

    if (!this.basePath) return `${path}${search}`;
    return path === "/" ? `${this.basePath}/${search}` : `${this.basePath}${path}${search}`;
  }

  /** @param {HTMLAnchorElement} link */
  logicalPathForLink(link) {
    const stored = link.dataset.routePath;
    if (stored) return stored;

    const href = link.getAttribute("href");
    if (!href) return null;
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return null;

    if (this.routingMode === "hash" && url.hash.startsWith("#/")) {
      const hashTarget = url.hash.slice(1);
      const hashMatch = hashTarget.match(/^([^?]*)(\?.*)?/);
      return `${this.routePath(hashMatch?.[1] ?? "/")}${hashMatch?.[2] ?? ""}`;
    }

    return `${this.routePath(url.pathname)}${url.search}`;
  }

  rewriteInternalLinks() {
    document.querySelectorAll("a[data-link]").forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      const logicalPath = this.logicalPathForLink(link);
      if (!logicalPath) return;
      link.dataset.routePath = logicalPath;
      link.setAttribute("href", this.browserPath(logicalPath));
    });
  }

  start() {
    window.addEventListener("popstate", this.handleNavigation);
    if (this.routingMode === "hash") window.addEventListener("hashchange", this.handleNavigation);
    window.addEventListener("rahjo:navigate", (event) => {
      if (event instanceof CustomEvent && typeof event.detail === "string") this.navigate(event.detail);
    });
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest("a[data-link]") : null;
      if (!(target instanceof HTMLAnchorElement) || target.origin !== window.location.origin) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || target.target === "_blank") return;

      const logicalPath = target.dataset.routePath ?? (this.routingMode === "hash" ? target.hash.slice(1) || "/" : target.pathname);
      event.preventDefault();
      this.navigate(logicalPath);
    });
    this.handleNavigation();
  }

  /** @param {string} path */
  navigate(path) {
    window.history.pushState({}, "", this.browserPath(path));
    this.handleNavigation();
  }

  /** @param {string} path */
  replace(path) {
    window.history.replaceState({}, "", this.browserPath(path));
    this.handleNavigation();
  }

  handleNavigation() {
    const sourcePath = this.routingMode === "hash"
      ? window.location.hash.slice(1) || "/"
      : `${window.location.pathname}${window.location.search}`;
    const currentPath = this.routePath(sourcePath);
    const queryIndex = sourcePath.indexOf("?");
    const currentSearch = queryIndex >= 0 ? sourcePath.slice(queryIndex) : "";
    const legacyTarget = resolveLegacyTarget(currentPath, currentSearch);
    if (legacyTarget) {
      this.replace(legacyTarget);
      return;
    }
    const route = this.routes.find((candidate) => candidate.path === currentPath)
      ?? this.routes.find((candidate) => candidate.path === "*")
      ?? this.routes[0];

    document.title = route.title ? `${route.title} | رهجو` : "رهجو";
    const meta = document.querySelector('meta[name="description"]');
    if (meta && route.description) meta.setAttribute("content", route.description);

    this.root.innerHTML = route.render();
    this.rewriteInternalLinks();
    route.mount?.();
    this.rewriteInternalLinks();
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}
