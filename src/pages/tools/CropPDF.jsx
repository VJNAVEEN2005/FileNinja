import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import PDFEditorLayout from '../../components/shared/PDFEditorLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, downloadPdf, getPageCount } from '../../utils/pdfUtils';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import '../../components/shared/PDFEditor.css';

export default function CropPDF() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Crop margins in canvas pixels (top, right, bottom, left)
  const [top, setTop] = useState(0);
  const [right, setRight] = useState(0);
  const [bottom, setBottom] = useState(0);
  const [left, setLeft] = useState(0);

  // Drag state for handles
  const [draggingEdge, setDraggingEdge] = useState(null);

  const canvasRef = useRef(null);
  const bgCanvasRef = useRef(null);

  const handleFiles = async (newFiles) => {
    if (newFiles.length > 0) {
      const f = newFiles[0];
      setFile(f);
      const count = await getPageCount(f);
      setPageCount(count); setCurrentPage(1);
      setTop(0); setRight(0); setBottom(0); setLeft(0);
    }
  };

  const redrawOverlay = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const W = canvasRef.current.width;
    const H = canvasRef.current.height;
    ctx.clearRect(0, 0, W, H);

    // Draw dark overlay outside crop area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    // Top strip
    ctx.fillRect(0, 0, W, top);
    // Bottom strip
    ctx.fillRect(0, H - bottom, W, bottom);
    // Left strip
    ctx.fillRect(0, top, left, H - top - bottom);
    // Right strip
    ctx.fillRect(W - right, top, right, H - top - bottom);

    // Draw crop border
    ctx.strokeStyle = '#ff6b4a';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(left, top, W - left - right, H - top - bottom);
    ctx.setLineDash([]);

    // Draw edge handles
    const handleSize = 8;
    ctx.fillStyle = '#ff6b4a';
    // Top handle
    ctx.fillRect(W / 2 - handleSize / 2, top - handleSize / 2, handleSize, handleSize);
    // Bottom handle
    ctx.fillRect(W / 2 - handleSize / 2, H - bottom - handleSize / 2, handleSize, handleSize);
    // Left handle
    ctx.fillRect(left - handleSize / 2, H / 2 - handleSize / 2, handleSize, handleSize);
    // Right handle
    ctx.fillRect(W - right - handleSize / 2, H / 2 - handleSize / 2, handleSize, handleSize);

    // Dimensions label
    const cropW = W - left - right;
    const cropH = H - top - bottom;
    if (cropW > 0 && cropH > 0) {
      ctx.fillStyle = 'rgba(255, 107, 74, 0.85)';
      ctx.font = '11px Helvetica, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(cropW / 1.5)} x ${Math.round(cropH / 1.5)} pt`, W / 2, top + 16);
    }
  }, [top, right, bottom, left]);

  useEffect(() => { redrawOverlay(); }, [redrawOverlay]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvasRef.current.width / rect.width),
      y: (e.clientY - rect.top) * (canvasRef.current.height / rect.height),
    };
  };

  const handleMouseDown = (e) => {
    const pos = getPos(e);
    const W = canvasRef.current.width;
    const H = canvasRef.current.height;
    const threshold = 15;

    // Detect which edge handle is being dragged
    if (Math.abs(pos.y - top) < threshold && pos.x > left && pos.x < W - right) {
      setDraggingEdge('top');
    } else if (Math.abs(pos.y - (H - bottom)) < threshold && pos.x > left && pos.x < W - right) {
      setDraggingEdge('bottom');
    } else if (Math.abs(pos.x - left) < threshold && pos.y > top && pos.y < H - bottom) {
      setDraggingEdge('left');
    } else if (Math.abs(pos.x - (W - right)) < threshold && pos.y > top && pos.y < H - bottom) {
      setDraggingEdge('right');
    }
  };

  const handleMouseMove = (e) => {
    if (!draggingEdge) {
      // Update cursor based on hover
      const pos = getPos(e);
      const W = canvasRef.current.width;
      const H = canvasRef.current.height;
      const threshold = 15;
      if ((Math.abs(pos.y - top) < threshold || Math.abs(pos.y - (H - bottom)) < threshold) &&
          pos.x > left && pos.x < W - right) {
        canvasRef.current.style.cursor = 'ns-resize';
      } else if ((Math.abs(pos.x - left) < threshold || Math.abs(pos.x - (W - right)) < threshold) &&
          pos.y > top && pos.y < H - bottom) {
        canvasRef.current.style.cursor = 'ew-resize';
      } else {
        canvasRef.current.style.cursor = 'default';
      }
      return;
    }

    const pos = getPos(e);
    const W = canvasRef.current.width;
    const H = canvasRef.current.height;
    const minSize = 30;

    if (draggingEdge === 'top') setTop(Math.max(0, Math.min(pos.y, H - bottom - minSize)));
    else if (draggingEdge === 'bottom') setBottom(Math.max(0, Math.min(H - pos.y, H - top - minSize)));
    else if (draggingEdge === 'left') setLeft(Math.max(0, Math.min(pos.x, W - right - minSize)));
    else if (draggingEdge === 'right') setRight(Math.max(0, Math.min(W - pos.x, W - left - minSize)));
  };

  const handleMouseUp = () => { setDraggingEdge(null); };

  const handleSave = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const bytes = await fileToArrayBuffer(file);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = doc.getPages();
      const previewScale = 1.5;

      for (const page of pages) {
        const { width, height } = page.getSize();
        const cropBox = {
          x: left / previewScale,
          y: bottom / previewScale,
          width: width - (left + right) / previewScale,
          height: height - (top + bottom) / previewScale,
        };
        page.setCropBox(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
      }

      const outBytes = await doc.save();
      downloadPdf(outBytes, `${file.name.replace(/\.[^/.]+$/, '')}_cropped.pdf`);
    } catch (err) { alert('Error cropping PDF.'); console.error(err); }
    finally { setLoading(false); }
  };

  const hasCrop = top > 0 || right > 0 || bottom > 0 || left > 0;

  if (!file) {
    return (
      <>
        <Navbar />
        <SEO title="Crop PDF" description="Crop PDF pages to exact dimensions. Free and private." path="/crop-pdf" />
        <div style={{ maxWidth: 700, margin: '80px auto', padding: '0 20px' }}>
          <a onClick={() => navigate(-1)} style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </a>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Crop PDF</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Trim PDF pages to exact dimensions by dragging crop handles.</p>
          <FileDropZone onFiles={handleFiles} multiple={false} label="Drop PDF file here" sublabel="Upload a PDF to crop" />
        </div>
      </>
    );
  }

  const previewScale = 1.5;
  const pxToPt = (v) => Math.round(v / previewScale);

  const toolbar = (
    <>
      <div className="editor-tool-group">
        <span className="editor-tool-label">Margins (pt)</span>
      </div>
      <div className="editor-tool-group">
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Top</span>
        <input className="editor-size-input" type="number" min="0" value={pxToPt(top)}
          onChange={(e) => setTop(Number(e.target.value) * previewScale)} />
      </div>
      <div className="editor-tool-group">
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Right</span>
        <input className="editor-size-input" type="number" min="0" value={pxToPt(right)}
          onChange={(e) => setRight(Number(e.target.value) * previewScale)} />
      </div>
      <div className="editor-tool-group">
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Bottom</span>
        <input className="editor-size-input" type="number" min="0" value={pxToPt(bottom)}
          onChange={(e) => setBottom(Number(e.target.value) * previewScale)} />
      </div>
      <div className="editor-tool-group">
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Left</span>
        <input className="editor-size-input" type="number" min="0" value={pxToPt(left)}
          onChange={(e) => setLeft(Number(e.target.value) * previewScale)} />
      </div>
      <div className="editor-tool-group">
        <button className="editor-tool-btn" onClick={() => { setTop(0); setRight(0); setBottom(0); setLeft(0); }} title="Reset crop">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 105.64-11.36L1 10"/></svg>
        </button>
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <SEO title="Crop PDF" description="Crop PDF pages to exact dimensions. Free and private." path="/crop-pdf" />
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
        canvasCursor="default"
        onSave={handleSave}
        onBack={() => navigate(-1)}
        saveLabel="Save changes"
        saveDisabled={!hasCrop}
        loading={loading}
        hint="Drag the edges to set crop area, or type exact values in the toolbar"
      />
    </>
  );
}
