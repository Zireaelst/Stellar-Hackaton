'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TerminalBox } from '../ui/TerminalBox';

interface ProofAnimationProps {
  nullifierPrefix?: string;
  onComplete?: () => void;
}

const PROOF_LINES = [
  { text: '', type: 'command' as const, delay: 0 },
  { text: '→ Loading verification circuit...', type: 'info' as const, delay: 200 },
  { text: '→ Computing Merkle path (depth: 20)...', type: 'info' as const, delay: 400 },
  { text: '→ Building witness from private inputs...', type: 'info' as const, delay: 700 },
  { text: '→ Generating R1CS constraints (1,247 gates)...', type: 'info' as const, delay: 1000 },
  { text: '→ Computing polynomial commitments...', type: 'info' as const, delay: 1500 },
  { text: '→ Evaluating Fiat-Shamir heuristic...', type: 'info' as const, delay: 2200 },
  { text: '→ Compressing proof elements...', type: 'info' as const, delay: 2800 },
  { text: '', type: 'success' as const, delay: 3400 },
];

export function ProofAnimation({ nullifierPrefix = '0xab3f...', onComplete }: ProofAnimationProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const hasCompletedRef = useRef(false);

  // Build the command line dynamically
  const lines = PROOF_LINES.map((line, i) => {
    if (i === 0) {
      return { ...line, text: `$ stellarveil prove --nullifier ${nullifierPrefix}` };
    }
    if (i === PROOF_LINES.length - 1) {
      return { ...line, text: '✓ Proof generated successfully (3.2s)' };
    }
    return line;
  });

  // Animate lines appearing one by one
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    lines.forEach((line, index) => {
      const timer = setTimeout(() => {
        setVisibleLines((prev) => Math.max(prev, index + 1));
      }, line.delay);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [nullifierPrefix]);

  // Animate progress bar
  useEffect(() => {
    const duration = 3500;
    const startTime = Date.now();
    let rafId: number;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(elapsed / duration, 1);
      // Ease-in-out cubic
      const eased = pct < 0.5
        ? 4 * pct * pct * pct
        : 1 - Math.pow(-2 * pct + 2, 3) / 2;
      setProgress(eased * 100);

      if (pct < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setIsComplete(true);
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onComplete?.();
        }
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      <TerminalBox title="zk-proof-generation">
        <div className="space-y-1.5 min-h-[200px]">
          <AnimatePresence mode="popLayout">
            {lines.slice(0, visibleLines).map((line, index) => {
              const isCommand = index === 0;
              const isSuccess = index === lines.length - 1;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="font-mono text-xs leading-relaxed"
                >
                  {isCommand && (
                    <span>
                      <span className="text-[#00FFA3]">$</span>{' '}
                      <span className="text-white/80">stellarveil prove</span>{' '}
                      <span className="text-[#3B82F6]">--nullifier</span>{' '}
                      <span className="text-white/40">{nullifierPrefix}</span>
                    </span>
                  )}
                  {!isCommand && !isSuccess && (
                    <span className="text-white/50">{line.text}</span>
                  )}
                  {isSuccess && (
                    <span className="text-[#00FFA3] font-medium">{line.text}</span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Blinking cursor when not yet complete */}
          {!isComplete && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
              className="inline-block w-[7px] h-[14px] bg-[#00FFA3]/70 ml-0.5"
            />
          )}
        </div>
      </TerminalBox>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-dm text-xs text-white/40">Generating proof...</span>
          <span className="font-mono text-xs text-white/40">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: isComplete
                ? '#00FFA3'
                : 'linear-gradient(90deg, #00FFA3 0%, #00FFA3CC 100%)',
            }}
            initial={{ width: 0 }}
          />
        </div>
      </div>

      {/* Proof Summary (appears after completion) */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-4 rounded-lg border border-[#00FFA3]/10 bg-[#00FFA3]/[0.03] px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00FFA3]" />
                <span className="font-mono text-[11px] text-white/40">Proof size:</span>
                <span className="font-mono text-[11px] text-[#00FFA3]">2.1 KB</span>
              </div>
              <div className="h-3 w-px bg-white/[0.06]" />
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
                <span className="font-mono text-[11px] text-white/40">Public inputs:</span>
                <span className="font-mono text-[11px] text-[#3B82F6]">3</span>
              </div>
              <div className="h-3 w-px bg-white/[0.06]" />
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/30" />
                <span className="font-mono text-[11px] text-white/40">Time:</span>
                <span className="font-mono text-[11px] text-white/60">3.2s</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
