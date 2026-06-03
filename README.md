<![CDATA[<div align="center">

# 🌑 StellarVeil

### Compliance-Aware Privacy Pools on Stellar

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue?style=flat-square&logo=stellar)](https://stellar.org)
[![Noir](https://img.shields.io/badge/ZK-Noir%20Circuit-purple?style=flat-square)](https://noir-lang.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Hackathon](https://img.shields.io/badge/Build%20On%20Stellar-IBW%202026-orange?style=flat-square)](https://risein.com)

**The first privacy protocol on Stellar that lets you prove your deposit didn't come from sanctioned sources — without revealing which deposit is yours.**

[Launch App](https://stellarveil.vercel.app) · [Read Paper](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4563364) · [Architecture](docs/ARCHITECTURE.md) · [Threat Model](docs/THREAT_MODEL.md)

</div>

---

## 🔬 Academic Foundation

StellarVeil implements the **Privacy Pools** protocol described in:

> **"Blockchain Privacy and Regulatory Compliance: Towards a Practical Equilibrium"**
> *Vitalik Buterin, Jacob Illum, Matthias Nadler, Fabian Schär, Arnold Schmid*
> SSRN 2023 — [Read Paper](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4563364)

**Core Insight:** Tornado Cash provided full privacy but zero compliance — it got sanctioned. Privacy Pools solve this by letting users prove, via ZK proofs, that their deposit did NOT originate from flagged/sanctioned sources — without revealing which deposit is theirs.

## 🏗️ How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        STELLARVEIL FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. DEPOSIT                                                     │
│     User sends 100 XLM → Soroban Contract                      │
│     commitment = Poseidon2(nullifier, secret)                   │
│     commitment → on-chain Merkle tree                           │
│     User saves {nullifier, secret} locally                      │
│                                                                 │
│  2. ZK PROOF (client-side, Noir + Barretenberg)                 │
│     ├── MEMBERSHIP: commitment ∈ Merkle tree                    │
│     ├── EXCLUSION:  commitment ∉ bad set                        │
│     └── NULLIFIER:  nullifier_hash = Poseidon2(nullifier)       │
│                                                                 │
│  3. WITHDRAW                                                    │
│     Submit nullifier_hash + proof + recipient                   │
│     Contract verifies nullifier not spent + root matches        │
│     100 XLM → fresh address (no on-chain link)                  │
│                                                                 │
│  The ZK proof reveals NOTHING about which deposit is yours.     │
│  It only proves: "I deposited, and I'm not flagged."            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📂 Project Structure

```
stellarveil/
├── README.md
├── .env.example
├── docs/
│   ├── ARCHITECTURE.md          # System architecture & data flow
│   ├── THREAT_MODEL.md          # Security analysis & mitigations
│   └── CRYPTOGRAPHIC_ASSUMPTIONS.md  # Crypto primitives & proofs
├── circuits/
│   └── privacy_pool/
│       ├── Nargo.toml            # Noir circuit configuration
│       └── src/
│           └── main.nr           # ZK circuit: membership + exclusion + nullifier
├── contracts/
│   └── privacy-pool/
│       ├── Cargo.toml            # Soroban contract dependencies
│       └── src/
│           ├── lib.rs            # Main contract logic
│           ├── merkle.rs         # Incremental Merkle tree
│           └── types.rs          # Data key definitions
├── scripts/
│   ├── deploy.ts                 # Contract deployment script
│   └── add-bad-commitment.ts     # Operator: flag a commitment
└── frontend/
    ├── package.json
    ├── tailwind.config.ts
    ├── next.config.ts
    ├── tsconfig.json
    └── src/
        ├── app/
        │   ├── layout.tsx         # Root layout with fonts & metadata
        │   ├── page.tsx           # Landing page
        │   ├── globals.css        # Design system & global styles
        │   └── app/
        │       └── page.tsx       # Main DApp interface
        ├── components/
        │   ├── landing/           # 7 landing page sections
        │   ├── app/               # 7 DApp components
        │   └── ui/                # 6 reusable UI components
        ├── lib/
        │   ├── constants.ts       # Network & contract constants
        │   ├── stellar.ts         # Stellar SDK integration
        │   ├── zk.ts              # ZK proof generation (simulated)
        │   └── merkle.ts          # Client-side Merkle tree
        └── store/
            └── useStore.ts        # Zustand global state
```

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Smart Contract** | Soroban (Rust) | On-chain deposit/withdraw logic |
| **ZK Circuit** | Noir (Aztec) | Privacy proofs: membership + exclusion |
| **ZK Backend** | Barretenberg UltraPlonk | Proof generation engine |
| **Hash Function** | Poseidon2 | ZK-optimized commitment hashing |
| **Frontend** | Next.js 14 + TypeScript | App router, SSR |
| **Styling** | Tailwind CSS v3 | Utility-first CSS |
| **Animations** | Framer Motion v11 | Smooth transitions & interactions |
| **Wallet** | Freighter | Stellar browser wallet |
| **State** | Zustand v4 | Lightweight state management |

## 🚀 Quick Start

### Prerequisites

- [Node.js 18+](https://nodejs.org)
- [Rust & Cargo](https://rustup.rs)
- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup)
- [Nargo (Noir compiler)](https://noir-lang.org/docs/getting_started/installation)
- [Freighter Wallet](https://freighter.app) browser extension

### 1. Clone & Install

```bash
git clone https://github.com/stellarveil/stellarveil.git
cd stellarveil

# Install frontend dependencies
cd frontend
npm install
```

### 2. Build the ZK Circuit

```bash
cd circuits/privacy_pool
nargo compile
nargo prove
```

### 3. Build & Deploy the Contract

```bash
# Build the Soroban contract
cd contracts/privacy-pool
cargo build --target wasm32-unknown-unknown --release

# Deploy to Stellar Testnet
cd ../../scripts
STELLAR_SECRET_KEY=your_secret_key npx ts-node deploy.ts
```

### 4. Run the Frontend

```bash
cd frontend
cp ../.env.example .env.local
# Edit .env.local with your contract address
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see StellarVeil.

### 5. Get Testnet XLM

Visit the [Stellar Laboratory](https://lab.stellar.org/account/fund?$=network$id=testnet) to fund your testnet account with free XLM.

## 🧪 Testing

### Contract Tests

```bash
cd contracts/privacy-pool
cargo test
```

### Circuit Tests

```bash
cd circuits/privacy_pool
nargo test
```

## 📊 Association Sets

Association sets are the core innovation from the Privacy Pools paper:

| Set Type | Description | User Action |
|----------|-------------|-------------|
| **Inclusion Set** | Deposits the user wants to be associated with | Prove membership |
| **Exclusion Set** (Bad Set) | Flagged/sanctioned deposits | Prove non-membership |
| **Clean Set** | All deposits minus bad set | Default association |

Users generate ZK proofs proving their deposit is NOT in the exclusion set, without revealing which specific deposit is theirs. This enables:

- ✅ Full transaction privacy (which deposit is mine?)
- ✅ Regulatory compliance (my funds aren't from sanctioned sources)
- ✅ No trusted intermediary (proofs are cryptographic, not based on trust)

## 🔒 Security Considerations

- **Nullifier binding**: Each deposit can only be withdrawn once via unique nullifier hash
- **Merkle membership**: Proves deposit exists without revealing position
- **Front-running protection**: Recipient address is bound to the ZK proof
- **Double-spend prevention**: On-chain nullifier tracking

See [THREAT_MODEL.md](docs/THREAT_MODEL.md) for full security analysis.

## 📄 Cryptographic Assumptions

See [CRYPTOGRAPHIC_ASSUMPTIONS.md](docs/CRYPTOGRAPHIC_ASSUMPTIONS.md) for details on:
- Poseidon2 hash function security
- UltraPlonk proving system
- Incremental Merkle tree construction
- Random number generation for notes

## ⚠️ Hackathon Notes

This project was built at the **Build On Stellar Hackathon — IBW 2026** in Istanbul.

Current limitations for the hackathon demo:
- ZK proof generation is **simulated client-side** (real Noir proofs require WASM compilation)
- Hash function uses **SHA-256** in contract/frontend (production: Poseidon2)
- On-chain proof verification is **deferred** (contract checks nullifier + root only)
- Bad set is limited to **16 entries** per proof

Production roadmap:
- [ ] Compile Noir circuit to WASM for client-side proving
- [ ] Implement Poseidon2 in Soroban (or via precompile)
- [ ] On-chain Groth16/UltraPlonk verifier
- [ ] Variable denomination pools
- [ ] Decentralized bad set governance

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

## 🏆 Hackathon

Built with ❤️ at **Build On Stellar Hackathon — India Blockchain Week 2026** | Istanbul

**Privacy Track** — Implementing compliance-aware privacy pools based on Buterin et al. (2023)

---

<div align="center">
  <sub>StellarVeil — Privacy + Compliance, Together</sub>
</div>
]]>
