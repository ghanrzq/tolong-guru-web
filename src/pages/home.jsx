import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';

const dataLayanan = {
  'PPT': {
    unit: 'slide',
    paket: [
      { nama: 'Standar', harga: 2500, revisi: 'revisi 1x' },
      { nama: 'Tengah', harga: 3500, revisi: 'revisi 1x' },
      { nama: 'Premium', harga: 5000, revisi: 'revisi 2x' },
    ]
  },
  'Infografis dan Poster': {
    unit: 'desain',
    paket: [
      { nama: 'Standar', harga: 15000, revisi: 'revisi 1x' },
      { nama: 'Tengah', harga: 25000, revisi: 'revisi 1x' },
      { nama: 'Premium', harga: 35000, revisi: 'revisi 2x' },
    ]
  },
  'Video Pembelajaran': {
    unit: 'menit',
    paket: [
      { nama: 'Satu paket', harga: 50000, revisi: 'revisi 1x, tambahan Rp10.000' },
    ]
  },
  'Take Konten (tanpa edit)': {
    unit: 'sesi',
    paket: [
      { nama: 'Satu sesi', harga: 150000, revisi: 'tanpa edit' },
    ]
  },
  'Take Konten ke Sekolah + Edit': {
    unit: 'acara',
    paket: [
      { nama: 'Standar', harga: 200000, revisi: 'revisi 1x' },
      { nama: 'Premium', harga: 300000, revisi: 'revisi 2x' },
    ]
  }
};

export default function Home() {
  const [layanan, setLayanan] = useState('PPT');
  const [paket, setPaket] = useState(0);
  const [jumlah, setJumlah] = useState(15);
  const [nama, setNama] = useState('');
  const [sekolah, setSekolah] = useState('');
  const [topik, setTopik] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [catatan, setCatatan] = useState('');
  const [totalHarga, setTotalHarga] = useState(0);

  const [faqAktif, setFaqAktif] = useState(0);
  const [portofolioPublik, setPortofolioPublik] = useState([]);
  const [kategoriFilter, setKategoriFilter] = useState('Semua');

  // Ambil Portofolio Publik dari Firebase Firestore secara real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "portofolio"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ idDoc: doc.id, ...doc.data() }));
      setPortofolioPublik(data);
    }, (error) => {
      console.log("Fallback localStorage portofolio:", error);
      const saved = localStorage.getItem('tolongGuruPortofolio');
      if (saved) setPortofolioPublik(JSON.parse(saved));
      else setPortofolioPublik([]);
    });

    return () => unsub();
  }, []);

  const portofolioTampil = kategoriFilter === 'Semua' 
    ? portofolioPublik 
    : portofolioPublik.filter(item => item.kategori?.toLowerCase().includes(kategoriFilter.toLowerCase()) || item.kategori === kategoriFilter);

  const layananTerpilih = dataLayanan[layanan];
  const paketTerpilih = layananTerpilih.paket[paket] || layananTerpilih.paket[0];

  useEffect(() => {
    setPaket(0);
    setJumlah(1);
  }, [layanan]);

  useEffect(() => {
    setTotalHarga(paketTerpilih.harga * jumlah);
  }, [layanan, paket, jumlah, paketTerpilih]);

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  // Fungsi Kirim Pesanan ke Firebase & WhatsApp
  const kirimWhatsApp = async () => {
    if (!nama || !sekolah) {
      alert("Mohon isi Nama dan Sekolah terlebih dahulu.");
      return;
    }

    const pesananBaru = {
      id: `TG-${Date.now().toString().slice(-6)}`,
      nama: nama,
      sekolah: sekolah,
      layanan: layanan,
      paket: `${paketTerpilih.nama} x ${jumlah}`,
      jumlah: jumlah,
      total: totalHarga,
      bayar: totalHarga <= 100000 ? 'Lunas' : 'Belum bayar',
      sudahDibayar: 0,
      status: 'Baru',
      tanggalMasuk: new Date().toISOString().split('T')[0],
      deadline: tanggal || '-',
      pic: '',
      topik: topik || catatan || '-',
      sumber: 'Website (WhatsApp)'
    };

    // Simpan ke Firebase Firestore (potongan kode gambar 2 ditaruh di sini)
    try {
      await addDoc(collection(db, "pesanan"), pesananBaru);
    } catch (err) {
      console.log("Simpan ke localStorage cadangan karena offline");
      const existingPesanan = JSON.parse(localStorage.getItem('tolongGuruPesanan')) || [];
      localStorage.setItem('tolongGuruPesanan', JSON.stringify([pesananBaru, ...existingPesanan]));
    }

    const nomorWA = "6283878207277";
    const statusBayarWA = totalHarga <= 100000 ? "Lunas di awal" : "DP 50% / Lunas di awal";
    const teksPesan = `Halo Admin Tolong Guru, saya ingin memesan:\n\n*Nama:* ${nama}\n*Sekolah:* ${sekolah}\n*Topik:* ${topik}\n*Dibutuhkan tanggal:* ${tanggal}\n*Catatan:* ${catatan}\n\n*Detail Pesanan:*\nLayanan: ${layanan}\nPaket: ${paketTerpilih.nama}\nJumlah: ${jumlah} ${layananTerpilih.unit}\n*Total:* ${formatRupiah(totalHarga)} (${statusBayarWA})\n\nApakah bisa dibantu?`;
    
    window.open(`https://wa.me/${nomorWA}?text=${encodeURIComponent(teksPesan)}`, '_blank');
    
    setNama('');
    setSekolah('');
    setTopik('');
    setTanggal('');
    setCatatan('');
    alert("Pesanan berhasil dikirim dan otomatis tercatat di Dashboard Admin!");
  };

  const faqList = [
    { q: "Berapa lama pengerjaannya?", a: "Perkiraan: PPT sampai 15 slide dan infografis 1 sampai 2 hari kerja, video sampai 2 menit 3 sampai 5 hari kerja. Waktu pasti ditegaskan admin saat konfirmasi." },
    { q: "Apa yang dimaksud revisi?", a: "Revisi adalah kesempatan perbaikan sesuai paket yang dipilih untuk memastikan media sesuai dengan kebutuhan mengajar Anda." },
    { q: "Apakah materi saya aman?", a: "Sangat aman. Materi, data sekolah, dan dokumen Anda dijaga kerahasiaannya." },
    { q: "Bagaimana jika saya kurang paham teknologi?", a: "Kami menyediakan panduan praktis penggunaan media dan siap membantu menjelaskan cara pemakaiannya." },
    { q: "Bagaimana jika pesanan dibatalkan?", a: "Pembatalan sebelum pengerjaan dimulai dapat dilakukan, silakan hubungi admin via WhatsApp." },
    { q: "Take konten ke sekolah itu apa?", a: "Tim kami datang langsung ke sekolah Anda untuk mendokumentasikan kegiatan atau pembelajaran." }
  ];

  return (
    <div className="font-sans text-[#332222] bg-[#FFFBF8] scroll-smooth">
      
      {/* NAVBAR */}
      <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-[#961214] font-black text-2xl tracking-tighter flex items-center gap-2">
            <div>
              <div className="leading-none">TOLONG GURU</div>
              <div className="text-[10px] font-medium text-gray-500 italic tracking-normal">Edutech & Media</div>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-semibold text-gray-700">
            <a href="#layanan" className="hover:text-[#961214] transition">Layanan & Harga</a>
            <a href="#alur" className="hover:text-[#961214] transition">Alur</a>
            <a href="#portofolio" className="hover:text-[#961214] transition">Portofolio</a>
            <a href="#faq" className="hover:text-[#961214] transition">Tanya Jawab</a>
            <a href="/admin" className="text-xs bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg text-slate-700 font-bold hover:bg-slate-200 transition">Admin Panel</a>
            <a href="#pesan" className="bg-[#961214] text-white px-5 py-2 rounded-xl font-bold hover:bg-[#7a0e10] shadow-md transition">Pesan Sekarang</a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="bg-gradient-to-b from-[#961214] to-[#71090C] text-white py-24 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <span className="bg-white/15 text-[#FFB84D] text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-white/15 inline-block mb-4">
              Platform Jasa Media Pembelajaran Guru
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
              Pesan PPT, infografis, dan video pembelajaran tanpa ribet.
            </h1>
            <p className="text-lg text-red-100 mb-8 leading-relaxed">
              Anda yang menentukan isi pembelajaran. Tim Tolong Guru mengerjakan bagian teknisnya, jadi waktu Anda tetap untuk murid.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#pesan" className="bg-[#FFB84D] text-[#4A2511] font-bold px-7 py-3.5 rounded-xl hover:bg-[#ffc672] shadow-lg transition">
                Mulai Pesan Sekarang
              </a>
              <a href="#portofolio" className="bg-white/10 text-white border border-white/20 font-bold px-7 py-3.5 rounded-xl hover:bg-white/20 transition">
                Lihat Portofolio
              </a>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-2xl text-slate-800 border border-slate-100 hidden md:block">
            <h3 className="font-extrabold text-xl text-[#961214] mb-2">Kenapa Tolong Guru?</h3>
            <ul className="space-y-4 text-sm font-medium text-slate-600">
              <li className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[#961214] font-bold text-lg">✓</span>
                <div><strong>Harga Transparan:</strong> Dihitung per satuan secara jelas tanpa biaya tersembunyi.</div>
              </li>
              <li className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[#961214] font-bold text-lg">✓</span>
                <div><strong>Kuota Revisi Aman:</strong> Setiap paket sudah termasuk kuota revisi untuk hasil optimal.</div>
              </li>
            </ul>
          </div>
        </div>
      </header>

      {/* SECTION PORTOFOLIO PUBLIK */}
      <section id="portofolio" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-black">Portofolio</h2>
            <p className="text-gray-600">Karya dan media pembelajaran interaktif yang telah kami selesaikan untuk para guru dan sekolah.</p>
          </div>

          {/* FILTER KATEGORI */}
          <div className="flex flex-wrap justify-center gap-3 mb-14">
            {['Semua', 'Infografis dan Poster', 'Video Pembelajaran', 'PPT', 'Website'].map((kat) => (
              <button
                key={kat}
                onClick={() => setKategoriFilter(kat)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition shadow-sm ${
                  kategoriFilter === kat 
                    ? 'bg-[#961214] text-white shadow' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {kat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {portofolioTampil.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">Belum ada karya dalam kategori ini.</div>
            ) : (
              portofolioTampil.map((item) => (
                <div key={item.idDoc || item.id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-[#FFFBF8] hover:shadow-md transition flex flex-col justify-between">
                  <div className="bg-slate-900 relative overflow-hidden flex items-center justify-center p-2 min-h-[260px]">
                    {item.type === 'image' ? (
                      <img 
                        src={item.url} 
                        alt={item.judul} 
                        className="w-full h-full max-h-[350px] object-contain rounded-lg transition-transform duration-300 hover:scale-105" 
                      />
                    ) : item.type === 'embed' ? (
                      <iframe src={item.url} title={item.judul} className="w-full h-52"></iframe>
                    ) : (
                      <div className="text-sm font-bold text-gray-600 bg-white px-4 py-2 rounded-lg shadow">Pratinjau Website / App</div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col justify-between flex-1 bg-white">
                    <div>
                      <span className="text-xs font-bold text-[#961214] bg-red-50 px-2.5 py-1 rounded-md uppercase tracking-wide">{item.kategori}</span>
                      <h3 className="font-bold text-lg text-black mt-3 leading-snug">{item.judul}</h3>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <a 
                        href={item.linkDrive || item.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs font-bold text-[#961214] hover:text-[#7a0e10] flex items-center gap-1 bg-red-50 px-3 py-2 rounded-lg transition"
                      >
                        <span>🔍 Buka File Asli / Drive</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* LAYANAN DAN HARGA */}
      <section id="layanan" className="py-24 px-6 bg-[#FFFBF8]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-black">Layanan dan Harga</h2>
            <p className="text-gray-600">Pilih paket sesuai kebutuhan Anda.</p>
          </div>

          <div className="space-y-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row border-b border-gray-100 pb-6 justify-between items-start md:items-center">
              <div className="md:w-1/3 mb-2 md:mb-0"><h3 className="font-extrabold text-xl text-black">PPT</h3><p className="text-sm text-gray-500">Presentasi untuk materi ajar. Harga per slide.</p></div>
              <div className="md:w-2/3 space-y-2 text-sm w-full">
                <div className="flex justify-between py-1 border-b border-dashed border-gray-100"><span className="text-gray-600">Standar, revisi 1x</span><span className="font-bold text-black">Rp2.500</span></div>
                <div className="flex justify-between py-1 border-b border-dashed border-gray-100"><span className="text-gray-600">Tengah, revisi 1x</span><span className="font-bold text-black">Rp3.500</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-600">Premium, revisi 2x</span><span className="font-bold text-black">Rp5.000</span></div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row border-b border-gray-100 pb-6 justify-between items-start md:items-center">
              <div className="md:w-1/3 mb-2 md:mb-0"><h3 className="font-extrabold text-xl text-black">Infografis dan Poster</h3><p className="text-sm text-gray-500">Materi visual untuk dipajang atau dibagikan. Harga per desain.</p></div>
              <div className="md:w-2/3 space-y-2 text-sm w-full">
                <div className="flex justify-between py-1 border-b border-dashed border-gray-100"><span className="text-gray-600">Standar, revisi 1x</span><span className="font-bold text-black">Rp15.000</span></div>
                <div className="flex justify-between py-1 border-b border-dashed border-gray-100"><span className="text-gray-600">Tengah, revisi 1x</span><span className="font-bold text-black">Rp25.000</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-600">Premium, revisi 2x</span><span className="font-bold text-black">Rp35.000</span></div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row border-b border-gray-100 pb-6 justify-between items-start md:items-center">
              <div className="md:w-1/3 mb-2 md:mb-0"><h3 className="font-extrabold text-xl text-black">Video Pembelajaran</h3><p className="text-sm text-gray-500">Video penjelasan materi. Harga per menit.</p></div>
              <div className="md:w-2/3 space-y-2 text-sm w-full">
                <div className="flex justify-between py-1"><span className="text-gray-600">Satu paket, revisi 1x, tambahan Rp10.000</span><span className="font-bold text-black">Rp50.000</span></div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row border-b border-gray-100 pb-6 justify-between items-start md:items-center">
              <div className="md:w-1/3 mb-2 md:mb-0"><h3 className="font-extrabold text-xl text-black">Take Konten (tanpa edit)</h3><p className="text-sm text-gray-500">Tim memotret atau merekam kegiatan di sekolah.</p></div>
              <div className="md:w-2/3 space-y-2 text-sm w-full">
                <div className="flex justify-between py-1"><span className="text-gray-600">Satu sesi, tanpa edit</span><span className="font-bold text-black">Rp150.000</span></div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-2">
              <div className="md:w-1/3 mb-2 md:mb-0"><h3 className="font-extrabold text-xl text-black">Take Konten ke Sekolah + Edit</h3><p className="text-sm text-gray-500">Take konten satu acara penuh beserta jasa edit.</p></div>
              <div className="md:w-2/3 space-y-2 text-sm w-full">
                <div className="flex justify-between py-1 border-b border-dashed border-gray-100"><span className="text-gray-600">Standar, revisi 1x</span><span className="font-bold text-black">Rp200.000</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-600">Premium, revisi 2x</span><span className="font-bold text-black">Rp300.000</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ALUR PEMESANAN */}
      <section id="alur" className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-black">Alur Pemesanan</h2>
            <p className="text-gray-600">Enam langkah mudah dari pesan sampai hasil Anda terima.</p>
          </div>

          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
            <div className="relative flex items-start gap-4">
              <div className="w-9 h-9 rounded-full bg-[#961214] text-white flex items-center justify-center font-bold shrink-0 z-10 shadow">1</div>
              <div className="bg-[#FFFBF8] p-5 rounded-2xl border border-gray-200 flex-1">
                <h3 className="font-bold text-lg text-black">Pilih layanan dan paket</h3>
                <p className="text-gray-600 text-sm mt-1">Gunakan kalkulator di bagian "Pesan sekarang" untuk melihat perkiraan total.</p>
              </div>
            </div>
            <div className="relative flex items-start gap-4">
              <div className="w-9 h-9 rounded-full bg-[#961214] text-white flex items-center justify-center font-bold shrink-0 z-10 shadow">2</div>
              <div className="bg-[#FFFBF8] p-5 rounded-2xl border border-gray-200 flex-1">
                <h3 className="font-bold text-lg text-black">Kirim kebutuhan</h3>
                <p className="text-gray-600 text-sm mt-1">Isi nama, sekolah, dan topik, lalu tekan "Kirim lewat WhatsApp". Pesan sudah terisi otomatis.</p>
              </div>
            </div>
            <div className="relative flex items-start gap-4">
              <div className="w-9 h-9 rounded-full bg-[#961214] text-white flex items-center justify-center font-bold shrink-0 z-10 shadow">3</div>
              <div className="bg-[#FFFBF8] p-5 rounded-2xl border border-gray-200 flex-1">
                <h3 className="font-bold text-lg text-black">Konfirmasi pesanan</h3>
                <p className="text-gray-600 text-sm mt-1">Admin membalas dengan ringkasan, total harga, dan perkiraan selesai.</p>
              </div>
            </div>
            <div className="relative flex items-start gap-4">
              <div className="w-9 h-9 rounded-full bg-[#961214] text-white flex items-center justify-center font-bold shrink-0 z-10 shadow">4</div>
              <div className="bg-[#FFFBF8] p-5 rounded-2xl border border-gray-200 flex-1">
                <h3 className="font-bold text-lg text-black">Bayar</h3>
                <p className="text-gray-600 text-sm mt-1">Pesanan sampai Rp100.000 dibayar lunas di awal. Di atas itu cukup DP 50%.</p>
              </div>
            </div>
            <div className="relative flex items-start gap-4">
              <div className="w-9 h-9 rounded-full bg-[#961214] text-white flex items-center justify-center font-bold shrink-0 z-10 shadow">5</div>
              <div className="bg-[#FFFBF8] p-5 rounded-2xl border border-gray-200 flex-1">
                <h3 className="font-bold text-lg text-black">Pengerjaan dan revisi</h3>
                <p className="text-gray-600 text-sm mt-1">Tim mengirim draft dan Anda beri catatan perbaikan.</p>
              </div>
            </div>
            <div className="relative flex items-start gap-4">
              <div className="w-9 h-9 rounded-full bg-[#961214] text-white flex items-center justify-center font-bold shrink-0 z-10 shadow">6</div>
              <div className="bg-[#FFFBF8] p-5 rounded-2xl border border-gray-200 flex-1">
                <h3 className="font-bold text-lg text-black">Terima hasil</h3>
                <p className="text-gray-600 text-sm mt-1">Setelah lunas, file final dikirim bersama panduan pemakaian singkat.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORM PESAN SEKARANG */}
      <section id="pesan" className="py-24 px-6 bg-[#FFFBF8]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-2 text-black">Pesan Sekarang</h2>
            <p className="text-gray-600">Isi data kalkulator di bawah ini, lalu kirim langsung lewat WhatsApp.</p>
          </div>
          
          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-lg border border-gray-200">
            <div className="space-y-6 text-sm font-bold text-slate-700">
              <div>
                <label className="block mb-2 text-slate-800">Pilih Layanan</label>
                <select 
                  value={layanan} onChange={(e) => setLayanan(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 font-normal outline-none bg-slate-50"
                >
                  {Object.keys(dataLayanan).map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block mb-2 text-slate-800">Pilihan Paket</label>
                  <select 
                    value={paket} onChange={(e) => setPaket(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 font-normal outline-none bg-slate-50"
                  >
                    {dataLayanan[layanan].paket.map((pkt, idx) => (
                      <option key={idx} value={idx}>{pkt.nama} (Rp{pkt.harga.toLocaleString('id-ID')} per {dataLayanan[layanan].unit})</option>
                    ))}
                  </select>
                </div>
                <div className="w-1/3">
                  <label className="block mb-2 text-slate-800">Jumlah</label>
                  <input 
                    type="number" min="1" 
                    value={jumlah} onChange={(e) => setJumlah(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 font-normal outline-none bg-slate-50" 
                  />
                </div>
              </div>

              <div className="bg-[#FFF4E5] border border-dashed border-[#FFCBA4] p-5 rounded-2xl font-normal text-gray-700">
                <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Perkiraan Total Biaya</p>
                <p className="text-3xl font-black text-black mb-2">{formatRupiah(totalHarga)}</p>
                <p className="text-xs font-medium">Ketentuan: {totalHarga <= 100000 ? 'Lunas di awal' : 'Bisa DP 50% atau lunas di awal'}</p>
              </div>

              <div>
                <label className="block mb-2 text-slate-800">Nama Anda</label>
                <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Budi Santoso, S.Pd." className="w-full border border-gray-300 rounded-xl px-4 py-3 font-normal outline-none bg-slate-50" />
              </div>

              <div>
                <label className="block mb-2 text-slate-800">Asal Sekolah</label>
                <input type="text" value={sekolah} onChange={(e) => setSekolah(e.target.value)} placeholder="Contoh: SDN 1 Bandung" className="w-full border border-gray-300 rounded-xl px-4 py-3 font-normal outline-none bg-slate-50" />
              </div>

              <div>
                <label className="block mb-2 text-slate-800">Topik atau Materi Pembelajaran</label>
                <textarea value={topik} onChange={(e) => setTopik(e.target.value)} placeholder="Contoh: Pecahan matematika kelas 4 SD" className="w-full border border-gray-300 rounded-xl px-4 py-3 font-normal outline-none bg-slate-50 h-28 resize-none"></textarea>
              </div>

              <div>
                <label className="block mb-2 text-slate-800">Dibutuhkan Tanggal</label>
                <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 font-normal outline-none bg-slate-50" />
              </div>

              <button type="button" onClick={kirimWhatsApp} className="w-full bg-[#961214] text-white font-extrabold py-4 rounded-xl hover:bg-[#7a0e10] transition mt-6 text-lg shadow-lg flex items-center justify-center gap-2">
                Kirim Pesanan lewat WhatsApp
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TANYA JAWAB */}
      <section id="faq" className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-black">Tanya Jawab</h2>
            <p className="text-gray-600">Pertanyaan yang sering diajukan seputar layanan Tolong Guru.</p>
          </div>

          <div className="space-y-4">
            {faqList.map((item, idx) => (
              <div key={idx} className="border border-gray-200 rounded-2xl overflow-hidden bg-[#FFFBF8]">
                <button 
                  onClick={() => setFaqAktif(faqAktif === idx ? null : idx)}
                  className="w-full text-left font-bold flex justify-between items-center p-5 focus:outline-none hover:bg-gray-50 transition"
                >
                  <span className="flex items-center gap-3 text-slate-800 text-base">
                    <span className="text-[#961214] font-bold">{faqAktif === idx ? '▼' : '▶'}</span> 
                    {item.q}
                  </span>
                </button>
                {faqAktif === idx && (
                  <p className="text-gray-600 px-6 pb-5 pt-1 text-sm leading-relaxed border-t border-gray-100">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#71090C] text-white py-14 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-sm">
          <div>
            <p><strong className="font-bold text-lg">Tolong Guru Edutech & Media</strong></p>
            <p className="text-red-200">Mudahkan mengajar, maksimalkan belajar.</p>
            <p className="text-red-200">WhatsApp: +62 838-7820-7277</p>
          </div>
          <div className="text-red-200 text-xs md:text-right space-y-1">
            <p>Kelompok 3, Program Studi Teknologi Pendidikan</p>
            <p>Universitas Pendidikan Indonesia</p>
          </div>
        </div>
      </footer>

    </div>
  );
}