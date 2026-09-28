/** @type {Record<string, string>} */
const paths = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/>',
  atlas: '<circle cx="12" cy="12" r="8.5"/><path d="M3.7 9h16.6M3.7 15h16.6M12 3.5c2.2 2.3 3.3 5.1 3.3 8.5S14.2 18.2 12 20.5C9.8 18.2 8.7 15.4 8.7 12S9.8 5.8 12 3.5Z"/>',
  story: '<path d="M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3V4.5Z"/><path d="M8 8h7M8 11.5h7M8 15h4"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  shield: '<path d="M12 3 20 6v5c0 5.2-3.2 8.5-8 10-4.8-1.5-8-4.8-8-10V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
  dashboard: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="4" rx="1.5"/><rect x="13.5" y="10.5" width="7" height="10" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/>',
  requests: '<path d="M6 3.5h9l3 3V20.5H6z"/><path d="M15 3.5v3h3M9 11h6M9 15h4"/>',
  api: '<path d="M8.5 8.5 5 12l3.5 3.5M15.5 8.5 19 12l-3.5 3.5M13.5 6l-3 12"/>',
  workflow: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6h4a3 3 0 0 1 3 3v6.5M15.5 18h-4a3 3 0 0 1-3-3V8.5"/>',
  reports: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21H10v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3.1 14H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  identity: '<circle cx="12" cy="8" r="3"/><path d="M5 20c.6-4.3 3-6.5 7-6.5s6.4 2.2 7 6.5"/>',
  phone: '<rect x="7" y="2.8" width="10" height="18.4" rx="2.2"/><path d="M10 5.5h4M11 18.5h2"/>',
  bank: '<path d="m3.5 9 8.5-5 8.5 5H3.5ZM5.5 10.5h13M6.5 10.5v7M10.2 10.5v7M13.8 10.5v7M17.5 10.5v7M4 20h16"/>',
  vehicle: '<path d="m5 14 1.5-5h11l1.5 5M4 14h16v4H4z"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/>',
  address: '<path d="M20 10c0 5.5-8 11-8 11S4 15.5 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  business: '<path d="M4 20V7h10v13M14 11h6v9M7 10h1M11 10h1M7 14h1M11 14h1M7 18h1M11 18h1M17 14h1M17 18h1"/>',
  database: '<ellipse cx="12" cy="5" rx="7.5" ry="3"/><path d="M4.5 5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V5M4.5 11v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
  travel: '<path d="M4 18h16M7 18l2-7h6l2 7M10 11V5h4v6M9 5h6M8 8h8"/>',
  message: '<path d="M4 5h16v11H8l-4 4V5Z"/><path d="M8 9h8M8 12h5"/>',
  legal: '<path d="M12 3v18M7 5h10M5 8l-3 5h6L5 8ZM19 8l-3 5h6l-3-5ZM8 21h8"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6M16 5.5a2.7 2.7 0 0 1 0 5.2M16 14c3 .2 4.5 2 5 5"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.2 1.2M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.2-1.2"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  bell: '<path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 5 2 5.5 2 5.5h-15S6.5 15 6.5 10Z"/><path d="M10 19h4"/>',
  check: '<path d="m5 12 4.2 4.2L19 6.5"/>',
  arrow: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  node: '<circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="m7.5 11 9-4M7.5 13l9 4"/>',
  spark: '<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/>',
  audit: '<path d="M5 4h11l3 3v13H5z"/><path d="M16 4v3h3M8 11h8M8 15h5"/><circle cx="16.8" cy="16.8" r="2.7"/><path d="m18.8 18.8 2 2"/>',
  signal: '<path d="M4 18h2M9 14h2v4H9zM14 10h2v8h-2zM19 6h2v12h-2z"/>',
  document: '<path d="M6 3.5h9l3 3V20.5H6z"/><path d="M15 3.5v3h3M9 11h6M9 15h6"/>',
  eye: '<path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/>',
  timeline: '<path d="M6 3v18M6 7h8M6 12h12M6 17h6"/><circle cx="6" cy="7" r="1.5"/><circle cx="6" cy="12" r="1.5"/><circle cx="6" cy="17" r="1.5"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M19 13v6H5V5h6"/>',
  logout: '<path d="M10 4H5v16h5"/><path d="M14 8l4 4-4 4M18 12H9"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 0 1 4.8 1c0 1.7-2.5 2.1-2.5 4M12 18h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'
};

/** @param {string} name @param {{label?: string, size?: number}} [options] */
export function icon(name, options = {}) {
  const { label = "", size = 20 } = options;
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${paths[name] ?? paths.node}</svg>`;
}
