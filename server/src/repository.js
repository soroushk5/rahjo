import { problems } from "./errors.js";
import { normalizeIntake, normalizePersianText, publicId, requiredIdempotencyKey } from "./normalization.js";
import {
  normalizeContactImport,
  normalizeCrmDate,
  normalizeEqualityValue,
  normalizeIdentifier,
  normalizeIranMoney,
  normalizedNameSimilarity,
  rankDedupeCandidates
} from "./normalization.js";
import { payloadDigest } from "./security.js";
import { requireRole, requireScope } from "./database.js";
import { createHash } from "node:crypto";

function record(row) {
  return row ?? null;
}

function scopedIdentifiers(identifiers, workspaceId) {
  return identifiers.map((identifier) => ({
    ...identifier,
    scopeKey: identifier.uniqueScope === "workspace" ? workspaceId : null
  }));
}

function safeCrmSnapshot(entityType, snapshot = {}) {
  const fields = {
    account: ["name", "source", "sync_state"],
    contact: ["name", "email", "phone", "account_id", "identifiers", "source", "sync_state"],
    opportunity: ["name", "account_id", "contact_id", "stage", "amount", "identifiers", "source", "sync_state"],
    task: ["title", "account_id", "contact_id", "opportunity_id", "status", "deadline", "identifiers", "source", "sync_state"],
    interaction: ["title", "body", "account_id", "contact_id", "opportunity_id", "source", "sync_state"]
  }[entityType] ?? [];
  return Object.fromEntries(fields.filter((key) => Object.hasOwn(snapshot, key)).map((key) => [key, snapshot[key]]));
}

async function audit(client, context, { eventType, entityType, entityId, correlationId, before = null, after = null, source = "crm-bff" }) {
  await client.query(
    `INSERT INTO rahjo.audit_events
       (workspace_id, event_type, entity_type, entity_id, actor_membership_id, source, correlation_id, before_state, after_state)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [context.workspace_id, eventType, entityType, entityId, context.membership_id, source, correlationId, before, after]
  );
}

async function persistCrmEntity(client, context, {
  entityType,
  corePrefix,
  entity,
  eventType,
  correlationId,
  source,
  contractValues = null,
  identifiers = [],
  rawValues = null
}) {
  const coreId = publicId(corePrefix);
  const persisted = await client.query(
    `INSERT INTO rahjo.crm_entity_refs
       (workspace_id, entity_type, rahjo_id, relaticle_id, snapshot)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (workspace_id, entity_type, relaticle_id)
     DO UPDATE SET
       snapshot = rahjo.crm_entity_refs.snapshot || EXCLUDED.snapshot,
       synced_at = now(),
       updated_at = now()
     RETURNING id, rahjo_id`,
    [context.workspace_id, entityType, coreId, entity.id, entity.attributes]
  );
  const stableCoreId = persisted.rows[0]?.rahjo_id ?? coreId;
  const entityRefId = persisted.rows[0]?.id;
  const storedIdentifiers = entityType === "contact" && entityRefId
    ? [...identifiers, normalizeIdentifier("rahjo_contact_id", stableCoreId).canonical]
    : identifiers;
  if (entityRefId && contractValues) {
    await client.query(
      `INSERT INTO rahjo.crm_entity_contract_values
         (workspace_id, entity_ref_id, deadline_kind, deadline_date, deadline_at,
          deadline_timezone, deadline_calendar, money_currency, money_amount_irr, money_input_unit)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (workspace_id, entity_ref_id) DO UPDATE SET
         deadline_kind=EXCLUDED.deadline_kind,
         deadline_date=EXCLUDED.deadline_date,
         deadline_at=EXCLUDED.deadline_at,
         deadline_timezone=EXCLUDED.deadline_timezone,
         deadline_calendar=EXCLUDED.deadline_calendar,
         money_currency=EXCLUDED.money_currency,
         money_amount_irr=EXCLUDED.money_amount_irr,
         money_input_unit=EXCLUDED.money_input_unit,
         updated_at=now()`,
      [context.workspace_id, entityRefId, contractValues.deadlineKind ?? null,
        contractValues.deadlineDate ?? null, contractValues.deadlineAt ?? null,
        contractValues.deadlineTimezone ?? null, contractValues.deadlineCalendar ?? null,
        contractValues.moneyCurrency ?? null, contractValues.moneyAmountIrr ?? null,
        contractValues.moneyInputUnit ?? null]
    );
  }
  for (const identifier of entityRefId ? storedIdentifiers : []) {
    await client.query(
      `INSERT INTO rahjo.crm_entity_identifiers
         (workspace_id, entity_ref_id, identifier_type, normalized_value, unique_scope)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
      [context.workspace_id, entityRefId, identifier.type, identifier.normalizedValue, identifier.uniqueScope]
    );
  }
  if (entityType === "contact" && entityRefId) {
    await client.query(
      `UPDATE rahjo.crm_entity_refs
          SET snapshot = snapshot || jsonb_build_object('identifiers', $3::jsonb), updated_at=now()
        WHERE workspace_id=$1 AND id=$2`,
      [context.workspace_id, entityRefId, JSON.stringify(storedIdentifiers)]
    );
  }
  if (entityRefId && rawValues && Object.keys(rawValues).length) {
    await client.query(
      `INSERT INTO rahjo.crm_restricted_raw_values
         (workspace_id, entity_ref_id, captured_by, raw_values)
       VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
      [context.workspace_id, entityRefId, context.membership_id, rawValues]
    );
  }
  await audit(client, context, {
    eventType,
    entityType,
    entityId: stableCoreId,
    correlationId,
    after: { id: entity.id, coreId: stableCoreId, ...entity.attributes },
    source
  });
  return stableCoreId;
}

export class CrmRepository {
  constructor({ database, relaticle }) {
    this.database = database;
    this.relaticle = relaticle;
  }

  async runtime(context) {
    requireScope(context, "read");
    const extension = await this.database.withWorkspace(context, async (client) => {
      const queries = await Promise.all([
        client.query("SELECT id AS ref_id, entity_type, rahjo_id AS core_id, relaticle_id AS id, snapshot, created_at, updated_at FROM rahjo.crm_entity_refs WHERE workspace_id=$1 AND entity_type IN ('account','contact','opportunity','task','interaction') ORDER BY updated_at DESC, id DESC LIMIT 800", [context.workspace_id]),
        client.query(`SELECT entity_ref_id, identifier_type, normalized_value, unique_scope
                        FROM rahjo.crm_entity_identifiers
                       WHERE workspace_id=$1 AND entity_ref_id IN (
                         SELECT id FROM rahjo.crm_entity_refs
                          WHERE workspace_id=$1 AND entity_type IN ('contact','opportunity','task')
                          ORDER BY updated_at DESC, id DESC LIMIT 800
                       )`, [context.workspace_id]),
        client.query(`SELECT entity_ref_id, deadline_kind, deadline_date::text AS deadline_date,
                             deadline_at, deadline_timezone, deadline_calendar,
                             money_currency, money_amount_irr::text AS money_amount_irr
                        FROM rahjo.crm_entity_contract_values
                       WHERE workspace_id=$1 AND entity_ref_id IN (
                         SELECT id FROM rahjo.crm_entity_refs
                          WHERE workspace_id=$1 AND entity_type IN ('opportunity','task')
                          ORDER BY updated_at DESC, id DESC LIMIT 800
                       )`, [context.workspace_id]),
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
      const [crmRefs, crmIdentifiers, crmContractValues, services, serviceCapabilities, leads, cases, approvals, actions, runs, receipts, outcomes, auditEvents] = queries.map((item) => item.rows);
      return { crmRefs, crmIdentifiers, crmContractValues, services, serviceCapabilities, leads, cases, approvals, actions, runs, receipts, outcomes, auditEvents };
    });

    const deferred = this.relaticle.mode === "native_deferred";
    const [companies, people, opportunities, tasks, interactions] = deferred
      ? [
          extension.crmRefs.filter((item) => item.entity_type === "account").map((item) => ({ id: item.id, coreId: item.core_id, type: "companies", attributes: item.snapshot })),
          extension.crmRefs.filter((item) => item.entity_type === "contact").map((item) => ({ id: item.id, coreId: item.core_id, type: "people", attributes: item.snapshot })),
          extension.crmRefs.filter((item) => item.entity_type === "opportunity").map((item) => ({ id: item.id, coreId: item.core_id, type: "opportunities", attributes: item.snapshot })),
          extension.crmRefs.filter((item) => item.entity_type === "task").map((item) => ({ id: item.id, coreId: item.core_id, type: "tasks", attributes: item.snapshot })),
          extension.crmRefs.filter((item) => item.entity_type === "interaction").map((item) => ({ id: item.id, coreId: item.core_id, type: "notes", attributes: item.snapshot }))
        ]
      : await Promise.all([
          this.relaticle.listAccounts(context.workspace_id),
          this.relaticle.listContacts(context.workspace_id),
          this.relaticle.listOpportunities(context.workspace_id),
          this.relaticle.listTasks(context.workspace_id),
          this.relaticle.listInteractions(context.workspace_id)
        ]);
    const identifiersByRef = new Map();
    for (const identity of extension.crmIdentifiers) {
      const values = identifiersByRef.get(identity.entity_ref_id) ?? [];
      values.push({ type: identity.identifier_type, normalizedValue: identity.normalized_value, uniqueScope: identity.unique_scope });
      identifiersByRef.set(identity.entity_ref_id, values);
    }
    const contractValuesByRef = new Map(extension.crmContractValues.map((item) => [item.entity_ref_id, item]));
    const canonicalRefs = extension.crmRefs.map((item) => {
      const snapshot = { ...item.snapshot };
      const identifiers = identifiersByRef.get(item.ref_id) ?? [];
      if (item.entity_type === "contact" && identifiers.length) {
        snapshot.identifiers = identifiers;
        const email = identifiers.find((identity) => identity.type === "email")?.normalizedValue;
        const phone = identifiers.find((identity) => identity.type === "phone")?.normalizedValue;
        if (email) snapshot.email = email;
        if (phone) snapshot.phone = phone;
      }
      const contract = contractValuesByRef.get(item.ref_id);
      if (contract?.deadline_kind === "date-only") {
        snapshot.deadline = { kind: "date-only", value: contract.deadline_date, displayCalendar: contract.deadline_calendar };
      } else if (contract?.deadline_kind === "instant") {
        snapshot.deadline = { kind: "instant", value: new Date(contract.deadline_at).toISOString(), timeZone: contract.deadline_timezone };
      }
      if (contract?.money_currency) snapshot.amount = { currency: contract.money_currency, value: contract.money_amount_irr };
      return { ...item, snapshot };
    });
    const references = new Map(canonicalRefs.map((item) => [`${item.entity_type}\u0000${item.id}`, item]));
    const mergeCanonicalSnapshot = (entityType, items) => items.map((item) => {
      const reference = references.get(`${entityType}\u0000${item.id}`);
      if (!reference) return item;
      return {
        ...item,
        coreId: reference.core_id,
        attributes: { ...item.attributes, ...safeCrmSnapshot(entityType, reference.snapshot) }
      };
    });
    const projectedCompanies = mergeCanonicalSnapshot("account", companies);
    const projectedPeople = mergeCanonicalSnapshot("contact", people);
    const projectedOpportunities = mergeCanonicalSnapshot("opportunity", opportunities);
    const projectedTasks = mergeCanonicalSnapshot("task", tasks);
    const projectedInteractions = mergeCanonicalSnapshot("interaction", interactions);
    delete extension.crmRefs;
    delete extension.crmIdentifiers;
    delete extension.crmContractValues;

    return {
      version: 1,
      dataMode: "server",
      workspace: { id: context.workspace_id, slug: context.workspace_slug, name: context.workspace_name },
      user: { id: context.user_id, email: context.user_email, name: context.display_name, role: context.role },
      projection: {
        accounts: projectedCompanies.map((item) => ({ id: item.id, ...(item.coreId ? { coreId: item.coreId } : {}), ...item.attributes, source: deferred ? "crm-native-bridge" : "relaticle", syncState: deferred ? "pending_relaticle" : "verified" })),
        contacts: projectedPeople.map((item) => ({ id: item.id, ...(item.coreId ? { coreId: item.coreId } : {}), ...item.attributes, source: deferred ? "crm-native-bridge" : "relaticle", syncState: deferred ? "pending_relaticle" : "verified" })),
        opportunities: projectedOpportunities.map((item) => ({ id: item.id, ...(item.coreId ? { coreId: item.coreId } : {}), ...item.attributes, source: deferred ? "crm-native-bridge" : "relaticle", syncState: deferred ? "pending_relaticle" : "verified" })),
        tasks: projectedTasks.map((item) => ({ id: item.id, ...(item.coreId ? { coreId: item.coreId } : {}), ...item.attributes, source: deferred ? "crm-native-bridge" : "relaticle", syncState: deferred ? "pending_relaticle" : "verified" })),
        interactions: projectedInteractions.map((item) => ({ id: item.id, ...(item.coreId ? { coreId: item.coreId } : {}), ...item.attributes, source: deferred ? "crm-native-bridge" : "relaticle", syncState: deferred ? "pending_relaticle" : "verified" })),
        ...extension
      }
    };
  }

  async createAccount(context, input, correlationId) {
    requireScope(context, "crm:write");
    requireRole(context, ["owner", "admin", "operator"]);
    const name = normalizePersianText(input?.name, { max: 180, required: true });
    const account = await this.relaticle.createAccount(context.workspace_id, { name });

    const source = this.relaticle.mode === "native_deferred" ? "crm-native-bridge" : "relaticle";
    const coreId = await this.database.withWorkspace(context, (client) => persistCrmEntity(client, context, {
      entityType: "account",
      corePrefix: "ACC",
      entity: account,
      eventType: "crm.account.created",
      correlationId,
      source
    }));

    return { id: account.id, coreId, ...account.attributes, source };
  }

  async createContact(context, input, correlationId) {
    requireScope(context, "crm:write");
    requireRole(context, ["owner", "admin", "operator"]);
    const normalized = normalizeContactImport(input);
    const { name, email, phone, identifiers } = normalized.canonical;
    const accountId = normalizePersianText(input?.accountId, { max: 180, required: true });
    if (identifiers.some((item) => item.type === "relaticle_contact_id" || item.type === "rahjo_contact_id")) {
      throw problems.validation("System-managed contact identifiers can only enter through the import review path");
    }
    const contact = await this.relaticle.createContact(context.workspace_id, { name, accountId });
    const canonicalIdentifiers = [...identifiers, normalizeIdentifier("relaticle_contact_id", contact.id).canonical];
    const canonicalAttributes = {
      ...contact.attributes,
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      identifiers: canonicalIdentifiers
    };
    const canonicalContact = { ...contact, attributes: canonicalAttributes };

    const source = this.relaticle.mode === "native_deferred" ? "crm-native-bridge" : "relaticle";
    const coreId = await this.database.withWorkspace(context, (client) => persistCrmEntity(client, context, {
      entityType: "contact",
      corePrefix: "CON",
      entity: canonicalContact,
      eventType: "crm.contact.created",
      correlationId,
      source,
      identifiers: scopedIdentifiers(canonicalIdentifiers, context.workspace_id),
      rawValues: normalized.raw
    }));

    const responseIdentifiers = [...canonicalIdentifiers, normalizeIdentifier("rahjo_contact_id", coreId).canonical];
    return { id: contact.id, coreId, ...canonicalAttributes, identifiers: responseIdentifiers, source };
  }

  async createOpportunity(context, input, correlationId) {
    requireScope(context, "crm:write");
    requireRole(context, ["owner", "admin", "operator"]);
    const name = normalizePersianText(input?.name, { max: 255, required: true });
    const accountId = normalizePersianText(input?.accountId, { max: 180 });
    const contactId = normalizePersianText(input?.contactId, { max: 180 });
    const stage = normalizePersianText(input?.stage, { max: 120 });
    const money = input?.amount === undefined ? null : normalizeIranMoney(input.amount?.value, input.amount?.unit);
    const opportunity = await this.relaticle.createOpportunity(context.workspace_id, { name, accountId, contactId, stage });
    const canonicalAttributes = {
      ...opportunity.attributes,
      ...(money ? { amount: { currency: money.currency, value: money.amount } } : {})
    };
    const canonicalOpportunity = { ...opportunity, attributes: canonicalAttributes };
    const source = this.relaticle.mode === "native_deferred" ? "crm-native-bridge" : "relaticle";
    const coreId = await this.database.withWorkspace(context, (client) => persistCrmEntity(client, context, {
      entityType: "opportunity",
      corePrefix: "OPP",
      entity: canonicalOpportunity,
      eventType: "crm.opportunity.created",
      correlationId,
      source,
      ...(money ? {
        contractValues: { moneyCurrency: money.currency, moneyAmountIrr: money.amount, moneyInputUnit: money.inputUnit },
        rawValues: { amount: input.amount.value, unit: input.amount.unit }
      } : {})
    }));
    return { id: opportunity.id, coreId, ...canonicalAttributes, source };
  }

  async updateOpportunityStage(context, opportunityId, input, correlationId) {
    requireScope(context, "crm:write");
    requireRole(context, ["owner", "admin", "operator"]);
    const id = normalizePersianText(opportunityId, { max: 180, required: true });
    const stage = normalizePersianText(input?.stage, { max: 120, required: true });
    const opportunity = await this.relaticle.updateOpportunityStage(context.workspace_id, id, { stage });
    const source = this.relaticle.mode === "native_deferred" ? "crm-native-bridge" : "relaticle";
    const coreId = await this.database.withWorkspace(context, (client) => persistCrmEntity(client, context, {
      entityType: "opportunity",
      corePrefix: "OPP",
      entity: opportunity,
      eventType: "crm.opportunity.stage_changed",
      correlationId,
      source
    }));
    return { id: opportunity.id, coreId, ...opportunity.attributes, source };
  }

  async createTask(context, input, correlationId) {
    requireScope(context, "crm:write");
    requireRole(context, ["owner", "admin", "operator"]);
    const title = normalizePersianText(input?.title, { max: 255, required: true });
    const accountId = normalizePersianText(input?.accountId, { max: 180 });
    const contactId = normalizePersianText(input?.contactId, { max: 180 });
    const opportunityId = normalizePersianText(input?.opportunityId, { max: 180 });
    const status = normalizePersianText(input?.status, { max: 120 });
    const deadline = input?.deadline === undefined ? null : normalizeCrmDate(input.deadline);
    const task = await this.relaticle.createTask(context.workspace_id, { title, accountId, contactId, opportunityId, status });
    const canonicalAttributes = { ...task.attributes, ...(deadline ? { deadline } : {}) };
    const canonicalTask = { ...task, attributes: canonicalAttributes };
    const source = this.relaticle.mode === "native_deferred" ? "crm-native-bridge" : "relaticle";
    const coreId = await this.database.withWorkspace(context, (client) => persistCrmEntity(client, context, {
      entityType: "task",
      corePrefix: "TSK",
      entity: canonicalTask,
      eventType: "crm.task.created",
      correlationId,
      source,
      ...(deadline ? {
        contractValues: {
          deadlineKind: deadline.kind,
          deadlineDate: deadline.kind === "date-only" ? deadline.value : null,
          deadlineAt: deadline.kind === "instant" ? deadline.value : null,
          deadlineTimezone: deadline.kind === "instant" ? deadline.timeZone : null,
          deadlineCalendar: deadline.kind === "date-only" ? deadline.displayCalendar : null
        },
        rawValues: { deadline: input.deadline }
      } : {})
    }));
    return { id: task.id, coreId, ...canonicalAttributes, source };
  }

  async updateTaskStatus(context, taskId, input, correlationId) {
    requireScope(context, "crm:write");
    requireRole(context, ["owner", "admin", "operator"]);
    const id = normalizePersianText(taskId, { max: 180, required: true });
    const status = normalizePersianText(input?.status, { max: 120, required: true });
    const task = await this.relaticle.updateTaskStatus(context.workspace_id, id, { status });
    const source = this.relaticle.mode === "native_deferred" ? "crm-native-bridge" : "relaticle";
    const coreId = await this.database.withWorkspace(context, (client) => persistCrmEntity(client, context, {
      entityType: "task",
      corePrefix: "TSK",
      entity: task,
      eventType: "crm.task.status_changed",
      correlationId,
      source
    }));
    return { id: task.id, coreId, ...task.attributes, source };
  }

  async appendInteraction(context, input, correlationId) {
    requireScope(context, "crm:write");
    requireRole(context, ["owner", "admin", "operator"]);
    const title = normalizePersianText(input?.title, { max: 255, required: true });
    const body = normalizePersianText(input?.body, { max: 8000 });
    const accountId = normalizePersianText(input?.accountId, { max: 180 });
    const contactId = normalizePersianText(input?.contactId, { max: 180 });
    const opportunityId = normalizePersianText(input?.opportunityId, { max: 180 });
    if (!accountId && !contactId && !opportunityId) {
      throw problems.validation("Interaction must be linked to an account, contact, or opportunity");
    }
    const interaction = await this.relaticle.createInteraction(context.workspace_id, { title, body, accountId, contactId, opportunityId });
    const source = this.relaticle.mode === "native_deferred" ? "crm-native-bridge" : "relaticle";
    const coreId = await this.database.withWorkspace(context, (client) => persistCrmEntity(client, context, {
      entityType: "interaction",
      corePrefix: "INT",
      entity: interaction,
      eventType: "crm.interaction.created",
      correlationId,
      source
    }));
    return { id: interaction.id, coreId, ...interaction.attributes, source };
  }

  async searchCrm(context, { field, value, calendar, timeZone, unit, identifierType }) {
    requireScope(context, "read");
    let rows;
    if (field === "name") {
      const normalized = normalizeEqualityValue("text", value);
      rows = await this.database.withWorkspace(context, (client) => client.query(
        `SELECT entity_type, rahjo_id AS core_id, relaticle_id AS id, snapshot
           FROM rahjo.crm_entity_refs
          WHERE workspace_id=$1 AND (snapshot->>'name'=$2 OR snapshot->>'title'=$2)
          ORDER BY updated_at DESC, id LIMIT 100`,
        [context.workspace_id, normalized]
      ));
    } else if (field === "email" || field === "phone" || field === "identifier") {
      let identifier;
      if (field === "identifier") identifier = normalizeIdentifier(identifierType, value).canonical;
      else identifier = { type: field, normalizedValue: normalizeEqualityValue(field, value) };
      rows = await this.database.withWorkspace(context, (client) => client.query(
        `SELECT DISTINCT ref.entity_type, ref.rahjo_id AS core_id, ref.relaticle_id AS id, ref.snapshot
           FROM rahjo.crm_entity_identifiers identity
           JOIN rahjo.crm_entity_refs ref
             ON ref.workspace_id=identity.workspace_id AND ref.id=identity.entity_ref_id
          WHERE identity.workspace_id=$1 AND identity.identifier_type=$2 AND identity.normalized_value=$3
          ORDER BY entity_type, id LIMIT 100`,
        [context.workspace_id, identifier.type, identifier.normalizedValue]
      ));
    } else if (field === "date-only" || field === "instant") {
      const date = normalizeCrmDate(field === "date-only"
        ? { kind: "date-only", value, calendar }
        : { kind: "instant", value, timeZone });
      rows = await this.database.withWorkspace(context, (client) => client.query(
        `SELECT ref.entity_type, ref.rahjo_id AS core_id, ref.relaticle_id AS id, ref.snapshot
           FROM rahjo.crm_entity_contract_values contract
           JOIN rahjo.crm_entity_refs ref
             ON ref.workspace_id=contract.workspace_id AND ref.id=contract.entity_ref_id
          WHERE contract.workspace_id=$1 AND ${field === "date-only" ? "contract.deadline_date=$2::date" : "contract.deadline_at=$2::timestamptz"}
          ORDER BY ref.entity_type, ref.id LIMIT 100`,
        [context.workspace_id, date.value]
      ));
    } else if (field === "money") {
      const money = normalizeIranMoney(value, unit);
      rows = await this.database.withWorkspace(context, (client) => client.query(
        `SELECT ref.entity_type, ref.rahjo_id AS core_id, ref.relaticle_id AS id, ref.snapshot
           FROM rahjo.crm_entity_contract_values contract
           JOIN rahjo.crm_entity_refs ref
             ON ref.workspace_id=contract.workspace_id AND ref.id=contract.entity_ref_id
          WHERE contract.workspace_id=$1 AND contract.money_currency=$2 AND contract.money_amount_irr=$3::numeric
          ORDER BY ref.entity_type, ref.id LIMIT 100`,
        [context.workspace_id, money.currency, money.amount]
      ));
    } else {
      throw problems.validation("Search field is not supported");
    }
    return rows.rows.map((row) => ({
      entityType: row.entity_type,
      id: row.id,
      coreId: row.core_id,
      attributes: safeCrmSnapshot(row.entity_type, row.snapshot)
    }));
  }

  async stageContactImport(context, input) {
    requireScope(context, "crm:write");
    requireRole(context, ["owner", "admin", "operator"]);
    const sourceName = normalizePersianText(input?.sourceName, { max: 180, required: true });
    if (!Array.isArray(input?.rows) || input.rows.length < 1 || input.rows.length > 250) {
      throw problems.validation("Contact import must contain between 1 and 250 rows");
    }
    const rows = input.rows.map((row) => normalizeContactImport(row));
    const sourceHash = createHash("sha256").update(JSON.stringify(input.rows)).digest("hex");
    return this.database.withWorkspace(context, async (client) => {
      const batchPublicId = publicId("IMP");
      const batch = await client.query(
        `INSERT INTO rahjo.import_batches(workspace_id, public_id, source_name, source_sha256, status, created_by)
         VALUES ($1,$2,$3,$4,'reviewing',$5) RETURNING id`,
        [context.workspace_id, batchPublicId, sourceName, sourceHash, context.membership_id]
      );
      const importBatchId = batch.rows[0]?.id;
      const existingRefs = await client.query(
        `SELECT id, workspace_id, entity_type, rahjo_id, relaticle_id, snapshot
           FROM rahjo.crm_entity_refs
          WHERE workspace_id=$1 AND entity_type='contact'
          ORDER BY updated_at DESC, id LIMIT 2001`,
        [context.workspace_id]
      );
      const fuzzyCandidatesTruncated = existingRefs.rows.length > 2000;
      const fuzzyRefs = existingRefs.rows.slice(0, 2000);
      const fuzzyRefIds = new Set(fuzzyRefs.map((ref) => ref.id));
      if (fuzzyCandidatesTruncated) {
        await client.query(
          "UPDATE rahjo.import_batches SET fuzzy_candidates_truncated=true WHERE workspace_id=$1 AND id=$2",
          [context.workspace_id, importBatchId]
        );
      }
      const soughtIdentifiers = [...new Map(rows.flatMap(({ canonical }) => canonical.identifiers)
        .map(({ type, normalizedValue }) => [`${type}\u0000${normalizedValue}`, { type, normalizedValue }])).values()];
      const exactRefs = soughtIdentifiers.length
        ? await client.query(
            `SELECT DISTINCT ref.id, ref.workspace_id, ref.entity_type, ref.rahjo_id, ref.relaticle_id, ref.snapshot
               FROM rahjo.crm_entity_identifiers identity
               JOIN rahjo.crm_entity_refs ref
                 ON ref.workspace_id=identity.workspace_id AND ref.id=identity.entity_ref_id
               JOIN unnest($2::text[], $3::text[]) AS sought(identifier_type, normalized_value)
                 ON sought.identifier_type=identity.identifier_type AND sought.normalized_value=identity.normalized_value
              WHERE identity.workspace_id=$1 AND ref.entity_type='contact'`,
            [context.workspace_id, soughtIdentifiers.map(({ type }) => type), soughtIdentifiers.map(({ normalizedValue }) => normalizedValue)]
          )
        : { rows: [] };
      const refsById = new Map([...fuzzyRefs, ...exactRefs.rows].map((ref) => [ref.id, ref]));
      const candidateRefs = [...refsById.values()];
      const existingIds = await client.query(
        `SELECT entity_ref_id, identifier_type, normalized_value, unique_scope
           FROM rahjo.crm_entity_identifiers
          WHERE workspace_id=$1 AND entity_ref_id=ANY($2::uuid[])`,
        [context.workspace_id, candidateRefs.map((ref) => ref.id)]
      );
      const idsByRef = new Map();
      for (const identity of existingIds.rows) {
        const list = idsByRef.get(identity.entity_ref_id) ?? [];
        list.push({
          type: identity.identifier_type,
          normalizedValue: identity.normalized_value,
          uniqueScope: identity.unique_scope,
          scopeKey: identity.unique_scope === "workspace" ? context.workspace_id : null
        });
        idsByRef.set(identity.entity_ref_id, list);
      }
      const candidates = candidateRefs.map((ref) => {
        const identifiers = idsByRef.get(ref.id) ?? [];
        return {
          id: ref.id,
          candidateKind: "crm",
          allowFuzzy: fuzzyRefIds.has(ref.id),
          workspaceId: ref.workspace_id,
          name: ref.snapshot?.name ?? "",
          email: identifiers.find((item) => item.type === "email")?.normalizedValue ?? "",
          phone: identifiers.find((item) => item.type === "phone")?.normalizedValue ?? "",
          identifiers
        };
      });
      const staged = [];
      for (let index = 0; index < rows.length; index += 1) {
        const { canonical, raw } = rows[index];
        const rowResult = await client.query(
          `INSERT INTO rahjo.import_rows(workspace_id, batch_id, row_number, raw_record, normalized_record, decision)
           VALUES ($1,$2,$3,'{}'::jsonb,$4,'pending') RETURNING id`,
          [context.workspace_id, importBatchId, index + 1, canonical]
        );
        const importRowId = rowResult.rows[0]?.id;
        await client.query(
          `INSERT INTO rahjo.crm_restricted_raw_values(workspace_id, import_row_id, captured_by, raw_values)
           VALUES ($1,$2,$3,$4)`,
          [context.workspace_id, importRowId, context.membership_id, raw]
        );
        const incoming = {
          workspaceId: context.workspace_id,
          name: canonical.name,
          email: canonical.email,
          phone: canonical.phone,
          identifiers: scopedIdentifiers(canonical.identifiers, context.workspace_id)
        };
        const fuzzyScores = new Map();
        for (const candidate of candidates) {
          if (candidate.allowFuzzy === false) continue;
          const score = normalizedNameSimilarity(canonical.name, candidate.name || canonical.name);
          if (candidate.name && score >= 0.72) fuzzyScores.set(String(candidate.id), score);
        }
        const ranked = rankDedupeCandidates(incoming, candidates, [...fuzzyScores.keys()]);
        for (const candidate of ranked) {
          const score = candidate.evidence === "fuzzy_review" ? fuzzyScores.get(String(candidate.candidateId)) : 1;
          const target = candidates.find((item) => item.id === candidate.candidateId);
          await client.query(
            `INSERT INTO rahjo.duplicate_candidates
               (workspace_id, import_row_id, source_import_batch_id,
                candidate_ref, candidate_import_row_id, candidate_import_batch_id, score, reasons)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [context.workspace_id, importRowId, importBatchId,
              target?.candidateKind === "import_row" ? null : candidate.candidateId,
              target?.candidateKind === "import_row" ? candidate.candidateId : null,
              target?.candidateKind === "import_row" ? importBatchId : null,
              score.toFixed(4), { evidence: candidate.evidence, autoMerge: false }]
          );
        }
        staged.push({
          rowId: importRowId,
          rowNumber: index + 1,
          decision: "pending",
          candidates: ranked.map((candidate) => {
            const target = candidates.find((item) => item.id === candidate.candidateId);
            return {
            ...(target?.candidateKind === "import_row"
              ? { candidateImportRowId: candidate.candidateId, candidateRowNumber: target.rowNumber }
              : { candidateRef: candidate.candidateId }),
            evidence: candidate.evidence,
            score: candidate.evidence === "fuzzy_review" ? fuzzyScores.get(String(candidate.candidateId)) : 1,
            reviewRequired: true,
            autoMerge: false
            };
          })
        });
        candidates.push({
          id: importRowId,
          candidateKind: "import_row",
          allowFuzzy: true,
          rowNumber: index + 1,
          workspaceId: context.workspace_id,
          name: canonical.name,
          email: canonical.email,
          phone: canonical.phone,
          identifiers: incoming.identifiers
        });
      }
      return { batchId: batchPublicId, status: "reviewing", fuzzyCandidatesTruncated, rows: staged };
    });
  }

  async getContactImport(context, batchPublicId) {
    requireScope(context, "read");
    const result = await this.database.withWorkspace(context, async (client) => {
      const batches = await client.query(
        `SELECT id, public_id, source_name, status, created_at, fuzzy_candidates_truncated
           FROM rahjo.import_batches WHERE workspace_id=$1 AND public_id=$2`,
        [context.workspace_id, normalizePersianText(batchPublicId, { max: 120, required: true })]
      );
      if (!batches.rowCount) return null;
      const rows = await client.query(
        `SELECT id, row_number, normalized_record, decision, decision_reason
           FROM rahjo.import_rows WHERE workspace_id=$1 AND batch_id=$2 ORDER BY row_number`,
        [context.workspace_id, batches.rows[0].id]
      );
      const duplicates = await client.query(
        `SELECT duplicate.import_row_id, duplicate.candidate_ref, duplicate.candidate_import_row_id,
                duplicate.score, duplicate.reasons, duplicate.decision,
                ref.entity_type, ref.rahjo_id AS core_id, ref.relaticle_id AS id, ref.snapshot,
                candidate_row.row_number AS candidate_row_number,
                candidate_row.normalized_record AS candidate_normalized_record
           FROM rahjo.duplicate_candidates duplicate
          LEFT JOIN rahjo.crm_entity_refs ref
             ON ref.workspace_id=duplicate.workspace_id AND ref.id=duplicate.candidate_ref
          LEFT JOIN rahjo.import_rows candidate_row
             ON candidate_row.workspace_id=duplicate.workspace_id
            AND candidate_row.batch_id=duplicate.candidate_import_batch_id
            AND candidate_row.id=duplicate.candidate_import_row_id
          WHERE duplicate.workspace_id=$1 AND duplicate.import_row_id = ANY($2::uuid[])
          ORDER BY duplicate.import_row_id,
            CASE duplicate.reasons->>'evidence'
              WHEN 'authoritative_identifier' THEN 0
              WHEN 'exact_phone' THEN 1
              WHEN 'exact_email' THEN 2
              ELSE 3
            END,
            duplicate.score DESC, duplicate.id`,
        [context.workspace_id, rows.rows.map((row) => row.id)]
      );
      return {
        ...batches.rows[0],
        rows: rows.rows.map((row) => ({
          id: row.id,
          rowNumber: row.row_number,
          canonical: row.normalized_record,
          decision: row.decision,
          decisionReason: row.decision_reason,
          candidates: duplicates.rows.filter((item) => item.import_row_id === row.id).map((item) => ({
            ...(item.candidate_ref ? {
              entityType: item.entity_type,
              coreId: item.core_id,
              id: item.id,
              attributes: safeCrmSnapshot(item.entity_type, item.snapshot)
            } : {
              candidateImportRowId: item.candidate_import_row_id,
              candidateRowNumber: item.candidate_row_number,
              canonical: item.candidate_normalized_record
            }),
            score: Number(item.score),
            evidence: item.reasons.evidence,
            decision: item.decision,
            reviewRequired: true,
            autoMerge: false
          }))
        })),
        fuzzyCandidatesTruncated: batches.rows[0].fuzzy_candidates_truncated
      };
    });
    if (!result) throw problems.notFound();
    return result;
  }

  async createIntake(context, input, rawIdempotencyKey, correlationId, rawInput = input) {
    requireScope(context, "intake:write");
    requireRole(context, ["owner", "admin", "operator", "intake"]);
    const idempotencyKey = requiredIdempotencyKey(rawIdempotencyKey);
    const payload = normalizeIntake(input, { rawInput });
    const { rawValues, ...canonicalPayload } = payload;
    const digest = payloadDigest(canonicalPayload);

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
      const intakeRequest = await client.query(
        `INSERT INTO rahjo.intake_requests
          (workspace_id, idempotency_key, payload_sha256, source_channel, attribution, status, created_by)
         VALUES ($1,$2,$3,$4,$5,'processing',$6) RETURNING id`,
        [context.workspace_id, idempotencyKey, digest, payload.sourceChannel, payload.attribution, context.membership_id]
      );
      await client.query(
        `INSERT INTO rahjo.intake_raw_values (workspace_id, intake_request_id, captured_by, raw_values)
         VALUES ($1,$2,$3,$4)`,
        [context.workspace_id, intakeRequest.rows[0].id, context.membership_id, rawValues]
      );
      return { replay: false };
    });
    if (reservation.replay) return { status: 200, replayed: true, data: reservation.response };

    let company;
    let person;
    try {
      company = await this.relaticle.createAccount(context.workspace_id, { name: payload.organization });
      person = await this.relaticle.createContact(context.workspace_id, { name: payload.contactName, accountId: company.id });
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
      const contactIdentifiers = [
        ...(payload.email ? [normalizeIdentifier("email", payload.email).canonical] : []),
        ...(payload.phone ? [normalizeIdentifier("phone", payload.phone).canonical] : []),
        normalizeIdentifier("relaticle_contact_id", person.id).canonical,
        normalizeIdentifier("rahjo_contact_id", contactId).canonical
      ];
      const canonicalPersonAttributes = {
        ...person.attributes,
        ...(payload.email ? { email: payload.email } : {}),
        ...(payload.phone ? { phone: payload.phone } : {}),
        identifiers: contactIdentifiers
      };

      const refs = await client.query(
        `INSERT INTO rahjo.crm_entity_refs (workspace_id, entity_type, rahjo_id, relaticle_id, snapshot)
         VALUES ($1,'account',$2,$3,$4),($1,'contact',$5,$6,$7) RETURNING id, entity_type`,
        [context.workspace_id, accountId, company.id, company.attributes, contactId, person.id, canonicalPersonAttributes]
      );
      const contactRef = refs.rows.find((ref) => ref.entity_type === "contact");
      for (const identifier of contactIdentifiers) {
        await client.query(
          `INSERT INTO rahjo.crm_entity_identifiers
             (workspace_id, entity_ref_id, identifier_type, normalized_value, unique_scope)
           VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
          [context.workspace_id, contactRef.id, identifier.type, identifier.normalizedValue, identifier.uniqueScope]
        );
      }
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
