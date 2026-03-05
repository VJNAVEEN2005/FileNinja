export const categories = [
    { id: 'all', label: 'All Tools' },
    { id: 'organize', label: 'Organize', color: '#4A7CFF' },
    { id: 'optimize', label: 'Optimize', color: '#22C997' },
    { id: 'edit', label: 'Edit', color: '#FF6B4A' },
    { id: 'convert-to', label: 'Convert to PDF', color: '#9B5CFF' },
    { id: 'convert-from', label: 'Convert from PDF', color: '#FF4A8D' },
    { id: 'security', label: 'Security', color: '#FFB020' },
    { id: 'ai', label: 'AI Tools', color: '#00BCD4' },
    { id: 'forms', label: 'Forms', color: '#7C6EF0' },
    { id: 'batch', label: 'Batch', color: '#5C6BC0' },
];


export const tools = [
    // ── Organize ──
    { id: 'merge-pdf', name: 'Merge PDF', desc: 'Combine multiple PDFs into one document', category: 'organize', icon: 'layers' },
    { id: 'split-pdf', name: 'Split PDF', desc: 'Separate a PDF into multiple files', category: 'organize', icon: 'scissors' },
    { id: 'remove-pages', name: 'Remove Pages', desc: 'Delete unwanted pages from your PDF', category: 'organize', icon: 'trash' },
    { id: 'extract-pages', name: 'Extract Pages', desc: 'Pull specific pages into a new PDF', category: 'organize', icon: 'file-output' },
    { id: 'organize-pages', name: 'Organize Pages', desc: 'Drag and drop to reorder PDF pages', category: 'organize', icon: 'grid' },
    { id: 'rotate-pdf', name: 'Rotate PDF', desc: 'Rotate pages to any orientation', category: 'organize', icon: 'rotate-cw' },

    // ── Optimize ──
    { id: 'compress-pdf', name: 'Compress PDF', desc: 'Reduce file size without losing quality', category: 'optimize', icon: 'minimize' },
    { id: 'repair-pdf', name: 'Repair PDF', desc: 'Fix corrupted or damaged PDF files', category: 'optimize', icon: 'wrench' },
    { id: 'ocr-pdf', name: 'OCR PDF', desc: 'Make scanned documents searchable', category: 'optimize', icon: 'scan' },
    { id: 'flatten-pdf', name: 'Flatten PDF', desc: 'Convert interactive elements to static', category: 'optimize', icon: 'square' },

    // ── Edit ──
    { id: 'add-text', name: 'Add Text', desc: 'Place text anywhere on your PDF pages', category: 'edit', icon: 'type' },
    { id: 'add-image', name: 'Add Image', desc: 'Insert images into your PDF document', category: 'edit', icon: 'image' },
    { id: 'draw-on-pdf', name: 'Draw on PDF', desc: 'Freehand drawing and annotations', category: 'edit', icon: 'pen-tool' },
    { id: 'highlight-pdf', name: 'Highlight PDF', desc: 'Highlight, underline, and strikethrough', category: 'edit', icon: 'highlighter' },
    { id: 'add-watermark', name: 'Add Watermark', desc: 'Add text or image watermarks', category: 'edit', icon: 'droplet' },
    { id: 'add-page-numbers', name: 'Page Numbers', desc: 'Add page numbers in any format', category: 'edit', icon: 'hash' },
    { id: 'add-header-footer', name: 'Header & Footer', desc: 'Add custom headers and footers', category: 'edit', icon: 'align-justify' },
    { id: 'crop-pdf', name: 'Crop PDF', desc: 'Trim PDF pages to exact dimensions', category: 'edit', icon: 'crop' },
    { id: 'redact-pdf', name: 'Redact PDF', desc: 'Permanently hide sensitive information', category: 'edit', icon: 'eye-off' },
    { id: 'edit-metadata', name: 'Edit Metadata', desc: 'Modify title, author, and properties', category: 'edit', icon: 'info' },

    // ── Convert to PDF ──
    { id: 'word-to-pdf', name: 'Word to PDF', desc: 'Convert Word documents to PDF format', category: 'convert-to', icon: 'file-text' },
    { id: 'excel-to-pdf', name: 'Excel to PDF', desc: 'Convert spreadsheets to PDF format', category: 'convert-to', icon: 'table' },
    { id: 'powerpoint-to-pdf', name: 'PPT to PDF', desc: 'Convert presentations to PDF format', category: 'convert-to', icon: 'presentation' },
    { id: 'image-to-pdf', name: 'Image to PDF', desc: 'Convert JPG, PNG images to PDF', category: 'convert-to', icon: 'image' },
    { id: 'html-to-pdf', name: 'HTML to PDF', desc: 'Convert web pages to PDF format', category: 'convert-to', icon: 'code' },
    { id: 'text-to-pdf', name: 'Text to PDF', desc: 'Convert plain text files to PDF', category: 'convert-to', icon: 'file-text' },
    { id: 'csv-to-pdf', name: 'CSV to PDF', desc: 'Convert CSV data to formatted PDF tables', category: 'convert-to', icon: 'table' },

    // ── Convert from PDF ──
    { id: 'pdf-to-word', name: 'PDF to Word', desc: 'Convert PDF to editable Word document', category: 'convert-from', icon: 'file-text' },
    { id: 'pdf-to-excel', name: 'PDF to Excel', desc: 'Extract tables from PDF to spreadsheet', category: 'convert-from', icon: 'table' },
    { id: 'pdf-to-ppt', name: 'PDF to PPT', desc: 'Convert PDF pages to presentation slides', category: 'convert-from', icon: 'presentation' },
    { id: 'pdf-to-jpg', name: 'PDF to JPG', desc: 'Convert PDF pages to JPG images', category: 'convert-from', icon: 'image' },
    { id: 'pdf-to-png', name: 'PDF to PNG', desc: 'Convert PDF pages to PNG with transparency', category: 'convert-from', icon: 'image' },
    { id: 'pdf-to-webp', name: 'PDF to WebP', desc: 'Convert PDF to WebP for web optimization', category: 'convert-from', icon: 'image' },
    { id: 'pdf-to-pdfa', name: 'PDF to PDF/A', desc: 'Convert to archive-compliant PDF/A format', category: 'convert-from', icon: 'archive' },

    // ── Security ──
    { id: 'protect-pdf', name: 'Protect PDF', desc: 'Add password encryption to your PDF', category: 'security', icon: 'lock' },
    { id: 'unlock-pdf', name: 'Unlock PDF', desc: 'Remove password protection from PDF', category: 'security', icon: 'unlock' },
    { id: 'esign-pdf', name: 'eSign PDF', desc: 'Draw or upload your signature', category: 'security', icon: 'pen' },
    { id: 'request-signatures', name: 'Request Signatures', desc: 'Send documents for multi-party signing', category: 'security', icon: 'users' },
    { id: 'compare-pdf', name: 'Compare PDF', desc: 'Find differences between two PDF versions', category: 'security', icon: 'columns' },
    { id: 'certify-pdf', name: 'Certify PDF', desc: 'Add digital certificates for authenticity', category: 'security', icon: 'shield' },

    // ── AI Tools ──
    { id: 'ai-summarize', name: 'AI Summarize', desc: 'Get an instant summary of any document', category: 'ai', icon: 'zap', upcoming: true },
    { id: 'ai-translate', name: 'AI Translate', desc: 'Translate documents preserving layout', category: 'ai', icon: 'globe', upcoming: true },
    { id: 'ai-chat', name: 'Chat with PDF', desc: 'Ask questions about your document', category: 'ai', icon: 'message-circle', upcoming: true },
    { id: 'ai-extract', name: 'AI Extract Data', desc: 'Extract structured data from documents', category: 'ai', icon: 'database', upcoming: true },
    { id: 'ai-fill-forms', name: 'AI Fill Forms', desc: 'Auto-detect and fill form fields', category: 'ai', icon: 'check-square', upcoming: true },

    // ── Forms ──
    { id: 'fill-form', name: 'Fill PDF Form', desc: 'Fill interactive PDF form fields', category: 'forms', icon: 'edit', upcoming: true },
    { id: 'create-form', name: 'Create PDF Form', desc: 'Build interactive forms from scratch', category: 'forms', icon: 'plus-square', upcoming: true },
    { id: 'flatten-form', name: 'Flatten Form', desc: 'Lock filled form fields permanently', category: 'forms', icon: 'check-circle', upcoming: true },

    // ── Batch ──
    { id: 'batch-convert', name: 'Batch Convert', desc: 'Convert multiple files at once', category: 'batch', icon: 'copy', upcoming: true },
    { id: 'batch-compress', name: 'Batch Compress', desc: 'Compress multiple PDFs simultaneously', category: 'batch', icon: 'package', upcoming: true },
    { id: 'batch-watermark', name: 'Batch Watermark', desc: 'Apply watermarks to multiple PDFs', category: 'batch', icon: 'droplets', upcoming: true },
    { id: 'batch-rotate', name: 'Batch Rotate', desc: 'Rotate pages in multiple PDFs', category: 'batch', icon: 'refresh-cw', upcoming: true },
    { id: 'batch-page-numbers', name: 'Batch Page Numbers', desc: 'Add page numbers to multiple PDFs', category: 'batch', icon: 'list', upcoming: true },
];

export function getToolsByCategory(categoryId) {
    if (categoryId === 'all') return tools;
    return tools.filter(t => t.category === categoryId);
}

export function getCategoryColor(categoryId) {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.color || 'var(--text-tertiary)';
}
