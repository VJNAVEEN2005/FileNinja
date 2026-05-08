import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Search from './components/Search';
import HomePage from './pages/HomePage';
import IntroAnimation from './components/IntroAnimation';
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

// Conversion FROM PDF Tools
import PdfToWord from './pages/tools/PdfToWord';
import PdfToExcel from './pages/tools/PdfToExcel';
import PdfToPpt from './pages/tools/PdfToPpt';
import PdfToJpg from './pages/tools/PdfToJpg';
import PdfToPng from './pages/tools/PdfToPng';
import PdfToWebp from './pages/tools/PdfToWebp';
import PdfToPdfA from './pages/tools/PdfToPdfA';

// Security Tools
import ProtectPDF from './pages/tools/ProtectPDF';
import UnlockPDF from './pages/tools/UnlockPDF';
import ESignPDF from './pages/tools/ESignPDF';
import RequestSignatures from './pages/tools/RequestSignatures';
import ComparePDF from './pages/tools/ComparePDF';
import CertifyPDF from './pages/tools/CertifyPDF';

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
      <IntroAnimation />
      <ScrollToTop />
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        {/* Management Tools */}
        <Route path="/merge-pdf" element={<MergePDF />} />
        <Route path="/split-pdf" element={<SplitPDF />} />
        <Route path="/remove-pages" element={<RemovePages />} />
        <Route path="/extract-pages" element={<ExtractPages />} />
        <Route path="/organize-pages" element={<OrganizePages />} />
        <Route path="/rotate-pdf" element={<RotatePDF />} />
        <Route path="/compress-pdf" element={<CompressPDF />} />
        
        {/* Optimization & Recovery */}
        <Route path="/flatten-pdf" element={<FlattenPDF />} />
        <Route path="/repair-pdf" element={<RepairPDF />} />
        <Route path="/ocr-pdf" element={<OcrPDF />} />
        
        {/* Edit Tools */}
        <Route path="/add-text" element={<AddText />} />
        <Route path="/add-image" element={<AddImage />} />
        <Route path="/draw-on-pdf" element={<DrawOnPDF />} />
        <Route path="/highlight-pdf" element={<HighlightPDF />} />
        <Route path="/add-watermark" element={<AddWatermark />} />
        <Route path="/add-page-numbers" element={<AddPageNumbers />} />
        <Route path="/add-header-footer" element={<AddHeaderFooter />} />
        <Route path="/crop-pdf" element={<CropPDF />} />
        <Route path="/redact-pdf" element={<RedactPDF />} />
        <Route path="/edit-metadata" element={<EditMetadata />} />

        {/* Conversion Tools */}
        <Route path="/word-to-pdf" element={<WordToPDF />} />
        <Route path="/excel-to-pdf" element={<ExcelToPDF />} />
        <Route path="/ppt-to-pdf" element={<PptToPDF />} />
        <Route path="/image-to-pdf" element={<ImageToPDF />} />
        <Route path="/html-to-pdf" element={<HtmlToPDF />} />
        <Route path="/text-to-pdf" element={<TextToPDF />} />
        <Route path="/csv-to-pdf" element={<CsvToPDF />} />

        {/* Conversion FROM PDF Tools */}
        <Route path="/pdf-to-word" element={<PdfToWord />} />
        <Route path="/pdf-to-excel" element={<PdfToExcel />} />
        <Route path="/pdf-to-ppt" element={<PdfToPpt />} />
        <Route path="/pdf-to-jpg" element={<PdfToJpg />} />
        <Route path="/pdf-to-png" element={<PdfToPng />} />
        <Route path="/pdf-to-webp" element={<PdfToWebp />} />
        <Route path="/pdf-to-pdfa" element={<PdfToPdfA />} />

        {/* Security Tools */}
        <Route path="/protect-pdf" element={<ProtectPDF />} />
        <Route path="/unlock-pdf" element={<UnlockPDF />} />
        <Route path="/esign-pdf" element={<ESignPDF />} />
        <Route path="/request-signatures" element={<RequestSignatures />} />
        <Route path="/compare-pdf" element={<ComparePDF />} />
        <Route path="/certify-pdf" element={<CertifyPDF />} />
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
