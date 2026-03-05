import { useState, useRef, useEffect, useCallback } from 'react';
import { renderPageToDataUrl, renderAllPages, getPageCount } from '../../utils/pdfUtils';
import './PDFEditor.css';

/**
 * Shared PDF editor layout used by canvas-based edit tools.
 * Provides: page thumbnails sidebar, main canvas area, 
 * toolbar (via children), bottom nav bar with zoom.
 *
 * Props:
 * - file: the uploaded File object
 * - toolbar: ReactNode rendered in the top toolbar area
 * - onCanvasReady: (canvas, bgCanvas) => void — called when canvas is set up
 * - onCanvasClick / onCanvasMouseDown / onCanvasMouseMove / onCanvasMouseUp: event handlers
 * - canvasCursor: cursor style for the canvas (default: 'crosshair')
 * - canvasRef / bgCanvasRef: external refs for the canvases
 * - currentPage / setCurrentPage: page navigation state
 * - pageCount: total pages
 * - redrawOverlay: function called when canvas needs redrawing
 * - onSave: async function to save the edited PDF
 * - saveLabel: label for the save button
 * - saveDisabled: whether save button is disabled
 * - loading: whether save is in progress
 * - hint: hint text shown above canvas
 */
export default function PDFEditorLayout({
  file,
  toolbar,
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  onCanvasClick,
  canvasCursor = 'crosshair',
  canvasRef: externalCanvasRef,
  bgCanvasRef: externalBgCanvasRef,
  currentPage,
  setCurrentPage,
  pageCount,
  redrawOverlay,
  onSave,
  onBack,
  saveLabel = 'Save changes',
  saveDisabled = false,
  loading = false,
  hint,
}) {
  const [thumbnails, setThumbnails] = useState([]);
  const [zoom, setZoom] = useState(100);
  const [pageImage, setPageImage] = useState(null);
  const internalCanvasRef = useRef(null);
  const internalBgCanvasRef = useRef(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const bgCanvasRef = externalBgCanvasRef || internalBgCanvasRef;

  // Load thumbnails
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    renderAllPages(file, 0.2).then(thumbs => {
      if (!cancelled) setThumbnails(thumbs);
    });
    return () => { cancelled = true; };
  }, [file]);

  // Load current page preview
  const loadPagePreview = useCallback(async () => {
    if (!file || !currentPage) return;
    const scale = 1.5 * (zoom / 100);
    const dataUrl = await renderPageToDataUrl(file, currentPage - 1, scale);
    setPageImage(dataUrl);
  }, [file, currentPage, zoom]);

  useEffect(() => { loadPagePreview(); }, [loadPagePreview]);

  // Set up canvas when page image loads
  useEffect(() => {
    if (!pageImage || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const bgCanvas = bgCanvasRef.current;
      if (!canvas || !bgCanvas) return;
      canvas.width = img.width; canvas.height = img.height;
      bgCanvas.width = img.width; bgCanvas.height = img.height;
      bgCanvas.getContext('2d').drawImage(img, 0, 0);
      if (redrawOverlay) redrawOverlay();
    };
    img.src = pageImage;
  }, [pageImage, redrawOverlay]);

  const zoomIn = () => setZoom(z => Math.min(200, z + 25));
  const zoomOut = () => setZoom(z => Math.max(25, z - 25));

  return (
    <div className="pdf-editor">
      {/* Left: Page thumbnails */}
      <div className="pdf-editor__sidebar">
        <div className="pdf-editor__thumbs">
          {thumbnails.map((thumb, i) => (
            <button
              key={i}
              className={`pdf-editor__thumb ${currentPage === i + 1 ? 'active' : ''}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              <img src={thumb} alt={`Page ${i + 1}`} />
              <span className="pdf-editor__thumb-num">{i + 1}</span>
            </button>
          ))}
          {thumbnails.length === 0 && pageCount > 0 && (
            <div className="pdf-editor__thumb-loading">Loading…</div>
          )}
        </div>
      </div>

      {/* Center: Toolbar + Canvas + Bottom nav */}
      <div className="pdf-editor__main">
        {/* Toolbar */}
        <div className="pdf-editor__toolbar">
          {onBack && (
            <button className="pdf-editor__back-btn" onClick={onBack} title="Back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          )}
          {toolbar}
        </div>

        {/* Canvas area */}
        <div className="pdf-editor__canvas-area">
          {hint && <p className="pdf-editor__hint">{hint}</p>}
          <div className="pdf-editor__canvas-scroll">
            <div className="pdf-editor__canvas-wrap">
              <canvas ref={bgCanvasRef} className="pdf-editor__canvas pdf-editor__canvas--bg" />
              <canvas
                ref={canvasRef}
                className="pdf-editor__canvas pdf-editor__canvas--fg"
                style={{ cursor: canvasCursor }}
                onClick={onCanvasClick}
                onMouseDown={onCanvasMouseDown}
                onMouseMove={onCanvasMouseMove}
                onMouseUp={onCanvasMouseUp}
                onMouseLeave={onCanvasMouseUp}
              />
            </div>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="pdf-editor__bottombar">
          <div className="pdf-editor__page-nav">
            <button className="pdf-editor__nav-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button className="pdf-editor__nav-btn" onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))} disabled={currentPage >= pageCount}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <span className="pdf-editor__page-info">
              <input
                className="pdf-editor__page-input"
                type="number"
                min="1"
                max={pageCount}
                value={currentPage}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v >= 1 && v <= pageCount) setCurrentPage(v);
                }}
              />
              / {pageCount}
            </span>
          </div>
          <div className="pdf-editor__zoom">
            <button className="pdf-editor__nav-btn" onClick={zoomOut} disabled={zoom <= 25}>−</button>
            <button className="pdf-editor__nav-btn" onClick={zoomIn} disabled={zoom >= 200}>+</button>
            <span className="pdf-editor__zoom-val">{zoom}%</span>
          </div>
          <button
            className={`pdf-editor__save-btn ${loading ? 'loading' : ''}`}
            onClick={onSave}
            disabled={saveDisabled || loading}
          >
            {loading ? 'Saving…' : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
