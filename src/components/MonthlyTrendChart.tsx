import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  AreaChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  LineChart as LineChartIcon,
  Coins,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
  Percent,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { BarangMasuk, BarangKeluar, MasterItem } from '../types';
import { formatRupiah } from '../utils/format';

interface MonthlyTrendChartProps {
  barangMasuk: BarangMasuk[];
  barangKeluar: BarangKeluar[];
  masterItems?: MasterItem[];
  onNavigate?: (page: any) => void;
}

interface MonthlyDataPoint {
  monthKey: string; // e.g. "2026-01"
  monthLabel: string; // e.g. "Jan 2026"
  masukQty: number;
  keluarQty: number;
  masukNilai: number;
  keluarNilai: number;
  selisihQty: number;
  selisihNilai: number;
  txMasukCount: number;
  txKeluarCount: number;
  rasioDistribusi: number; // in percent
}

const MONTH_NAMES_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Ags',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const FULL_MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({
  barangMasuk,
  barangKeluar,
  masterItems = [],
  onNavigate,
}) => {
  const [metricMode, setMetricMode] = useState<'volume' | 'nilai'>('volume');
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [showTableBreakdown, setShowTableBreakdown] = useState<boolean>(false);
  const [showRunwayForecast, setShowRunwayForecast] = useState<boolean>(true);

  // Smart Stock Runway Calculation (Velocity & Depletion Prediction)
  const stockRunway = useMemo(() => {
    const masukMap = new Map<string, number>();
    barangMasuk.forEach((b) => {
      masukMap.set(b.kodeBarang, (masukMap.get(b.kodeBarang) || 0) + Number(b.jumlah || 0));
    });
    const keluarMap = new Map<string, number>();
    barangKeluar.forEach((b) => {
      keluarMap.set(b.kodeBarang, (keluarMap.get(b.kodeBarang) || 0) + Number(b.jumlah || 0));
    });

    const itemsWithRunway = masterItems
      .filter((it) => it.tipe === 'HABIS_PAKAI')
      .map((item) => {
        const masuk = masukMap.get(item.kodeBarang) || 0;
        const keluar = keluarMap.get(item.kodeBarang) || 0;
        const sisa = Math.max(0, masuk - keluar);
        const lajuBulanan = Math.max(1, Math.round(keluar / 8));
        const hariKetahanan = sisa === 0 ? 0 : Math.round((sisa / lajuBulanan) * 30);

        let status: 'HABIS' | 'KRITIS' | 'PERHATIAN' | 'AMAN' = 'AMAN';
        if (sisa <= 0) status = 'HABIS';
        else if (hariKetahanan <= 14) status = 'KRITIS';
        else if (hariKetahanan <= 35) status = 'PERHATIAN';

        return {
          kodeBarang: item.kodeBarang,
          namaBarang: item.namaBarang,
          kategori: item.kategori,
          jenisSatuan: item.jenisSatuan,
          sisaStok: sisa,
          lajuBulanan,
          hariKetahanan,
          status,
          rekomendasiBeli: Math.max(item.batasMinimum * 2, lajuBulanan * 2),
        };
      })
      .sort((a, b) => a.hariKetahanan - b.hariKetahanan);

    return itemsWithRunway;
  }, [barangMasuk, barangKeluar, masterItems]);

  // Price lookup map for estimating barangKeluar valuation if needed
  const itemPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    masterItems.forEach((item) => {
      map.set(item.kodeBarang, item.hargaEstimasi || 0);
    });
    return map;
  }, [masterItems]);

  // Extract available years from records
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    barangMasuk.forEach((bm) => {
      if (bm.tanggal) {
        const y = bm.tanggal.substring(0, 4);
        if (y && !isNaN(Number(y))) yearsSet.add(y);
      }
    });
    barangKeluar.forEach((bk) => {
      if (bk.tanggal) {
        const y = bk.tanggal.substring(0, 4);
        if (y && !isNaN(Number(y))) yearsSet.add(y);
      }
    });
    // Default fallback to 2026 if empty
    if (yearsSet.size === 0) yearsSet.add('2026');
    const sorted = Array.from(yearsSet).sort().reverse();
    return sorted;
  }, [barangMasuk, barangKeluar]);

  // Synchronize selectedYear if current is not in availableYears
  const activeYear = availableYears.includes(selectedYear)
    ? selectedYear
    : availableYears[0] || '2026';

  // Aggregate monthly data for the selected year (all 12 months)
  const monthlyData = useMemo(() => {
    const yNum = activeYear;

    // Initialize 12 months array for clean continuous chart
    const dataByMonth: MonthlyDataPoint[] = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthStr = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
      return {
        monthKey: `${yNum}-${monthStr}`,
        monthLabel: `${MONTH_NAMES_ID[i]}`,
        masukQty: 0,
        keluarQty: 0,
        masukNilai: 0,
        keluarNilai: 0,
        selisihQty: 0,
        selisihNilai: 0,
        txMasukCount: 0,
        txKeluarCount: 0,
        rasioDistribusi: 0,
      };
    });

    const monthMap = new Map<string, MonthlyDataPoint>();
    dataByMonth.forEach((dp) => monthMap.set(dp.monthKey, dp));

    // Aggregate Barang Masuk
    barangMasuk.forEach((bm) => {
      if (!bm.tanggal) return;
      const yr = bm.tanggal.substring(0, 4);
      if (yr !== yNum) return;

      const m = bm.tanggal.substring(0, 7); // "YYYY-MM"
      const target = monthMap.get(m);
      if (target) {
        target.masukQty += Number(bm.jumlah) || 0;
        target.masukNilai += Number(bm.totalPengadaan) || 0;
        target.txMasukCount += 1;
      }
    });

    // Aggregate Barang Keluar
    barangKeluar.forEach((bk) => {
      if (!bk.tanggal) return;
      const yr = bk.tanggal.substring(0, 4);
      if (yr !== yNum) return;

      const m = bk.tanggal.substring(0, 7); // "YYYY-MM"
      const target = monthMap.get(m);
      if (target) {
        const qty = Number(bk.jumlah) || 0;
        target.keluarQty += qty;
        target.txKeluarCount += 1;

        // Estimate valuation for distribution based on master price
        const estPrice = itemPriceMap.get(bk.kodeBarang) || 0;
        target.keluarNilai += qty * estPrice;
      }
    });

    // Compute derived selisih & rasio
    dataByMonth.forEach((dp) => {
      dp.selisihQty = dp.masukQty - dp.keluarQty;
      dp.selisihNilai = dp.masukNilai - dp.keluarNilai;
      dp.rasioDistribusi =
        dp.masukQty > 0 ? Math.round((dp.keluarQty / dp.masukQty) * 100) : 0;
    });

    return dataByMonth;
  }, [activeYear, barangMasuk, barangKeluar, itemPriceMap]);

  // Summary Totals
  const summary = useMemo(() => {
    let totalMasukQty = 0;
    let totalKeluarQty = 0;
    let totalMasukNilai = 0;
    let totalKeluarNilai = 0;
    let activeMonthsCount = 0;

    monthlyData.forEach((d) => {
      totalMasukQty += d.masukQty;
      totalKeluarQty += d.keluarQty;
      totalMasukNilai += d.masukNilai;
      totalKeluarNilai += d.keluarNilai;
      if (d.masukQty > 0 || d.keluarQty > 0) {
        activeMonthsCount += 1;
      }
    });

    const netSurplusQty = totalMasukQty - totalKeluarQty;
    const overallRatio =
      totalMasukQty > 0 ? Math.round((totalKeluarQty / totalMasukQty) * 100) : 0;
    const avgMasukPerMonth =
      activeMonthsCount > 0 ? Math.round(totalMasukQty / activeMonthsCount) : 0;

    return {
      totalMasukQty,
      totalKeluarQty,
      totalMasukNilai,
      totalKeluarNilai,
      netSurplusQty,
      overallRatio,
      avgMasukPerMonth,
      activeMonthsCount,
    };
  }, [monthlyData]);

  // Formatter for YAxis tick
  const formatYAxisTick = (val: number) => {
    if (metricMode === 'volume') {
      return val.toLocaleString('id-ID');
    }
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(0)} Jt`;
    }
    if (val >= 1_000) {
      return `${(val / 1_000).toFixed(0)} Rb`;
    }
    return `${val}`;
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const monthIdx = MONTH_NAMES_ID.indexOf(label);
      const fullMonth =
        monthIdx >= 0 ? `${FULL_MONTH_NAMES_ID[monthIdx]} ${activeYear}` : label;
      const dataPoint = monthlyData.find((d) => d.monthLabel === label);

      const masukVal = payload.find((p: any) => p.dataKey === 'masuk')?.value || 0;
      const keluarVal = payload.find((p: any) => p.dataKey === 'keluar')?.value || 0;

      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs backdrop-blur-md min-w-[220px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/80">
            <span className="font-bold text-slate-100 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              {fullMonth}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {dataPoint?.monthKey}
            </span>
          </div>

          <div className="space-y-2">
            {/* Barang Masuk */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                <span className="text-slate-300">Pengadaan Masuk:</span>
              </div>
              <span className="font-bold text-emerald-400">
                {metricMode === 'volume'
                  ? `${masukVal.toLocaleString('id-ID')} unit`
                  : formatRupiah(masukVal)}
              </span>
            </div>

            {/* Barang Keluar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                <span className="text-slate-300">Distribusi Keluar:</span>
              </div>
              <span className="font-bold text-amber-400">
                {metricMode === 'volume'
                  ? `${keluarVal.toLocaleString('id-ID')} unit`
                  : formatRupiah(keluarVal)}
              </span>
            </div>

            {/* Selisih */}
            {dataPoint && (
              <div className="pt-2 border-t border-slate-800 text-[11px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Selisih Bersih:</span>
                  <span
                    className={`font-semibold ${
                      dataPoint.selisihQty >= 0 ? 'text-teal-300' : 'text-rose-400'
                    }`}
                  >
                    {metricMode === 'volume'
                      ? `${dataPoint.selisihQty > 0 ? '+' : ''}${dataPoint.selisihQty.toLocaleString('id-ID')} unit`
                      : formatRupiah(dataPoint.selisihNilai)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Frekuensi Transaksi:</span>
                  <span className="font-mono text-slate-300">
                    {dataPoint.txMasukCount} Msk / {dataPoint.txKeluarCount} Klr
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Prepare chart series data
  const chartSeriesData = monthlyData.map((d) => ({
    name: d.monthLabel,
    masuk: metricMode === 'volume' ? d.masukQty : d.masukNilai,
    keluar: metricMode === 'volume' ? d.keluarQty : d.keluarNilai,
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Tren Bulanan Pengadaan &amp; Distribusi Barang
              </h3>
              <p className="text-xs text-slate-500">
                Visualisasi dinamika barang masuk (pengadaan BOS/SIPLah) versus barang keluar (distribusi ATK)
              </p>
            </div>
          </div>
        </div>

        {/* Action Pills / Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year selector */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs">
            {availableYears.map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  activeYear === yr
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          {/* Metric mode toggle (Volume vs Rupiah) */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs">
            <button
              onClick={() => setMetricMode('volume')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
                metricMode === 'volume'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Volume (Qty)
            </button>
            <button
              onClick={() => setMetricMode('nilai')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
                metricMode === 'nilai'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              Nilai (Rp)
            </button>
          </div>

          {/* Chart type toggle (Bar vs Area) */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs">
            <button
              onClick={() => setChartType('bar')}
              title="Tampilan Grafik Batang"
              className={`p-1.5 rounded-lg transition ${
                chartType === 'bar'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('area')}
              title="Tampilan Grafik Area / Gelombang"
              className={`p-1.5 rounded-lg transition ${
                chartType === 'area'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LineChartIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-700 block">
              Total Pengadaan Masuk
            </span>
            <span className="text-lg font-extrabold text-emerald-950">
              {metricMode === 'volume'
                ? `${summary.totalMasukQty.toLocaleString('id-ID')} unit`
                : formatRupiah(summary.totalMasukNilai)}
            </span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">
              Tahun {activeYear}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-200/60 text-emerald-800">
            <ArrowDownToLine className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-700 block">
              Total Distribusi Keluar
            </span>
            <span className="text-lg font-extrabold text-amber-950">
              {metricMode === 'volume'
                ? `${summary.totalKeluarQty.toLocaleString('id-ID')} unit`
                : formatRupiah(summary.totalKeluarNilai)}
            </span>
            <span className="text-[10px] text-amber-600 block mt-0.5">
              Tahun {activeYear}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-amber-200/60 text-amber-800">
            <ArrowUpFromLine className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-teal-700 block">
              Net Akumulasi Persediaan
            </span>
            <span className="text-lg font-extrabold text-teal-950">
              {metricMode === 'volume'
                ? `${summary.netSurplusQty > 0 ? '+' : ''}${summary.netSurplusQty.toLocaleString('id-ID')} unit`
                : formatRupiah(summary.totalMasukNilai - summary.totalKeluarNilai)}
            </span>
            <span className="text-[10px] text-teal-600 block mt-0.5">
              Selisih Masuk - Keluar
            </span>
          </div>
          <div className="p-2 rounded-lg bg-teal-200/60 text-teal-800">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-600 block">
              Rasio Penyerapan / Distribusi
            </span>
            <span className="text-lg font-extrabold text-slate-900">
              {summary.overallRatio}%
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {summary.overallRatio >= 50 ? 'Rotasi aktif' : 'Stok stabil di gudang'}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-200/60 text-slate-700">
            <Percent className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div className="w-full h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart
              data={chartSeriesData}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorBarMasuk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="colorBarKeluar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ea580c" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={formatYAxisTick}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 600 }}
                formatter={(value) => {
                  return value === 'masuk' ? (
                    <span className="text-emerald-800">Barang Masuk (Pengadaan)</span>
                  ) : (
                    <span className="text-amber-800">Barang Keluar (Distribusi)</span>
                  );
                }}
              />
              <Bar
                dataKey="masuk"
                name="masuk"
                fill="url(#colorBarMasuk)"
                radius={[5, 5, 0, 0]}
                barSize={18}
              />
              <Bar
                dataKey="keluar"
                name="keluar"
                fill="url(#colorBarKeluar)"
                radius={[5, 5, 0, 0]}
                barSize={18}
              />
            </BarChart>
          ) : (
            <AreaChart
              data={chartSeriesData}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorAreaMasuk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorAreaKeluar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={formatYAxisTick}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 600 }}
                formatter={(value) => {
                  return value === 'masuk' ? (
                    <span className="text-emerald-800">Barang Masuk (Pengadaan)</span>
                  ) : (
                    <span className="text-amber-800">Barang Keluar (Distribusi)</span>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="masuk"
                name="masuk"
                stroke="#059669"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorAreaMasuk)"
              />
              <Area
                type="monotone"
                dataKey="keluar"
                name="keluar"
                stroke="#ea580c"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorAreaKeluar)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Accordion Toggle for Detailed Tabular Breakdown */}
      <div className="pt-2 border-t border-slate-100">
        <button
          onClick={() => setShowTableBreakdown((prev) => !prev)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-emerald-800 py-1.5 px-2 rounded-lg hover:bg-slate-50 transition"
        >
          <span className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            {showTableBreakdown
              ? 'Sembunyikan Rincian Rekapitulasi Bulanan'
              : `Tampilkan Tabel Rincian Data Per Bulan (${activeYear})`}
          </span>
          {showTableBreakdown ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showTableBreakdown && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Bulan</th>
                  <th className="py-2.5 px-3 text-right">Pengadaan Masuk (Qty)</th>
                  <th className="py-2.5 px-3 text-right">Distribusi Keluar (Qty)</th>
                  <th className="py-2.5 px-3 text-right">Selisih Bersih (Qty)</th>
                  <th className="py-2.5 px-3 text-right">Total Nilai Masuk (Rp)</th>
                  <th className="py-2.5 px-3 text-center">Rasio (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyData.map((row, idx) => (
                  <tr
                    key={row.monthKey}
                    className={
                      row.masukQty > 0 || row.keluarQty > 0
                        ? 'hover:bg-slate-50/70 font-medium'
                        : 'text-slate-400 hover:bg-slate-50/40'
                    }
                  >
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {FULL_MONTH_NAMES_ID[idx]} {activeYear}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-700 font-bold">
                      {row.masukQty > 0 ? `${row.masukQty.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-amber-700 font-bold">
                      {row.keluarQty > 0 ? `${row.keluarQty.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {row.masukQty > 0 || row.keluarQty > 0 ? (
                        <span
                          className={
                            row.selisihQty >= 0 ? 'text-teal-700' : 'text-rose-600'
                          }
                        >
                          {row.selisihQty > 0 ? `+${row.selisihQty}` : row.selisihQty}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700">
                      {row.masukNilai > 0 ? formatRupiah(row.masukNilai) : '-'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {row.masukQty > 0 ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.rasioDistribusi > 75
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {row.rasioDistribusi}%
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Smart Runway & Reorder Forecasting Section */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700" />
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
              Analisis Laju Konsumsi &amp; Prediksi Ketahanan Stok (Runway)
            </h4>
          </div>
          <button
            onClick={() => setShowRunwayForecast((prev) => !prev)}
            className="text-xs font-semibold text-emerald-800 hover:underline"
          >
            {showRunwayForecast ? 'Sembunyikan' : 'Tampilkan Prediksi'}
          </button>
        </div>

        {showRunwayForecast && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stockRunway.slice(0, 6).map((item) => (
              <div
                key={item.kodeBarang}
                className={`p-3 rounded-xl border text-xs flex flex-col justify-between transition ${
                  item.status === 'HABIS'
                    ? 'bg-rose-50/70 border-rose-200'
                    : item.status === 'KRITIS'
                    ? 'bg-amber-50/70 border-amber-200'
                    : item.status === 'PERHATIAN'
                    ? 'bg-amber-50/30 border-amber-100'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-slate-500 font-bold">
                      {item.kodeBarang}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'HABIS'
                          ? 'bg-rose-600 text-white'
                          : item.status === 'KRITIS'
                          ? 'bg-amber-500 text-white'
                          : item.status === 'PERHATIAN'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.status === 'HABIS'
                        ? 'Habis'
                        : item.status === 'KRITIS'
                        ? `Kritis (~${item.hariKetahanan} hari)`
                        : item.status === 'PERHATIAN'
                        ? `Perhatian (~${item.hariKetahanan} hari)`
                        : `Aman (>30 hari)`}
                    </span>
                  </div>

                  <div className="font-semibold text-slate-900 truncate" title={item.namaBarang}>
                    {item.namaBarang}
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                    <div>
                      <span>Sisa Stok:</span>{' '}
                      <strong className="text-slate-900 font-bold">
                        {item.sisaStok} {item.jenisSatuan}
                      </strong>
                    </div>
                    <div>
                      <span>Laju Keluar:</span>{' '}
                      <span className="font-medium text-slate-700">
                        ~{item.lajuBulanan} {item.jenisSatuan}/bln
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    Saran BOS: +{item.rekomendasiBeli} {item.jenisSatuan}
                  </span>
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('rkbs')}
                      className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                    >
                      Usulkan RKBS <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
