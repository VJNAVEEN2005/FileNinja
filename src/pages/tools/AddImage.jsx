import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone, { FileItem } from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, formatFileSize, downloadPdf, getPageCount } from '../../utils/pdfUtils';
import SEO from '../../components/SEO';
import './ToolPage.css';

export default function AddImage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [image, setImage] = useState(null); // { bytes, type, name, previewUrl }
  const [page, setPage] = useState(1);
  const [x, setX] = useState(72);
  const [y, setY] = useState(500);
  const [imgWidth, setImgWidth] = useState(200);
  const [imgHeight, setImgHeight] = useState(200);
  const imgInputRef = useRef(null);

  const handleFiles = async (newFiles) => {
    if (newFiles.length > 0) {
      const f = newFiles[0]; setFile(f); setResult(null);
      const count = await getPageCount(f);
      setPageCount(count); setPage(1);
    }
  };
  const removeFile = () => { setFile(null); setResult(null); setPageCount(0); };

  const handleImageSelect = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const bytes = new Uint8Array(await f.arrayBuffer());
    const type = f.type.includes('png') ? 'png' : 'jpg';
    setImage({ bytes, type, name: f.name, previewUrl: URL.createObjectURL(f) });
  };

  const handleApply = async () => {
    if (!file || !image) return;
    setLoading(true);
    try {
      const bytes = await fileToArrayBuffer(file);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const embeddedImg = image.type === 'png'
        ? await doc.embedPng(image.bytes)
        : await doc.embedJpg(image.bytes);

      const pages = doc.getPages();
      const targetPage = pages[Math.min(page - 1, pages.length - 1)];
      targetPage.drawImage(embeddedImg, { x, y, width: imgWidth, height: imgHeight });

      const outBytes = await doc.save();
      setResult({ bytes: outBytes, size: outBytes.byteLength });
    } catch (err) { alert('Error adding image. Supported formats: JPG, PNG.'); console.error(err); }
    finally { setLoading(false); }
  };

  const handleDownload = () => { if (result) downloadPdf(result.bytes, `${file.name.replace(/\.[^/.]+$/, '')}_image.pdf`); };
  const reset = () => { setFile(null); setResult(null); setImage(null); setPageCount(0); };

  return (
    <ToolPageLayout title="Add Image" description="Insert images into your PDF document."
      categoryColor="var(--cat-edit)" toolId="add-image"
      steps={['Upload your PDF', 'Select an image and set position', 'Download the edited PDF']}
    >
      <SEO title="Add Image to PDF — Free" description="Insert images into PDFs. Free and private." path="/add-image" />
      {!result ? (
        <div className="tool-layout">
          <FileDropZone onFiles={handleFiles} multiple={false} label="Drop PDF file here" sublabel="Upload a PDF to add an image" />
          {file && (
            <div className="tool-section">
              <div className="tool-section__header">
                <h3 className="tool-section__title">{file.name} — {pageCount} pages</h3>
                <button className="tool-section__clear" onClick={reset}>Clear</button>
              </div>
              <div className="watermark-options">
                <div className="metadata-form__field">
                  <label className="metadata-form__label">Image (JPG or PNG)</label>
                  <input ref={imgInputRef} type="file" accept="image/png,image/jpeg" onChange={handleImageSelect} style={{ display: 'none' }} />
                  <button className="compress-level__preset active" onClick={() => imgInputRef.current?.click()}>
                    {image ? `✓ ${image.name}` : 'Choose image…'}
                  </button>
                  {image && <img src={image.previewUrl} alt="preview" style={{ maxWidth: 120, maxHeight: 80, borderRadius: 6, marginTop: 8 }} />}
                </div>
                <div className="watermark-options__row">
                  <div className="metadata-form__field">
                    <label className="metadata-form__label">Page</label>
                    <input className="option-input option-input--narrow" type="number" min="1" max={pageCount} value={page} onChange={(e) => setPage(Number(e.target.value))} />
                  </div>
                  <div className="metadata-form__field">
                    <label className="metadata-form__label">X (pt)</label>
                    <input className="option-input option-input--narrow" type="number" min="0" value={x} onChange={(e) => setX(Number(e.target.value))} />
                  </div>
                  <div className="metadata-form__field">
                    <label className="metadata-form__label">Y (pt)</label>
                    <input className="option-input option-input--narrow" type="number" min="0" value={y} onChange={(e) => setY(Number(e.target.value))} />
                  </div>
                  <div className="metadata-form__field">
                    <label className="metadata-form__label">Width (pt)</label>
                    <input className="option-input option-input--narrow" type="number" min="10" value={imgWidth} onChange={(e) => setImgWidth(Number(e.target.value))} />
                  </div>
                  <div className="metadata-form__field">
                    <label className="metadata-form__label">Height (pt)</label>
                    <input className="option-input option-input--narrow" type="number" min="10" value={imgHeight} onChange={(e) => setImgHeight(Number(e.target.value))} />
                  </div>
                </div>
              </div>
              <div className="tool-actions">
                <ProcessButton onClick={handleApply} loading={loading} disabled={!file || !image} label="Add Image" loadingLabel="Adding…" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="tool-layout">
          <DownloadBanner onDownload={handleDownload} onReset={reset}
            filename={`${file.name.replace(/\.[^/.]+$/, '')}_image.pdf`}
            savedText="Image added to PDF successfully" />
        </div>
      )}
    </ToolPageLayout>
  );
}
