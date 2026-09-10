import { loadConfig, loadWorkspaceTokenMap } from "./config.js";
import { Database } from "./database.js";
import { RelaticleClient } from "./relaticleClient.js";
import { NativeDeferredCrmClient } from "./nativeDeferredCrmClient.js";
import { RahjoRepository } from "./repository.js";
import { createRahjoServer } from "./app.js";

let database;
let server;

async function start() {
  const config = loadConfig();
  const workspaceTokens = config.crmMode === "relaticle"
    ? await loadWorkspaceTokenMap(config.relaticleTokenFile)
    : new Map();
  database = new Database(config.databaseUrl);
  const relaticle = config.crmMode === "relaticle"
    ? new RelaticleClient({
        baseUrl: config.relaticleBaseUrl,
        mcpUrl: config.relaticleMcpUrl,
        workspaceTokens,
        timeoutMs: config.requestTimeoutMs
      })
    : new NativeDeferredCrmClient();
  const repository = new RahjoRepository({ database, relaticle });

  await database.ready();
  for (const [workspaceId, mapping] of workspaceTokens) {
    await database.verifyWorkspaceBinding(workspaceId, mapping.expectedTeamId);
    await relaticle.verifyAuthentication(workspaceId);
    await relaticle.verifyTeamIdentity(workspaceId);
  }

  server = createRahjoServer({ config, database, repository, relaticle, workspaceTokens });
  server.listen(config.port, "0.0.0.0", () => {
    console.log(JSON.stringify({ event: "server.started", port: config.port, dataMode: "server", crmMode: config.crmMode, interim: config.interim, llmEnabled: false }));
  });
}

async function shutdown(signal) {
  console.log(JSON.stringify({ event: "server.stopping", signal }));
  if (!server) {
    await database?.close();
    process.exit(0);
  }
  server.close(async () => {
    await database?.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start().catch(async (error) => {
  console.error(JSON.stringify({ event: "server.start_failed", message: error.message }));
  await database?.close();
  process.exit(1);
});
