import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import { formatFileSize, fileToArrayBuffer } from '../../utils/pdfUtils';

export default function PdfToExcel() {
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
      
      const wb = XLSX.utils.book_new();

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Simple heuristic for table extraction: 
        // Group items by their vertical position (y-coordinate)
        const rowsMap = {};
        textContent.items.forEach(item => {
          const y = Math.round(item.transform[5]);
          if (!rowsMap[y]) rowsMap[y] = [];
          rowsMap[y].push(item);
        });

        // Sort rows by y (descending) and then items within row by x (ascending)
        const sortedY = Object.keys(rowsMap).sort((a, b) => b - a);
        const sheetData = sortedY.map(y => {
          return rowsMap[y]
            .sort((a, b) => a.transform[4] - b.transform[4])
            .map(item => item.str)
            .join(' ');
        }).map(rowText => [rowText]); // Each line is a row in Excel for now

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(wb, ws, `Page ${i}`);
      }

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      setResult({
        blob: blob,
        name: file.name.replace(/\.[^/.]+$/, '') + '.xlsx',
        size: blob.size
      });
    } catch (err) {
      console.error(err);
      alert('Error extracting data for Excel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <SEO title="PDF to Excel" description="Extract tables from PDF to spreadsheet in your browser." path="/pdf-to-excel" />
      <ToolPageLayout
        title="PDF to Excel"
        description="Extract tables and structured data from your PDF into a Microsoft Excel spreadsheet."
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
              sublabel="Extract tables to .xlsx" 
            />

            {file && (
              <div style={{ marginTop: 24 }}>
                <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 8, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem' }}>{file.name} ({formatFileSize(file.size)})</span>
                  <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: '#cc0000', cursor: 'pointer' }}>Remove</button>
                </div>

                <ProcessButton 
                  label="Convert to Excel" 
                  loadingLabel="Analyzing Tables..." 
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
            savedText={`Excel spreadsheet generated — ${formatFileSize(result.size)}`}
            blob={result.blob}
            fileName={result.name}
            onReset={() => { setResult(null); setFile(null); }}
          />
        )}
      </ToolPageLayout>
    </>
  );
}
