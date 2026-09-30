/** @typedef {"fact_claim" | "hypothesis" | "opinion_joke" | "decision" | "action" | "open_question" | "commitment"} TranscriptKind */
/** @typedef {"money" | "date" | "policy" | "commitment" | "legal"} CriticalField */
/** @typedef {{speaker?: string | null, kind: TranscriptKind, text: string, criticalFields?: CriticalField[], verified?: boolean}} TranscriptItem */
/** @typedef {{speaker: string, kind: TranscriptKind, text: string, reviewRequired: boolean, canonicalEligible: boolean, evidenceRole: "CANDIDATE_FACT" | "CANDIDATE_DECISION" | "CANDIDATE_ACTION" | "CANDIDATE_COMMITMENT" | "NON_FACT_CONTEXT"}} TranscriptAssessment */

/** @param {TranscriptKind} kind @returns {TranscriptAssessment["evidenceRole"]} */
function evidenceRoleFor(kind) {
  if (kind === "fact_claim") return "CANDIDATE_FACT";
  if (kind === "decision") return "CANDIDATE_DECISION";
  if (kind === "action") return "CANDIDATE_ACTION";
  if (kind === "commitment") return "CANDIDATE_COMMITMENT";
  return "NON_FACT_CONTEXT";
}

/** @param {TranscriptItem} item @returns {TranscriptAssessment} */
export function assessTranscriptItem(item) {
  const speaker = item.speaker?.trim() || "UNKNOWN";
  const criticalFields = item.criticalFields ?? [];
  const nonFactKind = ["hypothesis", "opinion_joke", "open_question"].includes(item.kind);
  const reviewRequired =
    speaker === "UNKNOWN" ||
    criticalFields.length > 0 ||
    item.kind === "decision" ||
    item.kind === "commitment" ||
    item.verified !== true;

  return {
    speaker,
    kind: item.kind,
    text: item.text,
    reviewRequired,
    canonicalEligible: item.verified === true && speaker !== "UNKNOWN" && !nonFactKind,
    evidenceRole: evidenceRoleFor(item.kind)
  };
}

/** @param {TranscriptItem[]} items @returns {TranscriptAssessment[]} */
export function assessTranscript(items) {
  return items.map(assessTranscriptItem);
}
