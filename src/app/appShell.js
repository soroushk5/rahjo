import { brandLogo } from "../components/brandLogo.js";
import { icon } from "../components/icons.js";
/** @param {{content: string, activePath: string, title: string}} options */
export function appShell({ content, activePath, title }) {
  /** @param {string} path @param {string} iconName @param {string} label */
  const nav = (path, iconName, label) => `<a data-link href="${path}" ${activePath === path ? 'aria-current="page"' : ""}><span>${icon(iconName)}</span><span>${label}</span></a>`;
  return `<div class="app-shell"><aside class="app-sidebar"><a data-link href="/">${brandLogo({ inverted:true })}</a><div class="sidebar-kicker">DECISION ROOM</div><nav class="app-nav" aria-label="ناوبری محصول">${nav("/dashboard","dashboard","میز تصمیم")}${nav("/request","requests","درخواست جدید")}${nav("/stories","story","روایت‌ها")}${nav("/map","atlas","نقشه سیستم")}</nav><div class="app-sidebar__footer"><span class="live-dot"></span> Demo workspace</div></aside><div class="app-main"><header class="app-topbar"><div><small>رهجو / فضای نمایشی</small><strong>${title}</strong></div><div class="site-header__actions"><button class="icon-button" aria-label="جست‌وجو">${icon("search")}</button><button class="icon-button" aria-label="اعلان‌ها">${icon("bell")}</button></div></header><main id="main-content" class="app-content">${content}</main></div></div>`;
}
