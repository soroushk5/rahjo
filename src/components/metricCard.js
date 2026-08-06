import { escapeHtml } from "../lib/html.js";

/** @param {{label: string, value: string, delta: string}} metric */
export function metricCard(metric) {
  return `
    <article class="metric-card card">
      <div class="metric-card__label"><span>${escapeHtml(metric.label)}</span><span aria-hidden="true">↗</span></div>
      <p class="metric-card__value">${escapeHtml(metric.value)}</p>
      <div class="metric-card__delta">${escapeHtml(metric.delta)}</div>
    </article>`;
}
