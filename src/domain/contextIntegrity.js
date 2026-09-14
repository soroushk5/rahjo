/** @typedef {"canonical" | "derived" | "general" | "external"} ContextSourceType */
/** @typedef {{id: string, sourceType: ContextSourceType, caseId: string | null, accountId: string | null, permission: "allowed" | "denied", sourceIds?: string[], version?: string | null, verified?: boolean}} ContextItem */
/** @typedef {{caseId: string, accountId: string}} ContextScope */
/** @typedef {{accepted: boolean, actionEligible: boolean, reasons: string[]}} ContextAssessment */

/** @param {ContextItem} item @param {ContextScope} scope @returns {ContextAssessment} */
export function assessContextItem(item, scope) {
  /** @type {string[]} */
  const reasons = [];

  if (item.permission !== "allowed") reasons.push("permission_denied");
  if (item.caseId !== null && item.caseId !== scope.caseId) reasons.push("case_scope_mismatch");
  if (item.accountId !== null && item.accountId !== scope.accountId) reasons.push("account_scope_mismatch");

  if (item.sourceType === "derived") {
    if (!item.version) reasons.push("derived_version_missing");
    if ((item.sourceIds ?? []).length === 0) reasons.push("derived_provenance_missing");
  }

  const accepted = reasons.length === 0;
  const actionEligible =
    accepted &&
    item.sourceType === "canonical" &&
    item.caseId === scope.caseId &&
    item.accountId === scope.accountId &&
    item.verified === true;

  return { accepted, actionEligible, reasons };
}

/**
 * @param {ContextItem[]} items
 * @param {ContextScope} scope
 * @returns {{accepted: ContextItem[], rejected: Array<{item: ContextItem, reasons: string[]}>, actionEligibleIds: string[]}}
 */
export function buildScopedContext(items, scope) {
  /** @type {ContextItem[]} */
  const accepted = [];
  /** @type {Array<{item: ContextItem, reasons: string[]}>} */
  const rejected = [];
  /** @type {string[]} */
  const actionEligibleIds = [];

  for (const item of items) {
    const assessment = assessContextItem(item, scope);
    if (!assessment.accepted) {
      rejected.push({ item, reasons: assessment.reasons });
      continue;
    }
    accepted.push(item);
    if (assessment.actionEligible) actionEligibleIds.push(item.id);
  }

  return { accepted, rejected, actionEligibleIds };
}
