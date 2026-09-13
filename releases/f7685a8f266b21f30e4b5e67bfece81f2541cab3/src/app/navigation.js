// @ts-nocheck
// Canonical public destinations. These remain routable/direct-link surfaces; the
// public header intentionally has no tab navigation.
export const publicNavigation = Object.freeze([
  { path: "/", label: "خانه", meta: "رهجو در یک نگاه" },
  { path: "/product", label: "محصول", meta: "مشتری، فروش و اجرای کار" }
]);

export const consoleNavigation = Object.freeze([
  { path: "/dashboard", label: "داشبورد", meta: "اقدام‌های امروز و وضعیت عملیات", icon: "dashboard" },
  { path: "/customers", label: "مشتریان", meta: "پروفایل و حافظهٔ تجاری مشتری", icon: "users" },
  { path: "/sales", label: "فروش", meta: "سرنخ‌ها، فرصت‌ها و مسیر فروش", icon: "reports" },
  { path: "/services-admin", label: "خدمات", meta: "کاتالوگ و پیکربندی خدمات", icon: "settings" },
  { path: "/requests", label: "درخواست‌ها", meta: "درخواست‌های خدمت و وضعیت اجرا", icon: "requests" },
  { path: "/tasks", label: "کارها و پیگیری‌ها", meta: "کارهای امروز، عقب‌افتاده و آینده", icon: "check" },
  { path: "/operations", label: "عملیات و گردش‌کار", meta: "صف اجرا، مراحل و تأییدها", icon: "workflow" },
  { path: "/finance", label: "مالی و اعتبار", meta: "پرداخت، دریافتنی و اعتبار مشتری", icon: "bank" },
  { path: "/documents", label: "اسناد", meta: "فایل‌ها، نسخه‌ها و روابط", icon: "document" },
  { path: "/reports", label: "گزارش‌ها", meta: "فروش، عملیات، مشتری و مالی", icon: "signal" },
  { path: "/audit", label: "ممیزی و کیفیت داده", meta: "تاریخچه تغییرات و مشکلات داده", icon: "shield" },
  { path: "/settings", label: "تنظیمات", meta: "کاربران، نقش‌ها و پیکربندی", icon: "settings" }
]);

export const utilityDestinations = Object.freeze([
  { path: "/login", label: "ورود به رهجو", meta: "ورود به فضای کاری" },
  { path: "/request-service", label: "درخواست خدمت", meta: "ثبت یک درخواست جدید" },
  { path: "/customers/detail", label: "پرونده مشتری", meta: "نمای ۳۶۰ درجه مشتری" },
  { path: "/requests/detail", label: "جزئیات درخواست", meta: "مدارک، اجرا، رسید و نتیجه" }
]);

// Public journey is intentionally short. /contact and older marketing URLs are
// compatibility-only until Rahjo has a real public acquisition/intake flow.
export const publicJourney = Object.freeze([
  { path: "/", index: "01", label: "خانه", title: "رهجو در یک نگاه" },
  { path: "/product", index: "02", label: "محصول", title: "محصول چگونه کار را جلو می‌برد؟" },
  { path: "/login", index: "03", label: "ورود", title: "ورود به فضای کاری" }
]);

export const allDestinations = Object.freeze([
  ...publicNavigation,
  ...utilityDestinations,
  ...consoleNavigation
]);

export function routeLabel(path) {
  return allDestinations.find((item) => item.path === path)?.label ?? "رهجو";
}

export function journeyNeighbors(path) {
  const index = publicJourney.findIndex((item) => item.path === path);
  if (index < 0) return { current: null, previous: null, next: null };
  return {
    current: publicJourney[index],
    previous: index > 0 ? publicJourney[index - 1] : null,
    next: index < publicJourney.length - 1 ? publicJourney[index + 1] : null
  };
}
