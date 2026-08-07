import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";
import { ecosystemEdges, ecosystemNodes } from "../../data/siteContent.js";
import { setPreferredClusterId } from "../../services/prototypeStore.js";

let activeNodeId = "policy";
let activeGroup = "all";

const nodeCluster = Object.freeze({
  "src-identity": "identity",
  "src-vehicle": "vehicle",
  "src-travel": "travel",
  "src-finance": "financial",
  "src-org": "organization",
  message: "communications",
  insurance: "vehicle",
  leasing: "vehicle",
  logistics: "vehicle",
  saas: "organization"
});

/** @param {string} group */
function groupMeta(group) {
  if (group === "source") return { label: "منبع داده", icon: "database", index: "01" };
  if (group === "control") return { label: "کنترل رهجو", icon: "lock", index: "02" };
  if (group === "delivery") return { label: "تحویل", icon: "api", index: "03" };
  return { label: "کاربرد", icon: "business", index: "04" };
}

/** @param {string} id */
function nodeById(id) {
  return ecosystemNodes.find((node) => node.id === id);
}

function connectedIds() {
  const ids = new Set([activeNodeId]);
  ecosystemEdges.forEach(([from, to]) => {
    if (from === activeNodeId) ids.add(to);
    if (to === activeNodeId) ids.add(from);
  });
  return ids;
}

function graphLines() {
  const lines = ecosystemEdges.map(([fromId, toId]) => {
    const from = nodeById(fromId);
    const to = nodeById(toId);
    if (!from || !to) return "";
    return `<line data-map-edge data-from="${fromId}" data-to="${toId}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" marker-end="url(#map-arrow)" />`;
  }).join("");
  return `<defs><marker id="map-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 10 5 0 10Z" /></marker></defs>${lines}`;
}

function graphNodes() {
  return ecosystemNodes.map((node) => {
    const meta = groupMeta(node.group);
    return `<button class="map-node map-node--${node.group}" type="button" style="--x:${node.x}%;--y:${node.y}%" data-map-node="${node.id}" data-map-group="${node.group}" aria-pressed="${activeNodeId === node.id}"><span>${icon(meta.icon, { size: 16 })}</span><small>${meta.index}</small><strong>${node.label}</strong></button>`;
  }).join("");
}

/** @param {(typeof ecosystemNodes)[number]} node */
function contextualActions(node) {
  const cluster = nodeCluster[node.id];
  if (node.group === "source") {
    return `<a data-link class="button button--secondary" href="/data">دیدن در اطلس</a>${cluster ? `<a data-link class="button button--primary" data-map-request-cluster="${cluster}" href="/request">بررسی دسترسی ${icon("arrow", { size: 15 })}</a>` : ""}`;
  }
  if (node.group === "control") {
    return `<a data-link class="button button--secondary" href="/platform">جایگاه در معماری</a><a data-link class="button button--primary" href="/trust">منطق Gate ${icon("arrow", { size: 15 })}</a>`;
  }
  if (node.group === "delivery") {
    return `<a data-link class="button button--secondary" href="/platform">معماری تحویل</a><a data-link class="button button--primary" href="/dashboard">دیدن در کنسول ${icon("arrow", { size: 15 })}</a>`;
  }
  return `<a data-link class="button button--secondary" href="/data">داده‌های مرتبط</a>${cluster ? `<a data-link class="button button--primary" data-map-request-cluster="${cluster}" href="/request">ساخت درخواست نمونه ${icon("arrow", { size: 15 })}</a>` : `<a data-link class="button button--primary" href="/request">ساخت درخواست نمونه ${icon("arrow", { size: 15 })}</a>`}`;
}

function detailPanel() {
  const node = nodeById(activeNodeId) ?? ecosystemNodes[0];
  const meta = groupMeta(node.group);
  const incoming = ecosystemEdges.filter(([, to]) => to === node.id).map(([from]) => nodeById(from)?.label).filter(Boolean);
  const outgoing = ecosystemEdges.filter(([from]) => from === node.id).map(([, to]) => nodeById(to)?.label).filter(Boolean);
  return `<div class="map-detail__heading"><span>${icon(meta.icon, { size: 23 })}</span><div><small>${meta.label}</small><h2>${node.label}</h2></div></div><p>${node.description}</p><dl><div><dt>ورودی از</dt><dd>${incoming.length ? incoming.join("، ") : "—"}</dd></div><div><dt>خروجی به</dt><dd>${outgoing.length ? outgoing.join("، ") : "—"}</dd></div></dl><div class="map-detail__explain">${icon("node", { size: 18 })}<span>انتخاب گره، ارتباط مستقیم و قدم بعدی مرتبط با آن را نشان می‌دهد.</span></div><div class="map-detail__actions">${contextualActions(node)}</div>`;
}

function stageSummary() {
  return ["source", "control", "delivery", "industry"].map((group) => {
    const meta = groupMeta(group);
    const count = ecosystemNodes.filter((node) => node.group === group).length;
    return `<button type="button" data-group-filter="${group}" aria-pressed="${activeGroup === group}"><span>${icon(meta.icon, { size: 19 })}</span><div><small>${meta.index}</small><strong>${meta.label}</strong></div><em>${count}</em></button>`;
  }).join("");
}

export function renderPresentationMapPage() {
  const content = `<section class="map-hero"><div class="container"><div><h1>نقشه اکوسیستم داده</h1><p>نمای تعاملی حرکت اطلاعات از منبع تا کنترل، کانال تحویل و کاربرد سازمانی. هر گره حالا به صفحه یا اقدام بعدی خودش متصل است.</p></div><div class="map-hero__legend"><span><i class="source"></i>منبع</span><span><i class="control"></i>کنترل</span><span><i class="delivery"></i>تحویل</span><span><i class="industry"></i>کاربرد</span></div></div></section><section class="container map-workspace"><div class="map-stage-filters"><button type="button" data-group-filter="all" aria-pressed="${activeGroup === "all"}">${icon("atlas", { size: 18 })}<span>همه مسیرها</span></button>${stageSummary()}</div><div class="map-layout"><div class="map-canvas-wrap"><div class="map-bands" aria-hidden="true"><span>منابع داده</span><span>لایه کنترل رهجو</span><span>تحویل و عملیات</span><span>کاربرد سازمانی</span></div><div class="map-canvas" aria-label="نقشه تعاملی اکوسیستم"><svg class="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${graphLines()}</svg>${graphNodes()}</div><div class="map-canvas-note">${icon("shield", { size: 17 })}<span>روی هر گره بزنید؛ مسیر و اقدام مرتبط در پنل کناری فعال می‌شود.</span></div></div><aside id="presentation-map-detail" class="map-detail">${detailPanel()}</aside></div></section><section class="map-reading"><div class="container"><header><small>خواندن نقشه</small><h2>چهار مرحله، یک زنجیره مسئولیت</h2></header><div class="map-reading-grid">${["source", "control", "delivery", "industry"].map((group) => { const meta = groupMeta(group); return `<article><span>${meta.index}</span><div>${icon(meta.icon, { size: 22 })}<h3>${meta.label}</h3><p>${group === "source" ? "منشأ و دامنه اطلاعات پیش از مصرف مشخص می‌شود." : group === "control" ? "نوع مشتری و هدف استفاده در Gate بررسی می‌شود." : group === "delivery" ? "API، Workflow، پیام و کنسول کانال‌های استاندارد مصرف‌اند." : "ارزش نهایی در یک مسئله واقعی سازمانی سنجیده می‌شود."}</p></div></article>`; }).join("")}</div></div></section>`;
  return siteShell({ content, activePath: "/map" });
}

function applyMapState() {
  const connected = connectedIds();
  document.querySelectorAll("[data-map-node]").forEach((node) => {
    const id = node.getAttribute("data-map-node") ?? "";
    const group = node.getAttribute("data-map-group") ?? "";
    const groupVisible = activeGroup === "all" || group === activeGroup || id === activeNodeId;
    node.toggleAttribute("data-hidden-group", !groupVisible);
    node.toggleAttribute("data-dimmed", groupVisible && !connected.has(id));
    node.setAttribute("aria-pressed", String(id === activeNodeId));
  });
  document.querySelectorAll("[data-map-edge]").forEach((edge) => {
    const from = edge.getAttribute("data-from") ?? "";
    const to = edge.getAttribute("data-to") ?? "";
    const active = from === activeNodeId || to === activeNodeId;
    const fromGroup = nodeById(from)?.group;
    const toGroup = nodeById(to)?.group;
    const groupVisible = activeGroup === "all" || fromGroup === activeGroup || toGroup === activeGroup;
    edge.toggleAttribute("data-active", active);
    edge.toggleAttribute("data-dimmed", !active);
    edge.toggleAttribute("data-hidden-group", !groupVisible);
  });
  document.querySelectorAll("[data-group-filter]").forEach((filter) => filter.setAttribute("aria-pressed", String(filter.getAttribute("data-group-filter") === activeGroup)));
}

function bindDetailActions() {
  document.querySelectorAll("[data-map-request-cluster]").forEach((control) => control.addEventListener("click", () => {
    const cluster = control.getAttribute("data-map-request-cluster");
    if (cluster) setPreferredClusterId(cluster);
  }, { once: true }));
}

export function mountPresentationMapPage() {
  document.querySelectorAll("[data-map-node]").forEach((node) => node.addEventListener("click", () => {
    activeNodeId = node.getAttribute("data-map-node") ?? ecosystemNodes[0].id;
    const detail = document.querySelector("#presentation-map-detail");
    if (detail instanceof HTMLElement) detail.innerHTML = detailPanel();
    bindDetailActions();
    applyMapState();
  }));
  document.querySelectorAll("[data-group-filter]").forEach((filter) => filter.addEventListener("click", () => {
    activeGroup = filter.getAttribute("data-group-filter") ?? "all";
    applyMapState();
  }));
  applyMapState();
  bindDetailActions();
}
