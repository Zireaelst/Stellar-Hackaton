'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import TerminalBox from '@/components/ui/TerminalBox';
import GradientText from '@/components/ui/GradientText';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const steps = [
  {
    number: '01',
    title: 'Deposit',
    description:
      'Deposit a fixed 100 XLM denomination into the Privacy Pool smart contract. A Poseidon2 commitment hash is generated from your secret and nullifier, then inserted into the on-chain Merkle tree.',
    codeTitle: 'commitment.ts',
    code: `const secret = randomField();
const nullifier = randomField();
const commitment = poseidon2(
  [secret, nullifier]
);
await pool.deposit(commitment);`,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00FFA3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="8 12 12 16 16 12" />
        <line x1="12" y1="8" x2="12" y2="16" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Prove',
    description:
      'Generate a zero-knowledge proof using Noir and Barretenberg. The proof demonstrates your deposit is in the Merkle tree AND belongs to a clean association set — without revealing which deposit is yours.',
    codeTitle: 'prove.ts',
    code: `const proof = await noir.prove({
  secret,
  nullifier,
  merkle_path,
  association_set,
  root: merkleTree.root
});
// proof reveals NOTHING`,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00FFA3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Withdraw',
    description:
      'Submit the proof and nullifier hash to the contract. The contract verifies the ZK proof on-chain, checks the nullifier hasn\'t been spent, and releases 100 XLM to a fresh recipient address.',
    codeTitle: 'withdraw.ts',
    code: `await pool.withdraw({
  proof,
  nullifier_hash,
  recipient: newAddress,
  association_root
});
// link between deposit
// and withdrawal: BROKEN`,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00FFA3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="16 12 12 8 8 12" />
        <line x1="12" y1="16" x2="12" y2="8" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-28 px-6">
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
            Three Steps to{' '}
            <GradientText variant="primary">Private, Compliant</GradientText>{' '}
            Transactions
          </h2>
          <p className="font-dm text-[#4A5568] max-w-xl mx-auto text-lg">
            From deposit to withdrawal, every step is cryptographically verified.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid md:grid-cols-3 gap-6"
        >
          {steps.map((step) => (
            <motion.div key={step.number} variants={cardVariants}>
              <GlassCard className="p-8 h-full flex flex-col">
                {/* Step number + icon */}
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-5xl font-bold text-white/[0.06]">
                    {step.number}
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-[rgba(0,255,163,0.06)] border border-[rgba(0,255,163,0.15)] flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-syne text-2xl font-bold text-white mb-3">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="font-dm text-sm text-[#4A5568] leading-relaxed mb-6 flex-1">
                  {step.description}
                </p>

                {/* Code */}
                <TerminalBox title={step.codeTitle} copyContent={step.code}>
                  <pre className="text-xs leading-relaxed whitespace-pre-wrap">{step.code}</pre>
                </TerminalBox>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Connection line */}
        <div className="hidden md:flex items-center justify-center mt-8 gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgba(0,255,163,0.2)] to-transparent" />
          <span className="font-mono text-[10px] text-[#2D3748] tracking-[0.3em]">
            DEPOSIT → PROVE → WITHDRAW
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgba(0,255,163,0.2)] to-transparent" />
        </div>
      </div>
    </section>
  );
}
