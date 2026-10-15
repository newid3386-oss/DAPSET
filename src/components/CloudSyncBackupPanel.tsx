import React, { useState, useEffect, useCallback } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Database,
  AlertCircle,
  HardDrive,
  Trash2,
  History,
  FileText,
  PlusCircle,
  Server,
  Radio,
  Gauge,
  Laptop,
  Smartphone,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import {
  fetchCloudBackups,
  createCloudBackup,
  deleteCloudBackup,
  getSafeSchoolId,
  testConnection,
  CloudBackupItem,
} from '../services/firebase';
import { formatTanggalIndo } from '../utils/format';

export const CloudSyncBackupPanel: React.FC = () => {
  const {
    config,
    activeUser,
    exportDatabaseToJson,
    importDatabaseFromJson,
    syncToCloud,
    syncFromCloud,
    isCloudSyncing,
    cloudSyncStatus,
    lastCloudSync,
    dashboardStats,
    payloadCapacity,
    deviceId,
    lastRemoteSyncInfo,
    syncAllModulesToCloud,
  } = useInventory();
  const { showToast, confirmDialog } = useToast();

  const [backups, setBackups] = useState<CloudBackupItem[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [backupNote, setBackupNote] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [isSyncingModular, setIsSyncingModular] = useState(false);

  const schoolId = getSafeSchoolId(config.schoolName);

  // Load backups list from Firestore
  const loadBackups = useCallback(async () => {
    setIsLoadingBackups(true);
    try {
      const list = await fetchCloudBackups(schoolId);
      setBackups(list);
    } catch (err: any) {
      console.warn('Could not fetch backups from Firestore:', err);
    } finally {
      setIsLoadingBackups(false);
    }
  }, [schoolId]);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  // Test live connection
  const handleTestPing = async () => {
    setIsTestingPing(true);
    try {
      const ok = await testConnection();
      if (ok) {
        showToast('Koneksi Firestore Database Enterprise aktif & responsif!', 'success');
      } else {
        showToast('Database Firestore sedang offline atau tidak terjangkau.', 'warning');
      }
    } catch {
      showToast('Gagal memeriksa status koneksi Firestore.', 'error');
    } finally {
      setIsTestingPing(false);
    }
  };

  // Push live snapshot
  const handleLivePush = async () => {
    const success = await syncToCloud();
    if (success) {
      showToast('Database inventaris berhasil disinkronkan ke Cloud Firestore!', 'success');
      loadBackups();
    } else {
      showToast('Gagal menyinkronkan database ke Cloud. Periksa koneksi internet.', 'error');
    }
  };

  // Pull live snapshot
  const handleLivePull = async () => {
    const confirmed = await confirmDialog({
      title: 'Tarik Data dari Cloud?',
      message: 'Seluruh data lokal saat ini akan diperbarui dengan data snapshot terbaru yang tersimpan di Cloud Firestore.',
      confirmText: 'Ya, Tarik Data',
      variant: 'warning',
    });
    if (!confirmed) return;

    const success = await syncFromCloud();
    if (success) {
      showToast('Data berhasil diperbarui dari Cloud Firestore!', 'success');
    } else {
      showToast('Tidak ada snapshot tersimpan di Cloud atau proses sinkronisasi gagal.', 'warning');
    }
  };

  // Granular Modular Sync (Priority 3)
  const handleSyncModular = async () => {
    setIsSyncingModular(true);
    try {
      const ok = await syncAllModulesToCloud();
      if (ok) {
        showToast('Sinkronisasi granular seluruh modul ke Firestore sukses! Data antar-perangkat disinkronkan secara modular.', 'success');
        loadBackups();
      } else {
        showToast('Gagal melakukan sinkronisasi modular ke Cloud.', 'error');
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setIsSyncingModular(false);
    }
  };

  // Create labeled snapshot backup
  const handleCreateLabeledBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingBackup(true);
    try {
      const jsonStr = exportDatabaseToJson();
      const note = backupNote.trim() || `Cadangan Rutin ${formatTanggalIndo(new Date())}`;
      await createCloudBackup(schoolId, config.schoolName, jsonStr, activeUser.nama || activeUser.email, note);
      showToast('Titik cadangan cloud berhasil dibuat!', 'success');
      setBackupNote('');
      setShowCreateModal(false);
      loadBackups();
    } catch (err: any) {
      showToast(`Gagal membuat cadangan: ${err.message || 'Kesalahan sistem'}`, 'error');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Restore specific backup from table
  const handleRestoreBackup = async (item: CloudBackupItem) => {
    const confirmed = await confirmDialog({
      title: 'Pulihkan dari Titik Cadangan Ini?',
      message: `Pulihkan database dari cadangan "${item.notes || item.id}" tanggal ${formatTanggalIndo(item.createdAt)}? Data saat ini akan digantikan.`,
      confirmText: 'Pulihkan Database',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const ok = importDatabaseFromJson(item.dataJson);
      if (ok) {
        showToast('Database berhasil dipulihkan dari titik cadangan cloud!', 'success');
      } else {
        showToast('Data cadangan tidak valid atau rusak.', 'error');
      }
    } catch (err: any) {
      showToast(`Gagal memulihkan cadangan: ${err.message}`, 'error');
    }
  };

  // Delete backup
  const handleDeleteBackup = async (id: string, notes?: string) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Titik Cadangan?',
      message: `Hapus arsip cadangan "${notes || id}" secara permanen dari Cloud Firestore?`,
      confirmText: 'Hapus Permanen',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await deleteCloudBackup(id);
      showToast('Titik cadangan berhasil dihapus dari cloud.', 'info');
      setBackups((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      showToast(`Gagal menghapus: ${err.message}`, 'error');
    }
  };

  // Local JSON upload
  const handleFileUploadRestoration = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const confirmed = await confirmDialog({
          title: 'Pulihkan dari Berkas JSON Lokal?',
          message: `Pulihkan database dari berkas "${file.name}"? Seluruh data aktif akan ditimpa.`,
          confirmText: 'Pulihkan Berkas',
          variant: 'warning',
        });
        if (confirmed) {
          const success = importDatabaseFromJson(content);
          if (success) {
            showToast('Database berhasil dipulihkan dari berkas JSON!', 'success');
          } else {
            showToast('Format berkas cadangan JSON tidak valid.', 'error');
          }
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2 border border-emerald-200">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> Google Cloud Firestore Active
          </div>
          <h3 className="text-base md:text-lg font-extrabold text-slate-800">
            Sinkronisasi Cloud &amp; Pencadangan Otomatis Sekolah
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Database terintegrasi langsung dengan Firestore Enterprise (Database ID: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">ai-studio-dapset</code>) untuk proteksi aset sekolah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestPing}
            disabled={isTestingPing}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Cek Latensi & Koneksi Firestore"
          >
            {isTestingPing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
            ) : (
              <Server className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>Cek Status Server</span>
          </button>

          <span
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
              cloudSyncStatus === 'CONNECTED'
                ? 'bg-emerald-100 text-emerald-800'
                : cloudSyncStatus === 'SYNCING'
                ? 'bg-sky-100 text-sky-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                cloudSyncStatus === 'CONNECTED'
                  ? 'bg-emerald-600 animate-pulse'
                  : cloudSyncStatus === 'SYNCING'
                  ? 'bg-sky-600 animate-spin'
                  : 'bg-rose-600'
              }`}
            />
            {cloudSyncStatus === 'CONNECTED'
              ? 'Terhubung ke Cloud'
              : cloudSyncStatus === 'SYNCING'
              ? 'Sedang Sinkronisasi...'
              : 'Offline / Terputus'}
          </span>
        </div>
      </div>

      {/* Cloud Status Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Infrastruktur Database</span>
          <div className="text-sm font-extrabold text-slate-800 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Cloud Firestore Enterprise
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Terenkripsi AES-256 saat istirahat &amp; transit</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Sinkronisasi Terakhir</span>
          <div className="text-sm font-extrabold text-slate-800 mt-1 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" />
            {lastCloudSync ? formatTanggalIndo(lastCloudSync) : 'Belum pernah disinkronkan'}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Snapshot real-time di Firestore</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Volume Inventaris Aktif</span>
          <div className="text-sm font-extrabold text-emerald-800 mt-1 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-700" />
            {dashboardStats.totalItems} Barang • {dashboardStats.totalAssets} Aset
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Tersedia {backups.length} titik cadangan di awan</span>
        </div>
      </div>

      {/* PRIORITAS 2 & 3: Optimasi Kapasitas & Kolaborasi Multi-Perangkat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Prioritas 2: Storage & Capacity Optimizer */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/70 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                  Prioritas 2: Kuota Dokumen Firestore
                </h4>
                <p className="text-[11px] text-slate-500">Pemantauan &amp; Kompresi Gambar / Paraf</p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                payloadCapacity.isSafe
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}
            >
              {payloadCapacity.isSafe ? 'Kapasitas Aman (< 850 KB)' : 'Mendekati Batas 1 MB'}
            </span>
          </div>

          {/* Capacity Progress Bar */}
          <div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
              <span>Ukuran Snapshot Aktif: <strong className="text-slate-900">{payloadCapacity.formattedSize}</strong></span>
              <span>Batas Dokumen: <strong>1,024 KB (1 MB)</strong></span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  payloadCapacity.percentage < 50
                    ? 'bg-emerald-500'
                    : payloadCapacity.percentage < 80
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.max(2, Math.min(100, payloadCapacity.percentage))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
              <span>Penggunaan: {payloadCapacity.percentage}%</span>
              <span>Ambang Aman Firestore: 850 KB</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Kompresi Foto Otomatis: <strong className="text-slate-800">800px / 72%</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Paraf TTD Canvas: <strong className="text-slate-800">Pangkas Transparan</strong></span>
            </div>
          </div>
        </div>

        {/* Prioritas 3: Multi-Device Real-Time Collaboration */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-blue-50/50 border border-indigo-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-800">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide">
                  Prioritas 3: Kolaborasi Multi-Perangkat
                </h4>
                <p className="text-[11px] text-slate-500">Sinkronisasi Real-Time Staf &amp; Guru</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
              <Radio className="w-3 h-3 text-indigo-600 animate-pulse" />
              Listener Aktif
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/80 border border-indigo-100 text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">ID Perangkat Ini:</span>
              <code className="text-xs font-mono font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded">
                {deviceId}
              </code>
            </div>
            <div className="pt-1 border-t border-indigo-50">
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Pembaruan Remote Terakhir:</span>
              {lastRemoteSyncInfo ? (
                <p className="text-slate-800 font-medium mt-0.5">
                  <strong className="text-indigo-800">{lastRemoteSyncInfo.user}</strong> ({lastRemoteSyncInfo.action})
                  <span className="text-slate-400 block text-[10px]">{formatTanggalIndo(lastRemoteSyncInfo.time)}</span>
                </p>
              ) : (
                <p className="text-slate-400 italic text-[10px] mt-0.5">
                  Belum ada aktivitas remote dari rekan lain. Sistem siap menyinkronkan data antar komputer sekolah secara paralel.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[10px] text-slate-500">
              Pisah koleksi per modul mencegah data saling tumpuk saat input bersamaan.
            </span>
            <button
              type="button"
              onClick={handleSyncModular}
              disabled={isSyncingModular || isCloudSyncing}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shrink-0 flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
              title="Sinkronkan seluruh modul ke dokumen Firestore terpisah"
            >
              {isSyncingModular ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Layers className="w-3.5 h-3.5" />
              )}
              <span>Sync Modular</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Sync & Backup Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 text-white">
        <div className="space-y-0.5">
          <div className="text-sm font-bold flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-400" /> Operasi Cepat Sinkronisasi Awan
          </div>
          <p className="text-xs text-slate-400">
            Kirim data terbaru atau buat titik restorasi aman sebelum merekap laporan akhir tahun/semester.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleLivePush}
            disabled={isCloudSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isCloudSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CloudUpload className="w-4 h-4" />
            )}
            <span>Sinkronkan ke Cloud Sekarang</span>
          </button>

          <button
            type="button"
            onClick={handleLivePull}
            disabled={isCloudSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition disabled:opacity-50 cursor-pointer"
          >
            <CloudDownload className="w-4 h-4 text-sky-400" />
            <span>Tarik Snapshot Cloud</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat Titik Cadangan Berlabel</span>
          </button>
        </div>
      </div>

      {/* Cloud Backup History Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-4 h-4 text-slate-500" /> Riwayat Titik Cadangan Cloud (Firestore)
          </h4>
          <button
            type="button"
            onClick={loadBackups}
            disabled={isLoadingBackups}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBackups ? 'animate-spin' : ''}`} />
            Muat Ulang
          </button>
        </div>

        {backups.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-600 font-medium">Belum ada titik cadangan khusus yang disimpan di Firestore.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Klik &quot;Buat Titik Cadangan Berlabel&quot; untuk mengarsipkan kondisi inventaris sekolah sewaktu-waktu.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Waktu Pencadangan</th>
                  <th className="px-4 py-3">Catatan / Label</th>
                  <th className="px-4 py-3">Dibuat Oleh</th>
                  <th className="px-4 py-3">Ukuran Data</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {backups.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      {formatTanggalIndo(b.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="font-bold block text-slate-900">{b.notes || 'Cadangan Sistem'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {b.id}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{b.createdBy}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono">
                      {(new Blob([b.dataJson]).size / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => handleRestoreBackup(b)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-200 transition cursor-pointer"
                        title="Pulihkan database dari cadangan ini"
                      >
                        Pulihkan
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBackup(b.id, b.notes)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Hapus cadangan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Local JSON Restoration fallback */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
          Butuh pemulihan manual dari berkas lokal komputer (.json)?
        </span>
        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition">
          <HardDrive className="w-4 h-4 text-slate-500" />
          <span>Pilih Berkas JSON Lokal</span>
          <input type="file" accept=".json" onChange={handleFileUploadRestoration} className="hidden" />
        </label>
      </div>

      {/* Labeled Backup Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Buat Titik Cadangan Cloud</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simpan salinan utuh kondisi inventaris saat ini ke Firestore database sekolah.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLabeledBackup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Label / Keterangan Cadangan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tutup Buku Semester Genap 2026, Pra-Audit BPK"
                  value={backupNote}
                  onChange={(e) => setBackupNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-700 block">Rincian Data yang Disimpan:</span>
                <span className="text-slate-500 block">
                  • {dashboardStats.totalItems} Data Master Barang &amp; Kartu Persediaan
                </span>
                <span className="text-slate-500 block">
                  • {dashboardStats.totalAssets} Rekod Aset Inventaris (KIR &amp; Permendagri 108)
                </span>
                <span className="text-slate-500 block">
                  • Seluruh Buku Barang Masuk, Keluar, Mutasi, dan Log Audit
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBackup}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
                >
                  {isCreatingBackup ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CloudUpload className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan ke Cloud</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
