import React, { useState } from 'react';
import { Wrench, Plus, Search, Download, Trash2, X, Check, Edit2, Printer, FileText } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { PemeliharaanRecord } from '../types';
import { formatRupiah, formatTanggalIndo, exportToCsv } from '../utils/format';
import { BapPemeliharaanModal } from '../components/BapPemeliharaanModal';

export const PemeliharaanPage: React.FC = () => {
  const { pemeliharaan, assets, suppliers, activeUser, addPemeliharaan, updatePemeliharaan, deletePemeliharaan, config } =
    useInventory();
  const { showToast, confirmDialog } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PemeliharaanRecord | null>(null);
  const [selectedForBap, setSelectedForBap] = useState<PemeliharaanRecord | null>(null);

  const [formData, setFormData] = useState<Omit<PemeliharaanRecord, 'id' | 'timestamp'>>({
    tanggal: new Date().toISOString().slice(0, 10),
    kodeAset: assets[0]?.kodeAset || '',
    namaBarang: assets[0]?.namaBarang || '',
    jenisPemeliharaan: '',
    biaya: 0,
    penyedia: suppliers[0]?.namaToko || 'Teknisi Rekanan',
    status: 'PROSES',
    petugas: activeUser.nama,
    keterangan: '',
  });

  const filteredList = pemeliharaan.filter(
    (p) =>
      p.kodeAset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.jenisPemeliharaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.penyedia.toLowerCase().includes(searchQuery.toLowerCase())
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
      jenisPemeliharaan: 'Pembersihan dan servis berkala proyektor/komputer',
      biaya: 0,
      penyedia: suppliers[0]?.namaToko || 'Teknisi Rekanan',
      status: 'PROSES',
      petugas: activeUser.nama,
      keterangan: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: PemeliharaanRecord) => {
    setEditingRecord(rec);
    setFormData({
      tanggal: rec.tanggal,
      kodeAset: rec.kodeAset,
      namaBarang: rec.namaBarang,
      jenisPemeliharaan: rec.jenisPemeliharaan,
      biaya: rec.biaya,
      penyedia: rec.penyedia,
      status: rec.status,
      petugas: rec.petugas,
      keterangan: rec.keterangan,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kodeAset || !formData.jenisPemeliharaan.trim()) {
      showToast('Pilih aset dan masukkan jenis pemeliharaan.', 'warning');
      return;
    }

    if (editingRecord) {
      updatePemeliharaan(editingRecord.id, formData);
      showToast(`Catatan pemeliharaan aset "${formData.kodeAset}" berhasil diperbarui!`, 'success');
    } else {
      addPemeliharaan(formData);
      showToast(`Pemeliharaan aset "${formData.kodeAset}" berhasil dicatat!`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, code: string) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Catatan Pemeliharaan?',
      message: `Hapus catatan pemeliharaan aset "${code}"?`,
      confirmText: 'Hapus Catatan',
      variant: 'danger',
    });
    if (confirmed) {
      deletePemeliharaan(id);
      showToast(`Catatan pemeliharaan aset "${code}" berhasil dihapus.`, 'info');
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
            <Wrench className="w-6 h-6 text-emerald-800" /> Pemeliharaan &amp; Perbaikan Aset
          </h2>
          <p className="text-xs text-slate-500">
            Catatan servis, perbaikan proyektor, komputer, pompa air, dan cetak Berita Acara Pemeliharaan (BAP).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintList}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" /> Cetak Buku Servis
          </button>
          <button
            onClick={() => exportToCsv('Riwayat_Pemeliharaan_Aset', filteredList)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Ekspor CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Catat Pemeliharaan
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pemeliharaan berdasarkan kode aset, nama barang, jenis perbaikan..."
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
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Aset &amp; Kode</th>
                <th className="px-4 py-3">Jenis Pekerjaan / Servis</th>
                <th className="px-4 py-3">Teknisi / Rekanan</th>
                <th className="px-4 py-3 text-right">Biaya (Rp)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Petugas</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Belum ada riwayat pemeliharaan aset yang tercatat.
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
                      <span className="font-mono text-[10px] text-emerald-900 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                        {p.kodeAset}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{p.jenisPemeliharaan}</td>
                    <td className="px-4 py-3 text-slate-600">{p.penyedia}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(p.biaya)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'SELESAI'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'PROSES'
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
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          title="Cetak Berita Acara Servis (BAP)"
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

      {/* Modal Input Pemeliharaan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingRecord ? 'Edit Catatan Pemeliharaan' : 'Catat Pemeliharaan / Perbaikan Aset'}
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
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Pekerjaan</label>
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
                        {a.kodeAset} - {a.namaBarang} ({a.lokasi})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Jenis Pekerjaan / Servis</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Penggantian lampu proyektor, servis AC ruang guru..."
                  value={formData.jenisPemeliharaan}
                  onChange={(e) => setFormData({ ...formData, jenisPemeliharaan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pelaksana / Bengkel / Rekanan</label>
                  <input
                    type="text"
                    required
                    placeholder="CV. Mandiri Teknik..."
                    value={formData.penyedia}
                    onChange={(e) => setFormData({ ...formData, penyedia: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Biaya Perbaikan (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.biaya}
                    onChange={(e) => setFormData({ ...formData, biaya: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Pekerjaan</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PROSES">DALAM PROSES</option>
                    <option value="SELESAI">SELESAI</option>
                    <option value="TERTUNDA">TERTUNDA / KENDALA ONDERDIL</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Petugas Pengawas</label>
                  <input
                    type="text"
                    required
                    value={formData.petugas}
                    onChange={(e) => setFormData({ ...formData, petugas: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Keterangan / Hasil Pemeriksaan</label>
                <input
                  type="text"
                  placeholder="Opsional"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
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
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold"
                >
                  Simpan Catatan Servis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BAP Pemeliharaan Modal */}
      <BapPemeliharaanModal
        record={selectedForBap}
        isOpen={Boolean(selectedForBap)}
        onClose={() => setSelectedForBap(null)}
      />
    </div>
  );
};
