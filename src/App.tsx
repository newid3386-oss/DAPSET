import React, { useState, useEffect } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Navigation, PageId, navItems } from './components/Navigation';
import { DashboardPage } from './pages/DashboardPage';
import { DaftarPegawaiPage } from './pages/DaftarPegawaiPage';
import { MasterBarangPage } from './pages/MasterBarangPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { BarangMasukPage } from './pages/BarangMasukPage';
import { BarangKeluarPage } from './pages/BarangKeluarPage';
import { TerminalLogistikPage } from './pages/TerminalLogistikPage';
import { PersediaanPage } from './pages/PersediaanPage';
import { RkbsPage } from './pages/RkbsPage';
import { AsetPage } from './pages/AsetPage';
import { IntegrasiNasionalPage } from './pages/IntegrasiNasionalPage';
import { MutasiPage } from './pages/MutasiPage';
import { StockOpnamePage } from './pages/StockOpnamePage';
import { PemeliharaanPage } from './pages/PemeliharaanPage';
import { PenghapusanPage } from './pages/PenghapusanPage';
import { PengambilanATKPage } from './pages/PengambilanATKPage';
import { LaporanPage } from './pages/LaporanPage';
import { AuditPage } from './pages/AuditPage';
import { ConfigPage } from './pages/ConfigPage';
import { GoogleSheetsPage } from './pages/GoogleSheetsPage';
import { GmailPage } from './pages/GmailPage';
import { GoogleDocsPage } from './pages/GoogleDocsPage';
import { KioskPage } from './pages/KioskPage';
import { ScanReceiptModal } from './components/ScanReceiptModal';
import { AiAdvisorModal } from './components/AiAdvisorModal';
import { QrScannerModal } from './components/QrScannerModal';
import { CommandPalette } from './components/CommandPalette';
import { NotificationCenter } from './components/NotificationCenter';
import { UserAuthModal } from './components/UserAuthModal';
import { UserEmployee } from './types';
import {
  Menu,
  Sparkles,
  Camera,
  School,
  Calendar,
  Search,
  QrCode,
  Store,
  Zap,
  Cloud,
  RefreshCw,
  Lock,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { formatTanggalIndo } from './utils/format';

const AccessDeniedView: React.FC<{
  pageTitle: string;
  requiredRoles: UserEmployee['role'][];
  onOpenAuth: () => void;
}> = ({ pageTitle, requiredRoles, onOpenAuth }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs text-center max-w-lg mx-auto my-12 space-y-4 animate-in fade-in">
      <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
        <Lock className="w-8 h-8" />
      </div>
      <div>
        <span className="text-[10px] font-bold tracking-wider text-amber-600 uppercase bg-amber-100 px-2 py-0.5 rounded-md">
          Akses Terbatas (RBAC Protected)
        </span>
        <h3 className="text-lg font-black text-slate-800 mt-2">Modul {pageTitle} Terkunci</h3>
        <p className="text-xs text-slate-500 mt-1">
          Halaman ini memerlukan hak akses tingkat <strong>{requiredRoles.join(' atau ')}</strong> untuk mencegah modifikasi tidak sah pada inventaris sekolah.
        </p>
      </div>
      <div className="pt-2 flex justify-center gap-2">
        <button
          onClick={onOpenAuth}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <UserCheck className="w-4 h-4" />
          <span>Verifikasi Otorisasi / Masukkan PIN</span>
        </button>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const {
    config,
    cloudSyncStatus,
    isCloudSyncing,
    syncToCloud,
    lastRemoteSyncInfo,
    activeUser,
    hasPermission,
  } = useInventory();
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRequiredRole, setAuthRequiredRole] = useState<UserEmployee['role'] | undefined>(undefined);
  const lastToastSignalRef = React.useRef<string | null>(null);

  // Kolaborasi Multi-Perangkat: Berikan notifikasi real-time saat rekan lain memperbarui data
  useEffect(() => {
    if (
      lastRemoteSyncInfo &&
      lastRemoteSyncInfo.time &&
      lastToastSignalRef.current !== `${lastRemoteSyncInfo.deviceId}_${lastRemoteSyncInfo.time}`
    ) {
      lastToastSignalRef.current = `${lastRemoteSyncInfo.deviceId}_${lastRemoteSyncInfo.time}`;
      showToast(
        `Kolaborasi Multi-Perangkat: ${lastRemoteSyncInfo.user} (${lastRemoteSyncInfo.action}) memperbarui modul "${lastRemoteSyncInfo.module}".`,
        'info',
        5000
      );
    }
  }, [lastRemoteSyncInfo, showToast]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScanReceiptOpen, setIsScanReceiptOpen] = useState(false);
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Prefilled data from AI scan
  const [prefilledScanData, setPrefilledScanData] = useState<any>(null);

  const handleApplyScanData = (data: any) => {
    setPrefilledScanData(data);
    setCurrentPage('barang_masuk');
  };

  const currentItem = navItems.find((n) => n.id === currentPage);
  const PageIcon = currentItem?.icon || School;

  if (currentPage === 'kiosk') {
    return (
      <KioskPage
        onExitKiosk={() => setCurrentPage('dashboard')}
        onOpenTerminal={() => setCurrentPage('terminal_logistik')}
      />
    );
  }

  if (currentPage === 'terminal_logistik') {
    return <TerminalLogistikPage onExitTerminal={() => setCurrentPage('dashboard')} />;
  }

  return (
    <div className="min-h-screen flex bg-slate-100/70 font-sans text-slate-800 antialiased">
      {/* Sidebar Navigation */}
      <Navigation
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
        onOpenQrScanner={() => setIsQrScannerOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar Header */}
        <header className="no-print sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 hidden sm:block">
                <PageIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm md:text-base text-slate-900 leading-tight">
                  {currentItem?.label || 'Sistem Bendahara Barang'}
                </h1>
                <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5">
                  <span>{config.schoolName}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formatTanggalIndo(new Date())}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            {/* Notification Center */}
            <NotificationCenter onNavigate={setCurrentPage} />

            {/* Live Cloud Status & Quick Sync Pill */}
            <button
              type="button"
              onClick={async () => {
                const ok = await syncToCloud();
                if (ok) {
                  showToast('Database inventaris tersinkronisasi ke Cloud Firestore!', 'success');
                } else {
                  showToast('Gagal menyinkronkan ke Cloud Firestore.', 'error');
                }
              }}
              disabled={isCloudSyncing}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                cloudSyncStatus === 'CONNECTED'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : cloudSyncStatus === 'SYNCING'
                  ? 'border-sky-200 bg-sky-50 text-sky-800'
                  : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
              title="Status Cloud Firestore (Klik untuk Sinkronisasi Cepat)"
            >
              {isCloudSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
              ) : (
                <Cloud className={`w-3.5 h-3.5 ${cloudSyncStatus === 'CONNECTED' ? 'text-emerald-600' : 'text-amber-600'}`} />
              )}
              <span className="hidden xl:inline">
                {isCloudSyncing ? 'Sinkron...' : cloudSyncStatus === 'CONNECTED' ? 'Cloud Aktif' : 'Offline'}
              </span>
            </button>

            {/* User Profile & Role Switcher (P0 Hardened RBAC) */}
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer text-xs shadow-2xs group"
              title="Kelola Profil & Hak Otorisasi Pengguna (PIN Admin)"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-[11px] group-hover:scale-105 transition">
                {activeUser.nama.slice(0, 1)}
              </div>
              <div className="hidden lg:flex flex-col text-left leading-none">
                <span className="font-bold text-slate-800 text-[11px] truncate max-w-[110px]">{activeUser.nama}</span>
                <span className="text-[9px] text-slate-400 font-mono mt-0.5">{activeUser.jabatan.split('/')[0]}</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase border ${
                activeUser.role === 'ADMIN'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : activeUser.role === 'BENDAHARA'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : activeUser.role === 'PENGURUS_BARANG'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-sky-50 text-sky-800 border-sky-200'
              }`}>
                {activeUser.role}
              </span>
            </button>

            {/* Quick Search Shortcut */}
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition"
              title="Pencarian Cepat (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Cari Cepat</span>
              <kbd className="hidden lg:inline text-[9px] bg-white border border-slate-300 rounded px-1 text-slate-400 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Kiosk Mode Button */}
            <button
              type="button"
              onClick={() => setCurrentPage('kiosk')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition shadow-2xs"
              title="Buka Mode Kiosk Mandiri Guru"
            >
              <Store className="w-3.5 h-3.5 text-indigo-700" />
              <span className="hidden sm:inline">Kiosk Guru</span>
            </button>

            {/* Terminal Cepat Logistik & Kios Guru Button */}
            <button
              type="button"
              onClick={() => setCurrentPage('terminal_logistik')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-black transition shadow-2xs cursor-pointer"
              title="Buka Mode Terminal Cepat & Kios Guru (Masuk/Keluar)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-800 fill-amber-700" />
              <span className="hidden sm:inline">Terminal &amp; Kios Guru</span>
            </button>

            {/* QR Scanner */}
            <button
              type="button"
              onClick={() => setIsQrScannerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition shadow-2xs"
              title="Pindai QR Aset Langsung"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Pindai QR</span>
            </button>

            {/* Scan Receipt with AI */}
            <button
              type="button"
              onClick={() => setIsScanReceiptOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">Scan Nota AI</span>
            </button>

            {/* AI Advisor */}
            <button
              type="button"
              onClick={() => setIsAiAdvisorOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Asisten AI</span>
            </button>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {currentItem?.requiredRoles && !hasPermission(currentItem.requiredRoles) ? (
            <AccessDeniedView
              pageTitle={currentItem.label}
              requiredRoles={currentItem.requiredRoles}
              onOpenAuth={() => {
                setAuthRequiredRole(currentItem.requiredRoles?.[0]);
                setIsAuthModalOpen(true);
              }}
            />
          ) : (
            <>
              {currentPage === 'dashboard' && (
                <DashboardPage
                  onNavigate={setCurrentPage}
                  onOpenScanReceipt={() => setIsScanReceiptOpen(true)}
                  onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
                />
              )}
              {currentPage === 'pegawai' && <DaftarPegawaiPage />}
              {currentPage === 'master' && <MasterBarangPage />}
              {currentPage === 'supplier' && <SuppliersPage />}
              {currentPage === 'barang_masuk' && (
                <BarangMasukPage
                  onOpenScanReceipt={() => setIsScanReceiptOpen(true)}
                  prefilledFromScan={prefilledScanData}
                  onNavigate={setCurrentPage}
                />
              )}
              {currentPage === 'barang_keluar' && <BarangKeluarPage onNavigate={setCurrentPage} />}
              {currentPage === 'persediaan' && <PersediaanPage />}
              {currentPage === 'rkbs' && <RkbsPage />}
              {currentPage === 'aset' && <AsetPage />}
              {currentPage === 'integrasi' && <IntegrasiNasionalPage />}
              {currentPage === 'mutasi' && <MutasiPage />}
              {currentPage === 'stock_opname' && <StockOpnamePage />}
              {currentPage === 'pemeliharaan' && <PemeliharaanPage />}
              {currentPage === 'penghapusan' && <PenghapusanPage />}
              {currentPage === 'pengambilan_atk' && <PengambilanATKPage onNavigate={setCurrentPage} />}
              {currentPage === 'laporan' && <LaporanPage />}
              {currentPage === 'audit' && <AuditPage />}
              {currentPage === 'google_sheets' && <GoogleSheetsPage />}
              {currentPage === 'gmail' && <GmailPage />}
              {currentPage === 'google_docs' && <GoogleDocsPage />}
              {currentPage === 'config' && <ConfigPage />}
            </>
          )}
        </main>
      </div>

      {/* Global AI & Interactive Modals */}
      <UserAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthRequiredRole(undefined);
        }}
        requiredRole={authRequiredRole}
      />

      <ScanReceiptModal
        isOpen={isScanReceiptOpen}
        onClose={() => setIsScanReceiptOpen(false)}
        onApply={handleApplyScanData}
      />

      <AiAdvisorModal
        isOpen={isAiAdvisorOpen}
        onClose={() => setIsAiAdvisorOpen(false)}
      />

      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onMutasiAsset={() => setCurrentPage('mutasi')}
        onServiceAsset={() => setCurrentPage('pemeliharaan')}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(page) => setCurrentPage(page)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <InventoryProvider>
        <AppContent />
      </InventoryProvider>
    </ToastProvider>
  );
}
