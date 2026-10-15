import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  Store,
  ArrowDownToLine,
  ArrowUpFromLine,
  Package,
  Building2,
  ArrowLeftRight,
  ClipboardCheck,
  Wrench,
  Trash2,
  FileSignature,
  FileText,
  History,
  Settings,
  Sparkles,
  School,
  CalendarDays,
  QrCode,
  Camera,
  Landmark,
  Zap,
  FileSpreadsheet,
  Mail,
  Lock,
  UserCheck,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { UserEmployee } from '../types';

export type PageId =
  | 'dashboard'
  | 'master'
  | 'supplier'
  | 'barang_masuk'
  | 'barang_keluar'
  | 'terminal_logistik'
  | 'persediaan'
  | 'rkbs'
  | 'aset'
  | 'integrasi'
  | 'mutasi'
  | 'stock_opname'
  | 'pemeliharaan'
  | 'penghapusan'
  | 'pengambilan_atk'
  | 'kiosk'
  | 'laporan'
  | 'audit'
  | 'google_sheets'
  | 'gmail'
  | 'google_docs'
  | 'config';

interface NavigationProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  onOpenAiAdvisor: () => void;
  onOpenQrScanner: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  onOpenAuthModal?: () => void;
}

export interface NavItemDef {
  id: PageId;
  label: string;
  icon: React.FC<{ className?: string }>;
  badgeCount?: (ctx: any) => number | null;
  requiredRoles?: UserEmployee['role'][];
}

export const navItems: NavItemDef[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'master', label: 'Master Barang', icon: Boxes },
  { id: 'supplier', label: 'Penyedia / Toko', icon: Store },
  { id: 'barang_masuk', label: 'Barang Masuk', icon: ArrowDownToLine },
  { id: 'barang_keluar', label: 'Barang Keluar', icon: ArrowUpFromLine },
  { id: 'terminal_logistik', label: 'Terminal & Kios Guru', icon: Zap },
  {
    id: 'persediaan',
    label: 'Persediaan Stok',
    icon: Package,
    badgeCount: (ctx) => (ctx.dashboardStats.itemsMinimum + ctx.dashboardStats.itemsHabis > 0 ? ctx.dashboardStats.itemsMinimum + ctx.dashboardStats.itemsHabis : null),
  },
  { id: 'rkbs', label: 'Rencana RKBS/RKAS', icon: CalendarDays },
  { id: 'aset', label: 'Aset / Inventaris', icon: Building2 },
  { id: 'integrasi', label: 'Rekonsiliasi Nasional', icon: Landmark },
  { id: 'mutasi', label: 'Mutasi Aset', icon: ArrowLeftRight, requiredRoles: ['ADMIN', 'PENGURUS_BARANG'] },
  { id: 'stock_opname', label: 'Stock Opname', icon: ClipboardCheck, requiredRoles: ['ADMIN', 'PENGURUS_BARANG', 'BENDAHARA'] },
  { id: 'pemeliharaan', label: 'Pemeliharaan', icon: Wrench },
  { id: 'penghapusan', label: 'Penghapusan', icon: Trash2, requiredRoles: ['ADMIN', 'BENDAHARA'] },
  { id: 'pengambilan_atk', label: 'Pengambilan ATK', icon: FileSignature },
  { id: 'kiosk', label: 'Mode Kiosk Guru', icon: Store },
  { id: 'laporan', label: 'Cetak Laporan', icon: FileText },
  { id: 'audit', label: 'Audit Trail', icon: History, requiredRoles: ['ADMIN', 'BENDAHARA'] },
  { id: 'google_sheets', label: 'Google Sheets', icon: FileSpreadsheet },
  { id: 'gmail', label: 'Gmail', icon: Mail },
  { id: 'google_docs', label: 'Google Docs', icon: FileText },
  { id: 'config', label: 'Pengaturan', icon: Settings, requiredRoles: ['ADMIN'] },
];

export const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  onSelectPage,
  onOpenAiAdvisor,
  onOpenQrScanner,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onOpenAuthModal,
}) => {
  const context = useInventory();

  const handleNavClick = (page: PageId) => {
    onSelectPage(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-xs"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 bottom-0 left-0 z-40 w-64 bg-emerald-950 text-white flex flex-col h-screen transition-transform duration-200 ease-in-out border-r border-emerald-900/60 shadow-xl md:shadow-none ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-emerald-900/80 bg-emerald-950/80 backdrop-blur-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md">
              <School className="w-5 h-5 text-emerald-950 font-bold" />
            </div>
            <div className="leading-tight">
              <div className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                Bendahara Barang
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-1.5 py-0.2 rounded font-mono font-bold">
                  PRO
                </span>
              </div>
              <div className="text-[11px] text-emerald-300 font-medium truncate max-w-[150px]" title={context.config.schoolName}>
                {context.config.schoolName}
              </div>
            </div>
          </div>
        </div>

        {/* AI & Scanner Quick Banners */}
        <div className="px-3 pt-3 space-y-1.5">
          <button
            type="button"
            onClick={onOpenAiAdvisor}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-emerald-800/80 to-teal-800/80 border border-emerald-600/40 text-emerald-100 hover:from-emerald-700 hover:to-teal-700 transition shadow-xs group"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
              <span className="text-xs font-bold text-white">Asisten AI Inventaris</span>
            </div>
            <span className="text-[9px] bg-emerald-900/70 text-emerald-200 px-1.5 py-0.5 rounded-md font-semibold">
              Buka
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenQrScanner();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-emerald-900/60 border border-emerald-700/40 text-emerald-100 hover:bg-emerald-800/60 transition shadow-xs group"
          >
            <div className="flex items-center gap-2">
              <QrCode className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-xs font-bold text-white">Pindai QR Aset</span>
            </div>
            <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded-md font-semibold">
              Scan
            </span>
          </button>
        </div>

        {/* Navigation Menu List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-thin scrollbar-thumb-emerald-800 scrollbar-track-transparent">
          <div className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider px-2 py-1 mb-1">
            Menu Utama
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const badge = item.badgeCount ? item.badgeCount(context) : null;
            const isRestricted = item.requiredRoles && !context.hasPermission(item.requiredRoles);

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition group ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/40'
                    : isRestricted
                    ? 'text-emerald-300/60 hover:bg-emerald-900/40 hover:text-emerald-200'
                    : 'text-emerald-100/85 hover:bg-emerald-900/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive
                        ? 'text-white'
                        : isRestricted
                        ? 'text-emerald-500/60'
                        : 'text-emerald-300 group-hover:text-white'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isRestricted && (
                    <span title="Modul Terkunci (Perlu Otorisasi Admin)">
                      <Lock className="w-3 h-3 text-amber-400/80" />
                    </span>
                  )}
                  {badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-400 text-amber-950">
                      {badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Account & Role Profile Footer */}
        <div className="p-3 border-t border-emerald-900/80 bg-emerald-950/90">
          <div className="flex items-center justify-between p-2 rounded-2xl bg-emerald-900/50 border border-emerald-800/60">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-emerald-800 text-emerald-200 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-700">
                {context.activeUser.nama.slice(0, 1)}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate" title={context.activeUser.nama}>
                  {context.activeUser.nama}
                </div>
                <div className="text-[10px] text-emerald-300 flex items-center gap-1 font-mono">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{context.activeUser.role}</span>
                </div>
              </div>
            </div>
            {onOpenAuthModal && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-2 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-[10px] font-bold text-emerald-100 transition shrink-0 cursor-pointer"
                title="Ganti Profil atau Verifikasi Otorisasi"
              >
                Ubah
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
