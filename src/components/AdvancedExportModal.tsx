import React, { useState } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  FileCode,
  Check,
  Calendar,
  Layers,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
  School,
} from 'lucide-react';
import {
  exportToExcel,
  exportToCsvAdvanced,
  exportToJsonAdvanced,
  ColumnDefinition,
} from '../utils/exportImport';
import { SchoolConfig } from '../types';
import { useToast } from '../context/ToastContext';

export interface AdvancedExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  defaultFilename: string;
  data: Record<string, any>[];
  filteredData?: Record<string, any>[];
  availableColumns: ColumnDefinition[];
  schoolConfig?: SchoolConfig;
}

export const AdvancedExportModal: React.FC<AdvancedExportModalProps> = ({
  isOpen,
  onClose,
  title,
  defaultFilename,
  data,
  filteredData,
  availableColumns,
  schoolConfig,
}) => {
  const { showToast } = useToast();
  const [format, setFormat] = useState<'xlsx' | 'csv' | 'json'>('xlsx');
  const [dataScope, setDataScope] = useState<'ALL' | 'FILTERED'>('ALL');
  const [filename, setFilename] = useState(defaultFilename);
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>(
    availableColumns.map((c) => c.key)
  );
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Sync default filename on open
  React.useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      setFilename(`${defaultFilename}_${today}`);
      setSelectedColumnKeys(availableColumns.map((c) => c.key));
    }
  }, [isOpen, defaultFilename, availableColumns]);

  if (!isOpen) return null;

  const targetData =
    dataScope === 'FILTERED' && filteredData ? filteredData : data;

  const handleToggleColumn = (key: string) => {
    setSelectedColumnKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllColumns = () => {
    setSelectedColumnKeys(availableColumns.map((c) => c.key));
  };

  const handleDeselectAllColumns = () => {
    setSelectedColumnKeys([]);
  };

  const handleExecuteExport = () => {
    if (!targetData.length) {
      showToast('Tidak ada data yang dapat diekspor.', 'warning');
      return;
    }

    if (selectedColumnKeys.length === 0 && format !== 'json') {
      showToast('Pilih minimal satu kolom untuk diekspor.', 'warning');
      return;
    }

    setIsExporting(true);

    const activeColumns = availableColumns.filter((col) =>
      selectedColumnKeys.includes(col.key)
    );

    const cleanFilename = filename.trim() || defaultFilename;

    try {
      if (format === 'xlsx') {
        exportToExcel(targetData, {
          filename: cleanFilename,
          sheetName: title.substring(0, 25),
          columns: activeColumns,
          title: schoolConfig ? `${schoolConfig.schoolName} - ${title}` : title,
          subtitle: schoolConfig
            ? `NPSN: ${schoolConfig.npsn} • Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}`
            : undefined,
        });
      } else if (format === 'csv') {
        exportToCsvAdvanced(targetData, {
          filename: cleanFilename,
          columns: activeColumns,
        });
      } else if (format === 'json') {
        exportToJsonAdvanced(targetData, cleanFilename);
      }

      showToast(`Data berhasil diekspor ke format .${format.toUpperCase()}!`, 'success');

      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 400);
    } catch (err: any) {
      showToast(`Gagal mengekspor data: ${err.message || 'Terjadi kesalahan sistem'}`, 'error');
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Download className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight">{title}</h3>
              <p className="text-[11px] text-emerald-200">
                Ekspor berkas terstruktur multi-format (Excel, CSV, JSON)
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Format Selector */}
          <div>
            <label className="font-bold text-slate-800 block mb-2">
              1. Pilih Format File Unduhan:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* XLSX */}
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col items-center text-center gap-2 ${
                  format === 'xlsx'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600 text-emerald-950 font-bold shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Microsoft Excel</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">.xlsx</div>
                </div>
              </button>

              {/* CSV */}
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col items-center text-center gap-2 ${
                  format === 'csv'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600 text-emerald-950 font-bold shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-800">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">File CSV UTF-8</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">.csv</div>
                </div>
              </button>

              {/* JSON */}
              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col items-center text-center gap-2 ${
                  format === 'json'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600 text-emerald-950 font-bold shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Format JSON</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">.json</div>
                </div>
              </button>
            </div>
          </div>

          {/* Scope Selection */}
          <div>
            <label className="font-bold text-slate-800 block mb-2">
              2. Cakupan Data yang Diekspor:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition ${
                  dataScope === 'ALL'
                    ? 'border-emerald-500 bg-emerald-50/50 font-bold text-slate-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="dataScope"
                  checked={dataScope === 'ALL'}
                  onChange={() => setDataScope('ALL')}
                  className="text-emerald-700 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-semibold">Semua Data</div>
                  <div className="text-[10px] text-slate-500">
                    Total {data.length} baris data
                  </div>
                </div>
              </label>

              {filteredData && (
                <label
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition ${
                    dataScope === 'FILTERED'
                      ? 'border-emerald-500 bg-emerald-50/50 font-bold text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="dataScope"
                    checked={dataScope === 'FILTERED'}
                    onChange={() => setDataScope('FILTERED')}
                    className="text-emerald-700 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-semibold">Hasil Filter Saat Ini</div>
                    <div className="text-[10px] text-slate-500">
                      Total {filteredData.length} baris data
                    </div>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Column Customizer (Only for Excel / CSV) */}
          {format !== 'json' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-bold text-slate-800">
                  3. Pilih Kolom Data ({selectedColumnKeys.length}/{availableColumns.length}):
                </label>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={handleSelectAllColumns}
                    className="text-emerald-700 hover:underline font-semibold"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleDeselectAllColumns}
                    className="text-slate-500 hover:underline"
                  >
                    Hapus Semua
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-200 max-h-44 overflow-y-auto">
                {availableColumns.map((col) => {
                  const isChecked = selectedColumnKeys.includes(col.key);
                  return (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer transition text-[11px]"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleColumn(col.key)}
                        className="rounded text-emerald-700 focus:ring-emerald-500"
                      />
                      <span className={isChecked ? 'font-medium text-slate-900' : 'text-slate-500'}>
                        {col.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filename input */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              4. Nama File Unduhan:
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
              />
              <span className="ml-2 font-mono text-slate-400 font-bold">.{format}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 font-semibold"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleExecuteExport}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold shadow-xs transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Mengekspor Berkas...' : `Unduh Berkas .${format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
};
