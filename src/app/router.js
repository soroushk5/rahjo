/** @typedef {{path: string, render: () => string, mount?: () => void, title?: string}} Route */

export class Router {
  /** @param {{root: HTMLElement, routes: Route[]}} options */
  constructor({ root, routes }) {
    this.root = root;
    this.routes = routes;
    this.handleNavigation = this.handleNavigation.bind(this);
  }

  start() {
    window.addEventListener("popstate", this.handleNavigation);
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest("a[data-link]") : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      if (target.origin !== window.location.origin) return;
      event.preventDefault();
      this.navigate(target.pathname);
    });
    this.handleNavigation();
  }

  /** @param {string} path */
  navigate(path) {
    window.history.pushState({}, "", path);
    this.handleNavigation();
  }

  handleNavigation() {
    const route = this.routes.find((candidate) => candidate.path === window.location.pathname) ?? this.routes[0];
    document.title = route.title ? `${route.title} | رهجو` : "رهجو";
    this.root.innerHTML = route.render();
    route.mount?.();
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}
