import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, formatFileSize, downloadPdf, renderPageToDataUrl, getPageCount } from '../../utils/pdfUtils';
import SEO from '../../components/SEO';
import './ToolPage.css';

const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Yellow', color: 'rgba(255,255,0,0.35)' },
  { id: 'green', label: 'Green', color: 'rgba(0,255,0,0.25)' },
  { id: 'blue', label: 'Blue', color: 'rgba(0,120,255,0.25)' },
  { id: 'pink', label: 'Pink', color: 'rgba(255,0,128,0.25)' },
];

export default function HighlightPDF() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageImage, setPageImage] = useState(null);
  const [hlColor, setHlColor] = useState('rgba(255,255,0,0.35)');
  const [isDrawing, setIsDrawing] = useState(false);
  const [highlights, setHighlights] = useState({});
  const canvasRef = useRef(null);
  const bgCanvasRef = useRef(null);

  const handleFiles = async (newFiles) => {
    if (newFiles.length > 0) {
      const f = newFiles[0]; setFile(f); setResult(null); setHighlights({});
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

  useEffect(() => {
    if (!pageImage || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const bgCanvas = bgCanvasRef.current;
      canvas.width = img.width; canvas.height = img.height;
      bgCanvas.width = img.width; bgCanvas.height = img.height;
      bgCanvas.getContext('2d').drawImage(img, 0, 0);
      if (highlights[currentPage]) {
        const hlImg = new Image();
        hlImg.onload = () => { canvasRef.current.getContext('2d').drawImage(hlImg, 0, 0); };
        hlImg.src = highlights[currentPage];
      }
    };
    img.src = pageImage;
  }, [pageImage, currentPage, highlights]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => { setIsDrawing(true); const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); ctx.strokeStyle = hlColor; ctx.lineWidth = 20; ctx.lineCap = 'round'; };
  const draw = (e) => { if (!isDrawing) return; const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); };
  const endDraw = () => { if (!isDrawing) return; setIsDrawing(false); setHighlights(prev => ({ ...prev, [currentPage]: canvasRef.current.toDataURL() })); };

  const clearPage = () => {
    canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHighlights(prev => { const next = { ...prev }; delete next[currentPage]; return next; });
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

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const scale = 2.0;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width); canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        if (highlights[i]) {
          const hlImg = await new Promise(r => { const img = new Image(); img.onload = () => r(img); img.src = highlights[i]; });
          ctx.drawImage(hlImg, 0, 0, canvas.width, canvas.height);
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
    } catch (err) { alert('Error applying highlights.'); console.error(err); }
    finally { setLoading(false); }
  };

  const handleDownload = () => { if (result) downloadPdf(result.bytes, `${file.name.replace(/\.[^/.]+$/, '')}_highlighted.pdf`); };
  const reset = () => { setFile(null); setResult(null); setHighlights({}); };

  return (
    <ToolPageLayout title="Highlight PDF" description="Highlight, underline, and annotate your PDF pages."
      categoryColor="var(--cat-edit)" toolId="highlight-pdf"
      steps={['Upload your PDF', 'Highlight text with your chosen color', 'Download the highlighted PDF']}
    >
      <SEO title="Highlight PDF — Free" description="Highlight PDF text. Free and private." path="/highlight-pdf" />
      {!result ? (
        <div className="tool-layout">
          <FileDropZone onFiles={handleFiles} multiple={false} label="Drop PDF file here" sublabel="Upload a PDF to highlight" />
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
                  {HIGHLIGHT_COLORS.map(c => (
                    <button key={c.id} className={`draw-color-btn ${hlColor === c.color ? 'active' : ''}`}
                      style={{ backgroundColor: c.color }} onClick={() => setHlColor(c.color)} title={c.label} />
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
                <ProcessButton onClick={handleApply} loading={loading} disabled={!file} label="Apply Highlights" loadingLabel="Applying…" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="tool-layout">
          <DownloadBanner onDownload={handleDownload} onReset={reset}
            filename={`${file.name.replace(/\.[^/.]+$/, '')}_highlighted.pdf`}
            savedText={`Highlights applied to ${result.pageCount} pages`} />
        </div>
      )}
    </ToolPageLayout>
  );
}
