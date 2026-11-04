import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('pesanan');

  // State Pesanan & Portofolio dari Firebase
  const [pesananList, setPesananList] = useState([]);
  const [portofolioList, setPortofolioList] = useState([]);

  // Ambil Data Real-time dari Firebase Firestore
  useEffect(() => {
    const unsubPesanan = onSnapshot(collection(db, "pesanan"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ idDoc: doc.id, ...doc.data() }));
      setPesananList(data);
    }, (error) => {
      console.log("Fallback localStorage pesanan:", error);
      const saved = localStorage.getItem('tolongGuruPesanan');
      if (saved) setPesananList(JSON.parse(saved));
    });

    const unsubPortofolio = onSnapshot(collection(db, "portofolio"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ idDoc: doc.id, ...doc.data() }));
      setPortofolioList(data);
    }, (error) => {
      console.log("Fallback localStorage portofolio:", error);
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

  // State Form Input Pesanan Manual oleh Admin
  const [inputNama, setInputNama] = useState('');
  const [inputSekolah, setInputSekolah] = useState('');
  const [inputLayanan, setInputLayanan] = useState('PPT');
  const [inputTotal, setInputTotal] = useState(25000);
  const [inputTopik, setInputTopik] = useState('');
  const [inputDeadline, setInputDeadline] = useState('');

  // State Form Portofolio Baru (Cukup 1 input Google Drive)
  const [judulBaru, setJudulBaru] = useState('');
  const [kategoriBaru, setKategoriBaru] = useState('Infografis dan Poster');
  const [tipeMedia, setTipeMedia] = useState('image');
  const [linkDriveBaru, setLinkDriveBaru] = useState('');

  // Fungsi Tambah Pesanan Manual
  const tambahPesananManual = async (e) => {
    e.preventDefault();
    if (!inputNama || !inputSekolah) {
      alert("Mohon isi Nama Pemesan dan Sekolah.");
      return;
    }

    const pesananBaru = {
      id: `TG-${Date.now().toString().slice(-6)}`,
      nama: inputNama,
      sekolah: inputSekolah,
      layanan: inputLayanan,
      paket: 'Standar',
      total: Number(inputTotal),
      bayar: Number(inputTotal) <= 100000 ? 'Lunas' : 'Belum bayar',
      status: 'Baru',
      tanggalMasuk: new Date().toISOString().split('T')[0],
      deadline: inputDeadline || '-',
      topik: inputTopik || '-',
      sumber: 'Manual Admin'
    };

    try {
      await addDoc(collection(db, "pesanan"), pesananBaru);
      alert("Pesanan manual berhasil ditambahkan!");
      setInputNama('');
      setInputSekolah('');
      setInputTopik('');
      setInputDeadline('');
      setActiveTab('pesanan');
    } catch (err) {
      console.error("Gagal tambah pesanan:", err);
    }
  };

  // Fungsi Tambah Portofolio ke Firebase (Cukup 1 link untuk thumbnail & drive)
  const tambahPortofolio = async (e) => {
    e.preventDefault();
    if (!judulBaru || !linkDriveBaru) {
      alert("Mohon isi Judul dan Link Google Drive.");
      return;
    }

    try {
      const itemBaru = {
        id: Date.now(),
        judul: judulBaru,
        kategori: kategoriBaru,
        type: tipeMedia,
        url: linkDriveBaru,       // Otomatis diproses jadi thumbnail di Home.jsx
        linkDrive: linkDriveBaru  // Tujuan saat tombol Buka File Asli diklik
      };

      await addDoc(collection(db, "portofolio"), itemBaru);
      setJudulBaru('');
      setLinkDriveBaru('');
      alert("Portofolio berhasil ditambahkan!");
    } catch (err) {
      console.error("Gagal menambah portofolio:", err);
    }
  };

  // Fungsi Hapus Portofolio
  const hapusPortofolio = async (idDoc) => {
    if (confirm("Yakin ingin menghapus portofolio ini?")) {
      try {
        await deleteDoc(doc(db, "portofolio", idDoc));
      } catch (err) {
        console.error("Gagal menghapus:", err);
      }
    }
  };

  // Fungsi Update Status & Pembayaran
  const updateStatusPesanan = async (idDoc, statusBaru) => {
    await updateDoc(doc(db, "pesanan", idDoc), { status: statusBaru });
  };

  const updateBayarPesanan = async (idDoc, bayarBaru) => {
    await updateDoc(doc(db, "pesanan", idDoc), { bayar: bayarBaru });
  };

  const hapusPesanan = async (idDoc) => {
    if (confirm("Yakin ingin menghapus pesanan ini?")) {
      await deleteDoc(doc(db, "pesanan", idDoc));
    }
  };

  // Filter Data Pesanan
  const pesananFiltered = pesananList.filter(item => {
    const matchKeyword = (item.nama || '').toLowerCase().includes(cariKeyword.toLowerCase()) || 
                         (item.sekolah || '').toLowerCase().includes(cariKeyword.toLowerCase()) || 
                         (item.id || '').toLowerCase().includes(cariKeyword.toLowerCase());
    const matchStatus = filterStatus === 'Semua Status' || item.status === filterStatus;
    const matchBayar = filterBayar === 'Semua Pembayaran' || item.bayar === filterBayar;
    return matchKeyword && matchStatus && matchBayar;
  });

  // Hitung Rekap
  const totalPendapatan = pesananList.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
  const totalPesananSelesai = pesananList.filter(item => item.status === 'Selesai').length;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      
      {/* HEADER ADMIN */}
      <header className="bg-[#961214] text-white py-4 px-6 shadow-md flex justify-between items-center">
        <div>
          <h1 className="font-extrabold text-xl tracking-tight">Admin Dashboard Tolong Guru</h1>
          <p className="text-xs text-red-200">Kelola pesanan, input manual, rekap, dan portofolio</p>
        </div>
        <a href="/" className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-lg transition border border-white/20">
          ← Kembali ke Website Utama
        </a>
      </header>

      {/* KONTROL TAB LENGKAP */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-3">
          <button 
            onClick={() => setActiveTab('pesanan')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'pesanan' ? 'bg-[#961214] text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
          >
            📋 Daftar Pesanan ({pesananList.length})
          </button>
          <button 
            onClick={() => setActiveTab('input')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'input' ? 'bg-[#961214] text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
          >
            ➕ Input Pesanan Manual
          </button>
          <button 
            onClick={() => setActiveTab('rekap')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'rekap' ? 'bg-[#961214] text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
          >
            📊 Rekap & Statistik
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
        
        {/* TAB 1: DAFTAR PESANAN */}
        {activeTab === 'pesanan' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
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
                      <tr key={item.idDoc} className="hover:bg-slate-50/80">
                        <td className="p-3 align-top">
                          <span className="font-bold text-[#961214]">{item.id}</span>
                          <div className="text-xs text-slate-400">{item.tanggalMasuk}</div>
                          <div className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded w-fit mt-1">{item.sumber || 'Website'}</div>
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

        {/* TAB 2: INPUT PESANAN MANUAL */}
        {activeTab === 'input' && (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-extrabold text-xl mb-6 text-slate-800">Form Input Pesanan Manual</h3>
            <form onSubmit={tambahPesananManual} className="space-y-4 text-sm">
              <div>
                <label className="block font-medium mb-1">Nama Pemesan</label>
                <input type="text" value={inputNama} onChange={(e) => setInputNama(e.target.value)} placeholder="Contoh: Siti Rahma, S.Pd." className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none" required />
              </div>
              <div>
                <label className="block font-medium mb-1">Asal Sekolah</label>
                <input type="text" value={inputSekolah} onChange={(e) => setInputSekolah(e.target.value)} placeholder="Contoh: SMPN 2 Bandung" className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Layanan</label>
                  <select value={inputLayanan} onChange={(e) => setInputLayanan(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none">
                    <option value="PPT">PPT</option>
                    <option value="Infografis dan Poster">Infografis dan Poster</option>
                    <option value="Video Pembelajaran">Video Pembelajaran</option>
                    <option value="Take Konten ke Sekolah + Edit">Take Konten + Edit</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Total Harga (Rp)</label>
                  <input type="number" value={inputTotal} onChange={(e) => setInputTotal(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none" required />
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Topik / Catatan</label>
                <textarea value={inputTopik} onChange={(e) => setInputTopik(e.target.value)} placeholder="Catatan pesanan..." className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none h-24 resize-none"></textarea>
              </div>
              <div>
                <label className="block font-medium mb-1">Deadline / Tenggat Waktu</label>
                <input type="date" value={inputDeadline} onChange={(e) => setInputDeadline(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none" />
              </div>
              <button type="submit" className="w-full bg-[#961214] text-white font-bold py-3.5 rounded-xl hover:bg-[#7a0e10] transition shadow mt-4">
                Simpan Pesanan Manual
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: REKAP & STATISTIK */}
        {activeTab === 'rekap' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">Total Pesanan Masuk</p>
                <p className="text-4xl font-extrabold text-black mt-2">{pesananList.length}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">Pesanan Selesai</p>
                <p className="text-4xl font-extrabold text-green-600 mt-2">{totalPesananSelesai}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">Estimasi Pendapatan</p>
                <p className="text-3xl font-extrabold text-[#961214] mt-2">Rp{totalPendapatan.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: KELOLA PORTOFOLIO (Cukup 1 input Google Drive) */}
        {activeTab === 'portofolio' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
              <h3 className="font-extrabold text-lg mb-4 text-slate-800">Tambah Portofolio Baru</h3>
              <form onSubmit={tambahPortofolio} className="space-y-4 text-sm">
                <div>
                  <label className="block font-medium mb-1">Judul Karya</label>
                  <input type="text" placeholder="Contoh: Infografis IPA" value={judulBaru} onChange={(e) => setJudulBaru(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none" required />
                </div>
                <div>
                  <label className="block font-medium mb-1">Kategori</label>
                  <select value={kategoriBaru} onChange={(e) => setKategoriBaru(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none">
                    <option value="Infografis dan Poster">Infografis dan Poster</option>
                    <option value="Video Pembelajaran">Video Pembelajaran</option>
                    <option value="PPT">PPT</option>
                    <option value="Website">Website</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Link Google Drive File</label>
                  <input type="text" placeholder="https://drive.google.com/file/d/.../view" value={linkDriveBaru} onChange={(e) => setLinkDriveBaru(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none" required />
                  <p className="text-[11px] text-slate-400 mt-1">Cukup paste 1 link Google Drive, thumbnail & tombol akan otomatis aktif.</p>
                </div>
                <button type="submit" className="w-full bg-[#961214] text-white font-bold py-3 rounded-xl hover:bg-[#7a0e10] transition shadow">
                  Simpan Portofolio
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-extrabold text-lg mb-4 text-slate-800">Daftar Portofolio Publik ({portofolioList.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {portofolioList.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-slate-400">Belum ada portofolio.</div>
                ) : (
                  portofolioList.map((item) => (
                    <div key={item.idDoc} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex flex-col justify-between">
                      <div className="h-44 bg-slate-900 relative flex items-center justify-center p-2">
                        <img src={item.url} alt={item.judul} className="w-full h-full object-contain rounded-lg" />
                      </div>
                      <div className="p-4 flex flex-col justify-between flex-1 bg-white">
                        <div>
                          <span className="text-[10px] font-bold text-[#961214] bg-red-50 px-2 py-0.5 rounded uppercase">{item.kategori}</span>
                          <h4 className="font-bold text-base mt-2 leading-snug">{item.judul}</h4>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-xs text-slate-400">ID: {item.idDoc.slice(0, 6)}</span>
                          <button onClick={() => hapusPortofolio(item.idDoc)} className="text-xs text-red-600 font-bold hover:text-red-800 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition">
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