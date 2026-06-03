# StellarVeil — Threat Model

## Overview

This document analyzes the security threats, attack vectors, and mitigations for the StellarVeil privacy pool protocol. The analysis covers both the hackathon demo implementation and the production target architecture.

## Threat Categories

### 1. Double-Spend Attacks

**Threat**: A user attempts to withdraw the same deposit multiple times.

**Attack Vector**: Submit multiple withdrawal transactions using the same note (nullifier + secret).

**Mitigation**:
- **Nullifier Hash Tracking**: The contract stores `Nullifier(hash) = true` after each withdrawal.
- **On-chain Check**: `withdraw()` panics if `nullifier_hash` has been used before.
- **Deterministic Binding**: `nullifier_hash = Poseidon2(nullifier)` is deterministic — same nullifier always produces same hash.
- **ZK Constraint**: The circuit enforces `computed_nullifier_hash == nullifier_hash`, ensuring the nullifier used in the commitment matches the one revealed.

**Risk Level**: 🟢 **Mitigated** — On-chain nullifier tracking prevents all double-spend attempts.

---

### 2. Front-Running Attacks

**Threat**: An attacker observes a withdrawal transaction in the mempool and substitutes their own recipient address.

**Attack Vector**: 
1. Eve monitors pending transactions
2. Alice submits `withdraw(nullifier_hash, alice_address, root)`
3. Eve submits `withdraw(nullifier_hash, eve_address, root)` with higher fees

**Mitigation**:
- **Recipient Binding**: The `recipient` field is a public input to the ZK proof. The proof is only valid for the specific recipient address used during proof generation.
- **Production**: On-chain verifier checks that the recipient in the proof matches the recipient in the transaction.
- **Hackathon**: The contract checks `root` matches, but doesn't verify the full proof. Front-running is theoretically possible in demo mode since the proof isn't verified on-chain.

**Risk Level**: 🟡 **Partially Mitigated** (hackathon) / 🟢 **Fully Mitigated** (production with on-chain verifier)

---

### 3. Linkability / Deanonymization

**Threat**: An observer links a deposit transaction to a withdrawal transaction, breaking privacy.

**Attack Vectors**:

| Vector | Description | Mitigation |
|--------|-------------|------------|
| **Amount correlation** | Different amounts make deposits/withdrawals linkable | Fixed denomination (100 XLM) eliminates this |
| **Timing correlation** | Immediate withdraw after deposit | Users should wait; protocol doesn't enforce timing |
| **IP correlation** | Same IP for deposit and withdraw | User responsibility; recommend Tor/VPN |
| **Gas analysis** | Fee patterns reveal identity | Stellar fees are uniform and minimal |
| **Unique interactions** | Few deposits make anonymity set small | Anonymity set grows with pool usage |
| **Merkle path analysis** | Observer reconstructs which leaf was used | ZK proof hides the leaf index |

**Risk Level**: 🟡 **Partially Mitigated** — Protocol handles on-chain linkability; off-chain vectors (IP, timing) require user operational security.

---

### 4. Malicious Operator (Bad Set Management)

**Threat**: The operator maliciously flags legitimate deposits or refuses to flag sanctioned ones.

**Attack Vectors**:
- Operator flags all deposits → nobody can withdraw
- Operator colludes with sanctioned entities → doesn't flag their deposits
- Operator front-runs: flags a deposit right before legitimate withdrawal

**Mitigation** (Hackathon):
- Single trusted operator for demo simplicity
- Operator actions emit on-chain events for transparency

**Mitigation** (Production):
- **DAO Governance**: Multiple signers required to modify bad set
- **Time-locks**: Bad set changes have a delay, allowing users to withdraw first
- **Appeals Process**: Flagged users can challenge via governance
- **Multiple ASPs**: Association Set Providers compete; users choose which to trust

**Risk Level**: 🔴 **High Risk** (hackathon — centralized operator) / 🟡 **Moderate** (production with governance)

---

### 5. Merkle Tree Manipulation

**Threat**: An attacker manipulates the Merkle tree to include fake commitments or exclude legitimate ones.

**Attack Vectors**:
- Submit a fake commitment that matches an existing nullifier
- Manipulate tree to change the root

**Mitigation**:
- **Commitment Binding**: `commitment = Poseidon2(nullifier, secret)` — without knowing the nullifier and secret, an attacker cannot create a valid commitment
- **On-chain Storage**: All leaves are stored on-chain and the root is computed deterministically
- **Root Verification**: Withdrawal requires the submitted root to match the stored root
- **Collision Resistance**: Poseidon2 (production) / SHA-256 (hackathon) are collision-resistant

**Risk Level**: 🟢 **Mitigated** — Cryptographic hash collision resistance prevents manipulation.

---

### 6. Note Compromise

**Threat**: An attacker gains access to a user's note (nullifier + secret).

**Attack Vectors**:
- Malware on user's device reads localStorage
- Phishing site collects notes
- User accidentally shares note

**Mitigation**:
- **Client-side only**: Notes are generated and stored entirely in the browser
- **No server transmission**: Notes never leave the client
- **User warnings**: UI prominently warns users to save notes securely
- **Immediate withdrawal**: Users can withdraw immediately after deposit to minimize exposure window

**Recommendations**:
- Store notes in a password manager, not just localStorage
- Use a hardware wallet for signing (Freighter supports Ledger)
- Clear browser data on shared/public computers

**Risk Level**: 🟡 **User Responsibility** — Protocol cannot prevent client-side key theft.

---

### 7. Smart Contract Vulnerabilities

**Threat**: Bugs in the Soroban contract allow unauthorized fund extraction.

**Attack Vectors**:
- Integer overflow in denomination calculations
- Re-entrancy in withdraw flow
- Storage manipulation via unexpected inputs

**Mitigation**:
- **Overflow checks**: Rust's `overflow-checks = true` in release profile
- **No re-entrancy**: Soroban's execution model prevents re-entrancy by design
- **Auth checks**: `require_auth()` on all state-changing operations
- **Initialization guard**: `initialize()` can only be called once
- **Type safety**: Rust's type system + Soroban SDK enforce correct types

**Risk Level**: 🟢 **Low Risk** — Soroban's design and Rust's safety features provide strong guarantees.

---

### 8. ZK Proof Soundness (Hackathon-Specific)

**Threat**: The simulated ZK proof in the hackathon demo doesn't provide real cryptographic guarantees.

**Current State**:
- ZK proofs are **simulated** client-side (deterministic hash outputs, not real SNARK proofs)
- The contract does **not** verify proofs on-chain
- The contract only checks nullifier freshness and root match

**Impact**:
- Anyone who knows a valid nullifier_hash could submit a withdrawal
- No actual zero-knowledge property in the demo
- The membership and exclusion proofs are not enforced

**Production Mitigation**:
- Compile Noir circuit to WASM for real Barretenberg proofs
- Implement on-chain SNARK verifier in Soroban
- Reference: NethermindEth/stellar-private-payments for Stellar ZK verification

**Risk Level**: 🔴 **High Risk** (hackathon — simulated proofs) / 🟢 **Mitigated** (production with real ZK)

---

## Threat Matrix Summary

| # | Threat | Hackathon | Production | Priority |
|---|--------|-----------|------------|----------|
| 1 | Double-Spend | 🟢 Mitigated | 🟢 Mitigated | — |
| 2 | Front-Running | 🟡 Partial | 🟢 Mitigated | High |
| 3 | Linkability | 🟡 Partial | 🟡 Partial | Medium |
| 4 | Malicious Operator | 🔴 High | 🟡 Moderate | Critical |
| 5 | Merkle Manipulation | 🟢 Mitigated | 🟢 Mitigated | — |
| 6 | Note Compromise | 🟡 User | 🟡 User | Medium |
| 7 | Contract Bugs | 🟢 Low | 🟢 Low | — |
| 8 | Proof Soundness | 🔴 Simulated | 🟢 Real ZK | Critical |

## Recommendations for Production

1. **Replace simulated proofs with real Noir/Barretenberg WASM proving**
2. **Implement on-chain SNARK verification**
3. **Decentralize bad set management via multi-sig DAO**
4. **Add time-locks to bad set modifications**
5. **Audit contract with a reputable security firm**
6. **Implement rate limiting on deposits to prevent spam**
7. **Add relay network for withdrawal submission (hide IP)**
8. **Implement compliance dashboard for regulatory reporting**

