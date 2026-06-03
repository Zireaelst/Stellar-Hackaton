/**
 * ZK Proof Generation (Simulation Layer)
 *
 * This module simulates zero-knowledge proof generation for the
 * testnet prototype. In production, the proof generation would be
 * done via a compiled Noir circuit (see commented section at bottom).
 *
 * All cryptographic primitives use the Web Crypto API (SHA-256).
 */

// ── Types ─────────────────────────────────────────────────────────

export interface Note {
  nullifier: string;
  secret: string;
  commitment: string;
  timestamp: number;
}

export interface ZKProof {
  proof: string;
  publicInputs: string[];
  verified: boolean;
}

export type ProofStepCallback = (step: number, label: string) => void;

// ── Helpers ───────────────────────────────────────────────────────

const STORAGE_KEY = "stellarveil_note";

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Core Functions ────────────────────────────────────────────────

/**
 * Generate a fresh deposit note.
 *
 * - `nullifier`: random 31 bytes — used to prevent double-spending.
 * - `secret`: random 31 bytes — known only to the depositor.
 * - `commitment`: SHA-256(nullifier || secret) — stored on-chain.
 *
 * The note is persisted to localStorage so the user can withdraw later.
 */
export async function generateNote(): Promise<Note> {
  const nullifier = randomHex(31);
  const secret = randomHex(31);
  const commitment = await sha256(nullifier + secret);

  const note: Note = {
    nullifier,
    secret,
    commitment,
    timestamp: Date.now(),
  };

  // Persist to localStorage for later retrieval during withdrawal
  if (typeof window !== "undefined") {
    try {
      // Store as a list so multiple notes can coexist
      const existing = loadAllNotes();
      existing.push(note);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch {
      // Storage might be full or unavailable — note is still returned
      console.warn("Failed to persist note to localStorage");
    }
  }

  return note;
}

/**
 * Simulate ZK proof generation with realistic step progression.
 *
 * The 8-step pipeline mirrors what a real Noir prover would do:
 *   1. Load circuit artifacts
 *   2. Prepare witness inputs
 *   3. Compute commitment hash
 *   4. Compute nullifier hash
 *   5. Build Merkle inclusion witness
 *   6. Generate constraint system
 *   7. Compute proof polynomials
 *   8. Finalize & serialize proof
 *
 * @param nullifier  The note nullifier
 * @param secret     The note secret
 * @param root       Current Merkle root
 * @param pathElements  Merkle proof path elements
 * @param pathIndices   Merkle proof path indices (0 = left, 1 = right)
 * @param onStep     Optional callback for UI progress updates
 */
export async function generateProof(
  nullifier: string,
  secret: string,
  root: string,
  pathElements: string[],
  pathIndices: number[],
  onStep?: ProofStepCallback
): Promise<ZKProof> {
  const steps: [number, string][] = [
    [300, "Loading circuit artifacts"],
    [200, "Preparing witness inputs"],
    [400, "Computing commitment hash"],
    [350, "Computing nullifier hash"],
    [500, "Building Merkle inclusion witness"],
    [600, "Generating constraint system"],
    [800, "Computing proof polynomials"],
    [400, "Finalizing & serializing proof"],
  ];

  for (let i = 0; i < steps.length; i++) {
    const [duration, label] = steps[i];
    onStep?.(i + 1, label);
    await delay(duration);
  }

  // Deterministic proof derivation so the same inputs always
  // produce the same proof (useful for testing / replay).
  const nullifierHash = await computeNullifierHash(nullifier);
  const commitment = await sha256(nullifier + secret);

  // Build a deterministic "proof" blob from the inputs
  const proofSeed = await sha256(
    nullifier + secret + root + pathElements.join("") + pathIndices.join("")
  );
  const proofBytes = await sha256(proofSeed + "proof_v1");

  // Public inputs that would accompany the proof on-chain:
  //   [0] nullifierHash — to prevent double-spend
  //   [1] root — the Merkle root the proof was generated against
  //   [2] commitment — the leaf commitment (for association-set checks)
  const publicInputs = [nullifierHash, root, commitment];

  return {
    proof: proofBytes,
    publicInputs,
    verified: true,
  };
}

/**
 * Compute the nullifier hash: SHA-256(SHA-256(nullifier)).
 * Double-hashing prevents the raw nullifier from being recoverable
 * from the on-chain nullifier hash.
 */
export async function computeNullifierHash(
  nullifier: string
): Promise<string> {
  const first = await sha256(nullifier);
  return sha256(first);
}

/**
 * Compute a commitment from nullifier + secret.
 * commitment = SHA-256(nullifier || secret)
 */
export async function computeCommitment(
  nullifier: string,
  secret: string
): Promise<string> {
  return sha256(nullifier + secret);
}

/**
 * Load the most recently saved note from localStorage.
 */
export function loadSavedNote(): Note | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const notes: Note[] = JSON.parse(raw);
    if (!Array.isArray(notes) || notes.length === 0) return null;
    // Return the most recent note
    return notes[notes.length - 1];
  } catch {
    return null;
  }
}

/**
 * Load all saved notes from localStorage.
 */
export function loadAllNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const notes: Note[] = JSON.parse(raw);
    return Array.isArray(notes) ? notes : [];
  } catch {
    return [];
  }
}

/**
 * Remove all saved notes from localStorage.
 */
export function clearSavedNote(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Remove a specific note by its commitment.
 */
export function removeNoteByCommitment(commitment: string): void {
  if (typeof window === "undefined") return;
  try {
    const notes = loadAllNotes();
    const filtered = notes.filter((n) => n.commitment !== commitment);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore
  }
}

/* ──────────────────────────────────────────────────────────────────
 * PRODUCTION NOIR INTEGRATION (commented out)
 *
 * In production, replace `generateProof` with actual Noir proving:
 *
 * ```typescript
 * import { Noir } from '@noir-lang/noir_js';
 * import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
 * import circuit from '../circuits/privacy_pool.json';
 *
 * export async function generateProofNoir(
 *   nullifier: string,
 *   secret: string,
 *   root: string,
 *   pathElements: string[],
 *   pathIndices: number[],
 *   recipient: string,
 *   onStep?: ProofStepCallback
 * ): Promise<ZKProof> {
 *   onStep?.(1, 'Initializing Barretenberg backend');
 *   const backend = new BarretenbergBackend(circuit);
 *
 *   onStep?.(2, 'Setting up Noir instance');
 *   const noir = new Noir(circuit, backend);
 *
 *   onStep?.(3, 'Preparing inputs');
 *   const inputs = {
 *     nullifier: `0x${nullifier}`,
 *     secret: `0x${secret}`,
 *     root: `0x${root}`,
 *     path_elements: pathElements.map(e => `0x${e}`),
 *     path_indices: pathIndices,
 *     recipient: `0x${recipient}`,
 *   };
 *
 *   onStep?.(4, 'Generating witness');
 *   const { witness } = await noir.execute(inputs);
 *
 *   onStep?.(5, 'Computing proof');
 *   const proof = await backend.generateProof(witness);
 *
 *   onStep?.(6, 'Verifying proof locally');
 *   const verified = await backend.verifyProof(proof);
 *
 *   return {
 *     proof: Buffer.from(proof.proof).toString('hex'),
 *     publicInputs: proof.publicInputs.map(String),
 *     verified,
 *   };
 * }
 * ```
 * ────────────────────────────────────────────────────────────────── */
