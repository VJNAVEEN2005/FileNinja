import { useState, useEffect, useCallback } from 'react';
import ToolPageLayout, { ProcessButton, DownloadBanner } from '../../components/shared/ToolPageLayout';
import FileDropZone, { FileItem } from '../../components/shared/FileDropZone';
import { formatFileSize, downloadPdf, compressPdfLossy } from '../../utils/pdfUtils';
import SEO from '../../components/SEO';
import './ToolPage.css';

const LEVEL_PRESETS = [
  { value: 0,   label: 'Lossless',    desc: 'Structural optimization only — text stays selectable' },
  { value: 30,  label: 'Low',         desc: 'Slightly reduced quality, good size savings' },
  { value: 60,  label: 'Recommended', desc: 'Best balance of quality and file size' },
  { value: 85,  label: 'High',        desc: 'Significant reduction, lower quality' },
  { value: 100, label: 'Maximum',     desc: 'Smallest file, lowest quality' },
];

/**
 * Interpolate between sampled data points.
 * `samples` is a sorted array of { level, ratio } objects.
 */
function interpolateRatio(samples, level) {
  if (!samples || samples.length === 0) return 1;
  if (level <= samples[0].level) return samples[0].ratio;
  if (level >= samples[samples.length - 1].level) return samples[samples.length - 1].ratio;

  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i];
    const b = samples[i + 1];
    if (level >= a.level && level <= b.level) {
      const t = (level - a.level) / (b.level - a.level);
      return a.ratio + t * (b.ratio - a.ratio);
    }
  }
  return samples[samples.length - 1].ratio;
}

export default function CompressPDF() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState(60);
  const [result, setResult] = useState(null);

  // Sampled compression ratios from first page
  const [samples, setSamples] = useState(null);     // [{ level, ratio }]
  const [sampling, setSampling] = useState(false);

  const handleFiles = (newFiles) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0]);
      setResult(null);
      setSamples(null);
    }
  };

  const removeFile = () => { setFile(null); setResult(null); setSamples(null); };

  // ── Sample compression ratios from the FIRST PAGE at each preset level ──
  const sampleRatios = useCallback(async (srcFile) => {
    setSampling(true);
    try {
      // Create a single-page file from the first page for fast sampling
      const { PDFDocument } = await import('pdf-lib');
      const { fileToArrayBuffer } = await import('../../utils/pdfUtils');
      const buf = await fileToArrayBuffer(srcFile);
      const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const pageCount = srcDoc.getPageCount();

      // Extract first page only
      const singleDoc = await PDFDocument.create();
      const [page] = await singleDoc.copyPages(srcDoc, [0]);
      singleDoc.addPage(page);
      const singleBytes = await singleDoc.save();
      const singleFile = new File([singleBytes], 'sample.pdf', { type: 'application/pdf' });
      const singleOrigSize = singleBytes.byteLength;

      const results = [];
      for (const preset of LEVEL_PRESETS) {
        const compressed = await compressPdfLossy(singleFile, preset.value);
        const ratio = compressed.byteLength / singleOrigSize;
        results.push({ level: preset.value, ratio: ratio * pageCount > 0 ? compressed.byteLength / singleOrigSize : 1 });
      }

      // Sort by level
      results.sort((a, b) => a.level - b.level);
      setSamples(results);
    } catch (err) {
      console.error('Sampling failed:', err);
      setSamples(null);
    } finally {
      setSampling(false);
    }
  }, []);

  // Run sampling when file changes
  useEffect(() => {
    if (file) {
      sampleRatios(file);
    }
  }, [file, sampleRatios]);

  const handleCompress = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const outBytes = await compressPdfLossy(file, level);
      setResult({
        bytes: outBytes,
        originalSize: file.size,
        compressedSize: outBytes.byteLength,
      });
    } catch (err) {
      alert('Error compressing PDF. Make sure the file is a valid PDF.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      downloadPdf(result.bytes, `${baseName}_compressed.pdf`);
    }
  };

  const reset = () => { setFile(null); setResult(null); setSamples(null); };

  // Find nearest preset for display
  const activePreset = LEVEL_PRESETS.reduce((prev, curr) =>
    Math.abs(curr.value - level) < Math.abs(prev.value - level) ? curr : prev
  );

  // ── Compute estimated size from real samples ──
  const estimatedSize = (file && samples)
    ? file.size * interpolateRatio(samples, level)
    : null;

  const estimatedSavings = (file && estimatedSize !== null)
    ? Math.max(0, ((1 - estimatedSize / file.size) * 100)).toFixed(0)
    : null;

  const savingsPercent = result
    ? Math.max(0, ((1 - result.compressedSize / result.originalSize) * 100)).toFixed(1)
    : null;

  return (
    <ToolPageLayout
      title="Compress PDF"
      description="Reduce file size with adjustable compression levels."
      categoryColor="var(--cat-optimize)"
      toolId="compress-pdf"
      steps={[
        'Drop or browse to add your PDF file',
        'Choose your compression level',
        'Click Compress and download',
      ]}
    >
      <SEO
        title="Compress PDF Online — Free & No Upload"
        description="Reduce PDF file size without losing quality. 100% free, private, and works entirely in your browser. No sign-up or file limits."
        path="/compress-pdf"
        faq={[
          { question: 'Is compressing PDF files free on FileNinja?', answer: 'Yes, it is completely free with no hidden charges or premium tiers.' },
          { question: 'Are my files uploaded to a server?', answer: 'No. FileNinja processes all files directly in your browser. Your files never leave your device.' },
          { question: 'How does it compress the PDF?', answer: 'It re-renders pages at a lower resolution and JPEG quality you choose, then rebuilds the document.' },
        ]}
      />

      {!result ? (
        <div className="tool-layout">
          <FileDropZone
            onFiles={handleFiles}
            multiple={false}
            label="Drop PDF file here"
            sublabel="You can add one file"
          />

          {file && (
            <div className="tool-section">
              <div className="tool-section__header">
                <h3 className="tool-section__title">
                  Original Size: {formatFileSize(file.size)}
                </h3>
                <button className="tool-section__clear" onClick={reset}>Clear</button>
              </div>

              <div className="file-list">
                <div className="file-list__item">
                  <FileItem file={file} index={0} onRemove={removeFile} />
                </div>
              </div>

              {/* ── Compression Level Slider ── */}
              <div className="compress-level">
                <div className="compress-level__header">
                  <h4 className="compress-level__title">Compression Level</h4>
                  <span className="compress-level__badge" data-level={activePreset.label.toLowerCase()}>
                    {activePreset.label} ({level}%)
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                  className="compress-level__slider"
                />

                <div className="compress-level__labels">
                  {LEVEL_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      className={`compress-level__preset ${level === p.value ? 'active' : ''}`}
                      onClick={() => setLevel(p.value)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <p className="compress-level__desc">{activePreset.desc}</p>

                {/* ── Estimated size preview ── */}
                {sampling && (
                  <div className="compress-level__estimate compress-level__estimate--loading">
                    <span className="compress-level__estimate-label">Analyzing your PDF…</span>
                  </div>
                )}

                {!sampling && samples && estimatedSize !== null && (
                  <div className="compress-level__estimate">
                    <div className="compress-level__estimate-row">
                      <span className="compress-level__estimate-label">Original</span>
                      <span className="compress-level__estimate-value">{formatFileSize(file.size)}</span>
                    </div>
                    <div className="compress-level__estimate-arrow">↓</div>
                    <div className="compress-level__estimate-row">
                      <span className="compress-level__estimate-label">Estimated</span>
                      <span className="compress-level__estimate-value compress-level__estimate-value--highlight">
                        ~{formatFileSize(estimatedSize)}
                      </span>
                    </div>
                    <div className="compress-level__estimate-savings">
                      ~{estimatedSavings}% smaller
                    </div>
                  </div>
                )}

                {level > 0 && (
                  <p className="compress-level__warn">
                    ⚠ Levels above 0% rasterize the document — text will no longer be selectable.
                  </p>
                )}
              </div>

              <div className="tool-actions">
                <ProcessButton
                  onClick={handleCompress}
                  loading={loading}
                  disabled={!file}
                  label="Compress PDF"
                  loadingLabel="Compressing..."
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="tool-layout">
          <DownloadBanner
            onDownload={handleDownload}
            onReset={reset}
            filename={`${file.name.replace(/\.[^/.]+$/, '')}_compressed.pdf`}
            savedText={`${formatFileSize(result.originalSize)} ➔ ${formatFileSize(result.compressedSize)}  (${savingsPercent}% smaller)`}
          />
        </div>
      )}
    </ToolPageLayout>
  );
}
