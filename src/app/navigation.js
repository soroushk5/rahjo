// @ts-nocheck
export const publicNavigation = Object.freeze([
  { path: "/", label: "خانه", meta: "رهجو چیست و چه مسئله‌ای را حل می‌کند" },
  { path: "/product", label: "محصول", meta: "مشتری، پرونده، تصمیم، اجرا و نتیجه در یک سیستم" },
  { path: "/services", label: "خدمات", meta: "خدمت به‌عنوان قرارداد اجرایی قابل پیگیری" },
  { path: "/use-cases", label: "موارد استفاده", meta: "الگوهای عملیاتی مناسب رهجو" },
  { path: "/how-it-works", label: "نحوهٔ کار", meta: "مسیر مشتری از ورودی تا نتیجه" }
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
  { path: "/pilot", label: "راه‌اندازی", meta: "تعریف flow، پیکربندی، پایلوت و پذیرش" },
  { path: "/trust", label: "اعتماد و کنترل", meta: "workspace، تأیید انسانی، ممیزی و fail-closed" },
  { path: "/about", label: "دربارهٔ رهجو", meta: "مسئله و رویکرد توسعه" },
  { path: "/contact", label: "شروع همکاری", meta: "بررسی یک جریان واقعی کسب‌وکار" },
  { path: "/login", label: "ورود به رهجو", meta: "ورود به Workspace یا Golden Demo صریح" },
  { path: "/request-service", label: "درخواست خدمت", meta: "ثبت یک درخواست جدید" },
  { path: "/track-request", label: "پیگیری پرونده", meta: "پیگیری از مرز امن Workspace" },
  { path: "/customers/detail", label: "پرونده مشتری", meta: "نمای ۳۶۰ درجه مشتری" },
  { path: "/requests/detail", label: "جزئیات درخواست", meta: "مدارک، اجرا، رسید و نتیجه" }
]);

// Compatibility metadata for retired presentation routes. These URLs redirect to
// canonical W14 surfaces and do not define the current information architecture.
export const publicJourney = Object.freeze([
  { path: "/", index: "01", label: "جایگاه", title: "رهجو چه مسئله‌ای را حل می‌کند؟" },
  { path: "/platform", index: "02", label: "محصول", title: "محصول چگونه کار مشتری را به نتیجه وصل می‌کند؟" },
  { path: "/data", index: "03", label: "خدمات", title: "خدمت چگونه به یک قرارداد اجرایی تبدیل می‌شود؟" },
  { path: "/map", index: "04", label: "نقشهٔ کار", title: "مشتری چگونه از ورودی تا نتیجه حرکت می‌کند؟" },
  { path: "/trust", index: "05", label: "کنترل", title: "اختیار، تأیید و ممیزی چگونه کنترل می‌شوند؟" },
  { path: "/login", index: "06", label: "محیط عملیاتی", title: "ورود به Workspace یا Golden Demo چگونه انجام می‌شود؟" }
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
