import { useEffect, useRef } from 'react';
import './Features.css';

const features = [
  {
    title: 'Privacy first',
    desc: 'Files never leave your browser. Zero uploads, zero tracking, zero compromises on your data.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    ),
  },
  {
    title: 'No ads, ever',
    desc: 'Clean, distraction-free experience. No banners, no pop-ups, no sponsored content.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
    ),
  },
  {
    title: 'No file limits',
    desc: 'Process files of any size. No paywalls, no premium tiers, no artificial restrictions.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    ),
  },
  {
    title: 'Works offline',
    desc: 'Install as a progressive web app and use all tools without an internet connection.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
    ),
  },
  {
    title: 'No sign-up',
    desc: 'Start using any tool immediately. No accounts, no email verification, no friction.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    ),
  },
  {
    title: 'Lightning fast',
    desc: 'Optimized in-browser processing. No server round-trips means instant results.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    ),
  },
];

export default function Features() {
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const els = sectionRef.current.querySelectorAll('.section-reveal');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.08 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section className="features" id="features" ref={sectionRef}>
      <div className="container">
        <div className="features__header section-reveal">
          <h2 className="section-heading">Why FileNinja</h2>
          <p className="section-subheading">
            Built different. Every design decision puts your privacy and experience first.
          </p>
        </div>

        <div className="features__grid">
          {features.map((f, i) => (
            <div className="features__card section-reveal" key={f.title} style={{ transitionDelay: `${i * 0.07}s` }}>
              <div className="features__icon">{f.icon}</div>
              <h3 className="features__title">{f.title}</h3>
              <p className="features__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
