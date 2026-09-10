import { problems } from "./errors.js";
import { normalizeIntake, normalizePersianText, publicId, requiredIdempotencyKey } from "./normalization.js";
import { payloadDigest } from "./security.js";
import { requireRole, requireScope } from "./database.js";

function record(row) {
  return row ?? null;
}

async function audit(client, context, { eventType, entityType, entityId, correlationId, before = null, after = null, source = "rahjo-bff" }) {
  await client.query(
    `INSERT INTO rahjo.audit_events
       (workspace_id, event_type, entity_type, entity_id, actor_membership_id, source, correlation_id, before_state, after_state)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [context.workspace_id, eventType, entityType, entityId, context.membership_id, source, correlationId, before, after]
  );
}

export class RahjoRepository {
  constructor({ database, relaticle }) {
    this.database = database;
    this.relaticle = relaticle;
  }

  async runtime(context) {
    requireScope(context, "read");
    const extension = await this.database.withWorkspace(context, async (client) => {
      const queries = await Promise.all([
        client.query("SELECT entity_type, relaticle_id AS id, snapshot, created_at, updated_at FROM rahjo.crm_entity_refs WHERE workspace_id=$1 AND entity_type IN ('account','contact') ORDER BY updated_at DESC, id DESC LIMIT 400", [context.workspace_id]),
        client.query("SELECT public_id AS id, name, description, capability_status, execution_mode, version, updated_at FROM rahjo.services WHERE workspace_id=$1 ORDER BY updated_at DESC, id DESC LIMIT 200", [context.workspace_id]),
        client.query(`SELECT capability.public_id AS id, service.public_id AS service_id,
                             capability.capability_code, capability.eligibility_status,
                             capability.environment_status, capability.risk_class,
                             capability.evidence_ref, capability.updated_at
                        FROM rahjo.service_capabilities capability
                        JOIN rahjo.services service
                          ON service.workspace_id=capability.workspace_id AND service.id=capability.service_id
                       WHERE capability.workspace_id=$1
                       ORDER BY capability.updated_at DESC, capability.id DESC LIMIT 500`, [context.workspace_id]),
        client.query("SELECT public_id AS id, account_ref, contact_ref, status, source_channel, attribution, normalized_identity, updated_at FROM rahjo.leads WHERE workspace_id=$1 ORDER BY updated_at DESC, id DESC LIMIT 200", [context.workspace_id]),
        client.query(`SELECT selected_case.public_id AS id, selected_case.account_ref, selected_case.contact_ref,
                             lead.public_id AS lead_id, service.public_id AS service_id,
                             selected_case.purpose, selected_case.status, selected_case.priority,
                             selected_case.source_channel, selected_case.version, selected_case.updated_at
                        FROM rahjo.cases selected_case
                        LEFT JOIN rahjo.leads lead
                          ON lead.workspace_id=selected_case.workspace_id AND lead.id=selected_case.lead_id
                        JOIN rahjo.services service
                          ON service.workspace_id=selected_case.workspace_id AND service.id=selected_case.service_id
                       WHERE selected_case.workspace_id=$1
                       ORDER BY selected_case.updated_at DESC, selected_case.id DESC LIMIT 200`, [context.workspace_id]),
        client.query(`SELECT approval.public_id AS id, selected_case.public_id AS case_id,
                             approval.policy_ref, approval.status, approval.reason,
                             approval.requested_at, approval.decided_at
                        FROM rahjo.approvals approval
                        JOIN rahjo.cases selected_case
                          ON selected_case.workspace_id=approval.workspace_id AND selected_case.id=approval.case_id
                       WHERE approval.workspace_id=$1
                       ORDER BY approval.requested_at DESC, approval.id DESC LIMIT 200`, [context.workspace_id]),
        client.query(`SELECT action.public_id AS id, selected_case.public_id AS case_id,
                             approval.public_id AS approval_id, action.action_type,
                             action.execution_mode, action.status, action.requested_at, action.updated_at
                        FROM rahjo.actions action
                        JOIN rahjo.cases selected_case
                          ON selected_case.workspace_id=action.workspace_id AND selected_case.id=action.case_id
                        JOIN rahjo.approvals approval
                          ON approval.workspace_id=action.workspace_id AND approval.id=action.approval_id
                       WHERE action.workspace_id=$1
                       ORDER BY action.updated_at DESC, action.id DESC LIMIT 200`, [context.workspace_id]),
        client.query(`SELECT run.public_id AS id, action.public_id AS action_id,
                             run.attempt, run.state, run.error_code, run.started_at,
                             run.finished_at, run.created_at
                        FROM rahjo.action_runs run
                        JOIN rahjo.actions action
                          ON action.workspace_id=run.workspace_id AND action.id=run.action_id
                       WHERE run.workspace_id=$1
                       ORDER BY run.created_at DESC, run.id DESC LIMIT 200`, [context.workspace_id]),
        client.query(`SELECT receipt.public_id AS id, action.public_id AS action_id,
                             run.public_id AS run_id, receipt.result_status,
                             receipt.payload_sha256, receipt.external_ref,
                             receipt.evidence, receipt.issued_at
                        FROM rahjo.execution_receipts receipt
                        JOIN rahjo.actions action
                          ON action.workspace_id=receipt.workspace_id AND action.id=receipt.action_id
                        JOIN rahjo.action_runs run
                          ON run.workspace_id=receipt.workspace_id AND run.id=receipt.run_id
                       WHERE receipt.workspace_id=$1
                       ORDER BY receipt.issued_at DESC, receipt.id DESC LIMIT 200`, [context.workspace_id]),
        client.query(`SELECT outcome.public_id AS id, selected_case.public_id AS case_id,
                             action.public_id AS action_id, receipt.public_id AS receipt_id,
                             outcome.result_status, outcome.reason, outcome.metrics, outcome.recorded_at
                        FROM rahjo.outcomes outcome
                        JOIN rahjo.cases selected_case
                          ON selected_case.workspace_id=outcome.workspace_id AND selected_case.id=outcome.case_id
                        JOIN rahjo.actions action
                          ON action.workspace_id=outcome.workspace_id AND action.id=outcome.action_id
                        JOIN rahjo.execution_receipts receipt
                          ON receipt.workspace_id=outcome.workspace_id AND receipt.id=outcome.receipt_id
                       WHERE outcome.workspace_id=$1
                       ORDER BY outcome.recorded_at DESC, outcome.id DESC LIMIT 200`, [context.workspace_id]),
        client.query("SELECT event_type, entity_type, entity_id, source, correlation_id, before_state, after_state, created_at FROM rahjo.audit_events WHERE workspace_id=$1 ORDER BY created_at DESC, id DESC LIMIT 300", [context.workspace_id])
      ]);
      const [crmRefs, services, serviceCapabilities, leads, cases, approvals, actions, runs, receipts, outcomes, auditEvents] = queries.map((item) => item.rows);
      return { crmRefs, services, serviceCapabilities, leads, cases, approvals, actions, runs, receipts, outcomes, auditEvents };
    });

    const deferred = this.relaticle.mode === "native_deferred";
    const [companies, people, opportunities, tasks] = deferred
      ? [
          extension.crmRefs.filter((item) => item.entity_type === "account").map((item) => ({ id: item.id, type: "companies", attributes: item.snapshot })),
          extension.crmRefs.filter((item) => item.entity_type === "contact").map((item) => ({ id: item.id, type: "people", attributes: item.snapshot })),
          [],
          []
        ]
      : await Promise.all([
          this.relaticle.list(context.workspace_id, "companies", "?cursor=true&per_page=100"),
          this.relaticle.list(context.workspace_id, "people", "?cursor=true&per_page=100"),
          this.relaticle.list(context.workspace_id, "opportunities", "?cursor=true&per_page=100"),
          this.relaticle.list(context.workspace_id, "tasks", "?cursor=true&per_page=100")
        ]);
    delete extension.crmRefs;

    return {
      version: 1,
      dataMode: "server",
      workspace: { id: context.workspace_id, slug: context.workspace_slug, name: context.workspace_name },
      user: { id: context.user_id, email: context.user_email, name: context.display_name, role: context.role },
      projection: {
        accounts: companies.map((item) => ({ id: item.id, ...item.attributes, source: deferred ? "rahjo-native-bridge" : "relaticle", syncState: deferred ? "pending_relaticle" : "verified" })),
        contacts: people.map((item) => ({ id: item.id, ...item.attributes, source: deferred ? "rahjo-native-bridge" : "relaticle", syncState: deferred ? "pending_relaticle" : "verified" })),
        opportunities: opportunities.map((item) => ({ id: item.id, ...item.attributes, source: "relaticle", syncState: "verified" })),
        tasks: tasks.map((item) => ({ id: item.id, ...item.attributes, source: "relaticle", syncState: "verified" })),
        ...extension
      }
    };
  }

  async createIntake(context, input, rawIdempotencyKey, correlationId) {
    requireScope(context, "intake:write");
    requireRole(context, ["owner", "admin", "operator", "intake"]);
    const idempotencyKey = requiredIdempotencyKey(rawIdempotencyKey);
    const payload = normalizeIntake(input);
    const digest = payloadDigest(payload);

    const selectedService = await this.database.withWorkspace(context, async (client) => {
      const service = await client.query(
        "SELECT id, public_id, name FROM rahjo.services WHERE workspace_id=$1 AND public_id=$2",
        [context.workspace_id, payload.serviceId]
      );
      if (!service.rowCount) throw problems.validation("The selected service does not exist in this workspace");
      return service.rows[0];
    });

    const reservation = await this.database.withWorkspace(context, async (client) => {
      const existing = await client.query(
        "SELECT status, payload_sha256, response FROM rahjo.intake_requests WHERE workspace_id=$1 AND idempotency_key=$2 FOR UPDATE",
        [context.workspace_id, idempotencyKey]
      );
      if (existing.rowCount) {
        const prior = existing.rows[0];
        if (prior.payload_sha256 !== digest) throw problems.conflict("IDEMPOTENCY_CONFLICT", "The same Idempotency-Key was used with a different payload");
        if (prior.status === "completed") return { replay: true, response: prior.response };
        throw problems.conflict("INTAKE_REQUIRES_RECONCILIATION", "The prior intake attempt is not safely replayable and requires reconciliation");
      }
      await client.query(
        `INSERT INTO rahjo.intake_requests
          (workspace_id, idempotency_key, payload_sha256, source_channel, attribution, status, created_by)
         VALUES ($1,$2,$3,$4,$5,'processing',$6)`,
        [context.workspace_id, idempotencyKey, digest, payload.sourceChannel, payload.attribution, context.membership_id]
      );
      return { replay: false };
    });
    if (reservation.replay) return { status: 200, replayed: true, data: reservation.response };

    let company;
    let person;
    try {
      company = await this.relaticle.createCompany(context.workspace_id, { name: payload.organization });
      person = await this.relaticle.createPerson(context.workspace_id, { name: payload.contactName, companyId: company.id });
    } catch (error) {
      await this.database.withWorkspace(context, async (client) => {
        await client.query(
          `UPDATE rahjo.intake_requests SET status='failed_review', updated_at=now(), response=$3
           WHERE workspace_id=$1 AND idempotency_key=$2`,
          [context.workspace_id, idempotencyKey, {
            errorCode: error.code ?? "RELATICLE_UNAVAILABLE",
            requiresReview: true,
            upstreamCompanyId: company?.id ?? null
          }]
        );
      });
      throw error;
    }

    const result = await this.database.withWorkspace(context, async (client) => {
      const accountId = publicId("ACC");
      const contactId = publicId("CON");
      const leadId = publicId("LEAD");
      const caseId = publicId("CASE");
      const approvalId = publicId("APR");

      await client.query(
        `INSERT INTO rahjo.crm_entity_refs (workspace_id, entity_type, rahjo_id, relaticle_id, snapshot)
         VALUES ($1,'account',$2,$3,$4),($1,'contact',$5,$6,$7)`,
        [context.workspace_id, accountId, company.id, company.attributes, contactId, person.id, person.attributes]
      );
      const lead = await client.query(
        `INSERT INTO rahjo.leads
          (workspace_id, public_id, account_ref, contact_ref, status, source_channel, attribution, normalized_identity)
         VALUES ($1,$2,$3,$4,'captured',$5,$6,$7) RETURNING id`,
        [context.workspace_id, leadId, company.id, person.id, payload.sourceChannel, payload.attribution,
          { organization: payload.normalizedOrganization, email: payload.email, phone: payload.phone }]
      );
      const selectedCase = await client.query(
        `INSERT INTO rahjo.cases
          (workspace_id, public_id, account_ref, contact_ref, lead_id, service_id, purpose, status, priority, owner_membership_id, source_channel)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'waiting_approval','normal',$8,$9) RETURNING id`,
        [context.workspace_id, caseId, company.id, person.id, lead.rows[0].id, selectedService.id, payload.purpose, context.membership_id, payload.sourceChannel]
      );
      const approval = await client.query(
        `INSERT INTO rahjo.approvals
          (workspace_id, public_id, case_id, policy_ref, status, requested_by, reason)
         VALUES ($1,$2,$3,'POL-HUMAN-PHASE1','requested',$4,'Human approval required before deterministic action') RETURNING id`,
        [context.workspace_id, approvalId, selectedCase.rows[0].id, context.membership_id]
      );
      const response = {
        accountId: company.id,
        contactId: person.id,
        leadId,
        caseId,
        serviceId: selectedService.public_id,
        approvalId,
        status: "waiting_approval",
        source: "server"
      };
      await client.query(
        `UPDATE rahjo.intake_requests SET status='completed', response=$3, updated_at=now()
         WHERE workspace_id=$1 AND idempotency_key=$2`,
        [context.workspace_id, idempotencyKey, response]
      );
      await audit(client, context, { eventType: "intake.completed", entityType: "case", entityId: caseId, correlationId, after: response, source: payload.sourceChannel });
      await client.query(
        `INSERT INTO rahjo.outbox_events (workspace_id, event_type, aggregate_type, aggregate_id, payload)
         VALUES ($1,'case.opened','case',$2,$3)`,
        [context.workspace_id, caseId, response]
      );
      return response;
    });
    return { status: 201, replayed: false, data: result };
  }

  async decideApproval(context, approvalPublicId, decision, correlationId) {
    requireScope(context, "approval:decide");
    requireRole(context, ["owner", "admin", "operator"]);
    if (!new Set(["approved", "rejected"]).has(decision)) throw problems.validation("Decision must be approved or rejected");
    return this.database.withWorkspace(context, async (client) => {
      const result = await client.query(
        `SELECT approval.*, selected_case.public_id AS case_public_id, selected_case.status AS case_status
           FROM rahjo.approvals approval
           JOIN rahjo.cases selected_case ON selected_case.workspace_id=approval.workspace_id AND selected_case.id=approval.case_id
          WHERE approval.workspace_id=$1 AND approval.public_id=$2 FOR UPDATE OF approval, selected_case`,
        [context.workspace_id, approvalPublicId]
      );
      if (!result.rowCount) throw problems.notFound();
      const approval = result.rows[0];
      if (approval.status === decision) return { replayed: true, approvalId: approvalPublicId, status: decision, caseId: approval.case_public_id };
      if (approval.status !== "requested") throw problems.conflict("APPROVAL_ALREADY_DECIDED", "The approval already has a different terminal decision");
      await client.query(
        "UPDATE rahjo.approvals SET status=$3, decided_by=$4, decided_at=now() WHERE workspace_id=$1 AND id=$2",
        [context.workspace_id, approval.id, decision, context.membership_id]
      );
      const caseStatus = decision === "approved" ? "ready_action" : "rejected";
      await client.query(
        "UPDATE rahjo.cases SET status=$3, version=version+1, updated_at=now() WHERE workspace_id=$1 AND id=$2",
        [context.workspace_id, approval.case_id, caseStatus]
      );
      await audit(client, context, { eventType: `approval.${decision}`, entityType: "approval", entityId: approvalPublicId, correlationId, before: { status: "requested" }, after: { status: decision } });
      return { replayed: false, approvalId: approvalPublicId, status: decision, caseId: approval.case_public_id };
    });
  }

  async createAction(context, casePublicId, input, rawIdempotencyKey, correlationId) {
    requireScope(context, "action:write");
    requireRole(context, ["owner", "admin", "operator"]);
    const idempotencyKey = requiredIdempotencyKey(rawIdempotencyKey);
    const actionType = normalizePersianText(input?.actionType, { max: 160, required: true });
    const executionMode = input?.executionMode ?? "human";
    if (!new Set(["human", "sandbox", "provider_api"]).has(executionMode)) throw problems.validation("Execution mode is invalid");
    return this.database.withWorkspace(context, async (client) => {
      const replay = await client.query("SELECT public_id, action_type, execution_mode, status FROM rahjo.actions WHERE workspace_id=$1 AND idempotency_key=$2", [context.workspace_id, idempotencyKey]);
      if (replay.rowCount) {
        if (replay.rows[0].action_type !== actionType || replay.rows[0].execution_mode !== executionMode) {
          throw problems.conflict("IDEMPOTENCY_CONFLICT", "The action idempotency key was reused with different input");
        }
        return { replayed: true, actionId: replay.rows[0].public_id, status: replay.rows[0].status };
      }
      const selectedCase = await client.query("SELECT id, status FROM rahjo.cases WHERE workspace_id=$1 AND public_id=$2 FOR UPDATE", [context.workspace_id, casePublicId]);
      if (!selectedCase.rowCount) throw problems.notFound();
      if (selectedCase.rows[0].status !== "ready_action") throw problems.conflict("CASE_NOT_APPROVED", "The Case has not passed its human approval gate");
      const approval = await client.query("SELECT id FROM rahjo.approvals WHERE workspace_id=$1 AND case_id=$2 AND status='approved' ORDER BY decided_at DESC LIMIT 1", [context.workspace_id, selectedCase.rows[0].id]);
      if (!approval.rowCount) throw problems.conflict("APPROVAL_REQUIRED", "An approved human gate is required");
      const actionId = publicId("ACT");
      await client.query(
        `INSERT INTO rahjo.actions
          (workspace_id, public_id, case_id, approval_id, action_type, execution_mode, status, idempotency_key, requested_by)
         VALUES ($1,$2,$3,$4,$5,$6,'queued',$7,$8)`,
        [context.workspace_id, actionId, selectedCase.rows[0].id, approval.rows[0].id, actionType, executionMode, idempotencyKey, context.membership_id]
      );
      await audit(client, context, { eventType: "action.queued", entityType: "action", entityId: actionId, correlationId, after: { actionType, executionMode, status: "queued" } });
      return { replayed: false, actionId, status: "queued" };
    });
  }

  async executeAction(context, actionPublicId, correlationId) {
    requireScope(context, "action:execute");
    requireRole(context, ["owner", "admin", "operator"]);
    return this.database.withWorkspace(context, async (client) => {
      const selected = await client.query(
        `SELECT action.*, selected_case.public_id AS case_public_id
           FROM rahjo.actions action
           JOIN rahjo.cases selected_case ON selected_case.workspace_id=action.workspace_id AND selected_case.id=action.case_id
          WHERE action.workspace_id=$1 AND action.public_id=$2 FOR UPDATE OF action, selected_case`,
        [context.workspace_id, actionPublicId]
      );
      if (!selected.rowCount) throw problems.notFound();
      const action = selected.rows[0];
      const prior = await client.query(
        `SELECT run.public_id AS run_id, receipt.public_id AS receipt_id, receipt.result_status
           FROM rahjo.action_runs run
           JOIN rahjo.execution_receipts receipt ON receipt.workspace_id=run.workspace_id AND receipt.run_id=run.id
          WHERE run.workspace_id=$1 AND run.action_id=$2 AND run.state='succeeded' LIMIT 1`,
        [context.workspace_id, action.id]
      );
      if (prior.rowCount) return { replayed: true, actionId: actionPublicId, ...prior.rows[0] };
      if (action.status !== "queued") throw problems.conflict("ACTION_NOT_QUEUED", "Only a queued action can start");
      const runId = publicId("RUN");
      const receiptId = publicId("REC");
      const run = await client.query(
        `INSERT INTO rahjo.action_runs
          (workspace_id, public_id, action_id, attempt, state, started_at, finished_at, response_redacted)
         VALUES ($1,$2,$3,1,'succeeded',now(),now(),$4) RETURNING id`,
        [context.workspace_id, runId, action.id, { deterministic: true, modelProviders: "disabled" }]
      );
      await client.query("UPDATE rahjo.actions SET status='succeeded', updated_at=now() WHERE workspace_id=$1 AND id=$2", [context.workspace_id, action.id]);
      await client.query("UPDATE rahjo.cases SET status='executing', version=version+1, updated_at=now() WHERE workspace_id=$1 AND id=$2", [context.workspace_id, action.case_id]);
      const digest = payloadDigest({ actionId: actionPublicId, runId, state: "succeeded", modelProviders: "disabled" });
      const receipt = await client.query(
        `INSERT INTO rahjo.execution_receipts
          (workspace_id, public_id, action_id, run_id, result_status, payload_sha256, evidence)
         VALUES ($1,$2,$3,$4,'succeeded',$5,$6) RETURNING id`,
        [context.workspace_id, receiptId, action.id, run.rows[0].id, digest, { deterministic: true, modelProviders: "disabled" }]
      );
      await audit(client, context, { eventType: "action.succeeded", entityType: "action", entityId: actionPublicId, correlationId, before: { status: "queued" }, after: { status: "succeeded", runId, receiptId } });
      return { replayed: false, actionId: actionPublicId, caseId: action.case_public_id, runId, receiptId, resultStatus: "succeeded", receiptInternalId: receipt.rows[0].id };
    });
  }

  async recordOutcome(context, casePublicId, input, correlationId) {
    requireScope(context, "outcome:write");
    requireRole(context, ["owner", "admin", "operator"]);
    const reason = normalizePersianText(input?.reason, { max: 1200, required: true });
    return this.database.withWorkspace(context, async (client) => {
      const selectedCase = await client.query("SELECT id, status FROM rahjo.cases WHERE workspace_id=$1 AND public_id=$2 FOR UPDATE", [context.workspace_id, casePublicId]);
      if (!selectedCase.rowCount) throw problems.notFound();
      const existing = await client.query("SELECT public_id, result_status FROM rahjo.outcomes WHERE workspace_id=$1 AND case_id=$2", [context.workspace_id, selectedCase.rows[0].id]);
      if (existing.rowCount) return { replayed: true, outcomeId: existing.rows[0].public_id, status: existing.rows[0].result_status };
      const evidence = await client.query(
        `SELECT action.id AS action_id, action.public_id AS action_public_id, receipt.id AS receipt_id
           FROM rahjo.actions action
           JOIN rahjo.action_runs run ON run.workspace_id=action.workspace_id AND run.action_id=action.id AND run.state='succeeded'
           JOIN rahjo.execution_receipts receipt ON receipt.workspace_id=run.workspace_id AND receipt.run_id=run.id AND receipt.result_status='succeeded'
          WHERE action.workspace_id=$1 AND action.case_id=$2 AND action.status='succeeded'
          ORDER BY receipt.issued_at DESC LIMIT 1`,
        [context.workspace_id, selectedCase.rows[0].id]
      );
      if (!evidence.rowCount) throw problems.conflict("SUCCESSFUL_RECEIPT_REQUIRED", "A successful immutable execution receipt is required");
      const outcomeId = publicId("OUT");
      await client.query(
        `INSERT INTO rahjo.outcomes
          (workspace_id, public_id, case_id, action_id, receipt_id, result_status, reason, recorded_by)
         VALUES ($1,$2,$3,$4,$5,'recorded',$6,$7)`,
        [context.workspace_id, outcomeId, selectedCase.rows[0].id, evidence.rows[0].action_id, evidence.rows[0].receipt_id, reason, context.membership_id]
      );
      await client.query("UPDATE rahjo.cases SET status='resolved', resolved_at=now(), version=version+1, updated_at=now() WHERE workspace_id=$1 AND id=$2", [context.workspace_id, selectedCase.rows[0].id]);
      await audit(client, context, { eventType: "outcome.recorded", entityType: "outcome", entityId: outcomeId, correlationId, after: { caseId: casePublicId, actionId: evidence.rows[0].action_public_id, status: "recorded" } });
      return { replayed: false, outcomeId, caseId: casePublicId, status: "recorded" };
    });
  }
}
