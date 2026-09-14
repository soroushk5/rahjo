export const demoOverviewMetrics = Object.freeze([
  { id: "access", label: "وضعیت دسترسی", value: "کنترل‌شده", note: "فعال‌سازی فقط پس از Gate", icon: "shield", tone: "teal" },
  { id: "portfolio", label: "عناوین سبد بررسی", value: "۵۲", note: "عنوان محصول؛ نه سرویس فعال", icon: "database", tone: "blue" },
  { id: "clusters", label: "خوشه‌های داده", value: "۰۶", note: "مدل دسته‌بندی فعلی", icon: "layers", tone: "violet" },
  { id: "requests", label: "درخواست‌های دمو", value: "۱۲", note: "صرفاً برای نمایش جریان", icon: "requests", tone: "amber" }
]);

export const demoTrend = Object.freeze([
  { label: "هفته ۱", value: 18 },
  { label: "هفته ۲", value: 26 },
  { label: "هفته ۳", value: 22 },
  { label: "هفته ۴", value: 34 },
  { label: "هفته ۵", value: 31 },
  { label: "هفته ۶", value: 42 },
  { label: "هفته ۷", value: 39 },
  { label: "هفته ۸", value: 48 }
]);

export const demoPortfolio = Object.freeze([
  { cluster: "خودرو و مالکیت", sensitivity: "حساس", source: "نیازمند مدرک", rights: "در بررسی", technical: "آماده Sandbox", launch: "مسدود", progress: 42 },
  { cluster: "هویت و تطبیق", sensitivity: "بسیار حساس", source: "نیازمند مدرک", rights: "در بررسی", technical: "نمونه قرارداد", launch: "مسدود", progress: 34 },
  { cluster: "سفر و انتظامی", sensitivity: "بسیار حساس", source: "نامشخص", rights: "نامشخص", technical: "نمونه اولیه", launch: "مسدود", progress: 24 },
  { cluster: "مالی و بانکی", sensitivity: "بسیار حساس", source: "نیازمند مدرک", rights: "مشروط", technical: "نمونه قرارداد", launch: "مسدود", progress: 31 },
  { cluster: "ارتباطات و پیام", sensitivity: "متوسط", source: "قابل طراحی", rights: "مشروط", technical: "پایلوت", launch: "قابل پایلوت", progress: 72 },
  { cluster: "سازمان و کسب‌وکار", sensitivity: "کنترل‌شده", source: "در بررسی", rights: "در بررسی", technical: "آماده Sandbox", launch: "مسدود", progress: 48 }
]);

export const demoSeedRequests = Object.freeze([
  { referenceId: "RA-VEH-24051", serviceId: "vehicle", organization: "بیمه نمونه آریا", purpose: "تکمیل ارزیابی پرونده خسارت خودرو", monthlyVolume: "small", status: "بررسی حقوقی", createdAt: "2026-08-07T09:25:00.000Z" },
  { referenceId: "RA-ID-24050", serviceId: "identity", organization: "لیزینگ نمونه سپهر", purpose: "کنترل اطلاعات متقاضی در مرحله پذیرش", monthlyVolume: "pilot", status: "نیازمند مدرک", createdAt: "2026-08-07T08:40:00.000Z" },
  { referenceId: "RA-COM-24049", serviceId: "communications", organization: "سامانه ناوگان نمونه", purpose: "ارسال اعلان تراکنشی در فرایند عملیات", monthlyVolume: "medium", status: "قابل پایلوت", createdAt: "2026-08-06T14:15:00.000Z" },
  { referenceId: "RA-ORG-24048", serviceId: "organization", organization: "SaaS سازمانی نمونه", purpose: "پذیرش فروشنده و کنترل شخصیت حقوقی", monthlyVolume: "small", status: "در بررسی", createdAt: "2026-08-06T11:05:00.000Z" },
  { referenceId: "RA-FIN-24047", serviceId: "financial", organization: "فین‌تک نمونه", purpose: "تطبیق اطلاعات حساب برای فرایند قراردادی", monthlyVolume: "pilot", status: "بررسی حقوقی", createdAt: "2026-08-05T16:20:00.000Z" }
]);

export const demoAuditEvents = Object.freeze([
  { id: "AUD-914", time: "۱۴:۳۲", title: "درخواست خودرو وارد Gate شد", detail: "RA-VEH-24051 · بررسی مدرک منبع و دامنه استفاده", actor: "Policy Engine", tone: "warning", icon: "shield" },
  { id: "AUD-913", time: "۱۳:۴۸", title: "دامنه پاسخ در Sandbox محدود شد", detail: "خوشه هویت · Masking فیلدهای غیرضروری", actor: "API Gateway", tone: "positive", icon: "api" },
  { id: "AUD-912", time: "۱۲:۲۰", title: "مدرک حق عرضه نیازمند بازبینی است", detail: "خوشه مالی · وضعیت به حقوقی ارجاع شد", actor: "Compliance", tone: "warning", icon: "legal" },
  { id: "AUD-911", time: "۱۰:۰۵", title: "درخواست دمو ثبت شد", detail: "RA-COM-24049 · بدون اتصال به داده واقعی", actor: "Demo Workspace", tone: "neutral", icon: "requests" },
  { id: "AUD-910", time: "۰۹:۴۰", title: "Sandbox ارتباطات آماده تست شد", detail: "Schema v0.4 · نمونه داده مصنوعی", actor: "Engineering", tone: "positive", icon: "check" }
]);

export const demoPolicyChecks = Object.freeze([
  { label: "مدرک منبع", state: "نیازمند تکمیل", tone: "warning", note: "هیچ اتصال Production بدون سند منبع فعال نمی‌شود." },
  { label: "حق عرضه", state: "در بررسی", tone: "warning", note: "دامنه مشتری و Purpose باید در قرارداد روشن باشد." },
  { label: "حداقل‌سازی داده", state: "اعمال‌شده در دمو", tone: "positive", note: "نمونه پاسخ فقط فیلدهای لازم را نمایش می‌دهد." },
  { label: "ثبت رویداد", state: "فعال در دمو", tone: "positive", note: "رد فعالیت نمایشی برای توضیح معماری محصول ثبت می‌شود." }
]);

export const demoWorkspace = Object.freeze({
  name: "محیط نمایشی رهجو",
  organization: "شرکت نمونه سازمانی",
  environment: "Sandbox",
  disclaimer: "تمام اعداد، درخواست‌ها و رخدادهای این محیط نمایشی‌اند و به داده واقعی متصل نیستند."
});
