import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone, { FileItem } from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, formatFileSize, downloadPdf } from '../../utils/pdfUtils';
import SEO from '../../components/SEO';
import './ToolPage.css';

export default function EditMetadata() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [meta, setMeta] = useState({ title: '', author: '', subject: '', keywords: '', creator: '' });
  const [originalMeta, setOriginalMeta] = useState(null);

  const handleFiles = async (newFiles) => {
    if (newFiles.length > 0) {
      const f = newFiles[0];
      setFile(f);
      setResult(null);
      // Read existing metadata
      try {
        const bytes = await fileToArrayBuffer(f);
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const existing = {
          title: doc.getTitle() || '',
          author: doc.getAuthor() || '',
          subject: doc.getSubject() || '',
          keywords: (doc.getKeywords() || ''),
          creator: doc.getCreator() || '',
        };
        setMeta(existing);
        setOriginalMeta(existing);
      } catch {
        setMeta({ title: '', author: '', subject: '', keywords: '', creator: '' });
        setOriginalMeta(null);
      }
    }
  };

  const removeFile = () => { setFile(null); setResult(null); setOriginalMeta(null); };

  const handleSave = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const bytes = await fileToArrayBuffer(file);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      doc.setTitle(meta.title);
      doc.setAuthor(meta.author);
      doc.setSubject(meta.subject);
      doc.setKeywords(meta.keywords.split(',').map(k => k.trim()));
      doc.setCreator(meta.creator);
      doc.setModificationDate(new Date());
      const outBytes = await doc.save();
      setResult({ bytes: outBytes, size: outBytes.byteLength });
    } catch (err) {
      alert('Error editing metadata.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      downloadPdf(result.bytes, `${baseName}_metadata.pdf`);
    }
  };

  const reset = () => { setFile(null); setResult(null); setOriginalMeta(null); };

  const updateMeta = (key, value) => setMeta(prev => ({ ...prev, [key]: value }));

  return (
    <ToolPageLayout
      title="Edit Metadata"
      description="Modify title, author, subject, keywords, and other PDF properties."
      categoryColor="var(--cat-edit)"
      toolId="edit-metadata"
      steps={['Upload your PDF', 'Edit the metadata fields', 'Download the updated PDF']}
    >
      <SEO title="Edit PDF Metadata — Free & No Upload" description="Edit PDF metadata. 100% free and private." path="/edit-metadata" />
      {!result ? (
        <div className="tool-layout">
          <FileDropZone onFiles={handleFiles} multiple={false} label="Drop PDF file here" sublabel="Upload a PDF to edit its metadata" />
          {file && (
            <div className="tool-section">
              <div className="tool-section__header">
                <h3 className="tool-section__title">{file.name} — {formatFileSize(file.size)}</h3>
                <button className="tool-section__clear" onClick={reset}>Clear</button>
              </div>
              <div className="metadata-form">
                {[
                  { key: 'title', label: 'Title' },
                  { key: 'author', label: 'Author' },
                  { key: 'subject', label: 'Subject' },
                  { key: 'keywords', label: 'Keywords (comma separated)' },
                  { key: 'creator', label: 'Creator' },
                ].map(({ key, label }) => (
                  <div className="metadata-form__field" key={key}>
                    <label className="metadata-form__label">{label}</label>
                    <input
                      className="option-input"
                      value={meta[key]}
                      onChange={(e) => updateMeta(key, e.target.value)}
                      placeholder={`Enter ${label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
              <div className="tool-actions">
                <ProcessButton onClick={handleSave} loading={loading} disabled={!file} label="Save Metadata" loadingLabel="Saving…" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="tool-layout">
          <DownloadBanner onDownload={handleDownload} onReset={reset}
            filename={`${file.name.replace(/\.[^/.]+$/, '')}_metadata.pdf`}
            savedText="Metadata updated successfully" />
        </div>
      )}
    </ToolPageLayout>
  );
}
