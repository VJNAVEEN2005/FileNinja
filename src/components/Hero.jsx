import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Search from './Search';
import './Hero.css';

const badges = [
  { text: 'Zero Ads' },
  { text: '100% Client-Side' },
  { text: 'No Sign-up' },
  { text: 'Works Offline' },
  { text: 'No File Limits' },
];

export default function Hero() {
  const heroRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.hero__heading', { opacity: 0, y: 40, duration: 0.8, delay: 0.2 })
        .from('.hero__sub', { opacity: 0, y: 20, duration: 0.6 }, '-=0.4')
        .from('.hero__cta', { opacity: 0, y: 20, duration: 0.5 }, '-=0.3')
        .from('.hero__badges li', {
          opacity: 0,
          y: 15,
          duration: 0.4,
          stagger: 0.08,
        }, '-=0.2')
        .from('.hero__orb', {
          opacity: 0,
          scale: 0.6,
          duration: 1.2,
          stagger: 0.15,
          ease: 'power2.out',
        }, 0.1);
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="hero" ref={heroRef}>
      {/* Decorative orbs */}
      <div className="hero__orb hero__orb--1"></div>
      <div className="hero__orb hero__orb--2"></div>
      <div className="hero__orb hero__orb--3"></div>

      <div className="hero__content container">
        <h1 className="hero__heading">
          Your files. <br />
          Your browser. <br />
          <span className="gradient-text">Your privacy.</span>
        </h1>
        <p className="hero__sub">
          50+ PDF tools that run entirely in your browser. No uploads, no servers, no compromises. Fast, free, and completely private.
        </p>

        <a href="#tools" className="hero__cta">
          <span>Explore All Tools</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
        </a>
        <ul className="hero__badges">
          {badges.map((b) => (
            <li key={b.text} className="hero__badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              {b.text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
