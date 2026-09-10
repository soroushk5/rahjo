export const dataClusters = Object.freeze([
  {
    id: "vehicle",
    title: "خودرو و مالکیت",
    shortTitle: "خودرو",
    icon: "vehicle",
    description: "داده‌های مرتبط با وسیله نقلیه، مالکیت، وضعیت فنی و سوابق قابل استفاده در فرایندهای سازمانی.",
    sensitivity: "حساس",
    access: "سازمانی کنترل‌شده",
    status: "در ممیزی",
    examples: ["مشخصات خودرو", "تطبیق مالکیت", "وضعیت‌های فنی"],
    useCases: ["بیمه و خسارت", "لیزینگ", "بازارگاه خودرو"],
    x: 50,
    y: 8
  },
  {
    id: "identity",
    title: "هویت و تطبیق",
    shortTitle: "هویت",
    icon: "identity",
    description: "داده‌های هویتی و تطبیقی که فقط برای هدف مشخص، مشتری واجد شرایط و با حداقل نمایش قابل استفاده‌اند.",
    sensitivity: "بسیار حساس",
    access: "محدود و هدف‌محور",
    status: "در ممیزی",
    examples: ["تطبیق هویت", "تطبیق شماره", "کنترل اعتبار ورودی"],
    useCases: ["احراز مشتری", "منابع انسانی", "خدمات مالی"],
    x: 87,
    y: 30
  },
  {
    id: "travel",
    title: "سفر و وضعیت‌های انتظامی",
    shortTitle: "سفر",
    icon: "travel",
    description: "اطلاعات مرتبط با سفر، گذرنامه و وضعیت‌های محدودشده که نیازمند کنترل حقوقی و مشتری مجاز هستند.",
    sensitivity: "بسیار حساس",
    access: "محدود",
    status: "در ممیزی",
    examples: ["اعتبار سند سفر", "وضعیت مجاز", "کنترل شرایط"],
    useCases: ["آژانس سفر", "خدمات سازمانی", "مدیریت پیمانکار"],
    x: 82,
    y: 76
  },
  {
    id: "financial",
    title: "مالی و بانکی",
    shortTitle: "مالی",
    icon: "bank",
    description: "داده‌های مالی و بانکی برای تطبیق، کنترل ورودی و فرایندهای دارای الزام قانونی یا قراردادی.",
    sensitivity: "بسیار حساس",
    access: "سازمانی محدود",
    status: "در ممیزی",
    examples: ["تطبیق حساب", "اعتبارسنجی شناسه", "کنترل پرداخت"],
    useCases: ["فین‌تک", "اعتباردهی", "پرداخت سازمانی"],
    x: 18,
    y: 76
  },
  {
    id: "communications",
    title: "ارتباطات و پیام",
    shortTitle: "ارتباطات",
    icon: "message",
    description: "پیام تراکنشی، OTP و گردش‌های ارتباطی که به فرایند داده و کنترل دسترسی متصل می‌شوند.",
    sensitivity: "متوسط",
    access: "سازمانی",
    status: "قابل طراحی",
    examples: ["OTP", "پیام تراکنشی", "وب‌هوک و اعلان"],
    useCases: ["اعلان فرایند", "تأیید مرحله", "پیگیری درخواست"],
    x: 13,
    y: 30
  },
  {
    id: "organization",
    title: "سازمان و کسب‌وکار",
    shortTitle: "سازمان",
    icon: "business",
    description: "داده‌های شخصیت حقوقی، اعتبار سازمانی و اطلاعات لازم برای پذیرش مشتری یا پیمانکار.",
    sensitivity: "کنترل‌شده",
    access: "B2B",
    status: "در ممیزی",
    examples: ["شناسه حقوقی", "وضعیت ثبتی", "اطلاعات کسب‌وکار"],
    useCases: ["پذیرش فروشنده", "اعتبارسنجی B2B", "مدیریت پیمانکار"],
    x: 50,
    y: 92
  }
]);

export const controlLayers = Object.freeze([
  {
    id: "source",
    number: "01",
    label: "منبع",
    title: "منشأ داده باید قبل از مصرف روشن باشد.",
    text: "نام مالک داده، قرارداد، دامنه فیلدها و زمان مشاهده در رجیستری منبع ثبت می‌شود.",
    icon: "database",
    artifact: "Source registry",
    meta: "مالک · قرارداد · دامنه · تازگی"
  },
  {
    id: "policy",
    number: "02",
    label: "دسترسی",
    title: "هر مشتری به هر داده‌ای دسترسی ندارد.",
    text: "نوع مشتری، هدف استفاده، رضایت، سطح حساسیت و حداقل فیلد لازم پیش از پاسخ بررسی می‌شود.",
    icon: "lock",
    artifact: "Policy decision",
    meta: "مشتری · هدف · رضایت · حداقل‌سازی"
  },
  {
    id: "delivery",
    number: "03",
    label: "تحویل",
    title: "داده از مسیر استاندارد و قابل‌کنترل تحویل می‌شود.",
    text: "Adapterها تفاوت منابع را پنهان می‌کنند و API Gateway نرخ، خطا و سطح نمایش را مدیریت می‌کند.",
    icon: "api",
    artifact: "Controlled response",
    meta: "Adapter · Schema · Rate limit · Masking"
  },
  {
    id: "audit",
    number: "04",
    label: "ممیزی",
    title: "مصرف داده باید قابل بازبینی بماند.",
    text: "درخواست، مجوز، پاسخ، خطا و مداخله انسانی بدون ثبت داده اضافه در رد ممیزی نگه‌داری می‌شود.",
    icon: "audit",
    artifact: "Audit record",
    meta: "درخواست · مجوز · پاسخ · رخداد"
  }
]);

export const platformLayers = Object.freeze([
  {
    id: "registry",
    icon: "database",
    label: "لایه ۱",
    title: "رجیستری منابع",
    text: "فهرست منبع، مالک، قرارداد، فیلدها، محدودیت‌ها و وضعیت اتصال.",
    checks: ["مدرک منبع", "حق پردازش", "تازگی و کیفیت"]
  },
  {
    id: "policy",
    icon: "legal",
    label: "لایه ۲",
    title: "سیاست و مجوز",
    text: "تطبیق مشتری، هدف، رضایت، سطح حساسیت و دامنه مجاز استفاده.",
    checks: ["مشتری واجد شرایط", "Purpose binding", "حداقل‌سازی"]
  },
  {
    id: "normalization",
    icon: "layers",
    label: "لایه ۳",
    title: "نرمال‌سازی داده",
    text: "تبدیل خروجی‌های ناهمگون به قراردادهای پایدار و قابل فهم برای توسعه‌دهنده.",
    checks: ["Schema ثابت", "نسخه‌بندی", "خطای استاندارد"]
  },
  {
    id: "gateway",
    icon: "api",
    label: "لایه ۴",
    title: "درگاه تحویل",
    text: "احراز کلاینت، سهمیه، نرخ، Masking و قطع امن در سطح API Gateway.",
    checks: ["API key / mTLS", "Rate limit", "Field masking"]
  },
  {
    id: "workflow",
    icon: "workflow",
    label: "لایه ۵",
    title: "گردش‌کار و پیام",
    text: "اتصال پاسخ داده به تصمیم انسانی، CRM، پیام تراکنشی و عملیات سازمانی.",
    checks: ["Human review", "Webhook", "Notification"]
  },
  {
    id: "audit",
    icon: "audit",
    label: "لایه ۶",
    title: "ممیزی و گزارش",
    text: "رد درخواست و رخداد بدون تبدیل لاگ به مخزن داده حساس.",
    checks: ["Audit trail", "Retention", "Incident ownership"]
  }
]);

export const useCases = Object.freeze([
  {
    id: "insurance",
    industry: "بیمه و خسارت",
    title: "کاهش رفت‌وبرگشت در ارزیابی پرونده خودرو",
    problem: "کارشناس برای تکمیل پرونده به چند منبع و کنترل دستی وابسته است.",
    data: ["مشخصات خودرو", "تطبیق مالکیت", "وضعیت بیمه یا فنی"],
    control: "دسترسی فقط برای پرونده مشخص و نقش سازمانی مجاز"
  },
  {
    id: "leasing",
    industry: "لیزینگ و تأمین مالی",
    title: "پذیرش متقاضی با داده کمتر و کنترل بیشتر",
    problem: "اطلاعات متقاضی، خودرو و حساب در چند مرحله جدا بررسی می‌شوند.",
    data: ["هویت و شماره", "اطلاعات خودرو", "تطبیق حساب"],
    control: "ثبت هدف، رضایت و حداقل فیلد لازم برای تصمیم"
  },
  {
    id: "logistics",
    industry: "ناوگان و لجستیک",
    title: "کنترل راننده، وسیله و رخداد در یک جریان",
    problem: "تأیید راننده و وسیله از عملیات روزمره جداست و رد مشترک ندارد.",
    data: ["گواهینامه", "خودرو", "پیام و اعلان"],
    control: "سطح دسترسی مبتنی بر نقش و دوره نگهداشت محدود"
  }
]);

export const ecosystemNodes = Object.freeze([
  { id: "src-identity", label: "هویت", group: "source", x: 10, y: 16, description: "منابع داده هویتی و تطبیقی؛ فعال‌سازی فقط با مدرک منبع و دامنه مجاز." },
  { id: "src-vehicle", label: "خودرو", group: "source", x: 30, y: 10, description: "منابع خودرو، مالکیت و وضعیت‌های فنی یا قراردادی." },
  { id: "src-travel", label: "سفر", group: "source", x: 52, y: 10, description: "داده‌های سفر و وضعیت‌های حساس با دسترسی محدود." },
  { id: "src-finance", label: "مالی", group: "source", x: 74, y: 10, description: "منابع مالی و بانکی برای کاربردهای واجد شرایط." },
  { id: "src-org", label: "سازمانی", group: "source", x: 92, y: 16, description: "اطلاعات شخصیت حقوقی و اعتبار کسب‌وکار." },

  { id: "registry", label: "رجیستری منبع", group: "control", x: 18, y: 39, description: "مدرک منبع، قرارداد، فیلدها و وضعیت اتصال را نگه می‌دارد." },
  { id: "policy", label: "موتور دسترسی", group: "control", x: 42, y: 39, description: "مشتری، هدف، رضایت و حداقل‌سازی را ارزیابی می‌کند." },
  { id: "gateway", label: "API Gateway", group: "control", x: 66, y: 39, description: "احراز کلاینت، سهمیه، Masking و پاسخ استاندارد." },
  { id: "audit", label: "ممیزی", group: "control", x: 86, y: 39, description: "رد دسترسی، خطا و رخداد را بدون نگهداشت اضافه ثبت می‌کند." },

  { id: "api", label: "API سازمانی", group: "delivery", x: 18, y: 66, description: "تحویل کنترل‌شده به نرم‌افزارها و فرایندهای سازمانی." },
  { id: "workflow", label: "گردش‌کار", group: "delivery", x: 42, y: 66, description: "اتصال پاسخ داده به تصمیم انسانی و فرایند داخلی." },
  { id: "message", label: "پیام تراکنشی", group: "delivery", x: 66, y: 66, description: "OTP، اعلان و پیگیری متصل به وضعیت فرایند." },
  { id: "console", label: "کنسول کنترل", group: "delivery", x: 86, y: 66, description: "مدیریت دسترسی، مصرف، رخداد و آمادگی سرویس‌ها." },

  { id: "insurance", label: "بیمه", group: "industry", x: 14, y: 91, description: "ارزیابی پرونده، خسارت و کنترل اطلاعات خودرو." },
  { id: "leasing", label: "لیزینگ", group: "industry", x: 38, y: 91, description: "پذیرش متقاضی، خودرو و کنترل‌های مالی." },
  { id: "logistics", label: "لجستیک", group: "industry", x: 62, y: 91, description: "کنترل راننده، وسیله و عملیات ناوگان." },
  { id: "saas", label: "SaaS سازمانی", group: "industry", x: 86, y: 91, description: "مصرف API و Workflow در نرم‌افزارهای سازمانی." }
]);

export const ecosystemEdges = Object.freeze([
  ["src-identity", "registry"], ["src-vehicle", "registry"], ["src-travel", "policy"],
  ["src-finance", "gateway"], ["src-org", "audit"], ["registry", "policy"],
  ["policy", "gateway"], ["gateway", "audit"], ["registry", "api"],
  ["policy", "workflow"], ["gateway", "message"], ["audit", "console"],
  ["api", "insurance"], ["api", "leasing"], ["workflow", "logistics"],
  ["workflow", "saas"], ["message", "insurance"], ["console", "saas"]
]);
