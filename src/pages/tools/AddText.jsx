import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import PDFEditorLayout from '../../components/shared/PDFEditorLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, formatFileSize, downloadPdf, getPageCount } from '../../utils/pdfUtils';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import '../../components/shared/PDFEditor.css';
import './ToolPage.css';

const COLORS = [
  { id: 'black', label: 'Black', hex: '#000000', rgb: [0, 0, 0] },
  { id: 'red', label: 'Red', hex: '#cc0000', rgb: [0.8, 0, 0] },
  { id: 'blue', label: 'Blue', hex: '#0000cc', rgb: [0, 0, 0.8] },
  { id: 'green', label: 'Green', hex: '#008800', rgb: [0, 0.53, 0] },
  { id: 'gray', label: 'Gray', hex: '#808080', rgb: [0.5, 0.5, 0.5] },
  { id: 'white', label: 'White', hex: '#ffffff', rgb: [1, 1, 1] },
];

export default function AddText() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [textEntries, setTextEntries] = useState([]);
  const [activeText, setActiveText] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [colorId, setColorId] = useState('black');
  const [bold, setBold] = useState(false);
  const [clickPos, setClickPos] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nextId = useRef(1);
  const canvasRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const inputRef = useRef(null);

  const handleFiles = async (newFiles) => {
    if (newFiles.length > 0) {
      const f = newFiles[0];
      setFile(f); setResult(null); setTextEntries([]); setClickPos(null); setSelectedId(null);
      const count = await getPageCount(f);
      setPageCount(count); setCurrentPage(1);
    }
  };

  const measureEntry = useCallback((ctx, entry) => {
    ctx.font = `${entry.bold ? 'bold ' : ''}${entry.fontSize}px Helvetica, Arial, sans-serif`;
    const metrics = ctx.measureText(entry.text);
    const h = entry.fontSize;
    return { x: entry.x, y: entry.y - h * 0.85, w: metrics.width, h: h * 1.1 };
  }, []);

  const redrawOverlay = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    const pageEntries = textEntries.filter(e => e.page === currentPage);
    for (const entry of pageEntries) {
      const c = COLORS.find(cl => cl.id === entry.color) || COLORS[0];
      ctx.font = `${entry.bold ? 'bold ' : ''}${entry.fontSize}px Helvetica, Arial, sans-serif`;
      ctx.fillStyle = c.hex;
      ctx.fillText(entry.text, entry.x, entry.y);

      if (entry.id === selectedId) {
        const box = measureEntry(ctx, entry);
        ctx.strokeStyle = '#ff6b4a';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(box.x - 4, box.y - 4, box.w + 8, box.h + 8);
        ctx.setLineDash([]);
      }
    }

    if (clickPos && activeText) {
      const c = COLORS.find(cl => cl.id === colorId) || COLORS[0];
      ctx.font = `${bold ? 'bold ' : ''}${fontSize}px Helvetica, Arial, sans-serif`;
      ctx.fillStyle = c.hex;
      ctx.globalAlpha = 0.5;
      ctx.fillText(activeText, clickPos.x, clickPos.y);
      ctx.globalAlpha = 1.0;
    } else if (clickPos) {
      ctx.strokeStyle = '#ff6b4a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(clickPos.x - 10, clickPos.y);
      ctx.lineTo(clickPos.x + 10, clickPos.y);
      ctx.moveTo(clickPos.x, clickPos.y - 10);
      ctx.lineTo(clickPos.x, clickPos.y + 10);
      ctx.stroke();
    }
  }, [textEntries, currentPage, clickPos, activeText, fontSize, colorId, bold, selectedId, measureEntry]);

  useEffect(() => { redrawOverlay(); }, [redrawOverlay]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const hitTest = (pos) => {
    if (!canvasRef.current) return null;
    const ctx = canvasRef.current.getContext('2d');
    const pageEntries = textEntries.filter(e => e.page === currentPage);
    for (let i = pageEntries.length - 1; i >= 0; i--) {
      const entry = pageEntries[i];
      const box = measureEntry(ctx, entry);
      if (pos.x >= box.x - 6 && pos.x <= box.x + box.w + 6 &&
          pos.y >= box.y - 6 && pos.y <= box.y + box.h + 6) {
        return entry;
      }
    }
    return null;
  };

  const handleMouseDown = (e) => {
    const pos = getPos(e);
    const hit = hitTest(pos);
    if (hit) {
      setSelectedId(hit.id);
      setDragging(true);
      setDragOffset({ x: pos.x - hit.x, y: pos.y - hit.y });
      setClickPos(null);
    } else {
      setSelectedId(null);
      setDragging(false);
      setClickPos(pos);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleMouseMove = (e) => {
    if (!dragging || selectedId === null) {
      const pos = getPos(e);
      const hit = hitTest(pos);
      if (canvasRef.current) canvasRef.current.style.cursor = hit ? 'grab' : 'text';
      return;
    }
    canvasRef.current.style.cursor = 'grabbing';
    const pos = getPos(e);
    setTextEntries(prev => prev.map(entry =>
      entry.id === selectedId
        ? { ...entry, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
        : entry
    ));
  };

  const handleMouseUp = () => { if (dragging) setDragging(false); };

  const placeText = () => {
    if (!clickPos || !activeText.trim()) return;
    setTextEntries(prev => [...prev, {
      id: nextId.current++, text: activeText, x: clickPos.x, y: clickPos.y,
      fontSize, color: colorId, bold, page: currentPage,
    }]);
    setActiveText('');
    setClickPos(null);
  };

  const deleteSelected = () => {
    if (selectedId === null) return;
    setTextEntries(prev => prev.filter(e => e.id !== selectedId));
    setSelectedId(null);
  };

  const handleSave = async () => {
    if (!file || textEntries.length === 0) return;
    setLoading(true);
    try {
      const bytes = await fileToArrayBuffer(file);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const pages = doc.getPages();
      const previewScale = 1.5;

      for (const entry of textEntries) {
        const pageIdx = Math.min(entry.page - 1, pages.length - 1);
        const page = pages[pageIdx];
        const { height } = page.getSize();
        const font = entry.bold ? fontBold : fontRegular;
        const c = COLORS.find(cl => cl.id === entry.color) || COLORS[0];
        page.drawText(entry.text, {
          x: entry.x / previewScale, y: height - (entry.y / previewScale),
          size: entry.fontSize / previewScale, font,
          color: rgb(c.rgb[0], c.rgb[1], c.rgb[2]),
        });
      }

      const outBytes = await doc.save();
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      downloadPdf(outBytes, `${baseName}_text.pdf`);
    } catch (err) { alert('Error adding text.'); console.error(err); }
    finally { setLoading(false); }
  };

  const reset = () => { setFile(null); setTextEntries([]); setClickPos(null); setSelectedId(null); setPageCount(0); };

  if (!file) {
    return (
      <>
        <Navbar />
        <SEO title="Add Text to PDF" description="Add text to PDFs visually. Free and private." path="/add-text" />
        <div style={{ maxWidth: 700, margin: '80px auto', padding: '0 20px' }}>
          <a onClick={() => navigate(-1)} style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </a>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Add Text to PDF</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Click anywhere to place text, drag to reposition.</p>
          <FileDropZone onFiles={handleFiles} multiple={false} label="Drop PDF file here" sublabel="Upload a PDF to start editing" />
        </div>
      </>
    );
  }

  const toolbar = (
    <>
      <div className="editor-tool-group">
        <span className="editor-tool-label">Text</span>
        <input
          ref={inputRef}
          className="editor-text-input"
          value={activeText}
          onChange={(e) => setActiveText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') placeText(); }}
          placeholder={clickPos ? 'Type text, press Enter…' : 'Click on page first…'}
          disabled={!clickPos}
        />
        <button className="editor-tool-btn active" onClick={placeText} disabled={!clickPos || !activeText.trim()} title="Place text">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
      </div>
      <div className="editor-tool-group">
        <span className="editor-tool-label">Size</span>
        <input className="editor-size-input" type="number" min="8" max="120" value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))} />
      </div>
      <div className="editor-tool-group">
        {COLORS.map(c => (
          <button key={c.id} className={`editor-color-dot ${colorId === c.id ? 'active' : ''}`}
            style={{ backgroundColor: c.hex, border: c.id === 'white' ? '2px solid #ccc' : undefined }}
            onClick={() => setColorId(c.id)} title={c.label} />
        ))}
      </div>
      <div className="editor-tool-group">
        <button className={`editor-tool-btn ${bold ? 'active' : ''}`} onClick={() => setBold(b => !b)} title="Bold">
          <strong>B</strong>
        </button>
        {selectedId !== null && (
          <button className="editor-tool-btn" onClick={deleteSelected} title="Delete selected" style={{ color: '#cc0000' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <SEO title="Add Text to PDF — Free" description="Add text to PDFs visually. Free and private." path="/add-text" />
      <PDFEditorLayout
        file={file}
        toolbar={toolbar}
        canvasRef={canvasRef}
        bgCanvasRef={bgCanvasRef}
        currentPage={currentPage}
        setCurrentPage={(p) => { setCurrentPage(typeof p === 'function' ? p(currentPage) : p); setClickPos(null); setSelectedId(null); }}
        pageCount={pageCount}
        redrawOverlay={redrawOverlay}
        onCanvasMouseDown={handleMouseDown}
        onCanvasMouseMove={handleMouseMove}
        onCanvasMouseUp={handleMouseUp}
        canvasCursor="text"
        onSave={handleSave}
        onBack={() => navigate(-1)}
        saveLabel="Save changes"
        saveDisabled={textEntries.length === 0}
        loading={loading}
        hint="Click to place text • Drag to reposition • Click text to select"
      />
    </>
  );
}
