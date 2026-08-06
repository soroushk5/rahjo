/** @param {string} name */
export function icon(name) {
  /** @type {Record<string, string>} */
  const icons = {
    dashboard: "▦",
    requests: "◎",
    api: "⌘",
    workflow: "⌁",
    reports: "⌁",
    settings: "⚙",
    identity: "◉",
    phone: "▯",
    bank: "▤",
    vehicle: "◇",
    address: "⌂",
    business: "▣",
    search: "⌕",
    bell: "◌",
    check: "✓",
    arrow: "←"
  };
  return icons[name] ?? "•";
}
