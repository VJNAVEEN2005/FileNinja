import { useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone, { FileItem } from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, formatFileSize, downloadPdf } from '../../utils/pdfUtils';
import SEO from '../../components/SEO';
import './ToolPage.css';

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

export default function OcrPDF() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [lang, setLang] = useState('eng');
  const [result, setResult] = useState(null);

  const handleFiles = (newFiles) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0]);
      setResult(null);
    }
  };

  const removeFile = () => { setFile(null); setResult(null); };

  const handleOCR = async () => {
    if (!file) return;
    setLoading(true);
    setProgress('Loading PDF…');

    try {
      const arrayBuffer = await fileToArrayBuffer(file);

      // Load with pdfjs-dist for rendering
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).href;

      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdfDoc.numPages;

      // Load Tesseract
      setProgress('Loading OCR engine…');
      const Tesseract = await import('tesseract.js');
      const worker = await Tesseract.createWorker(lang, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const pct = Math.round((m.progress || 0) * 100);
            setProgress(prev => {
              // Keep the page info if available
              const pageMatch = prev.match(/page \d+ of \d+/);
              return pageMatch
                ? `OCR ${pageMatch[0]}… ${pct}%`
                : `Recognizing text… ${pct}%`;
            });
          }
        },
      });

      // Create output PDF
      const outDoc = await PDFDocument.create();
      const font = await outDoc.embedFont(StandardFonts.Helvetica);
      const renderScale = 2.0;
      let totalWords = 0;

      for (let i = 1; i <= totalPages; i++) {
        setProgress(`Processing page ${i} of ${totalPages}…`);

        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: renderScale });

        // Render page to canvas
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Get JPEG for embedding
        const blob = await new Promise(resolve =>
          canvas.toBlob(resolve, 'image/jpeg', 0.9)
        );
        const jpegBytes = new Uint8Array(await blob.arrayBuffer());

        // Run OCR on the canvas image — v7 requires explicit output options
        setProgress(`OCR page ${i} of ${totalPages}… 0%`);
        const dataUrl = canvas.toDataURL('image/png');
        const { data } = await worker.recognize(dataUrl, { }, { blocks: true, text: true });

        // Create new page with original dimensions
        const origViewport = page.getViewport({ scale: 1 });
        const outPage = outDoc.addPage([origViewport.width, origViewport.height]);

        // Scale factors: Tesseract uses canvas pixel coords → convert to PDF points
        const scaleX = origViewport.width / canvas.width;
        const scaleY = origViewport.height / canvas.height;

        // ── STEP 1: Draw text layer FIRST (behind the image) ──
        // Extract words from the nested Tesseract result structure
        const words = [];
        if (data.blocks) {
          for (const block of data.blocks) {
            for (const para of (block.paragraphs || [])) {
              for (const line of (para.lines || [])) {
                for (const word of (line.words || [])) {
                  if (word.text && word.text.trim() && word.confidence > 30) {
                    words.push(word);
                  }
                }
              }
            }
          }
        }

        totalWords += words.length;

        for (const word of words) {
          const wx = word.bbox.x0 * scaleX;
          // PDF uses bottom-left origin; Tesseract uses top-left
          const wy = origViewport.height - (word.bbox.y1 * scaleY);
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
            // Skip characters not supported by the standard font
          }
        }

        // ── STEP 2: Draw the page image ON TOP to visually cover the text ──
        const jpegImage = await outDoc.embedJpg(jpegBytes);
        outPage.drawImage(jpegImage, {
          x: 0, y: 0,
          width: origViewport.width,
          height: origViewport.height,
        });
      }

      await worker.terminate();

      const outBytes = await outDoc.save({ useObjectStreams: true });
      setResult({
        bytes: outBytes,
        originalSize: file.size,
        ocrSize: outBytes.byteLength,
        pageCount: totalPages,
        wordCount: totalWords,
      });
    } catch (err) {
      alert('Error during OCR. Please make sure the file is a valid PDF.');
      console.error(err);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleDownload = () => {
    if (result) {
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      downloadPdf(result.bytes, `${baseName}_ocr.pdf`);
    }
  };

  const reset = () => { setFile(null); setResult(null); };

  return (
    <ToolPageLayout
      title="OCR PDF"
      description="Make scanned documents searchable by adding a text layer with OCR."
      categoryColor="var(--cat-optimize)"
      toolId="ocr-pdf"
      steps={[
        'Upload a scanned or image-based PDF',
        'Select the document language',
        'Click Run OCR and download the searchable PDF',
      ]}
    >
      <SEO
        title="OCR PDF Online — Free & No Upload"
        description="Make scanned PDFs searchable using OCR. Supports 12+ languages. 100% free, private, browser-only."
        path="/ocr-pdf"
        faq={[
          { question: 'What is OCR?', answer: 'Optical Character Recognition (OCR) converts images of text into actual searchable and selectable text.' },
          { question: 'What languages are supported?', answer: 'English, Tamil, Hindi, French, Spanish, German, Japanese, Arabic, Portuguese, Italian, Korean, and Chinese (Simplified).' },
          { question: 'Are my files uploaded?', answer: 'No. OCR runs entirely in your browser using Tesseract.js. Files never leave your device.' },
        ]}
      />

      {!result ? (
        <div className="tool-layout">
          <FileDropZone
            onFiles={handleFiles}
            multiple={false}
            label="Drop scanned PDF here"
            sublabel="Upload a scanned or image-based PDF"
          />

          {file && (
            <div className="tool-section">
              <div className="tool-section__header">
                <h3 className="tool-section__title">
                  {file.name} — {formatFileSize(file.size)}
                </h3>
                <button className="tool-section__clear" onClick={reset}>Clear</button>
              </div>

              <div className="file-list">
                <div className="file-list__item">
                  <FileItem file={file} index={0} onRemove={removeFile} />
                </div>
              </div>

              {/* Language selector */}
              <div className="ocr-lang">
                <label className="ocr-lang__label">Document Language</label>
                <div className="ocr-lang__grid">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      className={`ocr-lang__btn ${lang === l.code ? 'active' : ''}`}
                      onClick={() => setLang(l.code)}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="tool-actions">
                <ProcessButton
                  onClick={handleOCR}
                  loading={loading}
                  disabled={!file}
                  label="Run OCR"
                  loadingLabel={progress || 'Processing…'}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="tool-layout">
          <DownloadBanner
            onDownload={handleDownload}
            onReset={reset}
            filename={`${file.name.replace(/\.[^/.]+$/, '')}_ocr.pdf`}
            savedText={`${result.pageCount} page${result.pageCount !== 1 ? 's' : ''} processed — ${result.wordCount} words recognized`}
          />
        </div>
      )}
    </ToolPageLayout>
  );
}
