'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import GradientText from '@/components/ui/GradientText';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const tornadoItems = [
  { text: 'Full transaction privacy', check: true },
  { text: 'Mixer-based anonymity', check: true },
  { text: 'No user verification', check: true },
  { text: 'Regulatory compliance', check: false },
  { text: 'Sybil resistance', check: false },
  { text: 'Legal in most jurisdictions', check: false },
];

const privacyPoolItems = [
  { text: 'Full transaction privacy', check: true },
  { text: 'ZK-proof based anonymity', check: true },
  { text: 'Association set proofs', check: true },
  { text: 'Regulatory compliance', check: true },
  { text: 'Sybil resistance', check: true },
  { text: 'Regulatory path forward', check: true },
];

export default function ProblemStatement() {
  return (
    <section id="protocol" className="relative py-28 px-6">
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
            The Compliance Problem
          </h2>
          <p className="font-dm text-[#4A5568] max-w-xl mx-auto text-lg">
            Existing privacy solutions force a false binary: full privacy with zero compliance,
            or full transparency with zero privacy.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-4 items-stretch"
        >
          {/* LEFT — Tornado Cash */}
          <motion.div variants={cardVariants}>
            <GlassCard className="p-8 h-full border-[rgba(255,59,92,0.15)] hover:border-[rgba(255,59,92,0.3)]">
              <div className="flex items-center gap-3 mb-6">
                {/* ShieldX Icon */}
                <div className="w-10 h-10 rounded-lg bg-[rgba(255,59,92,0.1)] flex items-center justify-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FF3B5C"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <line x1="9.5" y1="9.5" x2="14.5" y2="14.5" />
                    <line x1="14.5" y1="9.5" x2="9.5" y2="14.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-syne font-bold text-white text-lg">Tornado Cash</h3>
                  <p className="text-xs font-mono text-[#FF3B5C]">Full Privacy, Zero Compliance</p>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {tornadoItems.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-dm">
                    {item.check ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF3B5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                    <span className={item.check ? 'text-[#4A5568]' : 'text-[#FF3B5C]'}>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Badge variant="excluded">OFAC SANCTIONED</Badge>
            </GlassCard>
          </motion.div>

          {/* Center bridge */}
          <motion.div
            variants={cardVariants}
            className="flex flex-col items-center justify-center py-4 md:py-0"
          >
            <div className="hidden md:flex flex-col items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <div className="w-px h-16 bg-gradient-to-b from-[rgba(255,59,92,0.3)] via-[rgba(0,255,163,0.3)] to-[rgba(0,255,163,0.3)]" />
              <span className="font-mono text-[10px] text-[#4A5568] tracking-[0.3em] writing-mode-vertical rotate-0 whitespace-nowrap">
                ZK PROOFS
              </span>
              <div className="w-px h-16 bg-gradient-to-b from-[rgba(0,255,163,0.3)] via-[rgba(0,255,163,0.3)] to-[rgba(0,255,163,0.1)]" />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <div className="md:hidden flex items-center gap-3">
              <div className="h-px w-12 bg-[rgba(255,59,92,0.3)]" />
              <span className="font-mono text-[10px] text-[#4A5568] tracking-[0.3em]">ZK PROOFS</span>
              <div className="h-px w-12 bg-[rgba(0,255,163,0.3)]" />
            </div>
          </motion.div>

          {/* RIGHT — Privacy Pools */}
          <motion.div variants={cardVariants}>
            <GlassCard glowing className="p-8 h-full">
              <div className="flex items-center gap-3 mb-6">
                {/* ShieldCheck Icon */}
                <div className="w-10 h-10 rounded-lg bg-[rgba(0,255,163,0.1)] flex items-center justify-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#00FFA3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11.5 14.5 15.5 10" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-syne font-bold text-white text-lg">Privacy Pools</h3>
                  <p className="text-xs font-mono text-[#00FFA3]">Privacy + Compliance</p>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {privacyPoolItems.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-dm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00FFA3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-[#EDF2F7]">{item.text}</span>
                  </li>
                ))}
              </ul>

              <Badge variant="clean">REGULATORY PATH FORWARD</Badge>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
