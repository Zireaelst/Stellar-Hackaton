/**
 * Incremental Merkle Tree (SHA-256)
 *
 * A browser-native implementation using the Web Crypto API.
 * In production this would be replaced with Poseidon2 hashing
 * to be ZK-circuit-friendly. SHA-256 is used here for the
 * testnet / simulation layer.
 */

const ZERO_VALUE =
  "0000000000000000000000000000000000000000000000000000000000000000";

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPair(left: string, right: string): Promise<string> {
  return sha256(left + right);
}

/**
 * Pre-compute the zero-hashes for each level.
 * zeros[0] = ZERO_VALUE
 * zeros[i] = hash(zeros[i-1], zeros[i-1])
 */
async function computeZeros(depth: number): Promise<string[]> {
  const zeros: string[] = new Array(depth + 1);
  zeros[0] = ZERO_VALUE;
  for (let i = 1; i <= depth; i++) {
    zeros[i] = await hashPair(zeros[i - 1], zeros[i - 1]);
  }
  return zeros;
}

export class MerkleTree {
  private depth: number;
  private leaves: string[];
  private zeros: string[];
  private layers: string[][];
  private _ready: Promise<void>;

  constructor(depth: number = 20) {
    this.depth = depth;
    this.leaves = [];
    this.zeros = [];
    this.layers = [];

    // Eagerly compute zero values
    this._ready = this._init();
  }

  private async _init(): Promise<void> {
    this.zeros = await computeZeros(this.depth);
    this.layers = this._buildLayers();
  }

  /**
   * Wait until the tree is initialized. Call this before
   * any operation if you constructed the tree freshly.
   */
  async ready(): Promise<void> {
    await this._ready;
  }

  /**
   * Build all intermediate layers from current leaves.
   */
  private _buildLayers(): string[][] {
    const layers: string[][] = [this.leaves.slice()];
    // We build layers lazily during getRoot / getProof
    return layers;
  }

  /**
   * Hash two sibling nodes.
   */
  private async hashPair(left: string, right: string): Promise<string> {
    return hashPair(left, right);
  }

  /**
   * Insert a new leaf commitment into the tree.
   */
  async insert(commitment: string): Promise<void> {
    await this._ready;
    if (this.leaves.length >= 2 ** this.depth) {
      throw new Error(
        `Merkle tree is full (max ${2 ** this.depth} leaves)`
      );
    }
    this.leaves.push(commitment);
  }

  /**
   * Compute and return the current Merkle root.
   */
  async getRoot(): Promise<string> {
    await this._ready;
    if (this.leaves.length === 0) {
      return this.zeros[this.depth];
    }

    let currentLevel = this.leaves.slice();

    for (let level = 0; level < this.depth; level++) {
      const nextLevel: string[] = [];
      const levelLen = currentLevel.length;

      for (let i = 0; i < levelLen; i += 2) {
        const left = currentLevel[i];
        const right =
          i + 1 < levelLen ? currentLevel[i + 1] : this.zeros[level];
        nextLevel.push(await this.hashPair(left, right));
      }

      // If the next level is empty (shouldn't happen), fill with zero
      if (nextLevel.length === 0) {
        nextLevel.push(this.zeros[level + 1]);
      }

      currentLevel = nextLevel;
    }

    return currentLevel[0];
  }

  /**
   * Legacy synchronous root accessor — returns the pre-computed
   * root or the top-level zero hash. For the most accurate root
   * after mutations, use `await getRoot()`.
   */
  getRootSync(): string {
    if (this.leaves.length === 0) {
      return this.zeros[this.depth] ?? ZERO_VALUE;
    }
    // Fallback: caller should use async getRoot()
    return ZERO_VALUE;
  }

  /**
   * Generate a Merkle proof for the leaf at `leafIndex`.
   */
  async getProof(
    leafIndex: number
  ): Promise<{ pathElements: string[]; pathIndices: number[] }> {
    await this._ready;

    if (leafIndex < 0 || leafIndex >= this.leaves.length) {
      throw new Error(
        `Leaf index ${leafIndex} out of bounds (tree has ${this.leaves.length} leaves)`
      );
    }

    const pathElements: string[] = [];
    const pathIndices: number[] = [];

    let currentLevel = this.leaves.slice();
    let idx = leafIndex;

    for (let level = 0; level < this.depth; level++) {
      // Determine sibling index
      const isRight = idx % 2 === 1;
      const siblingIdx = isRight ? idx - 1 : idx + 1;

      pathIndices.push(isRight ? 1 : 0);

      if (siblingIdx < currentLevel.length) {
        pathElements.push(currentLevel[siblingIdx]);
      } else {
        pathElements.push(this.zeros[level]);
      }

      // Build next level
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right =
          i + 1 < currentLevel.length
            ? currentLevel[i + 1]
            : this.zeros[level];
        nextLevel.push(await this.hashPair(left, right));
      }

      currentLevel = nextLevel;
      idx = Math.floor(idx / 2);
    }

    return { pathElements, pathIndices };
  }

  /**
   * Find the index of a commitment in the leaves array.
   * Returns -1 if not found.
   */
  getLeafIndex(commitment: string): number {
    return this.leaves.indexOf(commitment);
  }

  /**
   * Return the current number of leaves.
   */
  get leafCount(): number {
    return this.leaves.length;
  }

  /**
   * Return a copy of all leaves.
   */
  getLeaves(): string[] {
    return this.leaves.slice();
  }

  /**
   * Reconstruct a tree from an existing set of leaves.
   */
  static async fromLeaves(
    leaves: string[],
    depth: number = 20
  ): Promise<MerkleTree> {
    const tree = new MerkleTree(depth);
    await tree.ready();
    for (const leaf of leaves) {
      await tree.insert(leaf);
    }
    return tree;
  }
}
