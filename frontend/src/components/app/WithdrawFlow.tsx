'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { generateNote, generateProof, loadSavedNote, computeNullifierHash } from '../../lib/zk';
import { withdraw, getLeaves } from '../../lib/stellar';
import { DENOMINATION_XLM, STELLAR_EXPERT_URL } from '../../lib/constants';
import { GlassCard } from '../ui/GlassCard';
import { TerminalBox } from '../ui/TerminalBox';
import { ProofAnimation } from './ProofAnimation';

export function WithdrawFlow() {
  const {
    walletAddress,
    note,
    proof,
    isGeneratingProof,
    txHash,
    isLoading,
    error,
    leaves,
    setNote,
    setProof,
    setProofStep,
    setTxHash,
    setError,
  } = useStore();

  const [nullifierInput, setNullifierInput] = useState('');
  const [secretInput, setSecretInput] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [noteLoaded, setNoteLoaded] = useState(false);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const isNoteEntered = (nullifierInput.trim().length > 0 && secretInput.trim().length > 0) || noteLoaded;

  const validateAddress = useCallback((addr: string): boolean => {
    if (!addr) return false;
    if (!addr.startsWith('G') || addr.length !== 56) {
      setAddressError('Invalid Stellar address. Must start with G and be 56 characters.');
      return false;
    }
    setAddressError(null);
    return true;
  }, []);

  const handleLoadSavedNote = useCallback(() => {
    try {
      const saved = loadSavedNote();
      if (saved) {
        setNullifierInput(saved.nullifier);
        setSecretInput(saved.secret);
        setNote(saved);
        setNoteLoaded(true);
        setError(null);
      } else {
        setError('No saved note found in local storage.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved note');
    }
  }, [setNote, setError]);

  const handleUseWalletAddress = useCallback(() => {
    if (walletAddress) {
      setRecipientAddress(walletAddress);
      setAddressError(null);
    }
  }, [walletAddress]);

  const handleGenerateProof = useCallback(async () => {
    if (!nullifierInput.trim() || !secretInput.trim()) {
      setError('Please enter both nullifier and secret.');
      return;
    }
    if (!recipientAddress.trim()) {
      setError('Please enter a recipient address.');
      return;
    }
    if (!validateAddress(recipientAddress)) return;

    setError(null);
    setProofStep(0, 'Initializing proof generation...');

    try {
      // Build note object if not already set
      const noteObj = note || {
        nullifier: nullifierInput.trim(),
        secret: secretInput.trim(),
        commitment: '', // Will be computed
        timestamp: Date.now(),
      };

      if (!note) {
        setNote(noteObj);
      }

      const currentLeaves = leaves.length > 0 ? leaves : await getLeaves();
      const generatedProof = await generateProof(noteObj, recipientAddress, currentLeaves, setProofStep);
      setProof(generatedProof);
      setProofGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Proof generation failed');
      setProofStep(-1, '');
    }
  }, [nullifierInput, secretInput, recipientAddress, note, leaves, setNote, setProof, setProofStep, setError, validateAddress]);

  const handleWithdraw = useCallback(async () => {
    if (!proof) {
      setError('Please generate a proof first.');
      return;
    }
    if (!recipientAddress) {
      setError('Please enter a recipient address.');
      return;
    }

    setError(null);
    setWithdrawSuccess(false);

    try {
      const result = await withdraw(proof.nullifierHash, recipientAddress, proof.root, walletAddress!);
      setTxHash(result);
      setWithdrawSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed');
    }
  }, [proof, recipientAddress, setTxHash, setError]);

  return (
    <div className="space-y-6">
      {/* Step 1: Enter Note */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
              <span className="font-mono text-xs text-white/50">1</span>
            </div>
            <div>
              <h3 className="font-syne text-sm font-semibold text-white/90">Enter Withdrawal Note</h3>
              <p className="font-dm text-xs text-white/40">Paste the nullifier and secret from your saved note</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block font-dm text-[11px] font-medium uppercase tracking-widest text-white/30">
                Nullifier
              </label>
              <input
                type="text"
                value={nullifierInput}
                onChange={(e) => {
                  setNullifierInput(e.target.value);
                  setNoteLoaded(false);
                }}
                placeholder="0x..."
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-3 font-mono text-sm text-white/80 placeholder:text-white/15 transition-colors focus:border-[#00FFA3]/30 focus:outline-none focus:ring-1 focus:ring-[#00FFA3]/20"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              />
            </div>
            <div>
              <label className="mb-1.5 block font-dm text-[11px] font-medium uppercase tracking-widest text-white/30">
                Secret
              </label>
              <input
                type="text"
                value={secretInput}
                onChange={(e) => {
                  setSecretInput(e.target.value);
                  setNoteLoaded(false);
                }}
                placeholder="0x..."
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-3 font-mono text-sm text-white/80 placeholder:text-white/15 transition-colors focus:border-[#00FFA3]/30 focus:outline-none focus:ring-1 focus:ring-[#00FFA3]/20"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              />
            </div>
          </div>

          <button
            onClick={handleLoadSavedNote}
            className="flex items-center gap-1.5 font-dm text-xs text-[#3B82F6] transition-colors hover:text-[#3B82F6]/80"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Load saved note from browser
          </button>

          {noteLoaded && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-lg border border-[#00FFA3]/10 bg-[#00FFA3]/[0.03] px-3 py-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00FFA3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="font-dm text-xs text-[#00FFA3]">Note loaded successfully</span>
            </motion.div>
          )}
        </div>
      </GlassCard>

      {/* Step 2: Recipient Address */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
              <span className="font-mono text-xs text-white/50">2</span>
            </div>
            <div>
              <h3 className="font-syne text-sm font-semibold text-white/90">Recipient Address</h3>
              <p className="font-dm text-xs text-white/40">Stellar address to receive the withdrawn funds</p>
            </div>
          </div>

          <div>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => {
                setRecipientAddress(e.target.value);
                if (addressError) setAddressError(null);
              }}
              onBlur={() => {
                if (recipientAddress.trim()) validateAddress(recipientAddress);
              }}
              placeholder="G..."
              className={`w-full rounded-lg border px-4 py-3 font-mono text-sm text-white/80 placeholder:text-white/15 transition-colors focus:outline-none focus:ring-1 ${
                addressError
                  ? 'border-[#FF3B5C]/30 bg-[#FF3B5C]/[0.03] focus:border-[#FF3B5C]/50 focus:ring-[#FF3B5C]/20'
                  : 'border-white/[0.06] bg-white/[0.03] focus:border-[#00FFA3]/30 focus:ring-[#00FFA3]/20'
              }`}
            />
            <AnimatePresence>
              {addressError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-1.5 font-dm text-[11px] text-[#FF3B5C]"
                >
                  {addressError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {walletAddress && (
            <button
              onClick={handleUseWalletAddress}
              className="flex items-center gap-1.5 font-dm text-xs text-[#3B82F6] transition-colors hover:text-[#3B82F6]/80"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
              </svg>
              Use my connected wallet address
            </button>
          )}
        </div>
      </GlassCard>

      {/* Step 3: Generate ZK Proof */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
              <span className="font-mono text-xs text-white/50">3</span>
            </div>
            <div>
              <h3 className="font-syne text-sm font-semibold text-white/90">Generate Zero-Knowledge Proof</h3>
              <p className="font-dm text-xs text-white/40">
                Prove ownership without revealing your identity
              </p>
            </div>
          </div>

          {!isGeneratingProof && !proofGenerated && (
            <button
              onClick={handleGenerateProof}
              disabled={!isNoteEntered || !recipientAddress.trim() || isLoading}
              className="w-full rounded-lg border border-[#3B82F6]/30 bg-[#3B82F6]/[0.08] px-4 py-3 font-syne text-sm font-semibold text-[#3B82F6] transition-all hover:border-[#3B82F6]/50 hover:bg-[#3B82F6]/[0.12] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <span className="flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Generate ZK Proof
              </span>
            </button>
          )}

          {/* Proof Animation */}
          <AnimatePresence>
            {isGeneratingProof && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ProofAnimation
                  nullifierPrefix={nullifierInput.slice(0, 10) || '0xab3f...'}
                  onComplete={() => {
                    setProofStep(-1, '');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Proof Summary (after generation) */}
          <AnimatePresence>
            {proofGenerated && proof && !isGeneratingProof && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00FFA3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="font-dm text-sm text-[#00FFA3]">Proof generated</span>
                </div>
                <TerminalBox title="proof-summary.json">
                  <div className="space-y-1">
                    <p className="font-mono text-xs">
                      <span className="text-[#3B82F6]">&quot;nullifierHash&quot;</span>
                      <span className="text-white/30">: </span>
                      <span className="text-[#00FFA3] break-all">&quot;{proof.nullifierHash?.slice(0, 32) || '0x...'}...&quot;</span>
                    </p>
                    <p className="font-mono text-xs">
                      <span className="text-[#3B82F6]">&quot;root&quot;</span>
                      <span className="text-white/30">:          </span>
                      <span className="text-white/60 break-all">&quot;{proof.root?.slice(0, 32) || '0x...'}...&quot;</span>
                    </p>
                    <p className="font-mono text-xs">
                      <span className="text-[#3B82F6]">&quot;recipient&quot;</span>
                      <span className="text-white/30">:     </span>
                      <span className="text-white/60 break-all">&quot;{recipientAddress.slice(0, 8)}...{recipientAddress.slice(-4)}&quot;</span>
                    </p>
                    <p className="font-mono text-xs">
                      <span className="text-[#3B82F6]">&quot;proof&quot;</span>
                      <span className="text-white/30">:         </span>
                      <span className="text-white/40">[{proof.proof?.length || 0} bytes]</span>
                    </p>
                  </div>
                </TerminalBox>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>

      {/* Step 4: Withdraw */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
              <span className="font-mono text-xs text-white/50">4</span>
            </div>
            <div>
              <h3 className="font-syne text-sm font-semibold text-white/90">Withdraw</h3>
              <p className="font-dm text-xs text-white/40">
                Submit proof to the contract and receive {DENOMINATION_XLM} XLM
              </p>
            </div>
          </div>

          {!withdrawSuccess ? (
            <button
              onClick={handleWithdraw}
              disabled={!proofGenerated || !proof || isLoading}
              className="group relative w-full overflow-hidden rounded-lg bg-[#00FFA3] px-4 py-3.5 font-syne text-sm font-bold text-[#030508] transition-all hover:bg-[#00FFA3]/90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-4 w-4 rounded-full border-2 border-[#030508]/30 border-t-[#030508]"
                  />
                  Submitting Withdrawal...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                  Withdraw {DENOMINATION_XLM} XLM
                </span>
              )}
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-3 rounded-lg border border-[#00FFA3]/20 bg-[#00FFA3]/[0.04] px-4 py-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00FFA3]/20"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00FFA3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </motion.div>
                <div>
                  <p className="font-syne text-sm font-semibold text-[#00FFA3]">Withdrawal Successful!</p>
                  <p className="font-dm text-xs text-white/40">
                    {DENOMINATION_XLM} XLM sent to {recipientAddress.slice(0, 8)}...{recipientAddress.slice(-4)}
                  </p>
                </div>
              </div>

              {txHash && (
                <a
                  href={`${STELLAR_EXPERT_URL}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 font-dm text-xs text-white/50 transition-colors hover:border-white/[0.1] hover:text-white/70"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  View on Stellar Expert
                </a>
              )}
            </motion.div>
          )}
        </div>
      </GlassCard>

      {/* Global Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex items-start gap-3 rounded-lg border border-[#FF3B5C]/20 bg-[#FF3B5C]/[0.04] px-4 py-3"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF3B5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <div>
              <p className="font-syne text-sm font-semibold text-[#FF3B5C]">Error</p>
              <p className="mt-0.5 font-dm text-xs text-[#FF3B5C]/70">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto flex-shrink-0 text-[#FF3B5C]/40 transition-colors hover:text-[#FF3B5C]/70"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
