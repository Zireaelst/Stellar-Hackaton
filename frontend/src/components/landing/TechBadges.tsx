'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import GradientText from '@/components/ui/GradientText';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const technologies = [
  {
    name: 'Stellar Soroban',
    description:
      'Smart contract platform on Stellar. Low-cost, high-throughput execution environment for the Privacy Pool contract and on-chain proof verification.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00FFA3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <path d="M2 12h20" />
      </svg>
    ),
    tag: 'BLOCKCHAIN',
  },
  {
    name: 'Noir',
    description:
      'Domain-specific language for writing zero-knowledge circuits. StellarVeil\'s privacy circuit is written in Noir for maximum developer ergonomics.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00FFA3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    tag: 'ZK LANGUAGE',
  },
  {
    name: 'Barretenberg',
    description:
      'Ultra-fast WASM proof generation backend by Aztec. Generates and verifies UltraPlonk proofs in-browser with sub-second performance.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00FFA3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="8" y="8" width="8" height="8" rx="1" />
        <line x1="4" y1="12" x2="8" y2="12" />
        <line x1="16" y1="12" x2="20" y2="12" />
        <line x1="12" y1="4" x2="12" y2="8" />
        <line x1="12" y1="16" x2="12" y2="20" />
      </svg>
    ),
    tag: 'PROVER',
  },
  {
    name: 'Poseidon2',
    description:
      'ZK-friendly algebraic hash function optimized for arithmetic circuits. Orders of magnitude fewer constraints than SHA-256 or Keccak inside ZK proofs.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00FFA3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4" />
        <path d="M12 19v4" />
        <path d="M4.22 4.22l2.83 2.83" />
        <path d="M16.95 16.95l2.83 2.83" />
        <path d="M1 12h4" />
        <path d="M19 12h4" />
        <path d="M4.22 19.78l2.83-2.83" />
        <path d="M16.95 7.05l2.83-2.83" />
      </svg>
    ),
    tag: 'HASH',
  },
  {
    name: 'Merkle Tree',
    description:
      'Binary hash tree (depth 20) storing deposit commitments. Enables O(log n) membership proofs — prove your deposit exists without scanning every leaf.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00FFA3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="4" r="2" />
        <circle cx="6" cy="12" r="2" />
        <circle cx="18" cy="12" r="2" />
        <circle cx="3" cy="20" r="2" />
        <circle cx="9" cy="20" r="2" />
        <circle cx="15" cy="20" r="2" />
        <circle cx="21" cy="20" r="2" />
        <line x1="12" y1="6" x2="6" y2="10" />
        <line x1="12" y1="6" x2="18" y2="10" />
        <line x1="6" y1="14" x2="3" y2="18" />
        <line x1="6" y1="14" x2="9" y2="18" />
        <line x1="18" y1="14" x2="15" y2="18" />
        <line x1="18" y1="14" x2="21" y2="18" />
      </svg>
    ),
    tag: 'DATA STRUCTURE',
  },
  {
    name: 'Freighter Wallet',
    description:
      'Browser extension wallet for Stellar. Native integration for signing deposits and withdrawals. No seed phrases exposed — keys stay in the wallet.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00FFA3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="14" rx="2" />
        <path d="M22 10H2" />
        <path d="M6 14h4" />
        <path d="M14 14h4" />
      </svg>
    ),
    tag: 'WALLET',
  },
];

export default function TechBadges() {
  return (
    <section className="relative py-28 px-6">
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
            Built on{' '}
            <GradientText variant="primary">Proven Technology</GradientText>
          </h2>
          <p className="font-dm text-[#4A5568] max-w-xl mx-auto text-lg">
            Every layer of the stack chosen for production-grade cryptographic integrity.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {technologies.map((tech) => (
            <motion.div key={tech.name} variants={cardVariants}>
              <GlassCard className="p-6 h-full group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[rgba(0,255,163,0.04)] border border-[rgba(0,255,163,0.1)] flex items-center justify-center group-hover:border-[rgba(0,255,163,0.25)] transition-colors duration-300">
                    {tech.icon}
                  </div>
                  <span className="font-mono text-[9px] text-[#2D3748] tracking-[0.15em] mt-1">
                    {tech.tag}
                  </span>
                </div>
                <h3 className="font-syne text-lg font-bold text-white mb-2">
                  {tech.name}
                </h3>
                <p className="font-dm text-sm text-[#4A5568] leading-relaxed">
                  {tech.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
