import { Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import MergePDF from './pages/tools/MergePDF';
import SplitPDF from './pages/tools/SplitPDF';
import RemovePages from './pages/tools/RemovePages';
import ExtractPages from './pages/tools/ExtractPages';
import OrganizePages from './pages/tools/OrganizePages';
import RotatePDF from './pages/tools/RotatePDF';

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/merge-pdf" element={<MergePDF />} />
        <Route path="/split-pdf" element={<SplitPDF />} />
        <Route path="/remove-pages" element={<RemovePages />} />
        <Route path="/extract-pages" element={<ExtractPages />} />
        <Route path="/organize-pages" element={<OrganizePages />} />
        <Route path="/rotate-pdf" element={<RotatePDF />} />
      </Routes>
    </>
  );
}

export default App;
