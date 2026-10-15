import React, { useState } from 'react';
import {
  X,
  Wrench,
  Calendar,
  Check,
  AlertTriangle,
  Clock,
  ShieldCheck,
  BellRing,
  Search,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { AssetRecord } from '../types';
import { formatTanggalIndo } from '../utils/format';

interface AssetCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssetCalibrationModal: React.FC<AssetCalibrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { assets, updateAsset } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetForEdit, setSelectedAssetForEdit] = useState<AssetRecord | null>(null);

  // Edit form state
  const [kalibrasiTerakhir, setKalibrasiTerakhir] = useState('');
  const [intervalBulan, setIntervalBulan] = useState(6);
  const [catatan, setCatatan] = useState('');

  if (!isOpen) return null;

  const today = new Date();

  const getCalibrationStatus = (asset: AssetRecord) => {
    if (!asset.kalibrasiBerikutnya) return 'BELUM_DIJADWALKAN';
    const nextDate = new Date(asset.kalibrasiBerikutnya);
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'TERLEWAT';
    if (diffDays <= 30) return 'MENDEKATI';
    return 'AMAN';
  };

  const calibratedAssets = assets.filter((a) => {
    const matchQuery =
      a.kodeAset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.lokasi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchQuery;
  });

  const upcomingCount = assets.filter((a) => {
    const st = getCalibrationStatus(a);
    return st === 'MENDEKATI' || st === 'TERLEWAT';
  }).length;

  const handleOpenEdit = (asset: AssetRecord) => {
    setSelectedAssetForEdit(asset);
    setKalibrasiTerakhir(asset.kalibrasiTerakhir || new Date().toISOString().slice(0, 10));
    setIntervalBulan(asset.intervalKalibrasiBulan || 6);
    setCatatan(asset.keterangan || '');
  };

  const handleSaveCalibration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForEdit) return;

    const lastDate = new Date(kalibrasiTerakhir);
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + Number(intervalBulan));

    updateAsset(selectedAssetForEdit.id, {
      kalibrasiTerakhir,
      kalibrasiBerikutnya: nextDate.toISOString().slice(0, 10),
      intervalKalibrasiBulan: Number(intervalBulan),
    });

    setSelectedAssetForEdit(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Wrench className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight">
                Penjadwalan &amp; Kalibrasi Rutin Aset
              </h3>
              <p className="text-[11px] text-teal-200">
                Pemeliharaan, tera ulang, dan pengecekan berkala alat laboratorium &amp; instrumen sekolah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Bar */}
        {upcomingCount > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-3 shrink-0">
            <BellRing className="w-5 h-5 text-amber-700 shrink-0 animate-bounce" />
            <div className="text-xs text-amber-900 font-medium">
              <strong>Perhatian:</strong> Terdapat <strong>{upcomingCount} aset</strong> yang jadwal kalibrasinya mendekati batas waktu atau sudah terlewat dan memerlukan tindakan pengecekan segera.
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Search Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari berdasarkan kode, nama barang, atau lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            <div className="text-slate-500 font-semibold">
              Total Aset Terdaftar: <span className="text-slate-800 font-bold">{assets.length}</span>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                  <th className="p-3">Kode &amp; Nama Aset</th>
                  <th className="p-3">Lokasi</th>
                  <th className="p-3">Kalibrasi Terakhir</th>
                  <th className="p-3">Jadwal Berikutnya</th>
                  <th className="p-3">Status Kalibrasi</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {calibratedAssets.map((asset) => {
                  const status = getCalibrationStatus(asset);
                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{asset.namaBarang}</div>
                        <div className="font-mono text-[10px] text-slate-500">{asset.kodeAset} • {asset.merk || '-'}</div>
                      </td>
                      <td className="p-3">{asset.lokasi}</td>
                      <td className="p-3 font-mono">
                        {asset.kalibrasiTerakhir ? formatTanggalIndo(asset.kalibrasiTerakhir) : <span className="text-slate-400 italic">Belum pernah</span>}
                      </td>
                      <td className="p-3 font-mono">
                        {asset.kalibrasiBerikutnya ? formatTanggalIndo(asset.kalibrasiBerikutnya) : <span className="text-slate-400 italic">Belum dijadwalkan</span>}
                      </td>
                      <td className="p-3">
                        {status === 'AMAN' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            <Check className="w-3 h-3" /> Terjadwal Aman
                          </span>
                        )}
                        {status === 'MENDEKATI' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                            <Clock className="w-3 h-3" /> Mendekati Jadwal (&lt;30 hari)
                          </span>
                        )}
                        {status === 'TERLEWAT' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                            <AlertTriangle className="w-3 h-3" /> Jadwal Terlewat
                          </span>
                        )}
                        {status === 'BELUM_DIJADWALKAN' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                            Belum Diset
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenEdit(asset)}
                          className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 font-bold text-[11px] transition shadow-2xs"
                        >
                          Atur Kalibrasi
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Edit Calibration Modal */}
      {selectedAssetForEdit && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Atur Jadwal Kalibrasi Aset</h4>
                <p className="text-[11px] text-slate-500">{selectedAssetForEdit.namaBarang} ({selectedAssetForEdit.kodeAset})</p>
              </div>
              <button
                onClick={() => setSelectedAssetForEdit(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCalibration} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tanggal Kalibrasi Terakhir</label>
                <input
                  type="date"
                  value={kalibrasiTerakhir}
                  onChange={(e) => setKalibrasiTerakhir(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Interval Waktu Kalibrasi Ulang</label>
                <select
                  value={intervalBulan}
                  onChange={(e) => setIntervalBulan(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value={3}>Setiap 3 Bulan (Kuartalan)</option>
                  <option value={6}>Setiap 6 Bulan (Semesteran)</option>
                  <option value={12}>Setiap 1 Tahun (Tahunan)</option>
                  <option value={24}>Setiap 2 Tahun</option>
                </select>
              </div>

              <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3 text-[11px] text-teal-900">
                Sistem akan otomatis menghitung jadwal kalibrasi berikutnya dan memberikan peringatan dini 30 hari sebelum masa kalibrasi berakhir.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAssetForEdit(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold shadow-xs"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
