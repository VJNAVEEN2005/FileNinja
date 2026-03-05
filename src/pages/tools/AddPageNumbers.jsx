import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import PDFEditorLayout from '../../components/shared/PDFEditorLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, downloadPdf, getPageCount } from '../../utils/pdfUtils';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import '../../components/shared/PDFEditor.css';

const FORMATS = [
  { id: 'num', label: '1', fn: (i) => `${i}` },
  { id: 'dash', label: '- 1 -', fn: (i) => `- ${i} -` },
  { id: 'of', label: '1 of N', fn: (i, n) => `${i} of ${n}` },
  { id: 'page', label: 'Page 1', fn: (i) => `Page ${i}` },
];

const POSITIONS = [
  { id: 'bottom-center', label: 'Bottom Center', x: 0.5, y: 30 },
  { id: 'bottom-left', label: 'Bottom Left', x: 0.1, y: 30 },
  { id: 'bottom-right', label: 'Bottom Right', x: 0.9, y: 30 },
  { id: 'top-center', label: 'Top Center', x: 0.5, yFromTop: 30 },
];

export default function AddPageNumbers() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [formatId, setFormatId] = useState('num');
  const [positionId, setPositionId] = useState('bottom-center');
  const [fontSize, setFontSize] = useState(12);
  const [startNum, setStartNum] = useState(1);
  const [skipFirst, setSkipFirst] = useState(false);

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

    if (skipFirst && currentPage === 1) return;

    const fmt = FORMATS.find(f => f.id === formatId) || FORMATS[0];
    const pos = POSITIONS.find(p => p.id === positionId) || POSITIONS[0];
    const num = startNum + currentPage - 1;
    const label = fmt.fn(num, pageCount + startNum - 1);

    ctx.font = `${fontSize}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.textAlign = pos.x < 0.3 ? 'left' : pos.x > 0.7 ? 'right' : 'center';
    ctx.textBaseline = pos.yFromTop ? 'top' : 'bottom';

    const drawX = W * pos.x;
    const drawY = pos.yFromTop ? pos.yFromTop : H - pos.y;
    ctx.fillText(label, drawX, drawY);
  }, [currentPage, pageCount, formatId, positionId, fontSize, startNum, skipFirst]);

  useEffect(() => { redrawOverlay(); }, [redrawOverlay]);

  const handleSave = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const bytes = await fileToArrayBuffer(file);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const fmt = FORMATS.find(f => f.id === formatId) || FORMATS[0];
      const pos = POSITIONS.find(p => p.id === positionId) || POSITIONS[0];

      pages.forEach((page, i) => {
        if (skipFirst && i === 0) return;
        const { width, height } = page.getSize();
        const num = startNum + i;
        const label = fmt.fn(num, pages.length + startNum - 1);
        const tw = font.widthOfTextAtSize(label, fontSize);
        let x;
        if (pos.x < 0.3) x = width * pos.x;
        else if (pos.x > 0.7) x = width * pos.x - tw;
        else x = (width - tw) / 2;
        const y = pos.yFromTop ? height - pos.yFromTop - fontSize : pos.y;

        page.drawText(label, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
      });

      const outBytes = await doc.save();
      downloadPdf(outBytes, `${file.name.replace(/\.[^/.]+$/, '')}_numbered.pdf`);
    } catch (err) { alert('Error adding page numbers.'); console.error(err); }
    finally { setLoading(false); }
  };

  if (!file) {
    return (
      <>
        <Navbar />
        <SEO title="Add Page Numbers to PDF" description="Add page numbers to PDFs. Free and private." path="/add-page-numbers" />
        <div style={{ maxWidth: 700, margin: '80px auto', padding: '0 20px' }}>
          <a onClick={() => navigate(-1)} style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </a>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Page Numbers</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Add page numbers in any format to your PDF.</p>
          <FileDropZone onFiles={handleFiles} multiple={false} label="Drop PDF file here" sublabel="Upload a PDF to add page numbers" />
        </div>
      </>
    );
  }

  const toolbar = (
    <>
      <div className="editor-tool-group">
        <span className="editor-tool-label">Format</span>
        {FORMATS.map(f => (
          <button key={f.id} className={`editor-tool-btn ${formatId === f.id ? 'active' : ''}`}
            onClick={() => setFormatId(f.id)} style={{ fontSize: '0.75rem', width: 'auto', padding: '0 8px' }}>{f.label}</button>
        ))}
      </div>
      <div className="editor-tool-group">
        <span className="editor-tool-label">Position</span>
        <select className="editor-size-input" style={{ width: 'auto' }}
          value={positionId} onChange={(e) => setPositionId(e.target.value)}>
          {POSITIONS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>
      <div className="editor-tool-group">
        <span className="editor-tool-label">Size</span>
        <input className="editor-size-input" type="number" min="8" max="36" value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))} />
      </div>
      <div className="editor-tool-group">
        <span className="editor-tool-label">Start</span>
        <input className="editor-size-input" type="number" min="0" max="999" value={startNum}
          onChange={(e) => setStartNum(Number(e.target.value))} />
      </div>
      <div className="editor-tool-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input type="checkbox" checked={skipFirst} onChange={(e) => setSkipFirst(e.target.checked)} />
          <span className="editor-tool-label" style={{ textTransform: 'none' }}>Skip first page</span>
        </label>
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <SEO title="Add Page Numbers to PDF" description="Add page numbers to PDFs. Free and private." path="/add-page-numbers" />
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
        saveDisabled={false}
        loading={loading}
        hint="Preview of page numbers. Navigate pages to see how each one looks."
      />
    </>
  );
}
