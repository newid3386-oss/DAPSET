import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  XCircle,
  Wrench,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { PageId } from './Navigation';

interface NotificationCenterProps {
  onNavigate: (page: PageId) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const { stockSummary, assets, pemeliharaan, laporanKerusakan } = useInventory();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Critical stock alerts
  const itemsMinimum = stockSummary.filter((s) => s.status === 'MINIMUM');
  const itemsHabis = stockSummary.filter((s) => s.status === 'HABIS');

  // Asset repair alerts
  const assetsDamaged = assets.filter(
    (a) => a.kondisi === 'RUSAK_RINGAN' || a.kondisi === 'RUSAK_BERAT'
  );

  // Pending maintenance tasks
  const pendingMaintenance = pemeliharaan.filter(
    (p) => p.status === 'DIAJUKAN' || p.status === 'PROSES'
  );

  // Pending damage reports
  const pendingReports = (laporanKerusakan || []).filter(
    (l) => l.status === 'MENUNGGU_VERIFIKASI'
  );

  const totalAlerts =
    itemsMinimum.length +
    itemsHabis.length +
    assetsDamaged.length +
    pendingMaintenance.length +
    pendingReports.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (page: PageId) => {
    onNavigate(page);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs"
        title="Pusat Notifikasi &amp; Peringatan Stok"
        aria-label="Pusat Notifikasi"
      >
        <Bell className="w-4 h-4 text-slate-600" />
        {totalAlerts > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white shadow-xs animate-pulse">
            {totalAlerts > 99 ? '99+' : totalAlerts}
          </span>
        )}
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="bg-slate-900 px-4 py-3 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              <h4 className="font-extrabold text-xs">Pusat Notifikasi &amp; Alarm Stok</h4>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {totalAlerts} Peringatan
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-1">
            {totalAlerts === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Semua Kondisi Aman &amp; Terkendali</p>
                <p className="text-[11px]">Tidak ada stok kritis atau sarana rusak saat ini.</p>
              </div>
            ) : (
              <>
                {/* Out of Stock Items */}
                {itemsHabis.length > 0 && (
                  <div className="p-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700 px-2 pt-1">
                      <XCircle className="w-3.5 h-3.5" /> Stok Barang Habis ({itemsHabis.length})
                    </div>
                    {itemsHabis.map((item) => (
                      <div
                        key={item.kodeBarang}
                        onClick={() => handleItemClick('persediaan')}
                        className="px-2 py-1.5 rounded-xl hover:bg-rose-50/60 cursor-pointer flex items-center justify-between transition text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{item.namaBarang}</div>
                          <div className="text-[10px] text-slate-400">
                            Kode: {item.kodeBarang} • Satuan: {item.jenisSatuan}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                          0 Stok
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Minimum Stock Items */}
                {itemsMinimum.length > 0 && (
                  <div className="p-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 px-2 pt-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Stok Menipis di Bawah Batas ({itemsMinimum.length})
                    </div>
                    {itemsMinimum.map((item) => (
                      <div
                        key={item.kodeBarang}
                        onClick={() => handleItemClick('persediaan')}
                        className="px-2 py-1.5 rounded-xl hover:bg-amber-50/60 cursor-pointer flex items-center justify-between transition text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{item.namaBarang}</div>
                          <div className="text-[10px] text-slate-400">
                            Tersisa: {item.stok} {item.jenisSatuan} (Batas Min: {item.batasMinimum})
                          </div>
                        </div>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          Kritis
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Damaged Assets */}
                {assetsDamaged.length > 0 && (
                  <div className="p-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-orange-700 px-2 pt-1">
                      <Wrench className="w-3.5 h-3.5" /> Aset Butuh Servis / Rusak ({assetsDamaged.length})
                    </div>
                    {assetsDamaged.map((ast) => (
                      <div
                        key={ast.kodeAset}
                        onClick={() => handleItemClick('pemeliharaan')}
                        className="px-2 py-1.5 rounded-xl hover:bg-orange-50/60 cursor-pointer flex items-center justify-between transition text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{ast.namaBarang}</div>
                          <div className="text-[10px] text-slate-400">
                            {ast.lokasi} • {ast.penanggungJawab}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ast.kondisi === 'RUSAK_BERAT'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ast.kondisi === 'RUSAK_BERAT' ? 'Rusak Berat' : 'Rusak Ringan'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pending Reports */}
                {pendingReports.length > 0 && (
                  <div className="p-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-700 px-2 pt-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Pengaduan Guru Menunggu Verifikasi ({pendingReports.length})
                    </div>
                    {pendingReports.map((lpr) => (
                      <div
                        key={lpr.id}
                        onClick={() => handleItemClick('pemeliharaan')}
                        className="px-2 py-1.5 rounded-xl hover:bg-teal-50/60 cursor-pointer flex items-center justify-between transition text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{lpr.namaBarang}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            Oleh: {lpr.pelapor} - {lpr.deskripsiKerusakan}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                          Verifikasi
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer View All */}
          <div className="bg-slate-50 p-2 text-center border-t border-slate-200">
            <button
              onClick={() => handleItemClick('dashboard')}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              Lihat Seluruh Metrik di Dashboard <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
