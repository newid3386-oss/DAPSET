import React, { useMemo } from 'react';
import { MasterItem, StockSummaryItem } from '../types';
import { useInventory } from '../context/InventoryContext';
import { formatRupiah, formatTanggalIndo } from '../utils/format';
import { X, Printer, Package, ArrowDownToLine, ArrowUpFromLine, Layers } from 'lucide-react';

interface StockCardModalProps {
  item: MasterItem | StockSummaryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

interface StockLedgerEntry {
  id: string;
  tanggal: string;
  tipe: 'MASUK' | 'KELUAR' | 'OPNAME';
  referensi: string;
  deskripsi: string;
  pihak: string;
  masuk: number;
  keluar: number;
  saldoBerjalan: number;
  hargaSatuan: number;
  nilaiTransaksi: number;
}

export const StockCardModal: React.FC<StockCardModalProps> = ({ item, isOpen, onClose }) => {
  const { config, barangMasuk, barangKeluar, stockOpname, stockSummary } = useInventory();

  const ledgerEntries = useMemo<StockLedgerEntry[]>(() => {
    if (!item) return [];

    const entries: StockLedgerEntry[] = [];

    // Filter incoming
    const masukList = barangMasuk.filter((b) => b.kodeBarang === item.kodeBarang);
    masukList.forEach((b) => {
      entries.push({
        id: `bm-${b.id}`,
        tanggal: b.tanggal,
        tipe: 'MASUK',
        referensi: b.nomorBku || b.nomorKwitansi || 'BKU-IN',
        deskripsi: `Pengadaan Barang Masuk (${b.sumberAnggaran})`,
        pihak: b.namaToko,
        masuk: b.jumlah,
        keluar: 0,
        saldoBerjalan: 0,
        hargaSatuan: b.hargaSatuan,
        nilaiTransaksi: b.totalPengadaan,
      });
    });

    // Filter outgoing
    const keluarList = barangKeluar.filter((b) => b.kodeBarang === item.kodeBarang);
    keluarList.forEach((b) => {
      const summaryItem = stockSummary.find((s) => s.kodeBarang === item.kodeBarang);
      const estPrice = summaryItem?.nilaiPersediaan && summaryItem.stok > 0
        ? summaryItem.nilaiPersediaan / summaryItem.stok
        : 0;
      entries.push({
        id: `bk-${b.id}`,
        tanggal: b.tanggal,
        tipe: 'KELUAR',
        referensi: `DIST-${b.tanggal.replace(/-/g, '')}`,
        deskripsi: `Distribusi ke ${b.unitRuangan} (${b.tujuanPenggunaan || 'KBM'})`,
        pihak: b.penerima,
        masuk: 0,
        keluar: b.jumlah,
        saldoBerjalan: 0,
        hargaSatuan: estPrice,
        nilaiTransaksi: b.jumlah * estPrice,
      });
    });

    // Sort chronologically ascending
    entries.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    // Calculate running balance
    let running = 0;
    for (const e of entries) {
      running += e.masuk - e.keluar;
      e.saldoBerjalan = running;
    }

    return entries;
  }, [item, barangMasuk, barangKeluar, stockSummary]);

  if (!isOpen || !item) return null;

  const currentSummary = stockSummary.find((s) => s.kodeBarang === item.kodeBarang);
  const currentStock = currentSummary ? currentSummary.stok : 0;
  const totalMasuk = ledgerEntries.reduce((acc, curr) => acc + curr.masuk, 0);
  const totalKeluar = ledgerEntries.reduce((acc, curr) => acc + curr.keluar, 0);
  const totalNilai = currentSummary ? currentSummary.nilaiPersediaan : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="modal-dialog-container bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="modal-hide-print bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-base">Kartu Persediaan Barang (Stock Movement Ledger)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs"
            >
              <Printer className="w-4 h-4" /> Cetak Kartu Stok (PDF)
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Card Body */}
        <div className="p-6 md:p-8 space-y-6">
          {/* School Letterhead (Kop Surat) */}
          <div className="text-center border-b-2 border-slate-900 pb-3">
            <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase">
              {config.dinasPendidikan || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}
            </h2>
            <h1 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">
              {config.schoolName}
            </h1>
            <p className="text-[11px] text-slate-600">
              {config.address} • NPSN: {config.npsn} {config.emailSekolah ? `• Email: ${config.emailSekolah}` : ''}
            </p>
            <div className="mt-2 pt-1 border-t border-slate-400">
              <span className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                KARTU KENDALI PERSEDIAAN BARANG
              </span>
              <span className="block text-[11px] text-slate-500 font-medium">
                Tahun Anggaran {config.tahunAnggaranAktif || new Date().getFullYear()}
              </span>
            </div>
          </div>

          {/* Item Meta Specs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Kode Barang:</span>
              <span className="font-mono font-bold text-emerald-900 text-sm">{item.kodeBarang}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Nama Barang:</span>
              <span className="font-bold text-slate-900 text-sm">{item.namaBarang}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Satuan / Kategori:</span>
              <span className="font-semibold text-slate-800">{item.jenisSatuan} • {item.kategori}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Batas Minimum:</span>
              <span className="font-semibold text-slate-800">{item.batasMinimum} {item.jenisSatuan}</span>
            </div>
          </div>

          {/* Quick Summary Pill Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-emerald-800 flex items-center gap-1">
                <ArrowDownToLine className="w-3 h-3 text-emerald-700" /> Total Masuk
              </span>
              <div className="text-lg font-black text-emerald-950 mt-0.5">
                +{totalMasuk} {item.jenisSatuan}
              </div>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-orange-800 flex items-center gap-1">
                <ArrowUpFromLine className="w-3 h-3 text-orange-700" /> Total Keluar
              </span>
              <div className="text-lg font-black text-orange-950 mt-0.5">
                -{totalKeluar} {item.jenisSatuan}
              </div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-blue-800 flex items-center gap-1">
                <Layers className="w-3 h-3 text-blue-700" /> Sisa Saldo Akhir
              </span>
              <div className="text-lg font-black text-blue-950 mt-0.5">
                {currentStock} {item.jenisSatuan}
                <span className="block text-[11px] font-normal text-slate-600">
                  {formatRupiah(totalNilai)}
                </span>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px]">
                <tr>
                  <th className="px-3 py-2 text-center w-10">No</th>
                  <th className="px-3 py-2">Tanggal</th>
                  <th className="px-3 py-2">No. Dokumen / BKU</th>
                  <th className="px-3 py-2">Uraian / Toko / Penerima</th>
                  <th className="px-3 py-2 text-center text-emerald-800">Masuk</th>
                  <th className="px-3 py-2 text-center text-orange-800">Keluar</th>
                  <th className="px-3 py-2 text-center text-blue-900 font-black">Sisa Stok</th>
                  <th className="px-3 py-2 text-right">Nilai Satuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {ledgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      Belum ada mutasi transaksi persediaan untuk barang ini.
                    </td>
                  </tr>
                ) : (
                  ledgerEntries.map((e, idx) => (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-3 py-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{formatTanggalIndo(e.tanggal)}</td>
                      <td className="px-3 py-2 font-mono text-slate-600 text-[11px]">{e.referensi}</td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-slate-900">{e.deskripsi}</span>
                        {e.pihak && (
                          <span className="block text-[10px] text-slate-500">Pihak: {e.pihak}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-emerald-800">
                        {e.masuk > 0 ? `+${e.masuk}` : '-'}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-orange-800">
                        {e.keluar > 0 ? `-${e.keluar}` : '-'}
                      </td>
                      <td className="px-3 py-2 text-center font-black text-slate-900 bg-slate-50/50">
                        {e.saldoBerjalan} {item.jenisSatuan}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-700">
                        {e.hargaSatuan > 0 ? formatRupiah(e.hargaSatuan) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs">
                <tr>
                  <td colSpan={4} className="px-3 py-2.5 text-right font-extrabold text-slate-700">
                    Total Mutasi Saldo:
                  </td>
                  <td className="px-3 py-2.5 text-center text-emerald-900 font-black">+{totalMasuk}</td>
                  <td className="px-3 py-2.5 text-center text-orange-900 font-black">-{totalKeluar}</td>
                  <td className="px-3 py-2.5 text-center text-blue-950 font-black bg-blue-100/60">
                    {currentStock} {item.jenisSatuan}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-black text-slate-900">
                    {formatRupiah(totalNilai)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Official Signature Blocks */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-xs text-center break-inside-avoid">
            <div>
              <p className="text-slate-600 mb-1">Mengetahui,</p>
              <p className="font-bold text-slate-900">Kepala Sekolah</p>
              <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                (Tanda Tangan &amp; Stempel)
              </div>
              <p className="font-bold underline text-slate-900">{config.headmaster}</p>
              <p className="text-slate-500 font-mono text-[10px]">NIP. {config.headmasterNip}</p>
            </div>

            <div>
              <p className="text-slate-600 mb-1">
                {config.address.split(',')[1]?.trim() || 'Bandung Barat'}, {formatTanggalIndo(new Date())}
              </p>
              <p className="font-bold text-slate-900">Pengurus Barang / Bendahara</p>
              <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                (Tanda Tangan)
              </div>
              <p className="font-bold underline text-slate-900">{config.treasurer}</p>
              <p className="text-slate-500 font-mono text-[10px]">NIP. {config.treasurerNip}</p>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="modal-hide-print p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
          >
            <Printer className="w-4 h-4" /> Cetak Lembar Kartu Stok
          </button>
        </div>
      </div>
    </div>
  );
};
