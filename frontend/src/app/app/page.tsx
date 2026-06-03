'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { AppShell } from '../../components/app/AppShell';
import { DepositFlow } from '../../components/app/DepositFlow';
import { WithdrawFlow } from '../../components/app/WithdrawFlow';
import { GlassCard } from '../../components/ui/GlassCard';

const TABS = [
  { id: 'deposit' as const, label: 'Deposit' },
  { id: 'withdraw' as const, label: 'Withdraw' },
];

export default function AppPage() {
  const {
    isConnected,
    activeTab,
    setActiveTab,
    refreshStats,
    connect,
  } = useStore();

  // Refresh stats on mount
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return (
    <AppShell>
      {/* Tab Switcher */}
      <div className="mb-8">
        <div className="flex items-center gap-0 border-b border-white/[0.06]">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative px-5 py-3 font-syne text-sm font-medium transition-colors"
              >
                <span className={isActive ? 'text-white' : 'text-white/40 hover:text-white/60'}>
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00FFA3]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {!isConnected ? (
          /* Wallet Connect Prompt */
          <motion.div
            key="connect-prompt"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex min-h-[400px] items-center justify-center"
          >
            <GlassCard>
              <div className="flex flex-col items-center px-8 py-10 text-center">
                {/* Wallet Icon */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                  className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00FFA3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
                  </svg>
                </motion.div>

                <h2 className="mb-2 font-syne text-lg font-semibold text-white/90">
                  Connect Your Wallet
                </h2>
                <p className="mb-6 max-w-xs font-dm text-sm leading-relaxed text-white/40">
                  Connect a Stellar wallet to deposit or withdraw funds from the privacy pool.
                </p>

                <button
                  onClick={() => connect()}
                  className="group relative overflow-hidden rounded-lg bg-[#00FFA3] px-6 py-3 font-syne text-sm font-bold text-[#030508] transition-all hover:bg-[#00FFA3]/90"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                      <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                      <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
                    </svg>
                    Connect Wallet
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                  />
                </button>

                <p className="mt-4 font-dm text-[11px] text-white/20">
                  Supports Freighter and other Stellar wallets
                </p>
              </div>
            </GlassCard>
          </motion.div>
        ) : activeTab === 'deposit' ? (
          /* Deposit Flow */
          <motion.div
            key="deposit-flow"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <DepositFlow />
          </motion.div>
        ) : (
          /* Withdraw Flow */
          <motion.div
            key="withdraw-flow"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <WithdrawFlow />
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
