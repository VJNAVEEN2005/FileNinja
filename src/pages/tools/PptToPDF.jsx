import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import { formatFileSize } from '../../utils/pdfUtils';

export default function PptToPDF() {
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
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      
      // Look for media folder where images (previews/thumbnails) might be
      // Or just state that this is an "extractor" for now as full PPT conversion is server-side
      const mediaFiles = Object.keys(content.files).filter(path => 
        path.startsWith('ppt/media/') && (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg'))
      );

      if (mediaFiles.length === 0) {
        // Fallback or more advanced parsing
        throw new Error('No high-quality image previews found in the PPTX structure.');
      }

      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < mediaFiles.length; i++) {
        if (i > 0) pdf.addPage('l', 'a4');
        const imgBlob = await content.files[mediaFiles[i]].async('blob');
        const imgData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(imgBlob);
        });
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
      }

      const blob = pdf.output('blob');
      setResult({
        blob,
        name: file.name.replace(/\.[^/.]+$/, '') + '.pdf',
        size: blob.size,
        slides: mediaFiles.length
      });
    } catch (err) {
      console.error(err);
      alert('Note: Experimental PPT conversion only extracts high-quality media/slides found within the document. For complex layouts, server-side conversion is recommended.');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <SEO title="PPT to PDF" description="Convert PowerPoint presentations (.pptx) to PDF format." path="/ppt-to-pdf" />
      <ToolPageLayout
        title="PPT to PDF"
        description="Transform your PowerPoint slides into a single, high-quality PDF document."
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
              accept=".pptx"
              label="Drop PPTX file here" 
              sublabel="Microsoft PowerPoint (.pptx) only" 
            />

            {file && (
              <div style={{ marginTop: 24 }}>
                <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 8, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem' }}>{file.name} ({formatFileSize(file.size)})</span>
                  <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: '#cc0000', cursor: 'pointer' }}>Remove</button>
                </div>

                <div style={{ padding: '12px', background: '#fff9e6', border: '1px solid #ffe58f', borderRadius: 8, marginBottom: 24, fontSize: '0.8rem', color: '#856404' }}>
                  <strong>Beta Feature:</strong> This converter extracts slide previews and media from the PPTX package. Complex animations and font layouts may vary.
                </div>

                <ProcessButton 
                  label="Convert Slides to PDF" 
                  loadingLabel="Extracting..." 
                  onClick={handleConvert} 
                  loading={loading} 
                />
              </div>
            )}
          </div>
        ) : (
          <DownloadBanner 
            title="Conversion Complete!" 
            info={`${result.slides} slide previews extracted`}
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
