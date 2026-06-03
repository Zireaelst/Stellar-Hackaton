use dep::std;

global TREE_DEPTH: u32 = 20;
global BAD_SET_SIZE: u32 = 16;

fn compute_merkle_root(
    leaf: Field,
    path_elements: [Field; 20],
    path_indices: [u1; 20]
) -> Field {
    let mut current = leaf;
    for i in 0..TREE_DEPTH {
        let (left, right) = if path_indices[i] == 0 {
            (current, path_elements[i])
        } else {
            (path_elements[i], current)
        };
        current = std::hash::poseidon2::Poseidon2::hash([left, right], 2);
    }
    current
}

fn main(
    nullifier: Field,
    secret: Field,
    path_elements: [Field; 20],
    path_indices: [u1; 20],
    bad_commitments: [Field; 16],
    root: pub Field,
    nullifier_hash: pub Field,
    recipient: pub Field,
) {
    // Compute the commitment from nullifier and secret
    let commitment = std::hash::poseidon2::Poseidon2::hash([nullifier, secret], 2);

    // Verify the nullifier hash matches
    let computed_nullifier_hash = std::hash::poseidon2::Poseidon2::hash([nullifier], 1);
    assert(computed_nullifier_hash == nullifier_hash, "Nullifier hash mismatch: invalid withdrawal note");

    // Verify Merkle membership
    let computed_root = compute_merkle_root(commitment, path_elements, path_indices);
    assert(computed_root == root, "Merkle membership proof failed: commitment not in tree");

    // Verify exclusion from bad set
    for i in 0..BAD_SET_SIZE {
        assert(commitment != bad_commitments[i], "Exclusion proof failed: commitment is in flagged set");
    }
}
