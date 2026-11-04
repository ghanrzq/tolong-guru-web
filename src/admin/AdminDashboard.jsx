import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [tabAktif, setTabAktif] = useState('pesanan');

  // State Pesanan
  const [pesananList, setPesananList] = useState(() => {
    const saved = localStorage.getItem('tolongGuruPesanan');
    return saved ? JSON.parse(saved) : [];
  });

  // State Portofolio (Sinkron ke Web Utama)
  const [portofolioList, setPortofolioList] = useState(() => {
    const saved = localStorage.getItem('tolongGuruPortofolio');
    return saved ? JSON.parse(saved) : [
      { id: 1, judul: 'Poster Kelas Setara: Dari Gagasan Menjadi Gerakan', kategori: 'Infografis dan Poster', type: 'image', url: 'https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?auto=format&fit=crop&w=600&q=80' }
    ];
  });
  useEffect(() => {
    localStorage.setItem('tolongGuruPesanan', JSON.stringify(pesananList));
  }, [pesananList]);

  // Filter State
  const [cariKeyword, setCariKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua status');
  const [filterPic, setFilterPic] = useState('Semua PIC');
  const [filterBayar, setFilterBayar] = useState('Semua pembayaran');

  // Input Pesanan Form State
  const [rawWhatsAppText, setRawWhatsAppText] = useState('');
  const [formInput, setFormInput] = useState({
    nama: '', sekolah: '', layanan: 'PPT', paket: 'Standar', jumlah: 1, total: 0,
    tanggalMasuk: new Date().toISOString().split('T')[0], deadline: '', pic: '',
    statusBayar: 'Belum bayar', sudahDibayar: 0, statusPesanan: 'Baru', revisi: 0,
    sumber: 'WhatsApp', topik: ''
  });

  // Portofolio Form State
  const [judulBaru, setJudulBaru] = useState('');
  const [kategoriBaru, setKategoriBaru] = useState('PPT');
  const [tipeMedia, setTipeMedia] = useState('image');
  const [urlMedia, setUrlMedia] = useState('');

  // Simpan LocalStorage otomatis
  useEffect(() => {
    localStorage.setItem('tolongGuruPesanan', JSON.stringify(pesananList));
  }, [pesananList]);

  useEffect(() => {
    localStorage.setItem('tolongGuruPortofolio', JSON.stringify(portofolioList));
  }, [portofolioList]);

  // Handler Input Pesanan Manual / Simpan
  const handleSimpanPesanan = (e) => {
    e.preventDefault();
    if (!formInput.nama || !formInput.sekolah) {
      alert("Nama dan Asal Sekolah wajib diisi!");
      return;
    }
    const pesananBaru = {
      id: `TG-${Date.now()}`,
      ...formInput,
      total: Number(formInput.total),
      sudahDibayar: Number(formInput.sudahDibayar)
    };
    setPesananList([pesananBaru, ...pesananList]);
    alert("Pesanan berhasil disimpan!");
    setTabAktif('pesanan');
  };

  // Parser WhatsApp Text sederhana
  const parseWhatsAppText = () => {
    if (!rawWhatsAppText) return;
    const lines = rawWhatsAppText.split('\n');
    let namaVal = '', sekolahVal = '', topikVal = '';
    lines.forEach(line => {
      if (line.toLowerCase().includes('nama')) namaVal = line.split(':')[1]?.trim() || '';
      if (line.toLowerCase().includes('sekolah')) sekolahVal = line.split(':')[1]?.trim() || '';
      if (line.toLowerCase().includes('topik')) topikVal = line.split(':')[1]?.trim() || '';
    });
    setFormInput(prev => ({
      ...prev,
      nama: namaVal || prev.nama,
      sekolah: sekolahVal || prev.sekolah,
      topik: topikVal || prev.topik
    }));
    alert("Form berhasil diisi dari teks WhatsApp!");
  };

  // Hapus & Ubah Pesanan
  const hapusPesanan = (id) => {
    if (confirm("Yakin ingin menghapus pesanan ini?")) {
      setPesananList(pesananList.filter(item => item.id !== id));
    }
  };

  const updateStatusPesanan = (id, statusBaru) => {
    setPesananList(pesananList.map(item => item.id === id ? { ...item, status: statusBaru } : item));
  };

  const lunaskanPesanan = (id) => {
    setPesananList(pesananList.map(item => item.id === id ? { ...item, bayar: 'Lunas', sudahDibayar: item.total } : item));
  };

  // Portofolio Handler (Konversi Link Drive otomatis)
  const tambahPortofolio = (e) => {
    e.preventDefault();
    if (!judulBaru) return alert("Judul karya harus diisi!");
    let processedUrl = urlMedia;
    if (processedUrl.includes("drive.google.com")) {
      const match = processedUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || processedUrl.match(/\?id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) processedUrl = `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
    const itemBaru = {
      id: Date.now(),
      judul: judulBaru,
      kategori: kategoriBaru,
      type: tipeMedia,
      url: processedUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'
    };
    setPortofolioList([...portofolioList, itemBaru]);
    setJudulBaru('');
    setUrlMedia('');
    alert("Portofolio berhasil ditambahkan!");
  };

  const hapusPortofolio = (id) => {
    if (confirm("Hapus portofolio ini?")) {
      setPortofolioList(portofolioList.filter(item => item.id !== id));
    }
  };

  // Statistik & Filter
  const pesananBaruCount = pesananList.filter(i => i.status === 'Baru').length;
  const sedangBerjalanCount = pesananList.filter(i => i.status === 'Dikerjakan' || i.status === 'Dikonfirmasi').length;
  const totalBelumTerbayar = pesananList
    .filter(i => i.bayar !== 'Lunas')
    .reduce((acc, curr) => acc + (curr.total - curr.sudahDibayar), 0);

  const filteredPesanan = pesananList.filter(item => {
    const matchKeyword = (item.nama + item.sekolah + item.topik + item.id).toLowerCase().includes(cariKeyword.toLowerCase());
    const matchStatus = filterStatus === 'Semua status' || item.status === filterStatus;
    const matchPic = filterPic === 'Semua PIC' || (filterPic === '(belum ada PIC)' ? !item.pic : item.pic === filterPic);
    const matchBayar = filterBayar === 'Semua pembayaran' || item.bayar === filterBayar;
    return matchKeyword && matchStatus && matchPic && matchBayar;
  });

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      
      {/* NAVBAR */}
      <nav className="bg-[#961214] text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="font-bold text-lg tracking-wide">
          Tolong Guru · Admin
        </div>
        <div className="flex space-x-2 text-sm font-medium">
          <button onClick={() => setTabAktif('pesanan')} className={`px-4 py-2 rounded-lg transition ${tabAktif === 'pesanan' ? 'bg-white text-[#961214] font-bold shadow' : 'hover:bg-red-800'}`}>
            Pesanan
          </button>
          <button onClick={() => setTabAktif('input')} className={`px-4 py-2 rounded-lg transition ${tabAktif === 'input' ? 'bg-white text-[#961214] font-bold shadow' : 'hover:bg-red-800'}`}>
            Input Pesanan
          </button>
          <button onClick={() => setTabAktif('rekap')} className={`px-4 py-2 rounded-lg transition ${tabAktif === 'rekap' ? 'bg-white text-[#961214] font-bold shadow' : 'hover:bg-red-800'}`}>
            Rekap
          </button>
          <button onClick={() => setTabAktif('portofolio')} className={`px-4 py-2 rounded-lg transition ${tabAktif === 'portofolio' ? 'bg-white text-[#961214] font-bold shadow' : 'hover:bg-red-800'}`}>
            Kelola Portofolio
          </button>
          <a href="/" className="px-4 py-2 rounded-lg hover:bg-red-800 transition flex items-center">
            Lihat Web Utama
          </a>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6">

        {/* TAB 1: PESANAN */}
        {tabAktif === 'pesanan' && (
          <div className="space-y-6">
            
            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-1">Pesanan baru</p>
                <p className="text-3xl font-black text-[#961214]">{pesananBaruCount}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-1">Sedang berjalan</p>
                <p className="text-3xl font-black text-slate-800">{sedangBerjalanCount}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-1">Belum terbayar</p>
                <p className="text-3xl font-black text-orange-600">Rp{totalBelumTerbayar.toLocaleString('id-ID')}</p>
              </div>
            </div>

            {/* FILTER BAR */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
              <input 
                type="text" 
                placeholder="Cari nama, sekolah, topik, ID" 
                value={cariKeyword} 
                onChange={(e) => setCariKeyword(e.target.value)} 
                className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#961214]"
              />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none bg-white">
                <option value="Semua status">Semua status</option>
                <option value="Baru">Baru</option>
                <option value="Dikonfirmasi">Dikonfirmasi</option>
                <option value="Dikerjakan">Dikerjakan</option>
                <option value="Selesai">Selesai</option>
              </select>
              <select value={filterPic} onChange={(e) => setFilterPic(e.target.value)} className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none bg-white">
                <option value="Semua PIC">Semua PIC</option>
                <option value="Metia">Metia</option>
                <option value="(belum ada PIC)">(belum ada PIC)</option>
              </select>
              <select value={filterBayar} onChange={(e) => setFilterBayar(e.target.value)} className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none bg-white">
                <option value="Semua pembayaran">Semua pembayaran</option>
                <option value="Lunas">Lunas</option>
                <option value="DP">DP</option>
                <option value="Belum bayar">Belum bayar</option>
              </select>
            </div>

            {/* TABEL PESANAN */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Pemesan</th>
                    <th className="p-4">Layanan</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Bayar</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Deadline</th>
                    <th className="p-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredPesanan.length === 0 ? (
                    <tr><td colSpan="7" className="p-6 text-center text-slate-400">Tidak ada pesanan ditemukan.</td></tr>
                  ) : (
                    filteredPesanan.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-4 align-top font-medium">
                          {item.nama}<br/>
                          <span className="text-xs text-slate-400 font-normal">{item.sekolah}</span><br/>
                          <span className="text-[10px] text-slate-400 font-mono">{item.id}</span>
                        </td>
                        <td className="p-4 align-top">
                          {item.layanan}<br/>
                          <span className="text-xs text-slate-500">{item.paket}</span><br/>
                          <span className="text-xs text-slate-400">Topik: {item.topik}</span>
                        </td>
                        <td className="p-4 align-top font-bold">Rp{item.total.toLocaleString('id-ID')}</td>
                        <td className="p-4 align-top">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.bayar === 'Lunas' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {item.bayar}
                          </span>
                          <div className="text-xs text-slate-500 mt-1">Rp{item.sudahDibayar.toLocaleString('id-ID')}</div>
                          {item.bayar !== 'Lunas' && (
                            <button onClick={() => lunaskanPesanan(item.id)} className="text-[10px] text-red-600 font-bold underline mt-1 block">Lunaskan</button>
                          )}
                        </td>
                        <td className="p-4 align-top">
                          <select 
                            value={item.status} 
                            onChange={(e) => updateStatusPesanan(item.id, e.target.value)}
                            className="border border-slate-200 rounded px-2 py-1 text-xs font-bold bg-slate-50"
                          >
                            <option value="Baru">Baru</option>
                            <option value="Dikonfirmasi">Dikonfirmasi</option>
                            <option value="Dikerjakan">Dikerjakan</option>
                            <option value="Selesai">Selesai</option>
                          </select>
                          <div className="text-xs text-slate-400 mt-1">{item.pic || 'Belum ada PIC'}</div>
                        </td>
                        <td className="p-4 align-top text-xs text-slate-600">{item.deadline}</td>
                        <td className="p-4 align-top space-x-1">
                          <button onClick={() => alert("Fitur edit detail pesanan")} className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs font-bold hover:bg-slate-200">Ubah</button>
                          <button onClick={() => hapusPesanan(item.id)} className="bg-red-50 text-red-600 px-2.5 py-1 rounded text-xs font-bold hover:bg-red-100">Hapus</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 2: INPUT PESANAN */}
        {tabAktif === 'input' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-bold text-base">Tempel pesan WhatsApp</h3>
              <textarea 
                value={rawWhatsAppText} 
                onChange={(e) => setRawWhatsAppText(e.target.value)}
                placeholder="Tempel pesan dari customer. Baris berformat 'Nama: ...', 'Sekolah: ...' akan mengisi form otomatis."
                className="w-full border border-slate-300 rounded-xl p-4 text-sm h-28 outline-none focus:ring-2 focus:ring-[#961214]"
              ></textarea>
              <button onClick={parseWhatsAppText} className="bg-slate-200 text-slate-700 font-bold px-5 py-2 rounded-xl text-sm hover:bg-slate-300">
                Isi form dari pesan
              </button>
            </div>

            <form onSubmit={handleSimpanPesanan} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
              <h3 className="font-bold text-lg">Form Pesanan Baru</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <label className="block font-medium mb-1">Nama</label>
                  <input type="text" value={formInput.nama} onChange={(e) => setFormInput({...formInput, nama: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none" required />
                </div>
                <div>
                  <label className="block font-medium mb-1">Sekolah</label>
                  <input type="text" value={formInput.sekolah} onChange={(e) => setFormInput({...formInput, sekolah: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none" required />
                </div>
                <div>
                  <label className="block font-medium mb-1">Layanan</label>
                  <input type="text" value={formInput.layanan} onChange={(e) => setFormInput({...formInput, layanan: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Paket</label>
                  <input type="text" value={formInput.paket} onChange={(e) => setFormInput({...formInput, paket: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Jumlah</label>
                  <input type="number" value={formInput.jumlah} onChange={(e) => setFormInput({...formInput, jumlah: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Total harga (Rp)</label>
                  <input type="number" value={formInput.total} onChange={(e) => setFormInput({...formInput, total: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Tanggal masuk</label>
                  <input type="date" value={formInput.tanggalMasuk} onChange={(e) => setFormInput({...formInput, tanggalMasuk: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Deadline</label>
                  <input type="date" value={formInput.deadline} onChange={(e) => setFormInput({...formInput, deadline: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none" />
                </div>
                <div>
                  <label className="block font-medium mb-1">PIC produksi</label>
                  <select value={formInput.pic} onChange={(e) => setFormInput({...formInput, pic: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none bg-white">
                    <option value="">- Pilih PIC -</option>
                    <option value="Metia">Metia</option>
                    <option value="Ghani">Ghani</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Status bayar</label>
                  <select value={formInput.statusBayar} onChange={(e) => setFormInput({...formInput, statusBayar: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none bg-white">
                    <option value="Belum bayar">Belum bayar</option>
                    <option value="DP">DP</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Sudah dibayar (Rp)</label>
                  <input type="number" value={formInput.sudahDibayar} onChange={(e) => setFormInput({...formInput, sudahDibayar: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Status pesanan</label>
                  <select value={formInput.statusPesanan} onChange={(e) => setFormInput({...formInput, statusPesanan: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none bg-white">
                    <option value="Baru">Baru</option>
                    <option value="Dikonfirmasi">Dikonfirmasi</option>
                    <option value="Dikerjakan">Dikerjakan</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1 text-sm">Topik dan catatan</label>
                <textarea value={formInput.topik} onChange={(e) => setFormInput({...formInput, topik: e.target.value})} className="w-full border border-slate-300 rounded-xl p-4 text-sm h-24 outline-none"></textarea>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="bg-[#961214] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#7a0e10] transition">Simpan pesanan</button>
                <button type="button" onClick={() => setFormInput({nama:'', sekolah:'', layanan:'PPT', paket:'Standar', jumlah:1, total:0, tanggalMasuk:'', deadline:'', pic:'', statusBayar:'Belum bayar', sudahDibayar:0, statusPesanan:'Baru', revisi:0, sumber:'WhatsApp', topik:''})} className="bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl">Kosongkan</button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: REKAP */}
        {tabAktif === 'rekap' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
              <select className="border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none bg-white font-medium">
                <option>Semua waktu</option>
              </select>
              <div className="space-x-3">
                <button onClick={() => alert("Mengunduh CSV...")} className="bg-slate-100 border border-slate-300 text-slate-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-slate-200">Unduh CSV</button>
                <button onClick={() => alert("Rekap disalin!")} className="bg-slate-100 border border-slate-300 text-slate-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-slate-200">Salin rekap teks</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Jumlah pesanan</p>
                <p className="text-2xl font-black">{pesananList.length}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Total nilai pesanan</p>
                <p className="text-2xl font-black">Rp{pesananList.reduce((a,b)=>a+b.total,0).toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Sudah diterima</p>
                <p className="text-2xl font-black text-green-600">Rp{pesananList.reduce((a,b)=>a+b.sudahDibayar,0).toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Belum dibayar</p>
                <p className="text-2xl font-black text-orange-600">Rp{totalBelumTerbayar.toLocaleString('id-ID')}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-bold text-lg">Per layanan</h3>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b text-xs text-slate-500 uppercase">
                    <th className="pb-3">Layanan</th>
                    <th className="pb-3">Pesanan</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Terbayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {['PPT', 'Infografis dan Poster', 'Video Pembelajaran', 'Take Konten ke Sekolah + Edit', 'Take Konten (tanpa edit)'].map((lay, idx) => {
                    const matched = pesananList.filter(i => i.layanan === lay);
                    if (matched.length === 0) return null;
                    return (
                      <tr key={idx}>
                        <td className="py-3 font-medium">{lay}</td>
                        <td className="py-3">{matched.length}</td>
                        <td className="py-3 font-bold">Rp{matched.reduce((a,b)=>a+b.total,0).toLocaleString('id-ID')}</td>
                        <td className="py-3">Rp{matched.reduce((a,b)=>a+b.sudahDibayar,0).toLocaleString('id-ID')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: KELOLA PORTOFOLIO */}
        {tabAktif === 'portofolio' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold mb-4">Tambah Portofolio & Media Preview</h2>
              <form onSubmit={tambahPortofolio} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-sm font-medium mb-1">Judul Karya</label>
                  <input type="text" value={judulBaru} onChange={(e) => setJudulBaru(e.target.value)} placeholder="Contoh: Media Pembelajaran Interaktif" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kategori</label>
                  <select value={kategoriBaru} onChange={(e) => setKategoriBaru(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none bg-white">
                    <option value="PPT">PPT (Presentasi)</option>
                    <option value="Infografis dan Poster">Infografis dan Poster</option>
                    <option value="Video Pembelajaran">Video Pembelajaran</option>
                    <option value="Website">Website / Edutech App</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipe Pratinjau</label>
                  <select value={tipeMedia} onChange={(e) => setTipeMedia(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none bg-white">
                    <option value="image">Gambar / Poster (URL / Link Drive publik)</option>
                    <option value="embed">Video / Embed YouTube</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">URL Media / Link</label>
                  <input type="text" value={urlMedia} onChange={(e) => setUrlMedia(e.target.value)} placeholder="Masukkan link gambar / YouTube..." className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none" />
                </div>
                <button type="submit" className="bg-[#961214] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#7a0e10] transition">Simpan Portofolio</button>
              </form>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold mb-4">Daftar Portofolio Publik & Pratinjau</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {portofolioList.map((item) => (
                  <div key={item.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex flex-col justify-between">
                    <div className="h-44 bg-slate-200 relative overflow-hidden flex items-center justify-center">
                      {item.type === 'image' ? (
                        <img src={item.url} alt={item.judul} className="w-full h-full object-cover" />
                      ) : (
                        <iframe src={item.url} title={item.judul} className="w-full h-full"></iframe>
                      )}
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-[#961214] uppercase">{item.kategori}</span>
                        <h4 className="font-bold text-sm text-slate-800">{item.judul}</h4>
                      </div>
                      <button onClick={() => hapusPortofolio(item.id)} className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200 transition">Hapus</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
} 