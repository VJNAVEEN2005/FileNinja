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
