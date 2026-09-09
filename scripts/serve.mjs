import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT ?? 4173);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8"
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
    const safePath = normalize(decodeURIComponent(url.pathname)).replace(/^([.][.][/\\])+/, "");
    let filePath = join(root, safePath === "/" ? "index.html" : safePath);
    let spaFallback = false;
    try {
      const info = await stat(filePath);
      if (info.isDirectory()) filePath = join(filePath, "index.html");
    } catch {
      filePath = join(root, "index.html");
      spaFallback = true;
    }
    let body = await readFile(filePath);
    if (spaFallback) {
      body = Buffer.from(body.toString("utf8")
        .replace(/href="(assets|styles)\//g, 'href="/$1/')
        .replace(/src="src\//g, 'src="/src/'));
    }
    response.writeHead(200, { "content-type": contentTypes[extname(filePath)] ?? "application/octet-stream" });
    response.end(body);
  } catch (error) {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.message : "Unknown error");
  }
});

server.listen(port, () => console.log(`Rahjo dev server: http://localhost:${port}`));
