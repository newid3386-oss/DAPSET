import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  X,
  Check,
  Package,
  FileCheck,
  Tag,
  Printer,
  AlertTriangle,
  CheckSquare,
  Square,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { MasterItem } from '../types';
import { formatRupiah } from '../utils/format';
import { AdvancedExportModal } from '../components/AdvancedExportModal';
import { AdvancedImportModal } from '../components/AdvancedImportModal';
import { CsvTemplateValidatorModal } from '../components/CsvTemplateValidatorModal';
import { ItemBarcodeShelfTagModal } from '../components/ItemBarcodeShelfTagModal';

export const MasterBarangPage: React.FC = () => {
  const { items, stockSummary, addItem, updateItem, deleteItem, importMasterItemsBatch, config, hasPermission } =
    useInventory();
  const { showToast, confirmDialog } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStockStatus, setFilterStockStatus] = useState<'ALL' | 'CRITICAL' | 'EMPTY' | 'SAFE'>('ALL');

  // Pagination state for high-volume items
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);

  // Shelf Tag / Barcode Modal State
  const [itemsForTags, setItemsForTags] = useState<MasterItem[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  // Multi-Select State
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Form State
  const [formData, setFormData] = useState<Omit<MasterItem, 'id'>>({
    kodeBarang: '',
    namaBarang: '',
    kategori: 'ATK',
    jenisSatuan: 'Rim',
    tipe: 'HABIS_PAKAI',
    kodeRekeningRkas: '5.2.2.01.01',
    batasMinimum: 5,
    lokasiDefault: 'Gudang Persediaan',
    hargaEstimasi: 0,
    status: 'AKTIF',
  });

  const categories = useMemo(() => {
    const list = Array.from(new Set(items.map((i) => i.kategori)));
    return ['ALL', ...list];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchQuery =
        item.kodeBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kodeRekeningRkas.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.lokasiDefault.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = filterCategory === 'ALL' || item.kategori === filterCategory;
      const matchType = filterType === 'ALL' || item.tipe === filterType;

      let matchStock = true;
      if (filterStockStatus !== 'ALL') {
        const s = stockSummary.find((summary) => summary.kodeBarang === item.kodeBarang);
        const stockQty = s ? s.stok : 0;
        if (filterStockStatus === 'EMPTY') {
          matchStock = stockQty <= 0;
        } else if (filterStockStatus === 'CRITICAL') {
          matchStock = stockQty <= item.batasMinimum;
        } else if (filterStockStatus === 'SAFE') {
          matchStock = stockQty > item.batasMinimum;
        }
      }

      return matchQuery && matchCategory && matchType && matchStock;
    });
  }, [items, searchQuery, filterCategory, filterType, filterStockStatus, stockSummary]);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPageNum(1);
  }, [searchQuery, filterCategory, filterType, filterStockStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (currentPageNum - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPageNum, pageSize]);

  // Handle Select All
  const handleToggleSelectAll = () => {
    if (selectedItemIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePrintCatalog = () => {
    window.print();
  };

  const handleOpenTagsForSelected = () => {
    const selected = items.filter((i) => selectedItemIds.has(i.id));
    if (!selected.length) {
      showToast('Pilih minimal 1 barang untuk mencetak label rak.', 'warning');
      return;
    }
    setItemsForTags(selected);
    setIsTagModalOpen(true);
  };

  const handleOpenTagsForSingle = (item: MasterItem) => {
    setItemsForTags([item]);
    setIsTagModalOpen(true);
  };

  const handleBulkDelete = async () => {
    if (!selectedItemIds.size) return;
    if (!hasPermission(['ADMIN', 'PENGURUS_BARANG'])) {
      showToast('Akses ditolak: Hanya Pengurus Barang atau Administrator yang berwenang menghapus master barang.', 'error');
      return;
    }
    const confirmed = await confirmDialog({
      title: 'Hapus Masal Barang?',
      message: `Yakin ingin menghapus ${selectedItemIds.size} master barang yang dipilih?`,
      confirmText: 'Hapus Terpilih',
      variant: 'danger',
    });
    if (confirmed) {
      selectedItemIds.forEach((id) => deleteItem(id));
      showToast(`Berhasil menghapus ${selectedItemIds.size} barang terpilih.`, 'info');
      setSelectedItemIds(new Set());
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      kodeBarang: `BRG-${(items.length + 1).toString().padStart(3, '0')}`,
      namaBarang: '',
      kategori: 'ATK',
      jenisSatuan: 'Rim',
      tipe: 'HABIS_PAKAI',
      kodeRekeningRkas: '5.2.2.01.01',
      batasMinimum: 5,
      lokasiDefault: 'Gudang Persediaan',
      hargaEstimasi: 0,
      status: 'AKTIF',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MasterItem) => {
    setEditingItem(item);
    setFormData({
      kodeBarang: item.kodeBarang,
      namaBarang: item.namaBarang,
      kategori: item.kategori,
      jenisSatuan: item.jenisSatuan,
      tipe: item.tipe,
      kodeRekeningRkas: item.kodeRekeningRkas,
      batasMinimum: item.batasMinimum,
      lokasiDefault: item.lokasiDefault,
      hargaEstimasi: item.hargaEstimasi,
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kodeBarang.trim() || !formData.namaBarang.trim()) {
      showToast('Kode Barang dan Nama Barang wajib diisi.', 'warning');
      return;
    }

    if (editingItem) {
      updateItem(editingItem.id, formData);
      showToast(`Master barang "${formData.namaBarang}" berhasil diperbarui!`, 'success');
    } else {
      addItem(formData);
      showToast(`Barang baru "${formData.namaBarang}" berhasil ditambahkan!`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!hasPermission(['ADMIN', 'PENGURUS_BARANG'])) {
      showToast('Akses ditolak: Hanya Pengurus Barang atau Administrator yang berwenang menghapus master barang.', 'error');
      return;
    }
    const confirmed = await confirmDialog({
      title: 'Hapus Master Barang?',
      message: `Yakin ingin menghapus master barang "${name}"?`,
      confirmText: 'Hapus Barang',
      variant: 'danger',
    });
    if (confirmed) {
      deleteItem(id);
      showToast(`Barang "${name}" berhasil dihapus.`, 'info');
    }
  };

  const masterBarangColumns = [
    { key: 'kodeBarang', label: 'Kode Barang' },
    { key: 'namaBarang', label: 'Nama Barang' },
    { key: 'kategori', label: 'Kategori' },
    { key: 'jenisSatuan', label: 'Satuan' },
    { key: 'tipe', label: 'Tipe' },
    { key: 'kodeRekeningRkas', label: 'Kode Rekening RKAS' },
    { key: 'batasMinimum', label: 'Batas Minimum' },
    { key: 'lokasiDefault', label: 'Lokasi Simpan' },
    { key: 'hargaEstimasi', label: 'Harga Estimasi (Rp)', format: (val: any) => formatRupiah(val) },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-emerald-800" /> Master Barang Sekolah
          </h2>
          <p className="text-xs text-slate-500">
            Daftar katalog barang habis pakai (ATK, kebersihan) dan klasifikasi barang modal aset tetap.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            title="Mode Cetak Laporan (Sembunyikan navigasi & menu)"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" /> Mode Cetak Laporan
          </button>
          <button
            onClick={handlePrintCatalog}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
            title="Cetak Lembar Katalog Master Barang"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" /> Cetak Katalog
          </button>
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold shadow-xs transition"
            title="Generator & Validasi Template CSV"
          >
            <FileCheck className="w-3.5 h-3.5 text-emerald-700" /> Template CSV
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" /> Impor
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Ekspor
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Tambah Barang
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode, nama barang, lokasi, rekening..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'Semua Kategori' : c}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Tipe</option>
            <option value="HABIS_PAKAI">Habis Pakai (ATK/BHP)</option>
            <option value="ASET_TETAP">Aset Tetap / Modal</option>
          </select>

          <select
            value={filterStockStatus}
            onChange={(e) => setFilterStockStatus(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
          >
            <option value="ALL">Status Stok (Semua)</option>
            <option value="CRITICAL">⚠️ Stok Kritis / &le; Min</option>
            <option value="EMPTY">❌ Stok Kosong (0)</option>
            <option value="SAFE">✅ Stok Aman</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Banner */}
      {selectedItemIds.size > 0 && (
        <div className="bg-emerald-950 text-white p-3 px-4 rounded-xl flex items-center justify-between text-xs animate-in fade-in shadow-md">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">{selectedItemIds.size} barang terpilih</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenTagsForSelected}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold transition shadow-xs"
            >
              <Tag className="w-3.5 h-3.5" /> Cetak Label Rak Terpilih
            </button>
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold transition shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus Terpilih
            </button>
            <button
              onClick={() => setSelectedItemIds(new Set())}
              className="text-white/80 hover:text-white px-2 py-1"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-3 py-3 w-8 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-slate-500 hover:text-slate-800"
                    title="Pilih Semua"
                  >
                    {selectedItemIds.size > 0 && selectedItemIds.size === filteredItems.length ? (
                      <CheckSquare className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Nama Barang</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Satuan</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3 text-center">Stok Fisik / Min</th>
                <th className="px-4 py-3">Lokasi Default</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Tidak ditemukan data barang yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const s = stockSummary.find((summary) => summary.kodeBarang === item.kodeBarang);
                  const stockQty = s ? s.stok : 0;
                  const isSelected = selectedItemIds.has(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-emerald-50/40' : ''}`}
                    >
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectItem(item.id)}
                          className="text-slate-400 hover:text-emerald-700 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-700" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-900">{item.kodeBarang}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{item.namaBarang}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.jenisSatuan}</td>
                      <td className="px-4 py-3">
                        {item.tipe === 'HABIS_PAKAI' ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px]">
                            Habis Pakai
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold text-[10px]">
                            Aset Tetap
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`font-bold text-xs px-2 py-0.5 rounded ${
                              stockQty <= 0
                                ? 'bg-red-100 text-red-800'
                                : stockQty <= item.batasMinimum
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {stockQty}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">/ min {item.batasMinimum}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-[140px]">{item.lokasiDefault}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenTagsForSingle(item)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Cetak Label Rak & Barcode/QR"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Edit Barang"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.namaBarang)}
                            className={`p-1.5 rounded-lg transition ${
                              hasPermission(['ADMIN', 'PENGURUS_BARANG'])
                                ? 'text-slate-500 hover:text-red-700 hover:bg-red-50'
                                : 'text-slate-300 hover:text-amber-600 hover:bg-amber-50 cursor-pointer'
                            }`}
                            title={
                              hasPermission(['ADMIN', 'PENGURUS_BARANG'])
                                ? 'Hapus Barang'
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
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
              Menampilkan {(currentPageNum - 1) * pageSize + 1} - {Math.min(currentPageNum * pageSize, filteredItems.length)} dari {filteredItems.length} master barang
            </span>
            {selectedItemIds.size > 0 && (
              <span className="font-bold text-emerald-800 ml-2">({selectedItemIds.size} terpilih)</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPageNum((p) => Math.max(1, p - 1))}
              disabled={currentPageNum === 1}
              className="p-1.5 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
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
              className="p-1.5 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingItem ? 'Edit Master Barang' : 'Tambah Master Barang Baru'}
              </h3>
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
                  <label className="font-bold text-slate-700 block mb-1">Kode Barang</label>
                  <input
                    type="text"
                    required
                    value={formData.kodeBarang}
                    onChange={(e) => setFormData({ ...formData, kodeBarang: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="ATK">ATK</option>
                    <option value="Kebersihan">Kebersihan</option>
                    <option value="Elektronik">Elektronik</option>
                    <option value="Mebel">Mebel</option>
                    <option value="Laboratorium">Laboratorium</option>
                    <option value="Olahraga">Olahraga</option>
                    <option value="Buku & Peraga">Buku &amp; Peraga</option>
                    <option value="UKS/Kesehatan">UKS/Kesehatan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Barang Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Kertas HVS A4 70gr Sinar Dunia"
                  value={formData.namaBarang}
                  onChange={(e) => setFormData({ ...formData, namaBarang: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jenis Satuan</label>
                  <input
                    type="text"
                    required
                    placeholder="Rim, Pcs, Box..."
                    value={formData.jenisSatuan}
                    onChange={(e) => setFormData({ ...formData, jenisSatuan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipe Klasifikasi</label>
                  <select
                    value={formData.tipe}
                    onChange={(e) => setFormData({ ...formData, tipe: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="HABIS_PAKAI">Habis Pakai (ATK)</option>
                    <option value="ASET_TETAP">Aset Tetap (Modal)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Batas Minimum</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.batasMinimum}
                    onChange={(e) => setFormData({ ...formData, batasMinimum: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kode Rekening RKAS</label>
                  <input
                    type="text"
                    value={formData.kodeRekeningRkas}
                    onChange={(e) => setFormData({ ...formData, kodeRekeningRkas: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lokasi Simpan Default</label>
                  <input
                    type="text"
                    value={formData.lokasiDefault}
                    onChange={(e) => setFormData({ ...formData, lokasiDefault: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Harga Estimasi (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.hargaEstimasi}
                    onChange={(e) => setFormData({ ...formData, hargaEstimasi: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="AKTIF">AKTIF</option>
                    <option value="NONAKTIF">NONAKTIF</option>
                  </select>
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
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold"
                >
                  Simpan Master Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Barcode & Shelf Tag Modal */}
      <ItemBarcodeShelfTagModal
        items={itemsForTags}
        isOpen={isTagModalOpen}
        onClose={() => {
          setIsTagModalOpen(false);
          setItemsForTags([]);
        }}
      />

      {/* Advanced Export Modal */}
      <AdvancedExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Ekspor Master Barang Sekolah"
        defaultFilename="Master_Barang_Sekolah"
        data={items}
        filteredData={filteredItems}
        availableColumns={masterBarangColumns}
        schoolConfig={config}
      />

      {/* Advanced Import Modal */}
      <AdvancedImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        type="MASTER_BARANG"
      />

      {/* Template CSV Generator & Validator Modal */}
      <CsvTemplateValidatorModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        existingItems={items}
        onImportValidRows={(validRows: any[]) => {
          importMasterItemsBatch(validRows);
        }}
      />
    </div>
  );
};
