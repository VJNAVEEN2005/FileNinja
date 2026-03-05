import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import { formatFileSize } from '../../utils/pdfUtils';

export default function TextToPDF() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Settings
  const [fontSize, setFontSize] = useState(12);
  const [fontFamily, setFontFamily] = useState('helvetica');

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
      const text = await file.text();
      const pdf = new jsPDF();
      
      pdf.setFont(fontFamily);
      pdf.setFontSize(fontSize);
      
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const maxWidth = pageWidth - (margin * 2);
      
      const lines = pdf.splitTextToSize(text, maxWidth);
      
      let cursorY = margin;
      for (let i = 0; i < lines.length; i++) {
        if (cursorY + (fontSize * 0.5) > pageHeight - margin) {
          pdf.addPage();
          cursorY = margin;
        }
        pdf.text(lines[i], margin, cursorY + (fontSize * 0.35));
        cursorY += (fontSize * 0.5); // line height factor
      }

      const blob = pdf.output('blob');
      setResult({
        blob,
        name: file.name.replace(/\.[^/.]+$/, '') + '.pdf',
        size: blob.size
      });
    } catch (err) {
      console.error(err);
      alert('Error converting text to PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <SEO title="Text to PDF" description="Convert plain text files to professional PDF format." path="/text-to-pdf" />
      <ToolPageLayout
        title="Text to PDF"
        description="Transform simple text files into clean, readable PDF documents."
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
              accept=".txt"
              label="Drop text file here" 
              sublabel="Plain text (.txt) files only" 
            />

            {file && (
              <div style={{ marginTop: 24 }}>
                <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 8, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem' }}>{file.name} ({formatFileSize(file.size)})</span>
                  <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: '#cc0000', cursor: 'pointer' }}>Remove</button>
                </div>

                <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 12, marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Font Size</span>
                    <input type="number" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} style={{ width: 60, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border-light)' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Font Family</span>
                    <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-light)' }}>
                      <option value="helvetica">Helvetica</option>
                      <option value="times">Times New Roman</option>
                      <option value="courier">Courier</option>
                    </select>
                  </div>
                </div>

                <ProcessButton 
                  label="Convert to PDF" 
                  loadingLabel="Converting..." 
                  onClick={handleConvert} 
                  loading={loading} 
                />
              </div>
            )}
          </div>
        ) : (
          <DownloadBanner 
            title="Conversion Complete!" 
            info={`'${file.name}' converted successfully`}
            savedText={`PDF generated — ${formatFileSize(result.size)}`}
            blob={result.blob}
            fileName={result.name}
            onReset={() => { setResult(null); setFile(null); }}
          />
        )}
      </ToolPageLayout>
    </>
  );
}
