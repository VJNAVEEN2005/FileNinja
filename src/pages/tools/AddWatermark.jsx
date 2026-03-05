import { useState } from 'react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone, { FileItem } from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, formatFileSize, downloadPdf } from '../../utils/pdfUtils';
import SEO from '../../components/SEO';
import './ToolPage.css';

const POSITIONS = [
  { id: 'center', label: 'Center' },
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-right', label: 'Bottom Right' },
  { id: 'tiled', label: 'Tiled' },
];

export default function AddWatermark() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.15);
  const [rotation, setRotation] = useState(-45);
  const [color, setColor] = useState('#888888');
  const [position, setPosition] = useState('center');

  const handleFiles = (newFiles) => { if (newFiles.length > 0) { setFile(newFiles[0]); setResult(null); } };
  const removeFile = () => { setFile(null); setResult(null); };

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
  };

  const handleApply = async () => {
    if (!file || !text.trim()) return;
    setLoading(true);
    try {
      const bytes = await fileToArrayBuffer(file);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = fontSize;

      for (const page of pages) {
        const { width, height } = page.getSize();

        if (position === 'tiled') {
          const spacingX = textWidth + 80;
          const spacingY = textHeight + 120;
          for (let y = -height; y < height * 2; y += spacingY) {
            for (let x = -textWidth; x < width * 2; x += spacingX) {
              page.drawText(text, {
                x, y, size: fontSize, font,
                color: hexToRgb(color), opacity,
                rotate: degrees(rotation),
              });
            }
          }
        } else {
          let x, y;
          switch (position) {
            case 'top-left': x = 40; y = height - 40 - textHeight; break;
            case 'top-right': x = width - textWidth - 40; y = height - 40 - textHeight; break;
            case 'bottom-left': x = 40; y = 40; break;
            case 'bottom-right': x = width - textWidth - 40; y = 40; break;
            default: x = (width - textWidth) / 2; y = (height - textHeight) / 2;
          }
          page.drawText(text, {
            x, y, size: fontSize, font,
            color: hexToRgb(color), opacity,
            rotate: degrees(rotation),
          });
        }
      }

      const outBytes = await doc.save();
      setResult({ bytes: outBytes, size: outBytes.byteLength, pageCount: pages.length });
    } catch (err) {
      alert('Error adding watermark.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result) downloadPdf(result.bytes, `${file.name.replace(/\.[^/.]+$/, '')}_watermarked.pdf`);
  };

  const reset = () => { setFile(null); setResult(null); };

  return (
    <ToolPageLayout title="Add Watermark" description="Add text watermarks to your PDF pages."
      categoryColor="var(--cat-edit)" toolId="add-watermark"
      steps={['Upload your PDF', 'Customize the watermark', 'Download the watermarked PDF']}
    >
      <SEO title="Add Watermark to PDF — Free" description="Add text watermarks to PDFs. Free and private." path="/add-watermark" />
      {!result ? (
        <div className="tool-layout">
          <FileDropZone onFiles={handleFiles} multiple={false} label="Drop PDF file here" sublabel="Upload a PDF to add a watermark" />
          {file && (
            <div className="tool-section">
              <div className="tool-section__header">
                <h3 className="tool-section__title">{file.name} — {formatFileSize(file.size)}</h3>
                <button className="tool-section__clear" onClick={reset}>Clear</button>
              </div>
              <div className="watermark-options">
                <div className="metadata-form__field">
                  <label className="metadata-form__label">Watermark Text</label>
                  <input className="option-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter watermark text" />
                </div>
                <div className="watermark-options__row">
                  <div className="metadata-form__field">
                    <label className="metadata-form__label">Font Size</label>
                    <input className="option-input option-input--narrow" type="number" min="8" max="200" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
                  </div>
                  <div className="metadata-form__field">
                    <label className="metadata-form__label">Opacity</label>
                    <input type="range" min="0.05" max="0.8" step="0.01" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="compress-level__slider" style={{ background: 'var(--border-light)' }} />
                    <span className="tool-hint">{Math.round(opacity * 100)}%</span>
                  </div>
                  <div className="metadata-form__field">
                    <label className="metadata-form__label">Rotation</label>
                    <input className="option-input option-input--narrow" type="number" min="-90" max="90" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} />
                  </div>
                  <div className="metadata-form__field">
                    <label className="metadata-form__label">Color</label>
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 40, height: 34, border: 'none', cursor: 'pointer' }} />
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
              </div>
              <div className="tool-actions">
                <ProcessButton onClick={handleApply} loading={loading} disabled={!file || !text.trim()} label="Add Watermark" loadingLabel="Applying…" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="tool-layout">
          <DownloadBanner onDownload={handleDownload} onReset={reset}
            filename={`${file.name.replace(/\.[^/.]+$/, '')}_watermarked.pdf`}
            savedText={`Watermark applied to ${result.pageCount} page${result.pageCount !== 1 ? 's' : ''}`} />
        </div>
      )}
    </ToolPageLayout>
  );
}
