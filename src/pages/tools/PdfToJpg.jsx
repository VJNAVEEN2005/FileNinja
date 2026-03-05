import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import { formatFileSize, fileToArrayBuffer } from '../../utils/pdfUtils';

export default function PdfToJpg() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFiles = (newFiles) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0]);
      setResult(null);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).href;

      const arrayBuffer = await fileToArrayBuffer(file);
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const zip = new JSZip();

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High quality
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const base64Data = imgData.replace(/^data:image\/jpeg;base64,/, "");
        zip.file(`page-${i}.jpg`, base64Data, { base64: true });
      }

      const content = await zip.generateAsync({ type: 'blob' });
      setResult({
        blob: content,
        name: file.name.replace(/\.[^/.]+$/, '') + '_images.zip',
        size: content.size,
        count: numPages
      });
    } catch (err) {
      console.error(err);
      alert('Error converting PDF to JPG.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <SEO title="PDF to JPG" description="Convert PDF pages to JPG images in your browser." path="/pdf-to-jpg" />
      <ToolPageLayout
        title="PDF to JPG"
        description="Extract each page of your PDF as a high-quality JPG image."
      >
        <a onClick={() => navigate(-1)} style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </a>

        {!result ? (
          <div className="tool-section">
            <FileDropZone 
              onFiles={handleFiles} 
              multiple={false} 
              accept=".pdf"
              label="Drop PDF file here" 
              sublabel="Extract pages as JPG images" 
            />

            {file && (
              <div style={{ marginTop: 24 }}>
                <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 8, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem' }}>{file.name} ({formatFileSize(file.size)})</span>
                  <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: '#cc0000', cursor: 'pointer' }}>Remove</button>
                </div>

                <ProcessButton 
                  label="Convert to JPG" 
                  loadingLabel="Processing..." 
                  onClick={handleConvert} 
                  loading={loading} 
                />
              </div>
            )}
          </div>
        ) : (
          <DownloadBanner 
            title="Extraction Complete!" 
            info={`${result.count} pages converted successfully.`}
            savedText={`ZIP archive generated — ${formatFileSize(result.size)}`}
            blob={result.blob}
            fileName={result.name}
            onReset={() => { setResult(null); setFile(null); }}
          />
        )}
      </ToolPageLayout>
    </>
  );
}
