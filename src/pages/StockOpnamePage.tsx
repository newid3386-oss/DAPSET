import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Plus,
  Search,
  Download,
  Trash2,
  X,
  Check,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Layers,
  Sparkles,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { StockOpnameRecord } from '../types';
import { formatTanggalIndo } from '../utils/format';
import { OfficialDocumentModal, OfficialDocumentData } from '../components/OfficialDocumentModal';
import { AdvancedExportModal } from '../components/AdvancedExportModal';
import { AdvancedImportModal } from '../components/AdvancedImportModal';

export const StockOpnamePage: React.FC = () => {
  const {
    stockOpname,
    stockSummary,
    items,
    config,
    activeUser,
    addStockOpname,
    batchAddStockOpname,
    deleteStockOpname,
  } = useInventory();
  const { showToast, confirmDialog } = useToast();

  const [activeTab, setActiveTab] = useState<'riwayat' | 'massal'>('massal');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docModalData, setDocModalData] = useState<OfficialDocumentData | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const stockOpnameColumns = [
    { key: 'tanggal', label: 'Tanggal Opname' },
    { key: 'kodeBarang', label: 'Kode Barang' },
    { key: 'namaBarang', label: 'Nama Barang' },
    { key: 'stokSistem', label: 'Stok Sistem' },
    { key: 'stokFisik', label: 'Stok Fisik' },
    { key: 'selisih', label: 'Selisih (Varian)' },
    { key: 'jenisSatuan', label: 'Satuan' },
    { key: 'lokasi', label: 'Lokasi Simpan' },
    { key: 'tindakan', label: 'Tindakan Rekonsiliasi' },
    { key: 'petugas', label: 'Petugas Audit' },
    { key: 'keterangan', label: 'Keterangan' },
  ];

  // Bulk audit state: map of kodeBarang -> physical count
  const [physicalCounts, setPhysicalCounts] = useState<{ [kodeBarang: string]: number }>(() => {
    const initialMap: { [kodeBarang: string]: number } = {};
    stockSummary.forEach((s) => {
      initialMap[s.kodeBarang] = s.stok;
    });
    return initialMap;
  });

  const [auditDate, setAuditDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [auditLokasi, setAuditLokasi] = useState<string>('Gudang Persediaan Utama');
  const [auditPetugas, setAuditPetugas] = useState<string>(activeUser.nama);

  // Single add modal form data
  const [formData, setFormData] = useState<Omit<StockOpnameRecord, 'id' | 'timestamp' | 'selisih'>>({
    tanggal: new Date().toISOString().slice(0, 10),
    kodeBarang: items[0]?.kodeBarang || '',
    namaBarang: items[0]?.namaBarang || '',
    stokSistem: 0,
    stokFisik: 0,
    jenisSatuan: items[0]?.jenisSatuan || 'Rim',
    lokasi: 'Gudang Persediaan',
    petugas: activeUser.nama,
    tindakan: 'Sesuai dengan pencatatan fisik',
    keterangan: 'Pemeriksaan opname berkala',
  });

  // Filtered list for Riwayat
  const filteredRiwayat = stockOpname.filter(
    (so) =>
      so.kodeBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      so.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      so.lokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      so.petugas.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered list for Massal
  const filteredMassal = useMemo(() => {
    return stockSummary.filter((s) => {
      const matchSearch =
        s.kodeBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.namaBarang.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || s.kategori === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [stockSummary, searchQuery, categoryFilter]);

  // Bulk stats
  const bulkStats = useMemo(() => {
    let klopCount = 0;
    let lebihCount = 0;
    let kurangCount = 0;

    stockSummary.forEach((s) => {
      const fisik = physicalCounts[s.kodeBarang] ?? s.stok;
      const selisih = fisik - s.stok;
      if (selisih === 0) klopCount += 1;
      else if (selisih > 0) lebihCount += 1;
      else kurangCount += 1;
    });

    return { klopCount, lebihCount, kurangCount };
  }, [stockSummary, physicalCounts]);

  const handleSetAllMatching = () => {
    const updated: { [kodeBarang: string]: number } = {};
    stockSummary.forEach((s) => {
      updated[s.kodeBarang] = s.stok;
    });
    setPhysicalCounts(updated);
    setFeedbackMsg('Semua stok fisik berhasil diisi otomatis sesuai stok sistem.');
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handlePhysicalChange = (code: string, value: number) => {
    setPhysicalCounts((prev) => ({
      ...prev,
      [code]: Math.max(0, value),
    }));
  };

  const handleSaveBulkAudit = () => {
    const recordsToSave = stockSummary.map((s) => {
      const fisik = physicalCounts[s.kodeBarang] ?? s.stok;
      const selisih = fisik - s.stok;
      let tindakan = 'Sesuai dengan pencatatan fisik gudang';
      if (selisih > 0) tindakan = `Penyesuaian lebih fisik +${selisih}`;
      if (selisih < 0) tindakan = `Penyesuaian susut/kurang fisik ${selisih}`;

      return {
        tanggal: auditDate,
        kodeBarang: s.kodeBarang,
        namaBarang: s.namaBarang,
        stokSistem: s.stok,
        stokFisik: fisik,
        jenisSatuan: s.jenisSatuan,
        lokasi: auditLokasi,
        petugas: auditPetugas,
        tindakan,
        keterangan: 'Hasil Stock Opname Serentak Triwulan Sekolah',
      };
    });

    batchAddStockOpname(recordsToSave);
    setFeedbackMsg(`Berhasil merekam stock opname untuk ${recordsToSave.length} barang persediaan!`);
    setTimeout(() => {
      setFeedbackMsg('');
      setActiveTab('riwayat');
    }, 1500);
  };

  const handleOpenPrintBahp = () => {
    const docItems = stockSummary.map((s) => {
      const fisik = physicalCounts[s.kodeBarang] ?? s.stok;
      const selisih = fisik - s.stok;
      return {
        namaBarang: s.namaBarang,
        kodeBarang: s.kodeBarang,
        jumlah: fisik, // physical count
        jenisSatuan: s.jenisSatuan,
        hargaSatuan: s.stok, // system count
        total: selisih, // diff
      };
    });

    setDocModalData({
      type: 'BAHP',
      title: 'BERITA ACARA HASIL PEMERIKSAAN FISIK PERSEDIAAN (BAHP)',
      nomorSurat: `... / BAHP-BOS / ${new Date().getFullYear()}`,
      tanggal: auditDate,
      items: docItems,
      keterangan: `Pemeriksaan stock opname berkala persediaan sekolah tahun anggaran ${new Date().getFullYear()}`,
    });
    setIsDocModalOpen(true);
  };

  const handleSelectItem = (code: string) => {
    const s = stockSummary.find((it) => it.kodeBarang === code);
    const item = items.find((it) => it.kodeBarang === code);
    if (s && item) {
      setFormData((prev) => ({
        ...prev,
        kodeBarang: s.kodeBarang,
        namaBarang: s.namaBarang,
        stokSistem: s.stok,
        stokFisik: s.stok,
        jenisSatuan: s.jenisSatuan,
        lokasi: item.lokasiDefault || 'Gudang Persediaan',
      }));
    }
  };

  const handleOpenAdd = () => {
    const firstCode = items[0]?.kodeBarang || '';
    const s = stockSummary.find((it) => it.kodeBarang === firstCode);
    setFormData({
      tanggal: new Date().toISOString().slice(0, 10),
      kodeBarang: firstCode,
      namaBarang: items[0]?.namaBarang || '',
      stokSistem: s ? s.stok : 0,
      stokFisik: s ? s.stok : 0,
      jenisSatuan: items[0]?.jenisSatuan || 'Rim',
      lokasi: items[0]?.lokasiDefault || 'Gudang Persediaan',
      petugas: activeUser.nama,
      tindakan: 'Sesuai fisik gudang',
      keterangan: 'Stock opname berkala',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kodeBarang) {
      showToast('Pilih barang yang akan di-opname.', 'warning');
      return;
    }

    addStockOpname(formData);
    showToast(`Stock opname untuk "${formData.namaBarang}" berhasil dicatat!`, 'success');
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Catatan Stock Opname?',
      message: `Hapus catatan stock opname "${name}"?`,
      confirmText: 'Hapus Catatan',
      variant: 'danger',
    });
    if (confirmed) {
      deleteStockOpname(id);
      showToast(`Catatan stock opname "${name}" berhasil dihapus.`, 'info');
    }
  };

  const computedSelisih = Number(formData.stokFisik) - Number(formData.stokSistem);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-emerald-800" /> Stock Opname Fisik Persediaan
          </h2>
          <p className="text-xs text-slate-500">
            Pemeriksaan dan rekonsiliasi berkala antara stok tercatat di sistem dengan hitungan fisik riil di gudang sekolah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'massal' && (
            <button
              onClick={handleOpenPrintBahp}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-bold transition shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-teal-700" /> Cetak Berita Acara (BAHP)
            </button>
          )}

          {activeTab === 'riwayat' && (
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-bold transition shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-teal-700" /> Cetak Riwayat Opname
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            title="Mode Cetak Laporan (Sembunyikan navigasi & menu)"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" /> Mode Cetak Laporan
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 rotate-180 text-slate-600" /> Impor (Excel / CSV)
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Ekspor Hasil Opname
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Input Satuan
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('massal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'massal'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" /> Lembar Kerja Audit Serentak Gudang (Bulk Audit)
        </button>
        <button
          onClick={() => setActiveTab('riwayat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'riwayat'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" /> Riwayat Hasil Opname ({stockOpname.length})
        </button>
      </div>

      {/* VIEW 1: LEMBAR KERJA MASSAL */}
      {activeTab === 'massal' && (
        <div className="space-y-4">
          {/* Quick Header Config & Audit Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                Total Barang Diperiksa
              </span>
              <div className="text-2xl font-black text-slate-900">{stockSummary.length}</div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Item aktif di persediaan</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-100 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-700 uppercase block mb-1">
                Fisik Klop (Sesuai)
              </span>
              <div className="text-2xl font-black text-emerald-900">{bulkStats.klopCount}</div>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">Stok fisik = Stok sistem</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 shadow-xs">
              <span className="text-[11px] font-bold text-blue-700 uppercase block mb-1">
                Selisih Lebih (+)
              </span>
              <div className="text-2xl font-black text-blue-900">{bulkStats.lebihCount}</div>
              <span className="text-[10px] text-blue-600 mt-0.5 block">Fisik lebih banyak dari buku</span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-100 shadow-xs">
              <span className="text-[11px] font-bold text-rose-700 uppercase block mb-1">
                Selisih Kurang (-)
              </span>
              <div className="text-2xl font-black text-rose-900">{bulkStats.kurangCount}</div>
              <span className="text-[10px] text-rose-600 mt-0.5 block">Potensi susut / belum dibukukan</span>
            </div>
          </div>

          {/* Audit Parameters & Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tanggal Audit Fisik</label>
                <input
                  type="date"
                  value={auditDate}
                  onChange={(e) => setAuditDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Lokasi Gudang / Ruangan</label>
                <input
                  type="text"
                  value={auditLokasi}
                  onChange={(e) => setAuditLokasi(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Petugas Pemeriksa</label>
                <input
                  type="text"
                  value={auditPetugas}
                  onChange={(e) => setAuditPetugas(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari kode atau nama barang..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700"
                >
                  <option value="ALL">Semua Kategori</option>
                  <option value="ATK">ATK</option>
                  <option value="Kebersihan">Kebersihan</option>
                  <option value="Elektronik">Elektronik</option>
                  <option value="Mebel">Mebel</option>
                  <option value="Laboratorium">Laboratorium</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSetAllMatching}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                  title="Salin semua angka stok sistem ke input fisik"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Set Semua = Stok Sistem
                </button>
                <button
                  onClick={handleSaveBulkAudit}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md"
                >
                  <Check className="w-4 h-4" /> Simpan Hasil Opname ({stockSummary.length} Barang)
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Audit Worksheet Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">No</th>
                    <th className="px-4 py-3">Kode Barang</th>
                    <th className="px-4 py-3">Nama Barang</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3 text-center">Stok Sistem</th>
                    <th className="px-4 py-3 text-center w-36">Hitungan Fisik Riil</th>
                    <th className="px-4 py-3 text-center">Selisih</th>
                    <th className="px-4 py-3 text-center">Status Rekonsiliasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMassal.map((item, idx) => {
                    const fisik = physicalCounts[item.kodeBarang] ?? item.stok;
                    const selisih = fisik - item.stok;

                    return (
                      <tr
                        key={item.kodeBarang}
                        className={`transition ${
                          selisih !== 0
                            ? selisih > 0
                              ? 'bg-blue-50/30 hover:bg-blue-50/50'
                              : 'bg-rose-50/30 hover:bg-rose-50/50'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="px-4 py-2.5 text-center text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-mono font-bold text-slate-700">
                          {item.kodeBarang}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-slate-900">
                          {item.namaBarang}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">{item.kategori}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-slate-800">
                          {item.stok} {item.jenisSatuan}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={fisik}
                              onChange={(e) =>
                                handlePhysicalChange(item.kodeBarang, Number(e.target.value))
                              }
                              className={`w-20 px-2 py-1 text-center font-bold rounded-lg border text-xs focus:outline-none focus:ring-2 ${
                                selisih === 0
                                  ? 'border-emerald-300 bg-white text-emerald-950 focus:ring-emerald-500'
                                  : selisih > 0
                                  ? 'border-blue-400 bg-blue-50 text-blue-900 focus:ring-blue-500'
                                  : 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500'
                              }`}
                            />
                            <span className="text-[10px] text-slate-500 font-medium">
                              {item.jenisSatuan}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-center font-bold font-mono">
                          {selisih === 0 ? (
                            <span className="text-emerald-700">0</span>
                          ) : selisih > 0 ? (
                            <span className="text-blue-700 font-bold">+{selisih}</span>
                          ) : (
                            <span className="text-rose-700 font-bold">{selisih}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {selisih === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sesuai
                            </span>
                          ) : selisih > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                              Lebih ({selisih})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                              Kurang ({selisih})
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: RIWAYAT STOCK OPNAME */}
      {activeTab === 'riwayat' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari data opname berdasarkan kode, nama barang, lokasi, petugas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Tanggal Opname</th>
                    <th className="px-4 py-3">Barang</th>
                    <th className="px-4 py-3 text-center">Stok Sistem</th>
                    <th className="px-4 py-3 text-center">Stok Fisik</th>
                    <th className="px-4 py-3 text-center">Selisih (Varian)</th>
                    <th className="px-4 py-3">Lokasi</th>
                    <th className="px-4 py-3">Tindakan Rekonsiliasi</th>
                    <th className="px-4 py-3">Petugas</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRiwayat.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                        Belum ada riwayat stock opname fisik yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    filteredRiwayat.map((so) => (
                      <tr key={so.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700">
                          {formatTanggalIndo(so.tanggal)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div>{so.namaBarang}</div>
                          <span className="font-mono text-[10px] text-slate-400">{so.kodeBarang}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700">
                          {so.stokSistem} {so.jenisSatuan}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-900">
                          {so.stokFisik} {so.jenisSatuan}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {so.selisih === 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Cocok (0)
                            </span>
                          ) : so.selisih > 0 ? (
                            <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full">
                              Lebih (+{so.selisih})
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded-full">
                              Kurang ({so.selisih})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{so.lokasi}</td>
                        <td className="px-4 py-3 text-slate-700 font-medium truncate max-w-[180px]">
                          {so.tindakan}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">{so.petugas}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDelete(so.id, so.namaBarang)}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Input Satuan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Catat Stock Opname Fisik Satuan</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Pemeriksaan</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lokasi Gudang</label>
                  <input
                    type="text"
                    required
                    value={formData.lokasi}
                    onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Barang</label>
                <select
                  value={formData.kodeBarang}
                  onChange={(e) => handleSelectItem(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.kodeBarang}>
                      {it.kodeBarang} - {it.namaBarang} ({it.jenisSatuan})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Stok di Sistem</label>
                  <input
                    type="number"
                    disabled
                    value={formData.stokSistem}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-700 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Hasil Hitungan Fisik</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stokFisik}
                    onChange={(e) => setFormData({ ...formData, stokFisik: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-400 bg-white font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Status Selisih Preview */}
              <div
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                  computedSelisih === 0
                    ? 'bg-emerald-50 text-emerald-800'
                    : computedSelisih > 0
                    ? 'bg-blue-50 text-blue-800'
                    : 'bg-rose-50 text-rose-800'
                }`}
              >
                <span>Status Selisih (Varian):</span>
                <span className="font-bold">
                  {computedSelisih === 0
                    ? '0 (Sesuai)'
                    : computedSelisih > 0
                    ? `+${computedSelisih} (Lebih Fisik)`
                    : `${computedSelisih} (Kurang Fisik)`}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tindakan Rekonsiliasi</label>
                <input
                  type="text"
                  required
                  value={formData.tindakan}
                  onChange={(e) => setFormData({ ...formData, tindakan: e.target.value })}
                  placeholder="Contoh: Penyesuaian saldo buku BKU pembantu"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Petugas Pemeriksa</label>
                  <input
                    type="text"
                    required
                    value={formData.petugas}
                    onChange={(e) => setFormData({ ...formData, petugas: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Keterangan Tambahan</label>
                  <input
                    type="text"
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official BAHP Print Modal */}
      {isDocModalOpen && docModalData && (
        <OfficialDocumentModal
          isOpen={isDocModalOpen}
          onClose={() => setIsDocModalOpen(false)}
          config={config}
          data={docModalData}
        />
      )}
      {/* Advanced Import Modal */}
      <AdvancedImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        type="STOCK_OPNAME"
      />

      {/* Advanced Export Modal */}
      <AdvancedExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Ekspor Hasil Stock Opname Fisik"
        defaultFilename="Laporan_Hasil_Stock_Opname"
        data={stockOpname}
        availableColumns={stockOpnameColumns}
        schoolConfig={config}
      />
    </div>
  );
};
