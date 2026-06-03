'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { generateNote } from '../../lib/zk';
import { deposit } from '../../lib/stellar';
import { DENOMINATION_XLM, STELLAR_EXPERT_URL } from '../../lib/constants';
import { GlassCard } from '../ui/GlassCard';
import { NoteDisplay } from './NoteDisplay';

export function DepositFlow() {
  const {
    note,
    hasDepositedNote,
    txHash,
    isLoading,
    error,
    setNote,
    setTxHash,
    setError,
    walletAddress,
  } = useStore();

  const [isGeneratingNote, setIsGeneratingNote] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);

  const handleGenerateNote = useCallback(async () => {
    setIsGeneratingNote(true);
    setError(null);
    try {
      const newNote = await generateNote();
      setNote(newNote);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate note');
    } finally {
      setIsGeneratingNote(false);
    }
  }, [setNote, setError]);

  const handleDeposit = useCallback(async () => {
    if (!note) {
      setError('Please generate a note first.');
      return;
    }
    setError(null);
    setDepositSuccess(false);

    try {
      const result = await deposit(note.commitment, walletAddress!);
      setTxHash(result);
      setDepositSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit failed');
    }
  }, [note, setTxHash, setError]);

  return (
    <div className="space-y-6">
      {/* Step 1: Fixed Denomination */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
              <span className="font-mono text-xs text-white/50">1</span>
            </div>
            <div>
              <h3 className="font-syne text-sm font-semibold text-white/90">Deposit Amount</h3>
              <p className="font-dm text-xs text-white/40">Fixed denomination for privacy</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00FFA3]/[0.08] ring-1 ring-[#00FFA3]/20">
                <span className="font-syne text-sm font-bold text-[#00FFA3]">✦</span>
              </div>
              <div>
                <p className="font-syne text-2xl font-bold text-white">
                  {DENOMINATION_XLM}
                  <span className="ml-1.5 text-sm font-medium text-white/40">XLM</span>
                </p>
                <p className="font-dm text-[11px] text-white/30">Fixed denomination</p>
              </div>
            </div>
            <div className="rounded-md border border-[#00FFA3]/10 bg-[#00FFA3]/[0.04] px-2.5 py-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#00FFA3]/60">
                Pool Size: 100 XLM
              </span>
            </div>
          </div>

          <p className="font-dm text-[11px] leading-relaxed text-white/25">
            All deposits must be exactly {DENOMINATION_XLM} XLM. This fixed denomination ensures that deposits and withdrawals are indistinguishable, providing maximum privacy.
          </p>
        </div>
      </GlassCard>

      {/* Step 2: Generate Note */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
              <span className="font-mono text-xs text-white/50">2</span>
            </div>
            <div>
              <h3 className="font-syne text-sm font-semibold text-white/90">Generate Withdrawal Note</h3>
              <p className="font-dm text-xs text-white/40">A cryptographic note that proves your deposit</p>
            </div>
          </div>

          {!note ? (
            <button
              onClick={handleGenerateNote}
              disabled={isGeneratingNote}
              className="w-full rounded-lg border border-[#00FFA3]/20 bg-[#00FFA3]/[0.06] px-4 py-3 font-syne text-sm font-semibold text-[#00FFA3] transition-all hover:border-[#00FFA3]/40 hover:bg-[#00FFA3]/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGeneratingNote ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-4 w-4 rounded-full border-2 border-[#00FFA3]/30 border-t-[#00FFA3]"
                  />
                  Generating cryptographic note...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Generate Note
                </span>
              )}
            </button>
          ) : (
            <NoteDisplay note={note} />
          )}
        </div>
      </GlassCard>

      {/* Step 3: Deposit */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
              <span className="font-mono text-xs text-white/50">3</span>
            </div>
            <div>
              <h3 className="font-syne text-sm font-semibold text-white/90">Submit Deposit</h3>
              <p className="font-dm text-xs text-white/40">
                Send {DENOMINATION_XLM} XLM to the privacy pool contract
              </p>
            </div>
          </div>

          {!depositSuccess ? (
            <button
              onClick={handleDeposit}
              disabled={!note || isLoading}
              className="group relative w-full overflow-hidden rounded-lg bg-[#00FFA3] px-4 py-3.5 font-syne text-sm font-bold text-[#030508] transition-all hover:bg-[#00FFA3]/90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-4 w-4 rounded-full border-2 border-[#030508]/30 border-t-[#030508]"
                  />
                  Submitting Deposit...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                  Deposit {DENOMINATION_XLM} XLM
                </span>
              )}

              {/* Hover shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="space-y-3"
            >
              {/* Success Banner */}
              <div className="flex items-center gap-3 rounded-lg border border-[#00FFA3]/20 bg-[#00FFA3]/[0.04] px-4 py-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00FFA3]/20"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00FFA3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </motion.div>
                <div>
                  <p className="font-syne text-sm font-semibold text-[#00FFA3]">Deposit Successful!</p>
                  <p className="font-dm text-xs text-white/40">
                    {DENOMINATION_XLM} XLM deposited into the privacy pool
                  </p>
                </div>
              </div>

              {/* Stellar Expert Link */}
              {txHash && (
                <motion.a
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
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
                </motion.a>
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
