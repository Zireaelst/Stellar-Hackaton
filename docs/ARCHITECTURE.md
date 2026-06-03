<![CDATA[# StellarVeil — System Architecture

## Overview

StellarVeil is a compliance-aware privacy pool protocol deployed on the Stellar Testnet. It implements the Privacy Pools concept from Buterin et al. (2023), enabling users to privately withdraw deposited funds while proving that their deposits are not associated with flagged/sanctioned sources.

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              USER BROWSER                               │
│                                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  Next.js     │  │  ZK Prover   │  │  Merkle Tree │  │  Zustand    │  │
│  │  Frontend    │  │  (Noir/BB)   │  │  (Client)    │  │  Store      │  │
│  │             │──│  Client-side │──│  Mirrored    │──│  State Mgmt │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └─────────────┘  │
│         │                │                  │                            │
│  ┌──────┴──────────────────────────────────┴───────┐                    │
│  │              Freighter Wallet (Signing)          │                    │
│  └──────────────────────┬──────────────────────────┘                    │
│                         │                                                │
└─────────────────────────┼────────────────────────────────────────────────┘
                          │ Signed Transactions
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        STELLAR TESTNET                                  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Soroban Smart Contract                       │   │
│  │                                                                  │   │
│  │  ┌────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │   │
│  │  │  Deposit()  │  │  Withdraw()  │  │  Association Set Mgmt   │  │   │
│  │  │  • Auth     │  │  • Nullifier │  │  • add_to_bad_set()    │  │   │
│  │  │  • Transfer │  │  • Root chk  │  │  • remove_from_bad_set()│  │   │
│  │  │  • Merkle   │  │  • Transfer  │  │  • is_in_bad_set()     │  │   │
│  │  └────────────┘  └──────────────┘  └─────────────────────────┘  │   │
│  │                                                                  │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │                   Storage Layer                             │  │   │
│  │  │  • Merkle Root (BytesN<32>)                                │  │   │
│  │  │  • Leaf Storage (Map<u32, BytesN<32>>)                     │  │   │
│  │  │  • Nullifier Set (Map<BytesN<32>, bool>)                   │  │   │
│  │  │  • Bad Set (Map<BytesN<32>, bool>)                         │  │   │
│  │  │  • Configuration (operator, token, denomination)            │  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐                            │
│  │  Horizon API      │  │  Soroban RPC      │                            │
│  │  (Account/Balance)│  │  (Contract Calls) │                            │
│  └──────────────────┘  └──────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. ZK Circuit (Noir)

**Location**: `circuits/privacy_pool/src/main.nr`

The Noir circuit enforces three constraints:

| Constraint | Purpose | Implementation |
|-----------|---------|----------------|
| **Membership Proof** | Prove commitment exists in tree | Merkle path verification against public root |
| **Exclusion Proof** | Prove commitment ∉ bad set | Iterate bad set, assert inequality |
| **Nullifier Binding** | Prevent double-spend | `nullifier_hash = Poseidon2(nullifier)` |

**Private Inputs** (hidden from verifier):
- `nullifier` — random 32-byte secret
- `secret` — second 32-byte secret
- `path_elements[20]` — Merkle sibling hashes
- `path_indices[20]` — left/right indicators per level
- `bad_commitments[16]` — current flagged set

**Public Inputs** (revealed to contract):
- `root` — current Merkle root (verified on-chain)
- `nullifier_hash` — derived from nullifier (stored to prevent reuse)
- `recipient` — withdrawal address (prevents front-running)

### 2. Soroban Smart Contract

**Location**: `contracts/privacy-pool/src/`

The contract manages on-chain state without knowledge of who deposited what:

```
initialize() → Sets operator, token, denomination
deposit()    → Receives funds, stores commitment, updates Merkle root
withdraw()   → Verifies nullifier fresh + root match, sends funds
add_to_bad_set()    → Operator flags a commitment
remove_from_bad_set() → Operator unflags (false positive correction)
```

**Storage Design**:

| Key | Type | Purpose |
|-----|------|---------|
| `Operator` | `Address` | Account that manages the bad set |
| `Token` | `Address` | XLM native token contract |
| `Denomination` | `i128` | Fixed deposit amount (100 XLM = 1B stroops) |
| `MerkleRoot` | `BytesN<32>` | Current root of commitment tree |
| `LeafCount` | `u32` | Number of deposits |
| `Leaf(n)` | `BytesN<32>` | Commitment at index n |
| `Nullifier(hash)` | `bool` | Whether nullifier has been spent |
| `BadCommitment(hash)` | `bool` | Whether commitment is flagged |
| `BadCount` | `u32` | Number of flagged commitments |

### 3. Frontend Architecture

**Framework**: Next.js 14 with App Router

```
Route Structure:
/           → Landing page (marketing, education)
/app        → DApp interface (deposit, withdraw, monitor)
```

**State Management** (Zustand):
- Wallet connection state
- Note generation & storage
- ZK proof generation progress
- Contract stats (live polling)
- Association set data

**Key Libraries**:
- `@stellar/stellar-sdk` — Transaction building & submission
- `@stellar/freighter-api` — Wallet connection & signing
- `framer-motion` — Page transitions & animations
- `zustand` — Minimal state management

## Data Flow

### Deposit Flow

```
1. User clicks "Generate Note"
   → crypto.getRandomValues(32) × 2 → {nullifier, secret}
   → commitment = SHA256(nullifier || secret)
   → Note saved to localStorage

2. User clicks "Deposit 100 XLM"
   → Build Soroban tx: PrivacyPool.deposit(sender, commitment)
   → Freighter signs transaction
   → Submit to Stellar Testnet
   → Contract: transfer 100 XLM, store leaf, recompute root

3. Frontend confirms deposit
   → Display transaction hash
   → Link to Stellar Expert
```

### Withdrawal Flow

```
1. User enters nullifier + secret from saved note

2. User enters fresh recipient address

3. "Generate ZK Proof" (simulated for hackathon)
   → Compute nullifier_hash = SHA256(nullifier)
   → Fetch Merkle proof from contract
   → Fetch bad set from contract
   → Generate simulated proof with deterministic output
   → Display proof animation

4. "Withdraw 100 XLM"
   → Build Soroban tx: PrivacyPool.withdraw(nullifier_hash, recipient, root)
   → Submit to Stellar Testnet
   → Contract: verify nullifier fresh, verify root, transfer 100 XLM

5. Funds arrive at fresh address with no on-chain link to depositor
```

### Association Set Management

```
Operator Flow:
1. Operator identifies a flagged commitment (off-chain analysis)
2. Calls add_to_bad_set(commitment)
3. Contract stores BadCommitment(hash) = true
4. All future withdrawals must prove exclusion from updated bad set

User Impact:
- Clean users: ZK proof succeeds (their commitment ≠ any bad commitment)
- Flagged users: ZK proof fails (cannot prove exclusion)
- No privacy loss: the proof doesn't reveal which clean deposit is theirs
```

## Security Boundaries

| Boundary | Trust Assumption |
|----------|-----------------|
| Browser ↔ Contract | Freighter wallet signing; user controls keys |
| ZK Proof | Simulated for hackathon; production uses Barretenberg WASM |
| Hash Function | SHA-256 for hackathon; production uses Poseidon2 |
| Bad Set Operator | Centralized for hackathon; production: DAO governance |
| Merkle Tree | Client mirrors on-chain tree; root verified on-chain |

## Production Roadmap

1. **Noir WASM Compilation** — Compile circuit to WASM for real client-side proving
2. **Poseidon2 in Soroban** — Replace SHA-256 with ZK-optimized hash
3. **On-chain Verifier** — Groth16/UltraPlonk verification in Soroban
4. **Variable Denominations** — Support multiple pool sizes
5. **Decentralized Governance** — DAO-controlled bad set management
6. **Cross-chain Proofs** — Verify Stellar proofs on Ethereum and vice versa
]]>
