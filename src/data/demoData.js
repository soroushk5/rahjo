export const portfolioMetrics = Object.freeze([
  { label: "عناوین سبد بررسی", value: "۵۲", note: "عنوان محصول؛ نه سرویس فعال", icon: "database" },
  { label: "خوشه‌های داده", value: "۰۶", note: "مدل فعلی دسته‌بندی", icon: "layers" },
  { label: "ادعای عمومی تأییدشده", value: "۰۰", note: "تا ارائه مدارک منبع", icon: "shield" },
  { label: "دروازه عرضه", value: "فعال", note: "کنترل پیش از دسترسی", icon: "lock" }
]);

export const clusterReadiness = Object.freeze([
  { cluster: "خودرو و مالکیت", sensitivity: "حساس", source: "نامشخص", rights: "نامشخص", technical: "ناقص", launch: "مسدود" },
  { cluster: "هویت و تطبیق", sensitivity: "بسیار حساس", source: "نامشخص", rights: "نامشخص", technical: "ناقص", launch: "مسدود" },
  { cluster: "سفر و انتظامی", sensitivity: "بسیار حساس", source: "نامشخص", rights: "نامشخص", technical: "ناقص", launch: "مسدود" },
  { cluster: "مالی و بانکی", sensitivity: "بسیار حساس", source: "نامشخص", rights: "نامشخص", technical: "ناقص", launch: "مسدود" },
  { cluster: "ارتباطات و پیام", sensitivity: "متوسط", source: "قابل طراحی", rights: "مشروط", technical: "اولیه", launch: "پایلوت" },
  { cluster: "سازمان و کسب‌وکار", sensitivity: "کنترل‌شده", source: "نامشخص", rights: "نامشخص", technical: "ناقص", launch: "مسدود" }
]);

export const sampleAccessRequests = Object.freeze([
  { id: "ACC-1048", organization: "شرکت بیمه نمونه", cluster: "خودرو", purpose: "ارزیابی پرونده خسارت", status: "بررسی حقوقی" },
  { id: "ACC-1047", organization: "پلتفرم لیزینگ نمونه", cluster: "هویت", purpose: "پذیرش متقاضی", status: "نیازمند مدرک" },
  { id: "ACC-1046", organization: "سامانه ناوگان نمونه", cluster: "ارتباطات", purpose: "اعلان تراکنشی", status: "قابل پایلوت" },
  { id: "ACC-1045", organization: "SaaS سازمانی نمونه", cluster: "سازمان", purpose: "پذیرش فروشنده", status: "در بررسی" }
]);

export const verificationServices = Object.freeze([
  { id: "vehicle", title: "خودرو و مالکیت", description: "داده‌های خودرو و کنترل مالکیت", icon: "vehicle" },
  { id: "identity", title: "هویت و تطبیق", description: "تطبیق هویت و شناسه‌های مرتبط", icon: "identity" },
  { id: "travel", title: "سفر و وضعیت‌ها", description: "داده‌های سفر و کنترل شرایط", icon: "travel" },
  { id: "financial", title: "مالی و بانکی", description: "تطبیق‌های مالی برای کاربرد مجاز", icon: "bank" },
  { id: "communications", title: "ارتباطات و پیام", description: "OTP و پیام تراکنشی", icon: "message" },
  { id: "organization", title: "سازمان و کسب‌وکار", description: "اعتبارسنجی شخصیت حقوقی", icon: "business" }
]);
