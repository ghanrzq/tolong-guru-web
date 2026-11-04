import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import AdminDashboard from './admin/AdminDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman utama publik */}
        <Route path="/" element={<Home />} />
        
        {/* Halaman khusus admin */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}