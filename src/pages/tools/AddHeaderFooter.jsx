import { useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone, { FileItem } from '../../components/shared/FileDropZone';
import { fileToArrayBuffer, formatFileSize, downloadPdf } from '../../utils/pdfUtils';
import SEO from '../../components/SEO';
import './ToolPage.css';

export default function AddHeaderFooter() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [headerLeft, setHeaderLeft] = useState('');
  const [headerCenter, setHeaderCenter] = useState('');
  const [headerRight, setHeaderRight] = useState('');
  const [footerLeft, setFooterLeft] = useState('');
  const [footerCenter, setFooterCenter] = useState('');
  const [footerRight, setFooterRight] = useState('');
  const [fontSize, setFontSize] = useState(10);

  const handleFiles = (newFiles) => { if (newFiles.length > 0) { setFile(newFiles[0]); setResult(null); } };
  const removeFile = () => { setFile(null); setResult(null); };

  const replaceDynamic = (tpl, pageNum, totalPages) => {
    return tpl
      .replace(/\{page\}/gi, String(pageNum))
      .replace(/\{total\}/gi, String(totalPages))
      .replace(/\{date\}/gi, new Date().toLocaleDateString());
  };

  const handleApply = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const bytes = await fileToArrayBuffer(file);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const total = pages.length;
      const margin = 36;

      pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        const pNum = i + 1;
        const drawRow = (left, center, right, y) => {
          if (left) { const t = replaceDynamic(left, pNum, total); page.drawText(t, { x: margin, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) }); }
          if (center) { const t = replaceDynamic(center, pNum, total); const tw = font.widthOfTextAtSize(t, fontSize); page.drawText(t, { x: (width - tw) / 2, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) }); }
          if (right) { const t = replaceDynamic(right, pNum, total); const tw = font.widthOfTextAtSize(t, fontSize); page.drawText(t, { x: width - tw - margin, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) }); }
        };
        drawRow(headerLeft, headerCenter, headerRight, height - margin);
        drawRow(footerLeft, footerCenter, footerRight, margin - fontSize);
      });

      const outBytes = await doc.save();
      setResult({ bytes: outBytes, size: outBytes.byteLength, pageCount: pages.length });
    } catch (err) { alert('Error adding header/footer.'); console.error(err); }
    finally { setLoading(false); }
  };

  const handleDownload = () => { if (result) downloadPdf(result.bytes, `${file.name.replace(/\.[^/.]+$/, '')}_headerfooter.pdf`); };
  const reset = () => { setFile(null); setResult(null); };

  const hasContent = headerLeft || headerCenter || headerRight || footerLeft || footerCenter || footerRight;

  return (
    <ToolPageLayout title="Header & Footer" description="Add custom headers and footers to every page."
      categoryColor="var(--cat-edit)" toolId="add-header-footer"
      steps={['Upload your PDF', 'Enter header & footer text', 'Download the updated PDF']}
    >
      <SEO title="Add Header & Footer to PDF — Free" description="Add headers and footers to PDFs. Free and private." path="/add-header-footer" />
      {!result ? (
        <div className="tool-layout">
          <FileDropZone onFiles={handleFiles} multiple={false} label="Drop PDF file here" sublabel="Upload a PDF to add headers and footers" />
          {file && (
            <div className="tool-section">
              <div className="tool-section__header">
                <h3 className="tool-section__title">{file.name} — {formatFileSize(file.size)}</h3>
                <button className="tool-section__clear" onClick={reset}>Clear</button>
              </div>
              <div className="watermark-options">
                <p className="tool-hint">Use <code>{'{page}'}</code> for page number, <code>{'{total}'}</code> for total pages, <code>{'{date}'}</code> for today's date.</p>
                <div className="metadata-form__field"><label className="metadata-form__label">Header</label></div>
                <div className="hf-row">
                  <input className="option-input" value={headerLeft} onChange={(e) => setHeaderLeft(e.target.value)} placeholder="Left" />
                  <input className="option-input" value={headerCenter} onChange={(e) => setHeaderCenter(e.target.value)} placeholder="Center" />
                  <input className="option-input" value={headerRight} onChange={(e) => setHeaderRight(e.target.value)} placeholder="Right" />
                </div>
                <div className="metadata-form__field"><label className="metadata-form__label">Footer</label></div>
                <div className="hf-row">
                  <input className="option-input" value={footerLeft} onChange={(e) => setFooterLeft(e.target.value)} placeholder="Left" />
                  <input className="option-input" value={footerCenter} onChange={(e) => setFooterCenter(e.target.value)} placeholder="Center" />
                  <input className="option-input" value={footerRight} onChange={(e) => setFooterRight(e.target.value)} placeholder="Right" />
                </div>
                <div className="metadata-form__field">
                  <label className="metadata-form__label">Font Size</label>
                  <input className="option-input option-input--narrow" type="number" min="6" max="24" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
                </div>
              </div>
              <div className="tool-actions">
                <ProcessButton onClick={handleApply} loading={loading} disabled={!file || !hasContent} label="Add Header & Footer" loadingLabel="Applying…" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="tool-layout">
          <DownloadBanner onDownload={handleDownload} onReset={reset}
            filename={`${file.name.replace(/\.[^/.]+$/, '')}_headerfooter.pdf`}
            savedText={`Header & footer added to ${result.pageCount} pages`} />
        </div>
      )}
    </ToolPageLayout>
  );
}
