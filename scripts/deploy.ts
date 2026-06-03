#!/usr/bin/env npx ts-node

/**
 * StellarVeil — Contract Deployment Script
 *
 * Deploys the PrivacyPool Soroban contract to Stellar Testnet.
 *
 * Prerequisites:
 *   1. Build the contract: cd contracts/privacy-pool && cargo build --target wasm32-unknown-unknown --release
 *   2. Install Soroban CLI: cargo install soroban-cli
 *   3. Set environment: export STELLAR_SECRET_KEY=your_secret_key
 *
 * Usage:
 *   STELLAR_SECRET_KEY=S... npx ts-node scripts/deploy.ts
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// ─── Configuration ────────────────────────────────────────────────────────────

const NETWORK = "testnet";
const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
const DENOMINATION_STROOPS = "1000000000"; // 100 XLM
const WASM_PATH = path.resolve(
  __dirname,
  "../contracts/privacy-pool/target/wasm32-unknown-unknown/release/privacy_pool.wasm"
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd: string): string {
  console.log(`\n  $ ${cmd}\n`);
  try {
    const output = execSync(cmd, { encoding: "utf-8", stdio: "pipe" });
    console.log(`  ${output.trim()}`);
    return output.trim();
  } catch (error: any) {
    console.error(`  ✗ Command failed: ${error.message}`);
    if (error.stderr) console.error(`  stderr: ${error.stderr}`);
    process.exit(1);
  }
}

function printHeader(text: string): void {
  const line = "─".repeat(60);
  console.log(`\n${line}`);
  console.log(`  ${text}`);
  console.log(line);
}

// ─── Main Deployment ──────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║          STELLARVEIL — CONTRACT DEPLOYMENT              ║");
  console.log("║          Stellar Testnet · Privacy Pools Protocol       ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  // 1. Validate environment
  printHeader("1. Validating Environment");

  const secretKey = process.env.STELLAR_SECRET_KEY;
  if (!secretKey) {
    console.error("  ✗ STELLAR_SECRET_KEY environment variable not set");
    console.error("  Set it: export STELLAR_SECRET_KEY=S...");
    process.exit(1);
  }
  console.log("  ✓ STELLAR_SECRET_KEY found");

  // Check WASM file exists
  if (!fs.existsSync(WASM_PATH)) {
    console.error(`  ✗ WASM file not found at: ${WASM_PATH}`);
    console.error("  Build first: cd contracts/privacy-pool && cargo build --target wasm32-unknown-unknown --release");
    process.exit(1);
  }
  const wasmSize = fs.statSync(WASM_PATH).size;
  console.log(`  ✓ WASM file found (${(wasmSize / 1024).toFixed(1)} KB)`);

  // 2. Get deployer identity
  printHeader("2. Setting Up Identity");

  // Configure Soroban CLI identity
  run(`soroban keys add deployer --secret-key --global 2>/dev/null || true`);

  // Get public key
  const publicKey = run(
    `soroban keys address deployer --global 2>/dev/null || echo ""`
  );

  if (!publicKey) {
    // Add identity manually
    run(
      `echo "${secretKey}" | soroban keys add deployer --secret-key --global`
    );
  }

  const deployerAddress = run(`soroban keys address deployer --global`);
  console.log(`  ✓ Deployer address: ${deployerAddress}`);

  // 3. Fund account on testnet
  printHeader("3. Funding Account (Testnet)");

  try {
    run(
      `curl -s "https://friendbot.stellar.org?addr=${deployerAddress}" > /dev/null`
    );
    console.log("  ✓ Account funded via Friendbot");
  } catch {
    console.log("  ⚠ Friendbot funding failed (account may already be funded)");
  }

  // 4. Deploy the contract
  printHeader("4. Deploying Contract");

  console.log("  Uploading WASM to Stellar Testnet...");
  const wasmHash = run(
    `soroban contract install \
      --wasm "${WASM_PATH}" \
      --source deployer \
      --rpc-url "${RPC_URL}" \
      --network-passphrase "${NETWORK_PASSPHRASE}"`
  );
  console.log(`  ✓ WASM hash: ${wasmHash}`);

  console.log("\n  Deploying contract instance...");
  const contractId = run(
    `soroban contract deploy \
      --wasm-hash "${wasmHash}" \
      --source deployer \
      --rpc-url "${RPC_URL}" \
      --network-passphrase "${NETWORK_PASSPHRASE}"`
  );
  console.log(`  ✓ Contract ID: ${contractId}`);

  // 5. Initialize the contract
  printHeader("5. Initializing Contract");

  // Get the native XLM token address for testnet
  const xlmToken = run(
    `soroban contract id asset \
      --asset native \
      --source deployer \
      --rpc-url "${RPC_URL}" \
      --network-passphrase "${NETWORK_PASSPHRASE}"`
  );
  console.log(`  ✓ XLM Token address: ${xlmToken}`);

  run(
    `soroban contract invoke \
      --id "${contractId}" \
      --source deployer \
      --rpc-url "${RPC_URL}" \
      --network-passphrase "${NETWORK_PASSPHRASE}" \
      -- \
      initialize \
      --operator "${deployerAddress}" \
      --token "${xlmToken}" \
      --denomination ${DENOMINATION_STROOPS}`
  );
  console.log("  ✓ Contract initialized!");
  console.log(`    Operator: ${deployerAddress}`);
  console.log(`    Token: ${xlmToken} (native XLM)`);
  console.log(`    Denomination: ${DENOMINATION_STROOPS} stroops (100 XLM)`);

  // 6. Verify deployment
  printHeader("6. Verifying Deployment");

  const leafCount = run(
    `soroban contract invoke \
      --id "${contractId}" \
      --source deployer \
      --rpc-url "${RPC_URL}" \
      --network-passphrase "${NETWORK_PASSPHRASE}" \
      -- \
      get_leaf_count`
  );
  console.log(`  ✓ Leaf count: ${leafCount}`);

  const denomination = run(
    `soroban contract invoke \
      --id "${contractId}" \
      --source deployer \
      --rpc-url "${RPC_URL}" \
      --network-passphrase "${NETWORK_PASSPHRASE}" \
      -- \
      get_denomination`
  );
  console.log(`  ✓ Denomination: ${denomination} stroops`);

  // 7. Output summary
  printHeader("DEPLOYMENT COMPLETE");

  console.log(`
  ┌──────────────────────────────────────────────────────────┐
  │  CONTRACT DEPLOYED SUCCESSFULLY                          │
  ├──────────────────────────────────────────────────────────┤
  │                                                          │
  │  Contract ID : ${contractId}                             │
  │  WASM Hash   : ${wasmHash.substring(0, 20)}...          │
  │  Network     : ${NETWORK}                               │
  │  Operator    : ${deployerAddress.substring(0, 10)}...    │
  │  Denomination: 100 XLM                                   │
  │                                                          │
  │  Explorer:                                               │
  │  https://stellar.expert/explorer/testnet/contract/${contractId}
  │                                                          │
  └──────────────────────────────────────────────────────────┘
  `);

  // Write contract address to .env
  const envPath = path.resolve(__dirname, "../frontend/.env.local");
  const envContent = `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractId}\nNEXT_PUBLIC_NETWORK=TESTNET\n`;
  fs.writeFileSync(envPath, envContent);
  console.log(`  ✓ Written contract address to ${envPath}`);
  console.log("\n  Next steps:");
  console.log("    cd frontend && npm run dev");
  console.log("");
}

main().catch((err) => {
  console.error("\n  ✗ Deployment failed:", err.message);
  process.exit(1);
});

