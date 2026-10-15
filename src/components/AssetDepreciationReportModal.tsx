import React, { useState, useMemo } from 'react';
import { Calculator, X, Download, FileText, Calendar, DollarSign, Settings, Check, HelpCircle } from 'lucide-react';
import { AssetRecord } from '../types';
import { formatRupiah } from '../utils/format';

interface AssetDepreciationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: AssetRecord[];
  schoolName?: string;
}

export const AssetDepreciationReportModal: React.FC<AssetDepreciationReportModalProps> = ({
  isOpen,
  onClose,
  assets,
  schoolName = 'SD Negeri Belajar.id',
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [depreciationMethod, setDepreciationMethod] = useState<'straight_line' | 'declining'>('straight_line');
  const [customLifeCycles, setCustomLifeCycles] = useState<Record<string, number>>({
    KIB_A: 0, // Tanah tidak disusutkan
    KIB_B: 4, // Peralatan & Mesin (4 tahun)
    KIB_C: 20, // Gedung & Bangunan (20 tahun)
    KIB_D: 10, // Jalan & Jaringan (10 tahun)
    KIB_E: 5, // Aset Tetap Lainnya (5 tahun)
  });
  const [salvageRate, setSalvageRate] = useState<number>(5); // 5% nilai sisa

  if (!isOpen) return null;

  // Compute monthly and cumulative depreciation report
  const reportData = useMemo(() => {
    const targetDate = new Date(selectedMonth + '-01');
    const targetYear = targetDate.getFullYear();
    const targetMonthIdx = targetDate.getMonth() + 1; // 1-12

    return assets.map((asset) => {
      const perolehanDateStr = asset.tanggalBku || `${targetYear}-01-01`;
      const perolehanDate = new Date(perolehanDateStr);
      const thnPerolehan = perolehanDate.getFullYear();
      const blnPerolehan = perolehanDate.getMonth() + 1;

      const kategori = asset.kibKategori || 'KIB_B';
      const defaultMasa = customLifeCycles[kategori] !== undefined ? customLifeCycles[kategori] : 4;
      const masaManfaatTahun = asset.masaManfaat !== undefined ? asset.masaManfaat : defaultMasa;
      const nilaiPerolehan = asset.totalNilai || (asset.jumlah * asset.hargaSatuan);

      if (masaManfaatTahun <= 0 || kategori === 'KIB_A') {
        return {
          ...asset,
          masaManfaatTahun: 0,
          nilaiPerolehan,
          bebanBulanan: 0,
          akumulasiPenyusutan: 0,
          nilaiBuku: nilaiPerolehan,
          statusSusut: 'Tanpa Penyusutan (Permanen)',
        };
      }

      // Calculate total months of useful life
      const totalMonths = masaManfaatTahun * 12;
      const salvageValue = nilaiPerolehan * (salvageRate / 100);
      const depreciableAmount = Math.max(0, nilaiPerolehan - salvageValue);

      // Months elapsed since acquisition
      const elapsedMonths = Math.max(
        0,
        (targetYear - thnPerolehan) * 12 + (targetMonthIdx - blnPerolehan) + 1
      );

      let bebanBulanan = 0;
      let akumulasiPenyusutan = 0;
      let nilaiBuku = nilaiPerolehan;

      if (depreciationMethod === 'straight_line') {
        const monthlyDepr = depreciableAmount / totalMonths;
        bebanBulanan = elapsedMonths <= totalMonths ? monthlyDepr : 0;
        akumulasiPenyusutan = Math.min(depreciableAmount, monthlyDepr * elapsedMonths);
        nilaiBuku = Math.max(salvageValue, nilaiPerolehan - akumulasiPenyusutan);
      } else {
        // Declining balance simplified approximation
        const rate = 2 / masaManfaatTahun; // double declining
        let currentBook = nilaiPerolehan;
        for (let m = 1; m <= elapsedMonths; m++) {
          if (currentBook <= salvageValue) break;
          const mDepr = (currentBook * rate) / 12;
          bebanBulanan = mDepr;
          currentBook = Math.max(salvageValue, currentBook - mDepr);
        }
        akumulasiPenyusutan = Math.max(0, nilaiPerolehan - currentBook);
        nilaiBuku = currentBook;
      }

      const isFullyDepreciated = elapsedMonths >= totalMonths || nilaiBuku <= salvageValue;

      return {
        ...asset,
        masaManfaatTahun,
        nilaiPerolehan,
        bebanBulanan,
        akumulasiPenyusutan,
        nilaiBuku,
        statusSusut: isFullyDepreciated ? 'Habis Masa Manfaat' : 'Aktif Disusutkan',
      };
    });
  }, [assets, selectedMonth, depreciationMethod, customLifeCycles, salvageRate]);

  const summary = useMemo(() => {
    return reportData.reduce(
      (acc, curr) => ({
        totalPerolehan: acc.totalPerolehan + curr.nilaiPerolehan,
        totalBebanBulanan: acc.totalBebanBulanan + curr.bebanBulanan,
        totalAkumulasi: acc.totalAkumulasi + curr.akumulasiPenyusutan,
        totalNilaiBuku: acc.totalNilaiBuku + curr.nilaiBuku,
      }),
      { totalPerolehan: 0, totalBebanBulanan: 0, totalAkumulasi: 0, totalNilaiBuku: 0 }
    );
  }, [reportData]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-6 h-6 text-emerald-300" />
            <div>
              <h3 className="font-black text-base">Kalkulator &amp; Laporan Penyusutan Aset Otomatis (SAP)</h3>
              <p className="text-xs text-emerald-200">
                Laporan akuntansi keuangan bulanan berdasarkan histori perolehan &amp; masa manfaat aset sekolah.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Settings */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Periode Laporan Bulanan
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
              <Settings className="w-3.5 h-3.5 text-emerald-700" /> Metode Penyusutan
            </label>
            <select
              value={depreciationMethod}
              onChange={(e) => setDepreciationMethod(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="straight_line">Garis Lurus (Straight-Line SAP)</option>
              <option value="declining">Saldo Menurun Ganda (Double Declining)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-700" /> Nilai Sisa (Salvage Value %)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={salvageRate}
              onChange={(e) => setSalvageRate(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handlePrintReport}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold shadow-xs transition"
            >
              <Download className="w-4 h-4" /> Cetak / Ekspor PDF
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-4 gap-3 shrink-0 border-b border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Nilai Perolehan</span>
            <span className="text-base font-black text-slate-900 mt-1 block">{formatRupiah(summary.totalPerolehan)}</span>
          </div>
          <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200">
            <span className="text-[10px] uppercase font-bold text-teal-800 block">Beban Susut Bulan Ini</span>
            <span className="text-base font-black text-teal-900 mt-1 block">{formatRupiah(summary.totalBebanBulanan)}</span>
          </div>
          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-800 block">Akumulasi Penyusutan</span>
            <span className="text-base font-black text-amber-900 mt-1 block">{formatRupiah(summary.totalAkumulasi)}</span>
          </div>
          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Total Nilai Buku Bersih</span>
            <span className="text-base font-black text-emerald-950 mt-1 block">{formatRupiah(summary.totalNilaiBuku)}</span>
          </div>
        </div>

        {/* Report Table */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Laporan Rincian Penyusutan Per Aset ({schoolName})</span>
              <span className="text-slate-500 font-normal">Periode: {selectedMonth}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-3 py-2.5">Kode Aset</th>
                    <th className="px-3 py-2.5">Nama Barang &amp; Golongan</th>
                    <th className="px-3 py-2.5 text-center">Tgl Perolehan</th>
                    <th className="px-3 py-2.5 text-center">Masa Manfaat</th>
                    <th className="px-3 py-2.5 text-right">Harga Perolehan</th>
                    <th className="px-3 py-2.5 text-right text-teal-800">Beban Susut Bln Ini</th>
                    <th className="px-3 py-2.5 text-right text-amber-800">Akumulasi Susut</th>
                    <th className="px-3 py-2.5 text-right font-black text-emerald-900">Nilai Buku</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                        Belum ada data aset untuk dihitung penyusutannya.
                      </td>
                    </tr>
                  ) : (
                    reportData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-3 py-2.5 font-mono font-bold text-emerald-950">
                          {item.kodeAset}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-bold text-slate-900">{item.namaBarang}</div>
                          <div className="text-[10px] text-slate-500">
                            {item.merk} • {item.lokasi}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono">{item.tanggalBku}</td>
                        <td className="px-3 py-2.5 text-center">
                          {item.masaManfaatTahun > 0 ? `${item.masaManfaatTahun} Thn` : 'Permanen'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium">
                          {formatRupiah(item.nilaiPerolehan)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-teal-800 bg-teal-50/20">
                          {formatRupiah(item.bebanBulanan)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-amber-700 font-semibold">
                          {formatRupiah(item.akumulasiPenyusutan)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-black text-emerald-800 bg-emerald-50/30">
                          {formatRupiah(item.nilaiBuku)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.statusSusut.includes('Habis')
                                ? 'bg-rose-100 text-rose-700'
                                : item.statusSusut.includes('Permanen')
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.statusSusut}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Perhitungan sesuai Standar Akuntansi Pemerintahan (SAP) untuk pelaporan inventaris sekolah.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold shadow-2xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
