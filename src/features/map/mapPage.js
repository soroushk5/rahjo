import { siteShell } from "../../app/siteShell.js";
import { ecosystemEdges, ecosystemNodes } from "../../data/siteContent.js";
import { icon } from "../../components/icons.js";

let activeNodeId = "policy";

/** @param {string} group */
function groupPresentation(group) {
  if (group === "source") return { label: "منبع", icon: "database" };
  if (group === "control") return { label: "کنترل", icon: "lock" };
  if (group === "delivery") return { label: "تحویل", icon: "api" };
  if (group === "industry") return { label: "کاربرد", icon: "business" };
  return { label: group, icon: "link" };
}

/** @param {string} id */
function nodeById(id) {
  return ecosystemNodes.find((node) => node.id === id);
}

function graphLines() {
  const lines = ecosystemEdges
    .map(([fromId, toId]) => {
      const from = nodeById(fromId);
      const to = nodeById(toId);
      if (!from || !to) return "";
      return `
        <line
          data-edge-from="${fromId}"
          data-edge-to="${toId}"
          x1="${from.x}%"
          y1="${from.y}%"
          x2="${to.x}%"
          y2="${to.y}%"
          marker-end="url(#flow-arrow)"
        />`;
    })
    .join("");

  return `<defs><marker id="flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>${lines}`;
}

function graphNodes() {
  return ecosystemNodes
    .map(
      (node) => `
        <button
          class="ecosystem-node ecosystem-node--${node.group}"
          style="--x:${node.x}%;--y:${node.y}%"
          type="button"
          data-ecosystem-node="${node.id}"
          aria-pressed="${activeNodeId === node.id}"
        >
          <span>${icon(groupPresentation(node.group).icon, { size: 15 })}</span>
          <small>${groupPresentation(node.group).label}</small>
          <strong>${node.label}</strong>
        </button>`
    )
    .join("");
}

function detailPanel() {
  const node = nodeById(activeNodeId) ?? ecosystemNodes[0];
  const incoming = ecosystemEdges.filter(([, to]) => to === node.id).map(([from]) => nodeById(from)?.label).filter(Boolean);
  const outgoing = ecosystemEdges.filter(([from]) => from === node.id).map(([, to]) => nodeById(to)?.label).filter(Boolean);

  return `
    <article class="ecosystem-detail">
      <div>
        <small>${groupPresentation(node.group).label}</small>
        <h2>${node.label}</h2>
        <p>${node.description}</p>
      </div>
      <dl>
        <div><dt>ورودی از</dt><dd>${incoming.length ? incoming.join("، ") : "—"}</dd></div>
        <div><dt>خروجی به</dt><dd>${outgoing.length ? outgoing.join("، ") : "—"}</dd></div>
      </dl>
    </article>`;
}

export function renderMapPage() {
  const content = `
    <section class="page-hero page-hero--map">
      <div class="container split-heading">
        <div>
          <p class="eyebrow">DATA ECOSYSTEM MAP</p>
          <h1>نقشه اکوسیستم داده رهجو</h1>
        </div>
        <p>
          منابع در بالا، لایه کنترل در میانه، کانال‌های تحویل پایین‌تر و صنایع مصرف‌کننده در انتها قرار گرفته‌اند.
          هر گره را انتخاب کنید تا وابستگی‌های آن روشن شود.
        </p>
      </div>
    </section>

    <section class="container ecosystem-layout">
      <div class="ecosystem-map" aria-label="نقشه تعاملی اکوسیستم داده">
        <div class="ecosystem-band ecosystem-band--sources"><span>منابع داده</span></div>
        <div class="ecosystem-band ecosystem-band--control"><span>لایه کنترل رهجو</span></div>
        <div class="ecosystem-band ecosystem-band--delivery"><span>تحویل و عملیات</span></div>
        <div class="ecosystem-band ecosystem-band--industry"><span>کاربرد سازمانی</span></div>
        <svg class="ecosystem-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          ${graphLines()}
        </svg>
        ${graphNodes()}
      </div>
      <div id="ecosystem-detail">${detailPanel()}</div>
      <div class="ecosystem-legend">
        <span><i class="legend-source"></i>منبع</span>
        <span><i class="legend-control"></i>کنترل</span>
        <span><i class="legend-delivery"></i>تحویل</span>
        <span><i class="legend-industry"></i>کاربرد</span>
      </div>
    </section>`;

  return siteShell({ content, activePath: "/map" });
}

/** @param {() => void} rerender */
export function mountMapPage(rerender) {
  void rerender;

  document.querySelectorAll("[data-ecosystem-node]").forEach((button) => {
    button.addEventListener("click", () => {
      activeNodeId = button.getAttribute("data-ecosystem-node") ?? ecosystemNodes[0].id;
      const connectedIds = new Set([activeNodeId]);

      ecosystemEdges.forEach(([from, to]) => {
        if (from === activeNodeId) connectedIds.add(to);
        if (to === activeNodeId) connectedIds.add(from);
      });

      document.querySelectorAll("[data-ecosystem-node]").forEach((node) => {
        const id = node.getAttribute("data-ecosystem-node") ?? "";
        node.setAttribute("aria-pressed", String(node === button));
        node.toggleAttribute("data-dimmed", !connectedIds.has(id));
      });

      document.querySelectorAll("[data-edge-from]").forEach((edge) => {
        const from = edge.getAttribute("data-edge-from");
        const to = edge.getAttribute("data-edge-to");
        edge.toggleAttribute("data-active", from === activeNodeId || to === activeNodeId);
        edge.toggleAttribute("data-dimmed", from !== activeNodeId && to !== activeNodeId);
      });

      const detail = document.querySelector("#ecosystem-detail");
      if (detail instanceof HTMLElement) detail.innerHTML = detailPanel();
    });
  });
}
