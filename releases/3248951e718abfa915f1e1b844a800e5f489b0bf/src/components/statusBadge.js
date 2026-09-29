import { escapeHtml } from "../lib/html.js";

/** @param {string} label */
export function statusBadge(label) {
  return `<span class="status-badge">${escapeHtml(label)}</span>`;
}
