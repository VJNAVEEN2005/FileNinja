import { useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone, { FileItem } from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, formatFileSize, downloadPdf, getPageCount } from '../../utils/pdfUtils';
import SEO from '../../components/SEO';
import './ToolPage.css';

const COLORS = [
  { id: 'black', label: 'Black', rgb: [0, 0, 0] },
  { id: 'red', label: 'Red', rgb: [0.8, 0, 0] },
  { id: 'blue', label: 'Blue', rgb: [0, 0, 0.8] },
  { id: 'green', label: 'Green', rgb: [0, 0.5, 0] },
  { id: 'gray', label: 'Gray', rgb: [0.5, 0.5, 0.5] },
];

export default function AddText() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const [x, setX] = useState(72);
  const [y, setY] = useState(700);
  const [fontSize, setFontSize] = useState(14);
  const [color, setColor] = useState('black');
  const [bold, setBold] = useState(false);

  const handleFiles = async (newFiles) => {
    if (newFiles.length > 0) {
      const f = newFiles[0];
      setFile(f); setResult(null);
      const count = await getPageCount(f);
      setPageCount(count);
      setPage(1);
    }
  };
  const removeFile = () => { setFile(null); setResult(null); setPageCount(0); };

  const handleApply = async () => {
    if (!file || !text.trim()) return;
    setLoading(true);
    try {
      const bytes = await fileToArrayBuffer(file);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const fontName = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
      const font = await doc.embedFont(fontName);
      const pages = doc.getPages();
      const targetPage = pages[Math.min(page - 1, pages.length - 1)];
      const c = COLORS.find(cl => cl.id === color) || COLORS[0];

      targetPage.drawText(text, {
        x, y, size: fontSize, font,
        color: rgb(c.rgb[0], c.rgb[1], c.rgb[2]),
      });

      const outBytes = await doc.save();
      setResult({ bytes: outBytes, size: outBytes.byteLength });
    } catch (err) { alert('Error adding text.'); console.error(err); }
    finally { setLoading(false); }
  };

  const handleDownload = () => { if (result) downloadPdf(result.bytes, `${file.name.replace(/\.[^/.]+$/, '')}_text.pdf`); };
  const reset = () => { setFile(null); setResult(null); setPageCount(0); };

  return (
    <ToolPageLayout title="Add Text" description="Place text anywhere on your PDF pages."
      categoryColor="var(--cat-edit)" toolId="add-text"
      steps={['Upload your PDF', 'Enter text and set position', 'Download the edited PDF']}
    >
      <SEO title="Add Text to PDF — Free" description="Add text to PDFs. Free and private." path="/add-text" />
      {!result ? (
        <div className="tool-layout">
          <FileDropZone onFiles={handleFiles} multiple={false} label="Drop PDF file here" sublabel="Upload a PDF to add text" />
          {file && (
            <div className="tool-section">
              <div className="tool-section__header">
                <h3 className="tool-section__title">{file.name} — {formatFileSize(file.size)} — {pageCount} pages</h3>
                <button className="tool-section__clear" onClick={reset}>Clear</button>
              </div>
              <div className="watermark-options">
                <div className="metadata-form__field">
                  <label className="metadata-form__label">Text</label>
                  <textarea className="option-input" rows="3" value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter text to add…" />
                </div>
                <div className="watermark-options__row">
                  <div className="metadata-form__field">
                    <label className="metadata-form__label">Page</label>
                    <input className="option-input option-input--narrow" type="number" min="1" max={pageCount} value={page} onChange={(e) => setPage(Number(e.target.value))} />
                  </div>
                  <div className="metadata-form__field">
                    <label className="metadata-form__label">X Position (pt)</label>
                    <input className="option-input option-input--narrow" type="number" min="0" value={x} onChange={(e) => setX(Number(e.target.value))} />
                  </div>
                  <div className="metadata-form__field">
                    <label className="metadata-form__label">Y Position (pt)</label>
                    <input className="option-input option-input--narrow" type="number" min="0" value={y} onChange={(e) => setY(Number(e.target.value))} />
                  </div>
                  <div className="metadata-form__field">
                    <label className="metadata-form__label">Font Size</label>
                    <input className="option-input option-input--narrow" type="number" min="6" max="120" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
                  </div>
                </div>
                <div className="watermark-options__row">
                  <div className="metadata-form__field">
                    <label className="metadata-form__label">Color</label>
                    <div className="compress-level__labels">
                      {COLORS.map(c => (
                        <button key={c.id} className={`compress-level__preset ${color === c.id ? 'active' : ''}`} onClick={() => setColor(c.id)}>{c.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="metadata-form__field" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 22 }}>
                    <input type="checkbox" id="boldText" checked={bold} onChange={(e) => setBold(e.target.checked)} />
                    <label htmlFor="boldText" className="metadata-form__label" style={{ margin: 0 }}>Bold</label>
                  </div>
                </div>
              </div>
              <div className="tool-actions">
                <ProcessButton onClick={handleApply} loading={loading} disabled={!file || !text.trim()} label="Add Text" loadingLabel="Adding…" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="tool-layout">
          <DownloadBanner onDownload={handleDownload} onReset={reset}
            filename={`${file.name.replace(/\.[^/.]+$/, '')}_text.pdf`}
            savedText="Text added to PDF successfully" />
        </div>
      )}
    </ToolPageLayout>
  );
}
