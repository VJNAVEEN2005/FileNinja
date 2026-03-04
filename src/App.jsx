import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Search from './components/Search';
import HomePage from './pages/HomePage';
import MergePDF from './pages/tools/MergePDF';
import SplitPDF from './pages/tools/SplitPDF';
import RemovePages from './pages/tools/RemovePages';
import ExtractPages from './pages/tools/ExtractPages';
import OrganizePages from './pages/tools/OrganizePages';
import RotatePDF from './pages/tools/RotatePDF';

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global shortcut (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <ScrollToTop />
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tools/merge-pdf" element={<MergePDF />} />
        <Route path="/tools/split-pdf" element={<SplitPDF />} />
        <Route path="/tools/remove-pages" element={<RemovePages />} />
        <Route path="/tools/extract-pages" element={<ExtractPages />} />
        <Route path="/tools/organize-pages" element={<OrganizePages />} />
        <Route path="/tools/rotate-pdf" element={<RotatePDF />} />
      </Routes>

      {/* Global Search Modal */}
      <Search isGlobal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Floating Search Button */}
      <button 
        className="search-floating-btn" 
        onClick={() => setIsSearchOpen(true)}
        aria-label="Search tools"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
    </>
  );
}

export default App;
