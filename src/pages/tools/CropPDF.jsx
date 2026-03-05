import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone, { FileItem } from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, formatFileSize, downloadPdf } from '../../utils/pdfUtils';
import SEO from '../../components/SEO';
import './ToolPage.css';

export default function CropPDF() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [margins, setMargins] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [unit, setUnit] = useState('pt'); // pt or mm

  const handleFiles = (newFiles) => { if (newFiles.length > 0) { setFile(newFiles[0]); setResult(null); } };
  const removeFile = () => { setFile(null); setResult(null); };

  const toPt = (val) => unit === 'mm' ? val * 2.83465 : val;

  const handleCrop = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const bytes = await fileToArrayBuffer(file);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = doc.getPages();

      for (const page of pages) {
        const { width, height } = page.getSize();
        const cropBox = {
          x: toPt(margins.left),
          y: toPt(margins.bottom),
          width: width - toPt(margins.left) - toPt(margins.right),
          height: height - toPt(margins.top) - toPt(margins.bottom),
        };
        page.setCropBox(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
        page.setMediaBox(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
      }

      const outBytes = await doc.save();
      setResult({ bytes: outBytes, size: outBytes.byteLength, pageCount: pages.length });
    } catch (err) { alert('Error cropping PDF.'); console.error(err); }
    finally { setLoading(false); }
  };

  const handleDownload = () => { if (result) downloadPdf(result.bytes, `${file.name.replace(/\.[^/.]+$/, '')}_cropped.pdf`); };
  const reset = () => { setFile(null); setResult(null); };
  const updateMargin = (key, value) => setMargins(prev => ({ ...prev, [key]: Math.max(0, Number(value)) }));

  return (
    <ToolPageLayout title="Crop PDF" description="Trim PDF pages by setting custom margins."
      categoryColor="var(--cat-edit)" toolId="crop-pdf"
      steps={['Upload your PDF', 'Set the crop margins', 'Download the cropped PDF']}
    >
      <SEO title="Crop PDF Pages — Free" description="Crop PDF pages by setting margins. Free and private." path="/crop-pdf" />
      {!result ? (
        <div className="tool-layout">
          <FileDropZone onFiles={handleFiles} multiple={false} label="Drop PDF file here" sublabel="Upload a PDF to crop its pages" />
          {file && (
            <div className="tool-section">
              <div className="tool-section__header">
                <h3 className="tool-section__title">{file.name} — {formatFileSize(file.size)}</h3>
                <button className="tool-section__clear" onClick={reset}>Clear</button>
              </div>
              <div className="watermark-options">
                <div className="metadata-form__field">
                  <label className="metadata-form__label">Unit</label>
                  <div className="compress-level__labels">
                    <button className={`compress-level__preset ${unit === 'pt' ? 'active' : ''}`} onClick={() => setUnit('pt')}>Points (pt)</button>
                    <button className={`compress-level__preset ${unit === 'mm' ? 'active' : ''}`} onClick={() => setUnit('mm')}>Millimeters (mm)</button>
                  </div>
                </div>
                <div className="crop-margins">
                  <div className="crop-margins__top">
                    <label className="metadata-form__label">Top</label>
                    <input className="option-input option-input--narrow" type="number" min="0" value={margins.top} onChange={(e) => updateMargin('top', e.target.value)} />
                  </div>
                  <div className="crop-margins__middle">
                    <div>
                      <label className="metadata-form__label">Left</label>
                      <input className="option-input option-input--narrow" type="number" min="0" value={margins.left} onChange={(e) => updateMargin('left', e.target.value)} />
                    </div>
                    <div className="crop-margins__preview">Page</div>
                    <div>
                      <label className="metadata-form__label">Right</label>
                      <input className="option-input option-input--narrow" type="number" min="0" value={margins.right} onChange={(e) => updateMargin('right', e.target.value)} />
                    </div>
                  </div>
                  <div className="crop-margins__bottom">
                    <label className="metadata-form__label">Bottom</label>
                    <input className="option-input option-input--narrow" type="number" min="0" value={margins.bottom} onChange={(e) => updateMargin('bottom', e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="tool-actions">
                <ProcessButton onClick={handleCrop} loading={loading} disabled={!file} label="Crop PDF" loadingLabel="Cropping…" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="tool-layout">
          <DownloadBanner onDownload={handleDownload} onReset={reset}
            filename={`${file.name.replace(/\.[^/.]+$/, '')}_cropped.pdf`}
            savedText={`${result.pageCount} page${result.pageCount !== 1 ? 's' : ''} cropped`} />
        </div>
      )}
    </ToolPageLayout>
  );
}
