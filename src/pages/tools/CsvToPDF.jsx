import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import { formatFileSize } from '../../utils/pdfUtils';

export default function CsvToPDF() {
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

  const handleConvert = () => {
    if (!file) return;
    setLoading(true);

    Papa.parse(file, {
      complete: (results) => {
        try {
          const doc = new jsPDF();
          doc.setFontSize(18);
          doc.text(file.name.replace('.csv', ''), 14, 22);
          doc.setFontSize(11);
          doc.setTextColor(100);

          doc.autoTable({
            startY: 30,
            head: [results.data[0]],
            body: results.data.slice(1),
            theme: 'striped',
            headStyles: { fillColor: [255, 107, 74] },
            styles: { fontSize: 8, cellPadding: 2 },
          });

          const blob = doc.output('blob');
          setResult({
            blob,
            name: file.name.replace('.csv', '.pdf'),
            size: blob.size,
            rows: results.data.length
          });
        } catch (err) {
          console.error(err);
          alert('Error converting CSV to PDF.');
        } finally {
          setLoading(false);
        }
      },
      error: (err) => {
        console.error(err);
        alert('Error parsing CSV file.');
        setLoading(false);
      }
    });
  };

  return (
    <>
      <Navbar />
      <SEO title="CSV to PDF" description="Convert CSV data into professional PDF tables." path="/csv-to-pdf" />
      <ToolPageLayout
        title="CSV to PDF"
        description="Convert your CSV spreadsheets into clean, paginated PDF tables with one click."
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
              accept=".csv"
              label="Drop CSV file here" 
              sublabel="Comma separated values (*.csv)" 
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
            info={`${result.rows} rows processed into a PDF table`}
            savedText={`Table generated — ${formatFileSize(result.size)}`}
            blob={result.blob}
            fileName={result.name}
            onReset={() => { setResult(null); setFile(null); }}
          />
        )}
      </ToolPageLayout>
    </>
  );
}
