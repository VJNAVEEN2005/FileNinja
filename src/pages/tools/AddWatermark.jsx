import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import PDFEditorLayout from '../../components/shared/PDFEditorLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, downloadPdf, getPageCount } from '../../utils/pdfUtils';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import '../../components/shared/PDFEditor.css';

const COLORS = [
  { id: 'gray', label: 'Gray', hex: 'rgba(128,128,128,', rgb: [0.5, 0.5, 0.5] },
  { id: 'red', label: 'Red', hex: 'rgba(204,0,0,', rgb: [0.8, 0, 0] },
  { id: 'blue', label: 'Blue', hex: 'rgba(0,0,200,', rgb: [0, 0, 0.78] },
  { id: 'black', label: 'Black', hex: 'rgba(0,0,0,', rgb: [0, 0, 0] },
];

const POSITIONS = ['center', 'tiled'];

export default function AddWatermark() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(-30);
  const [colorId, setColorId] = useState('gray');
  const [position, setPosition] = useState('center');

  const canvasRef = useRef(null);
  const bgCanvasRef = useRef(null);

  const handleFiles = async (newFiles) => {
    if (newFiles.length > 0) {
      const f = newFiles[0];
      setFile(f);
      const count = await getPageCount(f);
      setPageCount(count); setCurrentPage(1);
    }
  };

  const redrawOverlay = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const W = canvasRef.current.width;
    const H = canvasRef.current.height;
    ctx.clearRect(0, 0, W, H);
    if (!text.trim()) return;

    const c = COLORS.find(cl => cl.id === colorId) || COLORS[0];
    ctx.font = `${fontSize}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle = `${c.hex}${opacity})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (position === 'tiled') {
      const spacingX = fontSize * 6;
      const spacingY = fontSize * 4;
      for (let y = -H; y < H * 2; y += spacingY) {
        for (let x = -W; x < W * 2; x += spacingX) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.fillText(text, 0, 0);
          ctx.restore();
        }
      }
    } else {
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  }, [text, fontSize, opacity, rotation, colorId, position]);

  useEffect(() => { redrawOverlay(); }, [redrawOverlay]);

  const handleSave = async () => {
    if (!file || !text.trim()) return;
    setLoading(true);
    try {
      const bytes = await fileToArrayBuffer(file);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const c = COLORS.find(cl => cl.id === colorId) || COLORS[0];

      for (const page of pages) {
        const { width, height } = page.getSize();
        if (position === 'tiled') {
          const spacingX = fontSize * 6;
          const spacingY = fontSize * 4;
          for (let y = 0; y < height; y += spacingY) {
            for (let x = 0; x < width; x += spacingX) {
              page.drawText(text, {
                x, y, size: fontSize, font,
                color: rgb(c.rgb[0], c.rgb[1], c.rgb[2]),
                opacity, rotate: degrees(rotation),
              });
            }
          }
        } else {
          const tw = font.widthOfTextAtSize(text, fontSize);
          page.drawText(text, {
            x: (width - tw) / 2, y: height / 2,
            size: fontSize, font,
            color: rgb(c.rgb[0], c.rgb[1], c.rgb[2]),
            opacity, rotate: degrees(rotation),
          });
        }
      }

      const outBytes = await doc.save();
      downloadPdf(outBytes, `${file.name.replace(/\.[^/.]+$/, '')}_watermark.pdf`);
    } catch (err) { alert('Error adding watermark.'); console.error(err); }
    finally { setLoading(false); }
  };

  if (!file) {
    return (
      <>
        <Navbar />
        <SEO title="Add Watermark to PDF" description="Add text watermarks to PDFs. Free and private." path="/add-watermark" />
        <div style={{ maxWidth: 700, margin: '80px auto', padding: '0 20px' }}>
          <a onClick={() => navigate(-1)} style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </a>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Add Watermark</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Add text watermarks to your PDF pages.</p>
          <FileDropZone onFiles={handleFiles} multiple={false} label="Drop PDF file here" sublabel="Upload a PDF to watermark" />
        </div>
      </>
    );
  }

  const toolbar = (
    <>
      <div className="editor-tool-group">
        <span className="editor-tool-label">Text</span>
        <input className="editor-text-input" style={{ maxWidth: 160 }}
          value={text} onChange={(e) => setText(e.target.value)} placeholder="Watermark text" />
      </div>
      <div className="editor-tool-group">
        <span className="editor-tool-label">Size</span>
        <input className="editor-size-input" type="number" min="12" max="200" value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))} />
      </div>
      <div className="editor-tool-group">
        <span className="editor-tool-label">Opacity</span>
        <input type="range" min="0.05" max="0.8" step="0.05" value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))} style={{ width: 80 }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{Math.round(opacity * 100)}%</span>
      </div>
      <div className="editor-tool-group">
        <span className="editor-tool-label">Angle</span>
        <input className="editor-size-input" type="number" min="-90" max="90" value={rotation}
          onChange={(e) => setRotation(Number(e.target.value))} />
      </div>
      <div className="editor-tool-group">
        {COLORS.map(c => (
          <button key={c.id} className={`editor-color-dot ${colorId === c.id ? 'active' : ''}`}
            style={{ backgroundColor: `${c.hex}1)` }} onClick={() => setColorId(c.id)} title={c.label} />
        ))}
      </div>
      <div className="editor-tool-group">
        {POSITIONS.map(p => (
          <button key={p} className={`editor-tool-btn ${position === p ? 'active' : ''}`}
            onClick={() => setPosition(p)}>{p === 'center' ? 'Center' : 'Tiled'}</button>
        ))}
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <SEO title="Add Watermark to PDF" description="Add text watermarks to PDFs. Free and private." path="/add-watermark" />
      <PDFEditorLayout
        file={file} toolbar={toolbar}
        canvasRef={canvasRef} bgCanvasRef={bgCanvasRef}
        currentPage={currentPage}
        setCurrentPage={(p) => setCurrentPage(typeof p === 'function' ? p(currentPage) : p)}
        pageCount={pageCount}
        redrawOverlay={redrawOverlay}
        canvasCursor="default"
        onSave={handleSave}
        onBack={() => navigate(-1)}
        saveLabel="Save changes"
        saveDisabled={!text.trim()}
        loading={loading}
        hint="Preview of your watermark on the current page"
      />
    </>
  );
}
