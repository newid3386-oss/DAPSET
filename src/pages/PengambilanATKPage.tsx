import React, { useState } from 'react';
import {
  FileSignature,
  Plus,
  Search,
  Download,
  Trash2,
  X,
  Check,
  Camera,
  Printer,
  UserCheck,
  Eye,
  PenTool,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { PengambilanATKRecord, PengambilanATKItem } from '../types';
import { formatTanggalIndo } from '../utils/format';
import { SignaturePad } from '../components/SignaturePad';
import { DigitalSignatureModal } from '../components/DigitalSignatureModal';
import { WebcamCaptureModal } from '../components/WebcamCaptureModal';
import { AdvancedExportModal } from '../components/AdvancedExportModal';
import { AdvancedImportModal } from '../components/AdvancedImportModal';
import { compressImage } from '../utils/imageCompressor';

interface PengambilanATKPageProps {
  onNavigate?: (page: any) => void;
}

export const PengambilanATKPage: React.FC<PengambilanATKPageProps> = ({ onNavigate }) => {
  const {
    pengambilanATK,
    items,
    users,
    config,
    activeUser,
    addPengambilanATK,
    updatePengambilanATK,
    deletePengambilanATK,
  } = useInventory();
  const { showToast, confirmDialog } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEED_KEPSEK' | 'COMPLETE'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<PengambilanATKRecord | null>(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const pengambilanAtkColumns = [
    { key: 'no', label: 'No. BKU / Urut' },
    { key: 'tanggal', label: 'Tanggal Pengambilan' },
    { key: 'nip', label: 'NIP Guru' },
    { key: 'namaLengkap', label: 'Nama Lengkap Guru' },
    { key: 'jabatan', label: 'Jabatan / Kelas' },
    { key: 'statusPengesahan', label: 'Status Pengesahan' },
    { key: 'tanggalTtdKepsek', label: 'Tanggal Disahkan' },
    { key: 'catatanKepsek', label: 'Catatan / Disposisi' },
  ];

  // Modal signing state
  const [signModalState, setSignModalState] = useState<{
    isOpen: boolean;
    record: PengambilanATKRecord | null;
    defaultRole: 'KEPSEK' | 'GURU' | 'PETUGAS';
  }>({
    isOpen: false,
    record: null,
    defaultRole: 'KEPSEK',
  });

  // Creation Form State
  const [selectedUserNip, setSelectedUserNip] = useState(users[0]?.nip || '');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [selectedItems, setSelectedItems] = useState<PengambilanATKItem[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState('');

  // TTD Guru on form
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [hasSignature, setHasSignature] = useState(false);

  // Optional simultaneous TTD Kepsek on form
  const [includeKepsekSign, setIncludeKepsekSign] = useState(false);
  const [kepsekSignatureDataUrl, setKepsekSignatureDataUrl] = useState('');
  const [hasKepsekSignature, setHasKepsekSignature] = useState(false);
  const [catatanKepsek, setCatatanKepsek] = useState('');

  const selectedUser = users.find((u) => u.nip === selectedUserNip) || users[0];

  const filteredList = pengambilanATK.filter((atk) => {
    const matchesSearch =
      atk.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      atk.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      atk.jabatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      atk.items.some((it) => it.namaBarang.toLowerCase().includes(searchQuery.toLowerCase())) ||
      String(atk.no).includes(searchQuery);

    if (!matchesSearch) return false;

    if (statusFilter === 'NEED_KEPSEK') {
      return !atk.ttdKepsek;
    }
    if (statusFilter === 'COMPLETE') {
      return Boolean(atk.parafLink && atk.ttdKepsek);
    }
    return true;
  });

  const countNeedKepsek = pengambilanATK.filter((a) => !a.ttdKepsek).length;
  const countComplete = pengambilanATK.filter((a) => a.parafLink && a.ttdKepsek).length;

  const atkItemsAvailable = items.filter(
    (i) => i.kategori === 'ATK' || i.tipe === 'HABIS_PAKAI'
  );

  const searchFilteredAtkItems = itemSearch
    ? atkItemsAvailable.filter((i) =>
        i.namaBarang.toLowerCase().includes(itemSearch.toLowerCase())
      )
    : [];

  const handleAddItemToBasket = (item: (typeof items)[0]) => {
    const exists = selectedItems.find((x) => x.id === item.id);
    if (exists) {
      setSelectedItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, jumlah: x.jumlah + 1 } : x))
      );
    } else {
      setSelectedItems((prev) => [
        ...prev,
        {
          id: item.id,
          namaBarang: item.namaBarang,
          jumlah: 1,
          satuan: item.jenisSatuan,
        },
      ]);
    }
    setItemSearch('');
  };

  const handleRemoveItemFromBasket = (id: string) => {
    setSelectedItems((prev) => prev.filter((x) => x.id !== id));
  };

  const handleUpdateItemQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveItemFromBasket(id);
      return;
    }
    setSelectedItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, jumlah: qty } : x))
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 0.72);
      setPhotoDataUrl(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAdd = () => {
    setSelectedUserNip(users[0]?.nip || '');
    setTanggal(new Date().toISOString().slice(0, 10));
    setSelectedItems([]);
    setItemSearch('');
    setKeterangan('');
    setPhotoDataUrl('');
    setSignatureDataUrl('');
    setHasSignature(false);
    setIncludeKepsekSign(false);
    setKepsekSignatureDataUrl('');
    setHasKepsekSignature(false);
    setCatatanKepsek('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItems.length) {
      showToast('Pilih minimal 1 barang ATK yang diambil.', 'warning');
      return;
    }

    if (!hasSignature || !signatureDataUrl) {
      showToast('Tanda tangan paraf pengambil wajib diisi menggunakan canvas sebagai bukti serah terima.', 'warning');
      return;
    }

    addPengambilanATK({
      tanggal,
      nip: selectedUser.nip,
      namaLengkap: selectedUser.nama,
      jabatan: selectedUser.jabatan,
      items: selectedItems,
      fotoBuktiLink: photoDataUrl || undefined,
      parafLink: signatureDataUrl || undefined,
      ttdKepsek: includeKepsekSign && hasKepsekSignature ? kepsekSignatureDataUrl : undefined,
      tanggalTtdKepsek: includeKepsekSign && hasKepsekSignature ? tanggal : undefined,
      statusPengesahan: includeKepsekSign && hasKepsekSignature ? 'DISETUJUI' : 'PENDING',
      catatanKepsek: includeKepsekSign && catatanKepsek ? catatanKepsek : undefined,
      petugas: activeUser.nama,
      keterangan,
    });

    showToast(`Pengambilan ATK oleh ${selectedUser.nama} berhasil dicatat!`, 'success');
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string, no: number) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Catatan Pengambilan ATK?',
      message: `Hapus catatan pengambilan ATK No. ${no} atas nama ${name}?`,
      confirmText: 'Hapus Catatan',
      variant: 'danger',
    });
    if (confirmed) {
      deletePengambilanATK(id);
      showToast('Catatan pengambilan ATK berhasil dihapus.', 'info');
    }
  };

  const handlePrintSingle = (atk: PengambilanATKRecord) => {
    setPreviewRecord(atk);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleOpenSignModal = (
    atk: PengambilanATKRecord,
    role: 'KEPSEK' | 'GURU' | 'PETUGAS' = 'KEPSEK'
  ) => {
    setSignModalState({
      isOpen: true,
      record: atk,
      defaultRole: role,
    });
  };

  const handleSaveSignatureFromModal = (
    recordId: string,
    role: 'KEPSEK' | 'GURU' | 'PETUGAS',
    sigUrl: string,
    catatan?: string,
    tanggalPengesahan?: string
  ) => {
    const updateData: Partial<PengambilanATKRecord> = {};
    if (role === 'KEPSEK') {
      updateData.ttdKepsek = sigUrl;
      updateData.tanggalTtdKepsek = tanggalPengesahan || new Date().toISOString().slice(0, 10);
      updateData.statusPengesahan = 'DISETUJUI';
      if (catatan) updateData.catatanKepsek = catatan;
    } else if (role === 'GURU') {
      updateData.parafLink = sigUrl;
    } else if (role === 'PETUGAS') {
      updateData.ttdPetugas = sigUrl;
    }

    updatePengambilanATK(recordId, updateData);

    // Sync live preview if open
    if (previewRecord && previewRecord.id === recordId) {
      setPreviewRecord((prev) => (prev ? { ...prev, ...updateData } : null));
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FileSignature className="w-6 h-6 text-emerald-800" /> Pengambilan ATK Guru &amp; Staf (Digital Signature)
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan pengambilan ATK harian lengkap dengan canvas tanda tangan digital Guru, Kepala Sekolah &amp; foto bukti serah terima.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onNavigate && (
            <button
              onClick={() => onNavigate('terminal_logistik')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs shadow-md transition cursor-pointer"
              title="Buka Mode Kios Guru & Terminal Cepat"
            >
              <Zap className="w-4 h-4 fill-amber-950" /> Mode Kios Guru &amp; Terminal
            </button>
          )}

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" /> Impor Berita Acara
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" /> Ekspor Mahir
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Catat Pengambilan ATK
          </button>
        </div>
      </div>

      {/* Info Notice & Quick Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 md:col-span-2 flex items-start gap-3">
          <UserCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Akuntabilitas Tanda Tangan Canvas:</strong> Setiap guru yang mengambil ATK membubuhkan tanda tangan digital langsung pada kanvas layar sentuh atau mouse. Kepala Sekolah dapat mengesahkan berita acara secara mandiri langsung di aplikasi.
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Perlu Pengesahan Kepsek</div>
            <div className="text-xl font-black text-amber-600 mt-0.5">
              {countNeedKepsek} Dokumen
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Semua ({pengambilanATK.length})
          </button>
          <button
            onClick={() => setStatusFilter('NEED_KEPSEK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              statusFilter === 'NEED_KEPSEK'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Menunggu Kepsek ({countNeedKepsek})
          </button>
          <button
            onClick={() => setStatusFilter('COMPLETE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              statusFilter === 'COMPLETE'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Sah Lengkap ({countComplete})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari guru, NIP, barang ATK..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3">No. BKU</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Guru / Pengambil</th>
                <th className="px-4 py-3">Barang ATK yang Diambil</th>
                <th className="px-4 py-3 text-center">Status TTD Digital</th>
                <th className="px-4 py-3 text-center">Paraf Guru</th>
                <th className="px-4 py-3 text-center">TTD Kepsek</th>
                <th className="px-4 py-3 text-center">Foto Bukti</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                    Belum ada data pengambilan ATK yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredList.map((atk) => {
                  const isComplete = Boolean(atk.parafLink && atk.ttdKepsek);
                  return (
                    <tr key={atk.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono font-black text-emerald-900">
                        #{atk.no}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700 font-medium">
                        {formatTanggalIndo(atk.tanggal)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{atk.namaLengkap}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          NIP: {atk.nip} • {atk.jabatan}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {atk.items.map((it, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200"
                            >
                              {it.namaBarang} ({it.jumlah} {it.satuan || ''})
                            </span>
                          ))}
                        </div>
                        {atk.keterangan && (
                          <div className="text-[10px] text-slate-400 italic mt-1">
                            Ket: {atk.keterangan}
                          </div>
                        )}
                      </td>
                      {/* Status TTD Digital Badge */}
                      <td className="px-4 py-3 text-center">
                        {isComplete ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Sah Lengkap
                          </span>
                        ) : atk.parafLink ? (
                          <button
                            onClick={() => handleOpenSignModal(atk, 'KEPSEK')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-300 transition"
                            title="Klik untuk tanda tangan Kepala Sekolah"
                          >
                            <PenTool className="w-3 h-3 text-amber-700" /> TTD Kepsek
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenSignModal(atk, 'GURU')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-200 transition"
                            title="Klik untuk membubuhkan paraf Guru"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Perlu TTD
                          </button>
                        )}
                      </td>
                      {/* Paraf Guru Preview */}
                      <td className="px-4 py-3 text-center">
                        {atk.parafLink ? (
                          <button
                            onClick={() => handleOpenSignModal(atk, 'GURU')}
                            className="group relative"
                            title="Lihat / Ubah Tanda Tangan Guru"
                          >
                            <img
                              src={atk.parafLink}
                              alt="Paraf Guru"
                              className="h-8 max-w-[80px] mx-auto object-contain border border-slate-200 rounded-lg bg-white p-0.5 hover:border-emerald-500 transition"
                            />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenSignModal(atk, 'GURU')}
                            className="text-emerald-700 hover:underline font-semibold text-[10px]"
                          >
                            + Paraf Guru
                          </button>
                        )}
                      </td>
                      {/* TTD Kepsek Preview */}
                      <td className="px-4 py-3 text-center">
                        {atk.ttdKepsek ? (
                          <button
                            onClick={() => handleOpenSignModal(atk, 'KEPSEK')}
                            title="Lihat / Ubah Tanda Tangan Kepala Sekolah"
                          >
                            <img
                              src={atk.ttdKepsek}
                              alt="TTD Kepsek"
                              className="h-8 max-w-[80px] mx-auto object-contain border border-emerald-300 rounded-lg bg-emerald-50/40 p-0.5"
                            />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenSignModal(atk, 'KEPSEK')}
                            className="text-amber-700 hover:text-amber-900 hover:underline font-bold text-[10px] inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
                          >
                            <PenTool className="w-2.5 h-2.5" /> + TTD Kepsek
                          </button>
                        )}
                      </td>
                      {/* Foto Bukti */}
                      <td className="px-4 py-3 text-center">
                        {atk.fotoBuktiLink ? (
                          <img
                            src={atk.fotoBuktiLink}
                            alt="Foto"
                            className="w-9 h-9 object-cover mx-auto rounded-lg border border-slate-200 shadow-2xs"
                          />
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                      {/* Action buttons */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenSignModal(atk, atk.ttdKepsek ? 'GURU' : 'KEPSEK')}
                            className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                            title="Tanda Tangani Digital (Canvas)"
                          >
                            <PenTool className="w-3.5 h-3.5 text-emerald-700" />
                          </button>
                          <button
                            onClick={() => setPreviewRecord(atk)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Lihat Rincian / Cetak Berita Acara"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePrintSingle(atk)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Cetak Berita Acara"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(atk.id, atk.namaLengkap, atk.no)}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input Pengambilan ATK Digital */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-sm">Formulir Pengambilan ATK Digital</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Pengambilan</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pegawai / Guru Pengambil</label>
                  <select
                    value={selectedUserNip}
                    onChange={(e) => setSelectedUserNip(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.nip}>
                        {u.nama} ({u.jabatan})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pegawai Info Card */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Nama Lengkap</span>
                  <strong className="text-slate-900">{selectedUser.nama}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">NIP</span>
                  <strong className="text-slate-900 font-mono">{selectedUser.nip}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Jabatan</span>
                  <strong className="text-slate-900">{selectedUser.jabatan}</strong>
                </div>
              </div>

              {/* Barang Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Pilih Barang ATK yang Diambil
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ketik nama barang ATK untuk menambah..."
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                  {searchFilteredAtkItems.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                      {searchFilteredAtkItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleAddItemToBasket(item)}
                          className="p-2.5 hover:bg-emerald-50 cursor-pointer flex justify-between items-center text-xs border-b border-slate-100 last:border-0"
                        >
                          <span className="font-semibold text-slate-800">{item.namaBarang}</span>
                          <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                            + Tambah
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Items Basket */}
                <div className="mt-2.5 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-500">
                    Daftar Barang Terpilih ({selectedItems.length}):
                  </div>
                  {selectedItems.length === 0 ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400">
                      Belum ada barang ATK yang ditambahkan.
                    </div>
                  ) : (
                    selectedItems.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200"
                      >
                        <span className="font-semibold text-slate-800">{it.namaBarang}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(it.id, it.jumlah - 1)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 font-bold"
                            >
                              -
                            </button>
                            <span className="px-3 font-bold">{it.jumlah}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(it.id, it.jumlah + 1)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 font-bold"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-slate-500 text-[11px] min-w-[32px]">{it.satuan}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromBasket(it.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Tanda Tangan Canvas Guru & Foto Bukti */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <SignaturePad
                    height={150}
                    label="Tanda Tangan Guru / Penerima (Canvas) *"
                    signerName={selectedUser.nama}
                    signerRole={selectedUser.jabatan}
                    onChange={(drawn, url) => {
                      setHasSignature(drawn);
                      setSignatureDataUrl(url);
                    }}
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Foto Bukti Serah Terima (Opsional)
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-3 text-center bg-slate-50/50 min-h-[150px] flex flex-col items-center justify-center">
                    {photoDataUrl ? (
                      <div className="relative">
                        <img
                          src={photoDataUrl}
                          alt="Bukti Foto"
                          className="max-h-28 rounded-lg object-contain shadow-xs border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => setPhotoDataUrl('')}
                          className="mt-1 text-[11px] text-red-600 font-bold hover:underline block mx-auto"
                        >
                          Hapus Foto
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsWebcamOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-700 shadow-xs transition"
                        >
                          <Camera className="w-3.5 h-3.5" /> Buka Kamera Langsung
                        </button>
                        <span className="text-[10px] text-slate-400">atau</span>
                        <label className="cursor-pointer text-[11px] text-emerald-800 font-semibold hover:underline">
                          Pilih File dari Perangkat
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Optional Section: Pengesahan Langsung Kepala Sekolah */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={includeKepsekSign}
                    onChange={(e) => setIncludeKepsekSign(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500"
                  />
                  <span>Bubuhkan Pengesahan Kepala Sekolah Sekaligus</span>
                </label>

                {includeKepsekSign && (
                  <div className="pt-2 border-t border-slate-200 space-y-3">
                    <SignaturePad
                      height={140}
                      label={`Tanda Tangan Kepala Sekolah: ${config.headmaster}`}
                      signerName={config.headmaster}
                      signerRole="Kepala Sekolah"
                      onChange={(drawn, url) => {
                        setHasKepsekSignature(drawn);
                        setKepsekSignatureDataUrl(url);
                      }}
                    />
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Catatan Disposisi Kepala Sekolah (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Disetujui untuk kegiatan pembelajaran..."
                        value={catatanKepsek}
                        onChange={(e) => setCatatanKepsek(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Keterangan / Keperluan</label>
                <input
                  type="text"
                  placeholder="Kebutuhan Ujian PTS, Pembelajaran Kelas 6..."
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  <Check className="w-4 h-4" /> Simpan Pengambilan ATK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview / Print Modal */}
      {previewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="bg-gradient-to-r from-emerald-950 to-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-sm">
                  Berita Acara Pengambilan ATK No. #{previewRecord.no}
                </h3>
              </div>
              <button
                onClick={() => setPreviewRecord(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Banner if Kepala Sekolah has not signed yet */}
            {!previewRecord.ttdKepsek && (
              <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between text-xs text-amber-900 shrink-0">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Dokumen ini belum disahkan oleh <strong>Kepala Sekolah ({config.headmaster})</strong>.
                  </span>
                </div>
                <button
                  onClick={() => handleOpenSignModal(previewRecord, 'KEPSEK')}
                  className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-2xs transition flex items-center gap-1"
                >
                  <PenTool className="w-3 h-3" /> Tanda Tangani Sekarang
                </button>
              </div>
            )}

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans" id="printable-atk-ticket">
              {/* Header Surat Resmi */}
              <div className="text-center border-b-2 border-slate-800 pb-3">
                <div className="font-black text-sm uppercase text-slate-900 tracking-wide">
                  {config.schoolName}
                </div>
                <div className="text-[11px] text-slate-600">{config.address}</div>
                <div className="text-[10px] font-mono text-slate-500">
                  NPSN: {config.npsn} • TA: {config.tahunAnggaranAktif || '2026'}
                </div>
                <div className="mt-2.5 font-bold text-xs uppercase tracking-wider underline text-slate-900">
                  BERITA ACARA SERAH TERIMA &amp; PENGAMBILAN ATK
                </div>
                <div className="text-[11px] text-slate-600 font-mono">
                  Nomor: BAST-ATK/{previewRecord.no}/{previewRecord.tanggal.slice(0, 4)}
                </div>
              </div>

              {/* Data Pegawai */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Nama Pengambil:</span>
                  <strong className="text-slate-900 text-sm">{previewRecord.namaLengkap}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Tanggal Serah Terima:</span>
                  <strong className="text-slate-900">{formatTanggalIndo(previewRecord.tanggal)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">NIP Pegawai:</span>
                  <span className="font-mono text-slate-800">{previewRecord.nip}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Jabatan:</span>
                  <span className="text-slate-800">{previewRecord.jabatan}</span>
                </div>
              </div>

              {/* Tabel Barang */}
              <div>
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border border-slate-300 p-2 text-center w-10">No</th>
                      <th className="border border-slate-300 p-2 text-left">Nama Barang ATK</th>
                      <th className="border border-slate-300 p-2 text-center w-24">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRecord.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 font-medium">{it.namaBarang}</td>
                        <td className="border border-slate-300 p-2 text-center font-bold">
                          {it.jumlah} {it.satuan || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {previewRecord.keterangan && (
                <div className="text-xs text-slate-700 bg-emerald-50/40 p-2 rounded-lg border border-emerald-100">
                  <strong>Keperluan / Disposisi:</strong> {previewRecord.keterangan}
                </div>
              )}

              {previewRecord.catatanKepsek && (
                <div className="text-xs text-amber-900 bg-amber-50/70 p-2 rounded-lg border border-amber-200">
                  <strong>Catatan Pengesahan Kepala Sekolah:</strong> {previewRecord.catatanKepsek}
                </div>
              )}

              {/* Tiga Kolom Tanda Tangan Resmi: Petugas, Guru, Kepala Sekolah */}
              <div className="pt-4 mt-2 border-t border-slate-200">
                <div className="text-center font-bold text-[11px] text-slate-600 mb-3">
                  PENGESAHAN TANDA TANGAN DIGITAL RESMI
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  {/* 1. Yang Menyerahkan: Petugas Pengurus Barang */}
                  <div className="flex flex-col items-center justify-between min-h-[140px] p-2 bg-slate-50/50 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">
                      Yang Menyerahkan
                    </div>
                    <div className="h-16 flex items-center justify-center my-1">
                      {previewRecord.ttdPetugas ? (
                        <img
                          src={previewRecord.ttdPetugas}
                          alt="TTD Petugas"
                          className="max-h-16 object-contain"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenSignModal(previewRecord, 'PETUGAS')}
                          className="text-[10px] text-blue-700 hover:underline font-semibold"
                        >
                          + Tanda Tangani
                        </button>
                      )}
                    </div>
                    <div>
                      <div className="font-bold underline text-[11px] text-slate-900">
                        {config.warehouseOfficer || previewRecord.petugas}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        NIP: {config.warehouseOfficerNip || '-'}
                      </div>
                    </div>
                  </div>

                  {/* 2. Yang Menerima: Guru / Pegawai Pengambil */}
                  <div className="flex flex-col items-center justify-between min-h-[140px] p-2 bg-slate-50/50 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">
                      Yang Menerima (Guru)
                    </div>
                    <div className="h-16 flex items-center justify-center my-1">
                      {previewRecord.parafLink ? (
                        <img
                          src={previewRecord.parafLink}
                          alt="Paraf Guru"
                          className="max-h-16 object-contain"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenSignModal(previewRecord, 'GURU')}
                          className="text-[10px] text-emerald-700 hover:underline font-semibold"
                        >
                          + Goreskan Paraf
                        </button>
                      )}
                    </div>
                    <div>
                      <div className="font-bold underline text-[11px] text-slate-900">
                        {previewRecord.namaLengkap}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        NIP: {previewRecord.nip}
                      </div>
                    </div>
                  </div>

                  {/* 3. Mengetahui: Kepala Sekolah */}
                  <div className="flex flex-col items-center justify-between min-h-[140px] p-2 bg-emerald-50/40 rounded-xl border border-emerald-300">
                    <div className="text-[10px] text-emerald-900 font-bold uppercase">
                      Mengetahui / Mengesahkan
                    </div>
                    <div className="h-16 flex items-center justify-center my-1">
                      {previewRecord.ttdKepsek ? (
                        <img
                          src={previewRecord.ttdKepsek}
                          alt="TTD Kepala Sekolah"
                          className="max-h-16 object-contain"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenSignModal(previewRecord, 'KEPSEK')}
                          className="text-[10px] text-amber-700 font-bold hover:underline bg-white px-2 py-1 rounded border border-amber-300 shadow-2xs"
                        >
                          + TTD Kepala Sekolah
                        </button>
                      )}
                    </div>
                    <div>
                      <div className="font-bold underline text-[11px] text-slate-900">
                        {config.headmaster}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        NIP: {config.headmasterNip}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Digital Verification Seal */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SIMBARAS Verified Digital Signature
                </span>
                <span>
                  Dicetak pada: {formatTanggalIndo(new Date().toISOString().slice(0, 10))}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => handleOpenSignModal(previewRecord, previewRecord.ttdKepsek ? 'GURU' : 'KEPSEK')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition"
              >
                <PenTool className="w-3.5 h-3.5 text-emerald-700" /> Tanda Tangani Kanvas
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewRecord(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-100"
                >
                  Tutup
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs shadow-xs hover:bg-emerald-700"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak Berita Acara
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Digital Signature Modal (Canvas) */}
      <DigitalSignatureModal
        isOpen={signModalState.isOpen}
        onClose={() => setSignModalState((prev) => ({ ...prev, isOpen: false }))}
        record={signModalState.record}
        defaultRole={signModalState.defaultRole}
        schoolConfig={config}
        onSaveSignature={handleSaveSignatureFromModal}
      />

      {/* Webcam Live Capture Modal */}
      <WebcamCaptureModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={(img) => setPhotoDataUrl(img)}
        title="Ambil Foto Bukti Pengambilan ATK"
      />

      {/* Advanced Import Modal */}
      <AdvancedImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        type="PENGAMBILAN_ATK"
      />

      {/* Advanced Export Modal */}
      <AdvancedExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Ekspor Rekap Pengambilan ATK"
        defaultFilename="Rekap_Pengambilan_ATK_Sekolah"
        data={pengambilanATK}
        filteredData={filteredList}
        availableColumns={pengambilanAtkColumns}
        schoolConfig={config}
      />
    </div>
  );
};
