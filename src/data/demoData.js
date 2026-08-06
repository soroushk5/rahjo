export const metrics = Object.freeze([
  { label: "درخواست‌های امروز", value: "248", delta: "+12.5%" },
  { label: "موفقیت پردازش", value: "99.62%", delta: "+0.7%" },
  { label: "میانگین پاسخ", value: "320ms", delta: "-8.4%" },
  { label: "اعتبار باقی‌مانده", value: "12,840", delta: "+6%" }
]);

export const services = Object.freeze([
  { name: "احراز هویت", status: "در حال اجرا" },
  { name: "استعلام تلفن", status: "در حال اجرا" },
  { name: "اعتبارسنجی شماره", status: "در حال اجرا" },
  { name: "API پرداخت", status: "نمایشی" }
]);

export const recentRequests = Object.freeze([
  { id: "REQ-12548", type: "احراز هویت", status: "موفق", time: "۱۴:۳۲" },
  { id: "REQ-12547", type: "استعلام تلفن", status: "موفق", time: "۱۴:۲۲" },
  { id: "REQ-12546", type: "استعلام بانکی", status: "بررسی", time: "۱۴:۱۸" },
  { id: "REQ-12545", type: "احراز کسب‌وکار", status: "موفق", time: "۱۴:۰۵" }
]);

export const verificationServices = Object.freeze([
  { id: "identity", title: "احراز هویت", description: "تأیید هویت حقیقی", icon: "identity" },
  { id: "phone", title: "استعلام تلفن", description: "اعتبارسنجی شماره موبایل", icon: "phone" },
  { id: "bank", title: "استعلام بانکی", description: "اطلاعات حساب و شبا", icon: "bank" },
  { id: "business", title: "احراز کسب‌وکار", description: "اطلاعات شخصیت حقوقی", icon: "business" },
  { id: "vehicle", title: "استعلام خودرو", description: "اطلاعات مجاز خودرو", icon: "vehicle" },
  { id: "address", title: "استعلام آدرس", description: "صحت‌سنجی نشانی", icon: "address" }
]);
