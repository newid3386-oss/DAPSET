import React, { useState } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Download,
  Upload,
  School,
  ShieldAlert,
  Check,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { CloudSyncBackupPanel } from '../components/CloudSyncBackupPanel';
import { GoogleSheetsSyncPanel } from '../components/GoogleSheetsSyncPanel';

export const ConfigPage: React.FC = () => {
  const {
    config,
    updateConfig,
    resetToDefaultData,
    exportDatabaseToJson,
    importDatabaseFromJson,
    verifyAdminPin,
    activeUser,
    hasPermission,
    items,
    assets,
    barangMasuk,
    barangKeluar,
    pengambilanATK,
    suppliers,
    payloadCapacity,
  } = useInventory();
  const { showToast, confirmDialog } = useToast();

  const [formData, setFormData] = useState({ ...config });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResetPinModalOpen, setIsResetPinModalOpen] = useState(false);
  const [resetPinInput, setResetPinInput] = useState('');
  const [resetPinError, setResetPinError] = useState('');

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission(['ADMIN'])) {
      showToast('Akses ditolak: Hanya Administrator yang berwenang mengubah konfigurasi sekolah.', 'error');
      return;
    }
    updateConfig(formData);
    setSaveSuccess(true);
    showToast('Pengaturan sekolah berhasil diperbarui!', 'success');
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportBackup = () => {
    const jsonStr = exportDatabaseToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Backup_SIMBARAS_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    showToast('Berkas cadangan JSON berhasil diunduh.', 'success');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const confirmed = await confirmDialog({
          title: 'Pulihkan Database dari Berkas?',
          message: 'Data saat ini akan ditimpa dengan seluruh isi berkas cadangan JSON.',
          confirmText: 'Pulihkan Sekarang',
          variant: 'warning',
        });
        if (confirmed) {
          const success = importDatabaseFromJson(content);
          if (success) {
            showToast('Database berhasil dipulihkan dari berkas!', 'success');
          } else {
            showToast('Gagal memulihkan berkas cadangan. Format JSON tidak valid.', 'error');
          }
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-800" /> Pengaturan Sistem &amp; Profil Sekolah
        </h2>
        <p className="text-xs text-slate-500">
          Konfigurasi identitas lembaga pendidikan, penandatangan dokumen BKU, serta pengelolaan data cadangan.
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <School className="w-4 h-4 text-emerald-800" /> Identitas Lembaga Pendidikan
          </div>
          {saveSuccess && (
            <span className="text-emerald-700 font-bold flex items-center gap-1 animate-in fade-in">
              <Check className="w-4 h-4" /> Pengaturan Tersimpan!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Nama Resmi Sekolah</label>
            <input
              type="text"
              required
              value={formData.schoolName}
              onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Nomor Pokok Sekolah Nasional (NPSN)</label>
            <input
              type="text"
              required
              value={formData.npsn}
              onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Dinas Pendidikan Pembina (Kop Surat)</label>
            <input
              type="text"
              placeholder="DINAS PENDIDIKAN KABUPATEN..."
              value={formData.dinasPendidikan || ''}
              onChange={(e) => setFormData({ ...formData, dinasPendidikan: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Email Resmi Sekolah</label>
            <input
              type="email"
              placeholder="sdn@sekolah.belajar.id"
              value={formData.emailSekolah || ''}
              onChange={(e) => setFormData({ ...formData, emailSekolah: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Alamat Lengkap Sekolah</label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="pt-2 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-800 mb-3">Pejabat Penandatangan Laporan Resmi (Kop BKU / BAST):</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="font-bold text-slate-800 block text-[11px] uppercase">Kepala Sekolah</label>
              <div>
                <span className="text-[10px] text-slate-500 block">Nama Lengkap &amp; Gelar</span>
                <input
                  type="text"
                  required
                  value={formData.headmaster}
                  onChange={(e) => setFormData({ ...formData, headmaster: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">NIP Kepala Sekolah</span>
                <input
                  type="text"
                  required
                  value={formData.headmasterNip}
                  onChange={(e) => setFormData({ ...formData, headmasterNip: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="font-bold text-slate-800 block text-[11px] uppercase">Bendahara Barang / Sekolah</label>
              <div>
                <span className="text-[10px] text-slate-500 block">Nama Lengkap &amp; Gelar</span>
                <input
                  type="text"
                  required
                  value={formData.treasurer}
                  onChange={(e) => setFormData({ ...formData, treasurer: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">NIP Bendahara</span>
                <input
                  type="text"
                  required
                  value={formData.treasurerNip}
                  onChange={(e) => setFormData({ ...formData, treasurerNip: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl">
            <input
              type="checkbox"
              checked={formData.reduceStockOnATKPickup || false}
              onChange={(e) => setFormData({ ...formData, reduceStockOnATKPickup: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">
                Otomatis Kurangi Stok Persediaan Saat Pengambilan ATK Dicatat
              </span>
              <span className="text-slate-500 text-[11px]">
                Jika dicentang, transaksi pengambilan ATK akan memotong saldo buku persediaan secara langsung. Jika tidak dicentang, pengambilan ATK hanya menjadi dokumen bukti serah terima.
              </span>
            </div>
          </label>
        </div>

        {/* Pengaturan Plafon Pagu Anggaran Tahunan BOS/RKAS */}
        <div className="pt-4 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
            Plafon Pagu Anggaran Tahunan (RKAS) Sekolah:
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Batas pagu belanja operasional &amp; inventaris sekolah yang dipantau real-time pada kartu Dashboard.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="font-semibold text-slate-600 block text-[11px] mb-1">Tahun Anggaran</label>
              <input
                type="text"
                value={formData.tahunAnggaranAktif || '2026'}
                onChange={(e) => setFormData({ ...formData, tahunAnggaranAktif: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-600 block text-[11px] mb-1">Total Pagu Tahunan (Rp)</label>
              <input
                type="number"
                min={0}
                value={formData.paguAnggaranTahunan ?? 180000000}
                onChange={(e) => setFormData({ ...formData, paguAnggaranTahunan: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-600 block text-[11px] mb-1">Pagu BOS Reguler (Rp)</label>
              <input
                type="number"
                min={0}
                value={formData.paguBosReguler ?? 120000000}
                onChange={(e) => setFormData({ ...formData, paguBosReguler: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-600 block text-[11px] mb-1">Pagu BOS Kinerja &amp; BOPD (Rp)</label>
              <input
                type="number"
                min={0}
                value={formData.paguBosKinerja ?? 45000000}
                onChange={(e) => setFormData({ ...formData, paguBosKinerja: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-xs"
              />
            </div>
          </div>
        </div>

        {/* P0 RBAC: PIN Pengamanan Admin */}
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-950 text-xs">
            <KeyRound className="w-4 h-4 text-amber-700" />
            <span>PIN Pengamanan Otorisasi Administrator &amp; Bendahara</span>
          </div>
          <p className="text-[11px] text-amber-800">
            PIN ini melindungi pengalihan peran ke Administrator/Bendahara serta eksekusi operasi destruktif (penghapusan aset, mutasi, reset database). Default: <code className="bg-amber-100 font-mono font-bold px-1 rounded">123456</code>.
          </p>
          <div className="max-w-xs">
            <input
              type="text"
              maxLength={10}
              placeholder="6-digit PIN..."
              value={formData.adminPin || '123456'}
              onChange={(e) => setFormData({ ...formData, adminPin: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-amber-300 font-mono font-bold text-sm tracking-widest bg-white"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
          >
            <Save className="w-4 h-4" /> Simpan Perubahan Profil
          </button>
        </div>
      </form>

      {/* Backup and Restore Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-800" /> Ekspor Database &amp; Mitigasi Kehilangan Data
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200">
            Kapasitas Payload: {payloadCapacity.formattedSize} ({payloadCapacity.percentage}%)
          </span>
        </div>

        <p className="text-slate-500 leading-relaxed">
          Sebagai langkah mitigasi kehilangan data tambahan, Anda dianjurkan untuk rutin mengekspor seluruh basis data inventaris ke format <strong>JSON lokal</strong>. Berkas ini mencakup seluruh master barang, inventaris aset KIB, transaksi pengadaan, mutasi, pengambilan ATK, dan pengaturan sekolah.
        </p>

        {/* Database Stats Preview Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-center p-2 bg-white rounded-lg border border-slate-100 shadow-xs">
            <span className="text-[10px] text-slate-500 block">Master Barang</span>
            <span className="font-black text-slate-800 text-sm">{items.length}</span>
          </div>
          <div className="text-center p-2 bg-white rounded-lg border border-slate-100 shadow-xs">
            <span className="text-[10px] text-slate-500 block">Aset KIB</span>
            <span className="font-black text-slate-800 text-sm">{assets.length}</span>
          </div>
          <div className="text-center p-2 bg-white rounded-lg border border-slate-100 shadow-xs">
            <span className="text-[10px] text-slate-500 block">Barang Masuk</span>
            <span className="font-black text-slate-800 text-sm">{barangMasuk.length}</span>
          </div>
          <div className="text-center p-2 bg-white rounded-lg border border-slate-100 shadow-xs">
            <span className="text-[10px] text-slate-500 block">Pengambilan ATK</span>
            <span className="font-black text-slate-800 text-sm">{pengambilanATK.length}</span>
          </div>
          <div className="text-center p-2 bg-white rounded-lg border border-slate-100 shadow-xs col-span-2 md:col-span-1">
            <span className="text-[10px] text-slate-500 block">Supplier &amp; Data</span>
            <span className="font-black text-slate-800 text-sm">{suppliers.length}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold shadow-sm transition"
          >
            <Download className="w-4 h-4" /> Ekspor Database ke JSON Lokal (Mitigasi)
          </button>

          <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 font-bold text-emerald-800 shadow-xs transition">
            <Upload className="w-4 h-4" /> Pulihkan dari File (.json)
            <input type="file" accept=".json" className="hidden" onChange={handleImportBackup} />
          </label>

          <button
            type="button"
            onClick={() => {
              if (!hasPermission(['ADMIN'])) {
                showToast('Akses ditolak: Hanya Administrator yang berwenang mereset database sekolah.', 'error');
                return;
              }
              setResetPinInput('');
              setResetPinError('');
              setIsResetPinModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 font-bold shadow-xs ml-auto cursor-pointer transition"
          >
            <RotateCcw className="w-4 h-4 text-red-700" /> Reset ke Data Bawaan
          </button>
        </div>
      </div>

      {/* Cloud Sync & Automated Backup Panel */}
      <CloudSyncBackupPanel />

      {/* Google Sheets Sync Panel */}
      <GoogleSheetsSyncPanel />

      {/* PIN Verification Modal for Reset Database */}
      {isResetPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-4">
            <div className="flex items-center gap-3 text-red-700">
              <div className="p-3 bg-red-100 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Otorisasi Reset Database</h3>
                <p className="text-xs text-slate-500">Tindakan ini menghapus seluruh data inventaris &amp; aset!</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-red-50 p-3 rounded-xl border border-red-100 leading-relaxed">
              Untuk melindungi database dari penghapusan tidak disengaja, masukkan <strong>PIN Pengamanan Administrator</strong> sekolah.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setResetPinError('');
                if (!verifyAdminPin(resetPinInput)) {
                  setResetPinError('PIN Pengamanan salah! Hubungi Admin / Kepala Sekolah.');
                  return;
                }
                resetToDefaultData();
                setFormData({ ...config });
                setIsResetPinModalOpen(false);
                showToast('Database berhasil direset ke data bawaan.', 'info');
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">PIN Pengamanan Admin</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    maxLength={10}
                    autoFocus
                    placeholder="Masukkan 6-digit PIN..."
                    value={resetPinInput}
                    onChange={(e) => setResetPinInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 font-mono tracking-widest text-center text-sm font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                {resetPinError && (
                  <p className="text-xs text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>{resetPinError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetPinModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-md transition"
                >
                  Konfirmasi &amp; Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
