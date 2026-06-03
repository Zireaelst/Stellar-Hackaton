'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import TerminalBox from '@/components/ui/TerminalBox';
import GradientText from '@/components/ui/GradientText';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// Pool visualization data
const poolDots = [
  // Clean deposits (green)
  { x: 20, y: 25, clean: true },
  { x: 45, y: 18, clean: true },
  { x: 70, y: 30, clean: true },
  { x: 30, y: 50, clean: true },
  { x: 55, y: 55, clean: true },
  { x: 80, y: 45, clean: true },
  { x: 15, y: 70, clean: true },
  { x: 40, y: 75, clean: true },
  { x: 65, y: 68, clean: true },
  { x: 85, y: 70, clean: true },
  { x: 25, y: 40, clean: true },
  { x: 50, y: 38, clean: true },
  // Flagged deposits (red)
  { x: 60, y: 42, clean: false },
  { x: 35, y: 62, clean: false },
  { x: 75, y: 58, clean: false },
];

const paperQuote = `"Association sets allow depositors to
prove their deposit belongs to a set
of addresses NOT associated with
illicit activity — while revealing
nothing about which specific deposit
is theirs."

— Privacy Pools (Buterin et al., 2023)`;

export default function AssociationSetsExplainer() {
  return (
    <section id="privacy" className="relative py-28 px-6">
      {/* Subtle top gradient */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="font-syne text-4xl md:text-5xl font-bold text-white mb-4">
            Association Sets —{' '}
            <GradientText variant="primary">The Privacy Pools Innovation</GradientText>
          </h2>
          <p className="font-dm text-[#4A5568] max-w-2xl mx-auto text-lg">
            The key insight that makes compliant privacy possible: prove you&apos;re part of the &quot;clean&quot; set
            without revealing who you are.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* LEFT — Pool visualization */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            <GlassCard className="p-8">
              <div className="mb-6">
                <h3 className="font-syne text-lg font-bold text-white mb-1">
                  Privacy Pool — Deposit Visualization
                </h3>
                <p className="font-mono text-xs text-[#4A5568]">
                  Merkle tree leaf commitments
                </p>
              </div>

              {/* Pool SVG */}
              <div className="relative w-full aspect-[16/9] bg-[#060810] rounded-lg border border-white/[0.04] overflow-hidden">
                {/* Grid background */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Dots */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                  {poolDots.map((dot, i) => (
                    <g key={i}>
                      {/* Glow */}
                      <circle
                        cx={dot.x}
                        cy={dot.y}
                        r="4"
                        fill={dot.clean ? 'rgba(0,255,163,0.1)' : 'rgba(255,59,92,0.1)'}
                      />
                      {/* Dot */}
                      <motion.circle
                        cx={dot.x}
                        cy={dot.y}
                        r="2"
                        fill={dot.clean ? '#00FFA3' : '#FF3B5C'}
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05, duration: 0.4 }}
                      />
                    </g>
                  ))}

                  {/* Association set boundary (dashed circle around clean dots) */}
                  <motion.ellipse
                    cx="47"
                    cy="45"
                    rx="42"
                    ry="35"
                    fill="none"
                    stroke="rgba(0,255,163,0.15)"
                    strokeWidth="0.5"
                    strokeDasharray="3 2"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </svg>

                {/* Legend */}
                <div className="absolute bottom-3 left-3 flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#00FFA3]" />
                    <span className="font-mono text-[9px] text-[#4A5568]">Clean deposit</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#FF3B5C]" />
                    <span className="font-mono text-[9px] text-[#4A5568]">Flagged deposit</span>
                  </div>
                </div>

                {/* Label */}
                <div className="absolute top-3 right-3">
                  <span className="font-mono text-[9px] text-[rgba(0,255,163,0.4)] tracking-wider">
                    ASSOCIATION SET
                  </span>
                </div>
              </div>

              {/* How it works mini-list */}
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[rgba(0,255,163,0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-mono text-[#00FFA3]">1</span>
                  </div>
                  <p className="text-sm font-dm text-[#4A5568]">
                    A <span className="text-[#EDF2F7]">compliance provider</span> publishes an association set — a subset of deposit commitments
                    verified to not be associated with illicit addresses.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[rgba(0,255,163,0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-mono text-[#00FFA3]">2</span>
                  </div>
                  <p className="text-sm font-dm text-[#4A5568]">
                    At withdrawal, the user generates a ZK proof that their deposit&apos;s commitment
                    is a <span className="text-[#EDF2F7]">member of the association set</span>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[rgba(0,255,163,0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-mono text-[#00FFA3]">3</span>
                  </div>
                  <p className="text-sm font-dm text-[#4A5568]">
                    The proof reveals <span className="text-[#EDF2F7]">nothing about which deposit</span> is
                    theirs — only that it belongs to the clean set.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* RIGHT — Explanation + paper quote */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="space-y-6"
          >
            <GlassCard className="p-8">
              <h3 className="font-syne text-xl font-bold text-white mb-4">
                Why Association Sets Matter
              </h3>
              <div className="space-y-4 font-dm text-sm text-[#4A5568] leading-relaxed">
                <p>
                  Traditional mixers like Tornado Cash provide strong privacy but make no distinction
                  between clean and illicit funds. This <span className="text-[#EDF2F7]">all-or-nothing approach</span>{' '}
                  led to OFAC sanctions and regulatory crackdowns.
                </p>
                <p>
                  Privacy Pools introduce <span className="text-[#00FFA3]">association sets</span> — curated subsets of
                  deposit commitments that have been verified by compliance providers. When withdrawing,
                  users can prove membership in a clean association set.
                </p>
                <p>
                  This creates a <span className="text-[#EDF2F7]">separating equilibrium</span>: honest users can
                  credibly signal their innocence, while bad actors cannot forge membership in clean sets.
                  Regulators get the compliance signals they need; users keep their privacy.
                </p>
              </div>
            </GlassCard>

            <TerminalBox title="paper · privacy-pools.pdf" copyContent={paperQuote}>
              <pre className="text-xs leading-relaxed whitespace-pre-wrap">{paperQuote}</pre>
            </TerminalBox>

            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(0,255,163,0.06)] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00FFA3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11.5 14.5 15.5 10" />
                  </svg>
                </div>
                <h4 className="font-syne text-sm font-bold text-white">
                  The StellarVeil Guarantee
                </h4>
              </div>
              <p className="text-sm font-dm text-[#4A5568] leading-relaxed">
                Every withdrawal on StellarVeil includes a verifiable ZK proof of association set
                membership. <span className="text-[#00FFA3]">Privacy without compromise.</span>
              </p>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
