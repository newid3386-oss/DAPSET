import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowDownToLine,
  Plus,
  Search,
  Camera,
  Download,
  Trash2,
  X,
  Check,
  Calendar,
  FileText,
  FileCheck,
  Layers,
  Coins,
  Store,
  Printer,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { BarangMasuk, MasterItem } from '../types';
import { formatRupiah, formatTanggalIndo } from '../utils/format';
import { OfficialDocumentModal, OfficialDocumentData, BastItem } from '../components/OfficialDocumentModal';
import { AdvancedExportModal } from '../components/AdvancedExportModal';
import { AdvancedImportModal } from '../components/AdvancedImportModal';

interface BarangMasukPageProps {
  onOpenScanReceipt: () => void;
  prefilledFromScan?: any;
  onNavigate?: (page: any) => void;
}

interface MultiInvoiceItemRow {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  jumlah: number;
  jenisSatuan: string;
  hargaSatuan: number;
  kodeRekeningRkas: string;
}

export const BarangMasukPage: React.FC<BarangMasukPageProps> = ({
  onOpenScanReceipt,
  prefilledFromScan,
  onNavigate,
}) => {
  const {
    barangMasuk,
    items,
    suppliers,
    config,
    activeUser,
    addBarangMasuk,
    addBarangMasukBatch,
    deleteBarangMasuk,
  } = useInventory();
  const { showToast, confirmDialog } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSumberDana, setFilterSumberDana] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMultiModalOpen, setIsMultiModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [docModalData, setDocModalData] = useState<OfficialDocumentData | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const barangMasukColumns = [
    { key: 'tanggal', label: 'Tanggal Belanja' },
    { key: 'bulanPengadaan', label: 'Bulan Anggaran' },
    { key: 'nomorBku', label: 'Nomor BKU' },
    { key: 'nomorKwitansi', label: 'Nomor Kuitansi' },
    { key: 'namaToko', label: 'Toko / Rekanan' },
    { key: 'kodeBarang', label: 'Kode Barang' },
    { key: 'namaBarang', label: 'Nama Barang' },
    { key: 'jumlah', label: 'Volume Jumlah' },
    { key: 'jenisSatuan', label: 'Satuan' },
    { key: 'hargaSatuan', label: 'Harga Satuan (Rp)', format: (val: any) => formatRupiah(val) },
    { key: 'totalPengadaan', label: 'Total Belanja (Rp)', format: (val: any) => formatRupiah(val) },
    { key: 'sumberAnggaran', label: 'Sumber Dana' },
    { key: 'kodeRekeningRkas', label: 'Kode Rekening RKAS' },
    { key: 'petugas', label: 'Petugas' },
    { key: 'keterangan', label: 'Keterangan' },
  ];

  // Single Item form data
  const [formData, setFormData] = useState<Omit<BarangMasuk, 'id' | 'timestamp' | 'totalPengadaan'>>({
    tanggal: new Date().toISOString().slice(0, 10),
    bulanPengadaan: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date()),
    namaToko: suppliers[0]?.namaToko || '',
    kodeBarang: items[0]?.kodeBarang || '',
    namaBarang: items[0]?.namaBarang || '',
    jumlah: 1,
    jenisSatuan: items[0]?.jenisSatuan || 'Pcs',
    hargaSatuan: items[0]?.hargaEstimasi || 0,
    namaSekolah: config.schoolName,
    sumberAnggaran: 'BOS Reguler',
    kodeRekeningRkas: items[0]?.kodeRekeningRkas || '5.2.2.01.01',
    nomorBku: `BKU-${new Date().getMonth() + 1}/${(barangMasuk.length + 1).toString().padStart(2, '0')}`,
    nomorKwitansi: `KWT/${Date.now().toString().slice(-4)}`,
    petugas: activeUser.nama,
    keterangan: '',
  });

  // Multi-Item Invoice Header Data
  const [multiHeader, setMultiHeader] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    bulanPengadaan: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date()),
    namaToko: suppliers[0]?.namaToko || '',
    sumberAnggaran: 'BOS Reguler' as const,
    nomorBku: `BKU-BOS/${new Date().getMonth() + 1}/${Date.now().toString().slice(-2)}`,
    nomorKwitansi: `KWT/${Date.now().toString().slice(-4)}`,
    petugas: activeUser.nama,
    keterangan: '',
  });

  // Multi-Item Rows
  const [multiRows, setMultiRows] = useState<MultiInvoiceItemRow[]>([
    {
      id: 'row-1',
      kodeBarang: items[0]?.kodeBarang || 'ATK-001',
      namaBarang: items[0]?.namaBarang || 'Kertas HVS',
      jumlah: 1,
      jenisSatuan: items[0]?.jenisSatuan || 'Rim',
      hargaSatuan: items[0]?.hargaEstimasi || 50000,
      kodeRekeningRkas: items[0]?.kodeRekeningRkas || '5.2.2.01.01',
    },
  ]);

  // Handle prefilled data from ScanReceiptModal
  useEffect(() => {
    if (prefilledFromScan && prefilledFromScan.items) {
      if (prefilledFromScan.items.length > 1) {
        // Multi-item scenario
        setMultiHeader({
          tanggal: prefilledFromScan.tanggal || new Date().toISOString().slice(0, 10),
          bulanPengadaan: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date()),
          namaToko: prefilledFromScan.namaToko || suppliers[0]?.namaToko || 'Toko Rekanan SIPLah',
          sumberAnggaran: 'BOS Reguler',
          nomorBku: `BKU-BOS/${new Date().getMonth() + 1}/${Date.now().toString().slice(-2)}`,
          nomorKwitansi: prefilledFromScan.nomorKwitansi || `KWT/${Date.now().toString().slice(-4)}`,
          petugas: activeUser.nama,
          keterangan: `Pengadaan dari Scan Nota AI - Toko: ${prefilledFromScan.namaToko || '-'}`,
        });

        const rows: MultiInvoiceItemRow[] = prefilledFromScan.items.map((it: any, idx: number) => {
          const match = items.find(
            (m) =>
              m.namaBarang.toLowerCase().includes(it.namaBarang.toLowerCase()) ||
              it.namaBarang.toLowerCase().includes(m.namaBarang.toLowerCase())
          );
          return {
            id: `row-scan-${idx + 1}`,
            kodeBarang: match?.kodeBarang || it.kodeBarang || 'ATK-001',
            namaBarang: match?.namaBarang || it.namaBarang,
            jumlah: Number(it.jumlah) || 1,
            jenisSatuan: it.jenisSatuan || match?.jenisSatuan || 'Pcs',
            hargaSatuan: Number(it.hargaSatuan) || match?.hargaEstimasi || 0,
            kodeRekeningRkas: match?.kodeRekeningRkas || '5.2.2.01.01',
          };
        });

        setMultiRows(rows);
        setIsMultiModalOpen(true);
      } else {
        // Single item scenario
        const firstScanItem = prefilledFromScan.items[0];
        const matchingMaster = items.find((it) =>
          firstScanItem
            ? it.namaBarang.toLowerCase().includes(firstScanItem.namaBarang.toLowerCase())
            : false
        ) || items[0];

        setFormData((prev) => ({
          ...prev,
          namaToko: prefilledFromScan.namaToko || prev.namaToko,
          nomorKwitansi: prefilledFromScan.nomorKwitansi || prev.nomorKwitansi,
          tanggal: prefilledFromScan.tanggal || prev.tanggal,
          kodeBarang: matchingMaster?.kodeBarang || prev.kodeBarang,
          namaBarang: matchingMaster?.namaBarang || firstScanItem?.namaBarang || prev.namaBarang,
          jumlah: firstScanItem?.jumlah || 1,
          hargaSatuan: firstScanItem?.hargaSatuan || matchingMaster?.hargaEstimasi || prev.hargaSatuan,
          jenisSatuan: firstScanItem?.jenisSatuan || matchingMaster?.jenisSatuan || prev.jenisSatuan,
          keterangan: `Hasil pemindaian nota otomatis AI - Toko: ${prefilledFromScan.namaToko || '-'}`,
        }));
        setIsModalOpen(true);
      }
    }
  }, [prefilledFromScan, items, suppliers, activeUser.nama]);

  // Filtered List
  const filteredList = useMemo(() => {
    return barangMasuk.filter((bm) => {
      const matchSearch =
        bm.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bm.kodeBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bm.namaToko.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bm.nomorBku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bm.nomorKwitansi.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDana = filterSumberDana === 'ALL' || bm.sumberAnggaran === filterSumberDana;
      return matchSearch && matchDana;
    });
  }, [barangMasuk, searchQuery, filterSumberDana]);

  // Aggregate stats
  const pageStats = useMemo(() => {
    const totalNilai = barangMasuk.reduce((sum, it) => sum + (Number(it.totalPengadaan) || 0), 0);
    const totalVolume = barangMasuk.reduce((sum, it) => sum + (Number(it.jumlah) || 0), 0);
    const bosRegulerNilai = barangMasuk
      .filter((b) => b.sumberAnggaran === 'BOS Reguler')
      .reduce((sum, it) => sum + (Number(it.totalPengadaan) || 0), 0);

    return { totalNilai, totalVolume, bosRegulerNilai };
  }, [barangMasuk]);

  // Handlers for single form
  const handleSelectItem = (code: string) => {
    const selected = items.find((i) => i.kodeBarang === code);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        kodeBarang: selected.kodeBarang,
        namaBarang: selected.namaBarang,
        jenisSatuan: selected.jenisSatuan,
        kodeRekeningRkas: selected.kodeRekeningRkas,
        hargaSatuan: selected.hargaEstimasi || prev.hargaSatuan,
      }));
    }
  };

  const handleOpenAddSingle = () => {
    const firstItem = items[0];
    setFormData({
      tanggal: new Date().toISOString().slice(0, 10),
      bulanPengadaan: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date()),
      namaToko: suppliers[0]?.namaToko || '',
      kodeBarang: firstItem?.kodeBarang || '',
      namaBarang: firstItem?.namaBarang || '',
      jumlah: 1,
      jenisSatuan: firstItem?.jenisSatuan || 'Pcs',
      hargaSatuan: firstItem?.hargaEstimasi || 0,
      namaSekolah: config.schoolName,
      sumberAnggaran: 'BOS Reguler',
      kodeRekeningRkas: firstItem?.kodeRekeningRkas || '5.2.2.01.01',
      nomorBku: `BKU-BOS/${new Date().getMonth() + 1}/${(barangMasuk.length + 1).toString().padStart(2, '0')}`,
      nomorKwitansi: `KWT/${Date.now().toString().slice(-4)}`,
      petugas: activeUser.nama,
      keterangan: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenAddMulti = () => {
    setMultiHeader({
      tanggal: new Date().toISOString().slice(0, 10),
      bulanPengadaan: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date()),
      namaToko: suppliers[0]?.namaToko || '',
      sumberAnggaran: 'BOS Reguler',
      nomorBku: `BKU-BOS/${new Date().getMonth() + 1}/${(barangMasuk.length + 1).toString().padStart(2, '0')}`,
      nomorKwitansi: `KWT/${Date.now().toString().slice(-4)}`,
      petugas: activeUser.nama,
      keterangan: '',
    });

    setMultiRows([
      {
        id: `row-${Date.now()}`,
        kodeBarang: items[0]?.kodeBarang || 'ATK-001',
        namaBarang: items[0]?.namaBarang || 'Kertas HVS',
        jumlah: 1,
        jenisSatuan: items[0]?.jenisSatuan || 'Rim',
        hargaSatuan: items[0]?.hargaEstimasi || 50000,
        kodeRekeningRkas: items[0]?.kodeRekeningRkas || '5.2.2.01.01',
      },
    ]);
    setIsMultiModalOpen(true);
  };

  const handleAddRow = () => {
    const first = items[0];
    setMultiRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        kodeBarang: first?.kodeBarang || 'ATK-001',
        namaBarang: first?.namaBarang || 'Barang Baru',
        jumlah: 1,
        jenisSatuan: first?.jenisSatuan || 'Pcs',
        hargaSatuan: first?.hargaEstimasi || 0,
        kodeRekeningRkas: first?.kodeRekeningRkas || '5.2.2.01.01',
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (multiRows.length <= 1) return;
    setMultiRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRowChange = (id: string, field: keyof MultiInvoiceItemRow, value: any) => {
    setMultiRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (field === 'kodeBarang') {
          const match = items.find((it) => it.kodeBarang === value);
          return {
            ...r,
            kodeBarang: value,
            namaBarang: match?.namaBarang || r.namaBarang,
            jenisSatuan: match?.jenisSatuan || r.jenisSatuan,
            hargaSatuan: match?.hargaEstimasi || r.hargaSatuan,
            kodeRekeningRkas: match?.kodeRekeningRkas || r.kodeRekeningRkas,
          };
        }
        return { ...r, [field]: value };
      })
    );
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kodeBarang || Number(formData.jumlah) <= 0) {
      showToast('Pilih barang dan masukkan jumlah yang valid.', 'warning');
      return;
    }

    addBarangMasuk(formData);
    showToast(`Barang masuk "${formData.namaBarang}" berhasil dicatat & stok bertambah!`, 'success');
    setIsModalOpen(false);
  };

  const handleMultiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (multiRows.length === 0) return;

    const payload = multiRows.map((r) => ({
      tanggal: multiHeader.tanggal,
      bulanPengadaan: multiHeader.bulanPengadaan,
      namaToko: multiHeader.namaToko,
      kodeBarang: r.kodeBarang,
      namaBarang: r.namaBarang,
      jumlah: Number(r.jumlah) || 1,
      jenisSatuan: r.jenisSatuan,
      hargaSatuan: Number(r.hargaSatuan) || 0,
      namaSekolah: config.schoolName,
      sumberAnggaran: multiHeader.sumberAnggaran,
      kodeRekeningRkas: r.kodeRekeningRkas,
      nomorBku: multiHeader.nomorBku,
      nomorKwitansi: multiHeader.nomorKwitansi,
      petugas: multiHeader.petugas,
      keterangan: multiHeader.keterangan || 'Pembelian faktur kolektif',
    }));

    addBarangMasukBatch(payload);
    showToast(`Berhasil mencatat faktur ${multiRows.length} barang masuk!`, 'success');
    setIsMultiModalOpen(false);
  };

  const handlePrintBast = (bm: BarangMasuk) => {
    // Look up same invoice transactions if any
    const sameInvoice = barangMasuk.filter(
      (b) => b.nomorKwitansi === bm.nomorKwitansi && b.namaToko === bm.namaToko
    );

    const targetList = sameInvoice.length > 0 ? sameInvoice : [bm];

    const bastItems: BastItem[] = targetList.map((item) => ({
      namaBarang: item.namaBarang,
      kodeBarang: item.kodeBarang,
      jumlah: item.jumlah,
      jenisSatuan: item.jenisSatuan,
      hargaSatuan: item.hargaSatuan,
      total: item.totalPengadaan,
    }));

    setDocModalData({
      type: 'BAST',
      title: 'BERITA ACARA SERAH TERIMA HASIL PEKERJAAN / PENGADAAN BARANG (BAST)',
      nomorSurat: `${bm.nomorKwitansi} / BAST-BOS / ${bm.tanggal.substring(0, 4)}`,
      tanggal: bm.tanggal,
      pihakPertama: {
        nama: bm.namaToko,
        jabatan: 'Penyedia Barang / Rekanan',
        instansi: bm.namaToko,
        alamat: 'Mitra Pengadaan Sekolah',
      },
      pihakKedua: {
        nama: bm.petugas || config.treasurer || config.warehouseOfficer,
        nip: config.treasurerNip || config.warehouseOfficerNip || '-',
        jabatan: 'Pengurus Barang / Bendahara BOS',
      },
      items: bastItems,
      sumberAnggaran: bm.sumberAnggaran,
      keterangan: bm.keterangan || 'Barang telah diperiksa dan diterima dalam keadaan lengkap dan baik.',
    });

    setIsDocModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Catatan Barang Masuk?',
      message: `Hapus catatan transaksi barang masuk "${name}"? Stok persediaan akan disesuaikan kembali.`,
      confirmText: 'Hapus Transaksi',
      variant: 'danger',
    });
    if (confirmed) {
      deleteBarangMasuk(id);
      showToast(`Transaksi barang masuk "${name}" berhasil dihapus.`, 'info');
    }
  };

  const multiGrandTotal = multiRows.reduce(
    (sum, r) => sum + (Number(r.jumlah) * Number(r.hargaSatuan) || 0),
    0
  );

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ArrowDownToLine className="w-6 h-6 text-emerald-800" /> Pengadaan Barang Masuk (BKU Pembantu)
          </h2>
          <p className="text-xs text-slate-500">
            Catat penerimaan barang belanja BOS/SIPLah. Transaksi otomatis menambah saldo stok gudang persediaan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate('terminal_logistik')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs shadow-md transition"
              title="Buka Mode Terminal Logistik Cepat"
            >
              <Zap className="w-4 h-4 fill-amber-950" /> Mode Terminal Cepat
            </button>
          )}

          <button
            onClick={onOpenScanReceipt}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-bold transition shadow-2xs"
          >
            <Camera className="w-3.5 h-3.5 text-teal-700" /> Scan Nota AI
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 rotate-180 text-slate-600" /> Impor Faktur (Excel / CSV)
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Ekspor Data
          </button>

          <button
            onClick={handleOpenAddMulti}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold transition shadow-xs"
            title="Catat nota/faktur yang memiliki banyak item sekaligus"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-700" /> Input Faktur Kolektif
          </button>

          <button
            onClick={handleOpenAddSingle}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Input Satuan
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
              Total Pengadaan Tercatat
            </span>
            <div className="text-xl font-black text-slate-900">{formatRupiah(pageStats.totalNilai)}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Akumulasi seluruh transaksi</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
              Total Volume Barang Masuk
            </span>
            <div className="text-xl font-black text-slate-900">
              {pageStats.totalVolume.toLocaleString('id-ID')} unit
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Kuantitas persediaan bertambah</span>
          </div>
          <div className="p-2 rounded-xl bg-blue-50 text-blue-800">
            <ArrowDownToLine className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
              Sumber Dana BOS Reguler
            </span>
            <div className="text-xl font-black text-emerald-900">
              {formatRupiah(pageStats.bosRegulerNilai)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Porsi belanja operasional utama</span>
          </div>
          <div className="p-2 rounded-xl bg-teal-50 text-teal-800">
            <Store className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi berdasarkan nama barang, toko, BKU, nomor kwitansi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Sumber Anggaran:</span>
          <select
            value={filterSumberDana}
            onChange={(e) => setFilterSumberDana(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700"
          >
            <option value="ALL">Semua Sumber Dana</option>
            <option value="BOS Reguler">BOS Reguler</option>
            <option value="BOS Kinerja">BOS Kinerja</option>
            <option value="BOP Daerah">BOP Daerah</option>
            <option value="DAK Fisik">DAK Fisik</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3">Tanggal BKU</th>
                <th className="px-4 py-3">No. BKU &amp; Kwitansi</th>
                <th className="px-4 py-3">Penyedia / Toko</th>
                <th className="px-4 py-3">Barang &amp; Rekening</th>
                <th className="px-4 py-3 text-center">Jumlah</th>
                <th className="px-4 py-3 text-right">Harga Satuan</th>
                <th className="px-4 py-3 text-right">Total Nilai</th>
                <th className="px-4 py-3">Sumber Dana</th>
                <th className="px-4 py-3 text-right">Aksi &amp; BAST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Belum ada data barang masuk yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredList.map((bm) => (
                  <tr key={bm.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700">
                      {formatTanggalIndo(bm.tanggal)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-800 text-[11px]">{bm.nomorBku}</div>
                      <div className="text-[10px] text-slate-400">{bm.nomorKwitansi}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 truncate max-w-[160px]">
                      {bm.namaToko}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{bm.namaBarang}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {bm.kodeBarang} • {bm.kodeRekeningRkas}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                        +{bm.jumlah} {bm.jenisSatuan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatRupiah(bm.hargaSatuan)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatRupiah(bm.totalPengadaan)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {bm.sumberAnggaran}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handlePrintBast(bm)}
                          className="inline-flex items-center gap-1 p-1.5 text-emerald-800 hover:bg-emerald-50 rounded-lg font-semibold text-[11px] transition"
                          title="Cetak Berita Acara Serah Terima (BAST)"
                        >
                          <FileCheck className="w-4 h-4 text-emerald-700" />
                          <span className="hidden md:inline">BAST</span>
                        </button>

                        <button
                          onClick={() => handleDelete(bm.id, bm.namaBarang)}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Input Satuan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm">Input Penerimaan Barang Masuk (Satuan)</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSingleSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sumber Anggaran</label>
                  <select
                    value={formData.sumberAnggaran}
                    onChange={(e) => setFormData({ ...formData, sumberAnggaran: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="BOS Reguler">BOS Reguler</option>
                    <option value="BOS Kinerja">BOS Kinerja</option>
                    <option value="BOP Daerah">BOP Daerah</option>
                    <option value="DAK Fisik">DAK Fisik</option>
                    <option value="Komite/Swadaya">Komite/Swadaya</option>
                    <option value="APBD Prov/Kab">APBD Prov/Kab</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Barang dari Master</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Toko Penyedia / Rekanan</label>
                  <input
                    type="text"
                    required
                    value={formData.namaToko}
                    onChange={(e) => setFormData({ ...formData, namaToko: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Kwitansi / Faktur</label>
                  <input
                    type="text"
                    required
                    value={formData.nomorKwitansi}
                    onChange={(e) => setFormData({ ...formData, nomorKwitansi: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jumlah</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.jumlah}
                    onChange={(e) => setFormData({ ...formData, jumlah: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Satuan</label>
                  <input
                    type="text"
                    required
                    value={formData.jenisSatuan}
                    onChange={(e) => setFormData({ ...formData, jenisSatuan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.hargaSatuan}
                    onChange={(e) => setFormData({ ...formData, hargaSatuan: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-900">Total Pengadaan:</span>
                <span className="font-black text-emerald-950 text-sm">
                  {formatRupiah(Number(formData.jumlah) * Number(formData.hargaSatuan))}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor BKU</label>
                  <input
                    type="text"
                    required
                    value={formData.nomorBku}
                    onChange={(e) => setFormData({ ...formData, nomorBku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kode Rekening RKAS</label>
                  <input
                    type="text"
                    value={formData.kodeRekeningRkas}
                    onChange={(e) => setFormData({ ...formData, kodeRekeningRkas: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Keterangan Tambahan</label>
                <input
                  type="text"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Contoh: Belanja ATK persiapan ujian PTS"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
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
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Input Faktur Kolektif (Multi-Item) */}
      {isMultiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="font-bold text-sm">Input Faktur Kolektif Banyak Barang (Multi-Item)</h3>
                  <p className="text-[11px] text-emerald-200">
                    Satu faktur toko / SIPLah dengan rincian beberapa barang sekaligus
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMultiModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMultiSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Invoice Header Details */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block text-xs border-b border-slate-200 pb-1">
                  Informasi Faktur &amp; Rekanan
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tanggal Transaksi</label>
                    <input
                      type="date"
                      required
                      value={multiHeader.tanggal}
                      onChange={(e) => setMultiHeader({ ...multiHeader, tanggal: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Nama Toko / Penyedia</label>
                    <input
                      type="text"
                      required
                      value={multiHeader.namaToko}
                      onChange={(e) => setMultiHeader({ ...multiHeader, namaToko: e.target.value })}
                      placeholder="Contoh: Toko Buku & ATK Barokah"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Sumber Anggaran</label>
                    <select
                      value={multiHeader.sumberAnggaran}
                      onChange={(e) => setMultiHeader({ ...multiHeader, sumberAnggaran: e.target.value as any })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="BOS Reguler">BOS Reguler</option>
                      <option value="BOS Kinerja">BOS Kinerja</option>
                      <option value="BOP Daerah">BOP Daerah</option>
                      <option value="DAK Fisik">DAK Fisik</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Nomor Kwitansi / Faktur</label>
                    <input
                      type="text"
                      required
                      value={multiHeader.nomorKwitansi}
                      onChange={(e) => setMultiHeader({ ...multiHeader, nomorKwitansi: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Nomor BKU</label>
                    <input
                      type="text"
                      required
                      value={multiHeader.nomorBku}
                      onChange={(e) => setMultiHeader({ ...multiHeader, nomorBku: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Rows Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">
                    Rincian Barang Belanja ({multiRows.length} Baris):
                  </span>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Baris Barang
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Pilih / Nama Barang</th>
                        <th className="py-2 px-2 text-center w-24">Jumlah</th>
                        <th className="py-2 px-2 text-center w-20">Satuan</th>
                        <th className="py-2 px-3 text-right w-32">Harga Satuan</th>
                        <th className="py-2 px-3 text-right w-32">Subtotal</th>
                        <th className="py-2 px-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {multiRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3">
                            <select
                              value={row.kodeBarang}
                              onChange={(e) => handleRowChange(row.id, 'kodeBarang', e.target.value)}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold"
                            >
                              {items.map((it) => (
                                <option key={it.id} value={it.kodeBarang}>
                                  {it.kodeBarang} - {it.namaBarang}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              min="1"
                              value={row.jumlah}
                              onChange={(e) =>
                                handleRowChange(row.id, 'jumlah', Number(e.target.value))
                              }
                              className="w-full px-2 py-1 text-center font-bold rounded-lg border border-slate-200 text-xs"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={row.jenisSatuan}
                              onChange={(e) => handleRowChange(row.id, 'jenisSatuan', e.target.value)}
                              className="w-full px-2 py-1 text-center rounded-lg border border-slate-200 text-xs"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              min="0"
                              value={row.hargaSatuan}
                              onChange={(e) =>
                                handleRowChange(row.id, 'hargaSatuan', Number(e.target.value))
                              }
                              className="w-full px-2 py-1 text-right font-bold rounded-lg border border-slate-200 text-xs"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-900">
                            {formatRupiah(Number(row.jumlah) * Number(row.hargaSatuan))}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.id)}
                              disabled={multiRows.length <= 1}
                              className="p-1 text-slate-400 hover:text-red-700 disabled:opacity-30 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={4} className="py-2.5 px-3 text-right text-slate-700">
                          TOTAL NILAI FAKTUR:
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-950 font-black text-sm">
                          {formatRupiah(multiGrandTotal)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMultiModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold shadow-md"
                >
                  Simpan Semua Barang ({multiRows.length})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official BAST Print Modal */}
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
        type="BARANG_MASUK"
      />

      {/* Advanced Export Modal */}
      <AdvancedExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Ekspor Buku Barang Masuk (BKU)"
        defaultFilename="Buku_Barang_Masuk_Sekolah"
        data={barangMasuk}
        filteredData={filteredList}
        availableColumns={barangMasukColumns}
        schoolConfig={config}
      />
    </div>
  );
};
