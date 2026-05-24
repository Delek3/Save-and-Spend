# Spend and Save

Spend and Save is a minimal Arc Network app that saves 20% of every stablecoin spend or transfer.

The frontend connects by web3 wallet or email preview. When a deployed `SpendAndSave` contract address is configured, the wallet flow asks the user to approve the contract for the total debit, then executes the spend and 20% savings sweep through the contract.

## Required Structure

```text
app/
contracts/
script/
build.mjs
SPEND_AND_SAVE_FIRST_CIRCLE.md
DEPLOY_WITH_REMIX.md
HOSTING.md
README.md
foundry.toml
package.json
vercel.json
.gitignore
```

## Arc Testnet

- RPC: `https://rpc.testnet.arc.network`
- Chain ID: `5042002`
- Currency symbol: `USDC`
- USDC: `0x3600000000000000000000000000000000000000`
- EURC: `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a`

## Frontend

```bash
npm run dev
npm run build
```

The Vercel build command runs `node build.mjs`. It copies `app/` into `dist/` and writes `dist/config.js` from environment variables.

## Environment Variables

```bash
NEXT_PUBLIC_DEFAULT_SAVINGS_VAULT=0xYourSavingsVaultAddress
NEXT_PUBLIC_SPEND_SAVE_CONTRACT=0xYourSpendAndSaveContract
```

## Contract

The contract is in `contracts/SpendAndSave.sol`.

Main flow:

1. User approves the contract for `spend amount + 20%`.
2. User calls `spendToVault(stablecoin, recipient, spendAmount, savingsVault)`.
3. Contract transfers the spend amount to the recipient.
4. Contract transfers 20% to the savings vault.

See `DEPLOY_WITH_REMIX.md` and `HOSTING.md` for deployment steps.
