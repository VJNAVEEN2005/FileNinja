import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ToolGrid from '../components/ToolGrid';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

export default function HomePage() {
  return (
    <>
      <SEO 
        title="FileNinja — Free & Private Online PDF Tools"
        description="Process PDF files entirely in your browser. Merge, split, compress, and convert PDFs 100% free. No uploads, no sign-up, no ads."
        path="/"
        googleVerification="LGbFIMh3-m97SnITcrjJHaOdTk_f4jXxcZtDHzFOPeo"
      />
      <Navbar />
      <main>
        <Hero />
        <ToolGrid />
        <HowItWorks />
        <Features />
      </main>
      <Footer />
    </>
  );
}
