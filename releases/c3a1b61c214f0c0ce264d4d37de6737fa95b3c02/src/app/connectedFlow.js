import { icon } from "../components/icons.js";
import { verificationServices } from "../data/demoData.js";
import { setPreferredClusterId } from "../services/prototypeStore.js";

/** @param {ParentNode} [root] */
function bindClusterContext(root = document) {
  root.querySelectorAll("[data-flow-cluster]").forEach((control) => {
    if (!(control instanceof HTMLElement) || control.dataset.flowBound) return;
    control.dataset.flowBound = "true";
    control.addEventListener("click", () => {
      const cluster = control.getAttribute("data-flow-cluster");
      if (cluster) setPreferredClusterId(cluster);
    });
  });
}

export function mountConnectedRequestFlow() {
  const context = document.querySelector(".request-context");
  if (context instanceof HTMLElement && !context.querySelector(".request-context__links")) {
    context.insertAdjacentHTML("beforeend", `<nav class="request-context__links"><a data-link href="/data">اطلس داده</a><a data-link href="/trust">منطق Gate</a></nav>`);
  }

  const resultActions = document.querySelector(".result-actions");
  if (resultActions instanceof HTMLElement) {
    const primary = resultActions.querySelector("a[data-link]");
    if (primary instanceof HTMLAnchorElement) {
      primary.setAttribute("href", "/dashboard/requests");
      primary.dataset.routePath = "/dashboard/requests";
      primary.innerHTML = `دیدن درخواست در کنسول ${icon("arrow", { size: 15 })}`;
    }
    if (!resultActions.querySelector('[data-result-atlas]')) {
      resultActions.insertAdjacentHTML("beforeend", `<a data-link data-result-atlas class="button button--ghost" href="/data">بازگشت به اطلس</a>`);
    }
  }
}

/** @param {HTMLElement} detail */
function clusterIdFromRequestDetail(detail) {
  const title = detail.querySelector(".request-detail-head h3")?.textContent?.trim();
  if (!title) return null;
  return verificationServices.find((service) => service.title === title)?.id ?? null;
}

function enrichRequestDetail() {
  const detail = document.querySelector("#present-request-detail");
  if (!(detail instanceof HTMLElement)) return;
  detail.querySelector(".request-detail-actions")?.remove();
  const cluster = clusterIdFromRequestDetail(detail);
  if (!cluster) return;

  detail.insertAdjacentHTML("beforeend", `
    <div class="request-detail-actions">
      <a data-link data-flow-cluster="${cluster}" class="button button--secondary" href="/data">باز کردن خوشه در اطلس</a>
      <a data-link data-flow-cluster="${cluster}" class="button button--primary" href="/request">درخواست مشابه ${icon("arrow", { size: 15 })}</a>
    </div>`);
  bindClusterContext(detail);
}

export function mountConnectedDashboardRequests() {
  enrichRequestDetail();
  document.querySelector(".request-workspace")?.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-present-request]") : null;
    if (target) queueMicrotask(enrichRequestDetail);
  });
  document.querySelector(".request-workspace")?.addEventListener("keydown", (event) => {
    if (!(event instanceof KeyboardEvent) || !["Enter", " "].includes(event.key)) return;
    const target = event.target instanceof Element ? event.target.closest("[data-present-request]") : null;
    if (target) queueMicrotask(enrichRequestDetail);
  });
}

export function mountConnectedDashboardData() {
  bindClusterContext();
}
