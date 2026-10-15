import React from 'react';
import {
  Boxes,
  Building2,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  FileSignature,
  Sparkles,
  Camera,
  Coins,
  Package,
  CheckCircle2,
  AlertCircle,
  Wrench,
  ArrowRight,
  Calendar,
  Landmark,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatRupiah, formatTanggalIndo } from '../utils/format';
import { PageId } from '../components/Navigation';
import { MonthlyTrendChart } from '../components/MonthlyTrendChart';
import { BudgetSummaryCard } from '../components/BudgetSummaryCard';
import { ReorderPointNotificationBanner } from '../components/ReorderPointNotificationBanner';
import { DemandPredictionPanel } from '../components/DemandPredictionPanel';
import { SmartBudgetAllocationPanel } from '../components/SmartBudgetAllocationPanel';
import { BudgetProjectionPanel } from '../components/BudgetProjectionPanel';
import { MaintenanceCalendarReminderPanel } from '../components/MaintenanceCalendarReminderPanel';
import { CategoryUsageBarChart } from '../components/CategoryUsageBarChart';
import { AssetValueTrendChart } from '../components/AssetValueTrendChart';

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
  onOpenScanReceipt: () => void;
  onOpenAiAdvisor: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenScanReceipt,
  onOpenAiAdvisor,
}) => {
  const { dashboardStats, stockSummary, barangMasuk, barangKeluar, config, items, assets } = useInventory();

  const criticalItems = stockSummary.filter((s) => s.status === 'MINIMUM' || s.status === 'HABIS').slice(0, 6);
  const recentMasuk = barangMasuk.slice(0, 5);
  const recentKeluar = barangKeluar.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 text-white p-6 md:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 text-emerald-200 text-xs font-semibold mb-3 border border-emerald-600/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Sistem Terintegrasi Standar Juknis BOS &amp; Aset Sekolah
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Selamat Datang di Portal Bendahara Barang
          </h1>
          <p className="text-emerald-100 text-xs md:text-sm mt-2 leading-relaxed">
            Kelola persediaan habis pakai, aset tetap ruangan, barang masuk &amp; keluar, stock opname fisik, serta tanda tangan digital pengambilan ATK guru secara rapi dan akuntabel di {config.schoolName}.
          </p>

          <div className="flex flex-wrap gap-2.5 mt-5">
            <button
              onClick={() => onNavigate('pengambilan_atk')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs shadow-md transition"
            >
              <FileSignature className="w-4 h-4" /> Catat Pengambilan ATK Guru
            </button>
            <button
              onClick={() => onNavigate('rkbs')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs border border-emerald-500/40 shadow-xs transition"
            >
              <Calendar className="w-4 h-4 text-emerald-200" /> Perencanaan RKBS / RKAS
            </button>
            <button
              onClick={onOpenScanReceipt}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 font-semibold text-xs backdrop-blur-xs transition"
            >
              <Camera className="w-4 h-4" /> Scan Nota Pengadaan AI
            </button>
            <button
              onClick={onOpenAiAdvisor}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-950 text-emerald-200 border border-emerald-600/40 font-semibold text-xs transition"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" /> Analisis Inventaris AI
            </button>
            <button
              onClick={() => onNavigate('integrasi')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-teal-950 font-extrabold text-xs shadow-md transition"
            >
              <Landmark className="w-4 h-4" /> Rekonsiliasi Nasional (SIPD / ARKAS)
            </button>
            <button
              onClick={() => onNavigate('terminal_logistik')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs shadow-md transition"
            >
              <Zap className="w-4 h-4 fill-amber-950" /> Mode Terminal Masuk/Keluar
            </button>
          </div>
        </div>
      </div>

      {/* Spotlight: Penyelarasan Standar Nasional Permendagri 108 / SIPD & ARKAS */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-900 text-white p-4 md:p-5 rounded-2xl shadow-sm border border-emerald-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-400 text-teal-950 uppercase tracking-wider">
                Fitur Integrasi Nasional Aktif
              </span>
              <span className="text-xs text-teal-200">Permendagri 108 • ARKAS BOSP • Dapodik</span>
            </div>
            <h3 className="font-extrabold text-sm md:text-base mt-1">
              Sinkronisasi SIPD-BMD / SIMBADA &amp; Berita Acara Rekonsiliasi BOS
            </h3>
            <p className="text-xs text-teal-100/90 mt-0.5 leading-relaxed max-w-2xl">
              Cetak Berita Acara Rekonsiliasi Belanja Modal triwulanan, ekspor format SIPD-BMD BPKAD, serta sinkronisasikan kodefikasi aset ke standar nasional dengan 1 klik.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('integrasi')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-950 font-bold text-xs shadow hover:bg-teal-50 transition shrink-0"
        >
          <span>Buka Pusat Rekonsiliasi</span>
          <ArrowRight className="w-4 h-4 text-emerald-800" />
        </button>
      </div>

      {/* Sistem Notifikasi Otomatis Reorder Point (Batas Minimum Stok) */}
      <ReorderPointNotificationBanner onNavigate={onNavigate} />

      {/* Sistem Pengingat Jadwal Pemeliharaan Rutin & Kalender Servis Aset */}
      <MaintenanceCalendarReminderPanel onNavigateToPemeliharaan={() => onNavigate('pemeliharaan')} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Master Barang</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{dashboardStats.totalItems}</div>
          <div className="text-[11px] text-slate-400 mt-1">Jenis item terdaftar</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Aset / Inventaris</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{dashboardStats.totalAssets}</div>
          <div className="text-[11px] text-slate-400 mt-1">Unit aset fisik aktif</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Barang Masuk Bln Ini</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <ArrowDownToLine className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{dashboardStats.barangMasukBulanIni}</div>
          <div className="text-[11px] text-slate-400 mt-1">Volume pengadaan</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Barang Keluar Bln Ini</span>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-700">
              <ArrowUpFromLine className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{dashboardStats.barangKeluarBulanIni}</div>
          <div className="text-[11px] text-slate-400 mt-1">Volume distribusi</div>
        </div>
      </div>

      {/* Kartu Ringkasan Anggaran Tahunan dan Sisa Pagu Anggaran Real-Time */}
      <BudgetSummaryCard onNavigate={onNavigate} />

      {/* Financial Valuation & Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              <Coins className="w-4 h-4 text-emerald-600" /> Nilai Valuasi Aset Fisik
            </div>
            <div className="text-2xl font-black text-emerald-900 mt-1">
              {formatRupiah(dashboardStats.totalNilaiAset)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Total perolehan aset inventaris KIB/KIR yang tercatat di pembukuan sekolah.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600">Estimasi Nilai Persediaan:</span>
            <span className="text-xs font-bold text-slate-800">
              {formatRupiah(dashboardStats.totalNilaiPersediaan)}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Stok Menipis / Kritis
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                {dashboardStats.itemsMinimum + dashboardStats.itemsHabis} Item
              </span>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Stok Menipis (Di Bawah Min):</span>
                <span className="font-bold text-amber-700">{dashboardStats.itemsMinimum} barang</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Stok Habis (Kosong):</span>
                <span className="font-bold text-red-700">{dashboardStats.itemsHabis} barang</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('persediaan')}
            className="mt-4 w-full py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            Lihat Detail Persediaan <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Wrench className="w-4 h-4 text-slate-600" /> Aset Butuh Pemeliharaan
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold">
                {dashboardStats.asetRusak} Aset
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Terdapat aset dengan status rusak ringan atau rusak berat yang memerlukan tindakan servis atau pengusulan penghapusan.
            </p>
          </div>
          <button
            onClick={() => onNavigate('pemeliharaan')}
            className="mt-4 w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            Buka Menu Pemeliharaan <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Visualisasi Tren Bulanan Pengadaan & Distribusi (Recharts) */}
      <MonthlyTrendChart
        barangMasuk={barangMasuk}
        barangKeluar={barangKeluar}
        masterItems={items}
        onNavigate={onNavigate}
      />

      {/* Grafik Batang Distribusi Kategori Barang Paling Sering Digunakan */}
      <CategoryUsageBarChart
        barangKeluar={barangKeluar}
        masterItems={items}
        stockSummary={stockSummary}
        onNavigate={onNavigate}
      />

      {/* Analisis Tren Nilai Aset & Proyeksi Depresiasi Masa Depan (Recharts Line/Area) */}
      <AssetValueTrendChart
        assets={assets}
        onNavigate={onNavigate}
      />

      {/* AI Demand Forecasting Panel */}
      <DemandPredictionPanel
        items={items}
        barangKeluar={barangKeluar}
        barangMasuk={barangMasuk}
        onNavigate={onNavigate}
      />

      {/* Smart Budget Allocation Panel */}
      <SmartBudgetAllocationPanel onNavigate={onNavigate} />

      {/* Proyeksi Anggaran Mendatang (Simple Linear Regression) */}
      <BudgetProjectionPanel
        barangMasuk={barangMasuk}
        config={config}
        onNavigate={onNavigate}
      />

      {/* Critical Stock Table & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 span): Critical Items */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Peringatan Stok Persediaan Kritis</h3>
              <p className="text-xs text-slate-500">Barang yang butuh diusulkan dalam pengadaan BOS/RKAS</p>
            </div>
            <button
              onClick={() => onNavigate('persediaan')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Lihat Semua Stok
            </button>
          </div>

          {criticalItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              Semua stok persediaan dalam kondisi aman di atas batas minimum.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="pb-2.5">Kode</th>
                    <th className="pb-2.5">Nama Barang</th>
                    <th className="pb-2.5">Kategori</th>
                    <th className="pb-2.5 text-center">Sisa Stok</th>
                    <th className="pb-2.5 text-center">Batas Min</th>
                    <th className="pb-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {criticalItems.map((item) => (
                    <tr key={item.kodeBarang} className="hover:bg-slate-50/70">
                      <td className="py-2.5 font-mono font-bold text-slate-700">{item.kodeBarang}</td>
                      <td className="py-2.5 font-medium text-slate-900">{item.namaBarang}</td>
                      <td className="py-2.5 text-slate-500">{item.kategori}</td>
                      <td className="py-2.5 text-center font-bold text-slate-800">
                        {item.stok} {item.jenisSatuan}
                      </td>
                      <td className="py-2.5 text-center text-slate-500">{item.batasMinimum}</td>
                      <td className="py-2.5 text-center">
                        {item.status === 'HABIS' ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                            HABIS
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                            MINIMUM
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

        {/* Right Column: Quick Links & Recent Pickups */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Aktivitas Terkini</h3>
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Pengadaan Masuk Terakhir
                </span>
                {recentMasuk.length > 0 ? (
                  <div className="space-y-1.5">
                    {recentMasuk.slice(0, 3).map((bm) => (
                      <div key={bm.id} className="p-2 rounded-xl bg-slate-50 text-xs flex justify-between items-center">
                        <div className="truncate pr-2">
                          <div className="font-semibold text-slate-800 truncate">{bm.namaBarang}</div>
                          <div className="text-[10px] text-slate-500">{formatTanggalIndo(bm.tanggal)} • {bm.namaToko}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-emerald-800">+{bm.jumlah} {bm.jenisSatuan}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Belum ada transaksi</p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Pengeluaran Barang Terakhir
                </span>
                {recentKeluar.length > 0 ? (
                  <div className="space-y-1.5">
                    {recentKeluar.slice(0, 3).map((bk) => (
                      <div key={bk.id} className="p-2 rounded-xl bg-slate-50 text-xs flex justify-between items-center">
                        <div className="truncate pr-2">
                          <div className="font-semibold text-slate-800 truncate">{bk.namaBarang}</div>
                          <div className="text-[10px] text-slate-500">{formatTanggalIndo(bk.tanggal)} • Ke: {bk.penerima}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-orange-800">-{bk.jumlah} {bk.jenisSatuan}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Belum ada transaksi</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
