import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import PDFEditorLayout from '../../components/shared/PDFEditorLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, downloadPdf, getPageCount } from '../../utils/pdfUtils';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import '../../components/shared/PDFEditor.css';

const PLACEHOLDERS = ['{page}', '{total}', '{date}'];

function resolvePlaceholders(str, page, total) {
  return str
    .replace(/\{page\}/g, String(page))
    .replace(/\{total\}/g, String(total))
    .replace(/\{date\}/g, new Date().toLocaleDateString());
}

export default function AddHeaderFooter() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [headerLeft, setHeaderLeft] = useState('');
  const [headerCenter, setHeaderCenter] = useState('');
  const [headerRight, setHeaderRight] = useState('');
  const [footerLeft, setFooterLeft] = useState('');
  const [footerCenter, setFooterCenter] = useState('Page {page} of {total}');
  const [footerRight, setFooterRight] = useState('');
  const [fontSize, setFontSize] = useState(10);

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

    ctx.font = `${fontSize}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';

    const margin = 30;
    const page = currentPage;
    const total = pageCount;

    // Header
    const hl = resolvePlaceholders(headerLeft, page, total);
    const hc = resolvePlaceholders(headerCenter, page, total);
    const hr = resolvePlaceholders(headerRight, page, total);

    if (hl) { ctx.textAlign = 'left'; ctx.fillText(hl, margin, margin); }
    if (hc) { ctx.textAlign = 'center'; ctx.fillText(hc, W / 2, margin); }
    if (hr) { ctx.textAlign = 'right'; ctx.fillText(hr, W - margin, margin); }

    // Footer
    const fl = resolvePlaceholders(footerLeft, page, total);
    const fc = resolvePlaceholders(footerCenter, page, total);
    const fr = resolvePlaceholders(footerRight, page, total);

    if (fl) { ctx.textAlign = 'left'; ctx.fillText(fl, margin, H - margin + fontSize); }
    if (fc) { ctx.textAlign = 'center'; ctx.fillText(fc, W / 2, H - margin + fontSize); }
    if (fr) { ctx.textAlign = 'right'; ctx.fillText(fr, W - margin, H - margin + fontSize); }
  }, [currentPage, pageCount, headerLeft, headerCenter, headerRight, footerLeft, footerCenter, footerRight, fontSize]);

  useEffect(() => { redrawOverlay(); }, [redrawOverlay]);

  const hasContent = [headerLeft, headerCenter, headerRight, footerLeft, footerCenter, footerRight].some(s => s.trim());

  const handleSave = async () => {
    if (!file || !hasContent) return;
    setLoading(true);
    try {
      const bytes = await fileToArrayBuffer(file);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();

      pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        const margin = 40;
        const pageNum = i + 1;

        const drawRow = (left, center, right, y) => {
          const l = resolvePlaceholders(left, pageNum, pages.length);
          const c = resolvePlaceholders(center, pageNum, pages.length);
          const r = resolvePlaceholders(right, pageNum, pages.length);
          if (l) page.drawText(l, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
          if (c) {
            const tw = font.widthOfTextAtSize(c, fontSize);
            page.drawText(c, { x: (width - tw) / 2, y, size: fontSize, font, color: rgb(0, 0, 0) });
          }
          if (r) {
            const tw = font.widthOfTextAtSize(r, fontSize);
            page.drawText(r, { x: width - margin - tw, y, size: fontSize, font, color: rgb(0, 0, 0) });
          }
        };

        drawRow(headerLeft, headerCenter, headerRight, height - margin);
        drawRow(footerLeft, footerCenter, footerRight, margin);
      });

      const outBytes = await doc.save();
      downloadPdf(outBytes, `${file.name.replace(/\.[^/.]+$/, '')}_headerfooter.pdf`);
    } catch (err) { alert('Error adding header/footer.'); console.error(err); }
    finally { setLoading(false); }
  };

  if (!file) {
    return (
      <>
        <Navbar />
        <SEO title="Add Header Footer to PDF" description="Add custom headers and footers to PDFs. Free and private." path="/add-header-footer" />
        <div style={{ maxWidth: 700, margin: '80px auto', padding: '0 20px' }}>
          <a onClick={() => navigate(-1)} style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </a>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Header & Footer</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Add custom headers and footers with dynamic placeholders.</p>
          <FileDropZone onFiles={handleFiles} multiple={false} label="Drop PDF file here" sublabel="Upload a PDF to add headers/footers" />
        </div>
      </>
    );
  }

  const fieldStyle = { width: 100, padding: '4px 6px', border: '1px solid var(--border-light)', borderRadius: 4, background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '0.78rem', outline: 'none' };

  const toolbar = (
    <>
      <div className="editor-tool-group" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        <span className="editor-tool-label">Header</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <input style={fieldStyle} value={headerLeft} onChange={(e) => setHeaderLeft(e.target.value)} placeholder="Left" />
          <input style={fieldStyle} value={headerCenter} onChange={(e) => setHeaderCenter(e.target.value)} placeholder="Center" />
          <input style={fieldStyle} value={headerRight} onChange={(e) => setHeaderRight(e.target.value)} placeholder="Right" />
        </div>
      </div>
      <div className="editor-tool-group" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        <span className="editor-tool-label">Footer</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <input style={fieldStyle} value={footerLeft} onChange={(e) => setFooterLeft(e.target.value)} placeholder="Left" />
          <input style={fieldStyle} value={footerCenter} onChange={(e) => setFooterCenter(e.target.value)} placeholder="Center" />
          <input style={fieldStyle} value={footerRight} onChange={(e) => setFooterRight(e.target.value)} placeholder="Right" />
        </div>
      </div>
      <div className="editor-tool-group">
        <span className="editor-tool-label">Size</span>
        <input className="editor-size-input" type="number" min="6" max="24" value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))} />
      </div>
      <div className="editor-tool-group" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
        <span className="editor-tool-label">Placeholders</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{PLACEHOLDERS.join('  ')}</span>
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <SEO title="Add Header Footer to PDF" description="Add custom headers and footers to PDFs. Free and private." path="/add-header-footer" />
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
        saveDisabled={!hasContent}
        loading={loading}
        hint="Header and footer preview. Use {page}, {total}, {date} as placeholders."
      />
    </>
  );
}
