import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Edit3,
  X,
  Save,
  HelpCircle,
  FileText,
  BadgeAlert,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatRupiah } from '../utils/format';
import { PageId } from './Navigation';

interface BudgetSummaryCardProps {
  onNavigate: (page: PageId) => void;
}

export const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({ onNavigate }) => {
  const { config, updateConfig, barangMasuk, pemeliharaan, rkbs } = useInventory();

  // Tahun anggaran terpilih
  const [selectedYear, setSelectedYear] = useState<string>(config.tahunAnggaranAktif || '2026');
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Form edit pagu
  const [paguForm, setPaguForm] = useState({
    paguAnggaranTahunan: config.paguAnggaranTahunan ?? 180000000,
    paguBosReguler: config.paguBosReguler ?? 120000000,
    paguBosKinerja: config.paguBosKinerja ?? 45000000,
    paguBopDaerah: config.paguBopDaerah ?? 15000000,
    tahunAnggaranAktif: config.tahunAnggaranAktif || '2026',
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Data per tahun anggaran terpilih
  const yearlyMasuk = useMemo(() => {
    return barangMasuk.filter((bm) => {
      const year = bm.tanggal ? bm.tanggal.slice(0, 4) : '';
      return year === selectedYear;
    });
  }, [barangMasuk, selectedYear]);

  const yearlyPemeliharaan = useMemo(() => {
    return pemeliharaan.filter((p) => {
      const year = p.tanggal ? p.tanggal.slice(0, 4) : '';
      return year === selectedYear && (p.status === 'SELESAI' || p.status === 'PROSES');
    });
  }, [pemeliharaan, selectedYear]);

  // Realisasi belanja pengadaan barang
  const realisasiBarangMasuk = useMemo(() => {
    return yearlyMasuk.reduce((sum, bm) => sum + Number(bm.totalPengadaan || bm.jumlah * bm.hargaSatuan || 0), 0);
  }, [yearlyMasuk]);

  // Realisasi per sumber dana pengadaan
  const realisasiBosReguler = useMemo(() => {
    return yearlyMasuk
      .filter((bm) => bm.sumberAnggaran === 'BOS Reguler')
      .reduce((sum, bm) => sum + Number(bm.totalPengadaan || bm.jumlah * bm.hargaSatuan || 0), 0);
  }, [yearlyMasuk]);

  const realisasiBosKinerja = useMemo(() => {
    return yearlyMasuk
      .filter((bm) => bm.sumberAnggaran === 'BOS Kinerja')
      .reduce((sum, bm) => sum + Number(bm.totalPengadaan || bm.jumlah * bm.hargaSatuan || 0), 0);
  }, [yearlyMasuk]);

  const realisasiBopDaerah = useMemo(() => {
    return yearlyMasuk
      .filter((bm) => bm.sumberAnggaran !== 'BOS Reguler' && bm.sumberAnggaran !== 'BOS Kinerja')
      .reduce((sum, bm) => sum + Number(bm.totalPengadaan || bm.jumlah * bm.hargaSatuan || 0), 0);
  }, [yearlyMasuk]);

  // Realisasi pemeliharaan
  const realisasiBiayaPemeliharaan = useMemo(() => {
    return yearlyPemeliharaan.reduce((sum, p) => sum + Number(p.biaya || 0), 0);
  }, [yearlyPemeliharaan]);

  // Total Realisasi Seluruh Belanja
  const totalRealisasi = realisasiBarangMasuk + realisasiBiayaPemeliharaan;

  // Pagu Anggaran
  const totalPagu = config.paguAnggaranTahunan ?? 180000000;
  const paguBosReguler = config.paguBosReguler ?? 120000000;
  const paguBosKinerja = config.paguBosKinerja ?? 45000000;
  const paguBopDaerah = config.paguBopDaerah ?? 15000000;

  // Sisa Pagu Anggaran
  const sisaPagu = totalPagu - totalRealisasi;
  const sisaBosReguler = paguBosReguler - realisasiBosReguler;
  const sisaBosKinerja = paguBosKinerja - realisasiBosKinerja;
  const sisaBopDaerah = paguBopDaerah - realisasiBopDaerah;

  // Persentase Penyerapan
  const persentasePenyerapan = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;
  const persentaseSisa = 100 - persentasePenyerapan;

  // Realisasi per Tahap BOS
  const realisasiTahap1 = useMemo(() => {
    return yearlyMasuk
      .filter((bm) => {
        const month = parseInt(bm.tanggal.slice(5, 7), 10);
        return month >= 1 && month <= 6;
      })
      .reduce((sum, bm) => sum + Number(bm.totalPengadaan || bm.jumlah * bm.hargaSatuan || 0), 0);
  }, [yearlyMasuk]);

  const realisasiTahap2 = useMemo(() => {
    return yearlyMasuk
      .filter((bm) => {
        const month = parseInt(bm.tanggal.slice(5, 7), 10);
        return month >= 7 && month <= 12;
      })
      .reduce((sum, bm) => sum + Number(bm.totalPengadaan || bm.jumlah * bm.hargaSatuan || 0), 0);
  }, [yearlyMasuk]);

  // Penentuan Status Kesehatan Keuangan
  const healthStatus = useMemo(() => {
    if (sisaPagu < 0) {
      return {
        label: 'Defisit / Melebihi Pagu',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        cardBorder: 'border-rose-300',
        bgGradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
        icon: BadgeAlert,
        iconColor: 'text-rose-600',
        desc: 'Realisasi belanja telah melampaui pagu anggaran yang ditetapkan. Diperlukan penyesuaian RKAS Perubahan.',
      };
    }
    if (persentasePenyerapan > 90) {
      return {
        label: 'Mendekati Batas Pagu (>90%)',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        cardBorder: 'border-amber-300',
        bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
        icon: AlertTriangle,
        iconColor: 'text-amber-600',
        desc: 'Sisa pagu anggaran kurang dari 10%. Kendalikan pembelanjaan baru menjelang akhir tahun anggaran.',
      };
    }
    if (persentasePenyerapan >= 50 && persentasePenyerapan <= 90) {
      return {
        label: 'Sangat Sehat & Terkendali',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        cardBorder: 'border-emerald-200',
        bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
        icon: ShieldCheck,
        iconColor: 'text-emerald-600',
        desc: 'Penyerapan anggaran belanja berjalan terencana dan proporsional dengan sisa pagu aman.',
      };
    }
    return {
      label: 'Penyerapan Berjalan Wajar',
      badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
      cardBorder: 'border-teal-200',
      bgGradient: 'from-teal-500/10 via-teal-500/5 to-transparent',
      icon: CheckCircle2,
      iconColor: 'text-teal-600',
      desc: 'Penyerapan anggaran masih pada tahap awal hingga pertengahan dengan cadangan pagu yang memadai.',
    };
  }, [sisaPagu, persentasePenyerapan]);

  const handleOpenEditModal = () => {
    setPaguForm({
      paguAnggaranTahunan: totalPagu,
      paguBosReguler: paguBosReguler,
      paguBosKinerja: paguBosKinerja,
      paguBopDaerah: paguBopDaerah,
      tahunAnggaranAktif: selectedYear,
    });
    setIsEditModalOpen(true);
  };

  const handleSavePagu = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      paguAnggaranTahunan: Number(paguForm.paguAnggaranTahunan),
      paguBosReguler: Number(paguForm.paguBosReguler),
      paguBosKinerja: Number(paguForm.paguBosKinerja),
      paguBopDaerah: Number(paguForm.paguBopDaerah),
      tahunAnggaranAktif: paguForm.tahunAnggaranAktif,
    });
    setSelectedYear(paguForm.tahunAnggaranAktif);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditModalOpen(false);
    }, 1200);
  };

  const HealthIcon = healthStatus.icon;

  return (
    <div className={`bg-white rounded-2xl border ${healthStatus.cardBorder} shadow-sm overflow-hidden transition-all duration-300 relative`}>
      {/* Background Glow Ambient */}
      <div className={`absolute top-0 right-0 w-96 h-48 bg-gradient-to-bl ${healthStatus.bgGradient} pointer-events-none rounded-bl-full`} />

      {/* Card Header */}
      <div className="p-5 md:p-6 border-b border-slate-100 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Wallet className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Ringkasan Pagu &amp; Anggaran Tahunan Sekolah
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${healthStatus.badgeClass}`}>
                    <HealthIcon className="w-3.5 h-3.5" />
                    {healthStatus.label}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Pantauan kesehatan keuangan belanja operasional BOS &amp; inventaris sekolah secara real-time
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Filter Tahun */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] text-slate-400">Tahun:</span>
              <select
                aria-label="Pilih Tahun Anggaran"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>

            {/* Button Atur Pagu */}
            <button
              onClick={handleOpenEditModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              title="Sesuaikan plafon pagu anggaran tahunan BOS sekolah"
            >
              <Edit3 className="w-3.5 h-3.5" /> Sesuaikan Pagu RKAS
            </button>

            {/* Button Rincian Belanja */}
            <button
              onClick={() => setIsDetailModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition"
            >
              <FileText className="w-3.5 h-3.5" /> Rincian Realisasi
            </button>
          </div>
        </div>

        {/* Real-time Financial Health Alert Banner */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-start gap-3">
          <HealthIcon className={`w-4 h-4 mt-0.5 shrink-0 ${healthStatus.iconColor}`} />
          <div className="text-xs text-slate-600 flex-1 leading-relaxed">
            <span className="font-bold text-slate-800">Status Keuangan: </span>
            {healthStatus.desc} Realisasi belanja telah mencapai{' '}
            <strong className="text-slate-900 font-extrabold">{persentasePenyerapan.toFixed(1)}%</strong> dari total pagu pagu tahun berjalan.
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('rkbs')}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
            >
              Cek Usulan RKAS <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats Grid: Pagu vs Realisasi vs Sisa Pagu */}
      <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
        {/* Card 1: Total Pagu Anggaran Tahunan */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span className="uppercase tracking-wider text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" /> Pagu Anggaran (RKAS)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-200 text-[10px] font-bold">
                TA {selectedYear}
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-black tracking-tight text-white mt-1">
              {formatRupiah(totalPagu)}
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              Batas plafon alokasi dana belanja barang operasional dan pemeliharaan sekolah tahun {selectedYear}.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-white/10 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span>BOS Reguler:</span>
              <span className="font-semibold text-white">{formatRupiah(paguBosReguler)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>BOS Kinerja &amp; BOPD:</span>
              <span className="font-semibold text-white">{formatRupiah(paguBosKinerja + paguBopDaerah)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Realisasi Belanja Terserap */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span className="uppercase tracking-wider text-[11px] font-bold text-blue-600 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Total Realisasi Belanja
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[11px]">
                {persentasePenyerapan.toFixed(1)}% Terserap
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 mt-1">
              {formatRupiah(totalRealisasi)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Akumulasi faktur pengadaan barang masuk ({yearlyMasuk.length} transaksi) dan pemeliharaan aktif.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
            {/* Progress Bar Penyerapan */}
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                <span>Tingkat Penyerapan Anggaran</span>
                <span className="font-bold text-slate-800">{persentasePenyerapan.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 rounded-full ${
                    persentasePenyerapan > 90
                      ? 'bg-amber-500'
                      : persentasePenyerapan > 100
                      ? 'bg-rose-500'
                      : 'bg-gradient-to-r from-blue-500 to-emerald-500'
                  }`}
                  style={{ width: `${Math.min(persentasePenyerapan, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span>Pengadaan: <strong className="text-slate-700">{formatRupiah(realisasiBarangMasuk)}</strong></span>
              <span>Servis: <strong className="text-slate-700">{formatRupiah(realisasiBiayaPemeliharaan)}</strong></span>
            </div>
          </div>
        </div>

        {/* Card 3: Sisa Pagu Anggaran (Saldo Kas Belanja) */}
        <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${
          sisaPagu < 0
            ? 'bg-rose-50/60 border-rose-200'
            : sisaPagu < totalPagu * 0.15
            ? 'bg-amber-50/60 border-amber-200'
            : 'bg-emerald-50/50 border-emerald-200'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className={`uppercase tracking-wider text-[11px] font-bold flex items-center gap-1.5 ${
                sisaPagu < 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" /> Sisa Pagu Anggaran
              </span>
              <span className={`px-2 py-0.5 rounded-full font-extrabold text-[11px] ${
                sisaPagu < 0
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {sisaPagu >= 0 ? `${persentaseSisa.toFixed(1)}% Tersedia` : 'Defisit'}
              </span>
            </div>
            <div className={`text-2xl md:text-3xl font-black tracking-tight mt-1 ${
              sisaPagu < 0 ? 'text-rose-700' : 'text-emerald-900'
            }`}>
              {formatRupiah(sisaPagu)}
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              {sisaPagu >= 0
                ? `Kapasitas sisa pagu belanja yang masih dapat dibelanjakan untuk periode TA ${selectedYear}.`
                : 'Pagu telah terlampaui! Segera ajukan pergeseran atau RKAS Perubahan.'}
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-200/60 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Sisa Pagu BOS Reguler:</span>
              <span className="font-bold text-slate-800">{formatRupiah(sisaBosReguler)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Sisa Pagu BOS Kinerja:</span>
              <span className="font-bold text-slate-800">{formatRupiah(sisaBosKinerja)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress per Sumber Dana & Tahap BOS Juknis */}
      <div className="px-5 md:px-6 pb-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {/* Left: Alokasi & Realisasi per Sumber Anggaran */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-emerald-600" /> Penyerapan per Sumber Dana
            </span>
            <span className="text-[11px] text-slate-400">Realisasi vs Pagu</span>
          </div>

          <div className="space-y-3">
            {/* BOS Reguler */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> BOS Reguler
                </span>
                <span>
                  {formatRupiah(realisasiBosReguler)}{' '}
                  <span className="text-slate-400 font-normal">/ {formatRupiah(paguBosReguler)}</span>
                  <span className="ml-1.5 text-emerald-700 font-bold">
                    ({paguBosReguler > 0 ? ((realisasiBosReguler / paguBosReguler) * 100).toFixed(0) : 0}%)
                  </span>
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(paguBosReguler > 0 ? (realisasiBosReguler / paguBosReguler) * 100 : 0, 100)}%` }}
                />
              </div>
            </div>

            {/* BOS Kinerja */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> BOS Kinerja / Afirmasi
                </span>
                <span>
                  {formatRupiah(realisasiBosKinerja)}{' '}
                  <span className="text-slate-400 font-normal">/ {formatRupiah(paguBosKinerja)}</span>
                  <span className="ml-1.5 text-blue-700 font-bold">
                    ({paguBosKinerja > 0 ? ((realisasiBosKinerja / paguBosKinerja) * 100).toFixed(0) : 0}%)
                  </span>
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(paguBosKinerja > 0 ? (realisasiBosKinerja / paguBosKinerja) * 100 : 0, 100)}%` }}
                />
              </div>
            </div>

            {/* BOP Daerah & Lainnya */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> BOP Daerah / Komite
                </span>
                <span>
                  {formatRupiah(realisasiBopDaerah)}{' '}
                  <span className="text-slate-400 font-normal">/ {formatRupiah(paguBopDaerah)}</span>
                  <span className="ml-1.5 text-amber-700 font-bold">
                    ({paguBopDaerah > 0 ? ((realisasiBopDaerah / paguBopDaerah) * 100).toFixed(0) : 0}%)
                  </span>
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(paguBopDaerah > 0 ? (realisasiBopDaerah / paguBopDaerah) * 100 : 0, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Tahapan Juknis BOS & Action Buttons */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" /> Penyerapan per Tahapan BOS
              </span>
              <span className="text-[11px] text-slate-400">Target Juknis BOS</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <div className="text-[11px] font-semibold text-slate-500">Tahap 1 (Jan - Jun)</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">{formatRupiah(realisasiTahap1)}</div>
                <div className="text-[10px] text-emerald-700 font-bold mt-1">
                  {totalPagu > 0 ? ((realisasiTahap1 / (totalPagu * 0.5)) * 100).toFixed(0) : 0}% Target S1
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <div className="text-[11px] font-semibold text-slate-500">Tahap 2 (Jul - Des)</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">{formatRupiah(realisasiTahap2)}</div>
                <div className="text-[10px] text-blue-700 font-bold mt-1">
                  {totalPagu > 0 ? ((realisasiTahap2 / (totalPagu * 0.5)) * 100).toFixed(0) : 0}% Target S2
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              Usulan RKBS Menunggu Realisasi:{' '}
              <strong className="text-slate-800 font-bold">
                {rkbs.filter((r) => r.status === 'DIUSULKAN' || r.status === 'DISETUJUI_RKAS').length} Item
              </strong>
            </div>
            <button
              onClick={() => onNavigate('rkbs')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
            >
              Buka RKBS <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Sesuaikan Pagu Anggaran Tahunan */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Atur Plafon Pagu Anggaran Tahunan</h3>
                  <p className="text-xs text-slate-500">Sesuaikan dengan DPA / RKAS Penetapan Sekolah</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePagu} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tahun Anggaran Aktif
                </label>
                <input
                  type="text"
                  required
                  value={paguForm.tahunAnggaranAktif}
                  onChange={(e) => setPaguForm({ ...paguForm, tahunAnggaranAktif: e.target.value })}
                  placeholder="Contoh: 2026"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Total Pagu Anggaran Tahunan (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={paguForm.paguAnggaranTahunan}
                    onChange={(e) => setPaguForm({ ...paguForm, paguAnggaranTahunan: Number(e.target.value) })}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Terbaca: {formatRupiah(paguForm.paguAnggaranTahunan)}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Pagu BOS Reguler
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={paguForm.paguBosReguler}
                    onChange={(e) => setPaguForm({ ...paguForm, paguBosReguler: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Pagu BOS Kinerja
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={paguForm.paguBosKinerja}
                    onChange={(e) => setPaguForm({ ...paguForm, paguBosKinerja: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Pagu BOPD / Lain
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={paguForm.paguBopDaerah}
                    onChange={(e) => setPaguForm({ ...paguForm, paguBopDaerah: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Perubahan pagu akan otomatis tersimpan dalam konfigurasi sekolah dan memperbarui perhitungan sisa pagu serta indikator kesehatan keuangan di Dashboard secara instan.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveSuccess}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4" /> Berhasil Disimpan
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Simpan Pagu Baru
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Rincian Realisasi Belanja Transaksi */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden animate-in fade-in duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Rincian Realisasi Belanja Tahun {selectedYear}</h3>
                  <p className="text-xs text-slate-500">Daftar transaksi belanja barang masuk &amp; pemeliharaan aset</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-[11px] text-slate-500">Total Pagu RKAS</div>
                  <div className="text-sm font-black text-slate-900">{formatRupiah(totalPagu)}</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
                  <div className="text-[11px] text-blue-700">Total Belanja Terserap</div>
                  <div className="text-sm font-black text-blue-900">{formatRupiah(totalRealisasi)}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <div className="text-[11px] text-emerald-700">Sisa Pagu Belanja</div>
                  <div className="text-sm font-black text-emerald-900">{formatRupiah(sisaPagu)}</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Daftar Pengadaan Barang Masuk ({yearlyMasuk.length} Transaksi)
                </h4>
                {yearlyMasuk.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                    Belum ada transaksi barang masuk pada tahun {selectedYear}.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Tanggal</th>
                          <th className="p-2.5">Nama Barang</th>
                          <th className="p-2.5">Sumber Dana</th>
                          <th className="p-2.5 text-center">Qty</th>
                          <th className="p-2.5 text-right">Harga</th>
                          <th className="p-2.5 text-right">Total Belanja</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {yearlyMasuk.map((bm) => (
                          <tr key={bm.id} className="hover:bg-slate-50">
                            <td className="p-2.5 text-slate-600 whitespace-nowrap">{bm.tanggal}</td>
                            <td className="p-2.5 font-bold text-slate-800">{bm.namaBarang}</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                {bm.sumberAnggaran}
                              </span>
                            </td>
                            <td className="p-2.5 text-center text-slate-700">{bm.jumlah} {bm.jenisSatuan}</td>
                            <td className="p-2.5 text-right text-slate-600">{formatRupiah(bm.hargaSatuan)}</td>
                            <td className="p-2.5 text-right font-bold text-slate-900">
                              {formatRupiah(bm.totalPengadaan || bm.jumlah * bm.hargaSatuan)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs text-slate-500">
                Data disinkronkan otomatis dari BKU &amp; modul Barang Masuk
              </span>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  onNavigate('barang_masuk');
                }}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5"
              >
                Kelola Faktur Barang Masuk <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
