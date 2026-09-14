export const serviceCatalog = Object.freeze([
  {
    id: "sales-process",
    title: "راه‌اندازی و کنترل فرایند فروش",
    category: "فروش و مشتری",
    summary: "طراحی مسیر سرنخ تا قرارداد و استقرار پیگیری‌های منظم برای تیم فروش.",
    description: "برای کسب‌وکاری که اطلاعات مشتری و پیگیری فروش آن میان افراد و ابزارهای مختلف پخش شده است.",
    pricingMode: "fixed",
    price: 250000000,
    priceLabel: "از ۲۵۰ میلیون ریال",
    duration: "۱۴ روز کاری",
    documents: ["معرفی‌نامه مجموعه", "نمونه فایل مشتریان", "شرح فرایند فعلی"],
    owner: "واحد استقرار",
    sla: "۱۴ روز کاری",
    output: "فرایند پیکربندی‌شده، داشبورد و راهنمای تیم",
    stages: ["شناخت", "طراحی", "پیکربندی", "آموزش", "تحویل"],
    online: true,
    active: true
  },
  {
    id: "service-operations",
    title: "سامان‌دهی درخواست و عملیات خدمت",
    category: "عملیات",
    summary: "تعریف خدمت، مدارک، مسئول، SLA و مسیر اجرا از ثبت درخواست تا تحویل.",
    description: "برای تیم‌هایی که درخواست مشتری را دریافت می‌کنند اما وضعیت، مسئول و نتیجه در یک سیستم روشن نیست.",
    pricingMode: "quote",
    price: 0,
    priceLabel: "نیازمند بررسی",
    duration: "۱۰ تا ۲۰ روز کاری",
    documents: ["فهرست خدمات", "نمونه درخواست", "ساختار تیم"],
    owner: "تیم عملیات",
    sla: "پس از نیازسنجی",
    output: "کاتالوگ خدمت و گردش‌کار عملیاتی",
    stages: ["نیازسنجی", "مدل‌سازی", "پیکربندی", "پایلوت", "تحویل"],
    online: true,
    active: true
  },
  {
    id: "customer-memory",
    title: "ایجاد حافظهٔ یکپارچه مشتری",
    category: "CRM",
    summary: "تجمیع مشخصات، تعاملات، درخواست‌ها، فایل‌ها و سوابق مالی هر مشتری.",
    description: "Account 360 برای مجموعه‌ای که سابقهٔ مشتری میان تلفن، فایل و حافظهٔ افراد پراکنده است.",
    pricingMode: "fixed",
    price: 180000000,
    priceLabel: "از ۱۸۰ میلیون ریال",
    duration: "۱۰ روز کاری",
    documents: ["نمونه اطلاعات مشتری", "فهرست کاربران", "سطوح دسترسی"],
    owner: "تیم CRM",
    sla: "۱۰ روز کاری",
    output: "پروفایل ۳۶۰ درجه و Timeline مشتری",
    stages: ["پاک‌سازی", "ورود داده", "پیکربندی", "بازبینی"],
    online: true,
    active: true
  },
  {
    id: "renewal-followup",
    title: "پیگیری تمدید و فروش مجدد",
    category: "پیگیری",
    summary: "ساخت تقویم پیگیری، یادآوری و فرصت‌های تمدید بر اساس سابقهٔ خدمت.",
    description: "برای کسب‌وکاری که تمدیدها و پیگیری‌های بعد از تحویل را از دست می‌دهد.",
    pricingMode: "fixed",
    price: 95000000,
    priceLabel: "۹۵ میلیون ریال",
    duration: "۷ روز کاری",
    documents: ["فهرست خدمات دوره‌ای", "قاعده‌های تمدید"],
    owner: "موفقیت مشتری",
    sla: "۷ روز کاری",
    output: "تقویم و قواعد پیگیری",
    stages: ["تعریف قاعده", "آزمون", "فعال‌سازی"],
    online: true,
    active: true
  },
  {
    id: "connector-assessment",
    title: "بررسی اتصال سامانه‌های موجود",
    category: "اتصال",
    summary: "بررسی فنی اتصال حسابداری، پیامک، ایمیل یا سامانه‌های موجود به رهجو.",
    description: "اتصال یک مرحلهٔ بعدی است؛ ابتدا نیاز، مالکیت و جریان دادهٔ لازم مشخص می‌شود.",
    pricingMode: "quote",
    price: 0,
    priceLabel: "نیازمند استعلام",
    duration: "پس از بررسی",
    documents: ["شرح سامانه", "مستند فنی در صورت وجود"],
    owner: "تیم یکپارچه‌سازی",
    sla: "پس از بررسی",
    output: "گزارش امکان‌سنجی و نقشه اتصال",
    stages: ["بررسی", "طراحی", "برآورد"],
    online: false,
    active: true
  }
]);

export const seedCustomers = Object.freeze([
  {
    id: "arya-sanat",
    name: "شرکت آریا صنعت",
    type: "سازمان",
    industry: "تجهیزات صنعتی",
    phone: "۰۲۱-۴۴۵۵۶۷۸۹",
    email: "info@aryasanat.example",
    address: "تهران، شهرک صنعتی بهارستان",
    owner: "نسترن احمدی",
    status: "مشتری فعال",
    since: "۱۳۹۹",
    credit: 850000000,
    balance: 2850000000,
    contacts: [
      { name: "مهدی رضایی", role: "مدیرعامل", phone: "۰۹۱۲-۳۴۵-۶۷۸۹" },
      { name: "سارا محمدی", role: "مدیر خرید", phone: "۰۹۱۲-۱۱۱-۲۲۳۳" },
      { name: "علی کریمی", role: "مدیر فنی", phone: "۰۹۱۲-۴۴۴-۵۵۶۶" }
    ]
  },
  {
    id: "novin-pardaz",
    name: "نوین‌پرداز",
    type: "حساب تجاری",
    industry: "خدمات نرم‌افزاری",
    phone: "۰۲۱-۸۸۷۷۱۲۴۰",
    email: "hello@novinpardaz.example",
    address: "تهران، میدان ونک",
    owner: "سارا کریمی",
    status: "مشتری فعال",
    since: "۱۴۰۲",
    credit: 320000000,
    balance: 740000000,
    contacts: [{ name: "پویان امیری", role: "مدیر عملیات", phone: "۰۹۱۰-۸۸۸-۱۲۱۲" }]
  },
  {
    id: "parsa-teb",
    name: "پارس‌طب",
    type: "سازمان",
    industry: "تجهیزات پزشکی",
    phone: "۰۲۱-۶۶۷۷۰۹۸۰",
    email: "office@parsateb.example",
    address: "تهران، خیابان کارگر",
    owner: "نسترن احمدی",
    status: "بالقوه",
    since: "۱۴۰۵",
    credit: 0,
    balance: 0,
    contacts: [{ name: "دکتر مریم کیانی", role: "مدیر مجموعه", phone: "۰۹۱۲-۲۵۰-۴۱۰۰" }]
  },
  {
    id: "foolad-afagh",
    name: "فولاد آفاق",
    type: "سازمان",
    industry: "تولید",
    phone: "۰۲۱-۵۵۳۳۲۱۱۰",
    email: "sales@fooladafagh.example",
    address: "قم، شهرک صنعتی شکوهیه",
    owner: "امیر زمانی",
    status: "مشتری فعال",
    since: "۱۴۰۱",
    credit: 110000000,
    balance: 460000000,
    contacts: [{ name: "سامان نوروزی", role: "مدیر بازرگانی", phone: "۰۹۱۲-۷۶۰-۰۲۲۱" }]
  }
]);

export const seedOpportunities = Object.freeze([
  { id: "OP-1405-81", accountId: "arya-sanat", title: "توسعهٔ همکاری خدمات", serviceId: "service-operations", value: 4800000000, probability: 70, owner: "نسترن احمدی", source: "جلسه حضوری", stage: "مذاکره", lastInteraction: "امروز، ۱۰:۴۵", nextAction: "ارسال نسخه نهایی پیشنهاد", nextDate: "۱۴۰۵/۰۶/۲۱" },
  { id: "OP-1405-82", accountId: "novin-pardaz", title: "حافظهٔ مشتری و تمدید", serviceId: "customer-memory", value: 1250000000, probability: 55, owner: "سارا کریمی", source: "معرفی", stage: "پیشنهاد", lastInteraction: "دیروز، ۱۵:۱۰", nextAction: "تماس برای بازخورد پیشنهاد", nextDate: "۱۴۰۵/۰۶/۲۰" },
  { id: "OP-1405-83", accountId: "parsa-teb", title: "سامان‌دهی خدمات پس از فروش", serviceId: "service-operations", value: 2100000000, probability: 35, owner: "نسترن احمدی", source: "وب‌سایت", stage: "نیازسنجی", lastInteraction: "امروز، ۰۹:۳۰", nextAction: "جلسه کشف فرایند", nextDate: "۱۴۰۵/۰۶/۲۲" },
  { id: "OP-1405-84", accountId: "foolad-afagh", title: "پیگیری تمدید قراردادها", serviceId: "renewal-followup", value: 780000000, probability: 80, owner: "امیر زمانی", source: "مشتری فعلی", stage: "واجد شرایط", lastInteraction: "۳ روز پیش", nextAction: "تکمیل دادهٔ تمدید", nextDate: "۱۴۰۵/۰۶/۲۰" }
]);

export const seedRequests = Object.freeze([
  {
    id: "rah-1405-0284",
    referenceId: "رهـ-۱۴۰۵-۰۲۸۴",
    accountId: "arya-sanat",
    contact: "مهدی رضایی",
    serviceId: "sales-process",
    title: "راه‌اندازی و کنترل فرایند فروش",
    channel: "پرتال مشتریان",
    need: "یکپارچه‌سازی ثبت سرنخ، پیشنهاد و پیگیری تیم فروش",
    status: "در حال اجرا",
    paymentStatus: "پرداخت ناقص",
    operationsStatus: "در حال اجرا",
    owner: "سارا احمدی",
    stage: "اجرا",
    sla: "۱۴ روز کاری",
    targetDate: "۱۴۰۵/۰۶/۲۵",
    price: 250000000,
    discount: 0,
    paid: 150000000,
    creditUsed: 0,
    createdAt: "۱۴۰۵/۰۶/۰۱ — ۱۴:۱۰",
    closedAt: null,
    documents: [
      { name: "معرفی‌نامه رسمی شرکت", status: "دریافت‌شده", date: "۱۴۰۵/۰۶/۰۱" },
      { name: "شرح فرایند فعلی", status: "دریافت‌شده", date: "۱۴۰۵/۰۶/۰۲" },
      { name: "نمونه فایل مشتریان", status: "نیازمند اصلاح", date: "—" }
    ],
    outcome: "",
    nextAction: "تأیید طراحی فرایند و تکمیل پرداخت"
  },
  {
    id: "rah-1405-0281",
    referenceId: "رهـ-۱۴۰۵-۰۲۸۱",
    accountId: "novin-pardaz",
    contact: "پویان امیری",
    serviceId: "customer-memory",
    title: "ایجاد حافظهٔ یکپارچه مشتری",
    channel: "اپراتور",
    need: "ساخت نمای واحد تعامل و درخواست مشتری",
    status: "منتظر پرداخت",
    paymentStatus: "در انتظار",
    operationsStatus: "در صف",
    owner: "علی محمدی",
    stage: "پرداخت",
    sla: "۱۰ روز کاری",
    targetDate: "۱۴۰۵/۰۶/۲۹",
    price: 180000000,
    discount: 10000000,
    paid: 0,
    creditUsed: 0,
    createdAt: "۱۴۰۵/۰۶/۰۸ — ۱۱:۲۰",
    closedAt: null,
    documents: [{ name: "نمونه اطلاعات مشتری", status: "دریافت‌شده", date: "۱۴۰۵/۰۶/۰۹" }],
    outcome: "",
    nextAction: "ثبت پرداخت یا مصرف اعتبار"
  },
  {
    id: "rah-1405-0276",
    referenceId: "رهـ-۱۴۰۵-۰۲۷۶",
    accountId: "parsa-teb",
    contact: "دکتر مریم کیانی",
    serviceId: "service-operations",
    title: "سامان‌دهی خدمات پس از فروش",
    channel: "وب‌سایت",
    need: "مدیریت درخواست تعمیر و پیگیری مشتری",
    status: "منتظر اطلاعات",
    paymentStatus: "تعیین‌نشده",
    operationsStatus: "متوقف",
    owner: "نسترن احمدی",
    stage: "مدارک",
    sla: "پس از نیازسنجی",
    targetDate: "۱۴۰۵/۰۶/۲۲",
    price: 0,
    discount: 0,
    paid: 0,
    creditUsed: 0,
    createdAt: "۱۴۰۵/۰۶/۱۲ — ۰۸:۴۵",
    closedAt: null,
    documents: [{ name: "فهرست خدمات فعلی", status: "دریافت‌نشده", date: "—" }],
    outcome: "",
    nextAction: "دریافت فهرست خدمات از مشتری"
  },
  {
    id: "rah-1405-0269",
    referenceId: "رهـ-۱۴۰۵-۰۲۶۹",
    accountId: "foolad-afagh",
    contact: "سامان نوروزی",
    serviceId: "renewal-followup",
    title: "پیگیری تمدید قراردادها",
    channel: "فروش",
    need: "جلوگیری از فراموش‌شدن تمدید خدمات دوره‌ای",
    status: "تحویل‌شده",
    paymentStatus: "پرداخت‌شده",
    operationsStatus: "تکمیل",
    owner: "امیر زمانی",
    stage: "تحویل",
    sla: "۷ روز کاری",
    targetDate: "۱۴۰۵/۰۶/۱۰",
    price: 95000000,
    discount: 0,
    paid: 95000000,
    creditUsed: 0,
    createdAt: "۱۴۰۵/۰۵/۲۸ — ۱۰:۱۰",
    closedAt: "۱۴۰۵/۰۶/۱۰",
    documents: [{ name: "فهرست خدمات دوره‌ای", status: "دریافت‌شده", date: "۱۴۰۵/۰۵/۲۹" }],
    outcome: "تقویم تمدید و سه قاعدهٔ پیگیری تحویل شد.",
    nextAction: "پیگیری رضایت در ۳۰ روز آینده"
  }
]);

export const seedTasks = Object.freeze([
  { id: "TK-411", title: "تکمیل و ارسال پیشنهاد قیمت", accountId: "arya-sanat", requestId: "rah-1405-0284", opportunityId: "OP-1405-81", owner: "نسترن احمدی", due: "امروز، ۱۰:۰۰", priority: "فوری", status: "امروز", result: "" },
  { id: "TK-412", title: "بازبینی نمونه فایل مشتریان", accountId: "arya-sanat", requestId: "rah-1405-0284", opportunityId: "", owner: "علی محمدی", due: "امروز، ۱۲:۰۰", priority: "بالا", status: "در حال انجام", result: "" },
  { id: "TK-413", title: "پاسخ به درخواست تازهٔ پارس‌طب", accountId: "parsa-teb", requestId: "rah-1405-0276", opportunityId: "OP-1405-83", owner: "نسترن احمدی", due: "امروز، ۱۴:۰۰", priority: "بالا", status: "امروز", result: "" },
  { id: "TK-414", title: "پیگیری پرداخت نوین‌پرداز", accountId: "novin-pardaz", requestId: "rah-1405-0281", opportunityId: "OP-1405-82", owner: "سارا کریمی", due: "دیروز، ۱۶:۰۰", priority: "فوری", status: "عقب‌افتاده", result: "" },
  { id: "TK-415", title: "تماس رضایت پس از تحویل", accountId: "foolad-afagh", requestId: "rah-1405-0269", opportunityId: "", owner: "امیر زمانی", due: "فردا، ۰۹:۳۰", priority: "عادی", status: "این هفته", result: "" },
  { id: "TK-416", title: "تأیید طراحی مرحلهٔ اجرا", accountId: "arya-sanat", requestId: "rah-1405-0284", opportunityId: "", owner: "سارا احمدی", due: "امروز، ۱۵:۳۰", priority: "بالا", status: "منتظر دیگران", result: "" }
]);

export const seedTransactions = Object.freeze([
  { id: "TR-901", accountId: "arya-sanat", requestId: "rah-1405-0284", type: "پرداخت دستی", amount: 150000000, status: "ثبت‌شده", date: "۱۴۰۵/۰۶/۰۵" },
  { id: "TR-900", accountId: "foolad-afagh", requestId: "rah-1405-0269", type: "انتقال بانکی", amount: 95000000, status: "ثبت‌شده", date: "۱۴۰۵/۰۶/۰۳" },
  { id: "TR-899", accountId: "novin-pardaz", requestId: "rah-1405-0281", type: "در انتظار", amount: 170000000, status: "در انتظار", date: "۱۴۰۵/۰۶/۱۲" }
]);

export const seedDocuments = Object.freeze([
  { id: "DOC-201", name: "معرفی‌نامه آریا صنعت.pdf", type: "معرفی‌نامه", version: "۱", uploader: "مهدی رضایی", date: "۱۴۰۵/۰۶/۰۱", accountId: "arya-sanat", requestId: "rah-1405-0284", status: "معتبر" },
  { id: "DOC-202", name: "فرایند فروش فعلی.docx", type: "شرح فرایند", version: "۲", uploader: "سارا محمدی", date: "۱۴۰۵/۰۶/۰۲", accountId: "arya-sanat", requestId: "rah-1405-0284", status: "معتبر" },
  { id: "DOC-203", name: "نمونه مشتریان.xlsx", type: "داده نمونه", version: "۱", uploader: "علی کریمی", date: "۱۴۰۵/۰۶/۰۳", accountId: "arya-sanat", requestId: "rah-1405-0284", status: "نیازمند اصلاح" },
  { id: "DOC-204", name: "اطلاعات مشتریان نوین‌پرداز.xlsx", type: "داده نمونه", version: "۱", uploader: "پویان امیری", date: "۱۴۰۵/۰۶/۰۹", accountId: "novin-pardaz", requestId: "rah-1405-0281", status: "معتبر" },
  { id: "DOC-205", name: "تقویم تمدید فولاد آفاق.pdf", type: "نتیجه", version: "۳", uploader: "امیر زمانی", date: "۱۴۰۵/۰۶/۱۰", accountId: "foolad-afagh", requestId: "rah-1405-0269", status: "تحویل‌شده" }
]);

export const seedActivities = Object.freeze([
  { id: "EV-711", accountId: "arya-sanat", requestId: "rah-1405-0284", type: "پرداخت", title: "پرداخت مرحلهٔ اول ثبت شد", detail: "۱۵۰ میلیون ریال به درخواست متصل شد.", actor: "نسترن احمدی", time: "امروز، ۱۴:۲۰", tone: "success" },
  { id: "EV-710", accountId: "arya-sanat", requestId: "rah-1405-0284", type: "تأیید", title: "پیشنهاد توسط مشتری تأیید شد", detail: "تأیید در پرتال نمایشی ثبت شد.", actor: "مهدی رضایی", time: "امروز، ۱۳:۴۸", tone: "success" },
  { id: "EV-709", accountId: "arya-sanat", requestId: "rah-1405-0284", type: "مدرک", title: "نمونه فایل مشتریان نیازمند اصلاح است", detail: "ستون شماره تماس در بخشی از رکوردها خالی است.", actor: "علی محمدی", time: "امروز، ۱۱:۱۵", tone: "warning" },
  { id: "EV-708", accountId: "novin-pardaz", requestId: "rah-1405-0281", type: "پیام", title: "یادآوری پرداخت آماده شد", detail: "پیام در تاریخچهٔ ارتباط ثبت شد؛ ارسال خارجی انجام نشد.", actor: "سارا کریمی", time: "دیروز، ۱۶:۳۰", tone: "neutral" },
  { id: "EV-707", accountId: "parsa-teb", requestId: "rah-1405-0276", type: "درخواست", title: "درخواست تازه از وب‌سایت ثبت شد", detail: "کار پیگیری به نسترن احمدی تخصیص یافت.", actor: "سیستم", time: "دیروز، ۰۸:۴۵", tone: "neutral" },
  { id: "EV-706", accountId: "foolad-afagh", requestId: "rah-1405-0269", type: "تحویل", title: "نتیجهٔ خدمت تحویل شد", detail: "فایل نهایی به سابقهٔ مشتری اضافه شد.", actor: "امیر زمانی", time: "۱۴۰۵/۰۶/۱۰", tone: "success" }
]);

export const seedApprovals = Object.freeze([
  { id: "AP-31", requestId: "rah-1405-0284", subject: "تأیید طراحی فرایند فروش", requester: "سارا احمدی", approver: "مدیر عملیات", reason: "عبور از مرحلهٔ طراحی به اجرا", time: "امروز، ۱۲:۱۰", decision: "منتظر تصمیم" },
  { id: "AP-30", requestId: "rah-1405-0269", subject: "تأیید نتیجهٔ تحویل", requester: "امیر زمانی", approver: "مدیر کسب‌وکار", reason: "بستن درخواست", time: "۱۴۰۵/۰۶/۱۰", decision: "تأیید‌شده" }
]);

export const dataQualityIssues = Object.freeze([
  { id: "DQ-18", type: "درخواست بدون اقدام بعدی", record: "رهـ-۱۴۰۵-۰۲۷۸", owner: "واحد عملیات", severity: "بالا", status: "باز" },
  { id: "DQ-17", type: "مشتری بدون شماره تماس", record: "پیشگام تجارت", owner: "فروش", severity: "متوسط", status: "در حال رفع" },
  { id: "DQ-16", type: "فایل بدون ارتباط مشخص", record: "contract-final.pdf", owner: "بایگانی", severity: "متوسط", status: "باز" },
  { id: "DQ-15", type: "خدمت بدون قیمت یا مالک", record: "مشاوره توسعه بازار", owner: "مدیر سیستم", severity: "بالا", status: "باز" }
]);

export const automationRules = Object.freeze([
  { id: "AU-01", title: "تخصیص درخواست تازه", trigger: "ایجاد درخواست", condition: "خدمت فعال است", action: "ساخت کار برای مسئول خدمت", owner: "مدیر عملیات", status: "فعال", lastRun: "امروز، ۰۸:۴۵", result: "موفق" },
  { id: "AU-02", title: "پیگیری مدرک ناقص", trigger: "مدرک ناقص", condition: "درخواست بسته نیست", action: "تغییر وضعیت و آماده‌سازی پیام", owner: "عملیات", status: "فعال", lastRun: "امروز، ۱۱:۱۵", result: "موفق" },
  { id: "AU-03", title: "ورود به صف اجرا", trigger: "پرداخت کامل", condition: "تأیید مشتری ثبت شده", action: "تغییر وضعیت به آماده اجرا", owner: "مالی", status: "فعال", lastRun: "دیروز، ۱۴:۱۰", result: "موفق" },
  { id: "AU-04", title: "پیگیری بعد از تحویل", trigger: "ثبت نتیجه", condition: "خدمت دوره‌ای است", action: "ساخت کار پیگیری ۳۰ روزه", owner: "موفقیت مشتری", status: "پیش‌نویس", lastRun: "—", result: "اجرا نشده" }
]);

export const useCaseCatalog = Object.freeze([
  { title: "هنوز CRM ندارید", problem: "اطلاعات مشتری میان فایل، تلفن و حافظهٔ افراد پخش است.", outcome: "یک پروندهٔ واحد برای مشتری و همهٔ پیگیری‌ها." },
  { title: "CRM دارید، اما عملیات دستی است", problem: "فروش ثبت می‌شود ولی اجرای خدمت و تحویل خارج از سیستم می‌ماند.", outcome: "اتصال فرصت فروش به درخواست، کار، پرداخت و نتیجه." },
  { title: "درخواست‌ها از چند کانال می‌آیند", problem: "وب‌سایت، تماس و پیام‌رسان هرکدام مسیر جدا دارند.", outcome: "یک صف درخواست با مسئول و وضعیت روشن." },
  { title: "از مشتری فایل و مدرک می‌گیرید", problem: "نسخهٔ درست فایل و مدرک ناقص به‌سختی پیدا می‌شود.", outcome: "چک‌لیست مدرک، نسخه و ارتباط روشن با درخواست." },
  { title: "خدمات متفاوت عرضه می‌کنید", problem: "قیمت، زمان، مسئول و الزامات هر خدمت فرق دارد.", outcome: "کاتالوگ قابل‌پیکربندی بدون تغییر کد." },
  { title: "تمدید و پیگیری مهم است", problem: "فروش مجدد و تمدید در تقویم افراد گم می‌شود.", outcome: "Task و یادآوری متصل به سابقهٔ مشتری." }
]);

export const implementationSteps = Object.freeze([
  { number: "۱", title: "شناخت", description: "فرایند موجود، کانال‌ها، نقش‌ها و نقاط گم‌شدن کار را می‌شناسیم." },
  { number: "۲", title: "پیکربندی", description: "مشتری، خدمات، فرم‌ها، مدارک، وضعیت‌ها و دسترسی‌ها تنظیم می‌شوند." },
  { number: "۳", title: "پایلوت", description: "یک مسیر واقعی با دادهٔ کنترل‌شده اجرا و با تیم بازبینی می‌شود." },
  { number: "۴", title: "استقرار", description: "دادهٔ اولیه وارد، کاربران آموزش و معیارهای عملیات پایش می‌شوند." }
]);

