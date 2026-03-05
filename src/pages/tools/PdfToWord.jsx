import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import { formatFileSize, fileToArrayBuffer } from '../../utils/pdfUtils';

export default function PdfToWord() {
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
      let fullText = '';

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += `<p>${pageText}</p><br/>`;
      }

      // Basic HTML to DOC conversion using Blob with application/msword MIME
      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Exported PDF</title></head>
        <body>${fullText}</body>
        </html>
      `;
      
      const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
      });

      setResult({
        blob: blob,
        name: file.name.replace(/\.[^/.]+$/, '') + '.doc',
        size: blob.size
      });
    } catch (err) {
      console.error(err);
      alert('Error extracting text from PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <SEO title="PDF to Word" description="Convert PDF to editable Word document in your browser." path="/pdf-to-word" />
      <ToolPageLayout
        title="PDF to Word"
        description="Extract text from your PDF and save it as an editable Word document."
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
              sublabel="Convert to editable Word document" 
            />

            {file && (
              <div style={{ marginTop: 24 }}>
                <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 8, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem' }}>{file.name} ({formatFileSize(file.size)})</span>
                  <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: '#cc0000', cursor: 'pointer' }}>Remove</button>
                </div>

                <ProcessButton 
                  label="Convert to Word" 
                  loadingLabel="Extracting Text..." 
                  onClick={handleConvert} 
                  loading={loading} 
                />
              </div>
            )}
          </div>
        ) : (
          <DownloadBanner 
            title="Extraction Complete!" 
            info={`'${file.name}' converted successfully.`}
            savedText={`Word document generated — ${formatFileSize(result.size)}`}
            blob={result.blob}
            fileName={result.name}
            onReset={() => { setResult(null); setFile(null); }}
          />
        )}
      </ToolPageLayout>
    </>
  );
}
