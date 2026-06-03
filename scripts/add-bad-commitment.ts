#!/usr/bin/env npx ts-node

/**
 * StellarVeil — Add Bad Commitment Script
 *
 * Flags a commitment as "bad" (sanctioned/flagged) in the PrivacyPool contract.
 * Only the operator can perform this action.
 *
 * Usage:
 *   STELLAR_SECRET_KEY=S... npx ts-node scripts/add-bad-commitment.ts <commitment_hex>
 *
 * Example:
 *   STELLAR_SECRET_KEY=S... npx ts-node scripts/add-bad-commitment.ts \
 *     0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890
 */

import { execSync } from "child_process";

// ─── Configuration ────────────────────────────────────────────────────────────

const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

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

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║       STELLARVEIL — FLAG BAD COMMITMENT                 ║");
  console.log("║       Operator Action · Bad Set Management              ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  // Validate args
  const commitmentArg = process.argv[2];
  if (!commitmentArg) {
    console.error("\n  ✗ Usage: npx ts-node add-bad-commitment.ts <commitment_hex>");
    console.error("  Example: npx ts-node add-bad-commitment.ts 0x1a2b...7890");
    process.exit(1);
  }

  const secretKey = process.env.STELLAR_SECRET_KEY;
  if (!secretKey) {
    console.error("\n  ✗ STELLAR_SECRET_KEY not set");
    process.exit(1);
  }

  const contractId = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!contractId) {
    console.error("\n  ✗ NEXT_PUBLIC_CONTRACT_ADDRESS not set");
    console.error("  Run deploy.ts first, then source .env.local");
    process.exit(1);
  }

  // Clean commitment hex (remove 0x prefix if present)
  let commitment = commitmentArg.startsWith("0x")
    ? commitmentArg.slice(2)
    : commitmentArg;

  // Validate hex length
  if (commitment.length !== 64) {
    console.error(`\n  ✗ Commitment must be 32 bytes (64 hex chars). Got: ${commitment.length} chars`);
    process.exit(1);
  }

  console.log(`\n  Contract:   ${contractId}`);
  console.log(`  Commitment: 0x${commitment.substring(0, 8)}...${commitment.substring(56)}`);

  // Check if already in bad set
  console.log("\n  Checking if commitment is already flagged...");
  const isInBadSet = run(
    `soroban contract invoke \
      --id "${contractId}" \
      --source deployer \
      --rpc-url "${RPC_URL}" \
      --network-passphrase "${NETWORK_PASSPHRASE}" \
      -- \
      is_in_bad_set \
      --commitment ${commitment}`
  );

  if (isInBadSet === "true") {
    console.log("\n  ⚠ Commitment is already in the bad set. No action needed.");
    process.exit(0);
  }

  // Add to bad set
  console.log("\n  Adding commitment to bad set...");
  run(
    `soroban contract invoke \
      --id "${contractId}" \
      --source deployer \
      --rpc-url "${RPC_URL}" \
      --network-passphrase "${NETWORK_PASSPHRASE}" \
      -- \
      add_to_bad_set \
      --commitment ${commitment}`
  );

  // Verify
  const badCount = run(
    `soroban contract invoke \
      --id "${contractId}" \
      --source deployer \
      --rpc-url "${RPC_URL}" \
      --network-passphrase "${NETWORK_PASSPHRASE}" \
      -- \
      get_bad_count`
  );

  console.log(`\n  ✓ Commitment flagged successfully!`);
  console.log(`  ✓ Total flagged commitments: ${badCount}`);
  console.log(`\n  Note: Users withdrawing must now prove exclusion from this commitment.`);
  console.log(`  Any deposit matching this commitment will fail the ZK exclusion proof.\n`);
}

main().catch((err) => {
  console.error("\n  ✗ Failed:", err.message);
  process.exit(1);
});

