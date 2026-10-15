import React, { useState } from 'react';
import {
  FileSignature,
  X,
  Check,
  ShieldCheck,
  UserCheck,
  Briefcase,
  Calendar,
  Building,
  RotateCcw,
} from 'lucide-react';
import { PengambilanATKRecord, SchoolConfig } from '../types';
import { SignaturePad } from './SignaturePad';
import { formatTanggalIndo } from '../utils/format';
import { useToast } from '../context/ToastContext';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PengambilanATKRecord | null;
  defaultRole?: 'KEPSEK' | 'GURU' | 'PETUGAS';
  schoolConfig: SchoolConfig;
  onSaveSignature: (
    recordId: string,
    role: 'KEPSEK' | 'GURU' | 'PETUGAS',
    signatureUrl: string,
    catatan?: string,
    tanggalPengesahan?: string
  ) => void;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  isOpen,
  onClose,
  record,
  defaultRole = 'KEPSEK',
  schoolConfig,
  onSaveSignature,
}) => {
  const { showToast } = useToast();
  const [activeRole, setActiveRole] = useState<'KEPSEK' | 'GURU' | 'PETUGAS'>(defaultRole);
  const [signatureUrl, setSignatureUrl] = useState('');
  const [hasSignature, setHasSignature] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [tanggalPengesahan, setTanggalPengesahan] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [isReplacingExisting, setIsReplacingExisting] = useState(false);

  // Sync state when modal opens or role changes
  React.useEffect(() => {
    if (defaultRole) {
      setActiveRole(defaultRole);
    }
    setSignatureUrl('');
    setHasSignature(false);
    setIsReplacingExisting(false);
    if (record) {
      setCatatan(record.catatanKepsek || '');
    }
  }, [defaultRole, record, isOpen]);

  if (!isOpen || !record) return null;

  const currentSignature =
    activeRole === 'KEPSEK'
      ? record.ttdKepsek
      : activeRole === 'GURU'
      ? record.parafLink
      : record.ttdPetugas;

  const signerDetails = {
    KEPSEK: {
      title: 'Kepala Sekolah (Mengesahkan)',
      name: schoolConfig.headmaster,
      nip: schoolConfig.headmasterNip,
      roleName: 'Kepala Sekolah',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      description: 'Pengesahan resmi dari pimpinan sekolah atas pengeluaran persediaan ATK.',
    },
    GURU: {
      title: 'Guru / Pegawai Pengambil (Penerima)',
      name: record.namaLengkap,
      nip: record.nip,
      roleName: record.jabatan,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description: 'Tanda tangan bukti penerimaan barang ATK fisik yang diambil.',
    },
    PETUGAS: {
      title: 'Pengurus Barang / Petugas (Penyerah)',
      name: schoolConfig.warehouseOfficer || record.petugas,
      nip: schoolConfig.warehouseOfficerNip || '-',
      roleName: 'Pengurus Barang / Pengelola Sarpras',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'Verifikasi penyerahan barang oleh staf gudang/sarana prasarana.',
    },
  }[activeRole];

  const handleRoleSwitch = (newRole: 'KEPSEK' | 'GURU' | 'PETUGAS') => {
    setActiveRole(newRole);
    setSignatureUrl('');
    setHasSignature(false);
    setIsReplacingExisting(false);
  };

  const handleSave = () => {
    if (!hasSignature && !currentSignature) {
      showToast('Silakan goreskan tanda tangan digital pada kanvas terlebih dahulu.', 'warning');
      return;
    }

    const finalSignature = hasSignature ? signatureUrl : currentSignature;
    if (!finalSignature) {
      showToast('Tanda tangan belum tersedia.', 'warning');
      return;
    }

    onSaveSignature(
      record.id,
      activeRole,
      finalSignature,
      activeRole === 'KEPSEK' ? catatan : undefined,
      activeRole === 'KEPSEK' ? tanggalPengesahan : undefined
    );

    showToast('Tanda tangan digital berhasil disahkan & disimpan!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileSignature className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight">
                Tanda Tangan Digital Berita Acara ATK
              </h3>
              <p className="text-[11px] text-emerald-200">
                Bukti Pengambilan No. #{record.no} • {formatTanggalIndo(record.tanggal)}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Summary of Items */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Penerima Barang:</div>
              <div className="font-bold text-slate-800 text-sm">{record.namaLengkap}</div>
              <div className="text-[11px] text-slate-500 font-mono">
                NIP: {record.nip} • {record.jabatan}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total ATK:</div>
              <div className="font-bold text-emerald-800">
                {record.items.reduce((acc, it) => acc + it.jumlah, 0)} unit ({record.items.length} macam)
              </div>
            </div>
          </div>

          {/* Role Selector Tabs */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Pilih Pihak Penanda Tangan:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleRoleSwitch('KEPSEK')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                  activeRole === 'KEPSEK'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-600 text-emerald-950 font-bold'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold">Kepala Sekolah</span>
                  {record.ttdKepsek && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Sudah ditandatangani" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 truncate">
                  {schoolConfig.headmaster}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSwitch('GURU')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                  activeRole === 'GURU'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-600 text-emerald-950 font-bold'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold">Penerima (Guru)</span>
                  {record.parafLink && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Sudah ditandatangani" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 truncate">
                  {record.namaLengkap}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSwitch('PETUGAS')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                  activeRole === 'PETUGAS'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-600 text-emerald-950 font-bold'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold">Petugas Gudang</span>
                  {record.ttdPetugas && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Sudah ditandatangani" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 truncate">
                  {schoolConfig.warehouseOfficer || record.petugas}
                </span>
              </button>
            </div>
          </div>

          {/* Active Signer Profile Card */}
          <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
                {activeRole === 'KEPSEK' ? 'KS' : activeRole === 'GURU' ? 'GR' : 'PG'}
              </div>
              <div>
                <div className="font-bold text-slate-900">{signerDetails.name}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  NIP: {signerDetails.nip} • {signerDetails.roleName}
                </div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${signerDetails.badgeColor}`}
            >
              {signerDetails.title}
            </span>
          </div>

          {/* If already signed and not in replacing mode */}
          {currentSignature && !isReplacingExisting ? (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Tanda Tangan Tersimpan
                </span>
                <button
                  type="button"
                  onClick={() => setIsReplacingExisting(true)}
                  className="text-emerald-800 hover:text-emerald-900 font-bold text-[11px] hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Tanda Tangani Ulang
                </button>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center">
                <img
                  src={currentSignature}
                  alt="Tanda Tangan"
                  className="max-h-24 object-contain mx-auto"
                />
                <span className="text-[10px] text-slate-400 mt-2 block">
                  Telah dibubuhkan ke Berita Acara #{record.no}
                </span>
              </div>
            </div>
          ) : (
            /* Interactive Canvas Pad */
            <div>
              <SignaturePad
                height={160}
                label={`Kanvas Tanda Tangan: ${signerDetails.title}`}
                signerName={signerDetails.name}
                signerRole={signerDetails.roleName}
                onChange={(drawn, url) => {
                  setHasSignature(drawn);
                  setSignatureUrl(url);
                }}
              />
              {isReplacingExisting && currentSignature && (
                <button
                  type="button"
                  onClick={() => setIsReplacingExisting(false)}
                  className="mt-1 text-[11px] text-slate-500 hover:underline"
                >
                  ← Batal ganti, gunakan tanda tangan yang sudah ada
                </button>
              )}
            </div>
          )}

          {/* Optional notes for Kepala Sekolah */}
          {activeRole === 'KEPSEK' && (
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tanggal Pengesahan
                  </label>
                  <input
                    type="date"
                    value={tanggalPengesahan}
                    onChange={(e) => setTanggalPengesahan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Disposisi / Catatan Kepsek
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Disetujui & diverifikasi..."
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
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
            onClick={handleSave}
            disabled={!hasSignature && !currentSignature}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold shadow-xs transition"
          >
            <Check className="w-4 h-4" /> Simpan &amp; Bubuhkan Tanda Tangan
          </button>
        </div>
      </div>
    </div>
  );
};
