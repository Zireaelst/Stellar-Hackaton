# 🌑 StellarVeil — Project Summary & Submission Details

**StellarVeil** is the first compliance-aware privacy pool protocol built on Stellar. It leverages zero-knowledge proofs (ZKPs) and Soroban smart contracts to allow users to preserve transaction privacy while cryptographically proving regulatory compliance.

---

## 🔬 Academic Foundation

StellarVeil is a direct implementation of the **Privacy Pools** protocol conceptualized in the academic paper:
> **"Blockchain Privacy and Regulatory Compliance: Towards a Practical Equilibrium"**
> *Vitalik Buterin, Jacob Illum, Matthias Nadler, Fabian Schär, Arnold Schmid* (SSRN 2023)

### The Core Problem & Solution
* **The Problem**: Traditional mixers (such as Tornado Cash) provide absolute anonymity but offer zero regulatory compliance mechanisms, leading to protocol-level sanctions.
* **The Solution**: StellarVeil allows depositors to generate client-side ZK proofs proving that their deposit is **not** part of a blacklisted/sanctioned set of commitments ("Bad Set" or "Exclusion Set") without revealing which specific deposit in the pool is theirs. This creates a compliance-friendly privacy standard.

---

## 🏗️ Protocol Architecture & Data Flow

```
                           STELLARVEIL PROTOCOL FLOW
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 1. DEPOSIT                                                             │
  │    * User sends a fixed denomination of 100 XLM to the smart contract.  │
  │    * Locally, a cryptographic note is generated in the browser:         │
  │      commitment = SHA256(nullifier + secret)                           │
  │    * The commitment is submitted to the on-chain Merkle Tree.           │
  │                                                                        │
  │ 2. ZERO-KNOWLEDGE PROOF GENERATION                                     │
  │    * User generates an UltraPlonk proof client-side verifying:         │
  │      a) Membership: The commitment belongs to the pool's Merkle Tree.  │
  │      b) Exclusion: The commitment is NOT in the operator's Bad Set.    │
  │      c) Nullifier: The deterministic nullifier hash prevents double-   │
  │         spending without exposing the secret key.                      │
  │                                                                        │
  │ 3. WITHDRAWAL                                                          │
  │    * User submits the ZK proof, recipient address, and nullifier hash.  │
  │    * The contract validates that the nullifier hasn't been spent and   │
  │      the Merkle root matches.                                          │
  │    * 100 XLM is sent to a fresh recipient address with no on-chain link.│
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology | Role / Purpose |
|---|---|---|
| **Smart Contract** | Soroban (Rust) | On-chain deposit & withdraw execution, incremental Merkle tree calculation, spent nullifier checks, and Bad Set storage. |
| **ZK Circuit** | Noir (Aztec) | Zero-Knowledge DSL circuit verifying membership, exclusion, and nullifier binding. |
| **ZK Backend** | Barretenberg UltraPlonk | Proof generation engine. |
| **Hash Function** | SHA-256 (Demo) / Poseidon2 (Production) | ZK-friendly cryptographic hashing. |
| **Frontend** | Next.js 14, React 18 & TypeScript | User dashboard, wallet connection, and UI states. |
| **Animations** | Framer Motion | Smooth state transitions and simulated proof-progress logs. |
| **State Management**| Zustand v4 | Lightweight wallet, transaction history, and contract status state store. |
| **Wallet** | Freighter Wallet | Browser wallet connection for transaction signing. |

---

## 🚀 Applied Fixes & MVP Optimization

To prepare the MVP for a clean hackathon submission, several critical updates were implemented:

1. **Zustand Store Alignment (`useStore.ts`)**:
   - Integrated Freighter wallet API v2 standard (`freighter.getPublicKey()` and signed XDR string return values).
   - Unified component state requirements, mapping state fields (`note`, `proof`, `isLoading`, `error`, `txHash`) to the transaction and proving lifecycles.
   - Added `refreshStats()` to query active Merkle roots, leaf counts, and bad commitments from Soroban RPC.
2. **Component Parameter Corrections**:
   - Fixed parameter mismatches in [DepositFlow.tsx](file:///Users/toyguntez/Visual%20Studio%20/Stellar-Hackaton/frontend/src/components/app/DepositFlow.tsx) and [WithdrawFlow.tsx](file:///Users/toyguntez/Visual%20Studio%20/Stellar-Hackaton/frontend/src/components/app/WithdrawFlow.tsx) to supply sender wallet addresses and ZK proof values.
   - Added TypeScript type annotations to map functions in the [AssociationSetsSidebar.tsx](file:///Users/toyguntez/Visual%20Studio%20/Stellar-Hackaton/frontend/src/components/app/AssociationSetsSidebar.tsx) component.
3. **Next.js & ES2020 Target Fixes**:
   - Upgraded compiler target to `ES2020` in `tsconfig.json` and adjusted BigInt literal definitions to bypass environment compatibility issues.
   - Migrated Next configuration to `next.config.mjs` to fully support Next.js 14.
4. **Markdown & Code Cleanups**:
   - Removed broken HTML/XML CDATA wrappers (`<![CDATA[` and `]]>`) from the [README.md](file:///Users/toyguntez/Visual%20Studio%20/Stellar-Hackaton/README.md), [THREAT_MODEL.md](file:///Users/toyguntez/Visual%20Studio%20/Stellar-Hackaton/docs/THREAT_MODEL.md), and deployment scripts to ensure beautiful GitHub rendering and executable shell commands.
   - Added a root `.gitignore` to ensure dependencies and Next build outputs are not committed to Git.

---

## 🏆 Hackathon & Demo Notes

* **ZK Proof Simulation**: Client-side proof generation is currently simulated with realistic delay logs to demonstrate UX. In production, this compiles to WebAssembly (WASM) for client-side proving.
* **On-chain Verification**: The Soroban contract currently verifies nullifier uniqueness and Merkle root correctness; full on-chain Plonk proof verification is deferred to future precompile features on Stellar.
* **Bad Set Capacity**: The demo limits association sets to 16 entries per exclusion proof to optimize storage footprint on the Testnet.
