export const publicNavigation = Object.freeze([
  { path: "/", label: "خانه", meta: "ارزش عملیاتی امروز و مسیر هوشمندی فردا" },
  { path: "/platform", label: "محصول", meta: "Website، CRM، عملیات، سرویس و داشبورد روی یک هسته" },
  { path: "/data", label: "سرویس‌ها", meta: "خانواده قابلیت‌ها و وضعیت عرضه/بررسی" },
  { path: "/map", label: "نحوه کار", meta: "ورودی تا Case، Action، Outcome و Dashboard" },
  { path: "/trust", label: "اعتماد و کنترل", meta: "Human gate، permission، audit و claim discipline" }
]);

/**
 * Phase-1 primary workspace navigation.
 * These surfaces share one commercial memory and must remain useful with AI disabled.
 */
export const consoleNavigation = Object.freeze([
  { path: "/dashboard", label: "داشبورد", meta: "وضعیت مشتری، درخواست و اقدام", icon: "dashboard", group: "عملیات" },
  { path: "/crm", label: "مشتریان", meta: "Account 360 و حافظه تجاری", icon: "users", group: "عملیات" },
  { path: "/sales", label: "فروش", meta: "سرنخ، فرصت و اقدام بعدی", icon: "reports", group: "عملیات" },
  { path: "/services", label: "سرویس‌ها و APIها", meta: "کاتالوگ، درخواست و وضعیت", icon: "api", group: "اجرا" },
  { path: "/automation", label: "اتوماسیون", meta: "Workflow، Gate و Run", icon: "workflow", group: "اجرا" },
  { path: "/governance", label: "ممیزی و کیفیت داده", meta: "دسترسی، رخداد و Data Quality", icon: "audit", group: "کنترل" },
  { path: "/think-room", label: "اتاق فکر", meta: "لایه هوشمندی آینده روی همان حافظه", icon: "spark", group: "هوشمندی" }
]);

/**
 * Preserved data-access demo routes. They remain available for traceability but are no longer
 * the primary Phase-1 information architecture.
 */
export const secondaryConsoleNavigation = Object.freeze([
  { path: "/dashboard/requests", label: "درخواست‌های دسترسی — legacy", meta: "نمای دمو درخواست‌های داده", icon: "requests" },
  { path: "/dashboard/data", label: "سبد داده — legacy", meta: "آمادگی و وضعیت عرضه در دمو", icon: "database" },
  { path: "/dashboard/audit", label: "Gate و ممیزی — legacy", meta: "رخدادهای کنترل دسترسی در دمو", icon: "audit" },
  { path: "/request", label: "درخواست دسترسی — legacy", meta: "فرایند چندمرحله‌ای دمو", icon: "workflow" }
]);

export const publicJourney = Object.freeze([
  { path: "/", index: "01", label: "جایگاه", title: "رهجو امروز چه مسئله عملیاتی را حل می‌کند؟" },
  { path: "/platform", index: "02", label: "محصول", title: "Website، CRM، سرویس و عملیات چگونه یک سیستم می‌شوند؟" },
  { path: "/data", index: "03", label: "سرویس", title: "چه capabilityهایی نمایش داده می‌شوند و وضعیتشان چیست؟" },
  { path: "/map", index: "04", label: "جریان", title: "ورودی چگونه به Case، Action، Outcome و Dashboard می‌رسد؟" },
  { path: "/trust", index: "05", label: "کنترل", title: "چه چیزی یک اقدام یا ادعا را مجاز، محدود یا متوقف می‌کند؟" },
  { path: "/login", index: "06", label: "Workspace", title: "این مدل در محیط عملیاتی دمو چگونه دیده می‌شود؟" }
]);

export const allDestinations = Object.freeze([
  ...publicNavigation,
  ...consoleNavigation,
  ...secondaryConsoleNavigation,
  { path: "/login", label: "ورود", meta: "محیط نمایشی Operational Foundation" }
]);

/** @param {string} path */
export function routeLabel(path) {
  return allDestinations.find((item) => item.path === path)?.label ?? "رهجو";
}

/** @param {string} path */
export function journeyNeighbors(path) {
  const index = publicJourney.findIndex((item) => item.path === path);
  if (index < 0) return { current: null, previous: null, next: null };
  return {
    current: publicJourney[index],
    previous: index > 0 ? publicJourney[index - 1] : null,
    next: index < publicJourney.length - 1 ? publicJourney[index + 1] : null
  };
}
