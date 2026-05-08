import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import { formatFileSize, fileToArrayBuffer } from '../../utils/pdfUtils';

export default function ProtectPDF() {
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

  const handleProtect = async () => {
    if (!file || !password) return;
    setLoading(true);

    try {
      // 1. Load with pdfjs-dist to render pages
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).href;

      const arrayBuffer = await fileToArrayBuffer(file);
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      // 2. Initialize jsPDF with encryption
      const { jsPDF } = await import('jspdf');
      
      // jsPDF encryption options: userPassword, ownerPassword, userPermissions
      // permissions: 'print', 'modify', 'copy', 'annotating'
      const doc = new jsPDF({
        encryption: {
          userPassword: password,
          ownerPassword: password,
          userPermissions: ['print', 'modify', 'copy', 'annotating']
        }
      });

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        // Use high scale for quality (2.0 = 144 DPI approximately)
        const scale = 2.0;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        
        // Convert viewport points to mm for jsPDF
        const widthMm = (viewport.width / scale) * 0.352778;
        const heightMm = (viewport.height / scale) * 0.352778;

        if (i > 1) doc.addPage([widthMm, heightMm]);
        else {
          // Adjust first page size
          doc.deletePage(1);
          doc.addPage([widthMm, heightMm]);
        }

        doc.addImage(imgData, 'JPEG', 0, 0, widthMm, heightMm);
      }

      const pdfOutput = doc.output('blob');
      
      setResult({
        blob: pdfOutput,
        name: file.name.replace(/\.[^/.]+$/, '') + '_protected.pdf',
        size: pdfOutput.size
      });
    } catch (err) {
      console.error(err);
      alert('Error protecting PDF. Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <SEO title="Protect PDF" description="Add password encryption to your PDF document." path="/protect-pdf" />
      <ToolPageLayout
        title="Protect PDF"
        description="Secure your PDF files with a password to prevent unauthorized access."
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
              sublabel="Add password protection" 
            />

            {file && (
              <div style={{ marginTop: 24 }}>
                <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 8, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem' }}>{file.name} ({formatFileSize(file.size)})</span>
                  <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: '#cc0000', cursor: 'pointer' }}>Remove</button>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: 8, fontWeight: 500 }}>Set Password</label>
                  <input 
                    type="password" 
                    placeholder="Enter password..." 
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
                </div>

                <ProcessButton 
                  label="Protect PDF" 
                  loadingLabel="Encrypting..." 
                  onClick={handleProtect} 
                  loading={loading} 
                  disabled={!password}
                />
              </div>
            )}
          </div>
        ) : (
          <DownloadBanner 
            title="PDF Protected!" 
            info={`'${file.name}' is now secured with a password.`}
            savedText={`Secure PDF generated — ${formatFileSize(result.size)}`}
            blob={result.blob}
            fileName={result.name}
            onReset={() => { setResult(null); setFile(null); setPassword(''); }}
          />
        )}
      </ToolPageLayout>
    </>
  );
}
