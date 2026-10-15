import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Search,
  Download,
  Trash2,
  X,
  Check,
  Building2,
  User,
  ArrowRight,
  Printer,
  FileText,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { MutasiRecord } from '../types';
import { formatTanggalIndo, exportToCsv } from '../utils/format';
import { BastMutasiModal } from '../components/BastMutasiModal';

export const MutasiPage: React.FC = () => {
  const { mutasi, assets, users, activeUser, addMutasi, deleteMutasi, config } = useInventory();
  const { showToast, confirmDialog } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMutasiForBast, setSelectedMutasiForBast] = useState<MutasiRecord | null>(null);

  const [formData, setFormData] = useState<Omit<MutasiRecord, 'id' | 'timestamp'>>({
    tanggal: new Date().toISOString().slice(0, 10),
    kodeAset: assets[0]?.kodeAset || '',
    namaBarang: assets[0]?.namaBarang || '',
    dariLokasi: assets[0]?.lokasi || '',
    keLokasi: 'Ruang Guru',
    dariPj: assets[0]?.penanggungJawab || '',
    kePj: users[0]?.nama || '',
    petugas: activeUser.nama,
    alasan: 'Optimalisasi pemanfaatan inventaris pembelajaran',
    keterangan: '',
  });

  const filteredList = mutasi.filter(
    (m) =>
      m.kodeAset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.dariLokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.keLokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.kePj.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAsset = (kodeAset: string) => {
    const a = assets.find((x) => x.kodeAset === kodeAset);
    if (a) {
      setFormData((prev) => ({
        ...prev,
        kodeAset: a.kodeAset,
        namaBarang: a.namaBarang,
        dariLokasi: a.lokasi,
        dariPj: a.penanggungJawab,
      }));
    }
  };

  const handleOpenAdd = () => {
    const a = assets[0];
    setFormData({
      tanggal: new Date().toISOString().slice(0, 10),
      kodeAset: a?.kodeAset || '',
      namaBarang: a?.namaBarang || '',
      dariLokasi: a?.lokasi || '',
      keLokasi: 'Ruang Guru',
      dariPj: a?.penanggungJawab || '',
      kePj: users[0]?.nama || '',
      petugas: activeUser.nama,
      alasan: 'Peminjaman dan penempatan baru fasilitas KBM',
      keterangan: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kodeAset || !formData.keLokasi.trim()) {
      showToast('Pilih aset dan masukkan lokasi tujuan baru.', 'warning');
      return;
    }

    addMutasi(formData);
    showToast(`Mutasi aset "${formData.kodeAset}" ke ${formData.keLokasi} berhasil dicatat!`, 'success');
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, code: string) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Catatan Mutasi Aset?',
      message: `Hapus catatan mutasi aset "${code}"?`,
      confirmText: 'Hapus Catatan',
      variant: 'danger',
    });
    if (confirmed) {
      deleteMutasi(id);
      showToast(`Catatan mutasi aset "${code}" berhasil dihapus.`, 'info');
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
            <ArrowLeftRight className="w-6 h-6 text-emerald-800" /> Mutasi &amp; Pemindahan Aset
          </h2>
          <p className="text-xs text-slate-500">
            Catat perpindahan aset antar ruangan kelas/laboratorium serta cetak Berita Acara Serah Terima (BAST Mutasi) resmi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintList}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" /> Cetak Lembar Mutasi
          </button>
          <button
            onClick={() => exportToCsv('Riwayat_Mutasi_Aset', filteredList)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Ekspor CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Catat Mutasi Baru
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari mutasi berdasarkan kode aset, nama barang, lokasi, penanggung jawab..."
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
                <th className="px-4 py-3">Aset Dipindahkan</th>
                <th className="px-4 py-3">Alur Ruangan</th>
                <th className="px-4 py-3">Alur Penanggung Jawab</th>
                <th className="px-4 py-3">Alasan Pemindahan</th>
                <th className="px-4 py-3">Petugas</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Belum ada riwayat mutasi aset yang tercatat.
                  </td>
                </tr>
              ) : (
                filteredList.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700">
                      {formatTanggalIndo(m.tanggal)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{m.namaBarang}</div>
                      <span className="font-mono text-[10px] text-emerald-900 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                        {m.kodeAset}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-500">{m.dariLokasi}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-bold text-slate-900">{m.keLokasi}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-500">{m.dariPj}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-bold text-slate-900">{m.kePj}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]" title={m.alasan}>
                      {m.alasan}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">{m.petugas}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedMutasiForBast(m)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          title="Cetak Berita Acara Serah Terima (BAST Mutasi)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id, m.kodeAset)}
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

      {/* Modal Input Mutasi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Catat Mutasi / Pemindahan Aset</h3>
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
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Mutasi</label>
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

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-600">
                <div>
                  <strong>Barang:</strong> {formData.namaBarang}
                </div>
                <div>
                  <strong>Lokasi Asal:</strong> {formData.dariLokasi}
                </div>
                <div>
                  <strong>Penanggung Jawab Asal:</strong> {formData.dariPj}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pindah ke Ruangan Baru</label>
                  <input
                    type="text"
                    required
                    placeholder="Ruang Lab, Kelas 2..."
                    value={formData.keLokasi}
                    onChange={(e) => setFormData({ ...formData, keLokasi: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">PJ Ruangan Baru</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Guru / PJ Baru"
                    value={formData.kePj}
                    onChange={(e) => setFormData({ ...formData, kePj: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alasan Pemindahan / Mutasi</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Penataan ulang kelas baru, peminjaman lab..."
                  value={formData.alasan}
                  onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Petugas Mutasi</label>
                  <input
                    type="text"
                    required
                    value={formData.petugas}
                    onChange={(e) => setFormData({ ...formData, petugas: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Keterangan</label>
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
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold"
                >
                  Simpan Mutasi Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BAST Mutasi Modal */}
      <BastMutasiModal
        record={selectedMutasiForBast}
        isOpen={Boolean(selectedMutasiForBast)}
        onClose={() => setSelectedMutasiForBast(null)}
      />
    </div>
  );
};
