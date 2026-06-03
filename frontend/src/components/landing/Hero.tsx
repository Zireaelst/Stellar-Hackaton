'use client';

import { motion } from 'framer-motion';
import ParticleCanvas from '@/components/ui/ParticleCanvas';
import GradientText from '@/components/ui/GradientText';
import Button from '@/components/ui/Button';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stats = [
  { label: '100 XLM · Fixed Denomination' },
  { label: 'Poseidon2 · Hash Commitment' },
  { label: 'ZK Privacy + Compliance' },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Particle background */}
      <ParticleCanvas />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_center,rgba(0,255,163,0.04)_0%,transparent_70%)]" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 py-24 max-w-4xl mx-auto">
        {/* Tagline pill */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/[0.06] bg-[#0A0D14] mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FFA3] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FFA3]" />
          </span>
          <span className="text-xs font-mono text-[#4A5568] tracking-widest uppercase">
            Privacy Pools Protocol · Stellar Testnet
          </span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="font-syne font-extrabold leading-[1.05] tracking-tight mb-6"
          style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}
        >
          <span className="block text-white">Private Funds.</span>
          <GradientText variant="primary" animated as="span" className="block">
            Provably Clean.
          </GradientText>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="font-dm text-lg text-[#4A5568] max-w-[540px] mx-auto mb-10 leading-relaxed"
        >
          Privacy Pools on Stellar. Deposit, prove innocence with zero-knowledge proofs,
          and withdraw — without revealing your identity or compromising compliance.
        </motion.p>

        {/* CTAs */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-center gap-4 flex-wrap mb-16"
        >
          <a href="/app">
            <Button variant="primary" className="text-base px-8 py-3.5">
              Launch App →
            </Button>
          </a>
          <a href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4563364" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="text-base px-8 py-3.5">
              Read Paper ↗
            </Button>
          </a>
        </motion.div>

        {/* Stats row */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-center gap-6 md:gap-10 flex-wrap"
        >
          {stats.map((stat, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {idx > 0 && (
                <div className="hidden md:block w-px h-5 bg-white/[0.08]" />
              )}
              <span className="text-xs font-mono text-[#2D3748] tracking-wide">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-[10px] font-mono text-[#2D3748] tracking-widest uppercase">
              Scroll
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2D3748"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
