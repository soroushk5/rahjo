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
    let path = pathname || "/";

    if (this.basePath && (path === this.basePath || path.startsWith(`${this.basePath}/`))) {
      path = path.slice(this.basePath.length) || "/";
    }

    if (!path.startsWith("/")) path = `/${path}`;
    if (path.length > 1) path = path.replace(/\/+$/, "");
    return path || "/";
  }

  /** @param {string} routePath */
  browserPath(routePath) {
    const path = this.routePath(routePath);

    if (this.routingMode === "hash") {
      return `${window.location.pathname}#${path}`;
    }

    if (!this.basePath) return path;
    return path === "/" ? `${this.basePath}/` : `${this.basePath}${path}`;
  }

  rewriteInternalLinks() {
    document.querySelectorAll("a[data-link]").forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      link.setAttribute("href", this.browserPath(url.pathname));
    });
  }

  start() {
    window.addEventListener("popstate", this.handleNavigation);
    window.addEventListener("hashchange", this.handleNavigation);
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest("a[data-link]") : null;
      if (!(target instanceof HTMLAnchorElement) || target.origin !== window.location.origin) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || target.target === "_blank") return;

      event.preventDefault();
      const nextPath = this.routingMode === "hash" ? target.hash.slice(1) || "/" : target.pathname;
      this.navigate(nextPath);
    });
    this.handleNavigation();
  }

  /** @param {string} path */
  navigate(path) {
    window.history.pushState({}, "", this.browserPath(path));
    this.handleNavigation();
  }

  handleNavigation() {
    const sourcePath = this.routingMode === "hash" ? window.location.hash.slice(1) || "/" : window.location.pathname;
    const currentPath = this.routePath(sourcePath);
    const route = this.routes.find((candidate) => candidate.path === currentPath) ?? this.routes[0];

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
