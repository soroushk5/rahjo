// @ts-nocheck
export const publicNavigation = Object.freeze([
  { path: "/", label: "خانه", meta: "رهجو چیست و چه مسئله‌ای را حل می‌کند" },
  { path: "/product", label: "محصول", meta: "مشتری، فروش، خدمت و عملیات در یک سیستم" },
  { path: "/services", label: "خدمات", meta: "خدمات قابل ارائه و الزامات هر خدمت" },
  { path: "/use-cases", label: "موارد استفاده", meta: "رهجو برای چه کسب‌وکارهایی مناسب است" },
  { path: "/how-it-works", label: "نحوهٔ کار", meta: "مسیر مشتری از ورود تا نتیجه" }
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
  { path: "/pilot", label: "راه‌اندازی", meta: "شناخت، پیکربندی، پایلوت و استقرار" },
  { path: "/trust", label: "اعتماد و کنترل", meta: "دسترسی، تأیید و تاریخچه" },
  { path: "/about", label: "دربارهٔ رهجو", meta: "مسئله و رویکرد توسعه" },
  { path: "/contact", label: "شروع همکاری", meta: "بررسی کسب‌وکار من" },
  { path: "/login", label: "دموی رهجو", meta: "ورود مهمان به محیط نمایشی" },
  { path: "/request-service", label: "درخواست خدمت", meta: "ثبت یک درخواست جدید" },
  { path: "/track-request", label: "پیگیری درخواست", meta: "مشاهده وضعیت با کد پیگیری" },
  { path: "/customers/detail", label: "پرونده مشتری", meta: "نمای ۳۶۰ درجه مشتری" },
  { path: "/requests/detail", label: "جزئیات درخواست", meta: "مدارک، پرداخت، اجرا و نتیجه" }
]);

// Compatibility metadata for the retired presentation components. These paths are
// resolved to their phase-one equivalents by the router and stay out of live nav.
export const publicJourney = Object.freeze([
  { path: "/", index: "01", label: "جایگاه", title: "رهجو چه مسئله‌ای را حل می‌کند؟" },
  { path: "/platform", index: "02", label: "محصول", title: "محصول یکپارچه چگونه کار می‌کند؟" },
  { path: "/data", index: "03", label: "خدمات", title: "چه خدماتی در دسترس است؟" },
  { path: "/map", index: "04", label: "جریان", title: "مشتری چگونه به نتیجه می‌رسد؟" },
  { path: "/trust", index: "05", label: "کنترل", title: "اعتماد و کنترل چگونه حفظ می‌شود؟" },
  { path: "/login", index: "06", label: "محیط عملیاتی", title: "دموی محصول چگونه آغاز می‌شود؟" }
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
