'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TerminalBox } from '../ui/TerminalBox';
import type { Note } from '../../lib/zk';

interface NoteDisplayProps {
  note: Note;
}

export function NoteDisplay({ note }: NoteDisplayProps) {
  const [copied, setCopied] = useState(false);

  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  const formattedNote = [
    '# StellarVeil Withdrawal Note',
    `# Generated: ${timestamp}`,
    '# DO NOT SHARE THIS NOTE',
    '',
    `nullifier:   ${note.nullifier}`,
    `secret:      ${note.secret}`,
    `commitment:  ${note.commitment}`,
  ].join('\n');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formattedNote);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = formattedNote;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [formattedNote]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      {/* Amber Warning Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex items-start gap-3 rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/[0.06] px-4 py-3"
      >
        <span className="mt-0.5 text-lg leading-none">⚠</span>
        <div>
          <p className="font-syne text-sm font-semibold text-[#F59E0B]">
            Save this note now. It cannot be recovered.
          </p>
          <p className="mt-1 font-dm text-xs text-[#F59E0B]/70">
            This note is your only proof of deposit. Without it, your funds cannot be withdrawn.
          </p>
        </div>
      </motion.div>

      {/* Terminal Note Display */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <TerminalBox title="withdrawal-note.txt">
          <div className="space-y-1">
            <p className="text-white/30 font-mono text-xs"># StellarVeil Withdrawal Note</p>
            <p className="text-white/30 font-mono text-xs"># Generated: {timestamp}</p>
            <p className="text-[#FF3B5C]/60 font-mono text-xs"># DO NOT SHARE THIS NOTE</p>
            <div className="h-3" />
            <p className="font-mono text-xs">
              <span className="text-[#3B82F6]">nullifier:</span>
              <span className="text-white/50">{'   '}</span>
              <span className="text-[#00FFA3] break-all">{note.nullifier}</span>
            </p>
            <p className="font-mono text-xs">
              <span className="text-[#3B82F6]">secret:</span>
              <span className="text-white/50">{'      '}</span>
              <span className="text-[#00FFA3] break-all">{note.secret}</span>
            </p>
            <p className="font-mono text-xs">
              <span className="text-[#3B82F6]">commitment:</span>
              <span className="text-white/50">{'  '}</span>
              <span className="text-white/70 break-all">{note.commitment}</span>
            </p>
          </div>
        </TerminalBox>
      </motion.div>

      {/* Copy Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex items-center justify-between"
      >
        <button
          onClick={handleCopy}
          className="group flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 font-dm text-sm text-white/60 transition-all hover:border-[#00FFA3]/30 hover:bg-[#00FFA3]/[0.04] hover:text-[#00FFA3]"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="check"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 text-[#00FFA3]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied!
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy All
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <p className="font-dm text-[11px] text-white/25">
          Only the commitment is stored on-chain. Nullifier &amp; secret stay local.
        </p>
      </motion.div>
    </motion.div>
  );
}
