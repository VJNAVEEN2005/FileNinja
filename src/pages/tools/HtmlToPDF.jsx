import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import { formatFileSize, downloadPdf } from '../../utils/pdfUtils';

export default function HtmlToPDF() {
  const navigate = useNavigate();
  const [htmlFile, setHtmlFile] = useState(null);
  const [cssFile, setCssFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleHtmlFiles = (newFiles) => {
    if (newFiles.length > 0) {
      setHtmlFile(newFiles[0]);
      setResult(null);
    }
  };

  const handleCssFiles = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setCssFile(f);
      setResult(null);
    }
    // Reset value so same file can be selected again
    e.target.value = '';
  };

  const handleConvert = async () => {
    if (!htmlFile) return;
    setLoading(true);

    try {
      const htmlText = await htmlFile.text();
      let cssText = '';
      if (cssFile) {
        cssText = await cssFile.text();
      }

      // Create a hidden iframe for high-fidelity rendering
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-10000px';
      iframe.style.top = '-10000px';
      iframe.style.width = '800px'; // Render width
      iframe.style.height = '1000px'; // Initial height
      document.body.appendChild(iframe);

      const combinedHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { margin: 0; padding: 40px; background: white; font-family: sans-serif; }
              ${cssText}
            </style>
          </head>
          <body>
            ${htmlText.includes('<body') ? htmlText.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || htmlText : htmlText}
          </body>
        </html>
      `;

      iframe.srcdoc = combinedHtml;

      // Wait for iframe to load content and styles
      await new Promise(resolve => {
        iframe.onload = () => {
          // Give it a small extra delay for any sub-resources
          setTimeout(resolve, 300);
        };
      });

      const body = iframe.contentDocument.body;
      
      // Use html2canvas for high-fidelity capture of the iframe body
      const canvas = await html2canvas(body, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
      
      const blob = pdf.output('blob');
      setResult({
        blob,
        name: htmlFile.name.replace(/\.[^/.]+$/, '') + '.pdf',
        size: blob.size
      });

      document.body.removeChild(iframe);
    } catch (err) {
      console.error(err);
      alert('Error converting HTML to PDF. Check if the files are valid.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      const fileName = htmlFile.name.replace(/\.[^/.]+$/, '') + '.pdf';
      const reader = new FileReader();
      reader.onload = () => {
        const bytes = new Uint8Array(reader.result);
        downloadPdf(bytes, fileName);
      };
      reader.readAsArrayBuffer(result.blob);
    }
  };

  return (
    <>
      <Navbar />
      <SEO title="HTML to PDF" description="Convert HTML files and CSS to professional PDF documents." path="/html-to-pdf" />
      <ToolPageLayout
        title="HTML to PDF"
        description="Upload an HTML file and optional CSS to generate a high-quality PDF document."
      >
        <a onClick={() => navigate(-1)} style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </a>

        {!result ? (
          <div className="tool-section">
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: '0.9rem', display: 'block', marginBottom: 8, fontWeight: 500 }}>Step 1: Upload HTML File</span>
              <FileDropZone 
                onFiles={handleHtmlFiles} 
                multiple={false} 
                accept=".html,.htm"
                label={htmlFile ? htmlFile.name : "Drop HTML file here"} 
                sublabel={htmlFile ? `${formatFileSize(htmlFile.size)}` : "Select the main .html file"} 
              />
            </div>

            <div style={{ marginBottom: 32 }}>
              <span style={{ fontSize: '0.9rem', display: 'block', marginBottom: 8, fontWeight: 500 }}>Step 2: Upload CSS File (Optional)</span>
              <div style={{ 
                border: '1px dashed var(--border-light)', 
                borderRadius: 8, 
                padding: '16px', 
                background: 'var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span style={{ fontSize: '0.85rem', color: cssFile ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                    {cssFile ? cssFile.name : "No CSS file selected"}
                  </span>
                </div>
                <label style={{ 
                  padding: '6px 16px', 
                  borderRadius: 6, 
                  background: 'var(--primary)', 
                  color: 'white', 
                  fontSize: '0.8rem', 
                  cursor: 'pointer',
                  fontWeight: 500
                }}>
                  Choose CSS
                  <input type="file" accept=".css" onChange={handleCssFiles} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <ProcessButton 
              label="Convert to PDF" 
              loadingLabel="Converting..." 
              onClick={handleConvert} 
              loading={loading} 
              disabled={!htmlFile}
            />
          </div>
        ) : (
          <DownloadBanner 
            title="Conversion Complete!" 
            info={`'${htmlFile.name}' processed successfully`}
            savedText={`PDF generated — ${formatFileSize(result.size)}`}
            onDownload={handleDownload}
            filename={result.name}
            onReset={() => { setResult(null); setHtmlFile(null); setCssFile(null); }}
          />
        )}
      </ToolPageLayout>
    </>
  );
}
