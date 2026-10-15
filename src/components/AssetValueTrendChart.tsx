import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Coins,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Info,
} from 'lucide-react';
import { AssetRecord } from '../types';
import { formatRupiah } from '../utils/format';

interface AssetValueTrendChartProps {
  assets: AssetRecord[];
  onNavigate?: (page: any) => void;
}

interface TrendDataPoint {
  year: number;
  yearLabel: string;
  totalPerolehan: number;
  totalNilaiBuku: number;
  totalPenyusutanKumulatif: number;
  jumlahUnitAset: number;
  isProyeksi: boolean;
}

export const AssetValueTrendChart: React.FC<AssetValueTrendChartProps> = ({
  assets,
  onNavigate,
}) => {
  const [viewMode, setViewMode] = useState<'line' | 'area'>('line');
  const [projectionYears, setProjectionYears] = useState<number>(4); // 4 years into future

  const currentYear = new Date().getFullYear();

  // Compute historical & projected asset valuation over time
  const trendData = useMemo(() => {
    let minYear = currentYear - 3;
    let maxYear = currentYear + projectionYears;

    assets.forEach((a) => {
      const yr = Number(a.tahunPerolehan) || Number(a.tanggalBku?.substring(0, 4)) || currentYear;
      if (yr < minYear && yr >= 2015) {
        minYear = yr;
      }
    });

    const yearsList: number[] = [];
    for (let y = minYear; y <= maxYear; y++) {
      yearsList.push(y);
    }

    const result: TrendDataPoint[] = yearsList.map((targetYear) => {
      let totalPerolehan = 0;
      let totalNilaiBuku = 0;
      let totalPenyusutanKumulatif = 0;
      let unitCount = 0;

      assets.forEach((asset) => {
        if (asset.status === 'DIHAPUSKAN') return;

        const acqYear = Number(asset.tahunPerolehan) || Number(asset.tanggalBku?.substring(0, 4)) || (currentYear - 1);
        const initialVal = Number(asset.totalNilai) || (Number(asset.hargaSatuan) * Number(asset.jumlah)) || 0;
        const usefulLife = Number(asset.masaManfaat) || 5;

        if (targetYear < acqYear) {
          return;
        }

        unitCount += Number(asset.jumlah || 1);
        totalPerolehan += initialVal;

        const yearsElapsed = targetYear - acqYear;
        const annualDepreciation = initialVal / Math.max(1, usefulLife);
        const kumulatifDep = Math.min(initialVal * 0.9, yearsElapsed * annualDepreciation);
        const bookValue = Math.max(initialVal * 0.1, initialVal - kumulatifDep);

        totalPenyusutanKumulatif += kumulatifDep;
        totalNilaiBuku += bookValue;
      });

      return {
        year: targetYear,
        yearLabel: String(targetYear),
        totalPerolehan,
        totalNilaiBuku: Math.round(totalNilaiBuku),
        totalPenyusutanKumulatif: Math.round(totalPenyusutanKumulatif),
        jumlahUnitAset: unitCount,
        isProyeksi: targetYear > currentYear,
      };
    });

    return result;
  }, [assets, currentYear, projectionYears]);

  // Current year metrics
  const currentMetrics = useMemo(() => {
    const currentPoint = trendData.find((d) => d.year === currentYear) || trendData[trendData.length - 1];
    const previousPoint = trendData.find((d) => d.year === currentYear - 1) || currentPoint;
    const futurePoint = trendData.find((d) => d.year === currentYear + 3) || currentPoint;

    const depreciationRate = previousPoint?.totalPerolehan > 0
      ? ((previousPoint.totalPerolehan - (currentPoint?.totalNilaiBuku || 0)) / previousPoint.totalPerolehan) * 100
      : 0;

    return {
      totalPerolehan: currentPoint?.totalPerolehan || 0,
      totalNilaiBuku: currentPoint?.totalNilaiBuku || 0,
      totalPenyusutan: currentPoint?.totalPenyusutanKumulatif || 0,
      unitAset: currentPoint?.jumlahUnitAset || 0,
      depreciationRate: Math.max(0, depreciationRate),
      projectedValue3Years: futurePoint?.totalNilaiBuku || 0,
    };
  }, [trendData, currentYear]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 text-[11px] font-bold mb-2 border border-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Analisis Keuangan &amp; Depresiasi Aset
          </div>
          <h3 className="font-extrabold text-slate-900 text-base md:text-lg">
            Analisis Tren Nilai Aset &amp; Proyeksi Depresiasi Masa Depan
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Grafik historis dan proyeksi masa depan berdasarkan masa manfaat (useful life) dan tahun perolehan aset inventaris sekolah.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('line')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'line' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Line Chart
            </button>
            <button
              onClick={() => setViewMode('area')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'area' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Area Chart
            </button>
          </div>

          <select
            value={projectionYears}
            onChange={(e) => setProjectionYears(Number(e.target.value))}
            aria-label="Pilih rentang proyeksi tahun"
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value={2}>Proyeksi 2 Tahun</option>
            <option value={4}>Proyeksi 4 Tahun</option>
            <option value={6}>Proyeksi 6 Tahun</option>
          </select>
        </div>
      </div>

      {/* Summary Valuation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-slate-600" /> Total Perolehan Awal
            </div>
            <div className="text-lg font-black text-slate-900 mt-1">
              {formatRupiah(currentMetrics.totalPerolehan)}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60">
            {currentMetrics.unitAset} unit aset tercatat
          </div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Sisa Nilai Buku (Book Value)
            </div>
            <div className="text-lg font-black text-indigo-950 mt-1">
              {formatRupiah(currentMetrics.totalNilaiBuku)}
            </div>
          </div>
          <div className="text-[11px] text-indigo-700 mt-2 pt-2 border-t border-indigo-200/60 flex items-center justify-between">
            <span>Akumulasi Penyusutan:</span>
            <span className="font-bold">{formatRupiah(currentMetrics.totalPenyusutan)}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-100 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-amber-600" /> Estimasi Depresiasi
            </div>
            <div className="text-lg font-black text-amber-950 mt-1">
              {currentMetrics.depreciationRate.toFixed(1)}% <span className="text-xs font-semibold">dari perolehan</span>
            </div>
          </div>
          <div className="text-[11px] text-amber-700 mt-2 pt-2 border-t border-amber-200/60">
            Penurunan nilai wajar inventaris
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Proyeksi Nilai ({currentYear + 3})
            </div>
            <div className="text-lg font-black text-emerald-950 mt-1">
              {formatRupiah(currentMetrics.projectedValue3Years)}
            </div>
          </div>
          <div className="text-[11px] text-emerald-700 mt-2 pt-2 border-t border-emerald-200/60">
            Proyeksi sisa nilai aset 3 tahun ke depan
          </div>
        </div>
      </div>

      {/* Recharts Line/Area Chart */}
      <div className="w-full h-80 pt-2">
        {trendData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            <Info className="w-10 h-10 text-slate-300 mb-2" />
            Belum ada data riwayat perolehan aset untuk dianalisis.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'line' ? (
              <LineChart data={trendData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="yearLabel"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => (Number(val) > currentYear ? `${val} (Proj)` : val)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}jt`}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    formatRupiah(Number(value)),
                    name === 'totalPerolehan'
                      ? 'Nilai Perolehan Awal'
                      : name === 'totalNilaiBuku'
                      ? 'Nilai Buku (Book Value)'
                      : 'Akumulasi Penyusutan',
                  ]}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="totalPerolehan"
                  name="Nilai Perolehan Awal"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#059669' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalNilaiBuku"
                  name="Nilai Buku (Depresiasi)"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#4f46e5' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalPenyusutanKumulatif"
                  name="Akumulasi Penyusutan"
                  stroke="#d97706"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={{ r: 3 }}
                />
              </LineChart>
            ) : (
              <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="yearLabel" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}jt`}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    formatRupiah(Number(value)),
                    name === 'totalPerolehan' ? 'Nilai Perolehan Awal' : 'Nilai Buku (Book Value)',
                  ]}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="totalPerolehan"
                  name="Nilai Perolehan Awal"
                  stroke="#059669"
                  fill="#059669"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="totalNilaiBuku"
                  name="Nilai Buku (Depresiasi)"
                  stroke="#4f46e5"
                  fill="#4f46e5"
                  fillOpacity={0.25}
                  strokeWidth={2.5}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Garis putus-putus pada grafik menunjukkan estimasi proyeksi depresiasi linier tahun mendatang.</span>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('aset')}
            className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:text-indigo-900 transition shrink-0"
          >
            <span>Kelola Inventaris Aset KIB</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
