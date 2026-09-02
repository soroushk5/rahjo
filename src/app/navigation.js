export const publicNavigation = Object.freeze([
  { path: "/", label: "خانه", meta: "مسئله و جایگاه رهجو" },
  { path: "/data", label: "اطلس داده", meta: "خوشه‌ها، حساسیت و کاربرد" },
  { path: "/map", label: "نقشه اکوسیستم", meta: "منبع تا کاربرد" },
  { path: "/platform", label: "معماری", meta: "لایه‌های فنی و تحویل" },
  { path: "/trust", label: "کنترل دسترسی", meta: "Gate، سیاست و ممیزی" }
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
 * Preserved demo/data-access routes. They remain available for traceability but are no longer
 * the primary Phase-1 information architecture.
 */
export const secondaryConsoleNavigation = Object.freeze([
  { path: "/dashboard/requests", label: "درخواست‌های دسترسی — legacy", meta: "نمای دمو درخواست‌های داده", icon: "requests" },
  { path: "/dashboard/data", label: "سبد داده — legacy", meta: "آمادگی و وضعیت عرضه در دمو", icon: "database" },
  { path: "/dashboard/audit", label: "Gate و ممیزی — legacy", meta: "رخدادهای کنترل دسترسی در دمو", icon: "audit" },
  { path: "/request", label: "درخواست دسترسی — legacy", meta: "فرایند چندمرحله‌ای دمو", icon: "workflow" }
]);

export const publicJourney = Object.freeze([
  { path: "/", index: "01", label: "مسئله", title: "رهجو چه چیزی را کنترل می‌کند؟" },
  { path: "/data", index: "02", label: "داده", title: "چه خوشه‌هایی در سبد بررسی‌اند؟" },
  { path: "/map", index: "03", label: "جریان", title: "داده از کجا تا کجا حرکت می‌کند؟" },
  { path: "/platform", index: "04", label: "معماری", title: "کنترل در کدام لایه اجرا می‌شود؟" },
  { path: "/trust", index: "05", label: "Gate", title: "چه چیزی دسترسی را مجاز یا متوقف می‌کند؟" },
  { path: "/login", index: "06", label: "Workspace", title: "این منطق در فضای عملیاتی چگونه دیده می‌شود؟" }
]);

export const allDestinations = Object.freeze([
  ...publicNavigation,
  ...consoleNavigation,
  ...secondaryConsoleNavigation,
  { path: "/login", label: "ورود", meta: "محیط نمایشی رهجو" }
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
