import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Search from './components/Search';
import HomePage from './pages/HomePage';
import MergePDF from './pages/tools/MergePDF';
import SplitPDF from './pages/tools/SplitPDF';
import RemovePages from './pages/tools/RemovePages';
import ExtractPages from './pages/tools/ExtractPages';
import OrganizePages from './pages/tools/OrganizePages';
import RotatePDF from './pages/tools/RotatePDF';
import CompressPDF from './pages/tools/CompressPDF';
import FlattenPDF from './pages/tools/FlattenPDF';
import RepairPDF from './pages/tools/RepairPDF';
import OcrPDF from './pages/tools/OcrPDF';
import AddText from './pages/tools/AddText';
import AddImage from './pages/tools/AddImage';
import DrawOnPDF from './pages/tools/DrawOnPDF';
import HighlightPDF from './pages/tools/HighlightPDF';
import AddWatermark from './pages/tools/AddWatermark';
import AddPageNumbers from './pages/tools/AddPageNumbers';
import AddHeaderFooter from './pages/tools/AddHeaderFooter';
import CropPDF from './pages/tools/CropPDF';
import RedactPDF from './pages/tools/RedactPDF';
import EditMetadata from './pages/tools/EditMetadata';

// Conversion Tools
import WordToPDF from './pages/tools/WordToPDF';
import ExcelToPDF from './pages/tools/ExcelToPDF';
import PptToPDF from './pages/tools/PptToPDF';
import ImageToPDF from './pages/tools/ImageToPDF';
import HtmlToPDF from './pages/tools/HtmlToPDF';
import TextToPDF from './pages/tools/TextToPDF';
import CsvToPDF from './pages/tools/CsvToPDF';

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global shortcut (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <ScrollToTop />
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        {/* Management Tools */}
        <Route path="/tools/merge-pdf" element={<MergePDF />} />
        <Route path="/tools/split-pdf" element={<SplitPDF />} />
        <Route path="/tools/remove-pages" element={<RemovePages />} />
        <Route path="/tools/extract-pages" element={<ExtractPages />} />
        <Route path="/tools/organize-pages" element={<OrganizePages />} />
        <Route path="/tools/rotate-pdf" element={<RotatePDF />} />
        <Route path="/tools/compress-pdf" element={<CompressPDF />} />
        
        {/* Optimization & Recovery */}
        <Route path="/tools/flatten-pdf" element={<FlattenPDF />} />
        <Route path="/tools/repair-pdf" element={<RepairPDF />} />
        <Route path="/tools/ocr-pdf" element={<OcrPDF />} />
        
        {/* Edit Tools */}
        <Route path="/tools/add-text" element={<AddText />} />
        <Route path="/tools/add-image" element={<AddImage />} />
        <Route path="/tools/draw-on-pdf" element={<DrawOnPDF />} />
        <Route path="/tools/highlight-pdf" element={<HighlightPDF />} />
        <Route path="/tools/add-watermark" element={<AddWatermark />} />
        <Route path="/tools/add-page-numbers" element={<AddPageNumbers />} />
        <Route path="/tools/add-header-footer" element={<AddHeaderFooter />} />
        <Route path="/tools/crop-pdf" element={<CropPDF />} />
        <Route path="/tools/redact-pdf" element={<RedactPDF />} />
        <Route path="/tools/edit-metadata" element={<EditMetadata />} />

        {/* Conversion Tools */}
        <Route path="/tools/word-to-pdf" element={<WordToPDF />} />
        <Route path="/tools/excel-to-pdf" element={<ExcelToPDF />} />
        <Route path="/tools/ppt-to-pdf" element={<PptToPDF />} />
        <Route path="/tools/image-to-pdf" element={<ImageToPDF />} />
        <Route path="/tools/html-to-pdf" element={<HtmlToPDF />} />
        <Route path="/tools/text-to-pdf" element={<TextToPDF />} />
        <Route path="/tools/csv-to-pdf" element={<CsvToPDF />} />
      </Routes>

      {/* Global Search Modal */}
      <Search isGlobal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Floating Search Button */}
      <button 
        className="search-floating-btn" 
        onClick={() => setIsSearchOpen(true)}
        aria-label="Search tools"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
    </>
  );
}

export default App;
