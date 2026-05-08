import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { tools } from '../data/toolsData';
import './Search.css';

const ToolIcon = ({ icon, className = "w-5 h-5" }) => {
  const icons = {
    'layers': <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
    'scissors': <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>,
    'trash': <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
    'file-output': <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M15 13H9l2 2"/><path d="m11 11-2 2"/></svg>,
    'grid': <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    'rotate-cw': <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    'minimize': <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>,
    'wrench': <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
    'scan': <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>,
    'zap': <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    'lock': <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    'image': <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    'file-text': <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  };
  return icons[icon] || <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
};

function getCategoryColor(category) {
  const colors = {
    'organize': { hex: '#4A7CFF', rgb: '74, 124, 255' },
    'optimize': { hex: '#22C997', rgb: '34, 201, 151' },
    'edit': { hex: '#FF6B4A', rgb: '255, 107, 74' },
    'convert-to': { hex: '#9B5CFF', rgb: '155, 92, 255' },
    'convert-from': { hex: '#FF4A8D', rgb: '255, 74, 141' },
    'security': { hex: '#FFB020', rgb: '255, 176, 32' },
    'ai': { hex: '#00BCD4', rgb: '0, 188, 212' },
    'forms': { hex: '#7C6EF0', rgb: '124, 110, 240' },
    'batch': { hex: '#5C6BC0', rgb: '92, 107, 192' }
  };
  return colors[category] || { hex: '#8A8A8A', rgb: '138, 138, 138' };
}

export default function Search({ isGlobal = false, isOpen: externalIsOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const isOpen = isGlobal ? externalIsOpen : (internalIsOpen || query.trim().length > 0);

  // Auto-focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Click outside to close (only for global modal)
  useEffect(() => {
    if (!isGlobal || !isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isGlobal, isOpen, onClose]);

  // Filter tools based on query
  useEffect(() => {
    if (query.trim().length > 0) {
      const filtered = tools.filter(tool => 
        tool.name.toLowerCase().includes(query.toLowerCase()) ||
        tool.desc.toLowerCase().includes(query.toLowerCase()) ||
        tool.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6);
      setResults(filtered);
      setSelectedIndex(-1);
      if (!isGlobal) setInternalIsOpen(true);
    } else {
      setResults([]);
      if (!isGlobal) setInternalIsOpen(false);
    }
  }, [query, isGlobal]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      if (isGlobal) {
        onClose?.();
      } else {
        setInternalIsOpen(false);
        inputRef.current?.blur();
      }
    }
  };

  const handleSelect = (tool) => {
    navigate(`/${tool.id}`);
    setQuery('');
    if (isGlobal && onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  // Global shortcut (Ctrl+K)
  useEffect(() => {
    const handleGlobalShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isGlobal) {
          // If we're the global instance, the parent App.jsx will handle opening
          // But we can trigger onClose or similar if needed.
          // Actually, App.jsx will set isOpen to true.
        } else {
          inputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalShortcut);
    return () => window.removeEventListener('keydown', handleGlobalShortcut);
  }, [isGlobal]);

  // Animations on result changes
  useEffect(() => {
    if (isOpen && results.length > 0 && resultsRef.current) {
      gsap.fromTo(resultsRef.current, 
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }
      );
    }
  }, [results.length, isOpen]);

  if (isGlobal && !isOpen) return null;

  const showResults = isOpen || (query.trim().length > 0);

  const content = (
    <div className={`search-container ${isGlobal ? 'search-container--global' : ''}`} ref={containerRef}>
      <div className="search-input-wrapper">
        <svg className="search-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref={inputRef}
          type="search"
          className="search-input"
          placeholder="Search tools (e.g. merge, word, ai)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => !isGlobal && query.trim().length > 0 && setInternalIsOpen(true)}
          enterKeyHint="search"
        />
        <div className="search-shortcut">
          <span>Ctrl</span>
          <span>K</span>
        </div>
        {isGlobal && (
          <button className="search-close-btn" onClick={onClose} aria-label="Close search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {showResults && (
        <div className="search-results" ref={resultsRef}>
          {results.length > 0 ? (
            results.map((tool, index) => (
              <div
                key={tool.id}
                className={`search-result-item ${index === selectedIndex ? 'search-result-item--active' : ''}`}
                onClick={() => handleSelect(tool)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="search-result-icon">
                  <ToolIcon icon={tool.icon} />
                </div>
                <div className="search-result-content">
                  <div className="search-result-name">{tool.name}</div>
                  <div className="search-result-desc">{tool.desc}</div>
                </div>
                <div 
                  className="search-result-category" 
                  style={{ 
                    '--cat-color': getCategoryColor(tool.category).hex,
                    '--cat-color-rgb': getCategoryColor(tool.category).rgb
                  }}
                >
                  {tool.category.replace('-', ' ')}
                </div>
              </div>
            ))
          ) : query.trim().length > 0 ? (
            <div className="search-no-results">
              No tools found for "{query}"
            </div>
          ) : isGlobal ? (
            <div className="search-recent-hint">
              Start typing to find professional PDF tools...
            </div>
          ) : null}
        </div>
      )}
    </div>
  );

  if (isGlobal) {
    return (
      <div className="search-modal-overlay">
        {content}
      </div>
    );
  }

  return content;
}
