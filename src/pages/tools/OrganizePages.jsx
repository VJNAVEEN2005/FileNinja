import { useState, useRef } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, formatFileSize, downloadPdf, renderAllPages } from '../../utils/pdfUtils';
import './ToolPage.css';

export default function OrganizePages() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]); // [{ id, index, src, rotation }]
  const [loading, setLoading] = useState(false);
  const [thumbsLoading, setThumbsLoading] = useState(false);
  const [result, setResult] = useState(null); // { bytes, size }
  const dragIdx = useRef(null);

  const handleFile = async ([f]) => {
    setFile(f);
    setResult(null);
    setThumbsLoading(true);
    setPages([]);
    
    try {
      const thumbs = await renderAllPages(f, 0.28);
      // Initialize pages state with id, original index, src
      const initialPages = thumbs.map((src, i) => ({
        id: 'page-' + i + '-' + Math.random().toString(36).substring(2, 9),
        index: i,
        src,
      }));
      setPages(initialPages);
    } catch (err) {
      alert('Error loading PDF pages.');
      console.error(err);
    } finally {
      setThumbsLoading(false);
    }
  };

  const removePage = (id) => {
    setPages(prev => prev.filter(p => p.id !== id));
  };



  const onDragStart = (i, e) => { 
    dragIdx.current = i; 
    // Needed for Firefox drag and drop
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/html", e.target.parentNode);
    }
  };

  const onDragOver = (e, i) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;

    const fromIdx = dragIdx.current;
    dragIdx.current = i;

    setPages(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(i, 0, moved);
      return next;
    });
  };

  const onDragEnd = () => { dragIdx.current = null; };

  const handleApply = async () => {
    if (!file || pages.length === 0) return;
    setLoading(true);
    try {
      const srcBytes = await fileToArrayBuffer(file);
      const srcDoc = await PDFDocument.load(srcBytes, { ignoreEncryption: true });
      const merged = await PDFDocument.create();
      
      const indices = pages.map(p => p.index);
      const copiedPages = await merged.copyPages(srcDoc, indices);
      
      copiedPages.forEach(p => merged.addPage(p));
      
      const outBytes = await merged.save();
      setResult({ bytes: outBytes, size: outBytes.byteLength, count: pages.length });
    } catch (err) {
      alert('Error organizing PDF.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setFile(null); setPages([]); setResult(null); };

  return (
    <ToolPageLayout
      title="Organize Pages"
      description="Drag and drop to reorder pages or delete pages you don't need."
      categoryColor="var(--cat-organize)"
      toolId="organize-pages"
      steps={[
        'Upload your PDF file',
        'Drag pages to reorder, or use the buttons to delete',
        'Click Apply Changes and download',
      ]}
    >
      <div className="tool-layout">
        {!file ? (
          <FileDropZone onFiles={handleFile} label="Drop a PDF to organize" />
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
            ) : pages.length > 0 ? (
              <>
                <div className="selection-bar">
                  <p className="selection-bar__text">
                    <strong>{pages.length}</strong> page{pages.length !== 1 ? 's' : ''} in new document
                  </p>
                  <div className="selection-bar__actions">
                    {/* Rotate buttons removed */}
                  </div>
                </div>

                <div className="thumb-grid thumb-grid--organize" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                  {pages.map((page, i) => (
                    <div
                      key={page.id}
                      className="thumb-card"
                      draggable
                      onDragStart={(e) => onDragStart(i, e)}
                      onDragOver={(e) => onDragOver(e, i)}
                      onDragEnd={onDragEnd}
                      style={{ cursor: 'grab', position: 'relative' }}
                    >
                      <div className="thumb-card__img-wrap" style={{ overflow: 'hidden', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {page.src ? (
                          <img 
                            src={page.src} 
                            alt={"Page " + (page.index + 1)} 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'contain', 
                              pointerEvents: 'none' 
                            }} 
                          />
                        ) : (
                          <div className="thumb-card__skeleton" />
                        )}
                        <span className="thumb-card__pill" style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.75rem', padding: '2px 6px', borderRadius: 4, pointerEvents: 'none' }}>
                          {i + 1}
                        </span>
                      </div>
                      
                      <div className="thumb-card__actions" style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '8px 0' }}>
                        <button 
                          className="thumb-action-btn" 
                          onClick={() => removePage(page.id)} 
                          title="Delete Page"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--cat-edit)' }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="tool-actions">
                  <ProcessButton
                    onClick={handleApply}
                    loading={loading}
                    disabled={pages.length === 0}
                    label={pages.length > 0 ? "Apply Changes (" + pages.length + " pages)" : 'No pages selected'}
                    loadingLabel="Processing..."
                  />
                </div>
              </>
            ) : (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>All pages removed. Refresh or upload a new file.</p>
            )}
          </>
        ) : (
          <DownloadBanner
            onDownload={() => downloadPdf(result.bytes, `${file.name.replace(/\.[^/.]+$/, "")}_organized.pdf`)}
            onReset={reset}
            filename={`${file.name.replace(/\.[^/.]+$/, "")}_organized.pdf`}
            savedText={"PDF organized successfully — " + result.count + " pages, " + formatFileSize(result.size)}
          />
        )}
      </div>
    </ToolPageLayout>
  );
}
