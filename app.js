const ARC_TESTNET = {
  chainId: 5042002,
  chainIdHex: "0x4cef52",
  name: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  blockExplorerUrl: "https://testnet.arcscan.app",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
  },
};

const STABLECOINS = {
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x3600000000000000000000000000000000000000",
    decimals: 6,
  },
  EURC: {
    symbol: "EURC",
    name: "Euro Coin",
    address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    decimals: 6,
  },
};

const state = {
  account: "",
  email: "",
  chainId: "",
};

const SESSION_EMAIL_KEY = "spend-save-email";
const LEGACY_SESSION_EMAIL_KEY = "arc-save-email";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ERC20_APPROVE_SELECTOR = "0x095ea7b3";
const SPEND_TO_VAULT_SELECTOR = "0x41a15236";

const elements = {
  amount: document.querySelector("#amount"),
  amountSymbol: document.querySelector("#amount-symbol"),
  coin: document.querySelector("#coin"),
  connectedLabel: document.querySelector("#connected-label"),
  connectionDot: document.querySelector("#connection-dot"),
  email: document.querySelector("#email"),
  emailForm: document.querySelector("#email-form"),
  networkButton: document.querySelector("#network-button"),
  networkLabel: document.querySelector("#network-label"),
  recipient: document.querySelector("#recipient"),
  recipientAmount: document.querySelector("#recipient-amount"),
  savingsAmount: document.querySelector("#savings-amount"),
  savingsVault: document.querySelector("#savings-vault"),
  status: document.querySelector("#status"),
  statusText: document.querySelector("#status-text"),
  totalAmount: document.querySelector("#total-amount"),
  transferButton: document.querySelector("#transfer-button"),
  walletButton: document.querySelector("#wallet-button"),
};

function getCoin() {
  return STABLECOINS[elements.coin.value] ?? STABLECOINS.USDC;
}

function shortAddress(address) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
}

function isAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

function getConfiguredAddress(key) {
  const value = window.SPEND_SAVE_CONFIG?.[key]?.trim?.() ?? "";
  return isAddress(value) && value.toLowerCase() !== ZERO_ADDRESS ? value : "";
}

function parseTokenUnits(value, decimals) {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("Enter a valid amount.");
  }

  const [whole, fraction = ""] = trimmed.split(".");
  if (fraction.length > decimals) {
    throw new Error(`Use ${decimals} or fewer decimal places.`);
  }

  return BigInt(`${whole}${fraction.padEnd(decimals, "0")}`);
}

function formatTokenUnits(value, decimals) {
  const padded = value.toString().padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

function encodeUint256(value) {
  return value.toString(16).padStart(64, "0");
}

function encodeAddress(address) {
  return address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}

function encodeErc20Transfer(to, amount) {
  return `0xa9059cbb${encodeAddress(to)}${encodeUint256(amount)}`;
}

function encodeErc20Approve(spender, amount) {
  return `${ERC20_APPROVE_SELECTOR}${encodeAddress(spender)}${encodeUint256(amount)}`;
}

function encodeSpendToVault(stablecoin, recipient, amount, targetSavingsVault) {
  return `${SPEND_TO_VAULT_SELECTOR}${encodeAddress(stablecoin)}${encodeAddress(recipient)}${encodeUint256(amount)}${encodeAddress(targetSavingsVault)}`;
}

function getComputedTransfer() {
  const coin = getCoin();
  const transferUnits = parseTokenUnits(elements.amount.value || "0", coin.decimals);
  const savingsUnits = transferUnits / 5n;
  return {
    coin,
    transferUnits,
    savingsUnits,
    totalUnits: transferUnits + savingsUnits,
  };
}

function setStatus(tone, message) {
  elements.status.className = `status ${tone}`;
  elements.statusText.textContent = message;
}

function readSessionEmail() {
  try {
    return (
      window.localStorage?.getItem(SESSION_EMAIL_KEY) ??
      window.localStorage?.getItem(LEGACY_SESSION_EMAIL_KEY) ??
      ""
    );
  } catch {
    return "";
  }
}

function writeSessionEmail(email) {
  try {
    window.localStorage?.setItem(SESSION_EMAIL_KEY, email);
    window.localStorage?.removeItem(LEGACY_SESSION_EMAIL_KEY);
  } catch {
    // Storage can be blocked in embedded or private browser contexts.
  }
}

function refreshConnection() {
  const label = state.account ? shortAddress(state.account) : state.email || "Not connected";
  const isConnected = Boolean(state.account || state.email);
  elements.connectedLabel.textContent = label;
  elements.connectionDot.className = isConnected ? "dot online" : "dot";
  elements.walletButton.lastChild.textContent = state.account ? ` ${shortAddress(state.account)}` : " Connect wallet";
  elements.networkLabel.textContent =
    state.chainId.toLowerCase() === ARC_TESTNET.chainIdHex ? ARC_TESTNET.name : state.chainId || "Unknown";
  elements.networkButton.lastChild.textContent =
    state.chainId.toLowerCase() === ARC_TESTNET.chainIdHex ? " Arc active" : " Use Arc Testnet";
}

function refreshSummary() {
  const coin = getCoin();
  elements.amountSymbol.textContent = coin.symbol;

  try {
    const computed = getComputedTransfer();
    elements.recipientAmount.textContent = `${elements.amount.value || "0"} ${coin.symbol}`;
    elements.savingsAmount.textContent = `${formatTokenUnits(computed.savingsUnits, coin.decimals)} ${coin.symbol}`;
    elements.totalAmount.textContent = `${formatTokenUnits(computed.totalUnits, coin.decimals)} ${coin.symbol}`;
  } catch {
    elements.recipientAmount.textContent = `0 ${coin.symbol}`;
    elements.savingsAmount.textContent = `0 ${coin.symbol}`;
    elements.totalAmount.textContent = `0 ${coin.symbol}`;
  }
}

async function connectWallet() {
  const provider = window.ethereum;
  if (!provider) {
    setStatus("error", "No web3 wallet found. Install or open a browser wallet, then try again.");
    return;
  }

  try {
    setStatus("pending", "Waiting for wallet approval...");
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    state.account = accounts?.[0] ?? "";
    state.chainId = await provider.request({ method: "eth_chainId" });
    refreshConnection();
    setStatus("success", "Wallet connected.");
  } catch (error) {
    setStatus("error", error?.message ?? "Wallet connection was cancelled.");
  }
}

async function switchToArc() {
  const provider = window.ethereum;
  if (!provider) {
    setStatus("error", "No wallet provider found.");
    return;
  }

  try {
    setStatus("pending", "Opening Arc network prompt...");
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_TESTNET.chainIdHex }],
    });
  } catch (error) {
    if (error?.code !== 4902) {
      setStatus("error", error?.message ?? "Could not switch to Arc Testnet.");
      return;
    }

    try {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: ARC_TESTNET.chainIdHex,
            chainName: ARC_TESTNET.name,
            rpcUrls: [ARC_TESTNET.rpcUrl],
            blockExplorerUrls: [ARC_TESTNET.blockExplorerUrl],
            nativeCurrency: ARC_TESTNET.nativeCurrency,
          },
        ],
      });
    } catch (addError) {
      setStatus("error", addError?.message ?? "Could not add Arc Testnet.");
      return;
    }
  }

  state.chainId = await provider.request({ method: "eth_chainId" });
  refreshConnection();
  setStatus("success", "Arc Testnet is active.");
}

function connectEmail(event) {
  event.preventDefault();
  const normalized = elements.email.value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    setStatus("error", "Enter a valid email address.");
    return;
  }

  writeSessionEmail(normalized);
  state.email = normalized;
  refreshConnection();
  setStatus("success", "Email session saved. Attach a wallet when you are ready to execute onchain.");
}

async function submitTransfer() {
  const provider = window.ethereum;

  if (!provider || !state.account) {
    setStatus("error", "Connect a wallet to execute an Arc transfer.");
    return;
  }

  if (state.chainId.toLowerCase() !== ARC_TESTNET.chainIdHex) {
    setStatus("error", "Switch your wallet to Arc Testnet first.");
    return;
  }

  let computed;
  try {
    computed = getComputedTransfer();
  } catch (error) {
    setStatus("error", error.message);
    return;
  }

  if (computed.transferUnits <= 0n) {
    setStatus("error", "Enter an amount greater than zero.");
    return;
  }

  const recipient = elements.recipient.value.trim();
  const savingsVault = elements.savingsVault.value.trim();

  if (!isAddress(recipient)) {
    setStatus("error", "Enter a valid recipient wallet address.");
    return;
  }

  if (!isAddress(savingsVault)) {
    setStatus("error", "Enter a valid savings vault address.");
    return;
  }

  try {
    const spendSaveContract = getConfiguredAddress("spendSaveContract");

    if (spendSaveContract) {
      setStatus("pending", "Confirm token approval for the Spend and Save contract...");
      const approvalTx = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: state.account,
            to: computed.coin.address,
            value: "0x0",
            data: encodeErc20Approve(spendSaveContract, computed.totalUnits),
          },
        ],
      });

      setStatus("pending", "Confirm the Spend and Save contract call...");
      const spendTx = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: state.account,
            to: spendSaveContract,
            value: "0x0",
            data: encodeSpendToVault(computed.coin.address, recipient, computed.transferUnits, savingsVault),
          },
        ],
      });

      setStatus("success", `Approved ${shortAddress(approvalTx)} and saved with ${shortAddress(spendTx)}.`);
      return;
    }

    setStatus("pending", "Confirm the recipient transfer in your wallet...");
    const recipientTx = await provider.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: state.account,
          to: computed.coin.address,
          value: "0x0",
          data: encodeErc20Transfer(recipient, computed.transferUnits),
        },
      ],
    });

    setStatus("pending", "Now confirm the 20% savings sweep...");
    const savingsTx = await provider.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: state.account,
          to: computed.coin.address,
          value: "0x0",
          data: encodeErc20Transfer(savingsVault, computed.savingsUnits),
        },
      ],
    });

    setStatus("success", `Sent transfer ${shortAddress(recipientTx)} and savings ${shortAddress(savingsTx)}.`);
  } catch (error) {
    setStatus("error", error?.message ?? "Transfer was not completed.");
  }
}

function hydrate() {
  const savedEmail = readSessionEmail();
  const configuredVault = getConfiguredAddress("defaultSavingsVault");

  state.email = savedEmail;
  elements.email.value = savedEmail;
  elements.savingsVault.value = configuredVault;
  refreshConnection();
  refreshSummary();

  const provider = window.ethereum;
  if (provider?.on) {
    provider.on("accountsChanged", (accounts) => {
      state.account = accounts?.[0] ?? "";
      refreshConnection();
    });

    provider.on("chainChanged", (chainId) => {
      state.chainId = chainId;
      refreshConnection();
    });
  }
}

elements.amount.addEventListener("input", refreshSummary);
elements.coin.addEventListener("change", refreshSummary);
elements.emailForm.addEventListener("submit", connectEmail);
elements.networkButton.addEventListener("click", switchToArc);
elements.transferButton.addEventListener("click", submitTransfer);
elements.walletButton.addEventListener("click", connectWallet);

hydrate();
