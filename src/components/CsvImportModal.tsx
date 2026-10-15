import React, { useState } from 'react';
import { X, Upload, Download, FileText, Check, AlertCircle } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { MasterItem, AssetRecord } from '../types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'MASTER_BARANG' | 'ASSET';
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  type,
}) => {
  const { importMasterItemsBatch, importAssetsBatch, items } = useInventory();
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  if (!isOpen) return null;

  const isMaster = type === 'MASTER_BARANG';

  const downloadSampleTemplate = () => {
    let content = '';
    let filename = '';

    if (isMaster) {
      filename = 'template_master_barang_sekolah.csv';
      content = [
        'KodeBarang,NamaBarang,Kategori,JenisSatuan,Tipe,KodeRekeningRkas,BatasMinimum,LokasiDefault,HargaEstimasi',
        'ATK-020,Map Snelhechter Plastik Folio,ATK,Pcs,HABIS_PAKAI,5.2.2.01.01,20,Gudang ATK,4500',
        'ATK-021,Buku Agenda Surat Masuk Keluar,ATK,Buku,HABIS_PAKAI,5.2.2.01.01,5,Ruang TU,35000',
        'KBR-005,Pembersih Kaca Cling Botol 450ml,Kebersihan,Botol,HABIS_PAKAI,5.2.2.01.05,5,Gudang Bersih,14000',
        'ELK-010,Kabel Roll Uticon 4 Lubang 10 Meter,Elektronik,Unit,ASET_TETAP,5.2.3.02.01,2,Lab Komputer,95000',
      ].join('\n');
    } else {
      filename = 'template_aset_inventaris_sekolah.csv';
      content = [
        'KodeAset,KodeBarang,NamaBarang,KategoriKIB,Merk,Spesifikasi,NomorSeri,TahunPerolehan,MasaManfaat,Jumlah,JenisSatuan,HargaSatuan,Lokasi,PenanggungJawab,Kondisi,SumberDana',
        'AST/ELK/2026/020,ELK-001,Laptop Chromebook Axioo 360,KIB_B,Axioo Chromebook 360,Intel Celeron 4GB RAM 32GB SSD,SN-AXI-2026-091,2026,4,1,Unit,5900000,Lab Komputer,Budi Santoso S.Pd.,BAIK,BOS Kinerja 2026',
        'AST/MBL/2025/011,MBL-001,Lemari Arsip Besi 2 Pintu Lion,KIB_B,Lion 2 Door Steel,Cat Powder Coating Kunci Sentral,SN-LION-2025-11,2025,8,1,Unit,2850000,Ruang TU,Khoirul Fajri S.Pd.,BAIK,BOS Reguler 2025',
        'AST/BKP/2024/005,BKP-001,Ensiklopedi Sains Anak Bergambar,KIB_E,Penerbit Erlangga,Hardcover Berwarna 10 Jilid,ISBN-978-602-01,2024,4,1,Set,1750000,Perpustakaan,Dewi Lestari S.Pd.,BAIK,BOS Reguler 2024',
      ].join('\n');
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvContent = (text: string) => {
    setParseError(null);
    setParsedRows([]);
    setIsSuccess(false);

    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setParseError('Data CSV minimal harus memiliki 1 baris header dan 1 baris data.');
      return;
    }

    // Determine delimiter (comma or semicolon)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';

    const headers = firstLine.split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length < 2) continue;

      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx] !== undefined ? cols[idx] : '';
      });
      rows.push(obj);
    }

    if (rows.length === 0) {
      setParseError('Tidak ada baris data valid yang terbaca.');
      return;
    }

    setParsedRows(rows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (parsedRows.length === 0) return;

    if (isMaster) {
      const itemsToImport: Omit<MasterItem, 'id'>[] = parsedRows.map((r) => ({
        kodeBarang: r.KodeBarang || r.kodeBarang || `ITM-${Date.now().toString().slice(-4)}`,
        namaBarang: r.NamaBarang || r.namaBarang || 'Barang Baru',
        kategori: (r.Kategori || r.kategori || 'ATK') as any,
        jenisSatuan: r.JenisSatuan || r.jenisSatuan || 'Pcs',
        tipe: (r.Tipe || r.tipe || 'HABIS_PAKAI') as any,
        kodeRekeningRkas: r.KodeRekeningRkas || r.kodeRekeningRkas || '5.2.2.01.01',
        batasMinimum: Number(r.BatasMinimum || r.batasMinimum) || 5,
        lokasiDefault: r.LokasiDefault || r.lokasiDefault || 'Gudang Persediaan',
        hargaEstimasi: Number(r.HargaEstimasi || r.hargaEstimasi) || 0,
        status: 'AKTIF',
      }));

      const count = importMasterItemsBatch(itemsToImport);
      setSuccessCount(count);
      setIsSuccess(true);
    } else {
      const assetsToImport: Omit<AssetRecord, 'id' | 'totalNilai'>[] = parsedRows.map((r, idx) => ({
        kodeAset: r.KodeAset || r.kodeAset || `AST/${new Date().getFullYear()}/${(idx + 1).toString().padStart(3, '0')}`,
        kodeBarang: r.KodeBarang || r.kodeBarang || items[0]?.kodeBarang || 'AST-001',
        namaBarang: r.NamaBarang || r.namaBarang || 'Aset Baru',
        merk: r.Merk || r.merk || '-',
        spesifikasi: r.Spesifikasi || r.spesifikasi || '-',
        nomorSeri: r.NomorSeri || r.nomorSeri || '-',
        tanggalBku: new Date().toISOString().slice(0, 10),
        jumlah: Number(r.Jumlah || r.jumlah) || 1,
        jenisSatuan: r.JenisSatuan || r.jenisSatuan || 'Unit',
        hargaSatuan: Number(r.HargaSatuan || r.hargaSatuan) || 0,
        lokasi: r.Lokasi || r.lokasi || 'Ruang Guru',
        penanggungJawab: r.PenanggungJawab || r.penanggungJawab || 'Pengurus Barang',
        kondisi: (r.Kondisi || r.kondisi || 'BAIK') as any,
        status: 'AKTIF',
        kibKategori: (r.KategoriKIB || r.kategoriKIB || 'KIB_B') as any,
        tahunPerolehan: Number(r.TahunPerolehan || r.tahunPerolehan) || new Date().getFullYear(),
        masaManfaat: Number(r.MasaManfaat || r.masaManfaat) || 4,
        asalUsul: r.SumberDana || r.sumberDana || 'BOS Reguler',
        keterangan: 'Diimpor dari file CSV',
      }));

      const count = importAssetsBatch(assetsToImport);
      setSuccessCount(count);
      setIsSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">
                Impor Data {isMaster ? 'Master Barang' : 'Aset & Inventaris'} (CSV / Excel)
              </h3>
              <p className="text-xs text-emerald-100">
                Unggah spreadsheet massal dengan format standar Kemendikbud &amp; RKAS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 transition text-emerald-100 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Action Step 1: Download Template */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-800">Langkah 1: Unduh Format Template CSV</p>
                <p className="text-[11px] text-slate-500">
                  Gunakan kolom standar agar data terpetakan otomatis tanpa kesalahan.
                </p>
              </div>
            </div>
            <button
              onClick={downloadSampleTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" /> Unduh Template CSV
            </button>
          </div>

          {/* Action Step 2: Upload or Paste */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Langkah 2: Pilih File CSV atau Tempel (Paste) Isi CSV
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* File Upload Box */}
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50 hover:bg-emerald-50/40 transition">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700">Pilih Dokumen (.csv)</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Dari komputer atau flashdisk</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Paste Area */}
              <div>
                <textarea
                  value={csvText}
                  onChange={(e) => {
                    setCsvText(e.target.value);
                    parseCsvContent(e.target.value);
                  }}
                  placeholder="Atau tempel (paste) baris data CSV di sini..."
                  rows={4}
                  className="w-full text-xs font-mono p-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none h-full"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {parseError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Success Banner */}
          {isSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-800">
              <Check className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-extrabold text-sm">Impor Berhasil!</h4>
                <p className="text-xs text-emerald-700">
                  Sebanyak {successCount} data {isMaster ? 'barang' : 'aset'} baru berhasil ditambahkan ke dalam database.
                </p>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && !isSuccess && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  Pratinjau Data ({parsedRows.length} baris terdeteksi):
                </span>
                <span className="text-slate-500 text-[11px]">Menampilkan 5 baris pertama</span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-48">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                    <tr>
                      {Object.keys(parsedRows[0] || {}).map((header) => (
                        <th key={header} className="p-2 border-b border-slate-200 whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        {Object.keys(parsedRows[0] || {}).map((header) => (
                          <td key={header} className="p-2 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                            {row[header] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition"
          >
            {isSuccess ? 'Tutup' : 'Batal'}
          </button>

          {!isSuccess && (
            <button
              type="button"
              disabled={parsedRows.length === 0}
              onClick={handleExecuteImport}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-md"
            >
              <Check className="w-4 h-4" /> Proses Impor ({parsedRows.length} Baris)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
