/**
 * Canonical synthetic fixture layer for Phase-1 Operational Foundation.
 * Nothing in this module represents a live Rahjo customer, provider, API or metric.
 */

export const operationalWorkspace = Object.freeze({
  organization: "رهجو — محیط نمونه",
  environment: "Demo / Synthetic / No-AI",
  disclaimer: "همه نام‌ها، اعداد و رخدادهای این محیط مصنوعی‌اند. هیچ اتصال، eligibility یا سرویس Production در این نسخه ادعا نمی‌شود."
});

export const people = Object.freeze([
  { userId: "USR-DEMO-001", name: "مهدی احمدی", role: "مدیر عملیات" },
  { userId: "USR-DEMO-002", name: "سارا نوری", role: "مسئول فروش" },
  { userId: "USR-DEMO-003", name: "نرگس رضایی", role: "کارشناس سرویس" }
]);

export const demoAccounts = Object.freeze([
  { accountId: "ACC-DEMO-001", name: "شرکت نمونه آفتاب", legalName: "شرکت نمونه آفتاب — داده مصنوعی", accountType: "سازمانی", lifecycleStatus: "Active", ownerId: "USR-DEMO-001", owner: "مهدی احمدی", segment: "B2B نمونه", sourceSystem: "Website form — Demo", sourceRef: "LEAD-DEMO-001", createdAt: "۱۴۰۴/۰۴/۱۰", updatedAt: "۱۴۰۴/۰۶/۲۳", nextAction: "تکمیل مدارک مالی و ثبت نتیجه تماس", nextDue: "امروز، ۱۶:۰۰", contactIds: ["CON-DEMO-001", "CON-DEMO-002"], caseIds: ["CASE-DEMO-101", "CASE-DEMO-104"], opportunityIds: ["OPP-DEMO-001"], taskIds: ["TASK-DEMO-001", "TASK-DEMO-006"] },
  { accountId: "ACC-DEMO-002", name: "صنایع پیشرو پارس", legalName: "صنایع پیشرو پارس — داده مصنوعی", accountType: "سازمانی", lifecycleStatus: "Prospect", ownerId: "USR-DEMO-002", owner: "سارا نوری", segment: "متقاضی پایلوت", sourceSystem: "Operator intake — Demo", sourceRef: "LEAD-DEMO-002", createdAt: "۱۴۰۴/۰۵/۰۲", updatedAt: "۱۴۰۴/۰۶/۲۲", nextAction: "بررسی شرایط پایلوت و تعیین مالک تصمیم", nextDue: "فردا", contactIds: ["CON-DEMO-003"], caseIds: ["CASE-DEMO-102"], opportunityIds: ["OPP-DEMO-002"], taskIds: ["TASK-DEMO-002"] },
  { accountId: "ACC-DEMO-003", name: "توسعه تجارت نوین", legalName: "توسعه تجارت نوین — داده مصنوعی", accountType: "همکار تجاری", lifecycleStatus: "Prospect", ownerId: "USR-DEMO-003", owner: "نرگس رضایی", segment: "ورودی چندخدمت", sourceSystem: "Digital channel — Demo", sourceRef: "LEAD-DEMO-003", createdAt: "۱۴۰۴/۰۵/۲۱", updatedAt: "۱۴۰۴/۰۶/۲۱", nextAction: "تطبیق RFQ با قابلیت‌های قابل بررسی", nextDue: "۲ روز دیگر", contactIds: ["CON-DEMO-004"], caseIds: ["CASE-DEMO-103"], opportunityIds: ["OPP-DEMO-003"], taskIds: ["TASK-DEMO-003"] },
  { accountId: "ACC-DEMO-004", name: "فراگستر فناوری", legalName: "فراگستر فناوری — داده مصنوعی", accountType: "سازمانی", lifecycleStatus: "Dormant", ownerId: "USR-DEMO-001", owner: "مهدی احمدی", segment: "نیازمند بازبینی", sourceSystem: "Imported sample", sourceRef: "IMPORT-DEMO-007", createdAt: "۱۴۰۴/۰۳/۱۶", updatedAt: "۱۴۰۴/۰۵/۱۵", nextAction: "تعیین وضعیت رکورد و منبع تازه", nextDue: "بدون موعد", contactIds: ["CON-DEMO-005"], caseIds: ["CASE-DEMO-105"], opportunityIds: ["OPP-DEMO-004"], taskIds: ["TASK-DEMO-007"] }
]);

export const demoContacts = Object.freeze([
  { contactId: "CON-DEMO-001", accountId: "ACC-DEMO-001", fullName: "مریم رستگار", role: "مالک نیاز", channel: "تماس", contactability: "تأییدنشده — دمو", sourceSystem: "Website form — Demo", updatedAt: "۱۴۰۴/۰۶/۲۳" },
  { contactId: "CON-DEMO-002", accountId: "ACC-DEMO-001", fullName: "سعید فرهمند", role: "بررسی مالی", channel: "جلسه", contactability: "فقط پیگیری انسانی", sourceSystem: "Operator note — Demo", updatedAt: "۱۴۰۴/۰۶/۲۲" },
  { contactId: "CON-DEMO-003", accountId: "ACC-DEMO-002", fullName: "بهار کریمی", role: "نماینده پایلوت", channel: "ایمیل", contactability: "نامشخص — دمو", sourceSystem: "Operator intake — Demo", updatedAt: "۱۴۰۴/۰۶/۲۲" },
  { contactId: "CON-DEMO-004", accountId: "ACC-DEMO-003", fullName: "امیر کاوه", role: "درخواست‌دهنده RFQ", channel: "فرم", contactability: "فرم وب — دمو", sourceSystem: "Digital channel — Demo", updatedAt: "۱۴۰۴/۰۶/۲۱" },
  { contactId: "CON-DEMO-005", accountId: "ACC-DEMO-004", fullName: "پریسا تهرانی", role: "نقش نیازمند تأیید", channel: "Import", contactability: "stale — دمو", sourceSystem: "Imported sample", updatedAt: "۱۴۰۴/۰۵/۱۵" }
]);

export const demoLeads = Object.freeze([
  { leadId: "LEAD-DEMO-001", accountId: "ACC-DEMO-001", account: "شرکت نمونه آفتاب", sourceChannel: "فرم وب‌سایت", status: "Qualified", receivedAt: "۱۴۰۴/۰۶/۲۰", owner: "سارا نوری", qualificationReason: "نیاز سازمانی روشن — نمونه" },
  { leadId: "LEAD-DEMO-002", accountId: "ACC-DEMO-002", account: "صنایع پیشرو پارس", sourceChannel: "ورودی اپراتور", status: "Reviewing", receivedAt: "۱۴۰۴/۰۶/۲۱", owner: "سارا نوری", qualificationReason: "شرایط پایلوت نیازمند بررسی" },
  { leadId: "LEAD-DEMO-003", accountId: "ACC-DEMO-003", account: "توسعه تجارت نوین", sourceChannel: "کانال دیجیتال", status: "New", receivedAt: "۱۴۰۴/۰۶/۲۲", owner: "نرگس رضایی", qualificationReason: "RFQ چندخدمت" },
  { leadId: "LEAD-DEMO-004", accountId: null, account: "ورودی نمونه بدون تطبیق", sourceChannel: "پرتال", status: "Reviewing", receivedAt: "۱۴۰۴/۰۶/۲۳", owner: "مهدی احمدی", qualificationReason: "نیازمند جلوگیری از هویت تکراری" }
]);

export const demoOpportunities = Object.freeze([
  { opportunityId: "OPP-DEMO-001", accountId: "ACC-DEMO-001", account: "شرکت نمونه آفتاب", title: "پایلوت سرویس سازمانی", stage: "Proposal", owner: "مهدی احمدی", serviceIds: ["SVC-DEMO-001"], nextAction: "تکمیل Case و مدارک", updatedAt: "۱۴۰۴/۰۶/۲۳" },
  { opportunityId: "OPP-DEMO-002", accountId: "ACC-DEMO-002", account: "صنایع پیشرو پارس", title: "دسترسی Sandbox", stage: "Qualified", owner: "سارا نوری", serviceIds: ["SVC-DEMO-002"], nextAction: "تعیین Gate", updatedAt: "۱۴۰۴/۰۶/۲۲" },
  { opportunityId: "OPP-DEMO-003", accountId: "ACC-DEMO-003", account: "توسعه تجارت نوین", title: "RFQ چندخدمت", stage: "Identified", owner: "نرگس رضایی", serviceIds: ["SVC-DEMO-003", "SVC-DEMO-004"], nextAction: "بررسی eligibility", updatedAt: "۱۴۰۴/۰۶/۲۱" },
  { opportunityId: "OPP-DEMO-004", accountId: "ACC-DEMO-004", account: "فراگستر فناوری", title: "بازگشایی همکاری", stage: "On Hold", owner: "مهدی احمدی", serviceIds: ["SVC-DEMO-005"], nextAction: "به‌روزرسانی منبع", updatedAt: "۱۴۰۴/۰۵/۱۵" }
]);

export const demoCases = Object.freeze([
  { caseId: "CASE-DEMO-101", accountId: "ACC-DEMO-001", account: "شرکت نمونه آفتاب", serviceId: "SVC-DEMO-001", purpose: "بررسی پایلوت سرویس احراز", priority: "بالا", status: "Waiting/Approval", owner: "مهدی احمدی", sourceChannel: "Website", openedAt: "۱۴۰۴/۰۶/۲۰", nextAction: "تکمیل مدارک", approvalId: "APR-DEMO-001", actionId: "ACT-DEMO-001", outcomeId: null },
  { caseId: "CASE-DEMO-102", accountId: "ACC-DEMO-002", account: "صنایع پیشرو پارس", serviceId: "SVC-DEMO-002", purpose: "درخواست اطلاعات سازمانی نمونه", priority: "متوسط", status: "Context/Qualification", owner: "نرگس رضایی", sourceChannel: "Operator", openedAt: "۱۴۰۴/۰۶/۲۱", nextAction: "جمع‌آوری evidence", approvalId: null, actionId: null, outcomeId: null },
  { caseId: "CASE-DEMO-103", accountId: "ACC-DEMO-003", account: "توسعه تجارت نوین", serviceId: "SVC-DEMO-003", purpose: "اعلان و پیگیری Sandbox", priority: "متوسط", status: "Action/Execution", owner: "نرگس رضایی", sourceChannel: "Digital", openedAt: "۱۴۰۴/۰۶/۲۲", nextAction: "بررسی receipt آزمایشی", approvalId: "APR-DEMO-002", actionId: "ACT-DEMO-002", outcomeId: null },
  { caseId: "CASE-DEMO-104", accountId: "ACC-DEMO-001", account: "شرکت نمونه آفتاب", serviceId: "SVC-DEMO-003", purpose: "پیگیری موعد جلسه", priority: "کم", status: "Resolved", owner: "مهدی احمدی", sourceChannel: "Operator", openedAt: "۱۴۰۴/۰۶/۱۸", nextAction: "ثبت بازخورد", approvalId: "APR-DEMO-003", actionId: "ACT-DEMO-003", outcomeId: "OUT-DEMO-001" },
  { caseId: "CASE-DEMO-105", accountId: "ACC-DEMO-004", account: "فراگستر فناوری", serviceId: "SVC-DEMO-005", purpose: "بازبینی رکورد قدیمی", priority: "کم", status: "Waiting", owner: "مهدی احمدی", sourceChannel: "Import", openedAt: "۱۴۰۴/۰۵/۱۵", nextAction: "تعیین freshness", approvalId: null, actionId: null, outcomeId: null }
]);

export const demoTasks = Object.freeze([
  { taskId: "TASK-DEMO-001", accountId: "ACC-DEMO-001", caseId: "CASE-DEMO-101", title: "تکمیل مدارک مالی", owner: "مهدی احمدی", dueAt: "امروز، ۱۶:۰۰", status: "In Progress", priority: "بالا" },
  { taskId: "TASK-DEMO-002", accountId: "ACC-DEMO-002", caseId: "CASE-DEMO-102", title: "دریافت evidence پایلوت", owner: "سارا نوری", dueAt: "فردا", status: "Open", priority: "بالا" },
  { taskId: "TASK-DEMO-003", accountId: "ACC-DEMO-003", caseId: "CASE-DEMO-103", title: "بررسی RFQ", owner: "نرگس رضایی", dueAt: "۲ روز دیگر", status: "Open", priority: "متوسط" },
  { taskId: "TASK-DEMO-004", accountId: "ACC-DEMO-003", caseId: "CASE-DEMO-103", title: "بررسی receipt Sandbox", owner: "نرگس رضایی", dueAt: "امروز", status: "Blocked", priority: "متوسط" },
  { taskId: "TASK-DEMO-005", accountId: "ACC-DEMO-002", caseId: "CASE-DEMO-102", title: "تعیین مالک تصمیم", owner: "سارا نوری", dueAt: "۳ روز دیگر", status: "Open", priority: "متوسط" },
  { taskId: "TASK-DEMO-006", accountId: "ACC-DEMO-001", caseId: "CASE-DEMO-104", title: "ثبت Outcome جلسه", owner: "مهدی احمدی", dueAt: "امروز", status: "Open", priority: "کم" },
  { taskId: "TASK-DEMO-007", accountId: "ACC-DEMO-004", caseId: "CASE-DEMO-105", title: "بازبینی منبع stale", owner: "مهدی احمدی", dueAt: "بدون موعد", status: "Blocked", priority: "کم" }
]);

export const demoServiceCapabilities = Object.freeze([
  { serviceId: "SVC-DEMO-001", name: "احراز و استعلام سازمانی", category: "داده/استعلام", publicStatus: "Demo/Synthetic", eligibilityStatus: "Evidence Required", environmentStatus: "Sandbox only", riskClass: "متوسط", owner: "نرگس رضایی", evidenceRef: "TBD" },
  { serviceId: "SVC-DEMO-002", name: "اطلاعات سازمانی", category: "اطلاعات تجاری", publicStatus: "Under Review", eligibilityStatus: "Under Review", environmentStatus: "No adapter", riskClass: "متوسط", owner: "TBD", evidenceRef: "TBD" },
  { serviceId: "SVC-DEMO-003", name: "اعلان و پیگیری", category: "عملیات", publicStatus: "Pilot Candidate", eligibilityStatus: "Pilot Candidate", environmentStatus: "Deterministic demo", riskClass: "کم", owner: "نرگس رضایی", evidenceRef: "REC-DEMO-004" },
  { serviceId: "SVC-DEMO-004", name: "بسته‌بندی گزارش", category: "سند", publicStatus: "Demo/Synthetic", eligibilityStatus: "Evidence Required", environmentStatus: "Manual demo", riskClass: "کم", owner: "مهدی احمدی", evidenceRef: "TBD" },
  { serviceId: "SVC-DEMO-005", name: "اتصال منبع قدیمی", category: "Integration", publicStatus: "Unavailable/TBD", eligibilityStatus: "Unavailable/TBD", environmentStatus: "Stale / degraded fixture", riskClass: "بالا", owner: "TBD", evidenceRef: "Unavailable" }
]);

export const demoApprovals = Object.freeze([
  { approvalId: "APR-DEMO-001", caseId: "CASE-DEMO-101", policyRef: "POL-DEMO-MED", approver: "سارا نوری", status: "Requested", requestedAt: "۱۴۰۴/۰۶/۲۳", reason: "مدارک ناقص" },
  { approvalId: "APR-DEMO-002", caseId: "CASE-DEMO-103", policyRef: "POL-DEMO-LOW", approver: "مهدی احمدی", status: "Approved", requestedAt: "۱۴۰۴/۰۶/۲۲", reason: "اجرای محدود Sandbox" },
  { approvalId: "APR-DEMO-003", caseId: "CASE-DEMO-104", policyRef: "POL-DEMO-LOW", approver: "مهدی احمدی", status: "Approved", requestedAt: "۱۴۰۴/۰۶/۱۸", reason: "Task انسانی" },
  { approvalId: "APR-DEMO-004", caseId: "CASE-DEMO-105", policyRef: "POL-DEMO-HIGH", approver: "TBD", status: "Expired", requestedAt: "۱۴۰۴/۰۵/۱۵", reason: "منبع stale" }
]);

export const demoActions = Object.freeze([
  { actionId: "ACT-DEMO-001", caseId: "CASE-DEMO-101", decisionId: "DEC-DEMO-001", actionType: "درخواست مدرک", owner: "مهدی احمدی", executionMode: "Human", status: "Proposed", requestedAt: "۱۴۰۴/۰۶/۲۳" },
  { actionId: "ACT-DEMO-002", caseId: "CASE-DEMO-103", decisionId: "DEC-DEMO-002", actionType: "ایجاد اعلان آزمایشی", owner: "نرگس رضایی", executionMode: "Sandbox", status: "Running", requestedAt: "۱۴۰۴/۰۶/۲۳" },
  { actionId: "ACT-DEMO-003", caseId: "CASE-DEMO-104", decisionId: "DEC-DEMO-003", actionType: "ثبت پیگیری", owner: "مهدی احمدی", executionMode: "Human", status: "Succeeded", requestedAt: "۱۴۰۴/۰۶/۱۸" },
  { actionId: "ACT-DEMO-004", caseId: "CASE-DEMO-102", decisionId: null, actionType: "بررسی eligibility", owner: "نرگس رضایی", executionMode: "Human", status: "Failed", requestedAt: "۱۴۰۴/۰۶/۲۲" }
]);

export const demoOutcomes = Object.freeze([
  { outcomeId: "OUT-DEMO-001", caseId: "CASE-DEMO-104", actionId: "ACT-DEMO-003", outcomeType: "Follow-up completed", resultStatus: "Recorded", reason: "جلسه برگزار و اقدام بعدی ثبت شد — نمونه", recordedBy: "مهدی احمدی", recordedAt: "۱۴۰۴/۰۶/۲۲" },
  { outcomeId: "OUT-DEMO-002", caseId: "CASE-DEMO-099", actionId: "ACT-DEMO-099", outcomeType: "Request closed", resultStatus: "Recorded", reason: "درخواست قدیمی نمونه بسته شد", recordedBy: "سیستم دمو", recordedAt: "۱۴۰۴/۰۶/۲۰" }
]);

export const demoInteractions = Object.freeze([
  { interactionId: "INT-DEMO-001", accountId: "ACC-DEMO-001", caseId: "CASE-DEMO-101", channel: "فرم وب‌سایت", occurredAt: "۱۴۰۴/۰۶/۲۰ · ۰۹:۱۵", actor: "مریم رستگار", summary: "درخواست همکاری ثبت شد", sourceRef: "FORM-DEMO-119" },
  { interactionId: "INT-DEMO-002", accountId: "ACC-DEMO-001", caseId: "CASE-DEMO-101", channel: "تماس", occurredAt: "۱۴۰۴/۰۶/۲۲ · ۱۲:۳۵", actor: "مهدی احمدی", summary: "اطلاعات پایه و محدودیت سرویس توضیح داده شد", sourceRef: "CALL-DEMO-014" },
  { interactionId: "INT-DEMO-003", accountId: "ACC-DEMO-001", caseId: "CASE-DEMO-101", channel: "جلسه", occurredAt: "۱۴۰۴/۰۶/۲۳ · ۱۰:۲۰", actor: "مهدی احمدی", summary: "مدارک تکمیلی و Gate بررسی شد", sourceRef: "MEET-DEMO-008" },
  { interactionId: "INT-DEMO-004", accountId: "ACC-DEMO-001", caseId: "CASE-DEMO-104", channel: "سند", occurredAt: "۱۴۰۴/۰۶/۲۲ · ۱۴:۱۰", actor: "سعید فرهمند", summary: "سند نمونه پیوست شد؛ محتوای حساس نمایش داده نمی‌شود", sourceRef: "DOC-DEMO-007" },
  { interactionId: "INT-DEMO-005", accountId: "ACC-DEMO-002", caseId: "CASE-DEMO-102", channel: "ایمیل", occurredAt: "۱۴۰۴/۰۶/۲۲ · ۱۱:۴۰", actor: "سارا نوری", summary: "لیست evidence موردنیاز ارسال شد", sourceRef: "MAIL-DEMO-012" },
  { interactionId: "INT-DEMO-006", accountId: "ACC-DEMO-003", caseId: "CASE-DEMO-103", channel: "پرتال", occurredAt: "۱۴۰۴/۰۶/۲۳ · ۰۸:۵۵", actor: "امیر کاوه", summary: "وضعیت RFQ نمونه مشاهده شد", sourceRef: "PORTAL-DEMO-004" }
]);

export const demoProposals = Object.freeze([{ proposalId: "PROP-DEMO-001", accountId: "ACC-DEMO-001", opportunityId: "OPP-DEMO-001", version: "v0.2-demo", status: "Review", owner: "مهدی احمدی", approvalState: "Requested" }]);
export const demoContracts = Object.freeze([{ contractId: "CONTRACT-DEMO-001", accountId: "ACC-DEMO-001", proposalId: "PROP-DEMO-001", status: "Reference only / TBD", owner: "مهدی احمدی" }]);

export const demoWorkflows = Object.freeze([
  { workflowId: "WF-DEMO-001", name: "ورودی دیجیتال → تطبیق حساب → Task", trigger: "Form received", context: "Lead + source attribution", risk: "کم", approval: "Rule boundary", humanHandoff: "مالک Lead", status: "Demo" },
  { workflowId: "WF-DEMO-002", name: "Case → بررسی eligibility", trigger: "Case qualified", context: "Case + ServiceCapability", risk: "متوسط", approval: "Human required", humanHandoff: "کارشناس سرویس", status: "Pilot Candidate" },
  { workflowId: "WF-DEMO-003", name: "Approval → اجرای Sandbox", trigger: "Approval approved", context: "Action + idempotency", risk: "متوسط", approval: "Human required", humanHandoff: "مدیر عملیات", status: "Demo" },
  { workflowId: "WF-DEMO-004", name: "Outcome → پیگیری", trigger: "Outcome recorded", context: "Account + Case history", risk: "کم", approval: "Deterministic rule", humanHandoff: "مالک حساب", status: "Demo" }
]);

export const demoAutomationRuns = Object.freeze([
  { runId: "RUN-DEMO-001", workflowId: "WF-DEMO-001", workflow: "ورودی دیجیتال → Task", caseId: "CASE-DEMO-101", state: "succeeded", approval: "Rule boundary", startedAt: "۱۴۰۴/۰۶/۲۳ · ۰۹:۱۵", receipt: "REC-DEMO-001", retry: "—" },
  { runId: "RUN-DEMO-002", workflowId: "WF-DEMO-002", workflow: "Case → eligibility", caseId: "CASE-DEMO-102", state: "queued", approval: "Human required", startedAt: "۱۴۰۴/۰۶/۲۳ · ۱۰:۴۰", receipt: "در انتظار", retry: "—" },
  { runId: "RUN-DEMO-003", workflowId: "WF-DEMO-003", workflow: "Approval → Sandbox", caseId: "CASE-DEMO-103", state: "running", approval: "Approved demo", startedAt: "۱۴۰۴/۰۶/۲۳ · ۱۱:۱۰", receipt: "در حال ساخت", retry: "—" },
  { runId: "RUN-DEMO-004", workflowId: "WF-DEMO-003", workflow: "Service request → adapter", caseId: "CASE-DEMO-105", state: "failed", approval: "Human required", startedAt: "۱۴۰۴/۰۶/۲۲ · ۱۵:۰۵", receipt: "REC-DEMO-004", retry: "یک تلاش مجاز" },
  { runId: "RUN-DEMO-005", workflowId: "WF-DEMO-004", workflow: "Outcome → follow-up", caseId: "CASE-DEMO-104", state: "canceled", approval: "Operator canceled", startedAt: "۱۴۰۴/۰۶/۲۲ · ۱۶:۳۰", receipt: "REC-DEMO-005", retry: "—" }
]);

export const demoDataQuality = Object.freeze([
  { issueId: "DQ-DEMO-001", type: "Missing", entity: "Contact", reference: "CON-DEMO-005", severity: "بالا", state: "Open", owner: "مهدی احمدی", detectedAt: "۱۴۰۴/۰۶/۲۳", summary: "نقش تماس نیازمند تأیید است" },
  { issueId: "DQ-DEMO-002", type: "Duplicate candidate", entity: "Lead", reference: "LEAD-DEMO-004", severity: "متوسط", state: "Reviewing", owner: "سارا نوری", detectedAt: "۱۴۰۴/۰۶/۲۳", summary: "پیش از ساخت حساب جدید، تطبیق هویت لازم است" },
  { issueId: "DQ-DEMO-003", type: "Stale", entity: "Account", reference: "ACC-DEMO-004", severity: "متوسط", state: "Open", owner: "مهدی احمدی", detectedAt: "۱۴۰۴/۰۶/۲۲", summary: "منبع حساب بیش از بازه نمونه به‌روزرسانی نشده" },
  { issueId: "DQ-DEMO-004", type: "Ownerless", entity: "ServiceCapability", reference: "SVC-DEMO-002", severity: "بالا", state: "Blocked", owner: "TBD", detectedAt: "۱۴۰۴/۰۶/۲۱", summary: "مالک capability تعیین نشده است" }
]);

export const demoAuditEvents = Object.freeze([
  { eventId: "EVT-DEMO-001", caseId: "CASE-DEMO-101", actor: "مریم رستگار", source: "Website form — Demo", time: "۰۹:۱۵", change: "Case created", state: "Open → Context" },
  { eventId: "EVT-DEMO-002", caseId: "CASE-DEMO-101", actor: "مهدی احمدی", source: "Operator — Demo", time: "۱۰:۲۰", change: "Evidence reviewed", state: "Context → Waiting/Approval" },
  { eventId: "EVT-DEMO-003", caseId: "CASE-DEMO-101", actor: "سارا نوری", source: "Approval policy — Demo", time: "۱۱:۰۵", change: "Approval requested", state: "Requested" },
  { eventId: "EVT-DEMO-004", caseId: "CASE-DEMO-103", actor: "نرگس رضایی", source: "Sandbox runner — Demo", time: "۱۱:۱۰", change: "Action started", state: "Ready → Running" },
  { eventId: "EVT-DEMO-005", caseId: "CASE-DEMO-104", actor: "مهدی احمدی", source: "Operator — Demo", time: "۱۴:۱۰", change: "Outcome recorded", state: "Resolved" }
]);

export const operationalMetrics = Object.freeze([
  { key: "cases", label: "پرونده‌ها و درخواست‌های باز", value: "۴", note: "از fixtureهای canonical", icon: "requests", tone: "neutral" },
  { key: "tasks", label: "پیگیری‌های نیازمند اقدام", value: "۶", note: "۲ مورد با اولویت بالا", icon: "clock", tone: "warning" },
  { key: "services", label: "درخواست سرویس و API", value: "۳", note: "فقط دمو / Sandbox", icon: "api", tone: "neutral" },
  { key: "approvals", label: "تأییدهای باز یا ناموفق", value: "۲", note: "اقدام حساس اجرا نشده", icon: "shield", tone: "blocked" },
  { key: "quality", label: "هشدارهای کیفیت داده", value: "۴", note: "بدون merge خودکار", icon: "database", tone: "warning" }
]);

/** @param {string} accountId */
export function accountMemory(accountId) {
  const account = demoAccounts.find((item) => item.accountId === accountId) ?? demoAccounts[0];
  return {
    account,
    contacts: demoContacts.filter((item) => item.accountId === account.accountId),
    opportunities: demoOpportunities.filter((item) => item.accountId === account.accountId),
    cases: demoCases.filter((item) => item.accountId === account.accountId),
    tasks: demoTasks.filter((item) => item.accountId === account.accountId),
    interactions: demoInteractions.filter((item) => item.accountId === account.accountId),
    proposals: demoProposals.filter((item) => item.accountId === account.accountId),
    contracts: demoContracts.filter((item) => item.accountId === account.accountId),
    outcomes: demoOutcomes.filter((outcome) => demoCases.some((item) => item.accountId === account.accountId && item.caseId === outcome.caseId))
  };
}
