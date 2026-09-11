/** @param {{compact?: boolean, inverted?: boolean}} [options] */
export function brandLogo(options = {}) {
  const { compact = false, inverted = false } = options;
  const wordmark = compact
    ? ""
    : `<span class="brand-logo__wordmark"><span class="brand-logo__fa">رهجو</span><span class="brand-logo__en">RAHJO</span></span>`;

  return `
    <span class="brand-logo" aria-label="رهجو">
      <svg class="brand-logo__symbol" viewBox="0 0 64 64" role="img" aria-hidden="true">
        <path d="M32 5 55 18v27L32 59 9 46V19Z" fill="none" stroke="${inverted ? "#ffffff" : "#0B1D33"}" stroke-width="7" stroke-linejoin="round"/>
        <path d="M19 45V25l13-8 13 8v12L31 45l-12 7" fill="none" stroke="${inverted ? "#ffffff" : "#0B1D33"}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="32" cy="25" r="6" fill="#0FA3B1"/>
        <circle cx="49" cy="48" r="8" fill="#F5A623"/>
        <path d="m45.5 48 2.4 2.5 4.6-5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      ${wordmark}
    </span>`;
}
