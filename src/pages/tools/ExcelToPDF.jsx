import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone from '../../components/shared/FileDropZone';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import { formatFileSize } from '../../utils/pdfUtils';

export default function ExcelToPDF() {
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
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const doc = new jsPDF();

      workbook.SheetNames.forEach((sheetName, index) => {
        if (index > 0) doc.addPage();
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length > 0) {
          doc.setFontSize(16);
          doc.text(`Sheet: ${sheetName}`, 14, 20);
          
          doc.autoTable({
            startY: 25,
            head: [jsonData[0]],
            body: jsonData.slice(1),
            theme: 'grid',
            headStyles: { fillColor: [66, 133, 244] }, // Blueish for Excel
            styles: { fontSize: 7, cellPadding: 1 },
          });
        } else {
          doc.text(`Sheet ${sheetName} is empty`, 14, 20);
        }
      });

      const blob = doc.output('blob');
      setResult({
        blob,
        name: file.name.replace(/\.[^/.]+$/, '') + '.pdf',
        size: blob.size,
        sheets: workbook.SheetNames.length
      });
    } catch (err) {
      console.error(err);
      alert('Error converting Excel to PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <SEO title="Excel to PDF" description="Convert Excel spreadsheets into high-quality PDF files." path="/excel-to-pdf" />
      <ToolPageLayout
        title="Excel to PDF"
        description="Convert XLSX, XLS, and ODS spreadsheets into clean, professional PDF tables."
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
              accept=".xlsx,.xls,.ods"
              label="Drop Excel file here" 
              sublabel="XLSX, XLS, ODS supported" 
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
            info={`${result.sheets} sheet(s) processed`}
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
