import { createReadStream, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requestedDir = process.argv[2] ?? "app";
const port = Number(process.argv[3] ?? process.env.PORT ?? 3000);
const baseDir = resolve(root, requestedDir);
const configPath = join(baseDir, "config.js");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

if (!existsSync(configPath)) {
  await mkdir(baseDir, { recursive: true });
  await writeFile(configPath, "window.SPEND_SAVE_CONFIG = { defaultSavingsVault: '', spendSaveContract: '' };\n");
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://localhost:${port}`);
  const safePath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const candidate = resolve(baseDir, safePath || "index.html");
  const filePath = candidate.startsWith(baseDir) && existsSync(candidate) ? candidate : join(baseDir, "index.html");
  const extension = extname(filePath);

  response.setHeader("Content-Type", mimeTypes[extension] ?? "application/octet-stream");
  createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Spend and Save running at http://localhost:${port}`);
});
