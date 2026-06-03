/**
 * StellarVeil — Global State Store (Zustand)
 *
 * Single source of truth for wallet connection, deposit/withdraw
 * flow state, contract data, and UI state.
 */

import { create } from "zustand";
import type { Note, ZKProof } from "@/lib/zk";
import { connectWallet, getBalance, getContractStats, getLeaves, getBadSet } from "@/lib/stellar";

// ── Types ─────────────────────────────────────────────────────────

export type AppTab = "deposit" | "withdraw" | "compliance" | "explorer";

export type TransactionStatus =
  | "idle"
  | "generating-note"
  | "approving"
  | "submitting"
  | "confirming"
  | "success"
  | "error";

export type ProofStatus =
  | "idle"
  | "generating"
  | "ready"
  | "submitting"
  | "success"
  | "error";

export interface TransactionRecord {
  id: string;
  type: "deposit" | "withdraw";
  amount: number;
  commitment: string;
  txHash: string;
  timestamp: number;
  status: "confirmed" | "pending" | "failed";
}

export interface ContractData {
  totalLocked: number;
  depositCount: number;
  root: string;
  leaves: string[];
  badSet: string[];
  lastUpdated: number;
}

export interface StoreState {
  // ── Wallet ──────────────────────────────────────────────────
  walletAddress: string | null;
  walletBalance: number;
  isConnecting: boolean;
  walletError: string | null;

  // ── Active tab ──────────────────────────────────────────────
  activeTab: AppTab;

  // ── Deposit flow ────────────────────────────────────────────
  depositStatus: TransactionStatus;
  depositError: string | null;
  currentNote: Note | null;
  depositTxHash: string | null;

  // ── Withdraw flow ───────────────────────────────────────────
  withdrawStatus: TransactionStatus;
  withdrawError: string | null;
  proofStatus: ProofStatus;
  proofStep: number;
  proofStepLabel: string;
  currentProof: ZKProof | null;
  recipientAddress: string;
  withdrawTxHash: string | null;

  // ── Contract data ───────────────────────────────────────────
  contractData: ContractData;
  isLoadingContractData: boolean;

  // ── Transaction history ─────────────────────────────────────
  transactions: TransactionRecord[];

  // ── UI state ────────────────────────────────────────────────
  showNoteModal: boolean;
  showSuccessModal: boolean;
  isMobileMenuOpen: boolean;

  // ── Missing / Compatible state properties ───────────────────
  isConnected: boolean;
  note: Note | null;
  proof: ZKProof | null;
  isGeneratingProof: boolean;
  txHash: string | null;
  isLoading: boolean;
  error: string | null;
  leaves: string[];
  badSet: string[];
  stats: { totalDeposits: number; totalWithdrawals: number } | null;
  hasDepositedNote: boolean;
}

export interface StoreActions {
  // ── Wallet actions ──────────────────────────────────────────
  setWalletAddress: (address: string | null) => void;
  setWalletBalance: (balance: number) => void;
  setIsConnecting: (connecting: boolean) => void;
  setWalletError: (error: string | null) => void;
  disconnectWallet: () => void;

  // ── Tab actions ─────────────────────────────────────────────
  setActiveTab: (tab: AppTab) => void;

  // ── Deposit actions ─────────────────────────────────────────
  setDepositStatus: (status: TransactionStatus) => void;
  setDepositError: (error: string | null) => void;
  setCurrentNote: (note: Note | null) => void;
  setDepositTxHash: (hash: string | null) => void;
  resetDeposit: () => void;

  // ── Withdraw actions ────────────────────────────────────────
  setWithdrawStatus: (status: TransactionStatus) => void;
  setWithdrawError: (error: string | null) => void;
  setProofStatus: (status: ProofStatus) => void;
  setProofStep: (step: number, label: string) => void;
  setCurrentProof: (proof: ZKProof | null) => void;
  setRecipientAddress: (address: string) => void;
  setWithdrawTxHash: (hash: string | null) => void;
  resetWithdraw: () => void;

  // ── Contract data actions ───────────────────────────────────
  setContractData: (data: Partial<ContractData>) => void;
  setIsLoadingContractData: (loading: boolean) => void;

  // ── Transaction history actions ─────────────────────────────
  addTransaction: (tx: TransactionRecord) => void;
  updateTransaction: (
    id: string,
    updates: Partial<TransactionRecord>
  ) => void;

  // ── UI actions ──────────────────────────────────────────────
  setShowNoteModal: (show: boolean) => void;
  setShowSuccessModal: (show: boolean) => void;
  setIsMobileMenuOpen: (open: boolean) => void;

  // ── Compound actions ────────────────────────────────────────
  reset: () => void;

  // ── Missing / Compatible actions ───────────────────────────
  connect: () => Promise<void>;
  refreshStats: () => Promise<void>;
  setNote: (note: Note | null) => void;
  setProof: (proof: ZKProof | null) => void;
  setTxHash: (hash: string | null) => void;
  setError: (error: string | null) => void;
}

// ── Initial state ─────────────────────────────────────────────────

const initialContractData: ContractData = {
  totalLocked: 0,
  depositCount: 0,
  root: "0".repeat(64),
  leaves: [],
  badSet: [],
  lastUpdated: 0,
};

const initialState: StoreState = {
  walletAddress: null,
  walletBalance: 0,
  isConnecting: false,
  walletError: null,

  activeTab: "deposit",

  depositStatus: "idle",
  depositError: null,
  currentNote: null,
  depositTxHash: null,

  withdrawStatus: "idle",
  withdrawError: null,
  proofStatus: "idle",
  proofStep: 0,
  proofStepLabel: "",
  currentProof: null,
  recipientAddress: "",
  withdrawTxHash: null,

  contractData: { ...initialContractData },
  isLoadingContractData: false,

  transactions: [],

  showNoteModal: false,
  showSuccessModal: false,
  isMobileMenuOpen: false,

  isConnected: false,
  note: null,
  proof: null,
  isGeneratingProof: false,
  txHash: null,
  isLoading: false,
  error: null,
  leaves: [],
  badSet: [],
  stats: null,
  hasDepositedNote: false,
};

// ── Store ─────────────────────────────────────────────────────────

export const useStore = create<StoreState & StoreActions>((set, get) => ({
  ...initialState,

  // ── Wallet actions ──────────────────────────────────────────

  setWalletAddress: (address) =>
    set({ walletAddress: address, walletError: null }),

  setWalletBalance: (balance) => set({ walletBalance: balance }),

  setIsConnecting: (connecting) => set({ isConnecting: connecting }),

  setWalletError: (error) =>
    set({ walletError: error, isConnecting: false }),

  disconnectWallet: () =>
    set({
      walletAddress: null,
      walletBalance: 0,
      walletError: null,
      isConnecting: false,
      isConnected: false,
    }),

  // ── Tab actions ─────────────────────────────────────────────

  setActiveTab: (tab) => set({ activeTab: tab }),

  // ── Deposit actions ─────────────────────────────────────────

  setDepositStatus: (status) => set({ depositStatus: status }),

  setDepositError: (error) =>
    set({ depositError: error, depositStatus: error ? "error" : get().depositStatus }),

  setCurrentNote: (note) => set({ currentNote: note }),

  setDepositTxHash: (hash) => set({ depositTxHash: hash }),

  resetDeposit: () =>
    set({
      depositStatus: "idle",
      depositError: null,
      currentNote: null,
      depositTxHash: null,
      showNoteModal: false,
    }),

  // ── Withdraw actions ────────────────────────────────────────

  setWithdrawStatus: (status) => set({ withdrawStatus: status }),

  setWithdrawError: (error) =>
    set({
      withdrawError: error,
      withdrawStatus: error ? "error" : get().withdrawStatus,
    }),

  setProofStatus: (status) => set({ proofStatus: status }),

  setProofStep: (step, label) =>
    set({
      proofStep: step,
      proofStepLabel: label,
      isGeneratingProof: step >= 0,
    }),

  setCurrentProof: (proof) =>
    set({
      currentProof: proof,
      proof,
      isGeneratingProof: false,
    }),

  setRecipientAddress: (address) =>
    set({ recipientAddress: address }),

  setWithdrawTxHash: (hash) => set({ withdrawTxHash: hash }),

  resetWithdraw: () =>
    set({
      withdrawStatus: "idle",
      withdrawError: null,
      proofStatus: "idle",
      proofStep: 0,
      proofStepLabel: "",
      currentProof: null,
      recipientAddress: "",
      withdrawTxHash: null,
    }),

  // ── Contract data actions ───────────────────────────────────

  setContractData: (data) =>
    set((state) => ({
      contractData: {
        ...state.contractData,
        ...data,
        lastUpdated: Date.now(),
      },
    })),

  setIsLoadingContractData: (loading) =>
    set({ isLoadingContractData: loading }),

  // ── Transaction history actions ─────────────────────────────

  addTransaction: (tx) =>
    set((state) => ({
      transactions: [tx, ...state.transactions],
    })),

  updateTransaction: (id, updates) =>
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.id === id ? { ...tx, ...updates } : tx
      ),
    })),

  // ── UI actions ──────────────────────────────────────────────

  setShowNoteModal: (show) => set({ showNoteModal: show }),

  setShowSuccessModal: (show) => set({ showSuccessModal: show }),

  setIsMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

  // ── Missing / Compatible actions implementation ────────────
  connect: async () => {
    set({ isConnecting: true, walletError: null });
    try {
      const address = await connectWallet();
      const balance = await getBalance(address);
      set({
        walletAddress: address,
        walletBalance: balance,
        isConnected: true,
        isConnecting: false,
      });
      await get().refreshStats();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to connect wallet";
      set({ walletError: errMsg, isConnecting: false, isConnected: false });
      throw err;
    }
  },

  refreshStats: async () => {
    set({ isLoadingContractData: true });
    try {
      const contractStats = await getContractStats();
      const leaves = await getLeaves();
      const badSet = await getBadSet();

      const totalDeposits = contractStats.depositCount;
      const currentLocked = contractStats.totalLocked;
      const totalWithdrawals = Math.max(0, totalDeposits - Math.floor(currentLocked / 100));

      set({
        contractData: {
          totalLocked: currentLocked,
          depositCount: totalDeposits,
          root: contractStats.root,
          leaves,
          badSet,
          lastUpdated: Date.now(),
        },
        leaves,
        badSet,
        stats: {
          totalDeposits,
          totalWithdrawals,
        },
        isLoadingContractData: false,
      });
    } catch (err) {
      console.error("Failed to refresh stats:", err);
      set({ isLoadingContractData: false });
    }
  },

  setNote: (note) =>
    set({
      note,
      currentNote: note,
      isLoading: false,
    }),

  setProof: (proof) =>
    set({
      proof,
      currentProof: proof,
      isGeneratingProof: false,
      isLoading: false,
    }),

  setTxHash: (hash) =>
    set({
      txHash: hash,
      depositTxHash: hash,
      withdrawTxHash: hash,
      isLoading: false,
    }),

  setError: (error) =>
    set({
      error,
      depositError: error,
      withdrawError: error,
      isLoading: error === null,
      isGeneratingProof: error !== null ? false : get().isGeneratingProof,
    }),

  // ── Compound reset ─────────────────────────────────────────

  reset: () => set({ ...initialState }),
}));

export default useStore;
