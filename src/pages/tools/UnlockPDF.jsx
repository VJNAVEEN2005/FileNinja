import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import { formatFileSize, fileToArrayBuffer } from '../../utils/pdfUtils';

export default function UnlockPDF() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFiles = (newFiles) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0]);
      setResult(null);
    }
  };

  const handleUnlock = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const arrayBuffer = await fileToArrayBuffer(file);

      // 1. Load with pdfjs-dist (handles modern encryption/passwords)
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).href;

      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        password: password 
      });
      
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      // 2. Initialize jsPDF for re-generation (unlocked)
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 2.0; // High quality
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        // Convert to mm for jsPDF
        const widthMm = (viewport.width / scale) * 0.352778;
        const heightMm = (viewport.height / scale) * 0.352778;

        if (i > 1) doc.addPage([widthMm, heightMm]);
        else {
          doc.deletePage(1);
          doc.addPage([widthMm, heightMm]);
        }

        doc.addImage(imgData, 'JPEG', 0, 0, widthMm, heightMm);
      }

      const pdfOutput = doc.output('blob');
      
      setResult({
        blob: pdfOutput,
        name: file.name.replace(/\.[^/.]+$/, '') + '_unlocked.pdf',
        size: pdfOutput.size
      });
    } catch (err) {
      console.error(err);
      if (err.name === 'PasswordException') {
        alert('Incorrect password. Please try again.');
      } else {
        alert('Error unlocking PDF. This could be due to modern encryption not supported by the browser engine.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <SEO title="Unlock PDF" description="Remove password protection from your PDF files." path="/unlock-pdf" />
      <ToolPageLayout
        title="Unlock PDF"
        description="Remove security and passwords from your PDF documents to make them accessible."
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
              label="Drop encrypted PDF here" 
              sublabel="Remove password protection" 
            />

            {file && (
              <div style={{ marginTop: 24 }}>
                <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 8, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem' }}>{file.name} ({formatFileSize(file.size)})</span>
                  <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: '#cc0000', cursor: 'pointer' }}>Remove</button>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: 8, fontWeight: 500 }}>Enter Password (if known)</label>
                  <input 
                    type="password" 
                    placeholder="Enter PDF password..." 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      borderRadius: '8px', 
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 8 }}>
                    Note: This tool cannot crack unknown passwords. It removes the protection from files you have the password for.
                  </p>
                </div>

                <ProcessButton 
                  label="Unlock PDF" 
                  loadingLabel="Decrypting..." 
                  onClick={handleUnlock} 
                  loading={loading} 
                />
              </div>
            )}
          </div>
        ) : (
          <DownloadBanner 
            title="PDF Unlocked!" 
            info={`'${file.name}' is now unprotected.`}
            savedText={`Unlocked PDF generated — ${formatFileSize(result.size)}`}
            blob={result.blob}
            fileName={result.name}
            onReset={() => { setResult(null); setFile(null); setPassword(''); }}
          />
        )}
      </ToolPageLayout>
    </>
  );
}
