import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import { formatFileSize, fileToArrayBuffer, renderAllPages } from '../../utils/pdfUtils';

export default function RequestSignatures() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [thumbsLoading, setThumbsLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // Placeholder state
  const [selectedPage, setSelectedPage] = useState(0);
  const [placeholders, setPlaceholders] = useState([]); // [{ x, y, page, name }]
  const [recipientName, setRecipientName] = useState('');
  
  const handleFiles = async (newFiles) => {
    if (newFiles.length > 0) {
      const f = newFiles[0];
      setFile(f);
      setResult(null);
      setThumbsLoading(true);
      try {
        const thumbs = await renderAllPages(f, 0.4);
        setPages(thumbs);
      } catch (err) {
        console.error(err);
      } finally {
        setThumbsLoading(false);
      }
    }
  };

  const addPlaceholder = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setPlaceholders([...placeholders, {
      x, y, 
      page: selectedPage,
      name: recipientName || `Signer ${placeholders.length + 1}`
    }]);
  };

  const removePlaceholder = (index) => {
    setPlaceholders(placeholders.filter((_, i) => i !== index));
  };

  const handleApply = async () => {
    if (!file || placeholders.length === 0) return;
    setLoading(true);

    try {
      const arrayBuffer = await fileToArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      for (const ph of placeholders) {
        const page = pdfDoc.getPage(ph.page);
        const { width, height } = page.getSize();
        
        const boxWidth = 120;
        const boxHeight = 40;
        const posX = (ph.x / 100) * width - boxWidth / 2;
        const posY = (1 - ph.y / 100) * height - boxHeight / 2;

        // Draw a placeholder box
        page.drawRectangle({
          x: posX,
          y: posY,
          width: boxWidth,
          height: boxHeight,
          borderColor: rgb(0.29, 0.49, 1), // blue
          borderWidth: 2,
          color: rgb(0.9, 0.94, 1),
        });

        // Draw text
        page.drawText(`SIGN HERE: ${ph.name}`, {
          x: posX + 10,
          y: posY + 15,
          size: 10,
          font,
          color: rgb(0.2, 0.3, 0.6),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult({
        blob,
        name: file.name.replace(/\.[^/.]+$/, '') + '_prepared.pdf',
        size: blob.size
      });
    } catch (err) {
      console.error(err);
      alert('Error preparing document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <SEO title="Request Signatures" description="Prepare PDF documents for multi-party signing." path="/request-signatures" />
      <ToolPageLayout
        title="Request Signatures"
        description="Place signature tags on your document to guide recipients on where to sign."
      >
        <a onClick={() => navigate(-1)} style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </a>

        {!result ? (
          <div className="tool-section">
            {!file ? (
              <FileDropZone 
                onFiles={handleFiles} 
                multiple={false} 
                accept=".pdf"
                label="Drop PDF file here" 
                sublabel="Prepare document for signing" 
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <h3 style={{ marginBottom: 16 }}>Click on page to place signature tags</h3>
                  {thumbsLoading ? <p>Loading pages...</p> : (
                    <div style={{ position: 'relative', display: 'inline-block', border: '1px solid var(--border-light)' }}>
                      <img 
                        src={pages[selectedPage]} 
                        alt="Preview" 
                        style={{ maxWidth: '100%', maxHeight: '60vh', cursor: 'pointer' }}
                        onClick={addPlaceholder}
                      />
                      {placeholders.filter(p => p.page === selectedPage).map((ph, idx) => (
                        <div 
                          key={idx}
                          style={{ 
                            position: 'absolute', 
                            left: `${ph.x}%`, 
                            top: `${ph.y}%`, 
                            width: '100px', 
                            padding: '4px',
                            background: 'rgba(74, 124, 255, 0.8)',
                            color: 'white',
                            fontSize: '10px',
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none',
                            borderRadius: '4px',
                            textAlign: 'center'
                          }} 
                        >
                          Sign: {ph.name}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="tool-nav-group">
                    <button 
                      className="tool-nav-btn" 
                      onClick={() => setSelectedPage(Math.max(0, selectedPage - 1))} 
                      disabled={selectedPage === 0}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                      Prev
                    </button>
                    <span className="tool-nav-info">Page {selectedPage + 1} of {pages.length}</span>
                    <button 
                      className="tool-nav-btn" 
                      onClick={() => setSelectedPage(Math.min(pages.length - 1, selectedPage + 1))} 
                      disabled={selectedPage === pages.length - 1}
                    >
                      Next
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 16 }}>
                  <h3 style={{ marginBottom: 16 }}>Signer Details</h3>
                  <input 
                    type="text" 
                    placeholder="Recipient Name (optional)" 
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', marginBottom: 16 }}
                  />
                  
                  <div style={{ maxHeight: '30vh', overflowY: 'auto', marginBottom: 20 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>Placed Tags ({placeholders.length})</p>
                    {placeholders.map((ph, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'var(--bg-card)', borderRadius: 4, marginBottom: 4 }}>
                        <span style={{ fontSize: '0.75rem' }}>{ph.name} (Pg {ph.page + 1})</span>
                        <button onClick={() => removePlaceholder(idx)} style={{ color: '#cc0000', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                  </div>
                  
                  <ProcessButton 
                    label="Prepare Document" 
                    loadingLabel="Saving Tags..." 
                    onClick={handleApply} 
                    loading={loading} 
                    disabled={placeholders.length === 0}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <DownloadBanner 
            title="Document Prepared!" 
            info={`'${file.name}' tags applied.`}
            savedText={`Prepared PDF generated — ${formatFileSize(result.size)}`}
            blob={result.blob}
            fileName={result.name}
            onReset={() => { setResult(null); setFile(null); setPlaceholders([]); }}
          />
        )}
      </ToolPageLayout>
    </>
  );
}
