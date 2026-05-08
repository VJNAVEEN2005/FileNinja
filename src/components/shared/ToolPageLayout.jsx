import { Link } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';
import { saveAs } from 'file-saver';
import './ToolPageLayout.css';

import { tools } from '../../data/toolsData';

export default function ToolPageLayout({
  title,
  description,
  categoryColor = 'var(--accent-coral)',
  toolId = '',
  steps = [],
  children,
}) {
  const currentTool = tools.find(t => t.id === toolId);
  const related = currentTool 
    ? tools.filter(t => t.category === currentTool.category && t.id !== toolId).slice(0, 4)
    : [];

  return (
    <>
      <Navbar />
      <main className="tpl" style={{ '--tool-color': categoryColor }}>

        {/* ── Top breadcrumb bar ── */}
        <div className="tpl__topbar">
          <div className="tpl__container">
            <Link to="/" className="tpl__back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
              </svg>
              All Tools
            </Link>
            <span className="tpl__breadcrumb-sep">/</span>
            <span className="tpl__breadcrumb-current">{title}</span>
          </div>
        </div>

        {/* ── Two-panel layout ── */}
        <div className="tpl__container tpl__body">

          {/* ─ Left sidebar ─ */}
          <aside className="tpl__sidebar">
            <div className="tpl__sidebar-inner">

              {/* Tool identity */}
              <div className="tpl__tool-id" style={{ '--tool-color': categoryColor }}>
                <div className="tpl__tool-dot"></div>
                <div>
                  <h1 className="tpl__title">{title}</h1>
                  <p className="tpl__desc">{description}</p>
                </div>
              </div>

              {/* Steps guide */}
              {steps.length > 0 && (
                <div className="tpl__steps">
                  <p className="tpl__steps-label">How to use</p>
                  {steps.map((s, i) => (
                    <div className="tpl__step" key={i}>
                      <div className="tpl__step-num">{i + 1}</div>
                      <p className="tpl__step-text">{s}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Privacy note */}
              <div className="tpl__privacy">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Files never leave your browser
              </div>

              {/* Related tools */}
              {related.length > 0 && (
                <div className="tpl__related">
                  <p className="tpl__related-label">Related tools</p>
                  {related.map(t => (
                    <Link key={t.id} to={`/${t.id}`} className="tpl__related-link">
                      {t.name}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* ─ Main work area ─ */}
          <section className="tpl__main">
            {children}
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}

/* ── ProcessButton ── */
export function ProcessButton({ onClick, loading, disabled, label, loadingLabel }) {
  return (
    <button
      className={`process-btn ${loading ? 'process-btn--loading' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <span className="process-btn__spinner"></span>
          {loadingLabel || 'Processing...'}
        </>
      ) : label}
    </button>
  );
}

/* ── DownloadBanner ── */
export function DownloadBanner({ 
  onDownload, 
  onReset, 
  filename, 
  fileName, // Support both cases
  blob, 
  savedText,
  title = "Ready to download",
  info
}) {
  const finalFileName = fileName || filename || "document.pdf";

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (blob) {
      saveAs(blob, finalFileName);
    }
  };

  return (
    <div className="download-banner">
      <div className="download-banner__info">
        <div className="download-banner__icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div>
          <p className="download-banner__title">{info || title}</p>
          {savedText && <p className="download-banner__sub">{savedText}</p>}
        </div>
      </div>
      <div className="download-banner__actions">
        <button className="download-banner__dl" onClick={handleDownload}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download {finalFileName}
        </button>
        <button className="download-banner__reset" onClick={onReset}>Process another</button>
      </div>
    </div>
  );
}
