import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('pesanan');

  // State Pesanan dari Firebase
  const [pesananList, setPesananList] = useState([]);
  
  // State Portofolio dari Firebase
  const [portofolioList, setPortofolioList] = useState([]);

  // Ambil Data Real-time dari Firebase Firestore
  useEffect(() => {
    // Listener Pesanan
    const unsubPesanan = onSnapshot(collection(db, "pesanan"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ idDoc: doc.id, ...doc.data() }));
      setPesananList(data);
    }, (error) => {
      console.log("Menggunakan fallback localStorage untuk pesanan karena offline/error:", error);
      const saved = localStorage.getItem('tolongGuruPesanan');
      if (saved) setPesananList(JSON.parse(saved));
    });

    // Listener Portofolio
    const unsubPortofolio = onSnapshot(collection(db, "portofolio"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ idDoc: doc.id, ...doc.data() }));
      setPortofolioList(data);
    }, (error) => {
      console.log("Menggunakan fallback localStorage untuk portofolio:", error);
      const saved = localStorage.getItem('tolongGuruPortofolio');
      if (saved) setPortofolioList(JSON.parse(saved));
    });

    return () => {
      unsubPesanan();
      unsubPortofolio();
    };
  }, []);

  // State Filter & Pencarian Pesanan
  const [cariKeyword, setCariKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua Status');
  const [filterBayar, setFilterBayar] = useState('Semua Pembayaran');

  // State Form Portofolio Baru (Terpisah antara Thumbnail & Link Drive)
  const [judulBaru, setJudulBaru] = useState('');
  const [kategoriBaru, setKategoriBaru] = useState('Infografis dan Poster');
  const [tipeMedia, setTipeMedia] = useState('image');
  const [urlThumbnail, setUrlThumbnail] = useState('');
  const [linkDriveBaru, setLinkDriveBaru] = useState('');

  // Fungsi Tambah Portofolio ke Firebase
  const tambahPortofolio = async (e) => {
    e.preventDefault();
    if (!judulBaru || !urlThumbnail) {
      alert("Mohon isi Judul dan URL Gambar Thumbnail.");
      return;
    }

    try {
      const itemBaru = {
        id: Date.now(),
        judul: judulBaru,
        kategori: kategoriBaru,
        type: tipeMedia,
        url: urlThumbnail,
        linkDrive: linkDriveBaru || urlThumbnail
      };

      await addDoc(collection(db, "portofolio"), itemBaru);
      setJudulBaru('');
      setUrlThumbnail('');
      setLinkDriveBaru('');
      alert("Portofolio berhasil ditambahkan secara online!");
    } catch (err) {
      console.error("Gagal menambah portofolio:", err);
      alert("Gagal menyimpan ke database online. Pastikan koneksi internet aktif.");
    }
  };

  // Fungsi Hapus Portofolio
  const hapusPortofolio = async (idDoc, idAlt) => {
    if (confirm("Yakin ingin menghapus portofolio ini?")) {
      try {
        if (idDoc) {
          await deleteDoc(doc(db, "portofolio", idDoc));
        }
        setPortofolioList(portofolioList.filter(item => item.idDoc !== idDoc && item.id !== idAlt));
      } catch (err) {
        console.error("Gagal menghapus:", err);
      }
    }
  };

  // Fungsi Ubah Status Pesanan
  const updateStatusPesanan = async (idDoc, statusBaru) => {
    try {
      if (idDoc) {
        await updateDoc(doc(db, "pesanan", idDoc), { status: statusBaru });
      }
      setPesananList(pesananList.map(item => item.idDoc === idDoc ? { ...item, status: statusBaru } : item));
    } catch (err) {
      console.error("Gagal update status:", err);
    }
  };

  // Fungsi Ubah Status Bayar
  const updateBayarPesanan = async (idDoc, bayarBaru) => {
    try {
      if (idDoc) {
        await updateDoc(doc(db, "pesanan", idDoc), { bayar: bayarBaru });
      }
      setPesananList(pesananList.map(item => item.idDoc === idDoc ? { ...item, bayar: bayarBaru } : item));
    } catch (err) {
      console.error("Gagal update bayar:", err);
    }
  };

  // Fungsi Hapus Pesanan
  const hapusPesanan = async (idDoc) => {
    if (confirm("Yakin ingin menghapus data pesanan ini?")) {
      try {
        if (idDoc) {
          await deleteDoc(doc(db, "pesanan", idDoc));
        }
        setPesananList(pesananList.filter(item => item.idDoc !== idDoc));
      } catch (err) {
        console.error("Gagal menghapus pesanan:", err);
      }
    }
  };

  // Filter Data Pesanan
  const pesananFiltered = pesananList.filter(item => {
    const namaItem = item.nama || '';
    const sekolahItem = item.sekolah || '';
    const idItem = item.id || '';
    const matchKeyword = namaItem.toLowerCase().includes(cariKeyword.toLowerCase()) || 
                         sekolahItem.toLowerCase().includes(cariKeyword.toLowerCase()) || 
                         idItem.toLowerCase().includes(cariKeyword.toLowerCase());
    const matchStatus = filterStatus === 'Semua Status' || item.status === filterStatus;
    const matchBayar = filterBayar === 'Semua Pembayaran' || item.bayar === filterBayar;
    return matchKeyword && matchStatus && matchBayar;
  });

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      
      {/* HEADER ADMIN */}
      <header className="bg-[#961214] text-white py-4 px-6 shadow-md flex justify-between items-center">
        <div>
          <h1 className="font-extrabold text-xl tracking-tight">Admin Dashboard Tolong Guru</h1>
          <p className="text-xs text-red-200">Kelola pesanan masuk dan portofolio publik secara sinkron</p>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-lg transition border border-white/20">
            ← Kembali ke Website Utama
          </a>
        </div>
      </header>

      {/* KONTROL TAB */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex gap-3 border-b border-slate-200 pb-3">
          <button 
            onClick={() => setActiveTab('pesanan')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'pesanan' ? 'bg-[#961214] text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
          >
            📋 Kelola Pesanan ({pesananList.length})
          </button>
          <button 
            onClick={() => setActiveTab('portofolio')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'portofolio' ? 'bg-[#961214] text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
          >
            🖼️ Kelola Portofolio ({portofolioList.length})
          </button>
        </div>
      </div>

      {/* KONTEN UTAMA */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        
        {/* TAB PESANAN */}
        {activeTab === 'pesanan' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            
            {/* Filter & Pencarian Lengkap */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <input 
                type="text" 
                placeholder="Cari nama, sekolah, atau ID pesanan..." 
                value={cariKeyword} 
                onChange={(e) => setCariKeyword(e.target.value)}
                className="w-full md:w-1/3 border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 outline-none"
              />
              <div className="flex gap-3 w-full md:w-auto">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none">
                  <option>Semua Status</option>
                  <option>Baru</option>
                  <option>Proses</option>
                  <option>Selesai</option>
                </select>
                <select value={filterBayar} onChange={(e) => setFilterBayar(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none">
                  <option>Semua Pembayaran</option>
                  <option>Lunas</option>
                  <option>Belum bayar</option>
                </select>
              </div>
            </div>

            {/* Tabel Pesanan */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <th className="p-3">ID & Tanggal</th>
                    <th className="p-3">Pemesan & Sekolah</th>
                    <th className="p-3">Detail Layanan</th>
                    <th className="p-3">Total & Bayar</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pesananFiltered.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400">Belum ada data pesanan yang masuk.</td>
                    </tr>
                  ) : (
                    pesananFiltered.map((item) => (
                      <tr key={item.idDoc || item.id} className="hover:bg-slate-50/80">
                        <td className="p-3 align-top">
                          <span className="font-bold text-[#961214]">{item.id}</span>
                          <div className="text-xs text-slate-400">{item.tanggalMasuk}</div>
                        </td>
                        <td className="p-3 align-top">
                          <div className="font-bold">{item.nama}</div>
                          <div className="text-xs text-slate-500">{item.sekolah}</div>
                          <div className="text-xs text-slate-400 mt-1 italic">Topik: {item.topik}</div>
                        </td>
                        <td className="p-3 align-top">
                          <div className="font-semibold">{item.layanan}</div>
                          <div className="text-xs text-slate-500">Paket: {item.paket}</div>
                        </td>
                        <td className="p-3 align-top">
                          <div className="font-bold">Rp{item.total?.toLocaleString('id-ID')}</div>
                          <select 
                            value={item.bayar} 
                            onChange={(e) => updateBayarPesanan(item.idDoc, e.target.value)}
                            className={`text-xs mt-1 font-bold px-2 py-1 rounded-md border outline-none ${item.bayar === 'Lunas' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                          >
                            <option value="Lunas">Lunas</option>
                            <option value="Belum bayar">Belum bayar</option>
                          </select>
                        </td>
                        <td className="p-3 align-top">
                          <select 
                            value={item.status} 
                            onChange={(e) => updateStatusPesanan(item.idDoc, e.target.value)}
                            className="text-xs font-bold px-2 py-1 rounded-md border border-slate-200 bg-slate-50 outline-none"
                          >
                            <option value="Baru">Baru</option>
                            <option value="Proses">Proses</option>
                            <option value="Selesai">Selesai</option>
                          </select>
                        </td>
                        <td className="p-3 align-top text-center">
                          <button onClick={() => hapusPesanan(item.idDoc)} className="text-xs text-red-600 hover:text-red-800 font-bold bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition">
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB PORTOFOLIO */}
        {activeTab === 'portofolio' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Form Tambah Portofolio */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
              <h3 className="font-extrabold text-lg mb-4 text-slate-800">Tambah Portofolio Baru</h3>
              <form onSubmit={tambahPortofolio} className="space-y-4 text-sm">
                <div>
                  <label className="block font-medium mb-1">Judul Karya</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Infografis Pembelajaran IPA" 
                    value={judulBaru} 
                    onChange={(e) => setJudulBaru(e.target.value)} 
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Kategori</label>
                  <select 
                    value={kategoriBaru} 
                    onChange={(e) => setKategoriBaru(e.target.value)} 
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none"
                  >
                    <option value="Infografis dan Poster">Infografis dan Poster</option>
                    <option value="Video Pembelajaran">Video Pembelajaran</option>
                    <option value="PPT">PPT</option>
                    <option value="Website">Website</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Tipe Media</label>
                  <select 
                    value={tipeMedia} 
                    onChange={(e) => setTipeMedia(e.target.value)} 
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none"
                  >
                    <option value="image">Gambar / Poster (Thumbnail)</option>
                    <option value="embed">Video / Embed YouTube</option>
                  </select>
                </div>

                {/* Input Thumbnail Khusus Gambar */}
                <div>
                  <label className="block font-medium mb-1">URL Gambar Thumbnail (Untuk Tampilan Web)</label>
                  <input 
                    type="text" 
                    placeholder="https://images.unsplash.com/... atau link gambar jpg/png" 
                    value={urlThumbnail} 
                    onChange={(e) => setUrlThumbnail(e.target.value)} 
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Masukkan link gambar langsung (berakhiran .jpg/.png) agar tampil rapi di web utama.</p>
                </div>

                {/* Input Link Google Drive Asli */}
                <div>
                  <label className="block font-medium mb-1">Link Google Drive / File Asli</label>
                  <input 
                    type="text" 
                    placeholder="https://drive.google.com/file/d/..." 
                    value={linkDriveBaru} 
                    onChange={(e) => setLinkDriveBaru(e.target.value)} 
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Link tujuan saat tombol "Buka File Asli" diklik pengunjung.</p>
                </div>

                <button type="submit" className="w-full bg-[#961214] text-white font-bold py-3 rounded-xl hover:bg-[#7a0e10] transition shadow">
                  Simpan Portofolio Online
                </button>
              </form>
            </div>

            {/* Daftar Portofolio */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-extrabold text-lg mb-4 text-slate-800">Daftar Portofolio Publik ({portofolioList.length})</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {portofolioList.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-slate-400">Belum ada portofolio yang ditambahkan.</div>
                ) : (
                  portofolioList.map((item) => (
                    <div key={item.idDoc || item.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex flex-col justify-between">
                      <div className="h-44 bg-slate-900 relative flex items-center justify-center p-2">
                        {item.type === 'image' ? (
                          <img src={item.url} alt={item.judul} className="w-full h-full object-contain rounded-lg" />
                        ) : (
                          <iframe src={item.url} title={item.judul} className="w-full h-full"></iframe>
                        )}
                      </div>
                      <div className="p-4 flex flex-col justify-between flex-1 bg-white">
                        <div>
                          <span className="text-[10px] font-bold text-[#961214] bg-red-50 px-2 py-0.5 rounded uppercase">{item.kategori}</span>
                          <h4 className="font-bold text-base mt-2 leading-snug">{item.judul}</h4>
                          <p className="text-xs text-slate-400 mt-1 truncate">Drive: {item.linkDrive || item.url}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-xs text-slate-500">ID: {item.idDoc || item.id}</span>
                          <button onClick={() => hapusPortofolio(item.idDoc, item.id)} className="text-xs text-red-600 font-bold hover:text-red-800 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition">
                            Hapus Karya
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </main>

    </div>
  );
}