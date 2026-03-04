import { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, formatFileSize, renderAllPages, parsePageRanges } from '../../utils/pdfUtils';
import SEO from '../../components/SEO';
import './ToolPage.css';

const MODES = [
  { id: 'range', label: 'By page range' },
  { id: 'every', label: 'Every N pages' },
  { id: 'odd-even', label: 'Odd / Even pages' },
];

export default function SplitPDF() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbs, setThumbs] = useState([]);
  const [thumbsLoading, setThumbsLoading] = useState(false);
  const [mode, setMode] = useState('range');
  const [rangeStr, setRangeStr] = useState('');
  const [everyN, setEveryN] = useState(1);
  const [oddEven, setOddEven] = useState('odd');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [splitResultBlob, setSplitResultBlob] = useState(null);
  const [splitCount, setSplitCount] = useState(0);

  const handleFile = async ([f]) => {
    setFile(f); setDone(false); setSplitResultBlob(null);
    setThumbsLoading(true);
    const pages = await renderAllPages(f, 0.28);
    setThumbs(pages);
    setPageCount(pages.length || 0);
    setThumbsLoading(false);
  };

  const reset = () => { setFile(null); setThumbs([]); setPageCount(0); setDone(false); setSplitResultBlob(null); };

  const handleSplit = async () => {
    if (!file) return;
    setLoading(true);
    setDone(false);
    setSplitResultBlob(null);
    try {
      const srcBytes = await fileToArrayBuffer(file);
      const srcDoc = await PDFDocument.load(srcBytes, { ignoreEncryption: true });
      const total = srcDoc.getPageCount();

      // Build groups of page indices
      let groups = [];
      if (mode === 'range') {
        const indices = parsePageRanges(rangeStr, total);
        if (indices.length === 0) { alert('No valid pages in range.'); setLoading(false); return; }
        groups = [indices];
      } else if (mode === 'every') {
        const n = Math.max(1, parseInt(everyN, 10));
        for (let start = 0; start < total; start += n) {
          groups.push(Array.from({ length: Math.min(n, total - start) }, (_, i) => start + i));
        }
      } else {
        const odd = [], even = [];
        for (let i = 0; i < total; i++) (i % 2 === 0 ? odd : even).push(i);
        groups = oddEven === 'odd' ? [odd] : [even];
      }

      if (groups.length === 1) {
        // Single output — direct download
        const out = await PDFDocument.create();
        const pages = await out.copyPages(srcDoc, groups[0]);
        pages.forEach(p => out.addPage(p));
        const outBytes = await out.save();
        const blob = new Blob([outBytes], { type: 'application/pdf' });
        setSplitResultBlob(blob);
        setSplitCount(1);
      } else {
        // Multiple outputs — ZIP
        const zip = new JSZip();
        for (let gi = 0; gi < groups.length; gi++) {
          const out = await PDFDocument.create();
          const pages = await out.copyPages(srcDoc, groups[gi]);
          pages.forEach(p => out.addPage(p));
          const outBytes = await out.save();
          zip.file(`split_part_${gi + 1}.pdf`, outBytes);
        }
        const blob = await zip.generateAsync({ type: 'blob' });
        setSplitResultBlob(blob);
        setSplitCount(groups.length);
      }
      setDone(true);
    } catch (err) {
      alert('Error splitting PDF.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!splitResultBlob) return;
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const fname = splitCount > 1 ? `${baseName}_split_parts.zip` : `${baseName}_split_output.pdf`;
    saveAs(splitResultBlob, fname);
  };

  return (
    <ToolPageLayout
      title="Split PDF"
      description="Separate a PDF into multiple files by range, every N pages, or odd/even."
      categoryColor="var(--cat-organize)"
      toolId="split-pdf"
      steps={[
        'Upload a single PDF file',
        'Choose your split method and configure it',
        'Click Split and download the output',
      ]}
    >
      <SEO 
        title="Split PDF Online — Free & Private"
        description="Split PDF pages instantly. Extract ranges, split every N pages, or separate odd/even pages. 100% free, private, and works in your browser."
        path="/split-pdf"
        faq={[
          { question: "Is splitting PDF files free on FileNinja?", answer: "Yes, it is completely free with no hidden charges or limits." },
          { question: "Can I split a PDF into individual pages?", answer: "Yes, by choosing the 'Every N pages' mode and setting N to 1, you can split the entire document into individual pages." },
          { question: "Are my files safe when splitting?", answer: "Absolutely. FileNinja processes everything locally in your browser. Your files are never uploaded to any server." },
          { question: "Does it work with password-protected PDFs?", answer: "Currently, you need to provide an unprotected PDF for processing. Support for password-protected files is coming soon." }
        ]}
      />
      <div className="tool-layout">
        {!file ? (
          <FileDropZone onFiles={handleFile} label="Drop a PDF to split" />
        ) : (
          <>
            <div className="tool-file-info">
              <span className="tool-file-name">{file.name}</span>
              <span className="tool-file-meta">{pageCount} pages &middot; {formatFileSize(file.size)}</span>
              <button className="tool-file-change" onClick={reset}>Change file</button>
            </div>

            {/* Thumbnails */}
            {thumbsLoading ? (
              <div className="thumb-grid">
                {Array.from({ length: Math.min(pageCount || 8, 12) }).map((_, i) => (
                  <div key={i} className="thumb-card"><div className="thumb-card__skeleton" /></div>
                ))}
              </div>
            ) : thumbs.length > 0 && (
              <div className="thumb-grid">
                {thumbs.map((src, i) => (
                  <div className="thumb-card" key={i}>
                    <div className="thumb-card__img-wrap">
                      {src ? <img src={src} alt={`Page ${i+1}`} className="thumb-card__img" /> : <div className="thumb-card__skeleton" />}
                    </div>
                    <span className="thumb-card__num">Page {i + 1}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Split mode selector */}
            <div className="tool-section">
              <h3 className="tool-section__title">Split method</h3>
              <div className="mode-tabs">
                {MODES.map(m => (
                  <button
                    key={m.id}
                    className={`mode-tab ${mode === m.id ? 'mode-tab--active' : ''}`}
                    onClick={() => setMode(m.id)}
                  >{m.label}</button>
                ))}
              </div>

              <div className="mode-options">
                {mode === 'range' && (
                  <div className="option-row">
                    <label className="option-label">Page ranges (e.g. 1-3, 5, 7-9)</label>
                    <input
                      className="option-input"
                      type="text"
                      placeholder="1-3, 5, 7-9"
                      value={rangeStr}
                      onChange={e => setRangeStr(e.target.value)}
                    />
                    <p className="tool-hint">Pages outside the range will be excluded.</p>
                  </div>
                )}
                {mode === 'every' && (
                  <div className="option-row">
                    <label className="option-label">Split every N pages</label>
                    <input
                      className="option-input option-input--narrow"
                      type="number"
                      min="1"
                      max={pageCount}
                      value={everyN}
                      onChange={e => setEveryN(e.target.value)}
                    />
                    <p className="tool-hint">Creates {Math.ceil(pageCount / Math.max(1, everyN))} output files. Downloaded as ZIP.</p>
                  </div>
                )}
                {mode === 'odd-even' && (
                  <div className="option-row">
                    <label className="option-label">Extract pages</label>
                    <div className="toggle-row">
                      <button className={`toggle-btn ${oddEven === 'odd' ? 'toggle-btn--active' : ''}`} onClick={() => setOddEven('odd')}>Odd pages</button>
                      <button className={`toggle-btn ${oddEven === 'even' ? 'toggle-btn--active' : ''}`} onClick={() => setOddEven('even')}>Even pages</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="tool-actions">
                <ProcessButton
                  onClick={handleSplit}
                  loading={loading}
                  disabled={!pageCount || (mode === 'range' && !rangeStr.trim())}
                  label="Split PDF"
                  loadingLabel="Splitting..."
                />
              </div>

              {done && (
                <DownloadBanner
                  onDownload={handleDownload}
                  onReset={reset}
                  filename={splitCount > 1 ? `${file.name.replace(/\.[^/.]+$/, "")}_split_parts.zip` : `${file.name.replace(/\.[^/.]+$/, "")}_split_output.pdf`}
                  savedText={splitCount > 1 ? `${splitCount} files packaged as ZIP` : '1 PDF created'}
                />
              )}
            </div>
          </>
        )}
      </div>
    </ToolPageLayout>
  );
}
