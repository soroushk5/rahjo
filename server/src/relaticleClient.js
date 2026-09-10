import { problems } from "./errors.js";

const allowedCollections = new Set(["companies", "people", "opportunities", "tasks", "notes"]);

function entityData(payload) {
  if (!payload || typeof payload !== "object" || !payload.data) {
    throw problems.unavailable("RELATICLE_CONTRACT_ERROR", "Relaticle returned an unexpected response shape");
  }
  return payload.data;
}

function cleanEntity(item) {
  if (!item || typeof item.id !== "string" || typeof item.type !== "string" || !item.attributes || typeof item.attributes !== "object") {
    throw problems.unavailable("RELATICLE_CONTRACT_ERROR", "Relaticle returned an invalid entity");
  }
  return { id: item.id, type: item.type, attributes: item.attributes, relationships: item.relationships ?? null };
}

function jsonRpcFrames(text, contentType) {
  const candidates = contentType.includes("text/event-stream")
    ? text.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim())
    : [text.trim()];
  const frames = [];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      frames.push(JSON.parse(candidate));
    } catch {
      throw problems.unavailable("RELATICLE_MCP_CONTRACT_ERROR", "Relaticle MCP returned malformed JSON-RPC data");
    }
  }
  return frames;
}

export class RelaticleClient {
  constructor({ baseUrl, mcpUrl = "", workspaceTokens, timeoutMs = 8000, fetchImpl = fetch }) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.mcpUrl = mcpUrl.replace(/\/$/, "");
    this.workspaceTokens = workspaceTokens;
    this.timeoutMs = timeoutMs;
    this.fetchImpl = fetchImpl;
  }

  credentials(workspaceId) {
    const credentials = this.workspaceTokens.get(workspaceId);
    if (!credentials) throw problems.unavailable("RELATICLE_WORKSPACE_NOT_PROVISIONED", "This workspace has no server-side Relaticle credential mapping");
    return credentials;
  }

  async request(workspaceId, method, path, body) {
    const { token } = this.credentials(workspaceId);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          ...(body === undefined ? {} : { "Content-Type": "application/json" })
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
    } catch {
      throw problems.unavailable("RELATICLE_UNAVAILABLE", "Relaticle did not respond before the adapter timeout");
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 401 || response.status === 403) {
      throw problems.unavailable("RELATICLE_CREDENTIAL_REJECTED", "The server-side Relaticle workspace credential was rejected");
    }
    if (response.status === 404) throw problems.notFound();
    if (response.status === 422) throw problems.validation("Relaticle rejected the mapped CRM record");
    if (response.status === 429) throw problems.unavailable("RELATICLE_RATE_LIMITED", "Relaticle rate limited the adapter request");
    if (!response.ok) throw problems.unavailable("RELATICLE_UPSTREAM_ERROR", `Relaticle returned HTTP ${response.status}`);
    if (response.status === 204) return null;
    try {
      return await response.json();
    } catch {
      throw problems.unavailable("RELATICLE_CONTRACT_ERROR", "Relaticle returned non-JSON data");
    }
  }

  async verifyAuthentication(workspaceId) {
    const payload = await this.request(workspaceId, "GET", "/user");
    return cleanEntity(entityData(payload));
  }

  async mcpRequest(workspaceId, payload, { sessionId = "", protocolVersion = "", expectResponse = true } = {}) {
    if (!this.mcpUrl) throw problems.unavailable("RELATICLE_MCP_NOT_CONFIGURED", "Relaticle MCP identity verification is not configured");
    const { token } = this.credentials(workspaceId);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response;
    try {
      response = await this.fetchImpl(this.mcpUrl, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Accept: "application/json, text/event-stream",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...(sessionId ? { "MCP-Session-Id": sessionId } : {}),
          ...(protocolVersion ? { "MCP-Protocol-Version": protocolVersion } : {})
        },
        body: JSON.stringify(payload)
      });
    } catch {
      throw problems.unavailable("RELATICLE_MCP_UNAVAILABLE", "Relaticle MCP identity verification did not respond");
    } finally {
      clearTimeout(timer);
    }
    if (response.status === 401 || response.status === 403) {
      throw problems.unavailable("RELATICLE_CREDENTIAL_REJECTED", "The server-side Relaticle workspace credential was rejected by MCP");
    }
    if (!response.ok) throw problems.unavailable("RELATICLE_MCP_UPSTREAM_ERROR", `Relaticle MCP returned HTTP ${response.status}`);
    const session = response.headers.get("mcp-session-id") ?? sessionId;
    const text = await response.text();
    if (!expectResponse) return { sessionId: session, result: null };
    const frame = jsonRpcFrames(text, response.headers.get("content-type") ?? "")
      .find((candidate) => candidate?.jsonrpc === "2.0" && candidate.id === payload.id);
    if (!frame || frame.error || !frame.result || typeof frame.result !== "object") {
      throw problems.unavailable("RELATICLE_MCP_CONTRACT_ERROR", "Relaticle MCP identity response is invalid");
    }
    return { sessionId: session, result: frame.result };
  }

  async verifyTeamIdentity(workspaceId) {
    const credentials = this.credentials(workspaceId);
    let sessionId = "";
    let protocolVersion = "";
    try {
      const initialized = await this.mcpRequest(workspaceId, {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "rahjo-crm-bff", version: "0.1.0" }
        }
      });
      sessionId = initialized.sessionId;
      protocolVersion = initialized.result.protocolVersion;
      if (!sessionId || !new Set(["2025-11-25", "2025-06-18"]).has(protocolVersion)) {
        throw problems.unavailable("RELATICLE_MCP_CONTRACT_ERROR", "Relaticle MCP did not negotiate a supported session");
      }
      await this.mcpRequest(workspaceId, {
        jsonrpc: "2.0",
        method: "notifications/initialized",
        params: {}
      }, { sessionId, protocolVersion, expectResponse: false });
      const called = await this.mcpRequest(workspaceId, {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "who-ami-tool", arguments: {} }
      }, { sessionId, protocolVersion });
      const identity = called.result.structuredContent ?? called.result.structured_content;
      const teamId = identity?.team?.id;
      const abilities = identity?.token_abilities;
      if (typeof teamId !== "string" || !Array.isArray(abilities) || abilities.some((ability) => typeof ability !== "string")) {
        throw problems.unavailable("RELATICLE_MCP_CONTRACT_ERROR", "Relaticle MCP did not return a valid team identity");
      }
      if (teamId !== credentials.expectedTeamId) {
        throw problems.unavailable("RELATICLE_TEAM_MISMATCH", "The mapped Relaticle credential belongs to a different team");
      }
      const missingAbility = credentials.requiredAbilities.find((ability) => !abilities.includes("*") && !abilities.includes(ability));
      if (missingAbility) {
        throw problems.unavailable("RELATICLE_TOKEN_ABILITY_MISMATCH", "The mapped Relaticle credential lacks a required ability");
      }
      return Object.freeze({ teamId, abilities: Object.freeze([...abilities]), protocolVersion });
    } finally {
      if (sessionId) {
        const { token } = credentials;
        try {
          await this.fetchImpl(this.mcpUrl, {
            method: "DELETE",
            headers: {
              Accept: "application/json, text/event-stream",
              Authorization: `Bearer ${token}`,
              "MCP-Session-Id": sessionId,
              "MCP-Protocol-Version": protocolVersion || "2025-11-25"
            }
          });
        } catch {
          // Verification already completed or failed; session cleanup is best-effort.
        }
      }
    }
  }

  async list(workspaceId, collection, query = "") {
    if (!allowedCollections.has(collection)) throw new TypeError("Unsupported Relaticle collection");
    const payload = await this.request(workspaceId, "GET", `/${collection}${query}`);
    const data = entityData(payload);
    if (!Array.isArray(data)) throw problems.unavailable("RELATICLE_CONTRACT_ERROR", "Relaticle list response is invalid");
    return data.map(cleanEntity);
  }

  async createCompany(workspaceId, { name }) {
    const payload = await this.request(workspaceId, "POST", "/companies", { name });
    return cleanEntity(entityData(payload));
  }

  async createPerson(workspaceId, { name, companyId }) {
    const payload = await this.request(workspaceId, "POST", "/people", { name, company_id: companyId });
    return cleanEntity(entityData(payload));
  }
}
