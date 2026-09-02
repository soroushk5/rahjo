export const operationalWorkspace = Object.freeze({
  organization: "رهجو — محیط نمونه",
  environment: "Sandbox / No-AI",
  disclaimer: "این نما برای هم‌راستاسازی فاز اول ساخته شده است. داده‌ها نمونه‌اند و هیچ سرویس/API را production-ready یا فعال اعلام نمی‌کنند."
});

export const operationalMetrics = Object.freeze([
  { label: "حساب‌های در جریان", value: "۳", note: "نمونه برای طراحی Account 360", icon: "business", tone: "neutral" },
  { label: "پیگیری‌های باز", value: "۴", note: "وظیفه، مالک و موعد در یک صف", icon: "clock", tone: "warning" },
  { label: "درخواست‌های سرویس", value: "۴", note: "Sandbox و نیازمند Gate", icon: "api", tone: "neutral" },
  { label: "نتیجه ثبت‌شده", value: "۲", note: "Outcome نمونه برای بستن حلقه", icon: "check", tone: "positive" }
]);

export const demoAccounts = Object.freeze([
  {
    id: "ACC-DEMO-001",
    name: "شرکت نمونه آفتاب",
    tier: "حساب سازمانی نمونه",
    owner: "کاربر دمو",
    stage: "در مذاکره",
    nextAction: "تکمیل نیاز و تعیین سرویس مناسب",
    openCases: 2,
    openTasks: 2,
    lastInteraction: "جلسه بررسی نیاز — نمونه",
    source: "فرم وب‌سایت / نمونه"
  },
  {
    id: "ACC-DEMO-002",
    name: "گروه نمونه راهکار",
    tier: "مشتری موجود نمونه",
    owner: "کاربر دمو",
    stage: "در پیگیری",
    nextAction: "بررسی دسترسی و شرایط پایلوت",
    openCases: 1,
    openTasks: 1,
    lastInteraction: "تماس پیگیری — نمونه",
    source: "ورودی اپراتور / نمونه"
  },
  {
    id: "ACC-DEMO-003",
    name: "پلتفرم نمونه حرکت",
    tier: "فرصت جدید نمونه",
    owner: "کاربر دمو",
    stage: "نیازسنجی",
    nextAction: "ثبت RFQ و تعیین مالک تصمیم",
    openCases: 1,
    openTasks: 1,
    lastInteraction: "فرم RFQ — نمونه",
    source: "کانال دیجیتال / نمونه"
  }
]);

export const demoOpportunities = Object.freeze([
  { id: "OPP-DEMO-001", account: "شرکت نمونه آفتاب", title: "پایلوت سرویس سازمانی", stage: "نیازسنجی", owner: "کاربر دمو", nextAction: "تکمیل Case", age: "۴ روز نمونه" },
  { id: "OPP-DEMO-002", account: "گروه نمونه راهکار", title: "درخواست دسترسی Sandbox", stage: "بررسی Gate", owner: "کاربر دمو", nextAction: "جمع‌آوری مدرک", age: "۲ روز نمونه" },
  { id: "OPP-DEMO-003", account: "پلتفرم نمونه حرکت", title: "RFQ چندخدمت", stage: "Qualification", owner: "کاربر دمو", nextAction: "تعیین سرویس‌های eligible", age: "۱ روز نمونه" },
  { id: "OPP-DEMO-004", account: "شرکت نمونه آفتاب", title: "پیگیری پیشنهاد قبلی", stage: "Follow-up", owner: "کاربر دمو", nextAction: "جلسه بازبینی", age: "۶ روز نمونه" }
]);

export const demoFollowUps = Object.freeze([
  { id: "TASK-DEMO-001", account: "شرکت نمونه آفتاب", action: "تکمیل اطلاعات Case", due: "امروز — نمونه", owner: "کاربر دمو", status: "در حال انجام" },
  { id: "TASK-DEMO-002", account: "گروه نمونه راهکار", action: "دریافت مدرک eligibility", due: "فردا — نمونه", owner: "کاربر دمو", status: "باز" },
  { id: "TASK-DEMO-003", account: "پلتفرم نمونه حرکت", action: "بررسی RFQ", due: "۲ روز دیگر — نمونه", owner: "کاربر دمو", status: "باز" },
  { id: "TASK-DEMO-004", account: "شرکت نمونه آفتاب", action: "ثبت Outcome جلسه", due: "پس از جلسه — نمونه", owner: "کاربر دمو", status: "وابسته" }
]);

export const demoServiceCapabilities = Object.freeze([
  { id: "SVC-DEMO-001", name: "سرویس نمونه احراز/استعلام", status: "Sandbox", eligibility: "نیازمند Gate", owner: "TBD", automation: "Deterministic adapter" },
  { id: "SVC-DEMO-002", name: "سرویس نمونه اطلاعات سازمانی", status: "Candidate", eligibility: "مدرک ناقص", owner: "TBD", automation: "Manual → rule-based" },
  { id: "SVC-DEMO-003", name: "سرویس نمونه اعلان/پیگیری", status: "Low-risk candidate", eligibility: "قابل بررسی", owner: "TBD", automation: "Task / notification" }
]);

export const demoServiceRequests = Object.freeze([
  { id: "CASE-DEMO-101", account: "شرکت نمونه آفتاب", service: "سرویس نمونه احراز/استعلام", state: "نیازمند تأیید", gate: "Human review", outcome: "—" },
  { id: "CASE-DEMO-102", account: "گروه نمونه راهکار", service: "سرویس نمونه اطلاعات سازمانی", state: "مدرک ناقص", gate: "Blocked", outcome: "—" },
  { id: "CASE-DEMO-103", account: "پلتفرم نمونه حرکت", service: "سرویس نمونه اعلان/پیگیری", state: "Sandbox آماده", gate: "Low-risk", outcome: "در انتظار اجرا" },
  { id: "CASE-DEMO-104", account: "شرکت نمونه آفتاب", service: "سرویس نمونه اعلان/پیگیری", state: "بسته‌شده نمونه", gate: "Approved demo", outcome: "Outcome نمونه ثبت شد" }
]);

export const demoAutomationRuns = Object.freeze([
  { id: "RUN-DEMO-001", workflow: "ثبت ورودی → ساخت Task", risk: "کم", approval: "قانون قطعی", state: "Sandbox success", receipt: "REC-DEMO-001" },
  { id: "RUN-DEMO-002", workflow: "Case → بررسی eligibility", risk: "متوسط", approval: "Human gate", state: "در انتظار تأیید", receipt: "—" },
  { id: "RUN-DEMO-003", workflow: "Service request → adapter", risk: "متوسط", approval: "Human gate", state: "Blocked / evidence", receipt: "—" },
  { id: "RUN-DEMO-004", workflow: "Outcome → follow-up", risk: "کم", approval: "Rule-based", state: "Sandbox success", receipt: "REC-DEMO-004" }
]);

export const demoDataQuality = Object.freeze([
  { label: "رکورد بدون مالک", value: "۱ نمونه", note: "برای طراحی صف کیفیت داده" },
  { label: "نیازمند تکمیل منبع", value: "۲ نمونه", note: "provenance/freshness" },
  { label: "duplicate candidate", value: "۱ نمونه", note: "بدون merge خودکار" }
]);
