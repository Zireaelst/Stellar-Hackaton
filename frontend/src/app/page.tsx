import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import ProblemStatement from '@/components/landing/ProblemStatement';
import HowItWorks from '@/components/landing/HowItWorks';
import AssociationSetsExplainer from '@/components/landing/AssociationSetsExplainer';
import TechBadges from '@/components/landing/TechBadges';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#030508] text-[#EDF2F7] overflow-x-hidden">
      <Navbar />
      <Hero />
      <ProblemStatement />
      <HowItWorks />
      <AssociationSetsExplainer />
      <TechBadges />
      <Footer />
    </main>
  );
}
