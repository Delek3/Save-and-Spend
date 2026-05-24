import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const solcPath = process.env.SOLC_JS_PATH ?? "/private/tmp/soljson-v0.8.24.js";
const require = createRequire(import.meta.url);
const soljson = require(solcPath);
const compile = soljson.cwrap("solidity_compile", "string", ["string", "number", "number"]);
const source = await readFile(resolve(root, "contracts/SpendAndSave.sol"), "utf8");

const input = {
  language: "Solidity",
  sources: {
    "SpendAndSave.sol": {
      content: source,
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object", "metadata"],
      },
    },
  },
};

const output = JSON.parse(compile(JSON.stringify(input), 0, 0));
const errors = output.errors?.filter((entry) => entry.severity === "error") ?? [];

if (errors.length > 0) {
  for (const error of errors) {
    console.error(error.formattedMessage ?? error.message);
  }
  process.exit(1);
}

const contract = output.contracts["SpendAndSave.sol"].SpendAndSave;
const artifact = {
  contractName: "SpendAndSave",
  sourceName: "SpendAndSave.sol",
  compiler: "0.8.24",
  abi: contract.abi,
  bytecode: `0x${contract.evm.bytecode.object}`,
  deployedBytecode: `0x${contract.evm.deployedBytecode.object}`,
  metadata: JSON.parse(contract.metadata),
};

await mkdir(resolve(root, "artifacts"), { recursive: true });
await writeFile(resolve(root, "artifacts/SpendAndSave.json"), `${JSON.stringify(artifact, null, 2)}\n`);
await writeFile(resolve(root, "artifacts/SpendAndSave.abi.json"), `${JSON.stringify(contract.abi, null, 2)}\n`);

console.log("Compiled SpendAndSave contract to artifacts/");
