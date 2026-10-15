import React, { useState } from 'react';
import { Sparkles, PieChart, TrendingUp, CheckCircle2, ArrowRight, Wallet, Sliders, Layers } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatRupiah } from '../utils/format';

interface SmartBudgetAllocationPanelProps {
  onNavigate: (page: any) => void;
}

export const SmartBudgetAllocationPanel: React.FC<SmartBudgetAllocationPanelProps> = ({ onNavigate }) => {
  const { config, barangKeluar, pengambilanATK } = useInventory();
  const totalPagu = config.paguAnggaranTahunan || 150000000;
  const monthlyAllocationBase = Math.round(totalPagu / 12);

  // Departments / Units in school
  const [departments, setDepartments] = useState([
    { id: 'dept-1', name: 'Kelas & Pembelajaran (KBM)', weight: 35, efficiency: 92, utilizationRate: 'Tinggi' },
    { id: 'dept-2', name: 'Administrasi & Tata Usaha (ATK)', weight: 25, efficiency: 88, utilizationRate: 'Stabil' },
    { id: 'dept-3', name: 'Laboratorium & Komputer', weight: 20, efficiency: 95, utilizationRate: 'Sangat Efisien' },
    { id: 'dept-4', name: 'Perpustakaan & Literasi', weight: 12, efficiency: 85, utilizationRate: 'Normal' },
    { id: 'dept-5', name: 'UKS & Kebersihan Lingkungan', weight: 8, efficiency: 90, utilizationRate: 'Optimal' },
  ]);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedMessage, setOptimizedMessage] = useState(false);

  const handleRunSmartOptimization = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      // Simulate algorithm tuning weights based on mock efficiency
      setDepartments((prev) =>
        prev.map((d) => {
          const adjustment = d.efficiency > 90 ? 2 : -1;
          return {
            ...d,
            weight: Math.max(5, d.weight + adjustment),
          };
        })
      );
      setIsOptimizing(false);
      setOptimizedMessage(true);
      setTimeout(() => setOptimizedMessage(false), 3000);
    }, 900);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> Algoritma Alokasi Anggaran Cerdas (AI)
          </div>
          <h3 className="text-base font-extrabold text-slate-800">Smart Budget Allocation &amp; Efisiensi Per Unit</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekomendasi distribusi pagu anggaran bulanan berbasis efisiensi penggunaan dan tingkat penyerapan barang per departemen sekolah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunSmartOptimization}
            disabled={isOptimizing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
          >
            {isOptimizing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menghitung Algoritma...
              </>
            ) : (
              <>
                <Sliders className="w-4 h-4" /> Optimalkan Alokasi AI
              </>
            )}
          </button>
        </div>
      </div>

      {optimizedMessage && (
        <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Alokasi anggaran berhasil dioptimalkan berdasarkan rasio efisiensi pemanfaatan barang!
        </div>
      )}

      {/* Summary Pagu */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Pagu Anggaran Tahunan</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{formatRupiah(totalPagu)}</div>
          <span className="text-[11px] text-slate-500 mt-1">Sumber: BOS Reguler &amp; APBD</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Alokasi Rata-Rata Bulanan</span>
          <div className="text-2xl font-black text-emerald-800 mt-1">{formatRupiah(monthlyAllocationBase)}</div>
          <span className="text-[11px] text-slate-500 mt-1">Standar proyeksi belanja rutin</span>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Indeks Efisiensi Global</span>
            <div className="text-2xl font-black text-emerald-950 mt-1">91.4% <span className="text-xs font-semibold text-emerald-700">Sangat Optimal</span></div>
          </div>
          <button
            onClick={() => onNavigate('rkbs')}
            className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 self-start"
          >
            Kelola Rencana RKBS <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div>
        <h4 className="font-bold text-slate-800 text-sm mb-3">Distribusi Pagu Bulanan per Departemen / Unit</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="pb-2.5">Departemen / Unit Kerja</th>
                <th className="pb-2.5 text-center">Bobot Alokasi (%)</th>
                <th className="pb-2.5 text-right">Nominal Bulanan</th>
                <th className="pb-2.5 text-center">Efisiensi Barang</th>
                <th className="pb-2.5 text-center">Status Pemanfaatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.map((dept) => {
                const nominalAllocation = Math.round((monthlyAllocationBase * dept.weight) / 100);
                return (
                  <tr key={dept.id} className="hover:bg-slate-50/80">
                    <td className="py-3 font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-700 shrink-0" /> {dept.name}
                    </td>
                    <td className="py-3 text-center font-extrabold text-indigo-700">
                      {dept.weight}%
                    </td>
                    <td className="py-3 text-right font-bold text-slate-800">
                      {formatRupiah(nominalAllocation)}
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {dept.efficiency}%
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="text-slate-600 font-semibold">{dept.utilizationRate}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
