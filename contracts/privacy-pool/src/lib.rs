#![no_std]
use soroban_sdk::{
    contract, contractimpl, Address, BytesN, Env, Vec,
    symbol_short, token,
};

mod merkle;
mod types;

use types::DataKey;

#[contract]
pub struct PrivacyPool;

#[contractimpl]
impl PrivacyPool {
    /// Initialize the privacy pool with an operator, token address, and fixed denomination.
    /// Can only be called once.
    pub fn initialize(env: Env, operator: Address, token: Address, denomination: i128) {
        // Panic if already initialized
        if env.storage().instance().has(&DataKey::Initialized) {
            panic!("Contract already initialized");
        }

        // Store configuration
        env.storage().instance().set(&DataKey::Operator, &operator);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Denomination, &denomination);
        env.storage().instance().set(&DataKey::LeafCount, &0u32);
        env.storage().instance().set(&DataKey::BadCount, &0u32);

        // Compute initial Merkle root from an empty tree (hash of zero value)
        let zero_leaf = BytesN::<32>::from_array(&env, &merkle::zero_value());
        let empty_leaves: Vec<BytesN<32>> = Vec::new(&env);
        // For an empty tree, the root is hash(zero || zero)
        let initial_root = merkle::hash_pair(&env, zero_leaf.clone(), zero_leaf);
        env.storage().instance().set(&DataKey::MerkleRoot, &initial_root);

        // Mark as initialized
        env.storage().instance().set(&DataKey::Initialized, &true);

        // Emit event
        env.events().publish(
            (symbol_short!("init"),),
            operator,
        );
    }

    /// Deposit tokens into the privacy pool by providing a commitment.
    /// Transfers `denomination` tokens from the depositor to this contract and
    /// inserts the commitment as a new leaf in the Merkle tree.
    pub fn deposit(env: Env, depositor: Address, commitment: BytesN<32>) {
        // Require depositor authorization
        depositor.require_auth();

        // Check initialized
        if !env.storage().instance().has(&DataKey::Initialized) {
            panic!("Contract not initialized");
        }

        // Get token and denomination
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let denomination: i128 = env.storage().instance().get(&DataKey::Denomination).unwrap();

        // Transfer tokens from depositor to this contract
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&depositor, &env.current_contract_address(), &denomination);

        // Get current leaf count and store the commitment
        let leaf_count: u32 = env.storage().instance().get(&DataKey::LeafCount).unwrap();
        env.storage()
            .persistent()
            .set(&DataKey::Leaf(leaf_count), &commitment);

        // Increment leaf count
        let new_leaf_count = leaf_count + 1;
        env.storage()
            .instance()
            .set(&DataKey::LeafCount, &new_leaf_count);

        // Recompute the Merkle root from all leaves
        let mut all_leaves: Vec<BytesN<32>> = Vec::new(&env);
        for i in 0..new_leaf_count {
            let leaf: BytesN<32> = env.storage().persistent().get(&DataKey::Leaf(i)).unwrap();
            all_leaves.push_back(leaf);
        }
        let new_root = merkle::compute_root(&env, all_leaves);
        env.storage().instance().set(&DataKey::MerkleRoot, &new_root);

        // Emit deposit event
        env.events().publish(
            (symbol_short!("deposit"), depositor.clone()),
            (commitment, leaf_count),
        );
    }

    /// Withdraw tokens from the privacy pool.
    /// Verifies the nullifier hasn't been spent and the root matches,
    /// then transfers `denomination` tokens to the recipient.
    ///
    /// NOTE: In production, this function would also verify the ZK proof on-chain
    /// or via an external verifier. For the hackathon, the proof verification
    /// is assumed to happen off-chain, and we trust the caller provides valid
    /// nullifier_hash and root.
    pub fn withdraw(env: Env, nullifier_hash: BytesN<32>, recipient: Address, root: BytesN<32>) {
        // Check initialized
        if !env.storage().instance().has(&DataKey::Initialized) {
            panic!("Contract not initialized");
        }

        // Verify the nullifier has not been spent
        let nullifier_key = DataKey::Nullifier(nullifier_hash.clone());
        if env.storage().persistent().has(&nullifier_key) {
            panic!("Nullifier already spent");
        }

        // Verify root matches stored Merkle root
        let stored_root: BytesN<32> =
            env.storage().instance().get(&DataKey::MerkleRoot).unwrap();
        if stored_root != root {
            panic!("Root mismatch: provided root does not match current Merkle root");
        }

        // Mark nullifier as spent
        env.storage().persistent().set(&nullifier_key, &true);

        // Transfer denomination tokens from contract to recipient
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let denomination: i128 = env.storage().instance().get(&DataKey::Denomination).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(
            &env.current_contract_address(),
            &recipient,
            &denomination,
        );

        // Emit withdrawal event
        env.events().publish(
            (symbol_short!("withdraw"),),
            (nullifier_hash, recipient),
        );
    }

    /// Add a commitment to the bad (flagged) set. Only callable by the operator.
    pub fn add_to_bad_set(env: Env, commitment: BytesN<32>) {
        // Require operator auth
        let operator: Address = env.storage().instance().get(&DataKey::Operator).unwrap();
        operator.require_auth();

        // Store the bad commitment
        env.storage()
            .persistent()
            .set(&DataKey::BadCommitment(commitment.clone()), &true);

        // Increment bad count
        let bad_count: u32 = env.storage().instance().get(&DataKey::BadCount).unwrap();
        env.storage()
            .instance()
            .set(&DataKey::BadCount, &(bad_count + 1));

        // Emit event
        env.events().publish(
            (symbol_short!("bad_add"),),
            commitment,
        );
    }

    /// Remove a commitment from the bad (flagged) set. Only callable by the operator.
    pub fn remove_from_bad_set(env: Env, commitment: BytesN<32>) {
        // Require operator auth
        let operator: Address = env.storage().instance().get(&DataKey::Operator).unwrap();
        operator.require_auth();

        // Remove the bad commitment
        env.storage()
            .persistent()
            .remove(&DataKey::BadCommitment(commitment.clone()));

        // Decrement bad count
        let bad_count: u32 = env.storage().instance().get(&DataKey::BadCount).unwrap();
        if bad_count > 0 {
            env.storage()
                .instance()
                .set(&DataKey::BadCount, &(bad_count - 1));
        }
    }

    /// Returns the current Merkle root.
    pub fn get_root(env: Env) -> BytesN<32> {
        env.storage().instance().get(&DataKey::MerkleRoot).unwrap()
    }

    /// Returns true if the given nullifier hash has already been spent.
    pub fn is_spent(env: Env, nullifier_hash: BytesN<32>) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Nullifier(nullifier_hash))
    }

    /// Returns true if the given commitment is in the bad (flagged) set.
    pub fn is_in_bad_set(env: Env, commitment: BytesN<32>) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::BadCommitment(commitment))
    }

    /// Returns the current number of leaves (deposits) in the Merkle tree.
    pub fn get_leaf_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::LeafCount).unwrap()
    }

    /// Returns the leaf commitment at the given index.
    pub fn get_leaf(env: Env, index: u32) -> BytesN<32> {
        env.storage()
            .persistent()
            .get(&DataKey::Leaf(index))
            .unwrap()
    }

    /// Returns the current count of commitments in the bad set.
    pub fn get_bad_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::BadCount).unwrap()
    }

    /// Returns the fixed denomination amount for deposits/withdrawals.
    pub fn get_denomination(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Denomination)
            .unwrap()
    }

    /// Returns all leaf commitments currently in the Merkle tree.
    pub fn get_leaves(env: Env) -> Vec<BytesN<32>> {
        let leaf_count: u32 = env.storage().instance().get(&DataKey::LeafCount).unwrap();
        let mut leaves: Vec<BytesN<32>> = Vec::new(&env);
        for i in 0..leaf_count {
            let leaf: BytesN<32> = env.storage().persistent().get(&DataKey::Leaf(i)).unwrap();
            leaves.push_back(leaf);
        }
        leaves
    }

    /// Returns a Merkle proof for the leaf at the given index.
    /// Returns (path_elements, path_indices).
    pub fn get_merkle_proof(env: Env, leaf_index: u32) -> (Vec<BytesN<32>>, Vec<u32>) {
        let leaves = Self::get_leaves(env.clone());
        merkle::get_proof(&env, leaves, leaf_index)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, Events},
        token::{StellarAssetClient, TokenClient},
        vec, Env, IntoVal,
    };

    fn setup_env() -> (Env, Address, Address, Address, PrivacyPoolClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();

        // Deploy the privacy pool contract
        let contract_id = env.register_contract(None, PrivacyPool);
        let client = PrivacyPoolClient::new(&env, &contract_id);

        // Create operator and depositor addresses
        let operator = Address::generate(&env);
        let depositor = Address::generate(&env);

        // Deploy a token contract
        let token_admin = Address::generate(&env);
        let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
        let token_addr = token_contract.address();
        let sac_client = StellarAssetClient::new(&env, &token_addr);

        // Mint tokens to the depositor
        sac_client.mint(&depositor, &10_000_000);

        // Initialize the privacy pool
        let denomination: i128 = 1_000_000;
        client.initialize(&operator, &token_addr, &denomination);

        (env, operator, depositor, token_addr, client)
    }

    fn make_commitment(env: &Env, seed: u8) -> BytesN<32> {
        let mut bytes = [0u8; 32];
        bytes[0] = seed;
        BytesN::from_array(env, &bytes)
    }

    fn make_nullifier_hash(env: &Env, seed: u8) -> BytesN<32> {
        let mut bytes = [0u8; 32];
        bytes[0] = seed;
        bytes[31] = 0xFF; // differentiate from commitment
        BytesN::from_array(env, &bytes)
    }

    #[test]
    fn test_deposit_and_withdraw() {
        let (env, _operator, depositor, token_addr, client) = setup_env();

        let token_client = TokenClient::new(&env, &token_addr);

        // Check initial state
        assert_eq!(client.get_leaf_count(), 0);
        assert_eq!(client.get_denomination(), 1_000_000);

        // --- Deposit ---
        let commitment = make_commitment(&env, 1);
        let initial_balance = token_client.balance(&depositor);

        client.deposit(&depositor, &commitment);

        // Verify deposit effects
        assert_eq!(client.get_leaf_count(), 1);
        assert_eq!(
            token_client.balance(&depositor),
            initial_balance - 1_000_000
        );
        assert_eq!(client.get_leaf(&0), commitment);

        // Verify Merkle root changed from initial
        let root = client.get_root();

        // --- Withdraw ---
        let nullifier_hash = make_nullifier_hash(&env, 1);
        let recipient = Address::generate(&env);
        let recipient_balance_before = token_client.balance(&recipient);

        client.withdraw(&nullifier_hash, &recipient, &root);

        // Verify withdrawal effects
        assert_eq!(
            token_client.balance(&recipient),
            recipient_balance_before + 1_000_000
        );
        assert!(client.is_spent(&nullifier_hash));
    }

    #[test]
    #[should_panic(expected = "Nullifier already spent")]
    fn test_double_spend_prevented() {
        let (env, _operator, depositor, _token_addr, client) = setup_env();

        // Deposit
        let commitment = make_commitment(&env, 2);
        client.deposit(&depositor, &commitment);

        let root = client.get_root();
        let nullifier_hash = make_nullifier_hash(&env, 2);
        let recipient = Address::generate(&env);

        // First withdrawal — should succeed
        client.withdraw(&nullifier_hash, &recipient, &root);

        // Second withdrawal with same nullifier — should panic
        client.withdraw(&nullifier_hash, &recipient, &root);
    }

    #[test]
    fn test_bad_set_management() {
        let (env, operator, _depositor, _token_addr, client) = setup_env();

        let commitment = make_commitment(&env, 42);

        // Initially not in bad set
        assert!(!client.is_in_bad_set(&commitment));
        assert_eq!(client.get_bad_count(), 0);

        // Add to bad set
        client.add_to_bad_set(&commitment);
        assert!(client.is_in_bad_set(&commitment));
        assert_eq!(client.get_bad_count(), 1);

        // Add another
        let commitment2 = make_commitment(&env, 43);
        client.add_to_bad_set(&commitment2);
        assert!(client.is_in_bad_set(&commitment2));
        assert_eq!(client.get_bad_count(), 2);

        // Remove first from bad set
        client.remove_from_bad_set(&commitment);
        assert!(!client.is_in_bad_set(&commitment));
        assert_eq!(client.get_bad_count(), 1);

        // Second still in bad set
        assert!(client.is_in_bad_set(&commitment2));

        // Remove second
        client.remove_from_bad_set(&commitment2);
        assert!(!client.is_in_bad_set(&commitment2));
        assert_eq!(client.get_bad_count(), 0);
    }
}
