import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Printer,
  Download,
  Building2,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { AssetRecord, PemeliharaanRecord } from '../types';
import { formatTanggalIndo, formatRupiah, exportToCsv } from '../utils/format';

interface MaintenanceCalendarReminderPanelProps {
  onNavigateToPemeliharaan?: () => void;
}

export const MaintenanceCalendarReminderPanel: React.FC<MaintenanceCalendarReminderPanelProps> = ({
  onNavigateToPemeliharaan,
}) => {
  const { assets, pemeliharaan, addPemeliharaan, updateAsset, activeUser } = useInventory();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssetForService, setSelectedAssetForService] = useState<AssetRecord | null>(null);
  const [serviceNotes, setServiceNotes] = useState('');
  const [serviceCost, setServiceCost] = useState(0);
  const [serviceTechnician, setServiceTechnician] = useState('Teknisi Rekanan Sekolah');
  const [nextIntervalMonths, setNextIntervalMonths] = useState(3);
  const [calendarViewMonth, setCalendarViewMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Compute maintenance schedules for assets
  // Assets that require periodic maintenance (e.g., AC, Projector, Water Pump, Generator, Lab Equipment, CCTV)
  const maintenanceAssets = useMemo(() => {
    return assets.filter((a) => {
      const lowerName = a.namaBarang.toLowerCase() + ' ' + a.merk.toLowerCase() + ' ' + a.spesifikasi.toLowerCase();
      const isPeriodicCandidate =
        lowerName.includes('ac') ||
        lowerName.includes('air conditioner') ||
        lowerName.includes('proyektor') ||
        lowerName.includes('projector') ||
        lowerName.includes('pompa') ||
        lowerName.includes('genset') ||
        lowerName.includes('cctv') ||
        lowerName.includes('timbangan') ||
        lowerName.includes('laboratorium') ||
        lowerName.includes('mesin') ||
        lowerName.includes('printer') ||
        a.intervalKalibrasiBulan !== undefined ||
        a.kalibrasiBerikutnya !== undefined;
      return isPeriodicCandidate && a.status === 'AKTIF';
    });
  }, [assets]);

  // Map assets with their latest maintenance records and due dates
  const assetMaintenanceScheduleList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return maintenanceAssets.map((asset) => {
      // Find latest completed maintenance for this asset
      const assetPemeliharaanList = pemeliharaan
        .filter((p) => p.kodeAset === asset.kodeAset)
        .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

      const lastService = assetPemeliharaanList[0];
      const lastServiceDateStr = lastService ? lastService.tanggal : (asset.kalibrasiTerakhir || asset.tanggalBku || '2026-01-01');
      
      const intervalMonths = asset.intervalKalibrasiBulan || 3; // Default 3 months routine check

      // Calculate next due date
      const lastDate = new Date(lastServiceDateStr);
      const nextDueDate = new Date(lastDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + intervalMonths);
      const nextDueDateStr = nextDueDate.toISOString().slice(0, 10);

      const nextDueTime = nextDueDate.getTime();
      const todayTime = today.getTime();
      const diffDays = Math.ceil((nextDueTime - todayTime) / (1000 * 60 * 60 * 24));

      let status: 'TERLAMBAT' | 'SEGERA' | 'AMAN' = 'AMAN';
      if (diffDays < 0) {
        status = 'TERLAMBAT';
      } else if (diffDays <= 7) {
        status = 'SEGERA';
      } else {
        status = 'AMAN';
      }

      return {
        asset,
        lastService,
        lastServiceDateStr,
        intervalMonths,
        nextDueDateStr,
        diffDays,
        status,
      };
    }).sort((a, b) => a.diffDays - b.diffDays);
  }, [maintenanceAssets, pemeliharaan]);

  const overdueCount = assetMaintenanceScheduleList.filter((x) => x.status === 'TERLAMBAT').length;
  const dueSoonCount = assetMaintenanceScheduleList.filter((x) => x.status === 'SEGERA').length;

  const handleOpenRecordModal = (item: (typeof assetMaintenanceScheduleList)[0]) => {
    setSelectedAssetForService(item.asset);
    setServiceNotes(`Servis rutin berkala untuk ${item.asset.namaBarang} (${item.asset.kodeAset})`);
    setServiceCost(150000);
    setNextIntervalMonths(item.intervalMonths);
    setIsModalOpen(true);
  };

  const handleSaveServiceRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForService) return;

    const todayStr = new Date().toISOString().slice(0, 10);

    // 1. Add Pemeliharaan Record
    addPemeliharaan({
      tanggal: todayStr,
      kodeAset: selectedAssetForService.kodeAset,
      namaBarang: selectedAssetForService.namaBarang,
      jenisPemeliharaan: serviceNotes,
      biaya: serviceCost,
      penyedia: serviceTechnician,
      status: 'SELESAI',
      petugas: activeUser.nama,
      keterangan: 'Pemeliharaan rutin terjadwal via Dashboard Reminder',
    });

    // 2. Update Asset next calibration / maintenance info
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + nextIntervalMonths);
    
    updateAsset(selectedAssetForService.id, {
      kalibrasiTerakhir: todayStr,
      kalibrasiBerikutnya: nextDate.toISOString().slice(0, 10),
      intervalKalibrasiBulan: nextIntervalMonths,
    });

    showToast(`Pemeliharaan rutin aset "${selectedAssetForService.namaBarang}" berhasil dicatat dan kalender diperbarui!`, 'success');
    setIsModalOpen(false);
    setSelectedAssetForService(null);
  };

  const handleExportIcs = () => {
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//SIMBARAS//School Asset Maintenance Calendar//ID\n';
    assetMaintenanceScheduleList.forEach((item, idx) => {
      const dtStart = item.nextDueDateStr.replace(/-/g, '');
      icsContent += 'BEGIN:VEVENT\n';
      icsContent += `UID:maintenance-${item.asset.kodeAset}-${idx}@simbaras.sch.id\n`;
      icsContent += `DTSTAMP:${dtStart}T000000Z\n`;
      icsContent += `DTSTART;VALUE=DATE:${dtStart}\n`;
      icsContent += `SUMMARY:Servis Pemeliharaan: ${item.asset.namaBarang} (${item.asset.kodeAset})\n`;
      icsContent += `DESCRIPTION:Lokasi: ${item.asset.lokasi}. Interval: ${item.intervalMonths} bulan. Status: ${item.status}.\n`;
      icsContent += 'END:VEVENT\n';
    });
    icsContent += 'END:VCALENDAR\n';

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Jadwal_Pemeliharaan_Aset_${new Date().toISOString().slice(0, 10)}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File kalender (.ics) berhasil diunduh untuk sinkronisasi Google Calendar / Outlook!', 'success');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                Pengingat Jadwal Pemeliharaan Rutin Aset &amp; Kalender Servis
              </h3>
              {(overdueCount > 0 || dueSoonCount > 0) && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 animate-pulse">
                  {overdueCount + dueSoonCount} Perlu Perhatian
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Sistem otomatis memantau jadwal pemeliharaan berkala AC, Proyektor, Pompa, Lab, &amp; Inventaris Sekolah.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportIcs}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-xs"
            title="Ekspor ke format iCal (.ics) untuk Google Calendar"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" /> Ekspor Kalender (.ics)
          </button>
          {onNavigateToPemeliharaan && (
            <button
              onClick={onNavigateToPemeliharaan}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
            >
              <span>Buka Menu Pemeliharaan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Summary Alert Banner if items are overdue */}
      {overdueCount > 0 && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Perhatian:</strong> Terdapat <strong>{overdueCount} aset</strong> yang jadwal pemeliharaan rutinnya telah melewati batas waktu (*overdue*). Segera lakukan servis atau penjadwalan ulang.
            </span>
          </div>
        </div>
      )}

      {/* Asset Maintenance List / Table Preview */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
            <tr>
              <th className="px-3.5 py-2.5">Kode &amp; Nama Aset</th>
              <th className="px-3.5 py-2.5">Lokasi / Ruangan</th>
              <th className="px-3.5 py-2.5">Servis Terakhir</th>
              <th className="px-3.5 py-2.5">Interval Servis</th>
              <th className="px-3.5 py-2.5">Jadwal Servis Berikutnya</th>
              <th className="px-3.5 py-2.5 text-center">Status</th>
              <th className="px-3.5 py-2.5 text-right">Aksi Cepat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assetMaintenanceScheduleList.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Belum ada aset sekolah yang terdeteksi memerlukan pemeliharaan berkala rutin.
                </td>
              </tr>
            ) : (
              assetMaintenanceScheduleList.slice(0, 5).map((item) => (
                <tr key={item.asset.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-3.5 py-3">
                    <div className="font-bold text-slate-900">{item.asset.namaBarang}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] text-emerald-900 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                        {item.asset.kodeAset}
                      </span>
                      {item.asset.merk && <span className="text-slate-500">• {item.asset.merk}</span>}
                    </div>
                  </td>
                  <td className="px-3.5 py-3 text-slate-700 font-medium">{item.asset.lokasi}</td>
                  <td className="px-3.5 py-3 text-slate-600 whitespace-nowrap">
                    {formatTanggalIndo(item.lastServiceDateStr)}
                  </td>
                  <td className="px-3.5 py-3 text-slate-700 font-semibold">
                    Setiap {item.intervalMonths} Bulan
                  </td>
                  <td className="px-3.5 py-3 whitespace-nowrap font-bold text-slate-800">
                    {formatTanggalIndo(item.nextDueDateStr)}
                  </td>
                  <td className="px-3.5 py-3 text-center whitespace-nowrap">
                    {item.status === 'TERLAMBAT' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertCircle className="w-3 h-3" /> Terlambat ({Math.abs(item.diffDays)} hr)
                      </span>
                    )}
                    {item.status === 'SEGERA' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3" /> Segera ({item.diffDays} hr lg)
                      </span>
                    )}
                    {item.status === 'AMAN' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Terjadwal Aman
                      </span>
                    )}
                  </td>
                  <td className="px-3.5 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleOpenRecordModal(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition"
                    >
                      <Wrench className="w-3 h-3" /> Catat Servis
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {assetMaintenanceScheduleList.length > 5 && (
        <div className="text-center pt-2">
          <button
            onClick={onNavigateToPemeliharaan}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-700 inline-flex items-center gap-1 transition"
          >
            <span>Lihat Seluruh Jadwal Aset ({assetMaintenanceScheduleList.length} Aset)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Record Service Modal */}
      {isModalOpen && selectedAssetForService && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 text-xs animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-800" /> Catat Pemeliharaan Rutin Aset
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveServiceRecord} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 text-sm">{selectedAssetForService.namaBarang}</div>
                <div className="text-slate-500 font-mono text-[11px]">Kode Aset: {selectedAssetForService.kodeAset}</div>
                <div className="text-slate-500">Lokasi: {selectedAssetForService.lokasi} | Merk: {selectedAssetForService.merk || '-'}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Pekerjaan / Servis Rutin</label>
                <input
                  type="text"
                  required
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Misal: Pembersihan filter AC, ganti freon, servis proyektor"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Biaya Servis (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={serviceCost}
                    onChange={(e) => setServiceCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Interval Servis Berikutnya</label>
                  <select
                    value={nextIntervalMonths}
                    onChange={(e) => setNextIntervalMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value={1}>1 Bulan Sekali</option>
                    <option value={3}>3 Bulan Sekali (Triwulan)</option>
                    <option value={6}>6 Bulan Sekali (Semester)</option>
                    <option value={12}>12 Bulan Sekali (Tahunan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Teknisi / Toko Rekanan</label>
                <input
                  type="text"
                  required
                  value={serviceTechnician}
                  onChange={(e) => setServiceTechnician(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold shadow-xs transition inline-flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Simpan &amp; Perbarui Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
