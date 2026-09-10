import test from "node:test";
import assert from "node:assert/strict";
import { renderHomePage, renderProductPage, renderServicesPage, renderUseCasesPage } from "../src/features/public/publicPages.js";
import { renderDashboardPage, renderCustomersPage, renderRequestsPage, renderSalesPage } from "../src/features/operations/corePages.js";
import { renderCustomerDetailPage, renderRequestDetailPage } from "../src/features/operations/detailPages.js";
import { renderFinancePage, renderOperationsPage, renderReportsPage } from "../src/features/operations/supportPages.js";
import { renderServiceRequestPage } from "../src/features/requests/serviceRequestPage.js";
import { renderLoginPage } from "../src/features/auth/loginPage.js";

const pages = [
  renderHomePage, renderProductPage, renderServicesPage, renderUseCasesPage, renderDashboardPage,
  renderCustomersPage, renderCustomerDetailPage, renderSalesPage, renderRequestsPage, renderRequestDetailPage,
  renderOperationsPage, renderFinancePage, renderReportsPage, renderServiceRequestPage, renderLoginPage
];

test("all primary phase-one routes render meaningful safe markup", () => {
  for (const render of pages) {
    const html = render();
    assert.match(html, /<h1>|<h2>/);
    assert.doesNotMatch(html, />undefined<|>null</);
    assert.match(html, /رهجو/);
  }
});

test("homepage communicates the full customer-to-outcome promise", () => {
  const html = renderHomePage();
  for (const phrase of ["مشتری", "فروش", "خدمت", "عملیات", "نتیجه"]) assert.match(html, new RegExp(phrase));
  for (const path of ["/product", "/services", "/use-cases", "/how-it-works", "/login", "/contact"]) {
    assert.match(html, new RegExp(`href="${path}"`));
  }
});

test("operations console exposes the core business system", () => {
  const html = renderDashboardPage();
  for (const path of ["/customers", "/sales", "/requests", "/tasks", "/operations", "/finance", "/reports"]) {
    assert.match(html, new RegExp(`href="${path}"`));
  }
});

test("retired data-access product framing is absent from rendered phase-one UI", () => {
  const html = pages.map((render) => render()).join("\n");
  for (const phrase of ["Think Room", "Data Basket", "Access Request", "داستان داده", "اطلس روایت"]) {
    assert.doesNotMatch(html, new RegExp(phrase, "i"));
  }
});
