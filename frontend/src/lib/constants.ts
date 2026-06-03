export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

export const NETWORK = "TESTNET";

export const HORIZON_URL = "https://horizon-testnet.stellar.org";

export const RPC_URL = "https://soroban-testnet.stellar.org";

export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

/** Fixed deposit denomination in stroops (100 XLM). */
export const DENOMINATION_STROOPS = 1_000_000_000n;

/** Fixed deposit denomination in XLM. */
export const DENOMINATION_XLM = 100;

/** Merkle tree depth — supports up to 2^20 ≈ 1 M deposits. */
export const TREE_DEPTH = 20;

/** Maximum bad-set entries the contract stores on-chain. */
export const BAD_SET_SIZE = 16;

/** Stellar Expert explorer base URL (testnet). */
export const STELLAR_EXPERT_URL =
  "https://stellar.expert/explorer/testnet";

/** Testnet friendbot funding link. */
export const TESTNET_FUND_URL =
  "https://lab.stellar.org/account/fund?$=network$id=testnet";
