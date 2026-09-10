/**
 * Escapes text before interpolating untrusted values into HTML.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** @param {Element | null} element @param {string} eventName @param {(event: Event) => void} handler */
export function on(element, eventName, handler) {
  element?.addEventListener(eventName, handler);
}
