import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';

/**
 * Read a File as ArrayBuffer
 */
export async function fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Load a pdf-lib PDFDocument from a File
 */
export async function loadPdfDoc(file) {
    const bytes = await fileToArrayBuffer(file);
    return PDFDocument.load(bytes);
}

/**
 * Format byte count to human-readable size
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Trigger browser download of a Uint8Array as a PDF
 */
export function downloadPdf(bytes, filename = 'output.pdf') {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    saveAs(blob, filename);
}

/**
 * Render a single PDF page to a canvas data URL using pdfjs-dist
 * Returns a base64 PNG string
 */
export async function renderPageToDataUrl(file, pageIndex = 0, scale = 0.4) {
    try {
        // Dynamic import to avoid SSR issue and let Vite handle the worker
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url
        ).href;

        const arrayBuffer = await fileToArrayBuffer(file);
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(pageIndex + 1); // pdfjs is 1-indexed
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        return canvas.toDataURL('image/png');
    } catch {
        return null;
    }
}

/**
 * Render ALL pages of a file to data URLs. Returns array of strings.
 */
export async function renderAllPages(file, scale = 0.35) {
    try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url
        ).href;

        const arrayBuffer = await fileToArrayBuffer(file);
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const total = pdf.numPages;
        const results = [];

        for (let i = 1; i <= total; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;
            results.push(canvas.toDataURL('image/png'));
        }

        return results;
    } catch {
        return [];
    }
}

/**
 * Get page count from a File without rendering
 */
export async function getPageCount(file) {
    try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url
        ).href;
        const arrayBuffer = await fileToArrayBuffer(file);
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        return pdf.numPages;
    } catch {
        return 0;
    }
}

/**
 * Parse a range string like "1-3, 5, 7-9" into 0-based page indices
 */
export function parsePageRanges(rangeStr, totalPages) {
    const indices = new Set();
    const parts = rangeStr.split(',').map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
                    indices.add(i - 1);
                }
            }
        } else {
            const n = parseInt(part, 10);
            if (!isNaN(n) && n >= 1 && n <= totalPages) {
                indices.add(n - 1);
            }
        }
    }
    return [...indices].sort((a, b) => a - b);
}

/**
 * Compress a PDF by rasterizing pages to JPEG and re-embedding them.
 *
 * @param {File} file           – the source PDF file
 * @param {number} level        – 0-100  (0 = lossless / structural only,
 *                                        100 = maximum compression)
 * @returns {Promise<Uint8Array>}  compressed PDF bytes
 */
export async function compressPdfLossy(file, level = 50) {
    const arrayBuffer = await fileToArrayBuffer(file);

    /* ── Level 0  →  lossless (structural only) ── */
    if (level === 0) {
        const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        return doc.save({ useObjectStreams: true });
    }

    /* ── Lossy path: rasterize → JPEG → new PDF ── */

    // Map level 1-100 to render scale and JPEG quality.
    // Higher level  →  lower scale & lower quality  →  smaller file.
    const scale = 2.0 - (level / 100) * 1.5;   // 2.0  → 0.5
    const quality = 0.92 - (level / 100) * 0.55;  // 0.92 → 0.37

    // Load with pdfjs-dist for rendering
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
    ).href;

    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdfDoc.numPages;

    // Create the output document with pdf-lib
    const outDoc = await PDFDocument.create();

    for (let i = 1; i <= totalPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale });

        // Render to an off-screen canvas
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Convert canvas to JPEG blob
        const blob = await new Promise(resolve =>
            canvas.toBlob(resolve, 'image/jpeg', quality)
        );
        const jpegBytes = new Uint8Array(await blob.arrayBuffer());

        // Embed the JPEG into the new PDF
        const jpegImage = await outDoc.embedJpg(jpegBytes);

        // Use the ORIGINAL page dimensions (not scaled) so the output
        // print-size matches the source.
        const origViewport = page.getViewport({ scale: 1 });
        const outPage = outDoc.addPage([origViewport.width, origViewport.height]);
        outPage.drawImage(jpegImage, {
            x: 0,
            y: 0,
            width: origViewport.width,
            height: origViewport.height,
        });
    }

    return outDoc.save({ useObjectStreams: true });
}
