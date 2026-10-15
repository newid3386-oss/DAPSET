import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import {
  parseUploadedFile,
  downloadTemplate,
} from '../utils/exportImport';

export type ImportType =
  | 'MASTER_BARANG'
  | 'ASSET'
  | 'BARANG_MASUK'
  | 'BARANG_KELUAR'
  | 'RKBS'
  | 'SUPPLIERS'
  | 'STOCK_OPNAME'
  | 'PENGAMBILAN_ATK';

export interface AdvancedImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ImportType;
  onSuccess?: (importedCount: number) => void;
}

export const AdvancedImportModal: React.FC<AdvancedImportModalProps> = ({
  isOpen,
  onClose,
  type,
  onSuccess,
}) => {
  const {
    items,
    importMasterItemsBatch,
    importAssetsBatch,
    addBarangMasukBatch,
    addBarangKeluarBatch,
    addRkbsBatch,
    addSuppliersBatch,
    batchAddStockOpname,
    addPengambilanATKBatch,
    config,
    activeUser,
  } = useInventory();
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ count: number } | null>(null);

  if (!isOpen) return null;

  const typeConfig: Record<
    ImportType,
    {
      title: string;
      desc: string;
      requiredCols: string[];
    }
  > = {
    MASTER_BARANG: {
      title: 'Impor Master Barang Sekolah',
      desc: 'Tambahkan data master ATK, Kebersihan, Elektronik, Mebel secara massal.',
      requiredCols: ['KodeBarang', 'NamaBarang', 'Kategori', 'JenisSatuan'],
    },
    ASSET: {
      title: 'Impor Aset & Inventaris KIB',
      desc: 'Impor buku induk aset inventaris sekolah lengkap dengan KIB dan spesifikasi.',
      requiredCols: ['KodeAset', 'NamaBarang', 'KategoriKIB', 'Jumlah', 'HargaSatuan'],
    },
    BARANG_MASUK: {
      title: 'Impor Faktur Belanja Barang Masuk',
      desc: 'Impor faktur belanja BOS, SIPLah, atau kuitansi pengadaan barang dalam batch.',
      requiredCols: ['NamaBarang', 'Jumlah', 'HargaSatuan'],
    },
    BARANG_KELUAR: {
      title: 'Impor Distribusi Barang Keluar',
      desc: 'Catat pengeluaran persediaan ke unit kelas, guru, dan ruangan secara massal.',
      requiredCols: ['NamaBarang', 'Jumlah', 'Penerima'],
    },
    RKBS: {
      title: 'Impor Usulan Perencanaan RKBS',
      desc: 'Impor usulan kebutuhan belanja barang tahunan dari komite atau dewan guru.',
      requiredCols: ['NamaBarang', 'JumlahDiusulkan', 'HargaEstimasi'],
    },
    SUPPLIERS: {
      title: 'Impor Toko / Rekanan SIPLah',
      desc: 'Impor database vendor mitra sekolah untuk kemudahan pemesanan barang.',
      requiredCols: ['NamaToko', 'Kategori'],
    },
    STOCK_OPNAME: {
      title: 'Impor Hasil Audit Fisik Stock Opname',
      desc: 'Impor lembar cek fisik persediaan gudang untuk sinkronisasi saldo akhir.',
      requiredCols: ['KodeBarang', 'StokFisik'],
    },
    PENGAMBILAN_ATK: {
      title: 'Impor Berita Acara Pengambilan ATK',
      desc: 'Impor data pengambilan ATK oleh guru dan pegawai secara massal.',
      requiredCols: ['NamaLengkap', 'NamaBarang', 'Jumlah'],
    },
  };

  const currentMeta = typeConfig[type];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setErrorMessage(null);
    setSuccessInfo(null);
    setIsProcessing(true);

    try {
      const result = await parseUploadedFile(file);
      if (!result.rows || result.rows.length === 0) {
        throw new Error('File tidak memiliki data atau kosong.');
      }

      setParsedRows(result.rows);
      setHeaders(result.headers);
      setFileName(result.fileName);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses berkas file.');
      setParsedRows([]);
      setHeaders([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setParsedRows([]);
    setHeaders([]);
    setFileName('');
    setErrorMessage(null);
    setSuccessInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExecuteImport = () => {
    if (!parsedRows.length) return;
    setIsProcessing(true);

    try {
      let importedCount = 0;

      if (type === 'MASTER_BARANG') {
        const newMasterItems = parsedRows.map((r) => ({
          kodeBarang: String(r.KodeBarang || r.kodeBarang || `ITM-${Date.now().toString().slice(-4)}`).trim(),
          namaBarang: String(r.NamaBarang || r.namaBarang || '').trim(),
          kategori: String(r.Kategori || r.kategori || 'ATK').trim() as any,
          jenisSatuan: String(r.JenisSatuan || r.jenisSatuan || 'Pcs').trim(),
          tipe: (r.Tipe || r.tipe || 'HABIS_PAKAI') as any,
          kodeRekeningRkas: String(r.KodeRekeningRkas || r.kodeRekeningRkas || '5.2.2.01.01').trim(),
          batasMinimum: Number(r.BatasMinimum || r.batasMinimum) || 5,
          lokasiDefault: String(r.LokasiDefault || r.lokasiDefault || 'Gudang Utama').trim(),
          hargaEstimasi: Number(r.HargaEstimasi || r.hargaEstimasi) || 0,
          status: 'AKTIF' as const,
        })).filter((i) => i.namaBarang);

        importedCount = importMasterItemsBatch(newMasterItems);
      } else if (type === 'ASSET') {
        const newAssets = parsedRows.map((r, idx) => ({
          kodeAset: String(r.KodeAset || r.kodeAset || `AST-${Date.now().toString().slice(-4)}-${idx + 1}`).trim(),
          kodeBarang: String(r.KodeBarang || r.kodeBarang || 'BARANG-UMUM').trim(),
          namaBarang: String(r.NamaBarang || r.namaBarang || '').trim(),
          kategoriKIB: (r.KategoriKIB || r.kategoriKIB || 'KIB_B') as any,
          merk: String(r.Merk || r.merk || '-').trim(),
          spesifikasi: String(r.Spesifikasi || r.spesifikasi || '-').trim(),
          nomorSeri: String(r.NomorSeri || r.nomorSeri || '-').trim(),
          tanggalBku: String(r.TanggalBku || r.tanggalBku || new Date().toISOString().slice(0, 10)).trim(),
          tahunPerolehan: Number(r.TahunPerolehan || r.tahunPerolehan) || new Date().getFullYear(),
          masaManfaat: Number(r.MasaManfaat || r.masaManfaat) || 5,
          jumlah: Number(r.Jumlah || r.jumlah) || 1,
          jenisSatuan: String(r.JenisSatuan || r.jenisSatuan || 'Unit').trim(),
          hargaSatuan: Number(r.HargaSatuan || r.hargaSatuan) || 0,
          lokasi: String(r.Lokasi || r.lokasi || 'Sekolah').trim(),
          penanggungJawab: String(r.PenanggungJawab || r.penanggungJawab || config.headmaster).trim(),
          kondisi: (r.Kondisi || r.kondisi || 'BAIK') as any,
          status: 'AKTIF' as const,
          sumberDana: String(r.SumberDana || r.sumberDana || 'BOS Reguler').trim(),
        })).filter((a) => a.namaBarang);

        importedCount = importAssetsBatch(newAssets);
      } else if (type === 'BARANG_MASUK') {
        const newMasuk = parsedRows.map((r) => ({
          tanggal: String(r.Tanggal || r.tanggal || new Date().toISOString().slice(0, 10)).trim(),
          bulanPengadaan: String(r.BulanPengadaan || r.bulanPengadaan || 'Oktober 2026').trim(),
          namaToko: String(r.NamaToko || r.namaToko || 'Rekanan Belanja BOS').trim(),
          kodeBarang: String(r.KodeBarang || r.kodeBarang || 'ATK-001').trim(),
          namaBarang: String(r.NamaBarang || r.namaBarang || '').trim(),
          jumlah: Number(r.Jumlah || r.jumlah) || 1,
          jenisSatuan: String(r.JenisSatuan || r.jenisSatuan || 'Pcs').trim(),
          hargaSatuan: Number(r.HargaSatuan || r.hargaSatuan) || 0,
          namaSekolah: config.schoolName,
          sumberAnggaran: (r.SumberAnggaran || r.sumberAnggaran || 'BOS Reguler') as any,
          kodeRekeningRkas: String(r.KodeRekeningRkas || r.kodeRekeningRkas || '5.2.2.01.01').trim(),
          nomorBku: String(r.NomorBku || r.nomorBku || `BKU/BOS/${Date.now().toString().slice(-4)}`).trim(),
          nomorKwitansi: String(r.NomorKwitansi || r.nomorKwitansi || `KWT/${Date.now().toString().slice(-4)}`).trim(),
          petugas: activeUser.nama,
          keterangan: String(r.Keterangan || r.keterangan || 'Impor data massal').trim(),
        })).filter((m) => m.namaBarang);

        const ids = addBarangMasukBatch(newMasuk);
        importedCount = ids.length;
      } else if (type === 'BARANG_KELUAR') {
        const newKeluar = parsedRows.map((r) => ({
          tanggal: String(r.Tanggal || r.tanggal || new Date().toISOString().slice(0, 10)).trim(),
          kodeBarang: String(r.KodeBarang || r.kodeBarang || 'ATK-001').trim(),
          namaBarang: String(r.NamaBarang || r.namaBarang || '').trim(),
          jumlah: Number(r.Jumlah || r.jumlah) || 1,
          jenisSatuan: String(r.JenisSatuan || r.jenisSatuan || 'Pcs').trim(),
          penerima: String(r.Penerima || r.penerima || 'Guru / Pegawai').trim(),
          unitRuangan: String(r.UnitRuangan || r.unitRuangan || r.UnitTujuan || 'Ruang Guru').trim(),
          tujuanPenggunaan: String(r.TujuanPenggunaan || r.tujuanPenggunaan || r.Keperluan || 'Kegiatan KBM').trim(),
          petugas: activeUser.nama,
          keterangan: String(r.Keterangan || r.keterangan || 'Impor data keluar').trim(),
        })).filter((k) => k.namaBarang);

        importedCount = addBarangKeluarBatch(newKeluar);
      } else if (type === 'RKBS') {
        const newRkbs = parsedRows.map((r) => ({
          tahunAnggaran: String(r.TahunAnggaran || r.tahunAnggaran || '2026').trim(),
          kodeBarang: String(r.KodeBarang || r.kodeBarang || 'ATK-001').trim(),
          namaBarang: String(r.NamaBarang || r.namaBarang || '').trim(),
          kategori: String(r.Kategori || r.kategori || 'ATK').trim(),
          jumlahDiusulkan: Number(r.JumlahDiusulkan || r.jumlahDiusulkan) || 1,
          jenisSatuan: String(r.JenisSatuan || r.jenisSatuan || 'Unit').trim(),
          hargaEstimasi: Number(r.HargaEstimasi || r.hargaEstimasi) || 0,
          prioritas: (r.Prioritas || r.prioritas || 'SEDANG') as any,
          sumberDana: (r.SumberDana || r.sumberDana || 'BOS Reguler') as any,
          status: 'DIUSULKAN' as any,
          alasanPengadaan: String(r.AlasanPengadaan || r.alasanPengadaan || 'Kebutuhan pembelajaran').trim(),
          diajukanOleh: String(r.DiajukanOleh || r.diajukanOleh || activeUser.nama).trim(),
        })).filter((item) => item.namaBarang);

        importedCount = addRkbsBatch(newRkbs);
      } else if (type === 'SUPPLIERS') {
        const newSuppliers = parsedRows.map((r) => ({
          namaToko: String(r.NamaToko || r.namaToko || '').trim(),
          alamat: String(r.Alamat || r.alamat || '-').trim(),
          telepon: String(r.Telepon || r.telepon || '-').trim(),
          narahubung: String(r.Narahubung || r.narahubung || r.KontakPerson || '-').trim(),
          status: 'AKTIF' as const,
        })).filter((s) => s.namaToko);

        importedCount = addSuppliersBatch(newSuppliers);
      } else if (type === 'STOCK_OPNAME') {
        const newOpname = parsedRows.map((r) => {
          const itemMaster = items.find(
            (i) => i.kodeBarang.toLowerCase() === String(r.KodeBarang || r.kodeBarang).toLowerCase()
          );
          const stokSistem = Number(r.StokSistem || r.stokSistem) || (itemMaster ? 10 : 0);
          const stokFisik = Number(r.StokFisik || r.stokFisik) || 0;
          return {
            tanggal: String(r.Tanggal || r.tanggal || new Date().toISOString().slice(0, 10)).trim(),
            kodeBarang: String(r.KodeBarang || r.kodeBarang || '').trim(),
            namaBarang: String(r.NamaBarang || r.namaBarang || itemMaster?.namaBarang || 'Barang').trim(),
            stokSistem,
            stokFisik,
            jenisSatuan: String(r.JenisSatuan || r.jenisSatuan || itemMaster?.jenisSatuan || 'Pcs').trim(),
            lokasi: String(r.Lokasi || r.lokasi || 'Gudang').trim(),
            petugas: activeUser.nama,
            tindakan: String(r.Tindakan || r.tindakan || (stokFisik === stokSistem ? 'SESUAI' : 'PENYESUAIAN')).trim(),
            keterangan: String(r.Keterangan || r.keterangan || 'Hasil audit fisik massal').trim(),
          };
        }).filter((o) => o.kodeBarang);

        importedCount = batchAddStockOpname(newOpname);
      } else if (type === 'PENGAMBILAN_ATK') {
        const newAtkList = parsedRows.map((r) => {
          const itemMaster = items.find(
            (i) => i.kodeBarang.toLowerCase() === String(r.KodeBarang || r.kodeBarang).toLowerCase()
          );
          return {
            tanggal: String(r.Tanggal || r.tanggal || new Date().toISOString().slice(0, 10)).trim(),
            nip: String(r.Nip || r.nip || '198001012010011001').trim(),
            namaLengkap: String(r.NamaLengkap || r.namaLengkap || r.Nama || 'Guru / Pegawai').trim(),
            jabatan: String(r.Jabatan || r.jabatan || 'Guru Kelas').trim(),
            items: [
              {
                id: `item-${Date.now()}-${Math.random().toString().slice(-4)}`,
                kodeBarang: String(r.KodeBarang || r.kodeBarang || itemMaster?.kodeBarang || 'ATK-001').trim(),
                namaBarang: String(r.NamaBarang || r.namaBarang || itemMaster?.namaBarang || 'ATK').trim(),
                jumlah: Number(r.Jumlah || r.jumlah) || 1,
                jenisSatuan: String(r.JenisSatuan || r.jenisSatuan || itemMaster?.jenisSatuan || 'Pcs').trim(),
              },
            ],
            keterangan: String(r.Keterangan || r.keterangan || 'Impor berita acara pengambilan ATK').trim(),
            petugas: activeUser.nama,
          };
        }).filter((a) => a.namaLengkap);

        importedCount = addPengambilanATKBatch(newAtkList);
      }

      setSuccessInfo({ count: importedCount });
      showToast(`Berhasil mengimpor ${importedCount} data ke database!`, 'success');
      if (onSuccess) onSuccess(importedCount);
    } catch (err: any) {
      showToast(`Terjadi kesalahan saat menyimpan data impor: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Upload className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight">{currentMeta.title}</h3>
              <p className="text-[11px] text-emerald-200">{currentMeta.desc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Download Template Bar */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-emerald-950 text-xs">
                Belum memiliki format berkas yang sesuai?
              </div>
              <div className="text-[11px] text-emerald-800">
                Unduh template resmi siap pakai yang sudah disesuaikan kolomnya.
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => downloadTemplate(type, 'xlsx')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300 shadow-2xs transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" /> Unduh Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => downloadTemplate(type, 'csv')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300 shadow-2xs transition"
              >
                <FileText className="w-3.5 h-3.5 text-blue-700" /> Unduh CSV (.csv)
              </button>
            </div>
          </div>

          {/* If successfully imported */}
          {successInfo ? (
            <div className="py-8 text-center space-y-3 bg-emerald-50/50 rounded-2xl border border-emerald-200 p-6">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="text-base font-black text-slate-800">
                Impor Data Berhasil Disimpan!
              </div>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Sebanyak <strong>{successInfo.count} baris data</strong> berhasil diverifikasi dan
                langsung terintegrasi ke dalam sistem persediaan sekolah.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  Selesai &amp; Tutup
                </button>
              </div>
            </div>
          ) : parsedRows.length === 0 ? (
            /* Upload Dropzone */
            <div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-emerald-600 bg-emerald-50/80 scale-[1.01]'
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv, .json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">
                    Tarik &amp; Letakkan Berkas di Sini
                  </div>
                  <div className="text-slate-500 text-xs mt-0.5">
                    atau <span className="text-emerald-700 font-bold underline">klik untuk memilih dari komputer / HP</span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span>Mendukung: .xlsx</span>
                  <span>•</span>
                  <span>.xls</span>
                  <span>•</span>
                  <span>.csv</span>
                  <span>•</span>
                  <span>.json</span>
                </div>
              </div>

              {errorMessage && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Peringatan Impor:</strong> {errorMessage}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Preview Table */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-emerald-700" />
                    <span>Pratinjau Data: {fileName}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Terdeteksi <strong>{parsedRows.length} baris data</strong> siap diimpor.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-red-700 hover:underline"
                >
                  <RotateCcw className="w-3 h-3" /> Ganti Berkas
                </button>
              </div>

              {/* Table sample */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold sticky top-0 border-b border-slate-200 text-[10px]">
                      <tr>
                        <th className="px-3 py-2 w-10 text-center">No</th>
                        {headers.slice(0, 7).map((h) => (
                          <th key={h} className="px-3 py-2 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.slice(0, 6).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-1.5 text-center text-slate-400 font-mono">
                            {idx + 1}
                          </td>
                          {headers.slice(0, 7).map((h) => (
                            <td key={h} className="px-3 py-1.5 whitespace-nowrap text-slate-800">
                              {String(row[h] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedRows.length > 6 && (
                  <div className="p-2 bg-slate-50 text-center text-[10px] text-slate-400 border-t border-slate-100">
                    Menampilkan 6 dari total {parsedRows.length} baris data...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!successInfo && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 font-semibold"
            >
              Batal
            </button>

            {parsedRows.length > 0 && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-6 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold shadow-xs transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isProcessing
                  ? 'Sedang Memproses...'
                  : `Simpan & Impor (${parsedRows.length} Baris)`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
