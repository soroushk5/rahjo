import { readFile } from "node:fs/promises";
import { problems } from "./errors.js";

function required(env, name, minimum = 1) {
  const value = env[name]?.trim();
  if (!value || value.length < minimum) throw new Error(`${name} is required${minimum > 1 ? ` and must be at least ${minimum} characters` : ""}`);
  return value;
}

function absoluteUrl(value, name, { allowHttpLocalhost = false } = {}) {
  const url = new URL(value);
  const localHttp = allowHttpLocalhost && url.protocol === "http:" && ["localhost", "127.0.0.1", "relaticle-app"].includes(url.hostname);
  if (url.protocol !== "https:" && !localHttp) throw new Error(`${name} must use HTTPS`);
  return url.toString().replace(/\/$/, "");
}

export function loadConfig(env = process.env) {
  if (env.RAHJO_LLM_ENABLED && env.RAHJO_LLM_ENABLED !== "false") {
    throw new Error("Phase-1 server forbids RAHJO_LLM_ENABLED; the critical path is no-LLM");
  }
  const appEnv = env.NODE_ENV === "production" ? "production" : "development";
  const allowHttpLocalhost = appEnv !== "production" || env.RAHJO_ALLOW_INTERNAL_HTTP === "true";
  const corsOrigins = required(env, "RAHJO_CORS_ORIGINS").split(",").map((item) => absoluteUrl(item.trim(), "RAHJO_CORS_ORIGINS", { allowHttpLocalhost }));
  return Object.freeze({
    appEnv,
    port: Number(env.RAHJO_API_PORT || 8787),
    databaseUrl: required(env, "RAHJO_DATABASE_URL"),
    tokenPepper: required(env, "RAHJO_TOKEN_PEPPER", 32),
    relaticleBaseUrl: absoluteUrl(required(env, "RELATICLE_BASE_URL"), "RELATICLE_BASE_URL", { allowHttpLocalhost }),
    relaticleMcpUrl: absoluteUrl(required(env, "RELATICLE_MCP_URL"), "RELATICLE_MCP_URL", { allowHttpLocalhost }),
    relaticleTokenFile: required(env, "RELATICLE_TOKEN_FILE"),
    corsOrigins,
    publicOrigin: absoluteUrl(required(env, "RAHJO_PUBLIC_ORIGIN"), "RAHJO_PUBLIC_ORIGIN", { allowHttpLocalhost }),
    bodyLimit: 64 * 1024,
    requestTimeoutMs: Number(env.RAHJO_REQUEST_TIMEOUT_MS || 8000),
    sessionHours: Number(env.RAHJO_SESSION_HOURS || 12),
    dataMode: "server",
    llmEnabled: false
  });
}

export async function loadWorkspaceTokenMap(path) {
  let parsed;
  try {
    parsed = JSON.parse(await readFile(path, "utf8"));
  } catch {
    throw problems.unavailable("RELATICLE_TOKEN_CONFIG_UNAVAILABLE", "Relaticle workspace token mapping could not be loaded");
  }
  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.workspaces)) {
    throw problems.unavailable("RELATICLE_TOKEN_CONFIG_INVALID", "Relaticle workspace token mapping is invalid");
  }
  const map = new Map();
  const teamIds = new Set();
  for (const item of parsed.workspaces) {
    if (!item || typeof item.workspaceId !== "string"
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.workspaceId)
      || typeof item.token !== "string" || item.token.length < 20
      || typeof item.expectedTeamId !== "string" || !item.expectedTeamId.trim()) {
      throw problems.unavailable("RELATICLE_TOKEN_CONFIG_INVALID", "Relaticle workspace token mapping is invalid");
    }
    if (map.has(item.workspaceId)) throw problems.unavailable("RELATICLE_TOKEN_CONFIG_INVALID", "Duplicate workspace mapping");
    if (teamIds.has(item.expectedTeamId)) throw problems.unavailable("RELATICLE_TOKEN_CONFIG_INVALID", "Duplicate Relaticle team mapping");
    const requiredAbilities = item.requiredAbilities ?? ["read", "create"];
    if (!Array.isArray(requiredAbilities) || requiredAbilities.length === 0
      || requiredAbilities.some((ability) => typeof ability !== "string" || !ability.trim())) {
      throw problems.unavailable("RELATICLE_TOKEN_CONFIG_INVALID", "Relaticle token ability requirements are invalid");
    }
    teamIds.add(item.expectedTeamId);
    map.set(item.workspaceId, Object.freeze({
      token: item.token,
      expectedTeamId: item.expectedTeamId,
      requiredAbilities: Object.freeze([...new Set(requiredAbilities)])
    }));
  }
  if (map.size === 0) throw problems.unavailable("RELATICLE_TOKEN_CONFIG_INVALID", "At least one Relaticle workspace mapping is required");
  return map;
}
