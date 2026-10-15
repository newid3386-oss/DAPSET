import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  FileCheck,
  Sparkles,
  RefreshCw,
  Info,
  Layers,
} from 'lucide-react';
import { MasterItem } from '../types';
import { exportToCsvAdvanced, exportToExcel, parseUploadedFile } from '../utils/exportImport';
import { useToast } from '../context/ToastContext';

export interface CsvTemplateValidatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingItems: MasterItem[];
  onImportValidRows: (rows: any[]) => void;
}

export const CsvTemplateValidatorModal: React.FC<CsvTemplateValidatorModalProps> = ({
  isOpen,
  onClose,
  existingItems,
  onImportValidRows,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'generator' | 'validator'>('generator');
  
  // Generator State
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');
  const [includeSamples, setIncludeSamples] = useState(true);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');

  // Validator State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [validationResults, setValidationResults] = useState<
    {
      rowNumber: number;
      data: any;
      isValid: boolean;
      errors: string[];
      warnings: string[];
    }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    let rows = [
      {
        KodeBarang: 'ATK-050',
        NamaBarang: 'Buku Tulis Sinar Dunia 38 Lembar',
        Kategori: 'ATK',
        JenisSatuan: 'Pack',
        Tipe: 'HABIS_PAKAI',
        KodeRekeningRkas: '5.2.2.01.01',
        BatasMinimum: 10,
        LokasiDefault: 'Gudang ATK',
        HargaEstimasi: 42000,
      },
      {
        KodeBarang: 'KBR-015',
        NamaBarang: 'Sabun Cuci Piring Mama Lemon 750ml',
        Kategori: 'Kebersihan',
        JenisSatuan: 'Pouch',
        Tipe: 'HABIS_PAKAI',
        KodeRekeningRkas: '5.2.2.01.05',
        BatasMinimum: 5,
        LokasiDefault: 'Gudang Kebersihan',
        HargaEstimasi: 16500,
      },
      {
        KodeBarang: 'ELK-025',
        NamaBarang: 'Mouse Wireless Logitech B170',
        Kategori: 'Elektronik',
        JenisSatuan: 'Unit',
        Tipe: 'ASET_TETAP',
        KodeRekeningRkas: '5.2.3.02.01',
        BatasMinimum: 2,
        LokasiDefault: 'Lab Komputer',
        HargaEstimasi: 145000,
      },
    ];

    if (selectedCategory !== 'SEMUA') {
      rows = rows.filter((r) => r.Kategori === selectedCategory);
      if (rows.length === 0) {
        rows = [
          {
            KodeBarang: `${selectedCategory.toUpperCase().slice(0, 3)}-001`,
            NamaBarang: `Contoh Barang ${selectedCategory}`,
            Kategori: selectedCategory,
            JenisSatuan: 'Pcs',
            Tipe: 'HABIS_PAKAI',
            KodeRekeningRkas: '5.2.2.01.01',
            BatasMinimum: 5,
            LokasiDefault: 'Gudang Utama',
            HargaEstimasi: 25000,
          },
        ];
      }
    }

    const finalData = includeSamples ? rows : [rows[0]]; // if not include samples, give single template row or empty example

    const filename = `Template_Master_Barang_${selectedCategory}_${new Date().toISOString().slice(0, 10)}`;

    if (exportFormat === 'csv') {
      exportToCsvAdvanced(finalData, { filename });
    } else {
      exportToExcel(finalData, { filename, sheetName: 'Master Barang' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndValidateFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processAndValidateFile(file);
  };

  const processAndValidateFile = async (file: File) => {
    setIsProcessing(true);
    setImportSuccessCount(null);
    setFileName(file.name);

    try {
      const result = await parseUploadedFile(file);
      const rows = result.rows;

      if (!rows || rows.length === 0) {
        throw new Error('Berkas tidak memiliki baris data atau kosong.');
      }

      const existingCodes = new Set(existingItems.map((i) => i.kodeBarang.toLowerCase()));
      const seenCodesInFile = new Set<string>();

      const validationResultsMapped = rows.map((r, idx) => {
        const rowNum = idx + 1;
        const errors: string[] = [];
        const warnings: string[] = [];

        const kode = String(r.KodeBarang || r.kodeBarang || '').trim();
        const nama = String(r.NamaBarang || r.namaBarang || '').trim();
        const kategori = String(r.Kategori || r.kategori || '').trim();
        const satuan = String(r.JenisSatuan || r.jenisSatuan || '').trim();
        const harga = Number(r.HargaEstimasi || r.hargaEstimasi);

        // Validation rules
        if (!kode) {
          errors.push('Kode Barang wajib diisi.');
        } else {
          const lowerCode = kode.toLowerCase();
          if (seenCodesInFile.has(lowerCode)) {
            errors.push(`Kode Barang "${kode}" duplikat di dalam berkas ini.`);
          } else {
            seenCodesInFile.add(lowerCode);
          }
          if (existingCodes.has(lowerCode)) {
            warnings.push(`Kode Barang "${kode}" sudah ada di database (akan memperbarui data lama).`);
          }
        }

        if (!nama) {
          errors.push('Nama Barang wajib diisi.');
        }

        if (!kategori) {
          warnings.push('Kategori kosong, akan diset default "ATK".');
        }

        if (!satuan) {
          warnings.push('Jenis Satuan kosong, akan diset default "Pcs".');
        }

        if (isNaN(harga) || harga < 0) {
          errors.push('Harga Estimasi tidak valid atau negatif.');
        }

        const isValid = errors.length === 0;

        return {
          rowNumber: rowNum,
          data: {
            kodeBarang: kode || `BRG-${rowNum}`,
            namaBarang: nama || 'Tanpa Nama',
            kategori: kategori || 'ATK',
            jenisSatuan: satuan || 'Pcs',
            tipe: String(r.Tipe || r.tipe || 'HABIS_PAKAI'),
            kodeRekeningRkas: String(r.KodeRekeningRkas || r.kodeRekeningRkas || '5.2.2.01.01'),
            batasMinimum: Number(r.BatasMinimum || r.batasMinimum) || 5,
            lokasiDefault: String(r.LokasiDefault || r.lokasiDefault || 'Gudang Persediaan'),
            hargaEstimasi: isNaN(harga) ? 0 : harga,
            status: 'AKTIF' as const,
          },
          isValid,
          errors,
          warnings,
        };
      });

      setValidationResults(validationResultsMapped);
    } catch (err: any) {
      showToast(`Gagal memvalidasi berkas: ${err.message}`, 'error');
      setValidationResults([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteValidImport = () => {
    const validRows = validationResults.filter((v) => v.isValid).map((v) => v.data);
    if (validRows.length === 0) {
      showToast('Tidak ada baris valid yang dapat diimpor.', 'warning');
      return;
    }

    onImportValidRows(validRows);
    showToast(`Berhasil mengimpor ${validRows.length} baris data yang tervalidasi!`, 'success');
    setImportSuccessCount(validRows.length);
  };

  const resetValidator = () => {
    setValidationResults([]);
    setFileName('');
    setImportSuccessCount(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validCount = validationResults.filter((v) => v.isValid).length;
  const invalidCount = validationResults.filter((v) => !v.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight">Generator Template &amp; Validator CSV Master Barang</h3>
              <p className="text-[11px] text-emerald-200">
                Unduh format template baku dan lakukan pra-validasi data sebelum impor massal.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'generator'
                ? 'border-emerald-700 text-emerald-900 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-700" /> Generator Template CSV/Excel
          </button>
          <button
            onClick={() => setActiveTab('validator')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'validator'
                ? 'border-emerald-700 text-emerald-900 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700" /> Validator &amp; Cek Error CSV
            {validationResults.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                {validationResults.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {activeTab === 'generator' ? (
            /* GENERATOR TAB */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-emerald-950 space-y-1">
                  <div className="font-bold text-xs">Tentang Generator Template Resmi Sekolah</div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Template ini dilengkapi dengan header kolom yang divalidasi sistem (KodeBarang, NamaBarang, Kategori, JenisSatuan, Tipe, KodeRekeningRkas, BatasMinimum, LokasiDefault, HargaEstimasi) serta contoh baris pengisian agar terhindar dari kesalahan format saat diunggah.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Pilih Filter Kategori Template</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="SEMUA">Semua Kategori (Template Lengkap)</option>
                    <option value="ATK">ATK (Alat Tulis Kantor)</option>
                    <option value="Kebersihan">Kebersihan &amp; Sanitasi</option>
                    <option value="Elektronik">Elektronik &amp; TIK</option>
                    <option value="Mebel">Mebel &amp; Perlengkapan Kelas</option>
                    <option value="Laboratorium">Laboratorium</option>
                    <option value="Olahraga">Olahraga</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Format Berkas Unduhan</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setExportFormat('csv')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border font-bold text-xs transition ${
                        exportFormat === 'csv'
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-900 shadow-2xs'
                          : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-blue-600" /> CSV (.csv)
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportFormat('xlsx')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border font-bold text-xs transition ${
                        exportFormat === 'xlsx'
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-900 shadow-2xs'
                          : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-700" /> Excel (.xlsx)
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Sertakan Contoh Baris Panduan (Sample Data)</div>
                  <div className="text-slate-500 text-[11px]">
                    Sangat direkomendasikan agar pengguna memiliki gambaran cara mengisi sel kolom dengan benar.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSamples}
                    onChange={(e) => setIncludeSamples(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                </label>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
                >
                  <Download className="w-4 h-4" /> Unduh Template Sekarang ({exportFormat.toUpperCase()})
                </button>
              </div>
            </div>
          ) : (
            /* VALIDATOR TAB */
            <div className="space-y-4">
              {importSuccessCount !== null ? (
                <div className="py-8 text-center space-y-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 p-6">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="text-base font-black text-slate-800">
                    Impor Berhasil Disimpan!
                  </div>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Sebanyak <strong>{importSuccessCount} baris data valid</strong> telah berhasil dimasukkan ke dalam Master Barang sekolah.
                  </p>
                  <div className="pt-2 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={resetValidator}
                      className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-semibold text-slate-700"
                    >
                      Uji Berkas Lain
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold"
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              ) : validationResults.length === 0 ? (
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
                      accept=".csv, .xlsx, .xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">
                        Unggah / Tarik Berkas CSV untuk Diuji Validasi
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        Sistem akan memeriksa duplikasi kode, kolom wajib, dan format harga secara instan.
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>Mendukung: .csv</span>
                      <span>•</span>
                      <span>.xlsx</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        Hasil Pra-Validasi: <span className="font-mono text-emerald-800">{fileName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {validCount} Baris Valid
                        </span>
                        {invalidCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" /> {invalidCount} Baris Error
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={resetValidator}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-100 transition"
                      >
                        <RefreshCw className="w-3 h-3" /> Ganti Berkas
                      </button>
                      <button
                        type="button"
                        onClick={handleExecuteValidImport}
                        disabled={validCount === 0}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Impor {validCount} Baris Valid
                      </button>
                    </div>
                  </div>

                  {/* Validation Table Feedbacks */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-100 text-slate-700 uppercase font-bold sticky top-0 border-b border-slate-200 text-[10px]">
                          <tr>
                            <th className="px-3 py-2 text-center w-12">Baris</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Kode</th>
                            <th className="px-3 py-2">Nama Barang</th>
                            <th className="px-3 py-2">Kategori / Satuan</th>
                            <th className="px-3 py-2">Catatan Validasi &amp; Umpan Balik</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {validationResults.map((res) => (
                            <tr
                              key={res.rowNumber}
                              className={
                                res.isValid
                                  ? 'hover:bg-slate-50'
                                  : 'bg-rose-50/50 hover:bg-rose-50'
                              }
                            >
                              <td className="px-3 py-2 text-center font-mono text-slate-400 font-bold">
                                #{res.rowNumber}
                              </td>
                              <td className="px-3 py-2">
                                {res.isValid ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Valid
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                                    <AlertTriangle className="w-3 h-3 text-rose-700" /> Error
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 font-mono font-bold text-slate-900">
                                {res.data.kodeBarang || '-'}
                              </td>
                              <td className="px-3 py-2 font-semibold text-slate-800">
                                {res.data.namaBarang}
                              </td>
                              <td className="px-3 py-2 text-slate-600">
                                {res.data.kategori} ({res.data.jenisSatuan})
                              </td>
                              <td className="px-3 py-2">
                                {res.errors.length > 0 && (
                                  <div className="text-rose-700 font-medium space-y-0.5">
                                    {res.errors.map((err, i) => (
                                      <div key={i} className="flex items-center gap-1">
                                        <span>• {err}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {res.warnings.length > 0 && (
                                  <div className="text-amber-700 font-medium space-y-0.5 mt-0.5">
                                    {res.warnings.map((warn, i) => (
                                      <div key={i} className="flex items-center gap-1">
                                        <span>⚠️ {warn}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {res.isValid && res.warnings.length === 0 && (
                                  <span className="text-emerald-700 font-medium">Siap diimpor tanpa kendala.</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
