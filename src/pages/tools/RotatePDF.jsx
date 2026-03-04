import { useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, formatFileSize, downloadPdf, renderAllPages } from '../../utils/pdfUtils';
import SEO from '../../components/SEO';
import './ToolPage.css';

export default function RotatePDF() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]); // [{ id, index, src, rotation }]
  const [loading, setLoading] = useState(false);
  const [thumbsLoading, setThumbsLoading] = useState(false);
  const [result, setResult] = useState(null); // { bytes, size }

  const handleFile = async ([f]) => {
    setFile(f);
    setResult(null);
    setThumbsLoading(true);
    setPages([]);
    
    try {
      const thumbs = await renderAllPages(f, 0.28);
      const initialPages = thumbs.map((src, i) => ({
        id: 'page-' + i + '-' + Math.random().toString(36).substring(2, 9),
        index: i,
        src,
        rotation: 0,
      }));
      setPages(initialPages);
    } catch (err) {
      alert('Error loading PDF pages.');
      console.error(err);
    } finally {
      setThumbsLoading(false);
    }
  };

  const rotatePage = (id, direction) => {
    setPages(prev => prev.map(p => {
      if (p.id === id) {
        const newRot = direction === 'right' ? (p.rotation + 90) % 360 : (p.rotation - 90 + 360) % 360;
        return { ...p, rotation: newRot };
      }
      return p;
    }));
  };

  const rotateAll = (direction) => {
    setPages(prev => prev.map(p => {
      const newRot = direction === 'right' ? (p.rotation + 90) % 360 : (p.rotation - 90 + 360) % 360;
      return { ...p, rotation: newRot };
    }));
  };

  const handleApply = async () => {
    if (!file || pages.length === 0) return;
    setLoading(true);
    try {
      const srcBytes = await fileToArrayBuffer(file);
      const srcDoc = await PDFDocument.load(srcBytes, { ignoreEncryption: true });
      const merged = await PDFDocument.create();
      
      const indices = pages.map(p => p.index);
      const copiedPages = await merged.copyPages(srcDoc, indices);
      
      copiedPages.forEach((p, idx) => {
        const addedRotation = pages[idx].rotation;
        if (addedRotation !== 0) {
          const currentRotation = p.getRotation().angle;
          p.setRotation(degrees((currentRotation + addedRotation) % 360));
        }
        merged.addPage(p);
      });
      
      const outBytes = await merged.save();
      setResult({ bytes: outBytes, size: outBytes.byteLength, count: pages.length });
    } catch (err) {
      alert('Error rotating PDF.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setFile(null); setPages([]); setResult(null); };

  const hasChanges = pages.some(p => p.rotation !== 0);

  return (
    <ToolPageLayout
      title="Rotate PDF"
      description="Rotate individual PDF pages or all pages at once to any orientation."
      categoryColor="var(--cat-organize)"
      toolId="rotate-pdf"
      steps={[
        'Upload your PDF document',
        'Use the buttons to rotate specific pages or all pages',
        'Click Apply Rotation and download your file',
      ]}
    >
      <SEO 
        title="Rotate PDF Online Free — Free & Private"
        description="Rotate PDF pages individually or all at once. Save orientation permanently. 100% free, private, and works entirely in your browser."
        path="/rotate-pdf"
        faq={[
          { question: "Is rotating PDFs free on FileNinja?", answer: "Yes, it is completely free with no registration or limits." },
          { question: "Can I rotate only specific pages in a PDF?", answer: "Yes, FileNinja allows you to select and rotate individual pages or use the global rotation buttons to rotate the entire document." },
          { question: "Will my rotated file be saved securely?", answer: "Yes. All processing happens in your browser. Your file is never uploaded and the rotated version is generated locally on your device." },
          { question: "What rotation angles are supported?", answer: "You can rotate pages in 90-degree increments (90°, 180°, 270°) both clockwise and counter-clockwise." }
        ]}
      />
      <div className="tool-layout">
        {!file ? (
          <FileDropZone onFiles={handleFile} label="Drop a PDF to rotate" />
        ) : !result ? (
          <>
            <div className="tool-file-info">
              <span className="tool-file-name">{file.name}</span>
              <span className="tool-file-meta">{pages.length} pages &middot; {formatFileSize(file.size)}</span>
              <button className="tool-file-change" onClick={reset}>Change file</button>
            </div>

            {thumbsLoading ? (
              <div className="thumb-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i}><div className="thumb-card__skeleton" style={{ aspectRatio: '3/4', borderRadius: 8 }} /></div>
                ))}
              </div>
            ) : pages.length > 0 && (
              <>
                <div className="selection-bar">
                  <p className="selection-bar__text">
                    <strong>{pages.length}</strong> pages loaded
                  </p>
                  <div className="selection-bar__actions">
                    <button className="sel-btn" onClick={() => rotateAll('left')} title="Rotate all left">Left (-90°)</button>
                    <button className="sel-btn" onClick={() => rotateAll('right')} title="Rotate all right">Right (+90°)</button>
                  </div>
                </div>

                <div className="thumb-grid thumb-grid--organize" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                  {pages.map((page, i) => (
                    <div key={page.id} className="thumb-card">
                      <div className="thumb-card__img-wrap" style={{ overflow: 'hidden', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {page.src ? (
                          <img 
                            src={page.src} 
                            alt={"Page " + (page.index + 1)} 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'contain', 
                              transform: "rotate(" + page.rotation + "deg)",
                              transition: 'transform 0.2s ease', 
                            }} 
                          />
                        ) : (
                          <div className="thumb-card__skeleton" />
                        )}
                        <span className="thumb-card__pill" style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.75rem', padding: '2px 6px', borderRadius: 4 }}>
                          {i + 1}
                        </span>
                      </div>
                      
                      <div className="thumb-card__actions" style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '8px 0' }}>
                        <button 
                          className="thumb-action-btn" 
                          onClick={() => rotatePage(page.id, 'left')} 
                          title="Rotate Left"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                        </button>
                        <button 
                          className="thumb-action-btn" 
                          onClick={() => rotatePage(page.id, 'right')} 
                          title="Rotate Right"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="tool-actions">
                  <ProcessButton
                    onClick={handleApply}
                    loading={loading}
                    disabled={!hasChanges}
                    label={hasChanges ? "Apply Rotation" : "Rotate pages to apply"}
                    loadingLabel="Rotating..."
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <DownloadBanner
            onDownload={() => downloadPdf(result.bytes, `${file.name.replace(/\.[^/.]+$/, "")}_rotated.pdf`)}
            onReset={reset}
            filename={`${file.name.replace(/\.[^/.]+$/, "")}_rotated.pdf`}
            savedText={"PDF rotated successfully — " + formatFileSize(result.size)}
          />
        )}
      </div>
    </ToolPageLayout>
  );
}
