import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToolPageLayout from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import { formatFileSize, renderAllPages } from '../../utils/pdfUtils';

export default function ComparePDF() {
  const navigate = useNavigate();
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [pages1, setPages1] = useState([]);
  const [pages2, setPages2] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPage, setSelectedPage] = useState(0);

  const handleFile1 = async (files) => {
    if (files.length > 0) {
      setFile1(files[0]);
      setLoading(true);
      try {
        const thumbs = await renderAllPages(files[0], 0.8);
        setPages1(thumbs);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
  };

  const handleFile2 = async (files) => {
    if (files.length > 0) {
      setFile2(files[0]);
      setLoading(true);
      try {
        const thumbs = await renderAllPages(files[0], 0.8);
        setPages2(thumbs);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
  };

  const reset = () => {
    setFile1(null);
    setFile2(null);
    setPages1([]);
    setPages2([]);
    setSelectedPage(0);
  };

  const maxPages = Math.max(pages1.length, pages2.length);

  return (
    <>
      <Navbar />
      <SEO title="Compare PDF" description="Compare two PDF files side-by-side." path="/compare-pdf" />
      <ToolPageLayout
        title="Compare PDF"
        description="Visually compare two PDF documents side-by-side to find differences."
      >
        <a onClick={() => navigate(-1)} style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </a>

        <div className="tool-section">
          {!file1 || !file2 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <p style={{ marginBottom: 8, fontWeight: 600 }}>First Document</p>
                <FileDropZone onFiles={handleFile1} label="Drop first PDF" />
                {file1 && <p style={{ marginTop: 8, fontSize: '0.8rem' }}>{file1.name} ({formatFileSize(file1.size)})</p>}
              </div>
              <div>
                <p style={{ marginBottom: 8, fontWeight: 600 }}>Second Document</p>
                <FileDropZone onFiles={handleFile2} label="Drop second PDF" />
                {file2 && <p style={{ marginTop: 8, fontSize: '0.8rem' }}>{file2.name} ({formatFileSize(file2.size)})</p>}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div className="tool-nav-group" style={{ marginTop: 20 }}>
                    <button 
                      className="tool-nav-btn" 
                      onClick={() => setSelectedPage(Math.max(0, selectedPage - 1))} 
                      disabled={selectedPage === 0}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                      Prev
                    </button>
                    <span className="tool-nav-info">Page {selectedPage + 1} of {maxPages}</span>
                    <button 
                      className="tool-nav-btn" 
                      onClick={() => setSelectedPage(Math.min(maxPages - 1, selectedPage + 1))} 
                      disabled={selectedPage === maxPages - 1}
                    >
                      Next
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>
                <button onClick={reset} style={{ background: 'none', border: 'none', color: '#cc0000', cursor: 'pointer' }}>New Comparison</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', marginBottom: 4, fontWeight: 700 }}>Original: {file1.name}</p>
                  {pages1[selectedPage] ? (
                    <img src={pages1[selectedPage]} alt="Doc 1" style={{ maxWidth: '100%', border: '1px solid #ddd' }} />
                  ) : <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>- No Page -</div>}
                </div>
                <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', marginBottom: 4, fontWeight: 700 }}>Modified: {file2.name}</p>
                  {pages2[selectedPage] ? (
                    <img src={pages2[selectedPage]} alt="Doc 2" style={{ maxWidth: '100%', border: '1px solid #ddd' }} />
                  ) : <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>- No Page -</div>}
                </div>
              </div>
              
              <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-elevated)', borderRadius: 12 }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong>Tip:</strong> This is a visual comparison. Scroll through pages to spot changes in layout, text, or images between the two documents.
                </p>
              </div>
            </div>
          )}
        </div>
      </ToolPageLayout>
    </>
  );
}
