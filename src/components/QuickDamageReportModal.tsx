import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Camera, Check, Wrench, ShieldAlert } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { WebcamCaptureModal } from './WebcamCaptureModal';
import { compressImage } from '../utils/imageCompressor';

interface QuickDamageReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedAssetCode?: string;
}

export const QuickDamageReportModal: React.FC<QuickDamageReportModalProps> = ({
  isOpen,
  onClose,
  preselectedAssetCode,
}) => {
  const { assets, users, activeUser, addLaporanKerusakan } = useInventory();

  const [selectedAssetCode, setSelectedAssetCode] = useState('');
  const [kondisi, setKondisi] = useState<'RUSAK_RINGAN' | 'RUSAK_BERAT'>('RUSAK_RINGAN');
  const [pelapor, setPelapor] = useState(activeUser.nama);
  const [deskripsiKerusakan, setDeskripsiKerusakan] = useState('');
  const [fotoBukti, setFotoBukti] = useState('');
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (preselectedAssetCode) {
      setSelectedAssetCode(preselectedAssetCode);
    } else if (assets.length > 0 && !selectedAssetCode) {
      setSelectedAssetCode(assets[0].kodeAset);
    }
  }, [preselectedAssetCode, assets, selectedAssetCode]);

  if (!isOpen) return null;

  const currentAsset = assets.find((a) => a.kodeAset === selectedAssetCode) || assets[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAsset || !deskripsiKerusakan) return;

    addLaporanKerusakan({
      tanggal: new Date().toISOString().slice(0, 10),
      kodeAset: currentAsset.kodeAset,
      namaBarang: currentAsset.namaBarang,
      lokasi: currentAsset.lokasi,
      pelapor: pelapor || activeUser.nama,
      kondisi,
      deskripsiKerusakan,
      fotoLink: fotoBukti || undefined,
      status: 'MENUNGGU_VERIFIKASI',
    });

    setIsSubmitted(true);
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setDeskripsiKerusakan('');
    setFotoBukti('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-rose-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
              <ShieldAlert className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Lapor Kerusakan Aset Sekolah</h3>
              <p className="text-xs text-amber-100">
                Pemberitahuan cepat untuk penanganan &amp; perbaikan sarana belajar
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl hover:bg-white/10 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-black text-lg text-slate-900">Laporan Berhasil Terkirim!</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Status aset <strong>{currentAsset?.namaBarang}</strong> telah diperbarui dan langsung tercatat dalam daftar penanganan pemeliharaan barang sekolah.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-bold shadow-md hover:bg-emerald-700 transition"
            >
              Kembali ke Aplikasi
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Select Asset */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Pilih Aset / Peralatan yang Rusak
              </label>
              <select
                value={selectedAssetCode}
                onChange={(e) => setSelectedAssetCode(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
              >
                {assets.map((a) => (
                  <option key={a.kodeAset} value={a.kodeAset}>
                    [{a.kodeAset}] {a.namaBarang} ({a.lokasi})
                  </option>
                ))}
              </select>
            </div>

            {/* Asset Detail Preview */}
            {currentAsset && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Merk / Model:</span>
                  <span className="font-bold text-slate-800">{currentAsset.merk || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lokasi / Ruangan:</span>
                  <span className="font-bold text-slate-800">{currentAsset.lokasi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Penanggung Jawab:</span>
                  <span className="font-bold text-slate-800">{currentAsset.penanggungJawab}</span>
                </div>
              </div>
            )}

            {/* Level of Damage */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Tingkat Kerusakan
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`p-3 rounded-2xl border text-center cursor-pointer flex flex-col items-center gap-1 transition ${
                    kondisi === 'RUSAK_RINGAN'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <input
                    type="radio"
                    name="kondisi"
                    value="RUSAK_RINGAN"
                    checked={kondisi === 'RUSAK_RINGAN'}
                    onChange={() => setKondisi('RUSAK_RINGAN')}
                    className="hidden"
                  />
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs">Rusak Ringan</span>
                  <span className="text-[10px] text-slate-400">Masih berfungsi / butuh servis</span>
                </label>

                <label
                  className={`p-3 rounded-2xl border text-center cursor-pointer flex flex-col items-center gap-1 transition ${
                    kondisi === 'RUSAK_BERAT'
                      ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <input
                    type="radio"
                    name="kondisi"
                    value="RUSAK_BERAT"
                    checked={kondisi === 'RUSAK_BERAT'}
                    onChange={() => setKondisi('RUSAK_BERAT')}
                    className="hidden"
                  />
                  <Wrench className="w-4 h-4 text-rose-600" />
                  <span className="text-xs">Rusak Berat</span>
                  <span className="text-[10px] text-slate-400">Mati total / patah / tidak dapat dipakai</span>
                </label>
              </div>
            </div>

            {/* Reporter Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nama Guru / Pelapor
              </label>
              <select
                value={pelapor}
                onChange={(e) => setPelapor(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.nama}>
                    {u.nama} ({u.jabatan})
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Deskripsi Kendala / Kerusakan <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={deskripsiKerusakan}
                onChange={(e) => setDeskripsiKerusakan(e.target.value)}
                placeholder="Jelaskan bagian yang rusak, penyebab, atau gejala kerusakan secara rinci..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            {/* Photo Evidence */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Foto Bukti Kerusakan (Opsional)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsWebcamOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-600" /> Ambil Kamera
                </button>
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer">
                  Unggah Gambar
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const compressed = await compressImage(file, 800, 0.72);
                        setFotoBukti(compressed);
                      } catch {
                        const reader = new FileReader();
                        reader.onload = () => setFotoBukti(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {fotoBukti && (
                <div className="mt-2 relative w-24 h-24 rounded-xl border overflow-hidden">
                  <img src={fotoBukti} alt="Bukti Kerusakan" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFotoBukti('')}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition"
              >
                <AlertTriangle className="w-4 h-4" /> Kirim Laporan Kerusakan
              </button>
            </div>
          </form>
        )}
      </div>

      <WebcamCaptureModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={(img) => setFotoBukti(img)}
      />
    </div>
  );
};
