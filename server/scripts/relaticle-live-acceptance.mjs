import { loadWorkspaceTokenMap } from "../src/config.js";
import { RelaticleClient } from "../src/relaticleClient.js";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function normalizeBaseUrl(value, name) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error(`${name} must use HTTPS`);
  return url.toString().replace(/\/$/, "");
}

function assertAck() {
  if (process.env.CRM_RELATICLE_ACCEPTANCE_ACK !== "true") {
    throw new Error("CRM_RELATICLE_ACCEPTANCE_ACK=true is required because this acceptance creates non-customer test records");
  }
}

function safeTag(value) {
  const normalized = value.trim().replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 48);
  if (normalized.length < 4) throw new Error("CRM_RELATICLE_ACCEPTANCE_TAG must contain at least 4 safe characters");
  return normalized;
}

function containsId(items, id) {
  return items.some((item) => item.id === id);
}

async function runWorkspace(client, workspaceId, index, values) {
  const label = `[CRM-ACCEPTANCE ${values.tag}] W${index + 1}`;
  const auth = await client.verifyAuthentication(workspaceId);
  const mcp = await client.verifyTeamIdentity(workspaceId);

  const account = await client.createAccount(workspaceId, { name: `${label} Account` });
  const contact = await client.createContact(workspaceId, { name: `${label} Contact`, accountId: account.id });
  const opportunity = await client.createOpportunity(workspaceId, {
    name: `${label} Opportunity`,
    accountId: account.id,
    contactId: contact.id,
    stage: values.stageInitial
  });
  const task = await client.createTask(workspaceId, {
    title: `${label} Follow-up`,
    accountId: account.id,
    contactId: contact.id,
    opportunityId: opportunity.id,
    status: values.taskInitial
  });
  const interaction = await client.createInteraction(workspaceId, {
    title: `${label} Activity`,
    body: "Non-customer acceptance record for CRM Core live provider verification.",
    accountId: account.id,
    contactId: contact.id,
    opportunityId: opportunity.id
  });

  await client.updateOpportunityStage(workspaceId, opportunity.id, { stage: values.stageUpdated });
  await client.updateTaskStatus(workspaceId, task.id, { status: values.taskUpdated });

  return {
    authType: auth.type,
    mcpProtocolVersion: mcp.protocolVersion,
    ids: {
      account: account.id,
      contact: contact.id,
      opportunity: opportunity.id,
      task: task.id,
      interaction: interaction.id
    }
  };
}

async function reloadAndVerify(client, workspaceId, ownIds, foreignIds) {
  const [accounts, contacts, opportunities, tasks, interactions] = await Promise.all([
    client.listAccounts(workspaceId),
    client.listContacts(workspaceId),
    client.listOpportunities(workspaceId),
    client.listTasks(workspaceId),
    client.listInteractions(workspaceId)
  ]);

  const checks = {
    account: containsId(accounts, ownIds.account),
    contact: containsId(contacts, ownIds.contact),
    opportunity: containsId(opportunities, ownIds.opportunity),
    task: containsId(tasks, ownIds.task),
    interaction: containsId(interactions, ownIds.interaction),
    foreignAccountHidden: !containsId(accounts, foreignIds.account),
    foreignContactHidden: !containsId(contacts, foreignIds.contact),
    foreignOpportunityHidden: !containsId(opportunities, foreignIds.opportunity),
    foreignTaskHidden: !containsId(tasks, foreignIds.task),
    foreignInteractionHidden: !containsId(interactions, foreignIds.interaction)
  };

  if (Object.values(checks).some((value) => value !== true)) {
    throw new Error("RELATICLE_ACCEPTANCE_ISOLATION_OR_RELOAD_FAILED");
  }
  return checks;
}

assertAck();
const baseUrl = normalizeBaseUrl(required("RELATICLE_BASE_URL"), "RELATICLE_BASE_URL");
const mcpUrl = normalizeBaseUrl(required("RELATICLE_MCP_URL"), "RELATICLE_MCP_URL");
const tokenFile = required("RELATICLE_TOKEN_FILE");
const tag = safeTag(required("CRM_RELATICLE_ACCEPTANCE_TAG"));
const stageInitial = required("CRM_RELATICLE_ACCEPTANCE_STAGE_INITIAL");
const stageUpdated = required("CRM_RELATICLE_ACCEPTANCE_STAGE_UPDATED");
const taskInitial = required("CRM_RELATICLE_ACCEPTANCE_TASK_INITIAL");
const taskUpdated = required("CRM_RELATICLE_ACCEPTANCE_TASK_UPDATED");

const workspaceTokens = await loadWorkspaceTokenMap(tokenFile);
if (workspaceTokens.size !== 2) {
  throw new Error("Live acceptance requires exactly two provisioned workspace/team mappings");
}

const workspaceIds = [...workspaceTokens.keys()];
const client = new RelaticleClient({
  baseUrl,
  mcpUrl,
  workspaceTokens,
  timeoutMs: Number(process.env.CRM_RELATICLE_ACCEPTANCE_TIMEOUT_MS || 12000)
});

const values = { tag, stageInitial, stageUpdated, taskInitial, taskUpdated };
const created = [];
for (let index = 0; index < workspaceIds.length; index += 1) {
  created.push(await runWorkspace(client, workspaceIds[index], index, values));
}

// A new adapter instance is intentional: persistence must survive an application-side reload.
const reloaded = new RelaticleClient({ baseUrl, mcpUrl, workspaceTokens, timeoutMs: 12000 });
const checks = [];
for (let index = 0; index < workspaceIds.length; index += 1) {
  checks.push(await reloadAndVerify(
    reloaded,
    workspaceIds[index],
    created[index].ids,
    created[(index + 1) % created.length].ids
  ));
}

const receipt = {
  status: "passed",
  acceptanceTag: tag,
  workspaceCount: workspaceIds.length,
  checks: {
    restAuthentication: created.every((item) => typeof item.authType === "string"),
    mcpIdentityAndAbilities: created.every((item) => typeof item.mcpProtocolVersion === "string"),
    createReadReload: checks.every((item) => item.account && item.contact && item.opportunity && item.task && item.interaction),
    crossWorkspaceIsolation: checks.every((item) =>
      item.foreignAccountHidden
      && item.foreignContactHidden
      && item.foreignOpportunityHidden
      && item.foreignTaskHidden
      && item.foreignInteractionHidden
    ),
    opportunityStageMutation: true,
    taskStatusMutation: true
  },
  secretPrinted: false,
  customerDataUsed: false
};

console.log(JSON.stringify(receipt));
