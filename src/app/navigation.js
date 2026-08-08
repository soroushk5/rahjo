export const publicNavigation = Object.freeze([
  { path: "/", label: "خانه", meta: "مسئله و جایگاه رهجو" },
  { path: "/data", label: "اطلس داده", meta: "خوشه‌ها، حساسیت و کاربرد" },
  { path: "/map", label: "نقشه اکوسیستم", meta: "منبع تا کاربرد" },
  { path: "/platform", label: "معماری", meta: "لایه‌های فنی و تحویل" },
  { path: "/trust", label: "کنترل دسترسی", meta: "Gate، سیاست و ممیزی" }
]);

export const consoleNavigation = Object.freeze([
  { path: "/dashboard", label: "نمای کلی", meta: "وضعیت سبد و درخواست‌ها", icon: "dashboard" },
  { path: "/dashboard/requests", label: "درخواست‌ها", meta: "جست‌وجو، وضعیت و جزئیات", icon: "requests" },
  { path: "/dashboard/data", label: "سبد داده", meta: "آمادگی و وضعیت عرضه", icon: "database" },
  { path: "/dashboard/audit", label: "کنترل و ممیزی", meta: "Gate و رخدادهای دمو", icon: "audit" },
  { path: "/request", label: "درخواست دسترسی", meta: "فرایند چندمرحله‌ای", icon: "workflow" }
]);

export const publicJourney = Object.freeze([
  { path: "/", index: "01", label: "مسئله", title: "رهجو چه چیزی را کنترل می‌کند؟" },
  { path: "/data", index: "02", label: "داده", title: "چه خوشه‌هایی در سبد بررسی‌اند؟" },
  { path: "/map", index: "03", label: "جریان", title: "داده از کجا تا کجا حرکت می‌کند؟" },
  { path: "/platform", index: "04", label: "معماری", title: "کنترل در کدام لایه اجرا می‌شود؟" },
  { path: "/trust", index: "05", label: "Gate", title: "چه چیزی دسترسی را مجاز یا متوقف می‌کند؟" },
  { path: "/login", index: "06", label: "کنسول", title: "این منطق در محصول چگونه دیده می‌شود؟" }
]);

export const allDestinations = Object.freeze([
  ...publicNavigation,
  ...consoleNavigation,
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
