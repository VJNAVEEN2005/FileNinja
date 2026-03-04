import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        <Link to="/" className="navbar__logo" onClick={() => setMobileOpen(false)}>
          <span className="navbar__logo-icon">FN</span>
          <span className="navbar__logo-text">FileNinja</span>
        </Link>

        <div className="navbar__links-desktop">
          <a href="#tools" className="navbar__link">Tools</a>
          <a href="#how-it-works" className="navbar__link">How it works</a>
          <a href="#features" className="navbar__link">Features</a>
        </div>

        <a href="#tools" className="navbar__cta">
          Explore Tools
        </a>

        <button
          className={`navbar__hamburger ${mobileOpen ? 'navbar__hamburger--open' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`navbar__mobile ${mobileOpen ? 'navbar__mobile--open' : ''}`}>
        <a href="#tools" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>Tools</a>
        <a href="#how-it-works" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>How it works</a>
        <a href="#features" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>Features</a>
        <a href="#tools" className="navbar__mobile-cta" onClick={() => setMobileOpen(false)}>
          Explore Tools
        </a>
      </div>
    </nav>
  );
}
