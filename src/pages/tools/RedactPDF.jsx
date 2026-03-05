import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, formatFileSize, downloadPdf, renderPageToDataUrl, getPageCount } from '../../utils/pdfUtils';
import SEO from '../../components/SEO';
import './ToolPage.css';

export default function RedactPDF() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageImage, setPageImage] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [redactions, setRedactions] = useState({}); // { pageNum: [{ x, y, w, h }] }
  const canvasRef = useRef(null);
  const bgCanvasRef = useRef(null);

  const handleFiles = async (newFiles) => {
    if (newFiles.length > 0) {
      const f = newFiles[0]; setFile(f); setResult(null); setRedactions({});
      const count = await getPageCount(f);
      setPageCount(count); setCurrentPage(1);
    }
  };

  const loadPagePreview = useCallback(async () => {
    if (!file) return;
    const dataUrl = await renderPageToDataUrl(file, currentPage - 1, 1.5);
    setPageImage(dataUrl);
  }, [file, currentPage]);

  useEffect(() => { loadPagePreview(); }, [loadPagePreview]);

  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const rects = redactions[currentPage] || [];
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    for (const r of rects) {
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
  }, [redactions, currentPage]);

  useEffect(() => {
    if (!pageImage || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      canvasRef.current.width = img.width; canvasRef.current.height = img.height;
      bgCanvasRef.current.width = img.width; bgCanvasRef.current.height = img.height;
      bgCanvasRef.current.getContext('2d').drawImage(img, 0, 0);
      redrawCanvas();
    };
    img.src = pageImage;
  }, [pageImage, redrawCanvas]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => { setIsDrawing(true); setStartPos(getPos(e)); };

  const draw = (e) => {
    if (!isDrawing || !startPos) return;
    const pos = getPos(e);
    redrawCanvas();
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
  };

  const endDraw = (e) => {
    if (!isDrawing || !startPos) return;
    setIsDrawing(false);
    const pos = getPos(e);
    const w = pos.x - startPos.x;
    const h = pos.y - startPos.y;
    if (Math.abs(w) > 5 && Math.abs(h) > 5) {
      const rect = {
        x: w > 0 ? startPos.x : pos.x,
        y: h > 0 ? startPos.y : pos.y,
        w: Math.abs(w), h: Math.abs(h),
      };
      setRedactions(prev => ({
        ...prev,
        [currentPage]: [...(prev[currentPage] || []), rect],
      }));
    }
    setStartPos(null);
  };

  useEffect(() => { redrawCanvas(); }, [redactions, currentPage, redrawCanvas]);

  const clearPage = () => {
    setRedactions(prev => { const next = { ...prev }; delete next[currentPage]; return next; });
  };

  const undoLast = () => {
    setRedactions(prev => {
      const rects = [...(prev[currentPage] || [])];
      rects.pop();
      return { ...prev, [currentPage]: rects };
    });
  };

  const handleApply = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const arrayBuffer = await fileToArrayBuffer(file);
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const outDoc = await PDFDocument.create();
      const previewScale = 1.5;

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const scale = 2.0;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width); canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Apply black redaction boxes (scale from preview coords to render coords)
        const rects = redactions[i] || [];
        if (rects.length > 0) {
          const scaleRatio = scale / previewScale;
          ctx.fillStyle = '#000000';
          for (const r of rects) {
            ctx.fillRect(r.x * scaleRatio, r.y * scaleRatio, r.w * scaleRatio, r.h * scaleRatio);
          }
        }

        const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.92));
        const jpegBytes = new Uint8Array(await blob.arrayBuffer());
        const jpegImage = await outDoc.embedJpg(jpegBytes);
        const origViewport = page.getViewport({ scale: 1 });
        const outPage = outDoc.addPage([origViewport.width, origViewport.height]);
        outPage.drawImage(jpegImage, { x: 0, y: 0, width: origViewport.width, height: origViewport.height });
      }

      const outBytes = await outDoc.save({ useObjectStreams: true });
      setResult({ bytes: outBytes, size: outBytes.byteLength, pageCount: pdfDoc.numPages });
    } catch (err) { alert('Error applying redactions.'); console.error(err); }
    finally { setLoading(false); }
  };

  const handleDownload = () => { if (result) downloadPdf(result.bytes, `${file.name.replace(/\.[^/.]+$/, '')}_redacted.pdf`); };
  const reset = () => { setFile(null); setResult(null); setRedactions({}); };
  const totalRedactions = Object.values(redactions).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <ToolPageLayout title="Redact PDF" description="Permanently hide sensitive information by drawing black boxes."
      categoryColor="var(--cat-edit)" toolId="redact-pdf"
      steps={['Upload your PDF', 'Draw boxes over sensitive content', 'Download the redacted PDF']}
    >
      <SEO title="Redact PDF — Free" description="Permanently redact sensitive info from PDFs. Free and private." path="/redact-pdf" />
      {!result ? (
        <div className="tool-layout">
          <FileDropZone onFiles={handleFiles} multiple={false} label="Drop PDF file here" sublabel="Upload a PDF to redact" />
          {file && pageImage && (
            <div className="tool-section">
              <div className="tool-section__header">
                <h3 className="tool-section__title">Page {currentPage} of {pageCount} — {totalRedactions} redaction{totalRedactions !== 1 ? 's' : ''}</h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="compress-level__preset" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>← Prev</button>
                  <button className="compress-level__preset" onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))} disabled={currentPage >= pageCount}>Next →</button>
                </div>
              </div>
              <div className="draw-toolbar">
                <p className="tool-hint">Click and drag to draw redaction boxes over sensitive content.</p>
                <button className="compress-level__preset" onClick={undoLast} disabled={!(redactions[currentPage]?.length)}>Undo last</button>
                <button className="compress-level__preset" onClick={clearPage}>Clear page</button>
              </div>
              <div className="draw-canvas-wrap">
                <canvas ref={bgCanvasRef} className="draw-canvas draw-canvas--bg" />
                <canvas ref={canvasRef} className="draw-canvas draw-canvas--fg" style={{ cursor: 'crosshair' }}
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={() => { setIsDrawing(false); setStartPos(null); }} />
              </div>
              <div className="tool-actions">
                <ProcessButton onClick={handleApply} loading={loading} disabled={!file || totalRedactions === 0} label="Apply Redactions" loadingLabel="Redacting…" />
                <p className="compress-level__warn" style={{ margin: 0 }}>⚠ Redaction is permanent — underlying content is completely removed.</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="tool-layout">
          <DownloadBanner onDownload={handleDownload} onReset={reset}
            filename={`${file.name.replace(/\.[^/.]+$/, '')}_redacted.pdf`}
            savedText={`${totalRedactions} redaction${totalRedactions !== 1 ? 's' : ''} applied — content permanently removed`} />
        </div>
      )}
    </ToolPageLayout>
  );
}
