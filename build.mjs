import { existsSync } from "node:fs";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const distDir = resolve(root, "dist");
const defaultSavingsVault = process.env.NEXT_PUBLIC_DEFAULT_SAVINGS_VAULT ?? "";
const spendSaveContract = process.env.NEXT_PUBLIC_SPEND_SAVE_CONTRACT ?? "";
const sourceCandidates = [resolve(root, "app"), resolve(root, "public")];
const sourceDir = sourceCandidates.find((candidate) => existsSync(resolve(candidate, "index.html")));

if (!sourceDir) {
  throw new Error(
    [
      "Cannot find frontend source.",
      "Expected one of these files:",
      ...sourceCandidates.map((candidate) => `- ${resolve(candidate, "index.html")}`),
      "Make sure the app/ folder from the ZIP is uploaded to the GitHub repository root.",
    ].join("\n"),
  );
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await cp(sourceDir, distDir, { recursive: true });
await writeFile(
  resolve(distDir, "config.js"),
  `window.SPEND_SAVE_CONFIG = ${JSON.stringify({ defaultSavingsVault, spendSaveContract })};\n`,
);

console.log(`Built Spend and Save from ${sourceDir} to dist/`);
