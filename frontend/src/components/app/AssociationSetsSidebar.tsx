'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { addToBadSet } from '../../lib/stellar';

function truncateHash(hash: string, front = 8, back = 6): string {
  if (!hash || hash.length <= front + back + 3) return hash;
  return `${hash.slice(0, front)}...${hash.slice(-back)}`;
}

export function AssociationSetsSidebar() {
  const { leaves, badSet, walletAddress } = useStore();
  const [operatorOpen, setOperatorOpen] = useState(false);
  const [newCommitment, setNewCommitment] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleAddToBadSet = useCallback(async () => {
    if (!newCommitment.trim()) return;
    setIsAdding(true);
    setAddError(null);
    setAddSuccess(false);
    try {
      if (!walletAddress) {
        setAddError('Please connect your wallet first.');
        setIsAdding(false);
        return;
      }
      await addToBadSet(newCommitment.trim(), walletAddress);
      setAddSuccess(true);
      setNewCommitment('');
      setTimeout(() => setAddSuccess(false), 3000);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add commitment');
    } finally {
      setIsAdding(false);
    }
  }, [newCommitment]);

  return (
    <div className="flex h-full flex-col bg-[#0A0D14] border-l border-white/[0.04] p-5">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-syne text-sm font-semibold text-white/90">
          Association Sets
        </h2>
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-white/[0.08] text-white/30 transition-colors hover:border-white/20 hover:text-white/50"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-7 z-50 w-56 rounded-lg border border-white/[0.08] bg-[#0A0D14] p-3 shadow-xl"
              >
                <p className="font-dm text-[11px] leading-relaxed text-white/50">
                  Association sets track deposit commitments. The flagged set identifies commitments associated with suspicious activity, enabling compliance without breaking privacy.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Pool Deposits Section */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-dm text-[10px] font-medium uppercase tracking-widest text-white/30">
            Pool Deposits
          </span>
          <span className="rounded-full bg-[#00FFA3]/[0.08] px-2 py-0.5 font-mono text-[10px] text-[#00FFA3]">
            {leaves.length}
          </span>
        </div>
        <div className="max-h-[240px] space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/[0.06] scrollbar-track-transparent pr-1">
          {leaves.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-white/[0.06] py-6">
              <span className="font-dm text-xs text-white/20">No deposits yet</span>
            </div>
          ) : (
            leaves.map((commitment: string, index: number) => (
              <motion.div
                key={commitment}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="group flex items-center justify-between rounded-md bg-white/[0.02] px-3 py-2 transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00FFA3] shadow-[0_0_4px_rgba(0,255,163,0.3)]" />
                  <span className="font-mono text-[11px] text-white/50 group-hover:text-white/70">
                    {truncateHash(commitment)}
                  </span>
                </div>
                <span className="rounded border border-[#00FFA3]/10 bg-[#00FFA3]/[0.04] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#00FFA3]/60">
                  Clean
                </span>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="my-1 h-px bg-white/[0.04]" />

      {/* Flagged Set Section */}
      <div className="mb-4 mt-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-dm text-[10px] font-medium uppercase tracking-widest text-white/30">
            Flagged Set
          </span>
          <span className="rounded-full bg-[#F59E0B]/[0.08] px-2 py-0.5 font-mono text-[10px] text-[#F59E0B]">
            {badSet.length}
          </span>
        </div>
        <div className="max-h-[180px] space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/[0.06] scrollbar-track-transparent pr-1">
          {badSet.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-white/[0.06] py-6">
              <span className="font-dm text-xs text-white/20">No flagged commitments</span>
            </div>
          ) : (
            badSet.map((commitment: string, index: number) => (
              <motion.div
                key={commitment}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="group flex items-center justify-between rounded-md bg-[#F59E0B]/[0.02] px-3 py-2 transition-colors hover:bg-[#F59E0B]/[0.05]"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#F59E0B] shadow-[0_0_4px_rgba(245,158,11,0.3)]" />
                  <span className="font-mono text-[11px] text-white/50 group-hover:text-white/70">
                    {truncateHash(commitment)}
                  </span>
                </div>
                <span className="rounded border border-[#F59E0B]/10 bg-[#F59E0B]/[0.04] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#F59E0B]/60">
                  Flagged
                </span>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Operator Actions */}
      <div className="mt-3 border-t border-white/[0.04] pt-3">
        <button
          onClick={() => setOperatorOpen(!operatorOpen)}
          className="flex w-full items-center justify-between py-1.5 transition-colors"
        >
          <span className="font-dm text-[11px] font-medium text-white/40">
            Operator Actions
          </span>
          <motion.svg
            animate={{ rotate: operatorOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white/30"
          >
            <polyline points="6 9 12 15 18 9" />
          </motion.svg>
        </button>

        <AnimatePresence>
          {operatorOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-2.5 pt-2">
                <label className="block font-dm text-[11px] text-white/30">
                  Add commitment to flagged set
                </label>
                <input
                  type="text"
                  value={newCommitment}
                  onChange={(e) => setNewCommitment(e.target.value)}
                  placeholder="0x..."
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 font-mono text-xs text-white/80 placeholder:text-white/20 transition-colors focus:border-[#F59E0B]/30 focus:outline-none focus:ring-1 focus:ring-[#F59E0B]/20"
                />
                <button
                  onClick={handleAddToBadSet}
                  disabled={isAdding || !newCommitment.trim()}
                  className="w-full rounded-lg border border-[#F59E0B]/20 bg-[#F59E0B]/[0.06] px-3 py-2 font-dm text-xs font-medium text-[#F59E0B] transition-all hover:border-[#F59E0B]/30 hover:bg-[#F59E0B]/[0.1] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isAdding ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="h-3 w-3 rounded-full border border-[#F59E0B]/30 border-t-[#F59E0B]"
                      />
                      Adding...
                    </span>
                  ) : (
                    'Flag Commitment'
                  )}
                </button>

                {/* Error/Success messages */}
                <AnimatePresence>
                  {addError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="font-dm text-[11px] text-[#FF3B5C]"
                    >
                      {addError}
                    </motion.p>
                  )}
                  {addSuccess && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="font-dm text-[11px] text-[#00FFA3]"
                    >
                      ✓ Commitment flagged successfully
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
