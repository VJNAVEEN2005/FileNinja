import { useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone, { FileItem } from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, formatFileSize, downloadPdf } from '../../utils/pdfUtils';
import SEO from '../../components/SEO';
import './ToolPage.css';

const POSITIONS = [
  { id: 'bottom-center', label: 'Bottom Center' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-right', label: 'Bottom Right' },
  { id: 'top-center', label: 'Top Center' },
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-right', label: 'Top Right' },
];

const FORMATS = [
  { id: 'number', label: '1, 2, 3…', fn: (n) => `${n}` },
  { id: 'page-n', label: 'Page 1', fn: (n) => `Page ${n}` },
  { id: 'page-of', label: 'Page 1 of N', fn: (n, t) => `Page ${n} of ${t}` },
  { id: 'dash', label: '— 1 —', fn: (n) => `— ${n} —` },
];

export default function AddPageNumbers() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [position, setPosition] = useState('bottom-center');
  const [format, setFormat] = useState('number');
  const [startNum, setStartNum] = useState(1);
  const [fontSize, setFontSize] = useState(11);
  const [skipFirst, setSkipFirst] = useState(false);

  const handleFiles = (newFiles) => { if (newFiles.length > 0) { setFile(newFiles[0]); setResult(null); } };
  const removeFile = () => { setFile(null); setResult(null); };

  const handleApply = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const bytes = await fileToArrayBuffer(file);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const total = pages.length;
      const fmt = FORMATS.find(f => f.id === format) || FORMATS[0];

      pages.forEach((page, i) => {
        if (skipFirst && i === 0) return;
        const pageNum = i + startNum;
        const text = fmt.fn(pageNum, total + startNum - 1);
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const { width, height } = page.getSize();
        const margin = 36;

        let x, y;
        if (position.includes('bottom')) y = margin;
        else y = height - margin;

        if (position.includes('left')) x = margin;
        else if (position.includes('right')) x = width - textWidth - margin;
        else x = (width - textWidth) / 2;

        page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
      });

      const outBytes = await doc.save();
      setResult({ bytes: outBytes, size: outBytes.byteLength, pageCount: pages.length });
    } catch (err) {
      alert('Error adding page numbers.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result) downloadPdf(result.bytes, `${file.name.replace(/\.[^/.]+$/, '')}_numbered.pdf`);
  };

  const reset = () => { setFile(null); setResult(null); };

  return (
    <ToolPageLayout title="Page Numbers" description="Add page numbers in any format and position."
      categoryColor="var(--cat-edit)" toolId="add-page-numbers"
      steps={['Upload your PDF', 'Choose format and position', 'Download the numbered PDF']}
    >
      <SEO title="Add Page Numbers to PDF — Free" description="Add page numbers to PDFs. Free and private." path="/add-page-numbers" />
      {!result ? (
        <div className="tool-layout">
          <FileDropZone onFiles={handleFiles} multiple={false} label="Drop PDF file here" sublabel="Upload a PDF to add page numbers" />
          {file && (
            <div className="tool-section">
              <div className="tool-section__header">
                <h3 className="tool-section__title">{file.name} — {formatFileSize(file.size)}</h3>
                <button className="tool-section__clear" onClick={reset}>Clear</button>
              </div>
              <div className="watermark-options">
                <div className="metadata-form__field">
                  <label className="metadata-form__label">Format</label>
                  <div className="compress-level__labels">
                    {FORMATS.map((f) => (
                      <button key={f.id} className={`compress-level__preset ${format === f.id ? 'active' : ''}`} onClick={() => setFormat(f.id)}>{f.label}</button>
                    ))}
                  </div>
                </div>
                <div className="metadata-form__field">
                  <label className="metadata-form__label">Position</label>
                  <div className="compress-level__labels">
                    {POSITIONS.map((p) => (
                      <button key={p.id} className={`compress-level__preset ${position === p.id ? 'active' : ''}`} onClick={() => setPosition(p.id)}>{p.label}</button>
                    ))}
                  </div>
                </div>
                <div className="watermark-options__row">
                  <div className="metadata-form__field">
                    <label className="metadata-form__label">Start Number</label>
                    <input className="option-input option-input--narrow" type="number" min="1" value={startNum} onChange={(e) => setStartNum(Number(e.target.value))} />
                  </div>
                  <div className="metadata-form__field">
                    <label className="metadata-form__label">Font Size</label>
                    <input className="option-input option-input--narrow" type="number" min="6" max="36" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
                  </div>
                  <div className="metadata-form__field" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 22 }}>
                    <input type="checkbox" id="skipFirst" checked={skipFirst} onChange={(e) => setSkipFirst(e.target.checked)} />
                    <label htmlFor="skipFirst" className="metadata-form__label" style={{ margin: 0 }}>Skip first page</label>
                  </div>
                </div>
              </div>
              <div className="tool-actions">
                <ProcessButton onClick={handleApply} loading={loading} disabled={!file} label="Add Page Numbers" loadingLabel="Adding…" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="tool-layout">
          <DownloadBanner onDownload={handleDownload} onReset={reset}
            filename={`${file.name.replace(/\.[^/.]+$/, '')}_numbered.pdf`}
            savedText={`Page numbers added to ${result.pageCount} pages`} />
        </div>
      )}
    </ToolPageLayout>
  );
}
