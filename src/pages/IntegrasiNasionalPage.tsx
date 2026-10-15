import React, { useState, useMemo } from 'react';
import {
  Landmark,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Printer,
  Search,
  Building2,
  Sparkles,
  FileCheck2,
  ShieldCheck,
  Tag,
  ArrowRight,
  School,
  ExternalLink,
  Layers,
  Wrench,
  Check,
  Info,
  Calendar,
  UserCheck,
  FileText,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { AssetRecord, BarangMasuk } from '../types';
import { formatRupiah, formatTanggalIndo, exportToCsv } from '../utils/format';
import {
  PERMENDAGRI_108_DATABASE,
  matchPermendagriCode,
  PermendagriItem,
} from '../utils/permendagri108';

type IntegrasiTab =
  | 'sipd_bmd'
  | 'arkas_rekon'
  | 'dapodik_sarpras'
  | 'kamus_108'
  | 'audit_kepatuhan'
  | 'dokumen_pemda';

export const IntegrasiNasionalPage: React.FC = () => {
  const {
    config,
    assets,
    barangMasuk,
    updateAsset,
    batchUpdateAssets,
    addPenghapusan,
  } = useInventory();

  const [activeTab, setActiveTab] = useState<IntegrasiTab>('sipd_bmd');
  const [searchQuery, setSearchQuery] = useState('');
  const [kibFilter, setKibFilter] = useState<string>('ALL');
  const [selectedTriwulan, setSelectedTriwulan] = useState<'TW1' | 'TW2' | 'TW3' | 'TW4'>('TW3');
  const [kamusSearch, setKamusSearch] = useState('');
  const [kamusKibFilter, setKamusKibFilter] = useState<string>('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Helper: hitung umur dan nilai buku depresiasi
  const currentYear = new Date().getFullYear();
  const getAssetFinancials = (asset: AssetRecord) => {
    const tahunPerolehan = asset.tahunPerolehan || parseInt(asset.tanggalBku?.slice(0, 4) || '2026', 10);
    const umur = Math.max(0, currentYear - tahunPerolehan);
    const masaManfaat = asset.masaManfaat || (asset.kibKategori === 'KIB_A' ? 0 : 5);
    const hargaSatuan = Number(asset.hargaSatuan) || 0;
    const jumlah = Number(asset.jumlah) || 1;
    const totalNilai = Number(asset.totalNilai) || hargaSatuan * jumlah;

    if (masaManfaat === 0) {
      return { totalNilai, akumulasiPenyusutan: 0, nilaiBuku: totalNilai, umur, masaManfaat };
    }

    const penyusutanPerTahun = totalNilai / masaManfaat;
    const akumulasiPenyusutan = Math.min(totalNilai, penyusutanPerTahun * umur);
    const nilaiBuku = Math.max(0, totalNilai - akumulasiPenyusutan);

    return { totalNilai, akumulasiPenyusutan, nilaiBuku, umur, masaManfaat };
  };

  // Filtered assets for SIPD
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchKib = kibFilter === 'ALL' || a.kibKategori === kibFilter;
      const matchSearch =
        a.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.kodeAset.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.kodeBmdPermendagri && a.kodeBmdPermendagri.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.nomorRegisterNup && a.nomorRegisterNup.toLowerCase().includes(searchQuery.toLowerCase())) ||
        a.lokasi.toLowerCase().includes(searchQuery.toLowerCase());
      return matchKib && matchSearch;
    });
  }, [assets, kibFilter, searchQuery]);

  // Statistik Kesiapan Nasional
  const nationalStats = useMemo(() => {
    const total = assets.length;
    const berKode108 = assets.filter((a) => !!a.kodeBmdPermendagri).length;
    const berNup = assets.filter((a) => !!a.nomorRegisterNup).length;
    const kesiapanSipdPercent = total > 0 ? Math.round(((berKode108 + berNup) / (total * 2)) * 100) : 0;

    // Belanja Modal di BKU vs Aset
    const bkuBelanjaModal = barangMasuk
      .filter((bm) => bm.kodeRekeningRkas?.startsWith('5.2.3') || bm.kodeRekeningRkas?.startsWith('5.2.02.05') || bm.kodeRekeningRkas?.startsWith('5.2.02.08'))
      .reduce((sum, b) => sum + Number(b.totalPengadaan || 0), 0);
    const totalNilaiAset = assets.reduce((sum, a) => sum + Number(a.totalNilai || 0), 0);

    // Temuan Kepatuhan Audit
    const tanpaKode108 = assets.filter((a) => !a.kodeBmdPermendagri);
    const tanpaNup = assets.filter((a) => !a.nomorRegisterNup);
    const habisMasaManfaat = assets.filter((a) => {
      const f = getAssetFinancials(a);
      return f.masaManfaat > 0 && f.umur >= f.masaManfaat && a.status === 'AKTIF';
    });
    const tanpaPj = assets.filter((a) => !a.penanggungJawab || a.penanggungJawab.trim() === '');
    const rusakBeratAktif = assets.filter((a) => a.kondisi === 'RUSAK_BERAT' && a.status === 'AKTIF');

    const totalTemuan = tanpaKode108.length + tanpaNup.length + habisMasaManfaat.length + tanpaPj.length + rusakBeratAktif.length;
    const auditComplianceScore = Math.max(50, Math.min(100, 100 - totalTemuan * 5));

    return {
      total,
      berKode108,
      berNup,
      kesiapanSipdPercent,
      bkuBelanjaModal,
      totalNilaiAset,
      tanpaKode108,
      tanpaNup,
      habisMasaManfaat,
      tanpaPj,
      rusakBeratAktif,
      totalTemuan,
      auditComplianceScore,
    };
  }, [assets, barangMasuk]);

  // Action: Auto-Assign Kode Permendagri 108 ke semua aset
  const handleAutoAssignPermendagri = () => {
    let updatedCount = 0;
    const updated = assets.map((asset) => {
      if (!asset.kodeBmdPermendagri) {
        const matched = matchPermendagriCode(asset.namaBarang, asset.kibKategori);
        if (matched) {
          updatedCount++;
          return {
            ...asset,
            kodeBmdPermendagri: matched.kode,
            kibKategori: asset.kibKategori || matched.kib,
            masaManfaat: asset.masaManfaat || matched.masaManfaatDefault,
            kodeRekeningArkas: asset.kodeRekeningArkas || matched.rekeningArkasDefault,
          };
        }
      }
      return asset;
    });

    if (updatedCount > 0) {
      batchUpdateAssets(updated);
      showNotification(`Berhasil memetakan kode Permendagri 108 ke ${updatedCount} aset sekolah!`);
    } else {
      showNotification('Semua aset sudah memiliki kodefikasi Permendagri 108 yang valid.');
    }
  };

  // Action: Auto-Generate NUP (Nomor Urut Pendaftaran)
  const handleAutoGenerateNup = () => {
    let count = 0;
    // Kelompokkan per namaBarang atau kodeBarang
    const nupCounters: Record<string, number> = {};
    const updated = assets.map((asset) => {
      const groupKey = asset.kodeBmdPermendagri || asset.kodeBarang || asset.namaBarang;
      nupCounters[groupKey] = (nupCounters[groupKey] || 0) + 1;
      const formattedNup = String(nupCounters[groupKey]).padStart(4, '0');

      if (!asset.nomorRegisterNup || asset.nomorRegisterNup !== formattedNup) {
        count++;
        return {
          ...asset,
          nomorRegisterNup: formattedNup,
          statusPenggunaanBmd: asset.statusPenggunaanBmd || 'Digunakan Sendiri',
        };
      }
      return asset;
    });

    batchUpdateAssets(updated);
    showNotification(`Berhasil menetapkan Nomor Urut Pendaftaran (NUP) berurutan untuk ${count} aset!`);
  };

  // Export SIPD-BMD
  const handleExportSipdBmd = () => {
    const data = filteredAssets.map((a, idx) => {
      const f = getAssetFinancials(a);
      return {
        'No': idx + 1,
        'Kode Unit SKPD': config.npsn,
        'Nama Satuan Pendidikan': config.schoolName,
        'Kode BMD (Permendagri 108)': a.kodeBmdPermendagri || '1.3.2.05.02.01.004',
        'Nomor Register (NUP)': a.nomorRegisterNup || '0001',
        'Kategori KIB': a.kibKategori || 'KIB_B',
        'Kode Aset Sekolah': a.kodeAset,
        'Nama Barang': a.namaBarang,
        'Merk / Tipe': a.merk || '-',
        'Nomor Pabrik/Seri': a.nomorSeri || '-',
        'Bahan': a.bahan || 'Campuran',
        'Ukuran / Konstruksi': a.ukuran || '-',
        'Tahun Pengadaan': a.tahunPerolehan || a.tanggalBku?.slice(0, 4) || '2026',
        'Asal Usul': a.asalUsul || 'BOS Reguler',
        'Kondisi Fisik': a.kondisi === 'BAIK' ? 'Baik (B)' : a.kondisi === 'RUSAK_RINGAN' ? 'Rusak Ringan (RR)' : 'Rusak Berat (RB)',
        'Harga Perolehan (Rp)': f.totalNilai,
        'Akumulasi Penyusutan (Rp)': Math.round(f.akumulasiPenyusutan),
        'Nilai Buku (Rp)': Math.round(f.nilaiBuku),
        'Masa Manfaat (Tahun)': f.masaManfaat,
        'Status Penggunaan BMD': a.statusPenggunaanBmd || 'Digunakan Sendiri',
        'Lokasi Ruangan': a.lokasi,
        'Penanggung Jawab': a.penanggungJawab,
        'Keterangan': a.keterangan || '-',
      };
    });

    exportToCsv(`Ekspor_SIPD_BMD_${config.npsn}_${new Date().toISOString().slice(0, 10)}`, data);
  };

  // Export Dapodik Sarpras
  const handleExportDapodikSarpras = () => {
    const data = filteredAssets.map((a, idx) => ({
      'No': idx + 1,
      'NPSN': config.npsn,
      'Sekolah': config.schoolName,
      'Jenis Sarana': a.namaBarang,
      'Kode Barang': a.kodeBarang,
      'Nama Spesifikasi': `${a.merk || ''} ${a.spesifikasi || ''}`.trim(),
      'Ruang': a.lokasi,
      'Kepemilikan': 'Milik Sendiri',
      'Peminjam': a.penanggungJawab,
      'Jumlah Total': a.jumlah || 1,
      'Jumlah Laik': a.kondisi === 'BAIK' ? a.jumlah : 0,
      'Jumlah Rusak Ringan': a.kondisi === 'RUSAK_RINGAN' ? a.jumlah : 0,
      'Jumlah Rusak Berat': a.kondisi === 'RUSAK_BERAT' ? a.jumlah : 0,
      'Kelayakan Dapodik': a.kondisi === 'RUSAK_BERAT' ? 'Tidak Laik' : 'Laik',
      'Sumber Dana': a.asalUsul || 'BOS Reguler',
      'Tahun Pengadaan': a.tahunPerolehan || a.tanggalBku?.slice(0, 4) || '2026',
    }));

    exportToCsv(`Dapodik_Sarpras_${config.npsn}_${new Date().toISOString().slice(0, 10)}`, data);
  };

  // Data Rekonsiliasi Triwulan BOS
  const rekonData = useMemo(() => {
    const monthsTW = {
      TW1: ['01', '02', '03'],
      TW2: ['04', '05', '06'],
      TW3: ['07', '08', '09'],
      TW4: ['10', '11', '12'],
    };

    const targetMonths = monthsTW[selectedTriwulan];

    // Realisasi Belanja Modal di BKU
    const belanjaModal = barangMasuk.filter((bm) => {
      const month = bm.tanggal?.slice(5, 7);
      const isTargetMonth = targetMonths.includes(month);
      const isModal =
        bm.kodeRekeningRkas?.startsWith('5.2.3') ||
        bm.kodeRekeningRkas?.startsWith('5.2.02.05') ||
        bm.kodeRekeningRkas?.startsWith('5.2.02.08') ||
        bm.hargaSatuan >= 1000000;
      return isTargetMonth && isModal;
    });

    // Realisasi Belanja Persediaan Habis Pakai di BKU
    const belanjaPersediaan = barangMasuk.filter((bm) => {
      const month = bm.tanggal?.slice(5, 7);
      const isTargetMonth = targetMonths.includes(month);
      const isPersediaan =
        !bm.kodeRekeningRkas?.startsWith('5.2.3') &&
        !bm.kodeRekeningRkas?.startsWith('5.2.02.05') &&
        !bm.kodeRekeningRkas?.startsWith('5.2.02.08') &&
        bm.hargaSatuan < 1000000;
      return isTargetMonth && isPersediaan;
    });

    const totalBelanjaModal = belanjaModal.reduce((sum, b) => sum + Number(b.totalPengadaan || 0), 0);
    const totalBelanjaPersediaan = belanjaPersediaan.reduce((sum, b) => sum + Number(b.totalPengadaan || 0), 0);

    // Aset yang teregistrasi di periode triwulan ini
    const asetTriwulan = assets.filter((a) => {
      const month = a.tanggalBku?.slice(5, 7);
      return targetMonths.includes(month);
    });

    const totalAsetTerdaftar = asetTriwulan.reduce((sum, a) => sum + Number(a.totalNilai || 0), 0);
    const selisihModal = totalBelanjaModal - totalAsetTerdaftar;

    return {
      belanjaModal,
      belanjaPersediaan,
      totalBelanjaModal,
      totalBelanjaPersediaan,
      asetTriwulan,
      totalAsetTerdaftar,
      selisihModal,
    };
  }, [barangMasuk, assets, selectedTriwulan]);

  // Filtered Kamus Permendagri
  const filteredKamus = useMemo(() => {
    return PERMENDAGRI_108_DATABASE.filter((item) => {
      const matchKib = kamusKibFilter === 'ALL' || item.kib === kamusKibFilter;
      const matchSearch =
        item.nama.toLowerCase().includes(kamusSearch.toLowerCase()) ||
        item.kode.toLowerCase().includes(kamusSearch.toLowerCase()) ||
        item.keywords.some((k) => k.toLowerCase().includes(kamusSearch.toLowerCase()));
      return matchKib && matchSearch;
    });
  }, [kamusKibFilter, kamusSearch]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2 border border-emerald-200">
            <Landmark className="w-3.5 h-3.5 text-emerald-600" />
            Standar Nasional: Permendagri 108/2016 • ARKAS BOSP • DAPODIK Sarpras
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Pusat Rekonsiliasi &amp; Penyelarasan Nasional
          </h1>
          <p className="text-xs text-slate-500 max-w-3xl">
            Solusi integrasi data inventaris sekolah ke ekosistem pemerintah: ekspor SIPD-BMD / SIMBADA BPKAD, rekonsiliasi belanja modal BKU ARKAS, sinkronisasi tabel sarpras Dapodik, dan dokumen berita acara legal formal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Printer className="w-4 h-4" /> Cetak Naskah Resmi
          </button>
        </div>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div className="no-print p-3 rounded-xl bg-emerald-800 text-white text-xs font-bold flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            {notification}
          </div>
          <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* National Readiness KPI Cards */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kesiapan SIPD-BMD</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{nationalStats.kesiapanSipdPercent}%</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>{nationalStats.berKode108} dari {nationalStats.total} aset ber-Kodefikasi 108</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Belanja Modal ARKAS</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">{formatRupiah(nationalStats.bkuBelanjaModal)}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Realisasi BKU Modal vs Aset Terdaftar</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kesiapan Sarpras Dapodik</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">100%</div>
          <div className="text-[11px] text-teal-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Format Sarana Siap Sync ke Operator</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Skor Kepatuhan BPKAD</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">{nationalStats.auditComplianceScore}%</div>
          <div className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{nationalStats.totalTemuan} anomali butuh tindak lanjut</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation Navigation Bar */}
      <div className="no-print bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveTab('sipd_bmd')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'sipd_bmd'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" /> SIPD-BMD / SIMBADA
        </button>

        <button
          onClick={() => setActiveTab('arkas_rekon')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'arkas_rekon'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> Rekonsiliasi ARKAS / BOSP
        </button>

        <button
          onClick={() => setActiveTab('dapodik_sarpras')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'dapodik_sarpras'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <School className="w-3.5 h-3.5" /> Sinkronisasi DAPODIK
        </button>

        <button
          onClick={() => setActiveTab('kamus_108')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'kamus_108'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-3.5 h-3.5" /> Kamus Permendagri 108
        </button>

        <button
          onClick={() => setActiveTab('audit_kepatuhan')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'audit_kepatuhan'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Audit BPKAD &amp; Regulasi
          {nationalStats.totalTemuan > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-extrabold ml-1">
              {nationalStats.totalTemuan}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('dokumen_pemda')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'dokumen_pemda'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" /> Berita Acara &amp; Label BMD
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SIPD-BMD & SIMBADA KEMENDAGRI (PERMENDAGRI NO. 108 / 47 / 19) */}
      {/* ========================================================================= */}
      {activeTab === 'sipd_bmd' && (
        <div className="space-y-4">
          <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari kode 108, NUP, nama aset..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-64 focus:outline-emerald-600"
                />
              </div>

              <select
                value={kibFilter}
                onChange={(e) => setKibFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                <option value="ALL">Semua Golongan KIB (A s.d. E)</option>
                <option value="KIB_A">KIB A (Tanah)</option>
                <option value="KIB_B">KIB B (Peralatan &amp; Mesin)</option>
                <option value="KIB_C">KIB C (Gedung &amp; Bangunan)</option>
                <option value="KIB_D">KIB D (Jalan, Jaringan, Irigasi)</option>
                <option value="KIB_E">KIB E (Aset Tetap Lainnya)</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAutoAssignPermendagri}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition"
                title="Petakan otomatis kode Permendagri 108 ke semua aset yang belum ber-kode"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Auto-Map Kodefikasi 108
              </button>

              <button
                onClick={handleAutoGenerateNup}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold transition"
                title="Beri nomor registrasi urut standar dinas (NUP)"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" /> Tetapkan NUP Urut
              </button>

              <button
                onClick={handleExportSipdBmd}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5" /> Ekspor Format SIPD-BMD (CSV)
              </button>
            </div>
          </div>

          {/* Tabel Buku Induk BMD SIPD */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div>
                <h3 className="text-xs md:text-sm font-black text-slate-900 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-800" />
                  Format Buku Induk Barang Milik Daerah (SIPD-BMD / SIMBADA)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Daftar aset terklasifikasi berdasarkan Permendagri No. 108/2016 lengkap dengan Nomor Urut Pendaftaran (NUP) &amp; Nilai Buku Akuntansi.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500">{filteredAssets.length} Rekord</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">NUP</th>
                    <th className="py-2.5 px-3">Kode BMD (Permendagri 108)</th>
                    <th className="py-2.5 px-3">Nama Barang / Spesifikasi</th>
                    <th className="py-2.5 px-3">Tahun</th>
                    <th className="py-2.5 px-3 text-right">Nilai Perolehan</th>
                    <th className="py-2.5 px-3 text-right">Akum. Penyusutan</th>
                    <th className="py-2.5 px-3 text-right">Nilai Buku</th>
                    <th className="py-2.5 px-3 text-center">Kondisi</th>
                    <th className="py-2.5 px-3">Ruangan / Lokasi</th>
                    <th className="py-2.5 px-3">Penanggung Jawab</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        Tidak ada aset yang sesuai kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset, idx) => {
                      const f = getAssetFinancials(asset);
                      return (
                        <tr key={asset.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-bold text-indigo-700">
                            {asset.nomorRegisterNup || <span className="text-amber-500 text-[10px]">Belum NUP</span>}
                          </td>
                          <td className="py-2 px-3 font-mono font-semibold text-emerald-800 text-[11px]">
                            {asset.kodeBmdPermendagri || <span className="text-amber-500 text-[10px]">Belum Kode 108</span>}
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-bold text-slate-800">{asset.namaBarang}</div>
                            <div className="text-[10px] text-slate-500 truncate max-w-xs">{asset.spesifikasi || asset.merk || '-'}</div>
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {asset.tahunPerolehan || asset.tanggalBku?.slice(0, 4) || '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">
                            {formatRupiah(f.totalNilai)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-rose-600 text-[11px]">
                            {formatRupiah(f.akumulasiPenyusutan)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                            {formatRupiah(f.nilaiBuku)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                asset.kondisi === 'BAIK'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : asset.kondisi === 'RUSAK_RINGAN'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {asset.kondisi === 'BAIK' ? 'Baik' : asset.kondisi === 'RUSAK_RINGAN' ? 'Rusak Ringan' : 'Rusak Berat'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">{asset.lokasi}</td>
                          <td className="py-2 px-3 text-slate-600 text-[11px] truncate max-w-[130px]">
                            {asset.penanggungJawab || <span className="text-rose-500 text-[10px]">Belum Ada PJ</span>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REKONSILIASI BELANJA MODAL ARKAS / BOSP KEMENDIKBUDRISTEK */}
      {/* ========================================================================= */}
      {activeTab === 'arkas_rekon' && (
        <div className="space-y-5">
          {/* Controls */}
          <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">Periode Triwulan Rekonsiliasi BOS / BOSP</h3>
              <p className="text-xs text-slate-500">Pilih triwulan laporan untuk mencocokkan realisasi BKU Belanja Modal dengan Kartu Inventaris.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                {(['TW1', 'TW2', 'TW3', 'TW4'] as const).map((tw) => (
                  <button
                    key={tw}
                    onClick={() => setSelectedTriwulan(tw)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      selectedTriwulan === tw ? 'bg-emerald-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tw === 'TW1' ? 'Triwulan I (Jan-Mar)' : tw === 'TW2' ? 'Triwulan II (Apr-Jun)' : tw === 'TW3' ? 'Triwulan III (Jul-Sep)' : 'Triwulan IV (Okt-Des)'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak Berita Acara Rekon
              </button>
            </div>
          </div>

          {/* Ringkasan Rekonsiliasi Triwulan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Belanja Modal BKU ARKAS</span>
              <div className="text-xl font-black text-slate-900 mt-1">{formatRupiah(rekonData.totalBelanjaModal)}</div>
              <span className="text-[11px] text-slate-500 mt-1 block">{rekonData.belanjaModal.length} transaksi belanja modal BOS</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tercatat di Kartu Inventaris</span>
              <div className="text-xl font-black text-emerald-700 mt-1">{formatRupiah(rekonData.totalAsetTerdaftar)}</div>
              <span className="text-[11px] text-emerald-600 mt-1 block">{rekonData.asetTriwulan.length} unit aset teregistrasi</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Status Selisih Rekonsiliasi</span>
              <div className={`text-xl font-black mt-1 ${rekonData.selisihModal === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {rekonData.selisihModal === 0 ? 'SESUAI (0 SELISIH)' : formatRupiah(rekonData.selisihModal)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {rekonData.selisihModal === 0 ? 'Data buku kas dan kartu inventaris sinkron 100%' : 'Ada selisih pembukuan kas vs aset'}
              </span>
            </div>
          </div>

          {/* Lembar Resmi Berita Acara Rekonsiliasi Triwulanan Siap Cetak */}
          <div className="bg-white p-6 md:p-10 rounded-2xl border border-slate-300 shadow-md font-serif text-slate-900 text-sm leading-relaxed">
            {/* Kop Surat Sekolah */}
            <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
              <h4 className="text-xs font-bold tracking-widest uppercase text-slate-700">
                {config.dinasPendidikan || 'PEMERINTAH KABUPATEN BANDUNG BARAT - DINAS PENDIDIKAN'}
              </h4>
              <h2 className="text-lg md:text-xl font-black tracking-wider uppercase text-slate-900 mt-0.5">
                {config.schoolName}
              </h2>
              <p className="text-[11px] font-sans text-slate-600 mt-1">
                NPSN: {config.npsn} • Alamat: {config.address} • Email: {config.emailSekolah || 'sdn01mekarsari@sekolah.belajar.id'}
              </p>
            </div>

            {/* Judul Naskah */}
            <div className="text-center my-4">
              <h3 className="text-base font-black uppercase underline decoration-2">
                BERITA ACARA REKONSILIASI ASET &amp; BELANJA MODAL DANA BOSP
              </h3>
              <p className="text-xs font-sans text-slate-600 mt-1">
                Nomor: 028 / BAP-REKON-BOS / {selectedTriwulan} / {currentYear}
              </p>
            </div>

            <p className="font-sans text-xs text-justify indent-8 mb-4">
              Pada hari ini, bertepatan dengan akhir periode {selectedTriwulan} Tahun Anggaran {config.tahunAnggaranAktif || currentYear}, kami yang bertanda tangan di bawah ini Tim Manajemen Pengelola BOSP dan Pengurus Barang Milik Daerah pada <strong>{config.schoolName}</strong>, telah melakukan rekonsiliasi data pembukuan Buku Kas Umum (BKU) Belanja Modal ARKAS dengan Buku Induk Inventaris Barang, dengan rincian sebagai berikut:
            </p>

            {/* Tabel Rincian Belanja Modal */}
            <div className="my-4 font-sans text-xs">
              <table className="w-full border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold text-center">
                    <th className="border border-slate-300 p-2">No</th>
                    <th className="border border-slate-300 p-2">Uraian Rekening Belanja Modal</th>
                    <th className="border border-slate-300 p-2">Sumber Anggaran</th>
                    <th className="border border-slate-300 p-2">Realisasi BKU (Rp)</th>
                    <th className="border border-slate-300 p-2">Nilai Aset Masuk (Rp)</th>
                    <th className="border border-slate-300 p-2">Selisih</th>
                  </tr>
                </thead>
                <tbody>
                  {rekonData.belanjaModal.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border border-slate-300 p-3 text-center text-slate-500 italic">
                        Tidak ada transaksi Belanja Modal pada {selectedTriwulan}.
                      </td>
                    </tr>
                  ) : (
                    rekonData.belanjaModal.map((bm, idx) => (
                      <tr key={bm.id}>
                        <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 font-semibold">
                          {bm.namaBarang} ({bm.jumlah} {bm.jenisSatuan})
                          <div className="text-[10px] text-slate-500 font-mono">Kode Rek: {bm.kodeRekeningRkas} • No. BKU: {bm.nomorBku}</div>
                        </td>
                        <td className="border border-slate-300 p-2 text-center">{bm.sumberAnggaran}</td>
                        <td className="border border-slate-300 p-2 text-right font-mono">{formatRupiah(bm.totalPengadaan)}</td>
                        <td className="border border-slate-300 p-2 text-right font-mono">{formatRupiah(bm.totalPengadaan)}</td>
                        <td className="border border-slate-300 p-2 text-center font-bold text-emerald-700">Rp 0</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={3} className="border border-slate-300 p-2 text-right">TOTAL REALISASI MODAL {selectedTriwulan}:</td>
                    <td className="border border-slate-300 p-2 text-right font-mono">{formatRupiah(rekonData.totalBelanjaModal)}</td>
                    <td className="border border-slate-300 p-2 text-right font-mono">{formatRupiah(rekonData.totalAsetTerdaftar)}</td>
                    <td className="border border-slate-300 p-2 text-center text-emerald-700 font-mono">Rp 0</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="font-sans text-xs text-justify mb-8 leading-relaxed">
              Berdasarkan hasil pencocokan fisik dan administrasi, seluruh barang hasil pengadaan Belanja Modal tersebut di atas telah diterima dalam keadaan baik, telah diberi Nomor Urut Pendaftaran (NUP) serta label registrasi inventaris, dan telah dicatat ke dalam Buku Inventaris Aset Tetap (KIB) {config.schoolName}. Berita Acara ini dibuat dengan sebenarnya untuk digunakan sebagai bahan pertanggungjawaban SPJ BOSP dan pemutakhiran data SIMBADA / SIPD-BMD.
            </p>

            {/* Tanda Tangan Tim Pengelola */}
            <div className="grid grid-cols-3 gap-6 text-center font-sans text-xs pt-4">
              <div>
                <p className="text-slate-600">Pengurus Barang Pembantu,</p>
                <div className="h-20" />
                <p className="font-bold underline uppercase">{config.warehouseOfficer}</p>
                <p className="text-slate-500 text-[11px]">NIP. {config.warehouseOfficerNip}</p>
              </div>

              <div>
                <p className="text-slate-600">Bendahara BOSP,</p>
                <div className="h-20" />
                <p className="font-bold underline uppercase">{config.treasurer}</p>
                <p className="text-slate-500 text-[11px]">NIP. {config.treasurerNip}</p>
              </div>

              <div>
                <p className="text-slate-600">Mengetahui,<br />Kepala Sekolah</p>
                <div className="h-16" />
                <p className="font-bold underline uppercase">{config.headmaster}</p>
                <p className="text-slate-500 text-[11px]">NIP. {config.headmasterNip}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SINKRONISASI SARPRAS DAPODIK KEMENDIKBUDRISTEK */}
      {/* ========================================================================= */}
      {activeTab === 'dapodik_sarpras' && (
        <div className="space-y-4">
          <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <School className="w-4 h-4 text-emerald-800" /> Format Tabel Sarana &amp; Prasarana DAPODIK
              </h3>
              <p className="text-xs text-slate-500">
                Data terformat sesuai modul Sarpras Aplikasi Dapodik (Tabel Sarana per Ruang, Status Laik / Rusak, &amp; Kepemilikan).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportDapodikSarpras}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Format Impor Dapodik (CSV)
              </button>
            </div>
          </div>

          {/* Tabel Sarana Dapodik */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pemetaan Sarana per Ruangan Sekolah ({assets.length} Item Sarana Terdaftar)
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                100% Siap Salin ke Dapodik
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Jenis Sarana</th>
                    <th className="py-2.5 px-3">Nama &amp; Spesifikasi</th>
                    <th className="py-2.5 px-3">Letak Ruang</th>
                    <th className="py-2.5 px-3">Kepemilikan</th>
                    <th className="py-2.5 px-3 text-center">Jml Total</th>
                    <th className="py-2.5 px-3 text-center">Laik</th>
                    <th className="py-2.5 px-3 text-center">Rusak Ringan</th>
                    <th className="py-2.5 px-3 text-center">Rusak Berat</th>
                    <th className="py-2.5 px-3">Sumber Dana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assets.map((a, idx) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-slate-800">{a.namaBarang}</td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">{a.merk || a.spesifikasi || '-'}</td>
                      <td className="py-2 px-3 font-semibold text-indigo-700 text-[11px]">{a.lokasi}</td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">Milik Sendiri</td>
                      <td className="py-2 px-3 text-center font-bold">{a.jumlah || 1}</td>
                      <td className="py-2 px-3 text-center font-bold text-emerald-700">{a.kondisi === 'BAIK' ? a.jumlah : 0}</td>
                      <td className="py-2 px-3 text-center font-bold text-amber-600">{a.kondisi === 'RUSAK_RINGAN' ? a.jumlah : 0}</td>
                      <td className="py-2 px-3 text-center font-bold text-rose-600">{a.kondisi === 'RUSAK_BERAT' ? a.jumlah : 0}</td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">{a.asalUsul || 'BOS Reguler'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: KAMUS STANDAR KODEFIKASI PERMENDAGRI 108 */}
      {/* ========================================================================= */}
      {activeTab === 'kamus_108' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama barang atau kode Permendagri..."
                  value={kamusSearch}
                  onChange={(e) => setKamusSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-72 focus:outline-emerald-600"
                />
              </div>

              <select
                value={kamusKibFilter}
                onChange={(e) => setKamusKibFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                <option value="ALL">Semua Kategori KIB</option>
                <option value="KIB_A">KIB A (Tanah)</option>
                <option value="KIB_B">KIB B (Peralatan &amp; Mesin)</option>
                <option value="KIB_C">KIB C (Gedung &amp; Bangunan)</option>
                <option value="KIB_D">KIB D (Jaringan &amp; Irigasi)</option>
                <option value="KIB_E">KIB E (Aset Tetap Lainnya)</option>
              </select>
            </div>

            <button
              onClick={handleAutoAssignPermendagri}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> Terapkan ke Seluruh Aset Sekolah
            </button>
          </div>

          {/* Grid Kamus */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredKamus.map((item) => (
              <div key={item.kode} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {item.kib}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Masa Manfaat: {item.masaManfaatDefault} Thn
                  </span>
                </div>
                <div className="font-mono text-xs font-bold text-emerald-700 tracking-tight">{item.kode}</div>
                <h4 className="font-bold text-xs text-slate-900 leading-snug">{item.nama}</h4>
                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span>Satuan: {item.satuanDefault}</span>
                  <span className="font-mono text-[10px] text-slate-400">Rek: {item.rekeningArkasDefault}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AUDIT KEPATUHAN & VALIDASI NASIONAL (BPKAD / INSPEKTORAT) */}
      {/* ========================================================================= */}
      {activeTab === 'audit_kepatuhan' && (
        <div className="space-y-4">
          {/* Header & Quick Action */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-800" />
                Panel Audit Kepatuhan &amp; Validasi Regulasi (BPKAD &amp; Inspektorat)
              </h3>
              <p className="text-xs text-slate-500">
                Pemeriksaan otomatis anomali administrasi, aset tanpa kodefikasi nasional, aset masa manfaat habis, dan aset tanpa penanggung jawab.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  handleAutoAssignPermendagri();
                  handleAutoGenerateNup();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
              >
                <Sparkles className="w-3.5 h-3.5" /> Selesaikan Semua Anomali Otomatis
              </button>
            </div>
          </div>

          {/* Daftar Temuan Anomali */}
          <div className="space-y-3">
            {/* Temuan 1: Aset belum ada kodefikasi Permendagri 108 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl mt-0.5 ${nationalStats.tanpaKode108.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {nationalStats.tanpaKode108.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="font-bold text-xs md:text-sm text-slate-900">
                    Standar Kodefikasi Barang Milik Daerah (Permendagri No. 108/2016)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {nationalStats.tanpaKode108.length > 0
                      ? `Terdapat ${nationalStats.tanpaKode108.length} aset yang belum memiliki kodefikasi Permendagri 108 resmi.`
                      : 'Semua aset sekolah telah memenuhi standar Kodefikasi Permendagri No. 108/2016.'}
                  </p>
                </div>
              </div>

              {nationalStats.tanpaKode108.length > 0 && (
                <button
                  onClick={handleAutoAssignPermendagri}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold shrink-0 transition"
                >
                  Perbaiki Otomatis
                </button>
              )}
            </div>

            {/* Temuan 2: Aset belum memiliki NUP */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl mt-0.5 ${nationalStats.tanpaNup.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {nationalStats.tanpaNup.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="font-bold text-xs md:text-sm text-slate-900">
                    Nomor Urut Pendaftaran (NUP) Pemda BPKAD
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {nationalStats.tanpaNup.length > 0
                      ? `Terdapat ${nationalStats.tanpaNup.length} aset tanpa nomor register NUP yang sah.`
                      : 'Semua aset telah teregistrasi dengan Nomor Urut Pendaftaran (NUP) berurutan.'}
                  </p>
                </div>
              </div>

              {nationalStats.tanpaNup.length > 0 && (
                <button
                  onClick={handleAutoGenerateNup}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 text-xs font-bold shrink-0 transition"
                >
                  Generate NUP
                </button>
              )}
            </div>

            {/* Temuan 3: Aset habis masa manfaat (nilai buku 0) belum dihapuskan */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl mt-0.5 ${nationalStats.habisMasaManfaat.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {nationalStats.habisMasaManfaat.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="font-bold text-xs md:text-sm text-slate-900">
                    Aset Habis Masa Manfaat / Nilai Buku Rp 0 (SAP PMK / Permendagri 47)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {nationalStats.habisMasaManfaat.length > 0
                      ? `Terdapat ${nationalStats.habisMasaManfaat.length} aset dengan usia melebihi masa manfaat ekonomis yang masih berstatus Aktif.`
                      : 'Tidak ada aset yang terindikasi melampaui masa manfaat tanpa pengawasan.'}
                  </p>
                </div>
              </div>

              {nationalStats.habisMasaManfaat.length > 0 && (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                  Uji Kelayakan Diperlukan
                </span>
              )}
            </div>

            {/* Temuan 4: Aset tanpa penanggung jawab ruangan */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl mt-0.5 ${nationalStats.tanpaPj.length > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {nationalStats.tanpaPj.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="font-bold text-xs md:text-sm text-slate-900">
                    Aset Tak Bertuan (Tanpa Penanggung Jawab Ruangan / KIR)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {nationalStats.tanpaPj.length > 0
                      ? `Terdapat ${nationalStats.tanpaPj.length} aset yang belum ditentukan guru/pegawai penanggung jawabnya.`
                      : 'Semua aset telah terikat dengan Kartu Inventaris Ruangan (KIR) dan penanggung jawab.'}
                  </p>
                </div>
              </div>

              {nationalStats.tanpaPj.length > 0 && (
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200">
                  Wajib Tetapkan PJ
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: DOKUMEN LEGAL FORMAL PEMDA & LABEL STIKER BMD */}
      {/* ========================================================================= */}
      {activeTab === 'dokumen_pemda' && (
        <div className="space-y-6">
          <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Cetak Label Stiker Inventaris Standar Dinas BMD</h3>
              <p className="text-xs text-slate-500">Format stiker barcode resmi dengan Logo Pemda / Tut Wuri Handayani, Nomor NUP, &amp; Kodefikasi 108.</p>
            </div>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak Lembar Stiker BMD (PDF)
            </button>
          </div>

          {/* Stiker Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {assets.slice(0, 9).map((asset) => (
              <div
                key={asset.id}
                className="bg-white border-2 border-slate-800 rounded-xl p-3.5 text-slate-900 shadow-xs relative flex flex-col justify-between"
              >
                <div>
                  <div className="border-b border-slate-400 pb-1.5 mb-2 text-center">
                    <p className="text-[9px] font-bold tracking-wider uppercase text-slate-600">
                      {config.dinasPendidikan || 'PEMERINTAH DAERAH'}
                    </p>
                    <p className="text-[11px] font-black uppercase text-slate-900">{config.schoolName}</p>
                    <p className="text-[9px] font-bold text-emerald-800">BARANG MILIK DAERAH (BMD)</p>
                  </div>

                  <div className="space-y-1 text-[10px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kode BMD:</span>
                      <span className="font-bold text-slate-900">{asset.kodeBmdPermendagri || '1.3.2.05...'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">No. Register / NUP:</span>
                      <span className="font-bold text-indigo-700">{asset.nomorRegisterNup || '0001'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kode Aset:</span>
                      <span className="font-bold">{asset.kodeAset}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tahun Perolehan:</span>
                      <span>{asset.tahunPerolehan || asset.tanggalBku?.slice(0, 4) || '2026'}</span>
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-200">
                    <p className="text-[11px] font-bold text-slate-900 truncate">{asset.namaBarang}</p>
                    <p className="text-[9px] text-slate-500 truncate">{asset.lokasi} • PJ: {asset.penanggungJawab}</p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] font-sans text-slate-400">
                  <span>Dilarang Merusak / Memindahkan</span>
                  <span className="font-mono font-bold text-slate-700">KIB: {asset.kibKategori || 'B'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
