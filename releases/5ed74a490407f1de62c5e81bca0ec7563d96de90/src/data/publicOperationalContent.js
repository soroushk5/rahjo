export const publicModules = Object.freeze([
  {
    id: "dashboard",
    icon: "dashboard",
    eyebrow: "دید مشترک",
    title: "داشبورد عملیات",
    text: "پرونده‌ها، فرصت‌ها، پیگیری‌ها، وضعیت سرویس‌ها، approvalها و هشدارهای کیفیت داده را در یک نمای مشترک جمع می‌کند.",
    path: "/dashboard",
    state: "Demo / Synthetic"
  },
  {
    id: "crm",
    icon: "users",
    eyebrow: "حافظه تجاری",
    title: "CRM و Account 360",
    text: "Account، Contact، Lead، Opportunity، Case، تعامل، Task، Proposal و Outcome را روی یک حافظه تجاری مشترک نگه می‌دارد.",
    path: "/crm",
    state: "Demo / Synthetic"
  },
  {
    id: "sales",
    icon: "reports",
    eyebrow: "فروش",
    title: "فروش و پیگیری",
    text: "ورودی‌ها، فرصت‌ها، اقدام بعدی، aging و handoff را از کانال ورودی تا Case و Outcome قابل‌پیگیری می‌کند.",
    path: "/sales",
    state: "Demo / Synthetic"
  },
  {
    id: "services",
    icon: "api",
    eyebrow: "اجرا",
    title: "سرویس‌ها و APIها",
    text: "کاتالوگ قابلیت، eligibility، وضعیت بررسی، درخواست و مرز عرضه را بدون ادعای فعال‌بودن سرویس‌های تأییدنشده نمایش می‌دهد.",
    path: "/services",
    state: "Evidence-gated"
  },
  {
    id: "automation",
    icon: "workflow",
    eyebrow: "اتوماسیون",
    title: "گردش‌کار deterministic",
    text: "Rule، Gate، Approval، Run، Retry و Receipt را برای جریان‌های قابل اتوماسیون نگه می‌دارد؛ اقدام‌های پرریسک انسانی می‌مانند.",
    path: "/automation",
    state: "Demo / Human-gated"
  },
  {
    id: "governance",
    icon: "audit",
    eyebrow: "کنترل",
    title: "ممیزی و کیفیت داده",
    text: "Actor، Source، Time، State، missing/duplicate/stale records و رخدادهای حساس را برای بازسازی مسیر Case ثبت می‌کند.",
    path: "/governance",
    state: "Demo / Synthetic"
  },
  {
    id: "think-room",
    icon: "spark",
    eyebrow: "آینده",
    title: "Think Room",
    text: "لایه هوشمندی آینده است که روی همان Account، Case، Decision، Approval، Action و Outcome سوار می‌شود؛ dependency فاز اول نیست.",
    path: "/think-room",
    state: "Future / Not active"
  }
]);

export const publicCapabilityFamilies = Object.freeze([
  {
    id: "commercial-memory",
    icon: "users",
    title: "ورودی، CRM و حافظه تجاری",
    text: "Website/Channel intake، Lead، Account، Contact، Opportunity، Case و Follow-up روی یک مسیر مشترک.",
    status: "Demo / Synthetic",
    tone: "demo",
    includes: ["Website intake model", "Account 360", "Lead & Opportunity", "Case & Follow-up"]
  },
  {
    id: "verification-data",
    icon: "database",
    title: "داده و سرویس‌های بررسی/تطبیق",
    text: "خانواده‌ای از قابلیت‌های داده و verification که فقط پس از اثبات منبع، حق استفاده، امنیت و شرایط عرضه می‌توانند production شوند.",
    status: "Evidence Required",
    tone: "evidence",
    includes: ["Identity / Organization", "Vehicle / Ownership", "Financial matching", "Controlled data access"]
  },
  {
    id: "service-orchestration",
    icon: "api",
    title: "سرویس و API orchestration",
    text: "Eligibility، access request، approval، execution adapter، status و audit برای قابلیت‌های واجد شرایط.",
    status: "Under Review",
    tone: "review",
    includes: ["Service catalog", "Eligibility", "Access lifecycle", "Status & audit"]
  },
  {
    id: "workflow-messaging",
    icon: "workflow",
    title: "گردش‌کار و پیام",
    text: "Notification، Task handoff، webhook و workflowهای deterministic برای پیگیری عملیات و Case.",
    status: "Pilot Candidate",
    tone: "pilot",
    includes: ["Transactional messaging", "Webhook", "Rule workflow", "Human approval"]
  },
  {
    id: "intelligence",
    icon: "spark",
    title: "هوشمندی تصمیم",
    text: "Context، Evidence، Recommendation و Decision Assistant در فاز بعدی؛ بدون ساخت silo جدید و فقط روی حافظه و eventهای مشترک.",
    status: "Future / Not Active",
    tone: "future",
    includes: ["Think Room", "Evidence context", "Decision brief", "Outcome learning"]
  }
]);

export const publicJourneySteps = Object.freeze([
  { index: "01", icon: "external", title: "ورودی", label: "Website / Channel / Operator", text: "بازدیدکننده یا مشتری موجود از یک کانال وارد می‌شود و source/attribution همراه context حفظ می‌شود." },
  { index: "02", icon: "users", title: "هویت تجاری", label: "Lead / Account / Contact", text: "ورودی به حافظه تجاری تبدیل می‌شود؛ هدف این است که اطلاعات فقط داخل یک فرم باقی نماند." },
  { index: "03", icon: "requests", title: "پرونده", label: "Opportunity / Case", text: "نیاز، درخواست یا فرصت به Case/Opportunity قابل‌مالکیت و قابل‌پیگیری تبدیل می‌شود." },
  { index: "04", icon: "api", title: "تطبیق سرویس", label: "Service Qualification", text: "سرویس یا قابلیت مناسب با وضعیت شفاف Demo، Review، Pilot، Evidence Required یا TBD ارزیابی می‌شود." },
  { index: "05", icon: "shield", title: "Gate", label: "Human / Rule Approval", text: "قیمت استثنایی، تعهد قراردادی، دسترسی حساس و اقدام پرریسک بدون تأیید انسانی جلو نمی‌رود." },
  { index: "06", icon: "workflow", title: "اقدام", label: "Task / Proposal / Action", text: "کار به Task، Proposal، handoff یا workflow deterministic تبدیل و receipt آن ثبت می‌شود." },
  { index: "07", icon: "check", title: "نتیجه", label: "Outcome", text: "برد/باخت/نتیجه یا وضعیت پرونده به‌عنوان بخشی از حافظه تجاری ثبت می‌شود." },
  { index: "08", icon: "dashboard", title: "دید مشترک", label: "Dashboard + Commercial Memory", text: "همان داده و رخدادها در داشبورد دیده می‌شوند و بعداً خوراک Think Room خواهند بود." }
]);

export const publicTrustPrinciples = Object.freeze([
  { icon: "shield", title: "Human-gated by default", text: "Actionهای پرریسک، تعهد SLA/Contract، دسترسی حساس و تصمیم نهایی تجاری به تأیید انسانی نیاز دارند." },
  { icon: "eye", title: "Claim discipline", text: "Catalogue، demo یا mock به معنی production eligibility نیست؛ وضعیت هر capability باید صریح و قابل فهم باشد." },
  { icon: "audit", title: "Audit by design", text: "Actor، source، timestamp، permission scope، state و result برای mutationهای مهم قابل ردیابی می‌ماند." },
  { icon: "lock", title: "Permission & minimum access", text: "دسترسی بر اساس نقش، context و حداقل داده لازم طراحی می‌شود؛ نه دسترسی عمومی و بدون زمینه." },
  { icon: "layers", title: "No-AI baseline", text: "CRM، workflow، dashboard، service operations و audit باید با AI خاموش هم ارزش واقعی ایجاد کنند." },
  { icon: "node", title: "Shared identity & provenance", text: "Website، App، CRM و Service layer از شناسه‌ها و حافظه مشترک استفاده می‌کنند تا silo جدید ساخته نشود." }
]);

export const publicStatusLegend = Object.freeze([
  { label: "Demo / Synthetic", text: "قابل مشاهده در محیط نمونه؛ نه داده یا مشتری واقعی." },
  { label: "Under Review", text: "قابلیت یا شرایط عرضه هنوز در حال بررسی است." },
  { label: "Pilot Candidate", text: "برای پایلوت محدود قابل بررسی است؛ نیازمند scope و approval." },
  { label: "Evidence Required", text: "بدون مدرک منبع/حق استفاده/امنیت یا eligibility عرضه نمی‌شود." },
  { label: "Unavailable / TBD", text: "در حال حاضر تعهدی برای عرضه یا زمان‌بندی آن وجود ندارد." }
]);
