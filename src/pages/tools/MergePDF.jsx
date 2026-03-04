import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone, { FileItem } from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, formatFileSize, downloadPdf } from '../../utils/pdfUtils';
import './ToolPage.css';

export default function MergePDF() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { bytes, size }
  const dragIdx = useRef(null);

  const handleFiles = (newFiles) => {
    setResult(null);
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      const toAdd = newFiles.filter(f => !existing.has(f.name + f.size));
      return [...prev, ...toAdd];
    });
  };

  const removeFile = (i) => setFiles(f => f.filter((_, idx) => idx !== i));

  // Simple drag-to-reorder
  const onDragStart = (i) => { dragIdx.current = i; };
  const onDragOver = (e, i) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;

    const fromIdx = dragIdx.current;
    dragIdx.current = i; // Synchronous update to prevent race conditions during continuous firing

    setFiles(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(i, 0, moved);
      return next;
    });
  };
  const onDragEnd = () => { dragIdx.current = null; };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setLoading(true);
    try {
      const merged = await PDFDocument.create();
      for (const file of files) {
        const bytes = await fileToArrayBuffer(file);
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      const outBytes = await merged.save();
      setResult({ bytes: outBytes, size: outBytes.byteLength });
    } catch (err) {
      alert('Error merging PDFs. Make sure all files are valid PDFs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      const baseName = files.length > 0 ? files[0].name.replace(/\.[^/.]+$/, "") : "document";
      downloadPdf(result.bytes, `${baseName}_merged.pdf`);
    }
  };

  const reset = () => { setFiles([]); setResult(null); };

  const totalSize = files.reduce((s, f) => s + f.size, 0);

  return (
    <ToolPageLayout
      title="Merge PDF"
      description="Combine multiple PDF files into one document. Drag rows to reorder before merging."
      categoryColor="var(--cat-organize)"
      toolId="merge-pdf"
      steps={[
        'Drop or browse to add your PDF files',
        'Drag rows to set the order',
        'Click Merge and download the result',
      ]}
    >
      {!result ? (
        <div className="tool-layout">
          <FileDropZone
            onFiles={handleFiles}
            multiple={true}
            label="Drop PDF files here"
            sublabel="You can add multiple files"
          />

          {files.length > 0 && (
            <div className="tool-section">
              <div className="tool-section__header">
                <h3 className="tool-section__title">
                  {files.length} file{files.length !== 1 ? 's' : ''} &mdash; {formatFileSize(totalSize)} total
                </h3>
                <button className="tool-section__clear" onClick={reset}>Clear all</button>
              </div>

              <p className="tool-hint">Drag rows to reorder</p>

              <div className="file-list">
                {files.map((file, i) => (
                  <div
                    key={file.name + file.size}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={(e) => onDragOver(e, i)}
                    onDragEnd={onDragEnd}
                    className="file-list__item"
                  >
                    <FileItem file={file} index={i} onRemove={removeFile} />
                  </div>
                ))}
              </div>

              <div className="tool-actions">
                <ProcessButton
                  onClick={handleMerge}
                  loading={loading}
                  disabled={files.length < 2}
                  label={`Merge ${files.length} PDFs`}
                  loadingLabel="Merging..."
                />
                {files.length < 2 && (
                  <p className="tool-hint tool-hint--warn">Add at least 2 PDF files to merge</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="tool-layout">
          <DownloadBanner
            onDownload={handleDownload}
            onReset={reset}
            filename={`${files.length > 0 ? files[0].name.replace(/\.[^/.]+$/, "") : "document"}_merged.pdf`}
            savedText={`${files.length} PDFs merged — ${formatFileSize(result.size)}`}
          />
        </div>
      )}
    </ToolPageLayout>
  );
}
