import { useState, useRef, useCallback } from 'react';
import { formatFileSize } from '../../utils/pdfUtils';
import './FileDropZone.css';

/**
 * FileDropZone — drag-and-drop / click-to-browse upload area
 *
 * Props:
 *   onFiles(files: File[])  — called when user selects/drops files
 *   multiple                — allow multiple files (default: false)
 *   accept                  — MIME type filter (default: 'application/pdf')
 *   label                   — custom label text
 */
export default function FileDropZone({
  onFiles,
  multiple = false,
  accept = 'application/pdf',
  label = 'Drop your PDF here',
  sublabel = 'or click to browse',
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const items = Array.from(e.dataTransfer.files).filter(f =>
        accept === 'application/pdf' ? f.type === 'application/pdf' : true
      );
      if (items.length) onFiles(multiple ? items : [items[0]]);
    },
    [onFiles, multiple, accept]
  );

  const handleChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) onFiles(multiple ? files : [files[0]]);
    e.target.value = '';
  };

  return (
    <div
      className={`dropzone ${dragging ? 'dropzone--dragging' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      aria-label="Upload PDF file"
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      <div className="dropzone__icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <polyline points="9 15 12 12 15 15"/>
        </svg>
      </div>

      <p className="dropzone__label">{label}</p>
      <p className="dropzone__sublabel">{sublabel}</p>
      <span className="dropzone__btn">Browse files</span>
    </div>
  );
}

/**
 * FileItem — shows an uploaded file with name, size, and remove button
 */
export function FileItem({ file, index, onRemove, dragHandleProps }) {
  return (
    <div className="file-item" {...dragHandleProps}>
      <div className="file-item__drag">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </div>
      <div className="file-item__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <div className="file-item__info">
        <span className="file-item__name">{file.name}</span>
        <span className="file-item__size">{formatFileSize(file.size)}</span>
      </div>
      <button
        className="file-item__remove"
        onClick={(e) => { e.stopPropagation(); onRemove(index); }}
        aria-label="Remove file"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}
