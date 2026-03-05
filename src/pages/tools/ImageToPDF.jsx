import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import { formatFileSize, downloadPdf } from '../../utils/pdfUtils';

const LANGUAGES = [
  { code: 'eng', label: 'English' },
  { code: 'tam', label: 'Tamil' },
  { code: 'hin', label: 'Hindi' },
  { code: 'fra', label: 'French' },
  { code: 'spa', label: 'Spanish' },
  { code: 'deu', label: 'German' },
  { code: 'jpn', label: 'Japanese' },
  { code: 'ara', label: 'Arabic' },
  { code: 'por', label: 'Portuguese' },
  { code: 'ita', label: 'Italian' },
  { code: 'kor', label: 'Korean' },
  { code: 'chi_sim', label: 'Chinese (Simplified)' },
];

export default function ImageToPDF() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState(null);

  // Settings
  const [pageSize, setPageSize] = useState('a4'); // 'a4' or 'fit'
  const [orientation, setOrientation] = useState('p'); // 'p' or 'l'
  const [margin, setMargin] = useState(20);
  const [ocrEnabled, setOcrEnabled] = useState(false);
  const [lang, setLang] = useState('eng');

  const handleFiles = (newFiles) => {
    setFiles(prev => [...prev, ...newFiles]);
    setResult(null);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveFile = (index, direction) => {
    const newFiles = [...files];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < newFiles.length) {
      [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
      setFiles(newFiles);
    }
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setProgress('Initializing…');

    try {
      const outDoc = await PDFDocument.create();
      const font = ocrEnabled ? await outDoc.embedFont(StandardFonts.Helvetica) : null;
      
      let Tesseract = null;
      let worker = null;
      if (ocrEnabled) {
        setProgress('Loading OCR engine…');
        Tesseract = await import('tesseract.js');
        worker = await Tesseract.createWorker(lang, 1, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const pct = Math.round((m.progress || 0) * 100);
              setProgress(`OCR Processing… ${pct}%`);
            }
          },
        });
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(`Processing image ${i + 1} of ${files.length}…`);
        
        const imgBytes = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(new Uint8Array(e.target.result));
          reader.readAsArrayBuffer(file);
        });

        let embeddedImg;
        if (file.type === 'image/png') {
          embeddedImg = await outDoc.embedPng(imgBytes);
        } else {
          embeddedImg = await outDoc.embedJpg(imgBytes);
        }

        const { width: imgW, height: imgH } = embeddedImg.size();
        
        let pageW, pageH;
        if (pageSize === 'a4') {
          pageW = orientation === 'p' ? 595.28 : 841.89;
          pageH = orientation === 'p' ? 841.89 : 595.28;
        } else {
          pageW = imgW + margin * 2;
          pageH = imgH + margin * 2;
        }

        const outPage = outDoc.addPage([pageW, pageH]);
        
        const availW = pageW - margin * 2;
        const availH = pageH - margin * 2;
        const scale = Math.min(availW / imgW, availH / imgH);
        
        const drawW = imgW * scale;
        const drawH = imgH * scale;
        const x = margin + (availW - drawW) / 2;
        const y = margin + (availH - drawH) / 2;

        if (ocrEnabled && worker) {
          setProgress(`OCR image ${i + 1} of ${files.length}… 0%`);
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });
          
          // Get natural image dimensions for scaling Tesseract bboxes
          const pixelStats = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
            img.src = dataUrl;
          });

          const { data } = await worker.recognize(dataUrl, {}, { blocks: true, text: true });
          
          // Draw text layer (invisible)
          if (data && data.blocks) {
            const scaleX = drawW / pixelStats.w;
            const scaleY = drawH / pixelStats.h;

            for (const block of data.blocks) {
              for (const para of (block.paragraphs || [])) {
                for (const line of (para.lines || [])) {
                  for (const word of (line.words || [])) {
                    if (word.text && word.text.trim() && word.confidence > 25) {
                      const wx = x + (word.bbox.x0 * scaleX);
                      // PDF uses bottom-left origin; Tesseract uses top-left
                      const wy = y + drawH - (word.bbox.y1 * scaleY);
                      const wordHeight = (word.bbox.y1 - word.bbox.y0) * scaleY;
                      const fontSize = Math.max(2, wordHeight * 0.85);

                      try {
                        outPage.drawText(word.text, {
                          x: wx,
                          y: wy,
                          size: fontSize,
                          font,
                          color: rgb(0, 0, 0),
                          opacity: 0.01,
                        });
                      } catch { 
                        // Skip characters not available in standard fonts
                      }
                    }
                  }
                }
              }
            }
          }
        }

        outPage.drawImage(embeddedImg, {
          x, y,
          width: drawW,
          height: drawH,
        });
      }

      if (worker) await worker.terminate();

      const outBytes = await outDoc.save();
      const blob = new Blob([outBytes], { type: 'application/pdf' });
      
      setResult({
        blob,
        name: 'converted_images.pdf',
        size: blob.size,
        count: files.length
      });
    } catch (err) {
      console.error(err);
      alert('Error converting images to PDF.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <>
      <Navbar />
      <SEO title="Image to PDF" description="Convert JPG, PNG, WebP images to PDF in your browser." path="/image-to-pdf" />
      <ToolPageLayout
        title="Image to PDF"
        description="Convert multiple images into a single professional PDF document."
      >
        <a onClick={() => navigate(-1)} style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </a>

        {!result ? (
          <div className="tool-section">
            <FileDropZone 
              onFiles={handleFiles} 
              multiple={true} 
              accept="image/*"
              label="Drop images here" 
              sublabel="PNG, JPG, WebP supported" 
            />

            {files.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontSize: '1rem' }}>Selected Images ({files.length})</h3>
                  <button onClick={() => setFiles([])} style={{ fontSize: '0.8rem', color: '#cc0000', background: 'none', border: 'none', cursor: 'pointer' }}>Clear All</button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16, marginBottom: 24 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ position: 'relative', border: '1px solid var(--border-light)', borderRadius: 8, overflow: 'hidden', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column' }}>
                      <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                      <div style={{ padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => moveFile(i, -1)} disabled={i === 0} style={{ padding: '2px 6px', fontSize: '10px', cursor: 'pointer', opacity: i === 0 ? 0.3 : 1 }}>←</button>
                          <button onClick={() => moveFile(i, 1)} disabled={i === files.length - 1} style={{ padding: '2px 6px', fontSize: '10px', cursor: 'pointer', opacity: i === files.length - 1 ? 0.3 : 1 }}>→</button>
                        </div>
                        <button 
                          onClick={() => removeFile(i)}
                          style={{ background: 'none', border: 'none', color: '#cc0000', cursor: 'pointer', fontSize: '14px' }}
                        >✕</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 12, marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Page Size</span>
                    <select value={pageSize} onChange={e => setPageSize(e.target.value)} style={{ width: '100%', padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-light)' }}>
                      <option value="a4">A4</option>
                      <option value="fit">Fit Image</option>
                    </select>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Orientation</span>
                    <select value={orientation} onChange={e => setOrientation(e.target.value)} style={{ width: '100%', padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-light)', opacity: pageSize === 'fit' ? 0.5 : 1 }} disabled={pageSize === 'fit'}>
                      <option value="p">Portrait</option>
                      <option value="l">Landscape</option>
                    </select>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Margin (pt)</span>
                    <input type="number" value={margin} onChange={e => setMargin(Number(e.target.value))} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border-light)' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>OCR (Searchable)</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: '34px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={ocrEnabled} onChange={e => setOcrEnabled(e.target.checked)} />
                      <span style={{ fontSize: '0.85rem' }}>Enable</span>
                    </label>
                  </div>
                  {ocrEnabled && (
                    <div>
                      <span style={{ fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Language</span>
                      <select value={lang} onChange={e => setLang(e.target.value)} style={{ width: '100%', padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-light)' }}>
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <ProcessButton 
                  label="Convert to PDF" 
                  loadingLabel={progress || "Converting..."} 
                  onClick={handleConvert} 
                  loading={loading} 
                />
              </div>
            )}
          </div>
        ) : (
          <DownloadBanner 
            title="Conversion Complete!" 
            info={`${result.count} image(s) processed`}
            savedText={`PDF generated — ${formatFileSize(result.size)}`}
            blob={result.blob}
            fileName={result.name}
            onReset={() => { setResult(null); setFiles([]); }}
          />
        )}
      </ToolPageLayout>
    </>
  );
}
