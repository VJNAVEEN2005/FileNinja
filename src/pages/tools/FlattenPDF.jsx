import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone, { FileItem } from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, formatFileSize, downloadPdf } from '../../utils/pdfUtils';
import SEO from '../../components/SEO';
import './ToolPage.css';

export default function FlattenPDF() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState(null);

  const handleFiles = (newFiles) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0]);
      setResult(null);
    }
  };

  const removeFile = () => { setFile(null); setResult(null); };

  const handleFlatten = async () => {
    if (!file) return;
    setLoading(true);
    setProgress('Loading PDF…');
    try {
      const arrayBuffer = await fileToArrayBuffer(file);

      // Load with pdfjs-dist for rendering (renders annotations/forms)
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).href;

      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdfDoc.numPages;

      // Create output document
      const outDoc = await PDFDocument.create();

      for (let i = 1; i <= totalPages; i++) {
        setProgress(`Flattening page ${i} of ${totalPages}…`);
        const page = await pdfDoc.getPage(i);
        const scale = 2.0; // High quality
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Convert to JPEG
        const blob = await new Promise(resolve =>
          canvas.toBlob(resolve, 'image/jpeg', 0.92)
        );
        const jpegBytes = new Uint8Array(await blob.arrayBuffer());
        const jpegImage = await outDoc.embedJpg(jpegBytes);

        // Use original page dimensions
        const origViewport = page.getViewport({ scale: 1 });
        const outPage = outDoc.addPage([origViewport.width, origViewport.height]);
        outPage.drawImage(jpegImage, {
          x: 0, y: 0,
          width: origViewport.width,
          height: origViewport.height,
        });
      }

      const outBytes = await outDoc.save({ useObjectStreams: true });
      setResult({
        bytes: outBytes,
        originalSize: file.size,
        flattenedSize: outBytes.byteLength,
        pageCount: totalPages,
      });
    } catch (err) {
      alert('Error flattening PDF. Please make sure the file is a valid PDF.');
      console.error(err);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleDownload = () => {
    if (result) {
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      downloadPdf(result.bytes, `${baseName}_flattened.pdf`);
    }
  };

  const reset = () => { setFile(null); setResult(null); };

  return (
    <ToolPageLayout
      title="Flatten PDF"
      description="Convert interactive elements, form fields, and annotations into static content."
      categoryColor="var(--cat-optimize)"
      toolId="flatten-pdf"
      steps={[
        'Upload your PDF with forms or annotations',
        'Click Flatten to bake everything into static pages',
        'Download the flattened PDF',
      ]}
    >
      <SEO
        title="Flatten PDF Online — Free & No Upload"
        description="Flatten PDF form fields and annotations into static content. 100% free, private, and works entirely in your browser."
        path="/flatten-pdf"
        faq={[
          { question: 'What does flattening a PDF do?', answer: 'It converts interactive form fields, annotations, and overlays into static, non-editable page content.' },
          { question: 'Are my files uploaded?', answer: 'No. Everything is processed in your browser. Files never leave your device.' },
          { question: 'Will I lose text selectability?', answer: 'Yes — flattening rasterizes each page, so text is converted to an image.' },
        ]}
      />

      {!result ? (
        <div className="tool-layout">
          <FileDropZone
            onFiles={handleFiles}
            multiple={false}
            label="Drop PDF file here"
            sublabel="Upload a PDF with form fields or annotations"
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

              <div className="tool-actions">
                <ProcessButton
                  onClick={handleFlatten}
                  loading={loading}
                  disabled={!file}
                  label="Flatten PDF"
                  loadingLabel={progress || 'Flattening…'}
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
            filename={`${file.name.replace(/\.[^/.]+$/, '')}_flattened.pdf`}
            savedText={`${result.pageCount} page${result.pageCount !== 1 ? 's' : ''} flattened — ${formatFileSize(result.originalSize)} ➔ ${formatFileSize(result.flattenedSize)}`}
          />
        </div>
      )}
    </ToolPageLayout>
  );
}
