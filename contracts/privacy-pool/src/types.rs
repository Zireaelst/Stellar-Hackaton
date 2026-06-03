use soroban_sdk::{contracttype, BytesN};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Operator,
    Token,
    Denomination,
    MerkleRoot,
    LeafCount,
    Leaf(u32),
    Nullifier(BytesN<32>),
    BadCommitment(BytesN<32>),
    BadCount,
    Initialized,
}
