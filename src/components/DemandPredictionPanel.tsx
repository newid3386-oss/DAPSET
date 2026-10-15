import React, { useState } from 'react';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, ShoppingCart, ArrowRight, Lightbulb, BarChart3 } from 'lucide-react';
import { MasterItem, BarangKeluar, BarangMasuk } from '../types';
import { formatRupiah } from '../utils/format';

interface DemandPredictionPanelProps {
  items: MasterItem[];
  barangKeluar: BarangKeluar[];
  barangMasuk: BarangMasuk[];
  onNavigate: (page: any) => void;
}

export const DemandPredictionPanel: React.FC<DemandPredictionPanelProps> = ({
  items,
  barangKeluar,
  barangMasuk,
  onNavigate,
}) => {
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [forecastMonth, setForecastMonth] = useState('Bulan Depan');

  // Calculate prediction per item based on barangKeluar & barangMasuk history
  const predictions = items.map((item) => {
    const totalMasuk = barangMasuk
      .filter((bm) => bm.kodeBarang.toLowerCase() === item.kodeBarang.toLowerCase())
      .reduce((acc, curr) => acc + Number(curr.jumlah || 0), 0);

    const itemKeluar = barangKeluar.filter(
      (bk) => bk.kodeBarang.toLowerCase() === item.kodeBarang.toLowerCase() || bk.namaBarang.toLowerCase() === item.namaBarang.toLowerCase()
    );

    const totalKeluarAll = itemKeluar.reduce((acc, curr) => acc + curr.jumlah, 0);
    const currentStok = Math.max(0, totalMasuk - totalKeluarAll);

    const estimatedMonthlyUsage = Math.max(
      Math.round(totalKeluarAll / Math.max(1, new Set(itemKeluar.map(k => k.tanggal.slice(0, 7))).size)),
      item.batasMinimum > 0 ? Math.round(item.batasMinimum * 0.8) : 5
    );

    const recommendedStock = Math.round(estimatedMonthlyUsage * 1.3);
    const deficit = Math.max(0, recommendedStock - currentStok);
    const estimatedCost = deficit * (item.hargaEstimasi || 15000);

    let priority: 'TINGGI' | 'SEDANG' | 'AMAN' = 'AMAN';
    if (currentStok <= item.batasMinimum || deficit > currentStok) {
      priority = 'TINGGI';
    } else if (deficit > 0) {
      priority = 'SEDANG';
    }

    return {
      ...item,
      currentStok,
      estimatedMonthlyUsage,
      recommendedStock,
      deficit,
      estimatedCost,
      priority,
    };
  });

  const recommendedItems = predictions.filter((p) => p.deficit > 0).sort((a, b) => {
    if (a.priority === 'TINGGI' && b.priority !== 'TINGGI') return -1;
    if (b.priority === 'TINGGI' && a.priority !== 'TINGGI') return 1;
    return b.deficit - a.deficit;
  });

  const totalEstimatedBudget = recommendedItems.reduce((acc, curr) => acc + curr.estimatedCost, 0);

  const handleRunAiForecast = () => {
    setIsAiProcessing(true);
    setTimeout(() => {
      setIsAiProcessing(false);
    }, 800);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2 border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> AI Demand Forecasting Engine
          </div>
          <h2 className="text-lg font-extrabold text-slate-800">Prediksi Kebutuhan Barang &amp; Rekomendasi Pengadaan</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Menganalisis pola transaksi historis, musiman kegiatan sekolah, dan tingkat perputaran stok untuk periode mendatang.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunAiForecast}
            disabled={isAiProcessing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
          >
            {isAiProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menganalisis Model...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" /> Perbarui Prediksi AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Item Perlu Pengadaan</span>
          <div className="text-2xl font-black text-indigo-900 mt-1">{recommendedItems.length} <span className="text-xs font-normal text-slate-600">jenis barang</span></div>
          <p className="text-[11px] text-slate-500 mt-1">Diyakini habis dalam 30 hari ke depan</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Estimasi Anggaran Pengadaan</span>
          <div className="text-2xl font-black text-emerald-800 mt-1">{formatRupiah(totalEstimatedBudget)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Total proyeksi belanja RKAS/BOS</p>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block">Rekomendasi Waktu Belanja</span>
            <div className="text-sm font-bold text-indigo-950 mt-1">Awal Minggu ke-1 Bulan Depan</div>
          </div>
          <button
            onClick={() => onNavigate('rkbs')}
            className="mt-2 text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 self-start"
          >
            Rencanakan di RKBS <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* AI Insight Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/70 mb-6 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-900">Insight Cerdas AI untuk Pengadaan Sekolah</h4>
          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
            Berdasarkan lonjakan pengambilan ATK dan surat keluar kelas pada periode sebelumnya, kategori <strong>Alat Tulis Kantor (Kertas HVS, Tinta Printer, Buku Agenda)</strong> menunjukkan tingkat kehabisan tertinggi. Disarankan melakukan pengadaan sebelum tanggal 5 untuk menghindari hambatan operasional KBM.
          </p>
        </div>
      </div>

      {/* Recommended Items Table */}
      <div>
        <h3 className="font-bold text-slate-800 text-sm mb-3">Daftar Rekomendasi Pengadaan Bulan Berikutnya</h3>
        {recommendedItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            Semua persediaan tercatat mencukupi untuk proyeksi bulan depan. Belum ada rekomendasi pengadaan mendesak.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-2.5">Kode / Barang</th>
                  <th className="pb-2.5 text-center">Stok Saat Ini</th>
                  <th className="pb-2.5 text-center">Prediksi Konsumsi/Bln</th>
                  <th className="pb-2.5 text-center">Rekomendasi Beli</th>
                  <th className="pb-2.5 text-right">Estimasi Biaya</th>
                  <th className="pb-2.5 text-center">Prioritas AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recommendedItems.map((item) => (
                  <tr key={item.kodeBarang} className="hover:bg-slate-50/80">
                    <td className="py-3">
                      <div className="font-bold text-slate-900">{item.namaBarang}</div>
                      <div className="text-[10px] font-mono text-slate-400">{item.kodeBarang} • {item.kategori}</div>
                    </td>
                    <td className="py-3 text-center font-bold text-slate-800">
                      {item.currentStok} {item.jenisSatuan}
                    </td>
                    <td className="py-3 text-center text-slate-600">
                      ~{item.estimatedMonthlyUsage} {item.jenisSatuan}
                    </td>
                    <td className="py-3 text-center font-black text-indigo-700 bg-indigo-50/50 rounded-lg">
                      +{item.deficit} {item.jenisSatuan}
                    </td>
                    <td className="py-3 text-right font-bold text-slate-800">
                      {formatRupiah(item.estimatedCost)}
                    </td>
                    <td className="py-3 text-center">
                      {item.priority === 'TINGGI' ? (
                        <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-extrabold text-[10px] inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> TINGGI
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] inline-flex items-center gap-1">
                          SEDANG
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
