use soroban_sdk::{Bytes, BytesN, Env, Vec};

pub const TREE_DEPTH: u32 = 20;

/// Returns a 32-byte zero value used as default leaf in the Merkle tree.
pub fn zero_value() -> [u8; 32] {
    [0u8; 32]
}

/// Hash a pair of 32-byte nodes by concatenating left || right and applying SHA-256.
///
/// NOTE: In production, this should use Poseidon2 to match the ZK circuit.
/// Using SHA-256 here for hackathon compatibility with Soroban's built-in crypto.
pub fn hash_pair(env: &Env, left: BytesN<32>, right: BytesN<32>) -> BytesN<32> {
    let mut combined = Bytes::new(env);
    combined.append(&Bytes::from_slice(env, left.to_array().as_slice()));
    combined.append(&Bytes::from_slice(env, right.to_array().as_slice()));
    env.crypto().sha256(&combined)
}

/// Compute the Merkle root from a vector of leaves.
/// Pads the leaves with zero values to the next power of 2 before building the tree.
pub fn compute_root(env: &Env, leaves: Vec<BytesN<32>>) -> BytesN<32> {
    let count = leaves.len();

    // If no leaves, return hash of zero value
    if count == 0 {
        let zero = BytesN::from_array(env, &zero_value());
        return hash_pair(env, zero.clone(), zero);
    }

    // Find the next power of 2 >= count
    let mut size: u32 = 1;
    while size < count {
        size *= 2;
    }

    // Build the bottom layer, padding with zero values
    let zero_leaf = BytesN::from_array(env, &zero_value());
    let mut current_layer: Vec<BytesN<32>> = Vec::new(env);
    for i in 0..size {
        if i < count {
            current_layer.push_back(leaves.get(i).unwrap());
        } else {
            current_layer.push_back(zero_leaf.clone());
        }
    }

    // Build tree layer by layer until we reach the root
    while current_layer.len() > 1 {
        let mut next_layer: Vec<BytesN<32>> = Vec::new(env);
        let layer_len = current_layer.len();
        let mut i: u32 = 0;
        while i < layer_len {
            let left = current_layer.get(i).unwrap();
            let right = current_layer.get(i + 1).unwrap();
            next_layer.push_back(hash_pair(env, left, right));
            i += 2;
        }
        current_layer = next_layer;
    }

    current_layer.get(0).unwrap()
}

/// Generate a Merkle proof for the leaf at the given index.
/// Returns (path_elements, path_indices) where:
/// - path_elements: the sibling hashes along the path from leaf to root
/// - path_indices: 0 if the node is a left child, 1 if right child
pub fn get_proof(
    env: &Env,
    leaves: Vec<BytesN<32>>,
    leaf_index: u32,
) -> (Vec<BytesN<32>>, Vec<u32>) {
    let count = leaves.len();

    if leaf_index >= count {
        panic!("leaf_index out of bounds");
    }

    // Find the next power of 2 >= count
    let mut size: u32 = 1;
    while size < count {
        size *= 2;
    }

    // Build the bottom layer, padding with zero values
    let zero_leaf = BytesN::from_array(env, &zero_value());
    let mut current_layer: Vec<BytesN<32>> = Vec::new(env);
    for i in 0..size {
        if i < count {
            current_layer.push_back(leaves.get(i).unwrap());
        } else {
            current_layer.push_back(zero_leaf.clone());
        }
    }

    let mut path_elements: Vec<BytesN<32>> = Vec::new(env);
    let mut path_indices: Vec<u32> = Vec::new(env);
    let mut current_index = leaf_index;

    // Traverse up the tree, collecting siblings
    while current_layer.len() > 1 {
        // Determine sibling
        let sibling_index = if current_index % 2 == 0 {
            current_index + 1
        } else {
            current_index - 1
        };

        path_elements.push_back(current_layer.get(sibling_index).unwrap());

        // 0 if current node is a left child, 1 if right child
        if current_index % 2 == 0 {
            path_indices.push_back(0);
        } else {
            path_indices.push_back(1);
        }

        // Build next layer
        let mut next_layer: Vec<BytesN<32>> = Vec::new(env);
        let layer_len = current_layer.len();
        let mut i: u32 = 0;
        while i < layer_len {
            let left = current_layer.get(i).unwrap();
            let right = current_layer.get(i + 1).unwrap();
            next_layer.push_back(hash_pair(env, left, right));
            i += 2;
        }

        current_index /= 2;
        current_layer = next_layer;
    }

    (path_elements, path_indices)
}
