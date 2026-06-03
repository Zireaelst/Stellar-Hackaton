/**
 * Stellar SDK Integration
 *
 * Handles wallet connection via Freighter, balance queries via
 * Horizon, and Soroban smart-contract interactions for the
 * StellarVeil privacy pool.
 */

import * as StellarSdk from "@stellar/stellar-sdk";
import {
  CONTRACT_ADDRESS,
  HORIZON_URL,
  NETWORK_PASSPHRASE,
  RPC_URL,
  DENOMINATION_XLM,
} from "./constants";

// ── Types ─────────────────────────────────────────────────────────

export interface ContractStats {
  totalLocked: number;
  depositCount: number;
  root: string;
}

// ── Freighter wallet helpers ──────────────────────────────────────

/**
 * Dynamically import @stellar/freighter-api so it only loads
 * in the browser.
 */
async function getFreighter() {
  if (typeof window === "undefined") {
    throw new Error("Wallet connection is only available in the browser");
  }
  const freighter = await import("@stellar/freighter-api");
  return freighter;
}

/**
 * Connect to the Freighter browser extension and return the
 * user's public key.
 */
export async function connectWallet(): Promise<string> {
  const freighter = await getFreighter();

  // Check if Freighter is installed
  const isAllowed = await freighter.isAllowed();
  if (!isAllowed) {
    await freighter.setAllowed();
  }

  const isConnected = await freighter.isConnected();
  if (!isConnected) {
    throw new Error(
      "Freighter wallet is not installed. Please install the Freighter browser extension."
    );
  }

  const address = await freighter.getPublicKey();
  if (!address) {
    throw new Error("No address returned from Freighter");
  }

  return address;
}

// ── Horizon queries ───────────────────────────────────────────────

/**
 * Get the XLM balance of a Stellar account.
 */
export async function getBalance(address: string): Promise<number> {
  try {
    const response = await fetch(
      `${HORIZON_URL}/accounts/${address}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return 0; // Account not funded yet
      }
      throw new Error(`Horizon error: ${response.status}`);
    }

    const account = await response.json();
    const nativeBalance = account.balances.find(
      (b: { asset_type: string; balance: string }) =>
        b.asset_type === "native"
    );

    return nativeBalance ? parseFloat(nativeBalance.balance) : 0;
  } catch (error) {
    console.error("Failed to fetch balance:", error);
    return 0;
  }
}

// ── Soroban RPC helper ────────────────────────────────────────────

function getSorobanServer(): StellarSdk.SorobanRpc.Server {
  return new StellarSdk.SorobanRpc.Server(RPC_URL);
}

async function loadAccount(
  address: string
): Promise<StellarSdk.Account> {
  const server = getSorobanServer();
  const accountResponse = await server.getAccount(address);
  return accountResponse;
}

/**
 * Build, simulate, and submit a Soroban contract invocation
 * signed via Freighter.
 */
async function invokeContract(
  method: string,
  args: StellarSdk.xdr.ScVal[],
  senderAddress: string
): Promise<string> {
  const server = getSorobanServer();
  const account = await loadAccount(senderAddress);

  const contract = new StellarSdk.Contract(CONTRACT_ADDRESS);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: "1000000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(300)
    .build();

  // Simulate to get the correct footprint & resource fees
  const simulated = await server.simulateTransaction(tx);

  if (
    StellarSdk.SorobanRpc.Api.isSimulationError(simulated)
  ) {
    const errMsg =
      "error" in simulated
        ? String(simulated.error)
        : "Transaction simulation failed";
    throw new Error(`Simulation error: ${errMsg}`);
  }

  // Assemble the transaction with the simulation result
  const assembled = StellarSdk.SorobanRpc.assembleTransaction(
    tx,
    simulated
  ).build();

  // Sign with Freighter
  const freighter = await import("@stellar/freighter-api");
  const signedXDR = await freighter.signTransaction(
    assembled.toXDR(),
    {
      networkPassphrase: NETWORK_PASSPHRASE,
    }
  );

  if (!signedXDR) {
    throw new Error("Freighter signing failed: empty signature returned");
  }

  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signedXDR,
    NETWORK_PASSPHRASE
  ) as StellarSdk.Transaction;

  // Submit and poll for result
  const sendResponse = await server.sendTransaction(signedTx);

  if (sendResponse.status === "ERROR") {
    throw new Error(
      `Transaction submission failed: ${JSON.stringify(sendResponse)}`
    );
  }

  // Poll until confirmed or failed
  const txHash = sendResponse.hash;
  let getResponse = await server.getTransaction(txHash);

  const maxAttempts = 30;
  let attempts = 0;

  while (
    getResponse.status === "NOT_FOUND" &&
    attempts < maxAttempts
  ) {
    await new Promise((r) => setTimeout(r, 2000));
    getResponse = await server.getTransaction(txHash);
    attempts++;
  }

  if (getResponse.status === "SUCCESS") {
    return txHash;
  }

  throw new Error(
    `Transaction failed with status: ${getResponse.status}`
  );
}

// ── Contract interactions ─────────────────────────────────────────

/**
 * Deposit into the privacy pool.
 *
 * Calls the `deposit` method on the Soroban contract with:
 * - commitment (Bytes)
 * - sender address (Address)
 *
 * The contract expects DENOMINATION_XLM to be transferred as
 * part of the invocation.
 */
export async function deposit(
  commitment: string,
  senderAddress: string
): Promise<string> {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "Contract address not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local"
    );
  }

  const args = [
    StellarSdk.nativeToScVal(
      Buffer.from(commitment, "hex"),
      { type: "bytes" }
    ),
    StellarSdk.nativeToScVal(senderAddress, { type: "address" }),
  ];

  return invokeContract("deposit", args, senderAddress);
}

/**
 * Withdraw from the privacy pool.
 *
 * Calls the `withdraw` method with:
 * - nullifierHash (Bytes)
 * - recipient (Address)
 * - root (Bytes)
 * - proof (Bytes) — simulated in testnet
 */
export async function withdraw(
  nullifierHash: string,
  recipient: string,
  root: string,
  senderAddress: string
): Promise<string> {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "Contract address not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local"
    );
  }

  const args = [
    StellarSdk.nativeToScVal(
      Buffer.from(nullifierHash, "hex"),
      { type: "bytes" }
    ),
    StellarSdk.nativeToScVal(recipient, { type: "address" }),
    StellarSdk.nativeToScVal(Buffer.from(root, "hex"), {
      type: "bytes",
    }),
    // In testnet the "proof" is just a placeholder; in production
    // this would be the serialized Noir proof.
    StellarSdk.nativeToScVal(
      Buffer.from(nullifierHash, "hex"),
      { type: "bytes" }
    ),
  ];

  return invokeContract("withdraw", args, senderAddress);
}

/**
 * Fetch aggregate contract statistics via Soroban RPC.
 *
 * Reads three contract data entries:
 * - total_locked
 * - deposit_count
 * - root
 */
export async function getContractStats(): Promise<ContractStats> {
  if (!CONTRACT_ADDRESS) {
    return {
      totalLocked: 0,
      depositCount: 0,
      root: "0".repeat(64),
    };
  }

  const server = getSorobanServer();
  const contract = new StellarSdk.Contract(CONTRACT_ADDRESS);

  try {
    // Read total_locked
    const totalLockedKey = StellarSdk.xdr.ScVal.scvSymbol("total_locked");
    const totalLockedEntry = await server.getContractData(
      contract.address(),
      totalLockedKey,
      StellarSdk.SorobanRpc.Durability.Persistent
    );
    const totalLockedRaw = totalLockedEntry.val
      .contractData()
      .val();
    const totalLocked = Number(
      StellarSdk.scValToNative(totalLockedRaw)
    );

    // Read deposit_count
    const depositCountKey = StellarSdk.xdr.ScVal.scvSymbol("deposit_count");
    const depositCountEntry = await server.getContractData(
      contract.address(),
      depositCountKey,
      StellarSdk.SorobanRpc.Durability.Persistent
    );
    const depositCountRaw = depositCountEntry.val
      .contractData()
      .val();
    const depositCount = Number(
      StellarSdk.scValToNative(depositCountRaw)
    );

    // Read root
    const rootKey = StellarSdk.xdr.ScVal.scvSymbol("root");
    const rootEntry = await server.getContractData(
      contract.address(),
      rootKey,
      StellarSdk.SorobanRpc.Durability.Persistent
    );
    const rootRaw = rootEntry.val.contractData().val();
    const rootBytes = StellarSdk.scValToNative(rootRaw);
    const root =
      rootBytes instanceof Uint8Array
        ? Buffer.from(rootBytes).toString("hex")
        : String(rootBytes);

    return {
      totalLocked: totalLocked / 1e7, // stroops → XLM
      depositCount,
      root,
    };
  } catch (error) {
    console.error("Failed to fetch contract stats:", error);
    return {
      totalLocked: 0,
      depositCount: 0,
      root: "0".repeat(64),
    };
  }
}

/**
 * Fetch all leaf commitments stored on-chain.
 *
 * Reads the `leaves` vector from contract storage.
 */
export async function getLeaves(): Promise<string[]> {
  if (!CONTRACT_ADDRESS) {
    return [];
  }

  const server = getSorobanServer();
  const contract = new StellarSdk.Contract(CONTRACT_ADDRESS);

  try {
    const leavesKey = StellarSdk.xdr.ScVal.scvSymbol("leaves");
    const leavesEntry = await server.getContractData(
      contract.address(),
      leavesKey,
      StellarSdk.SorobanRpc.Durability.Persistent
    );
    const leavesRaw = leavesEntry.val.contractData().val();
    const leavesNative = StellarSdk.scValToNative(leavesRaw);

    if (Array.isArray(leavesNative)) {
      return leavesNative.map((leaf: Uint8Array | string) => {
        if (leaf instanceof Uint8Array) {
          return Buffer.from(leaf).toString("hex");
        }
        return String(leaf);
      });
    }

    return [];
  } catch (error) {
    console.error("Failed to fetch leaves:", error);
    return [];
  }
}

/**
 * Fetch the bad-set (flagged commitments) from contract storage.
 */
export async function getBadSet(): Promise<string[]> {
  if (!CONTRACT_ADDRESS) {
    return [];
  }

  const server = getSorobanServer();
  const contract = new StellarSdk.Contract(CONTRACT_ADDRESS);

  try {
    const badSetKey = StellarSdk.xdr.ScVal.scvSymbol("bad_set");
    const badSetEntry = await server.getContractData(
      contract.address(),
      badSetKey,
      StellarSdk.SorobanRpc.Durability.Persistent
    );
    const badSetRaw = badSetEntry.val.contractData().val();
    const badSetNative = StellarSdk.scValToNative(badSetRaw);

    if (Array.isArray(badSetNative)) {
      return badSetNative.map((item: Uint8Array | string) => {
        if (item instanceof Uint8Array) {
          return Buffer.from(item).toString("hex");
        }
        return String(item);
      });
    }

    return [];
  } catch (error) {
    console.error("Failed to fetch bad set:", error);
    return [];
  }
}

/**
 * Add a commitment to the bad-set (operator only).
 *
 * Calls the `add_to_bad_set` method on the contract.
 */
export async function addToBadSet(
  commitment: string,
  operatorAddress: string
): Promise<string> {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "Contract address not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local"
    );
  }

  const args = [
    StellarSdk.nativeToScVal(
      Buffer.from(commitment, "hex"),
      { type: "bytes" }
    ),
  ];

  return invokeContract("add_to_bad_set", args, operatorAddress);
}
