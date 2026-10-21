/**
 * Accept an opaque one-time token or a complete invitation/recovery link.
 * Some desktop browser bridges omit URL fragments during navigation. Keeping
 * a manual paste fallback avoids making the account impossible to activate.
 * This never sends the token through a query string or stores it locally.
 */
/** @param {unknown} value @param {string} [expectedMode] @returns {string} */
export function parseOneTimeToken(value, expectedMode = "") {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw || raw.length > 2048) return "";

  let token = raw;
  if (raw.includes("#") || raw.startsWith("token=") || raw.startsWith("mode=")) {
    const fragment = raw.includes("#") ? raw.slice(raw.indexOf("#") + 1) : raw;
    const params = new URLSearchParams(fragment);
    if (expectedMode && params.get("mode") && params.get("mode") !== expectedMode) return "";
    token = params.get("token") || "";
  } else if (raw.includes("://")) {
    return ""; // Never infer a token from an unrelated URL.
  }

  return /^[A-Za-z0-9_-]{32,256}$/.test(token) ? token : "";
}
