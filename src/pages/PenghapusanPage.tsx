import React, { useState } from 'react';
import { Trash2, Plus, Search, Download, X, Check, Edit2, AlertCircle, Printer, FileText } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { PenghapusanRecord } from '../types';
import { formatTanggalIndo, exportToCsv } from '../utils/format';
import { BapPenghapusanModal } from '../components/BapPenghapusanModal';

export const PenghapusanPage: React.FC = () => {
  const { penghapusan, assets, activeUser, addPenghapusan, updatePenghapusan, deletePenghapusan, config } =
    useInventory();
  const { showToast, confirmDialog } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PenghapusanRecord | null>(null);
  const [selectedForBap, setSelectedForBap] = useState<PenghapusanRecord | null>(null);

  const [formData, setFormData] = useState<Omit<PenghapusanRecord, 'id' | 'timestamp'>>({
    tanggal: new Date().toISOString().slice(0, 10),
    kodeAset: assets[0]?.kodeAset || '',
    namaBarang: assets[0]?.namaBarang || '',
    alasan: 'Rusak berat dan tidak dapat diperbaiki lagi secara ekonomis',
    kondisiAkhir: 'Rusak Berat',
    dokumen: `SK-HAPUS/${new Date().getFullYear()}/${(penghapusan.length + 1).toString().padStart(2, '0')}`,
    status: 'DIAJUKAN',
    petugas: activeUser.nama,
    keterangan: '',
  });

  const filteredList = penghapusan.filter(
    (p) =>
      p.kodeAset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.alasan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.dokumen.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAsset = (code: string) => {
    const a = assets.find((x) => x.kodeAset === code);
    if (a) {
      setFormData((prev) => ({
        ...prev,
        kodeAset: a.kodeAset,
        namaBarang: a.namaBarang,
      }));
    }
  };

  const handleOpenAdd = () => {
    setEditingRecord(null);
    const a = assets[0];
    setFormData({
      tanggal: new Date().toISOString().slice(0, 10),
      kodeAset: a?.kodeAset || '',
      namaBarang: a?.namaBarang || '',
      alasan: 'Rusak berat / Aus dimakan usia, onderdil sudah tidak ada',
      kondisiAkhir: 'Rusak Berat',
      dokumen: `SK-HAPUS/${new Date().getFullYear()}/${(penghapusan.length + 1).toString().padStart(2, '0')}`,
      status: 'DIAJUKAN',
      petugas: activeUser.nama,
      keterangan: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: PenghapusanRecord) => {
    setEditingRecord(rec);
    setFormData({
      tanggal: rec.tanggal,
      kodeAset: rec.kodeAset,
      namaBarang: rec.namaBarang,
      alasan: rec.alasan,
      kondisiAkhir: rec.kondisiAkhir,
      dokumen: rec.dokumen,
      status: rec.status,
      petugas: rec.petugas,
      keterangan: rec.keterangan,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kodeAset || !formData.alasan.trim()) {
      showToast('Pilih aset dan cantumkan alasan penghapusan.', 'warning');
      return;
    }

    if (editingRecord) {
      updatePenghapusan(editingRecord.id, formData);
      showToast(`Berkas usulan penghapusan aset "${formData.kodeAset}" berhasil diperbarui!`, 'success');
    } else {
      addPenghapusan(formData);
      showToast(`Usulan penghapusan aset "${formData.kodeAset}" berhasil diajukan!`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, code: string) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Usulan Penghapusan?',
      message: `Hapus berkas usulan penghapusan aset "${code}"?`,
      confirmText: 'Hapus Berkas',
      variant: 'danger',
    });
    if (confirmed) {
      deletePenghapusan(id);
      showToast(`Berkas penghapusan aset "${code}" berhasil dihapus.`, 'info');
    }
  };

  const handlePrintList = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-red-700" /> Penghapusan Aset &amp; Barang Rusak Berat
          </h2>
          <p className="text-xs text-slate-500">
            Penatausahaan berkas usulan penghapusan aset dari daftar buku inventaris sekolah berlandaskan SK dan cetak Berita Acara Pemeriksaan Fisik.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            title="Mode Cetak Laporan (Sembunyikan navigasi & menu)"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" /> Mode Cetak Laporan
          </button>
          <button
            onClick={handlePrintList}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" /> Cetak Buku Penghapusan
          </button>
          <button
            onClick={() => exportToCsv('Penghapusan_Aset_Sekolah', filteredList)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Ekspor CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Usulkan Penghapusan
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari data penghapusan berdasarkan kode aset, nama barang, dokumen SK..."
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
                <th className="px-4 py-3">Tanggal Usul</th>
                <th className="px-4 py-3">Aset &amp; Kode</th>
                <th className="px-4 py-3">Dasar Dokumen / SK</th>
                <th className="px-4 py-3">Alasan Penghapusan</th>
                <th className="px-4 py-3 text-center">Kondisi Akhir</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Petugas</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Belum ada berkas usulan penghapusan aset yang tercatat.
                  </td>
                </tr>
              ) : (
                filteredList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700">
                      {formatTanggalIndo(p.tanggal)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{p.namaBarang}</div>
                      <span className="font-mono text-[10px] text-red-900 bg-red-50 px-1.5 py-0.2 rounded font-semibold border border-red-200">
                        {p.kodeAset}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700 font-semibold">{p.dokumen}</td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]" title={p.alasan}>
                      {p.alasan}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                        {p.kondisiAkhir}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'DISETUJUI'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'DIAJUKAN'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">{p.petugas}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedForBap(p)}
                          className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          title="Cetak Berita Acara Pemeriksaan Fisik (BAP)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.kodeAset)}
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

      {/* Modal Input Penghapusan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-red-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingRecord ? 'Edit Usulan Penghapusan' : 'Usulkan Penghapusan Aset Rusak Berat'}
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
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Usulan</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pilih Aset Fisik</label>
                  <select
                    value={formData.kodeAset}
                    onChange={(e) => handleSelectAsset(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    {assets.map((a) => (
                      <option key={a.id} value={a.kodeAset}>
                        {a.kodeAset} - {a.namaBarang} ({a.lokasi}) [{a.kondisi}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Dasar Dokumen / SK Penetapan</label>
                <input
                  type="text"
                  required
                  placeholder="SK-HAPUS/2026/01..."
                  value={formData.dokumen}
                  onChange={(e) => setFormData({ ...formData, dokumen: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alasan Teknis Penghapusan</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Uraian kondisi fisik, faktor keusangan, ketidaktersediaan suku cadang..."
                  value={formData.alasan}
                  onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kondisi Akhir</label>
                  <select
                    value={formData.kondisiAkhir}
                    onChange={(e) => setFormData({ ...formData, kondisiAkhir: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Rusak Berat">Rusak Berat (Tidak Berfungsi)</option>
                    <option value="Hilang / Musnah">Hilang / Musnah Karena Bencana</option>
                    <option value="Dihibahkan">Dihibahkan ke Unit Lain</option>
                    <option value="Kadaluarsa">Kadaluarsa / Usang</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Usulan</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="DIAJUKAN">DIAJUKAN (Menunggu Telaah)</option>
                    <option value="DISETUJUI">DISETUJUI KEPALA SEKOLAH/DINAS</option>
                    <option value="DITOLAK">DITOLAK</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Petugas Pengusul</label>
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
                    placeholder="Opsional"
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
                  className="px-5 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold"
                >
                  Simpan Usulan Penghapusan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BAP Penghapusan Modal */}
      <BapPenghapusanModal
        record={selectedForBap}
        isOpen={Boolean(selectedForBap)}
        onClose={() => setSelectedForBap(null)}
      />
    </div>
  );
};
