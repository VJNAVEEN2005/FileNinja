import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, formatFileSize, renderAllPages, downloadPdf, parsePageRanges } from '../../utils/pdfUtils';
import './ToolPage.css';

export default function ExtractPages() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbs, setThumbs] = useState([]);
  const [thumbsLoading, setThumbsLoading] = useState(false);
  const [selected, setSelected] = useState(new Set()); // pages to KEEP
  const [rangeStr, setRangeStr] = useState('');
  const [useRange, setUseRange] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = async ([f]) => {
    setFile(f); setResult(null); setSelected(new Set()); setRangeStr('');
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

  const reset = () => { setFile(null); setThumbs([]); setPageCount(0); setSelected(new Set()); setRangeStr(''); setResult(null); };

  const getExtractIndices = () => {
    if (useRange) {
      return parsePageRanges(rangeStr, pageCount);
    }
    return [...selected].sort((a, b) => a - b);
  };

  const handleExtract = async () => {
    if (!file) return;
    const indices = getExtractIndices();
    if (indices.length === 0) { alert('Select at least one page to extract.'); return; }
    setLoading(true);
    try {
      const srcBytes = await fileToArrayBuffer(file);
      const srcDoc = await PDFDocument.load(srcBytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const pages = await out.copyPages(srcDoc, indices);
      pages.forEach(p => out.addPage(p));
      const outBytes = await out.save();
      setResult({ bytes: outBytes, size: outBytes.byteLength, count: indices.length });
    } catch (err) {
      alert('Error extracting pages.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const extractCount = getExtractIndices().length;

  return (
    <ToolPageLayout
      title="Extract Pages"
      description="Pull specific pages from a PDF into a new document."
      categoryColor="var(--cat-organize)"
      toolId="extract-pages"
      steps={[
        'Upload your PDF file',
        'Click pages to select, or type a range',
        'Click Extract and download the new PDF',
      ]}
    >
      <div className="tool-layout">
        {!file ? (
          <FileDropZone onFiles={handleFile} label="Drop a PDF to extract pages" />
        ) : (
          <>
            <div className="tool-file-info">
              <span className="tool-file-name">{file.name}</span>
              <span className="tool-file-meta">{pageCount} pages &middot; {formatFileSize(file.size)}</span>
              <button className="tool-file-change" onClick={reset}>Change file</button>
            </div>

            {!result && (
              <>
                {/* Mode toggle */}
                <div className="mode-tabs" style={{ marginBottom: 20 }}>
                  <button className={`mode-tab ${!useRange ? 'mode-tab--active' : ''}`} onClick={() => setUseRange(false)}>Click to select</button>
                  <button className={`mode-tab ${useRange ? 'mode-tab--active' : ''}`} onClick={() => setUseRange(true)}>Enter range</button>
                </div>

                {useRange ? (
                  <div className="tool-section">
                    <div className="option-row">
                      <label className="option-label">Page ranges to extract (e.g. 1-3, 5, 8-10)</label>
                      <input
                        className="option-input"
                        type="text"
                        placeholder="e.g. 1-3, 5, 8-10"
                        value={rangeStr}
                        onChange={e => setRangeStr(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="selection-bar">
                      <p className="selection-bar__text">
                        {selected.size > 0
                          ? <><strong>{selected.size}</strong> page{selected.size !== 1 ? 's' : ''} selected</>
                          : 'Click pages to select them for extraction'}
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
                            className={`thumb-card ${selected.has(i) ? 'selected' : ''}`}
                            onClick={() => togglePage(i)}
                          >
                            <div className="thumb-card__img-wrap">
                              {src ? <img src={src} alt={`Page ${i+1}`} className="thumb-card__img" /> : <div className="thumb-card__skeleton" style={{ height: '100%' }} />}
                              <div className="thumb-card__overlay">
                                <div className="thumb-card__check">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                              </div>
                            </div>
                            <span className="thumb-card__num">Page {i + 1}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div className="tool-actions">
                  <ProcessButton
                    onClick={handleExtract}
                    loading={loading}
                    disabled={extractCount === 0}
                    label={extractCount > 0 ? `Extract ${extractCount} page${extractCount !== 1 ? 's' : ''}` : 'Select pages to extract'}
                    loadingLabel="Extracting..."
                  />
                </div>
              </>
            )}

            {result && (
              <DownloadBanner
                onDownload={() => downloadPdf(result.bytes, 'extracted_pages.pdf')}
                onReset={reset}
                filename="extracted_pages.pdf"
                savedText={`${result.count} page${result.count !== 1 ? 's' : ''} extracted — ${formatFileSize(result.size)}`}
              />
            )}
          </>
        )}
      </div>
    </ToolPageLayout>
  );
}
