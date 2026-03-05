import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import PDFEditorLayout from '../../components/shared/PDFEditorLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, downloadPdf, getPageCount } from '../../utils/pdfUtils';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import '../../components/shared/PDFEditor.css';

const COLORS = [
  { id: 'black', hex: '#000000' }, { id: 'red', hex: '#cc0000' },
  { id: 'blue', hex: '#0044cc' }, { id: 'green', hex: '#008800' },
  { id: 'orange', hex: '#ff6600' }, { id: 'purple', hex: '#7700aa' },
];
const SIZES = [2, 4, 6, 10];

export default function DrawOnPDF() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [colorId, setColorId] = useState('black');
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);

  // strokes: { [page]: [ [{x,y}, ...], ... ] }
  const strokesRef = useRef({});
  const [strokesVersion, setStrokesVersion] = useState(0);
  const canvasRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const currentStroke = useRef([]);
  const currentProps = useRef({ color: '#000000', size: 4 });

  const handleFiles = async (newFiles) => {
    if (newFiles.length > 0) {
      const f = newFiles[0];
      setFile(f); strokesRef.current = {};
      const count = await getPageCount(f);
      setPageCount(count); setCurrentPage(1);
    }
  };

  const getStrokesForPage = (page) => strokesRef.current[page] || [];

  const redrawOverlay = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const strokes = getStrokesForPage(currentPage);
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, [currentPage, strokesVersion]);

  useEffect(() => { redrawOverlay(); }, [redrawOverlay]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const pos = getPos(e);
    const c = COLORS.find(cl => cl.id === colorId) || COLORS[0];
    currentStroke.current = [pos];
    currentProps.current = { color: c.hex, size: brushSize };
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    currentStroke.current.push(pos);
    // Live draw
    const ctx = canvasRef.current.getContext('2d');
    const pts = currentStroke.current;
    if (pts.length < 2) return;
    ctx.strokeStyle = currentProps.current.color;
    ctx.lineWidth = currentProps.current.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.current.length > 1) {
      const page = currentPage;
      if (!strokesRef.current[page]) strokesRef.current[page] = [];
      strokesRef.current[page].push({
        points: [...currentStroke.current],
        color: currentProps.current.color,
        size: currentProps.current.size,
      });
      setStrokesVersion(v => v + 1);
    }
    currentStroke.current = [];
  };

  const clearPage = () => {
    strokesRef.current[currentPage] = [];
    setStrokesVersion(v => v + 1);
  };

  const undoLast = () => {
    const strokes = strokesRef.current[currentPage];
    if (strokes && strokes.length > 0) {
      strokes.pop();
      setStrokesVersion(v => v + 1);
    }
  };

  const totalStrokes = Object.values(strokesRef.current).reduce((s, a) => s + a.length, 0);

  const handleSave = async () => {
    if (!file || totalStrokes === 0) return;
    setLoading(true);
    try {
      const bytes = await fileToArrayBuffer(file);
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url
      ).href;
      const srcPdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const outDoc = await PDFDocument.create();
      const previewScale = 1.5;

      for (let i = 1; i <= pageCount; i++) {
        const page = await srcPdf.getPage(i);
        const viewport = page.getViewport({ scale: previewScale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width; canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Draw strokes
        const strokes = getStrokesForPage(i);
        for (const stroke of strokes) {
          if (stroke.points.length < 2) continue;
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.size;
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let j = 1; j < stroke.points.length; j++) ctx.lineTo(stroke.points[j].x, stroke.points[j].y);
          ctx.stroke();
        }

        const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.92));
        const jpgBytes = new Uint8Array(await blob.arrayBuffer());
        const jpgImage = await outDoc.embedJpg(jpgBytes);
        const origVp = page.getViewport({ scale: 1 });
        const outPage = outDoc.addPage([origVp.width, origVp.height]);
        outPage.drawImage(jpgImage, { x: 0, y: 0, width: origVp.width, height: origVp.height });
      }

      const outBytes = await outDoc.save();
      downloadPdf(outBytes, `${file.name.replace(/\.[^/.]+$/, '')}_draw.pdf`);
    } catch (err) { alert('Error saving.'); console.error(err); }
    finally { setLoading(false); }
  };

  if (!file) {
    return (
      <>
        <Navbar />
        <SEO title="Draw on PDF" description="Freehand draw on PDF pages. Free and private." path="/draw-on-pdf" />
        <div style={{ maxWidth: 700, margin: '80px auto', padding: '0 20px' }}>
          <a onClick={() => navigate(-1)} style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </a>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Draw on PDF</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Freehand drawing and annotations on your PDF pages.</p>
          <FileDropZone onFiles={handleFiles} multiple={false} label="Drop PDF file here" sublabel="Upload a PDF to draw on" />
        </div>
      </>
    );
  }

  const toolbar = (
    <>
      <div className="editor-tool-group">
        <span className="editor-tool-label">Color</span>
        {COLORS.map(c => (
          <button key={c.id} className={`editor-color-dot ${colorId === c.id ? 'active' : ''}`}
            style={{ backgroundColor: c.hex }} onClick={() => setColorId(c.id)} title={c.id} />
        ))}
      </div>
      <div className="editor-tool-group">
        <span className="editor-tool-label">Size</span>
        {SIZES.map(s => (
          <button key={s} className={`editor-tool-btn ${brushSize === s ? 'active' : ''}`}
            onClick={() => setBrushSize(s)} title={`${s}px`}>
            <svg width="16" height="16"><circle cx="8" cy="8" r={Math.min(s, 7)} fill="currentColor"/></svg>
          </button>
        ))}
      </div>
      <div className="editor-tool-group">
        <button className="editor-tool-btn" onClick={undoLast} title="Undo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 105.64-11.36L1 10"/></svg>
        </button>
        <button className="editor-tool-btn" onClick={clearPage} title="Clear page">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <SEO title="Draw on PDF — Free" description="Freehand draw on PDF pages. Free and private." path="/draw-on-pdf" />
      <PDFEditorLayout
        file={file} toolbar={toolbar}
        canvasRef={canvasRef} bgCanvasRef={bgCanvasRef}
        currentPage={currentPage}
        setCurrentPage={(p) => setCurrentPage(typeof p === 'function' ? p(currentPage) : p)}
        pageCount={pageCount}
        redrawOverlay={redrawOverlay}
        onCanvasMouseDown={handleMouseDown}
        onCanvasMouseMove={handleMouseMove}
        onCanvasMouseUp={handleMouseUp}
        canvasCursor="crosshair"
        onSave={handleSave}
        onBack={() => navigate(-1)}
        saveLabel="Save changes"
        saveDisabled={totalStrokes === 0}
        loading={loading}
        hint="Draw on the page with your mouse"
      />
    </>
  );
}
