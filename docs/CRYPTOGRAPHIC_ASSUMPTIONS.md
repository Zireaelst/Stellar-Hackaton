<![CDATA[# StellarVeil — Cryptographic Assumptions

## Overview

This document details the cryptographic primitives, assumptions, and security guarantees underpinning the StellarVeil privacy pool protocol.

## 1. Hash Functions

### Poseidon2 (Production / ZK Circuit)

**Usage**: Commitment generation and Merkle tree hashing inside the ZK circuit.

**Specification**: Poseidon2 is an algebraic hash function optimized for zero-knowledge proof systems, designed by Grassi et al. (2023).

| Property | Details |
|----------|---------|
| **Type** | Algebraic sponge construction |
| **Field** | BN254 scalar field (≈254 bits) |
| **Security Level** | 128-bit |
| **Collision Resistance** | 2^128 operations |
| **Preimage Resistance** | 2^254 operations |
| **R1CS Constraints** | ~300 per hash (vs ~25,000 for SHA-256) |

**Why Poseidon2 over SHA-256 in ZK**:
- SHA-256 requires ~25,000 R1CS constraints per hash operation inside a SNARK circuit
- Poseidon2 requires ~300 constraints — an 80x improvement
- This dramatically reduces proof generation time and proof size
- The Merkle tree has depth 20, requiring 20 hash operations per proof → 6,000 vs 500,000 constraints

**Security Assumption**: Poseidon2 hash function is collision-resistant and pre-image resistant in the BN254 scalar field.

### SHA-256 (Hackathon Demo)

**Usage**: Commitment generation and Merkle tree hashing in the smart contract and frontend (hackathon only).

| Property | Details |
|----------|---------|
| **Type** | Merkle-Damgård construction |
| **Output** | 256 bits |
| **Security Level** | 128-bit (collision), 256-bit (preimage) |
| **NIST Standard** | FIPS 180-4 |

**Note**: SHA-256 is used in the hackathon demo because:
1. Soroban natively provides `env.crypto().sha256()`
2. Web Crypto API provides `crypto.subtle.digest('SHA-256', ...)`
3. No additional libraries needed

**Production**: Will be replaced with Poseidon2 across all components for consistency with the ZK circuit.

---

## 2. Zero-Knowledge Proof System

### UltraPlonk (Barretenberg Backend)

**Usage**: Generating and verifying ZK proofs of membership, exclusion, and nullifier binding.

| Property | Details |
|----------|---------|
| **Proof System** | UltraPlonk (Aztec/Barretenberg) |
| **Setup** | Universal (updatable) Structured Reference String |
| **Proof Size** | ~2 KB |
| **Verification Time** | ~5ms |
| **Proving Time** | ~3-5 seconds (client-side WASM) |
| **Security** | 128-bit, based on discrete log in elliptic curves |

**Security Assumptions**:

1. **Knowledge Soundness**: An adversary cannot produce a valid proof without knowing a valid witness (nullifier, secret, Merkle path) except with negligible probability.

2. **Zero-Knowledge**: The proof reveals nothing about the private inputs beyond the truth of the statement. Specifically:
   - The verifier learns nothing about which commitment is the prover's
   - The verifier learns nothing about the nullifier or secret values
   - The verifier only learns: "there exists a valid commitment in the tree that is not in the bad set"

3. **Simulation Extractability**: Even after seeing other proofs, an adversary cannot forge a proof for a false statement.

**Circuit Constraints**:

```
┌─────────────────────────────────────────────────────┐
│                  CIRCUIT BREAKDOWN                    │
├─────────────────────────────────────────────────────┤
│ Component              │ Constraints (approx.)       │
├────────────────────────┼────────────────────────────┤
│ Commitment hash        │ ~300 (1 Poseidon2)          │
│ Nullifier hash         │ ~300 (1 Poseidon2)          │
│ Merkle path (depth 20) │ ~6,000 (20 Poseidon2)       │
│ Bad set exclusion (16) │ ~16 (16 field comparisons)  │
│ Public input binding   │ ~3 (3 equality checks)      │
├────────────────────────┼────────────────────────────┤
│ TOTAL                  │ ~6,619 constraints           │
└─────────────────────────────────────────────────────┘
```

---

## 3. Commitment Scheme

### Pedersen-like Commitment via Poseidon2

**Construction**: `commitment = Poseidon2(nullifier, secret)`

| Property | Guarantee |
|----------|-----------|
| **Hiding** | Given `commitment`, an adversary cannot determine `nullifier` or `secret` (preimage resistance) |
| **Binding** | An adversary cannot find two different `(nullifier, secret)` pairs that produce the same commitment (collision resistance) |
| **Deterministic** | Same inputs always produce the same commitment |

**Nullifier Derivation**: `nullifier_hash = Poseidon2(nullifier)`

This is a one-way derivation:
- Anyone who sees `nullifier_hash` cannot recover `nullifier`
- But anyone with `nullifier` can verify it matches `nullifier_hash`
- The contract stores `nullifier_hash` to prevent double-spend without learning `nullifier`

---

## 4. Incremental Merkle Tree

### Construction

**Type**: Binary hash tree with incremental insertion

| Property | Details |
|----------|---------|
| **Depth** | 20 levels |
| **Capacity** | 2^20 = 1,048,576 leaves |
| **Leaf** | `commitment = Poseidon2(nullifier, secret)` |
| **Internal Node** | `Poseidon2(left_child, right_child)` |
| **Empty Leaf** | `0` (field element zero) |
| **Root** | Top hash — publicly stored on-chain |

### Security Properties

1. **Membership Proof**: Given a leaf and its sibling path, anyone can verify the leaf belongs to the tree by recomputing the root.

2. **Non-Membership**: Without the correct sibling path, an adversary cannot construct a valid membership proof for a leaf not in the tree.

3. **Binding**: Changing any leaf changes the root (collision resistance of hash function).

4. **Path Independence**: The proof for one leaf reveals nothing about other leaves.

### Zero Hashes

Empty positions in the tree use pre-computed "zero hashes":

```
Level 0 (leaf):     zero_0 = 0
Level 1:            zero_1 = Poseidon2(zero_0, zero_0)
Level 2:            zero_2 = Poseidon2(zero_1, zero_1)
...
Level 20 (root):    zero_20 = Poseidon2(zero_19, zero_19)
```

These are constant and can be pre-computed once.

---

## 5. Association Sets

### Formal Definition

Following Buterin et al. (2023):

Let `D = {d_1, d_2, ..., d_n}` be the set of all deposits (commitments) in the pool.

Let `B ⊂ D` be the "bad set" of flagged/sanctioned deposits.

Let `C = D \ B` be the "clean set" (complement of bad set).

**Exclusion Proof**: A user proves `d_i ∈ D ∧ d_i ∉ B` without revealing `i`.

This is equivalent to proving `d_i ∈ C` — the user's deposit is in the clean set.

### Privacy Guarantee

The anonymity set for a withdrawal is `|C|` — the number of clean deposits. An observer knows the withdrawer is one of the clean depositors but cannot determine which one.

### Compliance Guarantee

The exclusion proof guarantees the withdrawer's funds did not come from any deposit in the bad set. This is a cryptographic proof, not a trust-based assertion.

---

## 6. Random Number Generation

### Note Generation

**Method**: `crypto.getRandomValues(new Uint8Array(32))`

| Property | Details |
|----------|---------|
| **Entropy Source** | OS-provided CSPRNG |
| **Output** | 256 bits per value |
| **Standard** | Web Crypto API (W3C) |

**Security Assumption**: The browser's CSPRNG provides uniformly random, unpredictable output.

**Threats**:
- Weak PRNG in outdated browsers → mitigation: require modern browsers
- CSPRNG compromise at OS level → mitigation: outside protocol scope
- Insufficient entropy at boot time → mitigation: `getRandomValues` blocks until entropy is available

---

## 7. Assumptions Summary

| # | Assumption | Consequence if Broken |
|---|-----------|----------------------|
| 1 | Poseidon2 is collision-resistant | Attacker could forge commitments |
| 2 | Poseidon2 is preimage-resistant | Attacker could recover nullifier/secret from commitment |
| 3 | UltraPlonk is knowledge-sound | Attacker could withdraw without valid deposit |
| 4 | UltraPlonk is zero-knowledge | Privacy of depositor is compromised |
| 5 | Discrete log is hard (BN254) | Proof system is broken entirely |
| 6 | Browser CSPRNG is secure | Attacker could predict nullifiers/secrets |
| 7 | SHA-256 is collision-resistant | (Hackathon only) Merkle tree integrity compromised |

All assumptions are standard and widely accepted in the cryptography community. Poseidon2 and UltraPlonk have been extensively analyzed and are used in production systems (Aztec, Polygon zkEVM).

---

## References

1. Buterin, V., Illum, J., Nadler, M., Schär, F., & Schmid, A. (2023). "Blockchain Privacy and Regulatory Compliance: Towards a Practical Equilibrium." SSRN.
2. Grassi, L., et al. (2023). "Poseidon2: A Faster Version of the Poseidon Hash Function."
3. Gabizon, A., Williamson, Z.J., & Ciobotaru, O. (2019). "PLONK: Permutations over Lagrange-bases for Oecumenical Noninteractive arguments of Knowledge."
4. Aztec Protocol. "Barretenberg: A C++ library for SNARK proving." GitHub.
5. NIST. "FIPS 180-4: Secure Hash Standard (SHS)." 2015.
]]>
