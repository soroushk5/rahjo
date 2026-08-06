export const storyChapters = Object.freeze([
  { id: "source", number: "01", eyebrow: "منبع", title: "هر تصمیم از یک نشانه شروع می‌شود.", text: "رهجو منبع، زمان، مالک داده و سطح اطمینان را قبل از هر تفسیر ثبت می‌کند؛ چون بدون منشأ، داده فقط یک عدد است.", accent: "teal", artifact: "Source record", artifactMeta: "مالک داده · تاریخ مشاهده · دامنه مجاز" },
  { id: "context", number: "02", eyebrow: "زمینه", title: "عدد را از داستانش جدا نکنید.", text: "هر مشاهده کنار زمینه حقوقی، عملیاتی و تاریخی قرار می‌گیرد تا تیم بداند چه چیزی قطعی است، چه چیزی فرض است و کجا باید مکث کند.", accent: "amber", artifact: "Context note", artifactMeta: "قانون · محدودیت · فرض · تضاد" },
  { id: "decision", number: "03", eyebrow: "تصمیم", title: "استدلال باید قابل بازگشت باشد.", text: "از داده تا اقدام، مسیر تصمیم ثبت می‌شود؛ چه کسی دید، چه چیزی سنجید و چرا یک مسیر انتخاب شد.", accent: "blue", artifact: "Decision brief", artifactMeta: "شواهد · گزینه‌ها · ریسک · مسئول" },
  { id: "followup", number: "04", eyebrow: "پیگیری", title: "داستان بعد از تصمیم تمام نمی‌شود.", text: "نتیجه، پیام، استثناء و مداخله انسانی در یک timeline مشترک می‌ماند تا سازمان بتواند یاد بگیرد، نه فقط گزارش بدهد.", accent: "violet", artifact: "Audit timeline", artifactMeta: "اقدام · نتیجه · بازبینی · یادگیری" }
]);
export const platformRooms = Object.freeze([
  { id: "signals", icon: "signal", label: "اتاق نشانه‌ها", title: "جمع‌آوری و سنجش", text: "منابع، مشاهده‌ها و سیگنال‌ها با کیفیت و محدودیت روشن وارد می‌شوند." },
  { id: "stories", icon: "story", label: "اتاق روایت", title: "زمینه و معنا", text: "داده‌ها به پرونده، خط زمانی و روایت قابل‌فهم برای انسان تبدیل می‌شوند." },
  { id: "decisions", icon: "audit", label: "میز تصمیم", title: "تصمیم قابل دفاع", text: "گزینه‌ها، ریسک‌ها و شواهد کنار هم قرار می‌گیرند و رد تصمیم حفظ می‌شود." },
  { id: "operations", icon: "workflow", label: "اتاق عملیات", title: "اجرا و پیگیری", text: "درخواست، پیام، SLA و مداخله انسانی در یک جریان قابل ممیزی ادامه پیدا می‌کند." }
]);
export const editorialStories = Object.freeze([
  { id: "vehicle-claim", section: "پرونده نمونه", title: "وقتی یک استعلام خودرو فقط یک پاسخ نیست", dek: "روایت یک درخواست از ورود شماره پلاک تا تصمیم کارشناس، با نقاط مکث حقوقی و انسانی.", time: "۶ دقیقه مطالعه", tag: "خودرو و بیمه" },
  { id: "identity-trace", section: "یادداشت محصول", title: "احراز هویت بدون رد تصمیم، فقط یک تیک سبز است", dek: "چرا سازمان باید بداند پاسخ از کجا آمده، چه کسی آن را دیده و چه اقدامی بر اساس آن انجام شده است.", time: "۴ دقیقه مطالعه", tag: "احراز و اعتماد" },
  { id: "data-no-go", section: "دفتر ممیزی", title: "چه زمانی نباید یک API را بفروشیم؟", dek: "هفت پرسش پیش از عمومی‌کردن سرویس‌های حساس: منبع، قرارداد، هدف، رضایت، نگهداشت، امنیت و مسئول رخداد.", time: "۸ دقیقه مطالعه", tag: "حاکمیت داده" }
]);
export const sitemapNodes = Object.freeze([
  { id: "home", label: "خانه", type: "public", x: 50, y: 12, href: "/" },
  { id: "platform", label: "پلتفرم", type: "public", x: 22, y: 36, href: "/platform" },
  { id: "stories", label: "روایت‌ها", type: "public", x: 50, y: 36, href: "/stories" },
  { id: "trust", label: "اعتماد", type: "public", x: 78, y: 36, href: "/trust" },
  { id: "map", label: "نقشه محصول", type: "public", x: 10, y: 64, href: "/map" },
  { id: "dashboard", label: "میز تصمیم", type: "product", x: 38, y: 64, href: "/dashboard" },
  { id: "request", label: "جریان درخواست", type: "product", x: 62, y: 64, href: "/request" },
  { id: "governance", label: "دروازه داده", type: "governance", x: 90, y: 64, href: "/trust" },
  { id: "sources", label: "منابع و Adapterها", type: "future", x: 28, y: 88 },
  { id: "crm", label: "CRM و پیام", type: "future", x: 50, y: 88 },
  { id: "apis", label: "APIهای تأییدشده", type: "future", x: 72, y: 88 }
]);
