import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Upload,
  Camera,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  Boxes,
  CheckCircle2,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatRupiah } from '../utils/format';
import { compressImage } from '../utils/imageCompressor';

export interface ExtractedReceiptItem {
  namaBarang: string;
  jumlah: number;
  jenisSatuan?: string;
  hargaSatuan: number;
  total?: number;
  selected?: boolean;
  kodeBarang?: string;
}

export interface ExtractedReceipt {
  namaToko?: string;
  tanggal?: string;
  nomorKwitansi?: string;
  totalPengadaan?: number;
  items: ExtractedReceiptItem[];
}

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: ExtractedReceipt) => void;
}

export const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const { items: masterItems, config, activeUser, addBarangMasukBatch } = useInventory();
  const [imagePreview, setImagePreview] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedReceipt | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Harap pilih file gambar (JPG, PNG, atau WEBP).');
      return;
    }

    setMimeType(file.type);
    setError('');
    setSuccessMsg('');
    setExtractedData(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const raw = reader.result as string;
        const compressed = await compressImage(raw, 1000, 0.72);
        setImagePreview(compressed);
      } catch {
        setImagePreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!imagePreview) {
      setError('Silakan pilih atau ambil foto nota terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/ai/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Gagal memproses nota');
      }

      const data: ExtractedReceipt = json.data;
      // Pre-map items with master items match and set selected = true
      const enrichedItems: ExtractedReceiptItem[] = (data.items || []).map((it) => {
        const match = masterItems.find(
          (m) =>
            m.namaBarang.toLowerCase().includes(it.namaBarang.toLowerCase()) ||
            it.namaBarang.toLowerCase().includes(m.namaBarang.toLowerCase())
        );
        return {
          ...it,
          selected: true,
          kodeBarang: match?.kodeBarang || '',
          jenisSatuan: it.jenisSatuan || match?.jenisSatuan || 'Pcs',
          total: Number(it.jumlah) * Number(it.hargaSatuan),
        };
      });

      setExtractedData({
        ...data,
        items: enrichedItems,
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Terjadi kesalahan saat memindai nota dengan AI');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = (index: number) => {
    if (!extractedData) return;
    const updated = [...extractedData.items];
    updated[index].selected = !updated[index].selected;
    setExtractedData({ ...extractedData, items: updated });
  };

  const handleUpdateItem = (index: number, field: keyof ExtractedReceiptItem, value: any) => {
    if (!extractedData) return;
    const updated = [...extractedData.items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'jumlah' || field === 'hargaSatuan') {
      updated[index].total = Number(updated[index].jumlah) * Number(updated[index].hargaSatuan);
    }
    setExtractedData({ ...extractedData, items: updated });
  };

  const handleApplyToForm = () => {
    if (!extractedData) return;
    const selectedOnly = extractedData.items.filter((it) => it.selected !== false);
    onApply({
      ...extractedData,
      items: selectedOnly.length > 0 ? selectedOnly : extractedData.items,
    });
    onClose();
  };

  const handleDirectBatchImport = () => {
    if (!extractedData) return;
    const itemsToSave = extractedData.items.filter((it) => it.selected !== false);
    if (itemsToSave.length === 0) {
      setError('Pilih minimal satu barang untuk diimpor.');
      return;
    }

    const payload = itemsToSave.map((it) => {
      const matchingMaster = masterItems.find(
        (m) => m.kodeBarang === it.kodeBarang || m.namaBarang.toLowerCase() === it.namaBarang.toLowerCase()
      );
      return {
        tanggal: extractedData.tanggal || new Date().toISOString().slice(0, 10),
        bulanPengadaan: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date()),
        namaToko: extractedData.namaToko || 'Toko Rekanan SIPLah',
        kodeBarang: matchingMaster?.kodeBarang || it.kodeBarang || 'ATK-001',
        namaBarang: matchingMaster?.namaBarang || it.namaBarang,
        jumlah: Number(it.jumlah) || 1,
        jenisSatuan: it.jenisSatuan || matchingMaster?.jenisSatuan || 'Pcs',
        hargaSatuan: Number(it.hargaSatuan) || 0,
        namaSekolah: config.schoolName,
        sumberAnggaran: 'BOS Reguler' as const,
        kodeRekeningRkas: matchingMaster?.kodeRekeningRkas || '5.2.2.01.01',
        nomorBku: `BKU-BOS/${new Date().getMonth() + 1}/${Date.now().toString().slice(-2)}`,
        nomorKwitansi: extractedData.nomorKwitansi || `KWT/${Date.now().toString().slice(-4)}`,
        petugas: activeUser.nama,
        keterangan: `Otomatis dari Scan Nota AI - Toko: ${extractedData.namaToko || '-'}`,
      };
    });

    addBarangMasukBatch(payload);
    setSuccessMsg(`Berhasil menyimpan ${payload.length} barang masuk ke pembukuan sekolah!`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const selectedCount = extractedData?.items.filter((i) => i.selected !== false).length || 0;
  const calculatedGrandTotal =
    extractedData?.items
      .filter((i) => i.selected !== false)
      .reduce((sum, it) => sum + (Number(it.jumlah) * Number(it.hargaSatuan) || 0), 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-700/60 text-emerald-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Pindai &amp; OCR Nota Pengadaan Otomatis (AI)</h3>
              <p className="text-xs text-emerald-200">
                Ekstrak toko, tanggal, nomor nota, serta seluruh daftar item barang secara cerdas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Upload Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-slate-700">Foto Nota / Kwitansi Toko:</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-emerald-500 bg-slate-50/50 transition relative">
                {imagePreview ? (
                  <div className="relative group">
                    <img
                      src={imagePreview}
                      alt="Preview Nota"
                      className="max-h-52 mx-auto rounded-lg object-contain shadow-xs border border-slate-200"
                    />
                    <div className="mt-2 text-center">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold hover:underline">
                        <Upload className="w-3.5 h-3.5" /> Ganti Foto
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center py-8">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Klik untuk Unggah Foto Nota</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">JPG, PNG atau scan dokumen SIPLah</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <button
                type="button"
                onClick={handleScan}
                disabled={!imagePreview || loading}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 transition shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sedang Memindai...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-300" /> Pindai dengan AI
                  </>
                )}
              </button>
            </div>

            {/* Result Area */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-slate-700">Hasil Pembacaan Dokumen AI:</label>
              {loading ? (
                <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 text-center flex flex-col items-center justify-center h-full min-h-[220px]">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
                  <p className="text-xs font-semibold text-slate-700">Menganalisis teks kwitansi...</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Mengekstrak tanggal, nomor nota, rincian barang, kuantitas, dan harga.
                  </p>
                </div>
              ) : extractedData ? (
                <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 text-xs space-y-3">
                  <div className="grid grid-cols-2 gap-2 pb-2 border-b border-emerald-200">
                    <div>
                      <span className="text-slate-500 text-[10px] block font-semibold uppercase">Nama Toko</span>
                      <strong className="text-slate-900">{extractedData.namaToko || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block font-semibold uppercase">Tanggal</span>
                      <strong className="text-slate-900">{extractedData.tanggal || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block font-semibold uppercase">No. Kwitansi</span>
                      <strong className="text-slate-900">{extractedData.nomorKwitansi || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block font-semibold uppercase">Total Nilai</span>
                      <strong className="text-emerald-950 font-extrabold">
                        {formatRupiah(calculatedGrandTotal)}
                      </strong>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-slate-700 font-bold text-[11px]">
                        Rincian Barang Terdeteksi ({extractedData.items.length}):
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {selectedCount} item terpilih
                      </span>
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                      {extractedData.items.map((it, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border transition text-[11px] ${
                            it.selected !== false
                              ? 'bg-white border-emerald-300 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={it.selected !== false}
                              onChange={() => handleToggleItem(idx)}
                              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <div className="flex-1 min-w-0">
                              <input
                                type="text"
                                value={it.namaBarang}
                                onChange={(e) => handleUpdateItem(idx, 'namaBarang', e.target.value)}
                                className="w-full font-semibold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-emerald-500 focus:outline-none text-xs pb-0.5 mb-1"
                              />

                              <div className="grid grid-cols-3 gap-2 mt-1">
                                <div>
                                  <span className="text-[10px] text-slate-400 block">Jumlah</span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={it.jumlah}
                                    onChange={(e) => handleUpdateItem(idx, 'jumlah', Number(e.target.value))}
                                    className="w-full px-1.5 py-0.5 border border-slate-200 rounded font-semibold text-slate-800 text-[11px]"
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block">Satuan</span>
                                  <input
                                    type="text"
                                    value={it.jenisSatuan || 'Pcs'}
                                    onChange={(e) => handleUpdateItem(idx, 'jenisSatuan', e.target.value)}
                                    className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-slate-800 text-[11px]"
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block">Harga Satuan</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={it.hargaSatuan}
                                    onChange={(e) => handleUpdateItem(idx, 'hargaSatuan', Number(e.target.value))}
                                    className="w-full px-1.5 py-0.5 border border-slate-200 rounded font-semibold text-slate-800 text-[11px]"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-emerald-900 text-xs block">
                                {formatRupiah(Number(it.jumlah) * Number(it.hargaSatuan))}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 text-center flex flex-col items-center justify-center h-full min-h-[220px] text-slate-400 text-xs">
                  Foto nota belum dipindai. Unggah foto nota lalu tekan tombol "Pindai dengan AI".
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-slate-500">
            {extractedData ? (
              <span>
                Total Terpilih:{' '}
                <strong className="text-slate-900">{selectedCount} barang</strong> (
                {formatRupiah(calculatedGrandTotal)})
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 text-xs font-semibold transition"
            >
              Tutup
            </button>

            {extractedData && (
              <>
                <button
                  type="button"
                  onClick={handleApplyToForm}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-emerald-600 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold transition"
                >
                  <FileText className="w-3.5 h-3.5" /> Buka di Form Input
                </button>
                <button
                  type="button"
                  onClick={handleDirectBatchImport}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-800 text-white hover:bg-emerald-700 text-xs font-bold transition shadow-md"
                >
                  <Check className="w-4 h-4" /> Simpan Langsung Semua ({selectedCount})
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
