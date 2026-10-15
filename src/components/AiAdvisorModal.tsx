import React, { useState } from 'react';
import { X, Sparkles, Loader2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({ isOpen, onClose }) => {
  const { items, stockSummary, assets } = useInventory();
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
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-800/80 text-emerald-200 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Asisten AI Inventaris &amp; Anggaran Sekolah</h3>
              <p className="text-xs text-emerald-200">Analisis stok kritis, efisiensi belanja BOS &amp; rekomendasi RKAS</p>
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
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
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
                className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition"
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
                  className="inline-flex items-center gap-1 text-[11px] text-emerald-800 hover:underline font-bold"
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
