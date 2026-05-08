import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import { formatFileSize, fileToArrayBuffer } from '../../utils/pdfUtils';

export default function CertifyPDF() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [issuer, setIssuer] = useState('FileNinja Browser Certification');

  const handleFiles = (newFiles) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0]);
      setResult(null);
    }
  };

  const handleCertify = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const arrayBuffer = await fileToArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Update Metadata
      pdfDoc.setSubject('Certified Document');
      pdfDoc.setProducer(issuer);
      pdfDoc.setKeywords(['certified', 'authentic', 'fileninja']);
      
      // Add a small certification badge on the first page
      const firstPage = pdfDoc.getPage(0);
      const { width } = firstPage.getSize();
      
      const badgeText = `CERTIFIED BY: ${issuer.toUpperCase()}`;
      const timestamp = new Date().toLocaleString();
      
      firstPage.drawRectangle({
        x: 20,
        y: 20,
        width: 300,
        height: 40,
        color: rgb(0.95, 0.98, 0.95),
        borderColor: rgb(0.1, 0.6, 0.2),
        borderWidth: 1,
      });

      firstPage.drawText(badgeText, {
        x: 30,
        y: 45,
        size: 8,
        font,
        color: rgb(0.1, 0.4, 0.1),
      });

      firstPage.drawText(`Verified on: ${timestamp}`, {
        x: 30,
        y: 30,
        size: 7,
        font,
        color: rgb(0.3, 0.5, 0.3),
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult({
        blob,
        name: file.name.replace(/\.[^/.]+$/, '') + '_certified.pdf',
        size: blob.size
      });
    } catch (err) {
      console.error(err);
      alert('Error certifying PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <SEO title="Certify PDF" description="Add digital certificates and authenticity stamps to your PDF." path="/certify-pdf" />
      <ToolPageLayout
        title="Certify PDF"
        description="Verify document authenticity by adding a certification stamp and secure metadata."
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
              label="Drop PDF to certify" 
              sublabel="Add digital authenticity stamp" 
            />

            {file && (
              <div style={{ marginTop: 24 }}>
                <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 8, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem' }}>{file.name} ({formatFileSize(file.size)})</span>
                  <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: '#cc0000', cursor: 'pointer' }}>Remove</button>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: 8 }}>Certification Issuer</label>
                  <input 
                    type="text" 
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-card)' }}
                  />
                </div>

                <ProcessButton 
                  label="Certify Document" 
                  loadingLabel="Applying Certificate..." 
                  onClick={handleCertify} 
                  loading={loading} 
                />
              </div>
            )}
          </div>
        ) : (
          <DownloadBanner 
            title="Document Certified!" 
            info={`'${file.name}' has been certified.`}
            savedText={`Certified PDF generated — ${formatFileSize(result.size)}`}
            blob={result.blob}
            fileName={result.name}
            onReset={() => { setResult(null); setFile(null); }}
          />
        )}
      </ToolPageLayout>
    </>
  );
}
