import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, formatFileSize, downloadPdf, renderPageToDataUrl, getPageCount } from '../../utils/pdfUtils';
import SEO from '../../components/SEO';
import './ToolPage.css';

const COLORS = ['#000000', '#e53e3e', '#3182ce', '#38a169', '#d69e2e', '#805ad5'];
const SIZES = [2, 4, 6, 10, 16];

export default function DrawOnPDF() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageImage, setPageImage] = useState(null);
  const [brushColor, setBrushColor] = useState('#e53e3e');
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawings, setDrawings] = useState({}); // { pageNum: canvasDataUrl }
  const canvasRef = useRef(null);
  const bgCanvasRef = useRef(null);

  const handleFiles = async (newFiles) => {
    if (newFiles.length > 0) {
      const f = newFiles[0]; setFile(f); setResult(null); setDrawings({});
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

  // Set up canvas size when page image loads
  useEffect(() => {
    if (!pageImage || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const bgCanvas = bgCanvasRef.current;
      canvas.width = img.width; canvas.height = img.height;
      bgCanvas.width = img.width; bgCanvas.height = img.height;
      const bgCtx = bgCanvas.getContext('2d');
      bgCtx.drawImage(img, 0, 0);
      // Restore previous drawing if exists
      if (drawings[currentPage]) {
        const drawImg = new Image();
        drawImg.onload = () => { canvasRef.current.getContext('2d').drawImage(drawImg, 0, 0); };
        drawImg.src = drawings[currentPage];
      }
    };
    img.src = pageImage;
  }, [pageImage, currentPage, drawings]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => {
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = brushColor; ctx.lineWidth = brushSize;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    // Save drawing state
    setDrawings(prev => ({ ...prev, [currentPage]: canvasRef.current.toDataURL() }));
  };

  const clearPage = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setDrawings(prev => { const next = { ...prev }; delete next[currentPage]; return next; });
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
      const scale = 2.0;

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width); canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Overlay drawing if exists for this page
        if (drawings[i]) {
          const drawImg = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = drawings[i];
          });
          // Scale drawing to match render canvas
          ctx.drawImage(drawImg, 0, 0, canvas.width, canvas.height);
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
    } catch (err) { alert('Error applying drawings.'); console.error(err); }
    finally { setLoading(false); }
  };

  const handleDownload = () => { if (result) downloadPdf(result.bytes, `${file.name.replace(/\.[^/.]+$/, '')}_drawn.pdf`); };
  const reset = () => { setFile(null); setResult(null); setDrawings({}); setPageCount(0); };

  return (
    <ToolPageLayout title="Draw on PDF" description="Freehand drawing and annotations on your PDF pages."
      categoryColor="var(--cat-edit)" toolId="draw-on-pdf"
      steps={['Upload your PDF', 'Draw on the pages with your mouse', 'Download the annotated PDF']}
    >
      <SEO title="Draw on PDF — Free" description="Draw on PDF pages with freehand tools. Free and private." path="/draw-on-pdf" />
      {!result ? (
        <div className="tool-layout">
          <FileDropZone onFiles={handleFiles} multiple={false} label="Drop PDF file here" sublabel="Upload a PDF to draw on" />
          {file && pageImage && (
            <div className="tool-section">
              <div className="tool-section__header">
                <h3 className="tool-section__title">Page {currentPage} of {pageCount}</h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="compress-level__preset" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>← Prev</button>
                  <button className="compress-level__preset" onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))} disabled={currentPage >= pageCount}>Next →</button>
                </div>
              </div>

              <div className="draw-toolbar">
                <div className="draw-toolbar__colors">
                  {COLORS.map(c => (
                    <button key={c} className={`draw-color-btn ${brushColor === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }} onClick={() => setBrushColor(c)} />
                  ))}
                </div>
                <div className="draw-toolbar__sizes">
                  {SIZES.map(s => (
                    <button key={s} className={`compress-level__preset ${brushSize === s ? 'active' : ''}`}
                      onClick={() => setBrushSize(s)}>{s}px</button>
                  ))}
                </div>
                <button className="compress-level__preset" onClick={clearPage}>Clear page</button>
              </div>

              <div className="draw-canvas-wrap">
                <canvas ref={bgCanvasRef} className="draw-canvas draw-canvas--bg" />
                <canvas ref={canvasRef} className="draw-canvas draw-canvas--fg"
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw} />
              </div>

              <div className="tool-actions">
                <ProcessButton onClick={handleApply} loading={loading} disabled={!file} label="Apply Drawings" loadingLabel="Applying…" />
                <button className="tool-section__clear" onClick={reset}>Start over</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="tool-layout">
          <DownloadBanner onDownload={handleDownload} onReset={reset}
            filename={`${file.name.replace(/\.[^/.]+$/, '')}_drawn.pdf`}
            savedText={`Drawings applied to ${result.pageCount} pages`} />
        </div>
      )}
    </ToolPageLayout>
  );
}
