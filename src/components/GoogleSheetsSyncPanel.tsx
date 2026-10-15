import React, { useState } from 'react';
import { FileSpreadsheet, ExternalLink, Loader2, CheckCircle2, CloudUpload } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { exportInventoryToGoogleSheets } from '../services/googleSheetsService';

export const GoogleSheetsSyncPanel: React.FC = () => {
  const {
    config,
    items,
    assets,
    barangMasuk,
    barangKeluar,
    pengambilanATK,
    suppliers,
  } = useInventory();
  const { showToast } = useToast();

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSheetUrl, setLastSheetUrl] = useState<string | null>(null);

  const handleSyncToSheets = async () => {
    setIsSyncing(true);
    try {
      const result = await exportInventoryToGoogleSheets(
        config.schoolName,
        items,
        assets,
        barangMasuk,
        barangKeluar,
        pengambilanATK,
        suppliers
      );
      setLastSheetUrl(result.spreadsheetUrl);
      showToast('Berhasil membuat & menyinkronkan data ke Google Spreadsheet!', 'success');
    } catch (err: any) {
      showToast(`Gagal sinkronisasi Google Sheets: ${err.message || 'Kesalahan otorisasi'}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-200 p-5 md:p-6 shadow-xs space-y-4 text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Integrasi Google Spreadsheet (Cloud Sync)</h3>
            <p className="text-[11px] text-slate-500">Ekspor instan seluruh inventaris ke Google Sheets online</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200">
          Google Workspace 1P
        </span>
      </div>

      <p className="text-slate-600 leading-relaxed">
        Fitur ini memungkinkan Anda mengekspor seluruh basis data inventaris sekolah (Master Barang, Aset KIB, Barang Masuk/Keluar, Pengambilan ATK, dan Supplier) langsung ke dokumen <strong>Google Spreadsheet</strong> baru di akun Google Anda dengan satu klik.
      </p>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          disabled={isSyncing}
          onClick={handleSyncToSheets}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Menyiapkan Google Spreadsheet...
            </>
          ) : (
            <>
              <CloudUpload className="w-4 h-4" /> Ekspor & Sinkronkan ke Google Spreadsheet
            </>
          )}
        </button>

        {lastSheetUrl && (
          <a
            href={lastSheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 font-bold text-emerald-800 transition shadow-xs"
          >
            <ExternalLink className="w-4 h-4 text-emerald-700" /> Buka Spreadsheet Online
          </a>
        )}
      </div>

      {lastSheetUrl && (
        <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center gap-2 text-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="text-[11px] font-medium">
            Spreadsheet berhasil dibuat dan disinkronkan. Klik tombol di atas untuk melihat dokumen Anda di Google Sheets.
          </span>
        </div>
      )}
    </div>
  );
};
