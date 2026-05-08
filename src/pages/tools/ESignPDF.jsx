import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import { formatFileSize, fileToArrayBuffer, renderAllPages } from '../../utils/pdfUtils';

export default function ESignPDF() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [thumbsLoading, setThumbsLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // Signature state
  const [signature, setSignature] = useState(null); // Data URL
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  
  // Placement state
  const [selectedPage, setSelectedPage] = useState(0);
  const [sigPosition, setSigPosition] = useState({ x: 50, y: 50 }); // percentages
  
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

  // Canvas drawing logic
  useEffect(() => {
    if (canvasRef.current && isDrawing) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'black';
    }
  }, [isDrawing]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    setSignature(canvas.toDataURL());
  };

  const handleApplySignature = async () => {
    if (!file || !signature) return;
    setLoading(true);

    try {
      const arrayBuffer = await fileToArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const page = pdfDoc.getPage(selectedPage);
      const { width, height } = page.getSize();
      
      const sigImg = await pdfDoc.embedPng(signature);
      const sigWidth = 150; // default width
      const sigHeight = (sigImg.height / sigImg.width) * sigWidth;
      
      const posX = (sigPosition.x / 100) * width - sigWidth / 2;
      const posY = (1 - sigPosition.y / 100) * height - sigHeight / 2;

      page.drawImage(sigImg, {
        x: posX,
        y: posY,
        width: sigWidth,
        height: sigHeight,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult({
        blob,
        name: file.name.replace(/\.[^/.]+$/, '') + '_signed.pdf',
        size: blob.size
      });
    } catch (err) {
      console.error(err);
      alert('Error signing PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <SEO title="eSign PDF" description="Sign your PDF documents online for free." path="/esign-pdf" />
      <ToolPageLayout
        title="eSign PDF"
        description="Draw or upload your signature and place it anywhere on your PDF."
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
                sublabel="Place your digital signature" 
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <h3 style={{ marginBottom: 16 }}>Position your signature</h3>
                  {thumbsLoading ? <p>Loading pages...</p> : (
                    <div style={{ position: 'relative', display: 'inline-block', border: '1px solid var(--border-light)' }}>
                      <img 
                        src={pages[selectedPage]} 
                        alt="Preview" 
                        style={{ maxWidth: '100%', maxHeight: '60vh', cursor: 'crosshair' }}
                        onClick={(e) => {
                          const rect = e.target.getBoundingClientRect();
                          const x = ((e.clientX - rect.left) / rect.width) * 100;
                          const y = ((e.clientY - rect.top) / rect.height) * 100;
                          setSigPosition({ x, y });
                        }}
                      />
                      {signature && (
                        <img 
                          src={signature} 
                          alt="Sig"
                          style={{ 
                            position: 'absolute', 
                            left: `${sigPosition.x}%`, 
                            top: `${sigPosition.y}%`, 
                            width: '100px', 
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none',
                            border: '1px dashed var(--accent-coral)'
                          }} 
                        />
                      )}
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
                  <h3 style={{ marginBottom: 16 }}>Draw Signature</h3>
                  <canvas 
                    ref={canvasRef}
                    width={260}
                    height={150}
                    style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: 8, cursor: 'crosshair', touchAction: 'none' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button onClick={clearCanvas} style={{ flex: 1, padding: '8px' }}>Clear</button>
                    <button onClick={saveSignature} style={{ flex: 1, padding: '8px', background: 'var(--accent-coral)', color: 'white', border: 'none', borderRadius: 4 }}>Capture</button>
                  </div>
                  
                  <div style={{ marginTop: 24 }}>
                    <ProcessButton 
                      label="Apply & Save" 
                      loadingLabel="Signing..." 
                      onClick={handleApplySignature} 
                      loading={loading} 
                      disabled={!signature}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <DownloadBanner 
            title="PDF Signed!" 
            info={`'${file.name}' signature applied.`}
            savedText={`Signed PDF generated — ${formatFileSize(result.size)}`}
            blob={result.blob}
            fileName={result.name}
            onReset={() => { setResult(null); setFile(null); setSignature(null); }}
          />
        )}
      </ToolPageLayout>
    </>
  );
}
