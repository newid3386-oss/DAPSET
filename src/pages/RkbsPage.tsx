import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  Download,
  Trash2,
  X,
  Check,
  Edit2,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Coins,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { RkbsItem } from '../types';
import { formatRupiah } from '../utils/format';
import { AdvancedExportModal } from '../components/AdvancedExportModal';
import { AdvancedImportModal } from '../components/AdvancedImportModal';

export const RkbsPage: React.FC = () => {
  const { rkbs, items, suppliers, activeUser, addRkbs, updateRkbs, deleteRkbs, realizeRkbsToBarangMasuk, config } =
    useInventory();
  const { showToast, confirmDialog } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RkbsItem | null>(null);

  const rkbsColumns = [
    { key: 'tahunAnggaran', label: 'Tahun Anggaran' },
    { key: 'kodeBarang', label: 'Kode Barang' },
    { key: 'namaBarang', label: 'Nama Barang' },
    { key: 'kategori', label: 'Kategori' },
    { key: 'jumlahDiusulkan', label: 'Jumlah Usulan' },
    { key: 'jenisSatuan', label: 'Satuan' },
    { key: 'hargaEstimasi', label: 'Estimasi Harga (Rp)', format: (val: any) => formatRupiah(val) },
    { key: 'totalEstimasi', label: 'Total Estimasi (Rp)', format: (val: any) => formatRupiah(val) },
    { key: 'prioritas', label: 'Skala Prioritas' },
    { key: 'sumberDana', label: 'Sumber Dana' },
    { key: 'status', label: 'Status Usulan' },
    { key: 'alasanPengadaan', label: 'Alasan Pengadaan' },
    { key: 'diajukanOleh', label: 'Diusulkan Oleh' },
  ];

  // Realize modal state
  const [realizingItem, setRealizingItem] = useState<RkbsItem | null>(null);
  const [realizeToko, setRealizeToko] = useState(suppliers[0]?.namaToko || '');
  const [realizeBku, setRealizeBku] = useState(`BKU-BOS/${new Date().getMonth() + 1}/REALISASI`);
  const [realizeKwitansi, setRealizeKwitansi] = useState(`KWT/REAL/${Date.now().toString().slice(-4)}`);

  // Form State
  const [formData, setFormData] = useState<Omit<RkbsItem, 'id' | 'timestamp' | 'totalEstimasi'>>({
    tahunAnggaran: String(new Date().getFullYear()),
    kodeBarang: items[0]?.kodeBarang || '',
    namaBarang: items[0]?.namaBarang || '',
    kategori: items[0]?.kategori || 'ATK',
    jumlahDiusulkan: 10,
    jenisSatuan: items[0]?.jenisSatuan || 'Rim',
    hargaEstimasi: items[0]?.hargaEstimasi || 50000,
    prioritas: 'TINGGI',
    sumberDana: 'BOS Reguler',
    status: 'DIUSULKAN',
    alasanPengadaan: '',
    diajukanOleh: activeUser.nama,
  });

  const filteredList = rkbs.filter((r) => {
    const matchQuery =
      r.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.kodeBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.alasanPengadaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.diajukanOleh.toLowerCase().includes(searchQuery.toLowerCase());

    const matchPriority = filterPriority === 'ALL' || r.prioritas === filterPriority;
    const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;

    return matchQuery && matchPriority && matchStatus;
  });

  const totalAnggaranUsulan = filteredList.reduce((acc, curr) => acc + curr.totalEstimasi, 0);

  const handleSelectItem = (code: string) => {
    const it = items.find((x) => x.kodeBarang === code);
    if (it) {
      setFormData((prev) => ({
        ...prev,
        kodeBarang: it.kodeBarang,
        namaBarang: it.namaBarang,
        kategori: it.kategori,
        jenisSatuan: it.jenisSatuan,
        hargaEstimasi: it.hargaEstimasi || prev.hargaEstimasi,
      }));
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    const it = items[0];
    setFormData({
      tahunAnggaran: String(new Date().getFullYear()),
      kodeBarang: it?.kodeBarang || '',
      namaBarang: it?.namaBarang || '',
      kategori: it?.kategori || 'ATK',
      jumlahDiusulkan: 10,
      jenisSatuan: it?.jenisSatuan || 'Rim',
      hargaEstimasi: it?.hargaEstimasi || 50000,
      prioritas: 'TINGGI',
      sumberDana: 'BOS Reguler',
      status: 'DIUSULKAN',
      alasanPengadaan: '',
      diajukanOleh: activeUser.nama,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RkbsItem) => {
    setEditingItem(item);
    setFormData({
      tahunAnggaran: item.tahunAnggaran,
      kodeBarang: item.kodeBarang,
      namaBarang: item.namaBarang,
      kategori: item.kategori,
      jumlahDiusulkan: item.jumlahDiusulkan,
      jenisSatuan: item.jenisSatuan,
      hargaEstimasi: item.hargaEstimasi,
      prioritas: item.prioritas,
      sumberDana: item.sumberDana,
      status: item.status,
      alasanPengadaan: item.alasanPengadaan,
      diajukanOleh: item.diajukanOleh,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kodeBarang || Number(formData.jumlahDiusulkan) <= 0) {
      showToast('Pilih barang dan tentukan jumlah usulan yang valid.', 'warning');
      return;
    }

    if (editingItem) {
      updateRkbs(editingItem.id, formData);
      showToast(`Usulan RKBS "${formData.namaBarang}" berhasil diperbarui!`, 'success');
    } else {
      addRkbs(formData);
      showToast(`Usulan RKBS "${formData.namaBarang}" berhasil ditambahkan!`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Usulan RKBS?',
      message: `Hapus usulan perencanaan RKBS untuk "${name}"?`,
      confirmText: 'Hapus Usulan',
      variant: 'danger',
    });
    if (confirmed) {
      deleteRkbs(id);
      showToast(`Usulan "${name}" berhasil dihapus.`, 'info');
    }
  };

  const handleRealizeConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!realizingItem) return;
    try {
      realizeRkbsToBarangMasuk(realizingItem.id, realizeToko, realizeBku, realizeKwitansi);
      showToast(`Usulan "${realizingItem.namaBarang}" berhasil direalisasikan ke Buku Barang Masuk & menambah stok!`, 'success');
      setRealizingItem(null);
    } catch (err: any) {
      showToast(err?.message || 'Gagal merealisasikan barang.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-emerald-800" /> Rencana Kebutuhan Barang Sekolah (RKBS / RKAS)
          </h2>
          <p className="text-xs text-slate-500">
            Perencanaan belanja barang semesteran &amp; penyusunan usulan RKAS dana BOS sebelum pengadaan fisik dilakukan.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            <Download className="w-3.5 h-3.5" /> Ekspor Rencana
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Tambah Rencana Belanja
          </button>
        </div>
      </div>

      {/* Summary Valuation Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div>
          <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
            Estimasi Total Plafon Belanja Usulan RKAS:
          </span>
          <span className="text-2xl font-black text-white">{formatRupiah(totalAnggaranUsulan)}</span>
        </div>
        <div className="text-xs text-emerald-200">
          Total <strong>{filteredList.length}</strong> usulan item barang belanja tahun anggaran {new Date().getFullYear()}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari usulan barang, alasan pengadaan, pengusul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Prioritas</option>
            <option value="TINGGI">Prioritas Tinggi</option>
            <option value="SEDANG">Prioritas Sedang</option>
            <option value="RENDAH">Prioritas Rendah</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="DIUSULKAN">Diusulkan</option>
            <option value="DISETUJUI_RKAS">Disetujui Masuk RKAS</option>
            <option value="TEREALISASI">Terealisasi (Tiba)</option>
            <option value="DITOLAK">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3">Tahun</th>
                <th className="px-4 py-3">Nama Barang</th>
                <th className="px-4 py-3 text-center">Usulan Vol</th>
                <th className="px-4 py-3 text-right">Est. Harga Satuan</th>
                <th className="px-4 py-3 text-right">Total Anggaran</th>
                <th className="px-4 py-3 text-center">Prioritas</th>
                <th className="px-4 py-3">Sumber Dana</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Belum ada usulan rencana kebutuhan barang yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{r.tahunAnggaran}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{r.namaBarang}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[220px]" title={r.alasanPengadaan}>
                        {r.alasanPengadaan}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">
                      {r.jumlahDiusulkan} {r.jenisSatuan}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatRupiah(r.hargaEstimasi)}</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-950">
                      {formatRupiah(r.totalEstimasi)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          r.prioritas === 'TINGGI'
                            ? 'bg-red-100 text-red-800'
                            : r.prioritas === 'SEDANG'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {r.prioritas}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{r.sumberDana}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          r.status === 'TEREALISASI'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'DISETUJUI_RKAS'
                            ? 'bg-blue-100 text-blue-800'
                            : r.status === 'DITOLAK'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {r.status === 'DISETUJUI_RKAS' ? 'MASUK RKAS' : r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {r.status !== 'TEREALISASI' && (
                          <button
                            onClick={() => {
                              setRealizingItem(r);
                              setRealizeToko(suppliers[0]?.namaToko || '');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200 transition"
                            title="Realisasikan barang belanja ini ke Buku Barang Masuk"
                          >
                            <ShoppingBag className="w-3 h-3" /> Realisasi
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id, r.namaBarang)}
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

      {/* Modal Add / Edit RKBS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm">
                {editingItem ? 'Edit Rencana Kebutuhan Barang' : 'Tambah Usulan Belanja RKAS Baru'}
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
                  <label className="font-bold text-slate-700 block mb-1">Tahun Anggaran</label>
                  <input
                    type="text"
                    required
                    value={formData.tahunAnggaran}
                    onChange={(e) => setFormData({ ...formData, tahunAnggaran: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500"
                  />
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
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Volume Usulan</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.jumlahDiusulkan}
                    onChange={(e) => setFormData({ ...formData, jumlahDiusulkan: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Satuan</label>
                  <input
                    type="text"
                    readOnly
                    value={formData.jenisSatuan}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimasi Harga Satuan</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.hargaEstimasi}
                    onChange={(e) => setFormData({ ...formData, hargaEstimasi: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-xs">
                <span className="text-emerald-800 font-semibold">Total Estimasi Anggaran:</span>
                <span className="text-sm font-black text-emerald-950">
                  {formatRupiah(formData.jumlahDiusulkan * formData.hargaEstimasi)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tingkat Prioritas</label>
                  <select
                    value={formData.prioritas}
                    onChange={(e) => setFormData({ ...formData, prioritas: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="TINGGI">Tinggi (Mendesak)</option>
                    <option value="SEDANG">Sedang</option>
                    <option value="RENDAH">Rendah (Pilihan)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sumber Dana Rencana</label>
                  <select
                    value={formData.sumberDana}
                    onChange={(e) => setFormData({ ...formData, sumberDana: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="BOS Reguler">BOS Reguler</option>
                    <option value="BOS Kinerja">BOS Kinerja</option>
                    <option value="BOP Daerah">BOP Daerah</option>
                    <option value="Komite">Komite/Swadaya</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Usulan</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="DIUSULKAN">Diusulkan</option>
                    <option value="DISETUJUI_RKAS">Disetujui Masuk RKAS</option>
                    <option value="TEREALISASI">Terealisasi</option>
                    <option value="DITOLAK">Ditolak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alasan Pengusulan Kebutuhan</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Misal: Stok kertas habis menjelang Ujian Semester..."
                  value={formData.alasanPengadaan}
                  onChange={(e) => setFormData({ ...formData, alasanPengadaan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
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
                  <Check className="w-4 h-4" /> Simpan Usulan Belanja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Realize to Barang Masuk */}
      {realizingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-sm text-slate-900">Realisasikan Belanja ke Barang Masuk</h3>
              </div>
              <button
                onClick={() => setRealizingItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Barang belanja <strong>"{realizingItem.namaBarang}"</strong> sebanyak{' '}
              <strong>
                {realizingItem.jumlahDiusulkan} {realizingItem.jenisSatuan}
              </strong>{' '}
              akan otomatis ditambahkan ke Buku Penerimaan Barang Masuk dan menambah stok persediaan.
            </p>

            <form onSubmit={handleRealizeConfirm} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Toko Rekanan / Penyedia</label>
                <input
                  type="text"
                  required
                  list="realize-sup"
                  value={realizeToko}
                  onChange={(e) => setRealizeToko(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
                <datalist id="realize-sup">
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.namaToko} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">No. BKU</label>
                  <input
                    type="text"
                    required
                    value={realizeBku}
                    onChange={(e) => setRealizeBku(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">No. Kwitansi / Faktur</label>
                  <input
                    type="text"
                    required
                    value={realizeKwitansi}
                    onChange={(e) => setRealizeKwitansi(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRealizingItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-800 text-white font-bold"
                >
                  <Check className="w-4 h-4" /> Konfirmasi Realisasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Advanced Import Modal */}
      <AdvancedImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        type="RKBS"
      />

      {/* Advanced Export Modal */}
      <AdvancedExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Ekspor Rencana Kebutuhan Barang (RKBS)"
        defaultFilename="Rencana_Kebutuhan_Barang_RKBS"
        data={rkbs}
        filteredData={filteredList}
        availableColumns={rkbsColumns}
        schoolConfig={config}
      />
    </div>
  );
};
