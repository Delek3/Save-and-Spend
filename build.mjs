import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = resolve(root, "app");
const distDir = resolve(root, "dist");
const defaultSavingsVault = process.env.NEXT_PUBLIC_DEFAULT_SAVINGS_VAULT ?? "";
const spendSaveContract = process.env.NEXT_PUBLIC_SPEND_SAVE_CONTRACT ?? "";

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await cp(appDir, distDir, { recursive: true });
await writeFile(
  resolve(distDir, "config.js"),
  `window.SPEND_SAVE_CONFIG = ${JSON.stringify({ defaultSavingsVault, spendSaveContract })};\n`,
);

console.log("Built Spend and Save to dist/");
