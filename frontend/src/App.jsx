import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import AboutPage from './pages/AboutPage'
import AnalysisPage from './pages/AnalysisPage'
import ComparePage from './pages/ComparePage'
import GoalsPage from './pages/GoalsPage'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import RecommendationsPage from './pages/RecommendationsPage'
import ScannerPage from './pages/ScannerPage'

export default function App() {
  return <Layout><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/goals" element={<GoalsPage />} />
    <Route path="/scanner" element={<ScannerPage />} />
    <Route path="/analysis" element={<AnalysisPage />} />
    <Route path="/recommendations" element={<RecommendationsPage />} />
    <Route path="/products" element={<ProductsPage />} />
    <Route path="/compare" element={<ComparePage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Layout>
}
