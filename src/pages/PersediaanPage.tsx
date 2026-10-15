import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Coins,
  RefreshCw,
  Printer,
  FileText,
  Eye,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatRupiah } from '../utils/format';
import { AdvancedExportModal } from '../components/AdvancedExportModal';
import { StockCardModal } from '../components/StockCardModal';
import { StockSummaryItem } from '../types';

export const PersediaanPage: React.FC = () => {
  const { stockSummary, config } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AMAN' | 'MINIMUM' | 'HABIS'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedItemForLedger, setSelectedItemForLedger] = useState<StockSummaryItem | null>(null);

  const persediaanColumns = [
    { key: 'kodeBarang', label: 'Kode Barang' },
    { key: 'namaBarang', label: 'Nama Barang' },
    { key: 'kategori', label: 'Kategori' },
    { key: 'stokMasuk', label: 'Total Masuk' },
    { key: 'stokKeluar', label: 'Total Keluar' },
    { key: 'stok', label: 'Sisa Stok Akhir' },
    { key: 'jenisSatuan', label: 'Satuan' },
    { key: 'batasMinimum', label: 'Batas Minimum' },
    { key: 'status', label: 'Status Stok' },
    { key: 'nilaiPersediaan', label: 'Nilai Aset Stok (Rp)', format: (val: any) => formatRupiah(val) },
  ];

  const categories = useMemo(() => {
    const list = Array.from(new Set(stockSummary.map((s) => s.kategori)));
    return ['ALL', ...list];
  }, [stockSummary]);

  const filteredSummary = useMemo(() => {
    return stockSummary.filter((item) => {
      const matchQuery =
        item.kodeBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.namaBarang.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchCat = categoryFilter === 'ALL' || item.kategori === categoryFilter;

      return matchQuery && matchStatus && matchCat;
    });
  }, [stockSummary, searchQuery, statusFilter, categoryFilter]);

  const totalNilaiPersediaan = useMemo(() => {
    return filteredSummary.reduce((acc, curr) => acc + curr.nilaiPersediaan, 0);
  }, [filteredSummary]);

  const countAman = stockSummary.filter((s) => s.status === 'AMAN').length;
  const countMinimum = stockSummary.filter((s) => s.status === 'MINIMUM').length;
  const countHabis = stockSummary.filter((s) => s.status === 'HABIS').length;

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-800" /> Buku Persediaan Barang (Stock Real-Time)
          </h2>
          <p className="text-xs text-slate-500">
            Pemantauan saldo stok persediaan otomatis: Total Masuk dikurangi Total Keluar lengkap dengan kartu kendali stok.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintSummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" /> Cetak Buku Persediaan
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Ekspor Laporan Stok
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            statusFilter === 'ALL'
              ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-slate-500 uppercase">Semua Barang</div>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{stockSummary.length}</div>
          <div className="text-[10px] text-slate-400">Total item persediaan</div>
        </button>

        <button
          onClick={() => setStatusFilter('AMAN')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            statusFilter === 'AMAN'
              ? 'border-emerald-600 bg-emerald-50 shadow-xs ring-2 ring-emerald-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-700 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Stok Aman
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-0.5">{countAman}</div>
          <div className="text-[10px] text-emerald-600">Di atas batas minimum</div>
        </button>

        <button
          onClick={() => setStatusFilter('MINIMUM')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            statusFilter === 'MINIMUM'
              ? 'border-amber-600 bg-amber-50 shadow-xs ring-2 ring-amber-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-amber-700 uppercase flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Stok Menipis
          </div>
          <div className="text-2xl font-black text-amber-900 mt-0.5">{countMinimum}</div>
          <div className="text-[10px] text-amber-600">Perlu pengadaan baru</div>
        </button>

        <button
          onClick={() => setStatusFilter('HABIS')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            statusFilter === 'HABIS'
              ? 'border-red-600 bg-red-50 shadow-xs ring-2 ring-red-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-red-700 uppercase flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Stok Kosong
          </div>
          <div className="text-2xl font-black text-red-900 mt-0.5">{countHabis}</div>
          <div className="text-[10px] text-red-600">Saldo 0 atau minus</div>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode atau nama barang persediaan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'Semua Kategori' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Nama Barang</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-center">Stok Masuk</th>
                <th className="px-4 py-3 text-center">Stok Keluar</th>
                <th className="px-4 py-3 text-center">Saldo Akhir</th>
                <th className="px-4 py-3 text-center">Batas Min</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Nilai Persediaan</th>
                <th className="px-4 py-3 text-center">Kartu Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSummary.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada persediaan barang yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredSummary.map((item) => (
                  <tr key={item.kodeBarang} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{item.kodeBarang}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{item.namaBarang}</td>
                    <td className="px-4 py-3 text-slate-500">{item.kategori}</td>
                    <td className="px-4 py-3 text-center font-semibold text-emerald-800">
                      +{item.stokMasuk} {item.jenisSatuan}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-orange-800">
                      -{item.stokKeluar} {item.jenisSatuan}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-black text-sm px-2.5 py-0.5 rounded-lg ${
                          item.stok <= 0
                            ? 'bg-red-100 text-red-900'
                            : item.stok <= item.batasMinimum
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-950'
                        }`}
                      >
                        {item.stok} {item.jenisSatuan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-400 font-medium">
                      {item.batasMinimum} {item.jenisSatuan}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.status === 'HABIS' ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                          HABIS
                        </span>
                      ) : item.status === 'MINIMUM' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                          MENIPIS
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          AMAN
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      {formatRupiah(item.nilaiPersediaan)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedItemForLedger(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[11px] font-bold transition shadow-2xs"
                        title="Buka Kartu Kendali Stok"
                      >
                        <FileText className="w-3 h-3 text-emerald-700" />
                        <span>Kartu Stok</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Total Valuation Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center text-xs">
          <div className="text-slate-500 mb-2 sm:mb-0">
            Total {filteredSummary.length} item barang persediaan
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Total Valuasi Nilai Persediaan Sisa:</span>
            <span className="font-black text-emerald-900 text-sm">
              {formatRupiah(totalNilaiPersediaan)}
            </span>
          </div>
        </div>
      </div>

      {/* Kartu Stok Ledger Modal */}
      <StockCardModal
        item={selectedItemForLedger}
        isOpen={Boolean(selectedItemForLedger)}
        onClose={() => setSelectedItemForLedger(null)}
      />

      {/* Advanced Export Modal */}
      <AdvancedExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Ekspor Buku Persediaan Barang"
        defaultFilename="Buku_Persediaan_Barang_Sekolah"
        data={stockSummary}
        filteredData={filteredSummary}
        availableColumns={persediaanColumns}
        schoolConfig={config}
      />
    </div>
  );
};
