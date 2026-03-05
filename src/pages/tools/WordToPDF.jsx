import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import mammoth from 'mammoth';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import { formatFileSize } from '../../utils/pdfUtils';

export default function WordToPDF() {
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
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value; // The generated HTML

      // Create a temporary hidden element to render HTML for jsPDF
      const container = document.createElement('div');
      container.innerHTML = html;
      container.style.width = '180mm'; // Standard A4 width minus margins
      container.style.padding = '20px';
      container.style.position = 'absolute';
      container.style.left = '-10000px';
      container.style.fontSize = '12pt';
      container.style.fontFamily = 'serif';
      document.body.appendChild(container);

      const doc = new jsPDF('p', 'mm', 'a4');
      
      await doc.html(container, {
        callback: function (doc) {
          const blob = doc.output('blob');
          setResult({
            blob,
            name: file.name.replace(/\.[^/.]+$/, '') + '.pdf',
            size: blob.size
          });
          document.body.removeChild(container);
          setLoading(false);
        },
        x: 15,
        y: 15,
        width: 180,
        windowWidth: 800
      });
    } catch (err) {
      console.error(err);
      alert('Error converting Word to PDF. Please ensure it is a .docx file.');
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <SEO title="Word to PDF" description="Convert Word documents (.docx) to PDF format in your browser." path="/word-to-pdf" />
      <ToolPageLayout
        title="Word to PDF"
        description="Convert your Word documents into high-quality PDFs while preserving formatting."
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
              accept=".docx"
              label="Drop Word file here" 
              sublabel="Microsoft Word (.docx) supported" 
            />

            {file && (
              <div style={{ marginTop: 24 }}>
                <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 8, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem' }}>{file.name} ({formatFileSize(file.size)})</span>
                  <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: '#cc0000', cursor: 'pointer' }}>Remove</button>
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
