import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone, { FileItem } from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, formatFileSize, downloadPdf } from '../../utils/pdfUtils';
import SEO from '../../components/SEO';
import './ToolPage.css';

export default function RepairPDF() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFiles = (newFiles) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0]);
      setResult(null);
    }
  };

  const removeFile = () => { setFile(null); setResult(null); };

  const handleRepair = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const bytes = await fileToArrayBuffer(file);

      // Load with lenient options — this reconstructs xref table & objects
      const doc = await PDFDocument.load(bytes, {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
      });

      const pageCount = doc.getPageCount();
      const title = doc.getTitle() || '';
      const author = doc.getAuthor() || '';

      // Re-save to rebuild internal structure
      const repairedBytes = await doc.save({ useObjectStreams: true });

      setResult({
        bytes: repairedBytes,
        originalSize: file.size,
        repairedSize: repairedBytes.byteLength,
        pageCount,
        title,
        author,
      });
    } catch (err) {
      alert('This PDF is too severely damaged to repair. The file structure could not be recovered.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      downloadPdf(result.bytes, `${baseName}_repaired.pdf`);
    }
  };

  const reset = () => { setFile(null); setResult(null); };

  return (
    <ToolPageLayout
      title="Repair PDF"
      description="Fix corrupted or damaged PDF files by reconstructing their internal structure."
      categoryColor="var(--cat-optimize)"
      toolId="repair-pdf"
      steps={[
        'Upload your damaged or corrupted PDF',
        'Click Repair to reconstruct the file',
        'Download the repaired PDF',
      ]}
    >
      <SEO
        title="Repair PDF Online — Free & No Upload"
        description="Fix corrupted PDF files by reconstructing their internal structure. 100% free, private, and works in your browser."
        path="/repair-pdf"
        faq={[
          { question: 'What kind of damage can it repair?', answer: 'It can fix broken cross-reference tables, corrupted object streams, and minor structural issues that prevent PDFs from opening.' },
          { question: 'Are my files uploaded?', answer: 'No. Everything is processed locally in your browser.' },
          { question: 'Will it recover all content?', answer: 'Recovery depends on the severity of damage. Severely corrupted files may not be fully recoverable.' },
        ]}
      />

      {!result ? (
        <div className="tool-layout">
          <FileDropZone
            onFiles={handleFiles}
            multiple={false}
            label="Drop damaged PDF here"
            sublabel="Upload a corrupted or broken PDF file"
          />

          {file && (
            <div className="tool-section">
              <div className="tool-section__header">
                <h3 className="tool-section__title">
                  {file.name} — {formatFileSize(file.size)}
                </h3>
                <button className="tool-section__clear" onClick={reset}>Clear</button>
              </div>

              <div className="file-list">
                <div className="file-list__item">
                  <FileItem file={file} index={0} onRemove={removeFile} />
                </div>
              </div>

              <div className="tool-actions">
                <ProcessButton
                  onClick={handleRepair}
                  loading={loading}
                  disabled={!file}
                  label="Repair PDF"
                  loadingLabel="Repairing…"
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="tool-layout">
          {/* Recovery report */}
          <div className="repair-report">
            <h3 className="repair-report__title">Repair Successful</h3>
            <div className="repair-report__grid">
              <div className="repair-report__item">
                <span className="repair-report__label">Pages recovered</span>
                <span className="repair-report__value">{result.pageCount}</span>
              </div>
              <div className="repair-report__item">
                <span className="repair-report__label">Original size</span>
                <span className="repair-report__value">{formatFileSize(result.originalSize)}</span>
              </div>
              <div className="repair-report__item">
                <span className="repair-report__label">Repaired size</span>
                <span className="repair-report__value">{formatFileSize(result.repairedSize)}</span>
              </div>
              {result.title && (
                <div className="repair-report__item">
                  <span className="repair-report__label">Title</span>
                  <span className="repair-report__value">{result.title}</span>
                </div>
              )}
              {result.author && (
                <div className="repair-report__item">
                  <span className="repair-report__label">Author</span>
                  <span className="repair-report__value">{result.author}</span>
                </div>
              )}
            </div>
          </div>

          <DownloadBanner
            onDownload={handleDownload}
            onReset={reset}
            filename={`${file.name.replace(/\.[^/.]+$/, '')}_repaired.pdf`}
            savedText={`${result.pageCount} page${result.pageCount !== 1 ? 's' : ''} recovered — ${formatFileSize(result.repairedSize)}`}
          />
        </div>
      )}
    </ToolPageLayout>
  );
}
