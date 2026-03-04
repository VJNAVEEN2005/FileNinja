import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ToolGrid from '../components/ToolGrid';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <>
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
