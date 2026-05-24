# Deploy With Remix

Use this when you want to deploy the Spend and Save contract without setting up Foundry locally.

## Files

- Contract: `contracts/SpendAndSave.sol`
- Foundry deploy script: `script/DeploySpendAndSave.s.sol`

## Arc Testnet Wallet Setup

Add Arc Testnet to your wallet:

- Network name: `Arc Testnet`
- RPC URL: `https://rpc.testnet.arc.network`
- Chain ID: `5042002`
- Currency symbol: `USDC`

## Remix Steps

1. Open `https://remix.ethereum.org`.
2. Upload or create `contracts/SpendAndSave.sol`.
3. Open the Solidity compiler tab.
4. Select compiler `0.8.24` or newer `0.8.x`.
5. Compile `SpendAndSave.sol`.
6. Open Deploy & Run Transactions.
7. Set Environment to `Injected Provider`.
8. Confirm your wallet is on Arc Testnet.
9. Deploy `SpendAndSave` with constructor arguments:

```text
"0xYourSavingsVaultAddress",
["0x3600000000000000000000000000000000000000","0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a"]
```

10. Copy the deployed contract address.
11. Add it to Vercel as:

```bash
NEXT_PUBLIC_SPEND_SAVE_CONTRACT=0xYourDeployedSpendAndSaveContract
```

## Test Amounts

USDC and EURC use 6 decimals.

For `100 USDC`, use:

```text
100000000
```

The user must approve `120000000` before spending `100000000`, because the app adds the 20% savings sweep.
