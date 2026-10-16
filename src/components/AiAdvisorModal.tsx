import React, { useState } from 'react';
import { X, Sparkles, Loader2, RefreshCw, AlertCircle, CheckCircle2, BookOpen, HelpCircle, Layers, Building2, Package, FileSignature, Landmark, Printer, Boxes } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({ isOpen, onClose }) => {
  const { items, stockSummary, assets } = useInventory();
  const [activeTab, setActiveTab] = useState<'ai' | 'guide'>('ai');
  const [analysisText, setAnalysisText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const runAnalysis = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          stockSummary,
          assets,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Gagal melakukan analisis AI');
      }

      setAnalysisText(json.text || 'Tidak ada rekomendasi yang dihasilkan.');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Gagal menghubungi asisten AI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-800/80 text-emerald-200 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Asisten AI &amp; Panduan Pengguna DAPSET</h3>
              <p className="text-xs text-emerald-200">Analisis cerdas inventaris &amp; tutorial langkah-demi-langkah</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('ai')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Analisis AI Cerdas
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white hover:bg-slate-200 text-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Panduan Pengguna &amp; Tutorial
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'guide' ? (
            <div className="space-y-5 text-slate-800">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <h4 className="font-black text-sm text-emerald-950 flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-emerald-700" /> Panduan Pengguna Sistem DAPSET
                </h4>
                <p className="text-xs text-emerald-900/80 leading-relaxed">
                  Tutorial langkah-demi-langkah menggunakan seluruh modul pembukuan inventaris sekolah dan tata kelola anggaran dana BOS secara akuntabel.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">1</span>
                    <Boxes className="w-4 h-4 text-emerald-700" /> Modul Master Barang (Katalog)
                  </div>
                  <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                    Masuk ke halaman <strong>Master Barang</strong> untuk mendaftarkan katalog barang habis pakai (ATK, kebersihan) maupun barang modal (elektronik, mebeler). Pastikan kode rekening RKAS dan batas minimum stok terisi agar sistem dapat mendeteksi kekurangan stok secara otomatis.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">2</span>
                    <Building2 className="w-4 h-4 text-teal-700" /> Modul Aset &amp; Inventaris (KIR / KIB)
                  </div>
                  <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                    Gunakan halaman <strong>Aset Sekolah</strong> untuk mencatat aset tetap berwujud (KIB A s.d. KIB E). Anda dapat menggunakan kalkulator depresiasi, melaporkan kerusakan, kalibrasi aset, serta mencetak stiker QR barcode secara massal untuk ditempel pada barang.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">3</span>
                    <Package className="w-4 h-4 text-blue-700" /> Buku Persediaan &amp; Kartu Stok
                  </div>
                  <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                    Halaman <strong>Persediaan</strong> menampilkan kalkulasi saldo stok real-time (Total Masuk dikurangi Total Keluar). Sistem memberikan penanda warna hijau (aman), kuning (menipis/minimum), dan merah (habis) beserta kartu kendali stok untuk setiap barang.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">4</span>
                    <Layers className="w-4 h-4 text-indigo-700" /> Barang Masuk &amp; Keluar (Faktur &amp; SBPB)
                  </div>
                  <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                    Catat pengadaan barang baru pada menu <strong>Barang Masuk</strong> (tersedia fitur Input Faktur Kolektif &amp; Scan Nota AI). Catat distribusi pemakaian pada menu <strong>Barang Keluar</strong> untuk menerbitkan Surat Bukti Pengeluaran Barang (SBPB).
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">5</span>
                    <FileSignature className="w-4 h-4 text-amber-700" /> Pengambilan ATK (Digital Signature)
                  </div>
                  <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                    Modul <strong>Pengambilan ATK</strong> memungkinkan guru dan staf mengambil barang persediaan dengan membubuhkan tanda tangan digital langsung di layar (canvas) serta melampirkan foto bukti serah terima untuk keabsahan arsip sekolah.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">6</span>
                    <Landmark className="w-4 h-4 text-teal-800" /> Rekonsiliasi Nasional &amp; Cetak Laporan
                  </div>
                  <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                    Gunakan pusat <strong>Rekonsiliasi Nasional</strong> untuk sinkronisasi SIPD-BMD dan cetak Berita Acara triwulanan. Manfaatkan tombol <strong>'Mode Cetak Laporan'</strong> berwarna hitam di setiap tabel untuk mencetak laporan bersih tanpa menu samping.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {!analysisText && !loading && (
                <div className="text-center py-10 px-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Mulai Analisis Cerdas Persediaan</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                    Gemini AI akan memindai riwayat barang masuk, laju pengeluaran ATK, batas stok minimum, dan kondisi aset fisik sekolah Anda untuk menyusun rekomendasi pengadaan.
                  </p>
                  <button
                    type="button"
                    onClick={runAnalysis}
                    className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" /> Mulai Analisis Sekarang
                  </button>
                </div>
              )}

              {loading && (
                <div className="text-center py-16">
                  <Loader2 className="w-9 h-9 text-emerald-600 animate-spin mx-auto mb-3" />
                  <div className="text-xs font-bold text-slate-800">Sedang Menganalisis Inventaris Sekolah...</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Menghitung laju pemakaian stok &amp; mendeteksi barang kritis.
                  </div>
                </div>
              )}

              {analysisText && !loading && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Rekomendasi Terkini Berdasarkan Data Real-time
                    </span>
                    <button
                      type="button"
                      onClick={runAnalysis}
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-800 hover:underline font-bold cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Analisis Ulang
                    </button>
                  </div>

                  <div className="prose prose-sm max-w-none text-xs text-slate-800 bg-slate-50/80 p-5 rounded-2xl border border-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                    {analysisText}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 text-xs font-semibold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
