import Home from "./pages/home"; // Sesuaikan huruf 'h' kecil atau besar persis dengan nama file di folder pages
import AdminDashboard from "./admin/AdminDashboard";

export default function App() {
  // Cek apakah URL sedang mengakses halaman admin
  const isAdmin = window.location.pathname === "/admin";

  return (
    <div>
      {isAdmin ? <AdminDashboard /> : <Home />}
    </div>
  );
}