import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  BellRing,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  PlusCircle,
  PackageCheck,
  Search,
  ShoppingCart,
  ArrowRight,
  Sparkles,
  Info,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatRupiah, exportToCsv } from '../utils/format';
import { PageId } from './Navigation';
import { StockSummaryItem } from '../types';

interface ReorderPointNotificationBannerProps {
  onNavigate: (page: PageId) => void;
}

interface ReorderItemEnhanced extends StockSummaryItem {
  hargaEstimasi: number;
  reorderQuantity: number;
  estimasiTotalBiaya: number;
  defisit: number;
  lokasiDefault: string;
  kodeRekeningRkas: string;
  sudahAdaDiRkbs: boolean;
}

export const ReorderPointNotificationBanner: React.FC<ReorderPointNotificationBannerProps> = ({
  onNavigate,
}) => {
  const { stockSummary, items, rkbs, addRkbs, activeUser } = useInventory();

  // State tampilan
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'HABIS' | 'MINIMUM'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Ambil daftar barang yang mencapai batas minimum (stok <= batasMinimum) atau HABIS (stok <= 0)
  const reorderList = useMemo<ReorderItemEnhanced[]>(() => {
    const critical = stockSummary.filter((s) => s.status === 'MINIMUM' || s.status === 'HABIS');

    return critical.map((s) => {
      const master = items.find((it) => it.kodeBarang === s.kodeBarang);
      const hargaEstimasi = master?.hargaEstimasi || 0;
      const lokasiDefault = master?.lokasiDefault || 'Gudang Persediaan';
      const kodeRekeningRkas = master?.kodeRekeningRkas || '5.2.2.01.01';

      // Formula Reorder Quantity: mengembalikan stok ke tingkat aman (buffer 2x batas minimum dikurangi sisa stok)
      const defisit = Math.max(0, s.batasMinimum - s.stok);
      const reorderQuantity = Math.max(s.batasMinimum * 2 - Math.max(0, s.stok), s.batasMinimum || 5);
      const estimasiTotalBiaya = reorderQuantity * hargaEstimasi;

      // Cek apakah barang sudah ada di antrean usulan RKBS yang belum terealisasi
      const sudahAdaDiRkbs = rkbs.some(
        (r) =>
          r.kodeBarang === s.kodeBarang &&
          (r.status === 'DIUSULKAN' || r.status === 'DISETUJUI_RKAS')
      );

      return {
        ...s,
        hargaEstimasi,
        reorderQuantity,
        estimasiTotalBiaya,
        defisit,
        lokasiDefault,
        kodeRekeningRkas,
        sudahAdaDiRkbs,
      };
    });
  }, [stockSummary, items, rkbs]);

  const countHabis = useMemo(() => reorderList.filter((r) => r.status === 'HABIS').length, [reorderList]);
  const countMinimum = useMemo(() => reorderList.filter((r) => r.status === 'MINIMUM').length, [reorderList]);
  const totalItemsCount = reorderList.length;

  // Estimasi total anggaran pengadaan reorder
  const totalEstimasiAnggaranReorder = useMemo(() => {
    return reorderList.reduce((sum, r) => sum + r.estimasiTotalBiaya, 0);
  }, [reorderList]);

  // Filter list
  const filteredList = useMemo(() => {
    return reorderList.filter((item) => {
      const matchFilter =
        activeFilter === 'ALL' ||
        (activeFilter === 'HABIS' && item.status === 'HABIS') ||
        (activeFilter === 'MINIMUM' && item.status === 'MINIMUM');

      const matchQuery =
        item.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kodeBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kategori.toLowerCase().includes(searchQuery.toLowerCase());

      return matchFilter && matchQuery;
    });
  }, [reorderList, activeFilter, searchQuery]);

  // Handler: Ajukan Satuan ke RKBS
  const handleAjukanRkbs = (item: ReorderItemEnhanced) => {
    try {
      addRkbs({
        tahunAnggaran: String(new Date().getFullYear()),
        kodeBarang: item.kodeBarang,
        namaBarang: item.namaBarang,
        kategori: item.kategori,
        jumlahDiusulkan: item.reorderQuantity,
        jenisSatuan: item.jenisSatuan,
        hargaEstimasi: item.hargaEstimasi,
        prioritas: item.status === 'HABIS' ? 'TINGGI' : 'SEDANG',
        sumberDana: 'BOS Reguler',
        status: 'DIUSULKAN',
        alasanPengadaan: `Auto-Reorder Point: Stok fisik (${item.stok} ${item.jenisSatuan}) mencapai batas minimum (${item.batasMinimum} ${item.jenisSatuan}). Diperlukan pengisian stok segera.`,
        diajukanOleh: activeUser?.nama || 'Sistem Alarm SIMBARAS',
      });

      setActionSuccessMsg(`Berhasil! Usulan pengadaan "${item.namaBarang}" sebanyak ${item.reorderQuantity} ${item.jenisSatuan} telah ditambahkan ke RKBS.`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Ajukan Semua Barang Reorder Sekaligus (Batch)
  const handleAjukanSemuaRkbs = () => {
    const belumAda = reorderList.filter((r) => !r.sudahAdaDiRkbs);
    if (belumAda.length === 0) {
      setActionSuccessMsg('Semua barang yang mencapai batas minimum sudah terdaftar dalam usulan RKBS.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
      return;
    }

    belumAda.forEach((item) => {
      addRkbs({
        tahunAnggaran: String(new Date().getFullYear()),
        kodeBarang: item.kodeBarang,
        namaBarang: item.namaBarang,
        kategori: item.kategori,
        jumlahDiusulkan: item.reorderQuantity,
        jenisSatuan: item.jenisSatuan,
        hargaEstimasi: item.hargaEstimasi,
        prioritas: item.status === 'HABIS' ? 'TINGGI' : 'SEDANG',
        sumberDana: 'BOS Reguler',
        status: 'DIUSULKAN',
        alasanPengadaan: `Auto-Reorder Point: Stok sisa (${item.stok} ${item.jenisSatuan}) mencapai batas minimum (${item.batasMinimum} ${item.jenisSatuan}).`,
        diajukanOleh: activeUser?.nama || 'Sistem Alarm SIMBARAS',
      });
    });

    setActionSuccessMsg(`Sukses! ${belumAda.length} barang reorder point berhasil diajukan serentak ke modul Perencanaan RKBS.`);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Handler: Ekspor Daftar Reorder ke CSV / Excel
  const handleExportReorderCsv = () => {
    const exportData = reorderList.map((r) => ({
      'Kode Barang': r.kodeBarang,
      'Nama Barang': r.namaBarang,
      Kategori: r.kategori,
      'Sisa Stok': r.stok,
      'Batas Minimum': r.batasMinimum,
      Satuan: r.jenisSatuan,
      'Status Stok': r.status,
      'Rekomendasi Pesan Ulang': r.reorderQuantity,
      'Harga Satuan Estimasi': r.hargaEstimasi,
      'Estimasi Total Biaya': r.estimasiTotalBiaya,
      'Lokasi Penyimpanan': r.lokasiDefault,
    }));
    exportToCsv(`Daftar_Reorder_Point_Stok_Kritis_${new Date().toISOString().slice(0, 10)}`, exportData);
  };

  // Jika tidak ada barang kritis
  if (totalItemsCount === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-emerald-900 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              Sistem Notifikasi Stok Otomatis: Seluruh Persediaan Aman
            </h4>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Tidak ada barang yang menyentuh batas minimum (reorder point). Semua kuantitas di atas ambang aman.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('persediaan')}
          className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1 shadow-2xs"
        >
          Buku Persediaan <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50/80 shadow-sm overflow-hidden transition-all duration-300 relative">
      {/* Toast Notifikasi Aksi */}
      {actionSuccessMsg && (
        <div className="absolute top-3 right-4 z-30 bg-emerald-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 border border-emerald-700 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className="font-semibold">{actionSuccessMsg}</span>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="ml-2 text-emerald-300 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Notifikasi */}
      <div className="p-4 md:p-5 border-b border-amber-200 bg-gradient-to-r from-amber-100/90 via-amber-50 to-orange-50/70">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start md:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs shrink-0 animate-bounce duration-1000">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h3 className="text-sm md:text-base font-black text-amber-950 flex items-center gap-2">
                  Notifikasi Otomatis: Peringatan Batas Minimum (Reorder Point)
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-black shadow-2xs animate-pulse">
                  <AlertOctagon className="w-3 h-3" />
                  {totalItemsCount} Barang Perlu Restock
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Stok barang berikut telah menyentuh atau berada di bawah batas minimum pemakaian. Segera lakukan pemesanan ulang agar kegiatan KBM &amp; administrasi tidak terganggu.
              </p>
            </div>
          </div>

          {/* Quick Metrics & Toggle Expand Button */}
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-amber-300 text-xs">
              <span className="text-slate-500">Estimasi Kebutuhan Belanja:</span>
              <strong className="text-amber-950 font-black">{formatRupiah(totalEstimasiAnggaranReorder)}</strong>
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-200/80 hover:bg-amber-300/80 text-amber-950 text-xs font-bold transition cursor-pointer"
              title={isExpanded ? 'Sembunyikan Rincian' : 'Tampilkan Rincian'}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" /> Sembunyikan Daftar
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" /> Tampilkan Daftar ({totalItemsCount})
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content: Filters, Batch Actions & Table */}
      {isExpanded && (
        <div className="p-4 md:p-5 space-y-4 bg-white/90">
          {/* Controls Bar: Search, Filter Tabs & Batch Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            {/* Filter Tabs & Search */}
            <div className="flex items-center flex-wrap gap-2">
              <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({totalItemsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('HABIS')}
                  className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                    activeFilter === 'HABIS'
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'text-red-700 hover:text-red-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                  Habis ({countHabis})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('MINIMUM')}
                  className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                    activeFilter === 'MINIMUM'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-amber-800 hover:text-amber-950'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-300 inline-block" />
                  Mencapai Batas Min ({countMinimum})
                </button>
              </div>

              {/* Quick Search */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari barang reorder..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Batch Action Buttons */}
            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={handleAjukanSemuaRkbs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition"
                title="Ajukan semua barang kritis ke usulan RKBS sekaligus"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                Ajukan Semua ke RKBS
              </button>

              <button
                type="button"
                onClick={handleExportReorderCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                title="Unduh daftar reorder dalam format CSV/Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                Unduh Memo Reorder
              </button>

              <button
                type="button"
                onClick={() => onNavigate('persediaan')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition"
              >
                Kelola Persediaan <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Table Daftar Barang Reorder Point */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Kode &amp; Nama Barang</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3 text-center">Sisa Stok</th>
                  <th className="p-3 text-center">Batas Min (ROP)</th>
                  <th className="p-3 text-center">Defisit</th>
                  <th className="p-3 text-center">Rekomendasi Pesan</th>
                  <th className="p-3 text-right">Estimasi Biaya</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada barang reorder point yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => (
                    <tr
                      key={item.kodeBarang}
                      className={`hover:bg-slate-50/80 transition ${
                        item.status === 'HABIS' ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.namaBarang}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <span>{item.kodeBarang}</span>
                          <span>•</span>
                          <span>{item.lokasiDefault}</span>
                        </div>
                      </td>

                      <td className="p-3 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium">
                          {item.kategori}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded-lg ${
                            item.stok <= 0
                              ? 'bg-red-100 text-red-700 font-black'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.stok} {item.jenisSatuan}
                        </span>
                      </td>

                      <td className="p-3 text-center text-slate-600 font-semibold">
                        {item.batasMinimum} {item.jenisSatuan}
                      </td>

                      <td className="p-3 text-center font-bold text-rose-600">
                        {item.defisit > 0 ? `-${item.defisit} ${item.jenisSatuan}` : 'Tercapai'}
                      </td>

                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                          +{item.reorderQuantity} {item.jenisSatuan}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="font-bold text-slate-800">
                          {formatRupiah(item.estimasiTotalBiaya)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          @{formatRupiah(item.hargaEstimasi)}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        {item.status === 'HABIS' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-black text-[10px] border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                            HABIS TOTAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200">
                            MINIMUM
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {item.sudahAdaDiRkbs ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-500 font-semibold text-[11px]" title="Sudah masuk dalam daftar perencanaan RKBS">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ada di RKBS
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAjukanRkbs(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] transition shadow-2xs"
                              title="Ajukan langsung ke daftar usulan belanja BOS / RKBS"
                            >
                              <PlusCircle className="w-3 h-3" /> Usulkan RKBS
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onNavigate('barang_masuk')}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition"
                            title="Buka form pencatatan faktur barang masuk"
                          >
                            <ShoppingCart className="w-3 h-3" /> Input Masuk
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Note & Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                <strong>Reorder Point (ROP)</strong> dihitung dari ambang batas minimum per barang. Rekomendasi kuantitas disesuaikan untuk memenuhi kebutuhan siklus pembelajaran 1–2 bulan ke depan.
              </span>
            </div>
            <div className="text-right font-medium">
              Menampilkan {filteredList.length} dari {totalItemsCount} barang kritis
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
