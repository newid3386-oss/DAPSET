import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Layers,
  TrendingUp,
  Package,
  Building2,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { BarangKeluar, MasterItem, StockSummaryItem } from '../types';
import { formatRupiah } from '../utils/format';

interface CategoryUsageBarChartProps {
  barangKeluar: BarangKeluar[];
  masterItems: MasterItem[];
  stockSummary: StockSummaryItem[];
  onNavigate?: (page: any) => void;
}

const COLORS = [
  '#059669', // emerald-600
  '#0d9488', // teal-600
  '#2563eb', // blue-600
  '#d97706', // amber-600
  '#7c3aed', // violet-600
  '#db2777', // pink-600
  '#4f46e5', // indigo-600
  '#16a34a', // green-600
  '#ca8a04', // yellow-600
  '#9333ea', // purple-600
];

export const CategoryUsageBarChart: React.FC<CategoryUsageBarChartProps> = ({
  barangKeluar,
  masterItems,
  stockSummary,
  onNavigate,
}) => {
  const [metric, setMetric] = useState<'keluar' | 'stok' | 'nilai'>('keluar');

  // Compute category distribution data
  const chartData = useMemo(() => {
    const categoryMap = new Map<
      string,
      { kategori: string; totalKeluar: number; totalStok: number; totalNilai: number; itemCount: number }
    >();

    // Initialize from masterItems or stockSummary
    masterItems.forEach((item) => {
      const cat = item.kategori || 'Lainnya';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, {
          kategori: cat,
          totalKeluar: 0,
          totalStok: 0,
          totalNilai: 0,
          itemCount: 0,
        });
      }
      const data = categoryMap.get(cat)!;
      data.itemCount += 1;
    });

    // Add stock from stockSummary
    stockSummary.forEach((s) => {
      const cat = s.kategori || 'Lainnya';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, {
          kategori: cat,
          totalKeluar: 0,
          totalStok: 0,
          totalNilai: 0,
          itemCount: 0,
        });
      }
      const data = categoryMap.get(cat)!;
      data.totalStok += Number(s.stok || 0);
    });

    // Add usage from barangKeluar
    barangKeluar.forEach((bk) => {
      // Find category from masterItems
      const master = masterItems.find((m) => m.kodeBarang === bk.kodeBarang);
      const cat = master?.kategori || 'Lainnya';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, {
          kategori: cat,
          totalKeluar: 0,
          totalStok: 0,
          totalNilai: 0,
          itemCount: 0,
        });
      }
      const data = categoryMap.get(cat)!;
      data.totalKeluar += Number(bk.jumlah || 0);
      const estPrice = master?.hargaEstimasi || 0;
      data.totalNilai += Number(bk.jumlah || 0) * estPrice;
    });

    // If no valuation set via barangKeluar, estimate valuation from stock and master items
    masterItems.forEach((item) => {
      const cat = item.kategori || 'Lainnya';
      const data = categoryMap.get(cat);
      if (data) {
        const s = stockSummary.find((ss) => ss.kodeBarang === item.kodeBarang);
        const stkWujud = s ? s.stok : 0;
        data.totalNilai += stkWujud * (item.hargaEstimasi || 0);
      }
    });

    const result = Array.from(categoryMap.values()).map((item) => ({
      ...item,
      // Shorten label if too long for XAxis
      shortName: item.kategori.length > 18 ? item.kategori.substring(0, 16) + '...' : item.kategori,
    }));

    // Sort by selected metric descending
    result.sort((a, b) => {
      if (metric === 'keluar') return b.totalKeluar - a.totalKeluar;
      if (metric === 'stok') return b.totalStok - a.totalStok;
      return b.totalNilai - a.totalNilai;
    });

    return result;
  }, [barangKeluar, masterItems, stockSummary, metric]);

  const totalKeluarAll = useMemo(() => chartData.reduce((sum, d) => sum + d.totalKeluar, 0), [chartData]);
  const topCategory = chartData.length > 0 ? chartData[0] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold mb-2 border border-emerald-200">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" /> Analisis Distribusi Kategori Barang
          </div>
          <h3 className="font-extrabold text-slate-900 text-base md:text-lg">
            Grafik Distribusi Kategori Barang Paling Sering Digunakan
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Menampilkan volume pemakaian (barang keluar), stok aktif, dan valuasi aset berdasarkan kategori di sekolah.
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0 self-start md:self-auto">
          <button
            onClick={() => setMetric('keluar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              metric === 'keluar'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Volume Pemakaian (Keluar)
          </button>
          <button
            onClick={() => setMetric('stok')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              metric === 'stok'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stok Fisik Aktif
          </button>
          <button
            onClick={() => setMetric('nilai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              metric === 'nilai'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Valuasi (Rp)
          </button>
        </div>
      </div>

      {/* Summary Highlight Banner */}
      {topCategory && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-600 text-white shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Kategori Paling Sering Digunakan</div>
              <div className="text-sm font-black text-slate-900 truncate max-w-[200px]" title={topCategory.kategori}>
                {topCategory.kategori}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-100 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-600 text-white shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Total Volume Distribusi</div>
              <div className="text-sm font-black text-slate-900">
                {totalKeluarAll.toLocaleString('id-ID')} Unit
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-600 text-white shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Total Kategori Terdaftar</div>
              <div className="text-sm font-black text-slate-900">
                {chartData.length} Kategori
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recharts Bar Chart Container */}
      <div className="w-full h-80 pt-4">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            <BarChart3 className="w-10 h-10 text-slate-300 mb-2" />
            Belum ada data kategori barang yang tercatat.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="shortName"
                angle={-20}
                textAnchor="end"
                interval={0}
                tick={{ fontSize: 11, fill: '#64748b' }}
                height={55}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) =>
                  metric === 'nilai' ? `Rp ${(val / 1000000).toFixed(1)}jt` : val.toLocaleString('id-ID')
                }
              />
              <Tooltip
                formatter={(value: any) => [
                  metric === 'nilai' ? formatRupiah(Number(value)) : `${Number(value).toLocaleString('id-ID')} unit`,
                  metric === 'keluar' ? 'Total Barang Keluar' : metric === 'stok' ? 'Total Stok Fisik' : 'Valuasi Kategori',
                ]}
                labelStyle={{ fontWeight: 'bold', color: '#0f172a', fontSize: '12px' }}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                }}
              />
              <Bar
                dataKey={metric === 'keluar' ? 'totalKeluar' : metric === 'stok' ? 'totalStok' : 'totalNilai'}
                name={metric === 'keluar' ? 'Volume Pemakaian (Keluar)' : metric === 'stok' ? 'Stok Aktif' : 'Valuasi (Rp)'}
                radius={[8, 8, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer link to category management or inventory */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Tip: Kategori dengan pemakaian tertinggi disarankan untuk diprioritaskan dalam penganggaran RKBS triwulanan.
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('persediaan')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition shrink-0"
          >
            <span>Kelola Master Barang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
