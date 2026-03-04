import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, formatFileSize, renderAllPages, downloadPdf } from '../../utils/pdfUtils';
import './ToolPage.css';

export default function RemovePages() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbs, setThumbs] = useState([]);
  const [thumbsLoading, setThumbsLoading] = useState(false);
  const [selected, setSelected] = useState(new Set()); // pages to REMOVE
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = async ([f]) => {
    setFile(f); setResult(null); setSelected(new Set());
    setThumbsLoading(true);
    const pages = await renderAllPages(f, 0.28);
    setThumbs(pages);
    setPageCount(pages.length);
    setThumbsLoading(false);
  };

  const togglePage = (i) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(Array.from({ length: pageCount }, (_, i) => i)));
  const deselectAll = () => setSelected(new Set());

  const reset = () => { setFile(null); setThumbs([]); setPageCount(0); setSelected(new Set()); setResult(null); };

  const handleRemove = async () => {
    if (!file || selected.size === 0) return;
    if (selected.size >= pageCount) { alert('Cannot remove all pages from a PDF.'); return; }
    setLoading(true);
    try {
      const srcBytes = await fileToArrayBuffer(file);
      const srcDoc = await PDFDocument.load(srcBytes, { ignoreEncryption: true });
      const keepIndices = Array.from({ length: pageCount }, (_, i) => i).filter(i => !selected.has(i));
      const out = await PDFDocument.create();
      const pages = await out.copyPages(srcDoc, keepIndices);
      pages.forEach(p => out.addPage(p));
      const outBytes = await out.save();
      setResult({ bytes: outBytes, size: outBytes.byteLength, kept: keepIndices.length });
    } catch (err) {
      alert('Error removing pages.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolPageLayout
      title="Remove Pages"
      description="Select the pages you want to delete, then download the cleaned PDF."
      categoryColor="var(--cat-organize)"
      toolId="remove-pages"
      steps={[
        'Upload your PDF file',
        'Click thumbnails to mark pages for removal',
        'Click Remove and download the result',
      ]}
    >
      <div className="tool-layout">
        {!file ? (
          <FileDropZone onFiles={handleFile} label="Drop a PDF to remove pages" />
        ) : (
          <>
            <div className="tool-file-info">
              <span className="tool-file-name">{file.name}</span>
              <span className="tool-file-meta">{pageCount} pages &middot; {formatFileSize(file.size)}</span>
              <button className="tool-file-change" onClick={reset}>Change file</button>
            </div>

            {!result && (
              <>
                <div className="selection-bar">
                  <p className="selection-bar__text">
                    {selected.size > 0
                      ? <><strong>{selected.size}</strong> page{selected.size !== 1 ? 's' : ''} marked for removal</>
                      : 'Click pages to mark them for removal'}
                  </p>
                  <div className="selection-bar__actions">
                    <button className="sel-btn" onClick={selectAll}>Select all</button>
                    <button className="sel-btn" onClick={deselectAll}>Deselect all</button>
                  </div>
                </div>

                {thumbsLoading ? (
                  <div className="thumb-grid">
                    {Array.from({ length: Math.min(pageCount || 8, 12) }).map((_, i) => (
                      <div key={i}><div className="thumb-card__skeleton" style={{ aspectRatio: '3/4', borderRadius: 8 }} /></div>
                    ))}
                  </div>
                ) : (
                  <div className="thumb-grid">
                    {thumbs.map((src, i) => (
                      <div
                        key={i}
                        className={`thumb-card ${selected.has(i) ? 'selected remove-selected' : ''}`}
                        onClick={() => togglePage(i)}
                      >
                        <div className="thumb-card__img-wrap">
                          {src ? <img src={src} alt={`Page ${i+1}`} className="thumb-card__img" /> : <div className="thumb-card__skeleton" style={{ height: '100%' }} />}
                          <div className="thumb-card__overlay">
                            <div className="thumb-card__check thumb-card__check--red">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          </div>
                          {selected.has(i) && (
                            <div className="remove-badge">Remove</div>
                          )}
                        </div>
                        <span className="thumb-card__num">Page {i + 1}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="tool-actions">
                  <ProcessButton
                    onClick={handleRemove}
                    loading={loading}
                    disabled={selected.size === 0 || !pageCount}
                    label={selected.size > 0 ? `Remove ${selected.size} page${selected.size !== 1 ? 's' : ''}` : 'Select pages to remove'}
                    loadingLabel="Processing..."
                  />
                </div>
              </>
            )}

            {result && (
              <DownloadBanner
                onDownload={() => downloadPdf(result.bytes, `${file.name.replace(/\.[^/.]+$/, "")}_removed.pdf`)}
                onReset={reset}
                filename={`${file.name.replace(/\.[^/.]+$/, "")}_removed.pdf`}
                savedText={`${result.kept} pages kept, ${selected.size} removed`}
              />
            )}
          </>
        )}
      </div>
    </ToolPageLayout>
  );
}
