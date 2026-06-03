'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { DENOMINATION_XLM, CONTRACT_ADDRESS, STELLAR_EXPERT_URL } from '../../lib/constants';

function truncateAddress(addr: string, front = 4, back = 4): string {
  if (!addr || addr.length <= front + back + 3) return addr;
  return `${addr.slice(0, front)}...${addr.slice(-back)}`;
}

export function StatsBar() {
  const {
    walletAddress,
    isConnected,
    stats,
    connect,
  } = useStore();

  const [contractCopied, setContractCopied] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    try {
      await connect();
    } catch {
      // Error handled via store
    } finally {
      setIsConnecting(false);
    }
  }, [connect]);

  const copyContract = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS);
      setContractCopied(true);
      setTimeout(() => setContractCopied(false), 2000);
    } catch { /* fallback */ }
  }, []);

  const copyAddress = useCallback(async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    } catch { /* fallback */ }
  }, [walletAddress]);

  return (
    <div className="flex items-center justify-between bg-[#0A0D14] border-b border-white/[0.04] px-6 py-3">
      {/* Left: Logo + Badge */}
      <div className="flex items-center gap-3">
        <a href="/" className="flex items-center gap-0.5 font-syne text-lg font-bold tracking-tight">
          <span className="text-[#00FFA3]">STELLAR</span>
          <span className="text-white">VEIL</span>
        </a>
        <span className="rounded border border-[#F59E0B]/20 bg-[#F59E0B]/[0.08] px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-[#F59E0B]">
          Testnet
        </span>
      </div>

      {/* Center: Stats */}
      <div className="hidden items-center gap-6 md:flex">
        <StatItem
          label="TOTAL LOCKED"
          value={stats ? `${(stats.totalDeposits * DENOMINATION_XLM).toLocaleString()} XLM` : '—'}
        />
        <div className="h-4 w-px bg-white/[0.06]" />
        <StatItem
          label="DEPOSITS"
          value={stats ? stats.totalDeposits.toString() : '—'}
        />
        <div className="h-4 w-px bg-white/[0.06]" />
        <StatItem
          label="WITHDRAWALS"
          value={stats ? stats.totalWithdrawals.toString() : '—'}
        />
        <div className="h-4 w-px bg-white/[0.06]" />
        <div className="flex items-center gap-1.5">
          <span className="font-dm text-[10px] font-medium uppercase tracking-widest text-white/30">
            Contract
          </span>
          <button
            onClick={copyContract}
            className="group flex items-center gap-1 font-mono text-xs text-white/50 transition-colors hover:text-[#00FFA3]"
          >
            {truncateAddress(CONTRACT_ADDRESS, 6, 4)}
            <AnimatePresence mode="wait">
              {contractCopied ? (
                <motion.svg
                  key="check"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#00FFA3"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="copy"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </motion.svg>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Right: Wallet */}
      <div className="flex items-center">
        <AnimatePresence mode="wait">
          {isConnected && walletAddress ? (
            <motion.button
              key="connected"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={copyAddress}
              className="flex items-center gap-2 rounded-full border border-[#00FFA3]/20 bg-[#00FFA3]/[0.06] px-3.5 py-1.5 transition-all hover:border-[#00FFA3]/40 hover:bg-[#00FFA3]/[0.1]"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-[#00FFA3] shadow-[0_0_6px_rgba(0,255,163,0.4)]" />
              <span className="font-mono text-xs text-[#00FFA3]">
                {addressCopied ? 'Copied!' : truncateAddress(walletAddress, 4, 4)}
              </span>
            </motion.button>
          ) : (
            <motion.button
              key="disconnected"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={handleConnect}
              disabled={isConnecting}
              className="group relative flex items-center gap-2 rounded-lg bg-[#00FFA3] px-4 py-2 font-syne text-sm font-semibold text-[#030508] transition-all hover:bg-[#00FFA3]/90 disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-3.5 w-3.5 rounded-full border-2 border-[#030508]/30 border-t-[#030508]"
                  />
                  Connecting...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
                  </svg>
                  Connect Wallet
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-dm text-[10px] font-medium uppercase tracking-widest text-white/30">
        {label}
      </span>
      <span className="font-mono text-xs text-white/70">{value}</span>
    </div>
  );
}
