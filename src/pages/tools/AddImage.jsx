import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import PDFEditorLayout from '../../components/shared/PDFEditorLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, downloadPdf, getPageCount } from '../../utils/pdfUtils';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import '../../components/shared/PDFEditor.css';

export default function AddImage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Image entries: [{ id, dataUrl, x, y, w, h, page }]
  const [images, setImages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nextId = useRef(1);
  const canvasRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const imgCache = useRef({});

  const handleFiles = async (newFiles) => {
    if (newFiles.length > 0) {
      const f = newFiles[0];
      setFile(f); setImages([]); setSelectedId(null);
      const count = await getPageCount(f);
      setPageCount(count); setCurrentPage(1);
    }
  };

  const handleImageUpload = (e) => {
    const imgFile = e.target.files?.[0];
    if (!imgFile) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Scale to fit nicely, max 200px wide on canvas
        const maxW = 200;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const entry = {
          id: nextId.current++,
          dataUrl: reader.result,
          x: 50, y: 50,
          w: Math.round(img.width * scale),
          h: Math.round(img.height * scale),
          page: currentPage,
        };
        imgCache.current[entry.id] = img;
        setImages(prev => [...prev, entry]);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(imgFile);
    e.target.value = '';
  };

  const redrawOverlay = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    const pageImgs = images.filter(e => e.page === currentPage);
    for (const entry of pageImgs) {
      let img = imgCache.current[entry.id];
      if (!img) {
        img = new Image();
        img.src = entry.dataUrl;
        imgCache.current[entry.id] = img;
        img.onload = () => redrawOverlay();
        continue;
      }
      if (!img.complete) continue;
      ctx.drawImage(img, entry.x, entry.y, entry.w, entry.h);

      if (entry.id === selectedId) {
        ctx.strokeStyle = '#ff6b4a';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(entry.x - 2, entry.y - 2, entry.w + 4, entry.h + 4);
        ctx.setLineDash([]);
        // Resize handle (bottom-right)
        ctx.fillStyle = '#ff6b4a';
        ctx.fillRect(entry.x + entry.w - 5, entry.y + entry.h - 5, 10, 10);
      }
    }
  }, [images, currentPage, selectedId]);

  useEffect(() => { redrawOverlay(); }, [redrawOverlay]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const hitTest = (pos) => {
    const pageImgs = images.filter(e => e.page === currentPage);
    for (let i = pageImgs.length - 1; i >= 0; i--) {
      const e = pageImgs[i];
      if (pos.x >= e.x && pos.x <= e.x + e.w && pos.y >= e.y && pos.y <= e.y + e.h) return e;
    }
    return null;
  };

  const [resizing, setResizing] = useState(false);

  const handleMouseDown = (e) => {
    const pos = getPos(e);
    // Check resize handle first
    if (selectedId !== null) {
      const sel = images.find(i => i.id === selectedId);
      if (sel) {
        const hx = sel.x + sel.w, hy = sel.y + sel.h;
        if (Math.abs(pos.x - hx) < 12 && Math.abs(pos.y - hy) < 12) {
          setResizing(true);
          return;
        }
      }
    }
    const hit = hitTest(pos);
    if (hit) {
      setSelectedId(hit.id);
      setDragging(true);
      setDragOffset({ x: pos.x - hit.x, y: pos.y - hit.y });
    } else {
      setSelectedId(null);
      setDragging(false);
    }
  };

  const handleMouseMove = (e) => {
    const pos = getPos(e);
    if (resizing && selectedId !== null) {
      canvasRef.current.style.cursor = 'nwse-resize';
      setImages(prev => prev.map(img => {
        if (img.id !== selectedId) return img;
        const newW = Math.max(20, pos.x - img.x);
        const newH = Math.max(20, pos.y - img.y);
        return { ...img, w: newW, h: newH };
      }));
      return;
    }
    if (dragging && selectedId !== null) {
      canvasRef.current.style.cursor = 'grabbing';
      setImages(prev => prev.map(img =>
        img.id === selectedId ? { ...img, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y } : img
      ));
      return;
    }
    // Hover cursor
    const hit = hitTest(pos);
    if (selectedId !== null) {
      const sel = images.find(i => i.id === selectedId);
      if (sel) {
        const hx = sel.x + sel.w, hy = sel.y + sel.h;
        if (Math.abs(pos.x - hx) < 12 && Math.abs(pos.y - hy) < 12) {
          canvasRef.current.style.cursor = 'nwse-resize';
          return;
        }
      }
    }
    canvasRef.current.style.cursor = hit ? 'grab' : 'default';
  };

  const handleMouseUp = () => { setDragging(false); setResizing(false); };

  const deleteSelected = () => {
    if (selectedId === null) return;
    setImages(prev => prev.filter(e => e.id !== selectedId));
    setSelectedId(null);
  };

  const handleSave = async () => {
    if (!file || images.length === 0) return;
    setLoading(true);
    try {
      const bytes = await fileToArrayBuffer(file);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = doc.getPages();
      const previewScale = 1.5;

      for (const entry of images) {
        const pageIdx = Math.min(entry.page - 1, pages.length - 1);
        const page = pages[pageIdx];
        const { height } = page.getSize();

        const imgBytes = await fetch(entry.dataUrl).then(r => r.arrayBuffer());
        let embeddedImg;
        if (entry.dataUrl.includes('image/png')) {
          embeddedImg = await doc.embedPng(imgBytes);
        } else {
          embeddedImg = await doc.embedJpg(imgBytes);
        }

        page.drawImage(embeddedImg, {
          x: entry.x / previewScale,
          y: height - (entry.y / previewScale) - (entry.h / previewScale),
          width: entry.w / previewScale,
          height: entry.h / previewScale,
        });
      }

      const outBytes = await doc.save();
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      downloadPdf(outBytes, `${baseName}_image.pdf`);
    } catch (err) { alert('Error adding image.'); console.error(err); }
    finally { setLoading(false); }
  };

  if (!file) {
    return (
      <>
        <Navbar />
        <SEO title="Add Image to PDF" description="Insert images into PDFs visually. Free and private." path="/add-image" />
        <div style={{ maxWidth: 700, margin: '80px auto', padding: '0 20px' }}>
          <a onClick={() => navigate(-1)} style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </a>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Add Image to PDF</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Drag, resize, and position images on your PDF pages.</p>
          <FileDropZone onFiles={handleFiles} multiple={false} label="Drop PDF file here" sublabel="Upload a PDF to add images" />
        </div>
      </>
    );
  }

  const toolbar = (
    <>
      <div className="editor-tool-group">
        <span className="editor-tool-label">Insert</span>
        <label className="editor-tool-btn" title="Upload image" style={{ position: 'relative', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <input type="file" accept="image/png,image/jpeg" onChange={handleImageUpload}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
        </label>
      </div>
      <div className="editor-tool-group">
        <span className="editor-tool-label">{images.filter(i => i.page === currentPage).length} image(s)</span>
      </div>
      {selectedId !== null && (
        <div className="editor-tool-group">
          <button className="editor-tool-btn" onClick={deleteSelected} title="Delete selected" style={{ color: '#cc0000' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      <Navbar />
      <SEO title="Add Image to PDF — Free" description="Insert images into PDFs visually. Free and private." path="/add-image" />
      <PDFEditorLayout
        file={file} toolbar={toolbar}
        canvasRef={canvasRef} bgCanvasRef={bgCanvasRef}
        currentPage={currentPage}
        setCurrentPage={(p) => { setCurrentPage(typeof p === 'function' ? p(currentPage) : p); setSelectedId(null); }}
        pageCount={pageCount}
        redrawOverlay={redrawOverlay}
        onCanvasMouseDown={handleMouseDown}
        onCanvasMouseMove={handleMouseMove}
        onCanvasMouseUp={handleMouseUp}
        canvasCursor="default"
        onSave={handleSave}
        onBack={() => navigate(-1)}
        saveLabel="Save changes"
        saveDisabled={images.length === 0}
        loading={loading}
        hint="Upload an image above, then drag & resize it on the page"
      />
    </>
  );
}
