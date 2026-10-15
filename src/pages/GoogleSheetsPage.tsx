import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  LogIn,
  LogOut,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Database,
  ArrowRight
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { auth } from '../services/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = sessionStorage.getItem('SIMBARAS_GSHEETS_TOKEN');

export const initGoogleSheetsAuth = (
  onSuccess: (user: User, token: string) => void,
  onFailure: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (cachedAccessToken) {
        onSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        sessionStorage.removeItem('SIMBARAS_GSHEETS_TOKEN');
        onFailure();
      }
    } else {
      cachedAccessToken = null;
      sessionStorage.removeItem('SIMBARAS_GSHEETS_TOKEN');
      onFailure();
    }
  });
};

export const signInWithGoogleSheets = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth');
    }
    cachedAccessToken = credential.accessToken;
    sessionStorage.setItem('SIMBARAS_GSHEETS_TOKEN', cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err) {
    console.error('Google Sheets Auth error:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
};

export const logoutGoogleSheets = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  sessionStorage.removeItem('SIMBARAS_GSHEETS_TOKEN');
};

export const GoogleSheetsPage: React.FC = () => {
  const { items, barangMasuk, barangKeluar, suppliers } = useInventory();
  const { showToast, confirmDialog } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string>(
    localStorage.getItem('sim_sarpras_spreadsheet_id') || ''
  );
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    const unsubscribe = initGoogleSheetsAuth(
      (u, token) => {
        setUser(u);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (spreadsheetId) {
      localStorage.setItem('sim_sarpras_spreadsheet_id', spreadsheetId);
      setSpreadsheetUrl(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
    }
  }, [spreadsheetId]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setStatusMessage(null);
    try {
      const res = await signInWithGoogleSheets();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        setStatusMessage({ type: 'success', text: `Berhasil masuk sebagai ${res.user.email}` });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Gagal otentikasi Google: ${err.message}` });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogleSheets();
    setUser(null);
    setAccessToken(null);
    setStatusMessage({ type: 'info', text: 'Berhasil keluar dari akun Google.' });
  };

  // Create a new Google Sheet
  const handleCreateSpreadsheet = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: `SIM-SARPRAS Inventory Data - ${new Date().toLocaleDateString('id-ID')}`,
          },
          sheets: [
            { properties: { title: 'MasterBarang' } },
            { properties: { title: 'BarangMasuk' } },
            { properties: { title: 'BarangKeluar' } },
            { properties: { title: 'Supplier' } },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Gagal membuat Google Spreadsheet');

      setSpreadsheetId(data.spreadsheetId);
      setStatusMessage({
        type: 'success',
        text: `Google Spreadsheet baru berhasil dibuat! ID: ${data.spreadsheetId}`,
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Gagal membuat Spreadsheet: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Export Data to Google Sheet
  const handleExportToSheets = async () => {
    if (!accessToken || !spreadsheetId) {
      showToast('Harap masukkan atau buat Spreadsheet ID terlebih dahulu.', 'warning');
      return;
    }

    const confirmed = await confirmDialog({
      title: 'Sinkronisasi ke Google Sheets?',
      message: 'Yakin ingin menyinkronkan dan mengekspor seluruh data inventaris ke Google Sheets? Data pada spreadsheet akan diperbarui.',
      confirmText: 'Ekspor ke Sheets',
      variant: 'primary',
    });
    if (!confirmed) {
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      // 1. Prepare Master Barang values
      const masterRows = [
        ['Kode Barang', 'Nama Barang', 'Kategori', 'Jenis Satuan', 'Harga Estimasi', 'Stok Minimum'],
        ...items.map((i) => [i.kodeBarang, i.namaBarang, i.kategori, i.jenisSatuan, i.hargaEstimasi, i.batasMinimum]),
      ];

      // 2. Prepare Barang Masuk values
      const masukRows = [
        ['No. BKU', 'Tanggal', 'Nama Toko', 'Petugas', 'Total Pengadaan', 'Keterangan'],
        ...barangMasuk.map((m) => [m.nomorBku, m.tanggal, m.namaToko, m.petugas, m.totalPengadaan, m.keterangan]),
      ];

      // 3. Prepare Barang Keluar values
      const keluarRows = [
        ['ID', 'Tanggal', 'Penerima', 'Unit Kerja / Ruangan', 'Petugas', 'Keterangan'],
        ...barangKeluar.map((k) => [k.id, k.tanggal, k.penerima, k.unitRuangan, k.petugas, k.keterangan]),
      ];

      // 4. Prepare Supplier values
      const supplierRows = [
        ['Nama Toko', 'Telepon', 'Alamat'],
        ...suppliers.map((s) => [s.namaToko, s.telepon, s.alamat]),
      ];

      const body = {
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: 'MasterBarang!A1', values: masterRows },
          { range: 'BarangMasuk!A1', values: masukRows },
          { range: 'BarangKeluar!A1', values: keluarRows },
          { range: 'Supplier!A1', values: supplierRows },
        ],
      };

      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Gagal mengekspor data ke Google Sheets');

      setStatusMessage({
        type: 'success',
        text: 'Data inventaris, barang masuk, barang keluar, dan supplier berhasil disinkronkan ke Google Sheets!',
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Gagal Ekspor: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Koneksi Google Sheets
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Sinkronkan dan simpan data inventaris sekolah secara real-time ke Google Spreadsheet pribadi Anda.
            </p>
          </div>
        </div>

        {/* Auth Button */}
        <div>
          {!user ? (
            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <LogIn className="w-4 h-4 text-emerald-600" />}
              <span>Masuk dengan Akun Google</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-white truncate max-w-[160px]">{user.displayName || user.email}</div>
                <div className="text-[10px] text-emerald-400">Terhubung ke Google Sheets</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-xl bg-slate-700 hover:bg-rose-950 text-slate-300 hover:text-rose-400 transition cursor-pointer"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/40 border-rose-800 text-rose-300'
              : 'bg-blue-950/40 border-blue-800 text-blue-300'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Content Card */}
      {user ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Spreadsheet Setup */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <h3 className="font-black text-sm text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Pengaturan Spreadsheet
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Spreadsheet ID:</label>
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value.trim())}
                  placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  ID diambil dari URL Google Sheets (di antara /d/ dan /edit).
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCreateSpreadsheet}
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                  <span>Buat Spreadsheet Baru Otomatis</span>
                </button>
              </div>

              {spreadsheetUrl && (
                <div className="pt-2">
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs border border-emerald-500/40 transition flex items-center justify-center gap-2"
                  >
                    <span>Buka Google Spreadsheet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Actions & Sync */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                Sinkronisasi Data Inventaris
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Anda dapat mengekspor seluruh rekapitulasi data master barang, catatan barang masuk, barang keluar, dan daftar penyedia toko ke dalam lembar kerja Google Sheets secara instan.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-300">Total Master Barang</div>
                    <div className="text-lg font-black text-emerald-400 mt-1">{items.length} Item</div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2">Tab: MasterBarang</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-300">Catatan Transaksi</div>
                    <div className="text-lg font-black text-blue-400 mt-1">{barangMasuk.length + barangKeluar.length} Transaksi</div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2">Tab: BarangMasuk &amp; BarangKeluar</div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleExportToSheets}
                disabled={isLoading || !spreadsheetId}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>Ekspor &amp; Sinkronkan ke Google Sheets</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-2xl font-black">
            📊
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-bold text-white">Hubungkan dengan Google Sheets</h3>
            <p className="text-xs text-slate-400">
              Silakan masuk menggunakan akun Google Anda di atas untuk mulai menyinkronkan data inventaris sekolah dengan Google Sheets.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
