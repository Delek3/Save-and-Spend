# Spend and Save First Circle

Spend and Save is a simple savings habit built into everyday stablecoin transfers on Arc Network.

## First Circle Goal

Let a user spend or transfer stablecoins on Arc while automatically moving 20% into a savings vault.

## First Circle Scope

- Connect by web3 wallet.
- Connect by email for preview sessions.
- Support Arc Testnet stablecoins.
- Calculate recipient amount, 20% savings amount, and total debit.
- Execute through the `SpendAndSave` contract when deployed.
- Fall back to direct wallet transfers if no contract address is configured.

## User Flow

1. User connects wallet or email.
2. User enters transfer amount, recipient, and savings vault.
3. App calculates the 20% savings sweep.
4. Wallet user switches to Arc Testnet.
5. Wallet user approves total debit.
6. Contract sends the transfer and savings sweep.

## First Circle Stablecoins

| Token | Arc Testnet Address |
| --- | --- |
| USDC | `0x3600000000000000000000000000000000000000` |
| EURC | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` |

## Next Circle Ideas

- Savings goals by wallet or email account.
- Optional weekly or monthly savings reports.
- Multiple vaults for rent, emergency savings, and family support.
- Embedded email wallet provider for users without browser wallets.
