/** @param {string} name */
export function icon(name) {
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
