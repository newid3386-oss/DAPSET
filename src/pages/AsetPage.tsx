import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Download,
  QrCode,
  Edit2,
  Trash2,
  X,
  Check,
  Tag,
  MapPin,
  User,
  Calculator,
  Upload,
  AlertTriangle,
  Wrench,
  Printer,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { AssetRecord } from '../types';
import { formatRupiah, formatTanggalIndo } from '../utils/format';
import { AssetQrModal } from '../components/AssetQrModal';
import { BatchAssetQrModal } from '../components/BatchAssetQrModal';
import { AdvancedImportModal } from '../components/AdvancedImportModal';
import { AdvancedExportModal } from '../components/AdvancedExportModal';
import { QuickDamageReportModal } from '../components/QuickDamageReportModal';
import { AssetCalibrationModal } from '../components/AssetCalibrationModal';
import { AssetDepreciationReportModal } from '../components/AssetDepreciationReportModal';

export const AsetPage: React.FC = () => {
  const { assets, items, users, suppliers, addAsset, updateAsset, deleteAsset, config, hasPermission } = useInventory();
  const { showToast, confirmDialog } = useToast();

  const [activeTab, setActiveTab] = useState<'kib' | 'depresiasi'>('kib');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCondition, setFilterCondition] = useState<string>('ALL');
  const [filterLocation, setFilterLocation] = useState<string>('ALL');
  const [filterKib, setFilterKib] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetRecord | null>(null);
  const [selectedAssetForQr, setSelectedAssetForQr] = useState<AssetRecord | null>(null);
  const [isBatchQrModalOpen, setIsBatchQrModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false);
  const [isDepreciationModalOpen, setIsDepreciationModalOpen] = useState(false);

  // Pagination state for high-volume asset datasets
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [formData, setFormData] = useState<Omit<AssetRecord, 'id' | 'totalNilai'>>({
    kodeAset: '',
    kodeBarang: items[0]?.kodeBarang || '',
    namaBarang: items[0]?.namaBarang || '',
    subKegiatan: 'Pengadaan Sarana & Prasarana Sekolah',
    kodeRekening: '5.2.3.02.01',
    kodeLokasi: 'R-GURU',
    tanggalBku: new Date().toISOString().slice(0, 10),
    nomorBku: '',
    nomorKwitansi: '',
    namaToko: suppliers[0]?.namaToko || '',
    merk: '',
    spesifikasi: '',
    nomorSeri: '',
    jumlah: 1,
    jenisSatuan: 'Unit',
    hargaSatuan: 0,
    lokasi: 'Ruang Guru',
    penanggungJawab: users[0]?.nama || '',
    kondisi: 'BAIK',
    status: 'AKTIF',
    keterangan: '',
  });

  const locations = useMemo(() => {
    const list = Array.from(new Set(assets.map((a) => a.lokasi)));
    return ['ALL', ...list];
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchQuery =
        a.kodeAset.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.merk.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.penanggungJawab.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.nomorSeri && a.nomorSeri.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCond = filterCondition === 'ALL' || a.kondisi === filterCondition;
      const matchLoc = filterLocation === 'ALL' || a.lokasi === filterLocation;
      const matchKib = filterKib === 'ALL' || a.kibKategori === filterKib;

      return matchQuery && matchCond && matchLoc && matchKib;
    });
  }, [assets, searchQuery, filterCondition, filterLocation, filterKib]);

  // Reset to first page when search query or filters change
  useEffect(() => {
    setCurrentPageNum(1);
  }, [searchQuery, filterCondition, filterLocation, filterKib]);

  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / pageSize));
  const paginatedAssets = useMemo(() => {
    const start = (currentPageNum - 1) * pageSize;
    return filteredAssets.slice(start, start + pageSize);
  }, [filteredAssets, currentPageNum, pageSize]);

  const currentYear = new Date().getFullYear();
  const assetDepreciationList = useMemo(() => {
    return filteredAssets.map((asset) => {
      const thn = asset.tahunPerolehan || (asset.tanggalBku ? parseInt(asset.tanggalBku.slice(0, 4), 10) : currentYear);
      const masaManfaat = asset.masaManfaat !== undefined ? asset.masaManfaat : (asset.kibKategori === 'KIB_A' ? 0 : 4);
      const usiaPakai = Math.max(0, currentYear - thn);
      const nilaiPerolehan = asset.totalNilai || (asset.jumlah * asset.hargaSatuan);

      let bebanPenyusutanPerTahun = 0;
      let akumulasiPenyusutan = 0;
      let nilaiBuku = nilaiPerolehan;

      if (masaManfaat > 0) {
        bebanPenyusutanPerTahun = nilaiPerolehan / masaManfaat;
        akumulasiPenyusutan = Math.min(nilaiPerolehan, bebanPenyusutanPerTahun * usiaPakai);
        nilaiBuku = Math.max(0, nilaiPerolehan - akumulasiPenyusutan);
      }

      return {
        ...asset,
        tahunPerolehan: thn,
        masaManfaat,
        usiaPakai,
        nilaiPerolehan,
        bebanPenyusutanPerTahun,
        akumulasiPenyusutan,
        nilaiBuku,
      };
    });
  }, [filteredAssets, currentYear]);

  const totalNilaiPerolehan = useMemo(
    () => assetDepreciationList.reduce((acc, a) => acc + a.nilaiPerolehan, 0),
    [assetDepreciationList]
  );
  const totalAkumulasiPenyusutan = useMemo(
    () => assetDepreciationList.reduce((acc, a) => acc + a.akumulasiPenyusutan, 0),
    [assetDepreciationList]
  );
  const totalNilaiBuku = useMemo(
    () => assetDepreciationList.reduce((acc, a) => acc + a.nilaiBuku, 0),
    [assetDepreciationList]
  );

  const handleSelectItem = (code: string) => {
    const item = items.find((i) => i.kodeBarang === code);
    if (item) {
      setFormData((prev) => ({
        ...prev,
        kodeBarang: item.kodeBarang,
        namaBarang: item.namaBarang,
        jenisSatuan: item.jenisSatuan,
        kodeRekening: item.kodeRekeningRkas,
        hargaSatuan: item.hargaEstimasi || prev.hargaSatuan,
      }));
    }
  };

  const handleOpenAdd = () => {
    setEditingAsset(null);
    const item = items.find((i) => i.tipe === 'ASET_TETAP') || items[0];
    const seq = (assets.length + 1).toString().padStart(3, '0');
    setFormData({
      kodeAset: `AST/${new Date().getFullYear()}/${seq}`,
      kodeBarang: item?.kodeBarang || '',
      namaBarang: item?.namaBarang || '',
      subKegiatan: 'Pengembangan Sarana Pembelajaran',
      kodeRekening: item?.kodeRekeningRkas || '5.2.3.02.01',
      kodeLokasi: 'R-GURU',
      tanggalBku: new Date().toISOString().slice(0, 10),
      nomorBku: `BKU-ASET/${new Date().getMonth() + 1}/${seq}`,
      nomorKwitansi: `KWT/ASET/${seq}`,
      namaToko: suppliers[0]?.namaToko || '',
      merk: '',
      spesifikasi: '',
      nomorSeri: '',
      jumlah: 1,
      jenisSatuan: item?.jenisSatuan || 'Unit',
      hargaSatuan: item?.hargaEstimasi || 0,
      lokasi: 'Ruang Guru',
      penanggungJawab: users[0]?.nama || '',
      kondisi: 'BAIK',
      status: 'AKTIF',
      keterangan: '',
      kodeBmdPermendagri: '',
      nomorRegisterNup: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: AssetRecord) => {
    setEditingAsset(a);
    setFormData({
      kodeAset: a.kodeAset,
      kodeBarang: a.kodeBarang,
      namaBarang: a.namaBarang,
      subKegiatan: a.subKegiatan || '',
      kodeRekening: a.kodeRekening || '',
      kodeLokasi: a.kodeLokasi || '',
      tanggalBku: a.tanggalBku,
      nomorBku: a.nomorBku || '',
      nomorKwitansi: a.nomorKwitansi || '',
      namaToko: a.namaToko || '',
      merk: a.merk,
      spesifikasi: a.spesifikasi,
      nomorSeri: a.nomorSeri || '',
      jumlah: a.jumlah,
      jenisSatuan: a.jenisSatuan,
      hargaSatuan: a.hargaSatuan,
      lokasi: a.lokasi,
      penanggungJawab: a.penanggungJawab,
      kondisi: a.kondisi,
      status: a.status,
      keterangan: a.keterangan || '',
      kodeBmdPermendagri: a.kodeBmdPermendagri || '',
      nomorRegisterNup: a.nomorRegisterNup || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kodeAset.trim() || !formData.namaBarang.trim()) {
      showToast('Kode Aset dan Nama Barang wajib diisi.', 'warning');
      return;
    }

    if (editingAsset) {
      updateAsset(editingAsset.id, formData);
      showToast(`Data aset "${formData.namaBarang}" berhasil diperbarui!`, 'success');
    } else {
      addAsset(formData);
      showToast(`Aset baru "${formData.namaBarang}" berhasil didaftarkan!`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!hasPermission(['ADMIN', 'PENGURUS_BARANG'])) {
      showToast('Akses ditolak: Hanya Pengurus Barang atau Administrator yang berwenang menghapus aset sekolah.', 'error');
      return;
    }
    const confirmed = await confirmDialog({
      title: 'Hapus Catatan Aset?',
      message: `Yakin ingin menghapus catatan aset "${name}" dari buku inventaris sekolah?`,
      confirmText: 'Hapus Aset',
      variant: 'danger',
    });
    if (confirmed) {
      deleteAsset(id);
      showToast(`Aset "${name}" berhasil dihapus.`, 'info');
    }
  };

  const assetColumns = [
    { key: 'kodeAset', label: 'Kode Aset' },
    { key: 'kodeBarang', label: 'Kode Barang' },
    { key: 'namaBarang', label: 'Nama Barang' },
    { key: 'kategoriKIB', label: 'Kategori KIB' },
    { key: 'merk', label: 'Merk' },
    { key: 'spesifikasi', label: 'Spesifikasi' },
    { key: 'nomorSeri', label: 'Nomor Seri' },
    { key: 'tahunPerolehan', label: 'Tahun Perolehan' },
    { key: 'masaManfaat', label: 'Masa Manfaat (Th)' },
    { key: 'jumlah', label: 'Jumlah' },
    { key: 'jenisSatuan', label: 'Satuan' },
    { key: 'hargaSatuan', label: 'Harga Satuan (Rp)', format: (val: any) => formatRupiah(val) },
    { key: 'totalNilai', label: 'Total Nilai (Rp)', format: (val: any) => formatRupiah(val) },
    { key: 'lokasi', label: 'Lokasi' },
    { key: 'penanggungJawab', label: 'Penanggung Jawab' },
    { key: 'kondisi', label: 'Kondisi' },
    { key: 'sumberDana', label: 'Sumber Dana' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-800" /> Aset &amp; Inventaris Sekolah (KIR / KIB)
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan aset modal tetap (elektronik, laptop, proyektor, mebeler, lab) dengan label barcode QR inventaris.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsDepreciationModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition shadow-xs"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-700" /> Kalkulator Penyusutan
          </button>
          <button
            onClick={() => setIsCalibrationModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition shadow-xs"
          >
            <Wrench className="w-3.5 h-3.5 text-teal-700" /> Kalibrasi Aset
          </button>
          <button
            onClick={() => setIsDamageModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition shadow-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" /> Lapor Kerusakan
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" /> Impor (Excel / CSV)
          </button>
          <button
            onClick={() => setIsBatchQrModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition shadow-xs"
          >
            <QrCode className="w-3.5 h-3.5 text-teal-700" /> Cetak Stiker Massal
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            title="Mode Cetak Laporan (Sembunyikan navigasi & menu)"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" /> Mode Cetak Laporan
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" /> Cetak Lembar KIB
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Ekspor KIB
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Registrasi Aset Baru
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('kib')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'kib'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" /> Daftar Inventaris (KIR / KIB)
        </button>
        <button
          onClick={() => setActiveTab('depresiasi')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'depresiasi'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Calculator className="w-4 h-4" /> Penyusutan &amp; Nilai Buku Aset (SAP)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode aset, nama, merk, nomor seri, penanggung jawab..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={filterKib}
            onChange={(e) => setFilterKib(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Golongan KIB</option>
            <option value="KIB_A">KIB A (Tanah)</option>
            <option value="KIB_B">KIB B (Peralatan &amp; Mesin)</option>
            <option value="KIB_C">KIB C (Gedung &amp; Bangunan)</option>
            <option value="KIB_D">KIB D (Jalan &amp; Jaringan)</option>
            <option value="KIB_E">KIB E (Aset Tetap Lainnya)</option>
          </select>

          <select
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Kondisi</option>
            <option value="BAIK">Kondisi Baik</option>
            <option value="RUSAK_RINGAN">Rusak Ringan</option>
            <option value="RUSAK_BERAT">Rusak Berat</option>
          </select>

          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc === 'ALL' ? 'Semua Ruangan' : loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Content: KIB / Inventory List */}
      {activeTab === 'kib' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3">Kode Aset</th>
                  <th className="px-4 py-3">Nama Barang &amp; Merk</th>
                  <th className="px-4 py-3">Golongan KIB</th>
                  <th className="px-4 py-3">Ruangan</th>
                  <th className="px-4 py-3">Penanggung Jawab</th>
                  <th className="px-4 py-3 text-center">Kondisi</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Nilai Perolehan</th>
                  <th className="px-4 py-3 text-center">Label QR</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                      Belum ada aset inventaris yang tercatat sesuai filter.
                    </td>
                  </tr>
                ) : (
                  paginatedAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {asset.kodeAset}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">Perolehan: {asset.tanggalBku}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{asset.namaBarang}</div>
                        <div className="text-slate-500 text-[11px]">
                          {asset.merk} {asset.nomorSeri ? `• SN: ${asset.nomorSeri}` : ''}
                        </div>
                        {(asset.kodeBmdPermendagri || asset.nomorRegisterNup) && (
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono">
                            {asset.nomorRegisterNup && (
                              <span className="text-indigo-800 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-bold">
                                NUP: {asset.nomorRegisterNup}
                              </span>
                            )}
                            {asset.kodeBmdPermendagri && (
                              <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                BMD: {asset.kodeBmdPermendagri}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-600">
                        {asset.kibKategori ? asset.kibKategori.replace('_', ' ') : 'KIB B'}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{asset.lokasi}</td>
                      <td className="px-4 py-3 text-slate-700">{asset.penanggungJawab}</td>
                      <td className="px-4 py-3 text-center">
                        {asset.kondisi === 'BAIK' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            BAIK
                          </span>
                        ) : asset.kondisi === 'RUSAK_RINGAN' ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                            RUSAK RINGAN
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                            RUSAK BERAT
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatRupiah(asset.totalNilai || asset.hargaSatuan)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedAssetForQr(asset)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] transition shadow-2xs"
                          title="Buka Stiker QR Code Inventaris"
                        >
                          <QrCode className="w-3.5 h-3.5" /> Label QR
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(asset)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(asset.id, asset.namaBarang)}
                            className={`p-1.5 rounded-lg transition ${
                              hasPermission(['ADMIN', 'PENGURUS_BARANG'])
                                ? 'text-slate-400 hover:text-red-700 hover:bg-red-50'
                                : 'text-slate-300 hover:text-amber-600 hover:bg-amber-50 cursor-pointer'
                            }`}
                            title={
                              hasPermission(['ADMIN', 'PENGURUS_BARANG'])
                                ? 'Hapus Aset'
                                : 'Hanya Pengurus Barang/Admin yang dapat menghapus'
                            }
                          >
                            {hasPermission(['ADMIN', 'PENGURUS_BARANG']) ? (
                              <Trash2 className="w-3.5 h-3.5" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredAssets.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>Tampilkan:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPageNum(1);
                  }}
                  className="px-2 py-1 border border-slate-300 rounded-lg text-xs font-semibold bg-white cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-slate-500">
                  Menampilkan {(currentPageNum - 1) * pageSize + 1} - {Math.min(currentPageNum * pageSize, filteredAssets.length)} dari {filteredAssets.length} aset
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPageNum((p) => Math.max(1, p - 1))}
                  disabled={currentPageNum === 1}
                  className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="font-bold text-slate-700 px-2">
                  Hal {currentPageNum} dari {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPageNum((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPageNum === totalPages}
                  className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Depreciation Ledger (SAP) */}
      {activeTab === 'depresiasi' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
                Total Nilai Perolehan Awal
              </span>
              <div className="text-lg md:text-xl font-black text-slate-900 mt-1">
                {formatRupiah(totalNilaiPerolehan)}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Harga perolehan pembukuan BKU
              </span>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-2xs">
              <span className="text-amber-800 text-[11px] font-bold uppercase tracking-wider block">
                Akumulasi Beban Penyusutan
              </span>
              <div className="text-lg md:text-xl font-black text-amber-900 mt-1">
                {formatRupiah(totalAkumulasiPenyusutan)}
              </div>
              <span className="text-[10px] text-amber-700 mt-0.5 block">
                Penyusutan garis lurus s.d. tahun berjalan
              </span>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
              <span className="text-emerald-800 text-[11px] font-bold uppercase tracking-wider block">
                Nilai Buku Bersih (Net Book Value)
              </span>
              <div className="text-lg md:text-xl font-black text-emerald-900 mt-1">
                {formatRupiah(totalNilaiBuku)}
              </div>
              <span className="text-[10px] text-emerald-700 mt-0.5 block">
                Nilai aset riil yang diakui neraca
              </span>
            </div>
          </div>

          {/* Depreciation Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-3 py-3">Kode Aset</th>
                    <th className="px-3 py-3">Nama Aset &amp; Golongan</th>
                    <th className="px-3 py-3 text-center">Thn Perolehan</th>
                    <th className="px-3 py-3 text-center">Masa Manfaat</th>
                    <th className="px-3 py-3 text-center">Usia Pakai</th>
                    <th className="px-3 py-3 text-right">Nilai Perolehan</th>
                    <th className="px-3 py-3 text-right">Beban Susut / Thn</th>
                    <th className="px-3 py-3 text-right">Akum. Penyusutan</th>
                    <th className="px-3 py-3 text-right font-black text-emerald-900">Nilai Buku</th>
                    <th className="px-3 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assetDepreciationList.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-3 py-3 font-mono font-bold text-emerald-950">
                        {asset.kodeAset}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-900">{asset.namaBarang}</div>
                        <div className="text-[10px] text-slate-500">
                          {asset.kibKategori ? asset.kibKategori.replace('_', ' ') : 'KIB B'} • {asset.lokasi}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center font-mono">{asset.tahunPerolehan}</td>
                      <td className="px-3 py-3 text-center">
                        {asset.masaManfaat > 0 ? `${asset.masaManfaat} Thn` : 'Permanen (0)'}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-slate-700">
                        {asset.usiaPakai} Thn
                      </td>
                      <td className="px-3 py-3 text-right font-medium">
                        {formatRupiah(asset.nilaiPerolehan)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-500">
                        {formatRupiah(asset.bebanPenyusutanPerTahun)}
                      </td>
                      <td className="px-3 py-3 text-right text-amber-700 font-semibold">
                        {formatRupiah(asset.akumulasiPenyusutan)}
                      </td>
                      <td className="px-3 py-3 text-right font-black text-emerald-800 bg-emerald-50/40">
                        {formatRupiah(asset.nilaiBuku)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {asset.masaManfaat === 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Tanpa Susut
                          </span>
                        ) : asset.nilaiBuku <= 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            Habis Manfaat
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            Aktif Disusutkan
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Asset */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm">
                {editingAsset ? 'Edit Data Aset Inventaris' : 'Registrasi Aset Inventaris Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kode Aset (Label Unik)</label>
                  <input
                    type="text"
                    required
                    value={formData.kodeAset}
                    onChange={(e) => setFormData({ ...formData, kodeAset: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Barang Master</label>
                  <select
                    value={formData.kodeBarang}
                    onChange={(e) => handleSelectItem(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    {items.map((it) => (
                      <option key={it.id} value={it.kodeBarang}>
                        {it.kodeBarang} - {it.namaBarang}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Merk / Tipe / Pabrikan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Acer C733 Celeron"
                    value={formData.merk}
                    onChange={(e) => setFormData({ ...formData, merk: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Seri / SN</label>
                  <input
                    type="text"
                    placeholder="NXA8XSG001..."
                    value={formData.nomorSeri}
                    onChange={(e) => setFormData({ ...formData, nomorSeri: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Kode BMD (Permendagri 108)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1.3.2.05.02.01.004"
                    value={formData.kodeBmdPermendagri || ''}
                    onChange={(e) => setFormData({ ...formData, kodeBmdPermendagri: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nomor Register / NUP
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 0001"
                    value={formData.nomorRegisterNup || ''}
                    onChange={(e) => setFormData({ ...formData, nomorRegisterNup: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-bold text-indigo-700 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Spesifikasi Detail</label>
                <textarea
                  rows={2}
                  placeholder="Spesifikasi teknis, warna, ukuran..."
                  value={formData.spesifikasi}
                  onChange={(e) => setFormData({ ...formData, spesifikasi: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal BKU Perolehan</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalBku}
                    onChange={(e) => setFormData({ ...formData, tanggalBku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jumlah Unit</label>
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
                  <label className="font-bold text-slate-700 block mb-1">Harga Perolehan (Rp)</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ruangan / Penempatan</label>
                  <input
                    type="text"
                    required
                    placeholder="Lab Komputer, Ruang Guru, Kelas 6..."
                    value={formData.lokasi}
                    onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Penanggung Jawab Ruangan</label>
                  <input
                    type="text"
                    required
                    list="user-pj-options"
                    placeholder="Nama Guru Penanggung Jawab"
                    value={formData.penanggungJawab}
                    onChange={(e) => setFormData({ ...formData, penanggungJawab: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                  <datalist id="user-pj-options">
                    {users.map((u) => (
                      <option key={u.id} value={u.nama} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kondisi Fisik Barang</label>
                  <select
                    value={formData.kondisi}
                    onChange={(e) => setFormData({ ...formData, kondisi: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="BAIK">Baik</option>
                    <option value="RUSAK_RINGAN">Rusak Ringan</option>
                    <option value="RUSAK_BERAT">Rusak Berat</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Penggunaan</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="AKTIF">Aktif Digunakan</option>
                    <option value="DIMUTASI">Dimutasi</option>
                    <option value="DALAM_PERBAIKAN">Dalam Perbaikan</option>
                    <option value="DIHAPUSKAN">Diusulkan Hapus</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  <Check className="w-4 h-4" /> Simpan Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Sticker Modal */}
      {selectedAssetForQr && (
        <AssetQrModal
          asset={selectedAssetForQr}
          onClose={() => setSelectedAssetForQr(null)}
        />
      )}

      {/* Batch QR Stickers Modal */}
      <BatchAssetQrModal
        isOpen={isBatchQrModalOpen}
        onClose={() => setIsBatchQrModalOpen(false)}
      />

      {/* Advanced Import Modal */}
      <AdvancedImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        type="ASSET"
      />

      {/* Advanced Export Modal */}
      <AdvancedExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Ekspor Buku Inventaris Aset (KIB)"
        defaultFilename="Buku_Inventaris_Aset_KIB_KIR"
        data={assets}
        filteredData={filteredAssets}
        availableColumns={assetColumns}
        schoolConfig={config}
      />

      {/* Quick Damage Report Modal */}
      <QuickDamageReportModal
        isOpen={isDamageModalOpen}
        onClose={() => setIsDamageModalOpen(false)}
      />

      {/* Asset Calibration Modal */}
      <AssetCalibrationModal
        isOpen={isCalibrationModalOpen}
        onClose={() => setIsCalibrationModalOpen(false)}
      />

      {/* Asset Depreciation Report & Calculator Modal */}
      <AssetDepreciationReportModal
        isOpen={isDepreciationModalOpen}
        onClose={() => setIsDepreciationModalOpen(false)}
        assets={assets}
        schoolName={config.schoolName}
      />
    </div>
  );
};
