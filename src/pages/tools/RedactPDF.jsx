import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import PDFEditorLayout from '../../components/shared/PDFEditorLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, downloadPdf, getPageCount } from '../../utils/pdfUtils';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import '../../components/shared/PDFEditor.css';

export default function RedactPDF() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);

  // rects: { [page]: [ {x,y,w,h}, ... ] }
  const rectsRef = useRef({});
  const [rectsVersion, setRectsVersion] = useState(0);
  const canvasRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const startPos = useRef(null);

  const handleFiles = async (newFiles) => {
    if (newFiles.length > 0) {
      const f = newFiles[0];
      setFile(f); rectsRef.current = {};
      const count = await getPageCount(f);
      setPageCount(count); setCurrentPage(1);
    }
  };

  const getRectsForPage = (page) => rectsRef.current[page] || [];

  const redrawOverlay = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const rects = getRectsForPage(currentPage);
    for (const r of rects) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
  }, [currentPage, rectsVersion]);

  useEffect(() => { redrawOverlay(); }, [redrawOverlay]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (canvasRef.current.width / rect.width), y: (e.clientY - rect.top) * (canvasRef.current.height / rect.height) };
  };

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    startPos.current = getPos(e);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPos.current) return;
    const pos = getPos(e);
    // Live preview of the current rect
    redrawOverlay();
    const ctx = canvasRef.current.getContext('2d');
    const x = Math.min(startPos.current.x, pos.x);
    const y = Math.min(startPos.current.y, pos.y);
    const w = Math.abs(pos.x - startPos.current.x);
    const h = Math.abs(pos.y - startPos.current.y);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x, y, w, h);
    // Dashed border
    ctx.strokeStyle = '#ff6b4a';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
  };

  const handleMouseUp = (e) => {
    if (!isDrawing || !startPos.current) return;
    setIsDrawing(false);
    const pos = getPos(e);
    const x = Math.min(startPos.current.x, pos.x);
    const y = Math.min(startPos.current.y, pos.y);
    const w = Math.abs(pos.x - startPos.current.x);
    const h = Math.abs(pos.y - startPos.current.y);
    if (w > 5 && h > 5) {
      if (!rectsRef.current[currentPage]) rectsRef.current[currentPage] = [];
      rectsRef.current[currentPage].push({ x, y, w, h });
      setRectsVersion(v => v + 1);
    }
    startPos.current = null;
  };

  const undoLast = () => { const r = rectsRef.current[currentPage]; if (r?.length) { r.pop(); setRectsVersion(v => v + 1); } };
  const clearPage = () => { rectsRef.current[currentPage] = []; setRectsVersion(v => v + 1); };
  const totalRects = Object.values(rectsRef.current).reduce((s, a) => s + a.length, 0);

  const handleSave = async () => {
    if (!file || totalRects === 0) return;
    setLoading(true);
    try {
      const bytes = await fileToArrayBuffer(file);
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
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

        const rects = getRectsForPage(i);
        for (const r of rects) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(r.x, r.y, r.w, r.h);
        }

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
        const jpgBytes = new Uint8Array(await blob.arrayBuffer());
        const jpgImage = await outDoc.embedJpg(jpgBytes);
        const origVp = page.getViewport({ scale: 1 });
        const outPage = outDoc.addPage([origVp.width, origVp.height]);
        outPage.drawImage(jpgImage, { x: 0, y: 0, width: origVp.width, height: origVp.height });
      }

      const outBytes = await outDoc.save();
      downloadPdf(outBytes, `${file.name.replace(/\.[^/.]+$/, '')}_redacted.pdf`);
    } catch (err) { alert('Error saving.'); console.error(err); }
    finally { setLoading(false); }
  };

  if (!file) {
    return (
      <>
        <Navbar />
        <SEO title="Redact PDF" description="Permanently redact sensitive content from PDFs. Free and private." path="/redact-pdf" />
        <div style={{ maxWidth: 700, margin: '80px auto', padding: '0 20px' }}>
          <a onClick={() => navigate(-1)} style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </a>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Redact PDF</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Permanently hide sensitive information by drawing black boxes over content.</p>
          <FileDropZone onFiles={handleFiles} multiple={false} label="Drop PDF file here" sublabel="Upload a PDF to redact" />
        </div>
      </>
    );
  }

  const toolbar = (
    <>
      <div className="editor-tool-group">
        <span className="editor-tool-label" style={{ color: '#cc0000' }}>Redaction is permanent</span>
      </div>
      <div className="editor-tool-group">
        <span className="editor-tool-label">{getRectsForPage(currentPage).length} area(s)</span>
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
      <SEO title="Redact PDF — Free" description="Permanently redact sensitive content from PDFs. Free and private." path="/redact-pdf" />
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
        saveDisabled={totalRects === 0} loading={loading}
        hint="Draw rectangles over content to permanently redact it"
      />
    </>
  );
}
