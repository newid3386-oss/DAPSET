import React, { useState } from 'react';
import {
  FileSignature,
  Package,
  Search,
  Check,
  RotateCcw,
  Camera,
  Printer,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  QrCode,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Zap,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { PengambilanATKItem } from '../types';
import { formatTanggalIndo } from '../utils/format';
import { SignaturePad } from '../components/SignaturePad';
import { WebcamCaptureModal } from '../components/WebcamCaptureModal';
import { QrScannerModal } from '../components/QrScannerModal';

interface KioskPageProps {
  onExitKiosk: () => void;
  onOpenTerminal?: () => void;
}

type KioskTab = 'ambil_atk' | 'cek_stok' | 'lapor_rusak';

export const KioskPage: React.FC<KioskPageProps> = ({ onExitKiosk, onOpenTerminal }) => {
  const {
    config,
    users,
    items,
    stockSummary,
    assets,
    addPengambilanATK,
    addLaporanKerusakan,
  } = useInventory();

  const [activeTab, setActiveTab] = useState<KioskTab>('ambil_atk');

  // Pickup Kiosk State
  const [pickupStep, setPickupStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedUserNip, setSelectedUserNip] = useState(users[0]?.nip || '');
  const [userSearch, setUserSearch] = useState('');
  const [basket, setBasket] = useState<PengambilanATKItem[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [keterangan, setKeterangan] = useState('Keperluan Pembelajaran Kelas');
  const [signatureData, setSignatureData] = useState('');
  const [hasSignature, setHasSignature] = useState(false);
  const [photoData, setPhotoData] = useState('');
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [completedRecord, setCompletedRecord] = useState<any>(null);

  // Stock Inquirer Search
  const [stockSearchQuery, setStockSearchQuery] = useState('');

  // Damage Report State
  const [damageAssetCode, setDamageAssetCode] = useState(assets[0]?.kodeAset || '');
  const [damageCondition, setDamageCondition] = useState<'RUSAK_RINGAN' | 'RUSAK_BERAT'>('RUSAK_RINGAN');
  const [damageDesc, setDamageDesc] = useState('');
  const [damageSubmitted, setDamageSubmitted] = useState(false);

  // QR Scanner Modal
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  const selectedUser = users.find((u) => u.nip === selectedUserNip) || users[0];

  const filteredUsers = users.filter(
    (u) =>
      u.status === 'AKTIF' &&
      (u.nama.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.nip.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.jabatan.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const availableAtkItems = items.filter(
    (i) => i.status === 'AKTIF' && (i.kategori === 'ATK' || i.tipe === 'HABIS_PAKAI')
  );

  const filteredAtkItems = availableAtkItems.filter((i) =>
    i.namaBarang.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const handleAddToBasket = (item: (typeof items)[0]) => {
    const existing = basket.find((b) => b.id === item.id);
    if (existing) {
      setBasket((prev) =>
        prev.map((b) => (b.id === item.id ? { ...b, jumlah: b.jumlah + 1 } : b))
      );
    } else {
      setBasket((prev) => [
        ...prev,
        {
          id: item.id,
          namaBarang: item.namaBarang,
          jumlah: 1,
          satuan: item.jenisSatuan,
        },
      ]);
    }
  };

  const handleUpdateBasketQty = (id: string, delta: number) => {
    setBasket((prev) =>
      prev
        .map((b) => {
          if (b.id !== id) return b;
          const next = b.jumlah + delta;
          return next > 0 ? { ...b, jumlah: next } : null;
        })
        .filter(Boolean) as PengambilanATKItem[]
    );
  };

  const handleFinalSubmitPickup = () => {
    if (basket.length === 0 || !selectedUser) return;

    const res = addPengambilanATK({
      tanggal: new Date().toISOString().slice(0, 10),
      nip: selectedUser.nip,
      namaLengkap: selectedUser.nama,
      jabatan: selectedUser.jabatan,
      items: basket,
      fotoBuktiLink: photoData || undefined,
      parafLink: signatureData || undefined,
      petugas: 'Self-Service Kiosk Guru',
      keterangan: keterangan || 'Pengambilan Mandiri Kiosk Guru',
    });

    setCompletedRecord({
      no: res.no,
      id: res.id,
      user: selectedUser,
      items: basket,
      tanggal: new Date().toISOString().slice(0, 10),
      paraf: signatureData,
      keterangan,
    });

    setPickupStep(4);
  };

  const handleResetPickup = () => {
    setPickupStep(1);
    setBasket([]);
    setSignatureData('');
    setHasSignature(false);
    setPhotoData('');
    setCompletedRecord(null);
  };

  const handleSubmitDamage = (e: React.FormEvent) => {
    e.preventDefault();
    const ast = assets.find((a) => a.kodeAset === damageAssetCode);
    if (!ast || !damageDesc) return;

    addLaporanKerusakan({
      tanggal: new Date().toISOString().slice(0, 10),
      kodeAset: ast.kodeAset,
      namaBarang: ast.namaBarang,
      lokasi: ast.lokasi,
      pelapor: selectedUser?.nama || 'Guru / Staf Sekolah',
      kondisi: damageCondition,
      deskripsiKerusakan: damageDesc,
      status: 'MENUNGGU_VERIFIKASI',
    });

    setDamageSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Kiosk Top Bar */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-lg sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-700/80 text-white flex items-center justify-center font-black shadow-md border border-emerald-400/30">
            MB
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-sm md:text-base text-white">
                Kiosk Mandiri Guru &amp; Pegawai
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                FAST DESK
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {config.schoolName} • Meja Piket &amp; Ruang Persediaan
            </p>
          </div>
        </div>

        {/* Tab Switcher & Exit Button */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('ambil_atk')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'ambil_atk'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileSignature className="w-3.5 h-3.5" /> Ambil ATK
            </button>
            <button
              onClick={() => setActiveTab('cek_stok')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'cek_stok'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" /> Cek Stok
            </button>
            <button
              onClick={() => setActiveTab('lapor_rusak')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'lapor_rusak'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Lapor Rusak
            </button>
          </div>

          <button
            onClick={() => setIsQrScannerOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition"
            title="Scan QR Aset"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {onOpenTerminal && (
            <button
              onClick={onOpenTerminal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition shadow-xs cursor-pointer"
              title="Buka Terminal Masuk & Keluar Lengkap"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-300" />
              <span className="hidden sm:inline">Terminal Cepat</span>
            </button>
          )}

          <button
            onClick={onExitKiosk}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Keluar Kiosk
          </button>
        </div>
      </header>

      {/* Main Kiosk Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col">
        {/* Mobile Sub-Navigation */}
        <div className="flex lg:hidden items-center justify-center gap-2 mb-4 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab('ambil_atk')}
            className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
              activeTab === 'ambil_atk' ? 'bg-emerald-600 text-white' : 'text-slate-300'
            }`}
          >
            <FileSignature className="w-3.5 h-3.5" /> Ambil ATK
          </button>
          <button
            onClick={() => setActiveTab('cek_stok')}
            className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
              activeTab === 'cek_stok' ? 'bg-emerald-600 text-white' : 'text-slate-300'
            }`}
          >
            <Package className="w-3.5 h-3.5" /> Cek Stok
          </button>
          <button
            onClick={() => setActiveTab('lapor_rusak')}
            className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
              activeTab === 'lapor_rusak' ? 'bg-emerald-600 text-white' : 'text-slate-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Lapor Rusak
          </button>
        </div>

        {/* TAB 1: PENGAMBILAN ATK CEPAT */}
        {activeTab === 'ambil_atk' && (
          <div className="flex-1 flex flex-col space-y-4">
            {/* Step Indicator */}
            {pickupStep !== 4 && (
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-4 text-xs font-bold">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl ${
                      pickupStep === 1
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>Pilih Guru</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl ${
                      pickupStep === 2
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>Pilih Barang</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl ${
                      pickupStep === 3
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">
                      3
                    </span>
                    <span>Tanda Tangan</span>
                  </div>
                </div>

                {basket.length > 0 && pickupStep === 2 && (
                  <button
                    onClick={() => setPickupStep(3)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md"
                  >
                    Lanjut ({basket.reduce((a, b) => a + b.jumlah, 0)} Item) <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* STEP 1: PILIH GURU */}
            {pickupStep === 1 && (
              <div className="flex-1 bg-slate-800/60 border border-slate-700 rounded-3xl p-5 md:p-8 flex flex-col space-y-6">
                <div>
                  <h2 className="text-lg md:text-xl font-black text-white">
                    Pilih Nama Guru / Pegawai Pengambil
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Sentuh salah satu nama di bawah untuk memulai pengambilan barang ATK.
                  </p>
                </div>

                {/* Search Guru */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Ketik nama guru, NIP, atau jabatan..."
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl pl-11 pr-4 py-3 text-xs md:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Grid Guru Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-[55vh] pr-1">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setSelectedUserNip(user.nip);
                        setPickupStep(2);
                      }}
                      className="p-4 rounded-2xl bg-slate-850 hover:bg-emerald-900/30 border border-slate-700/80 hover:border-emerald-500/50 text-left transition flex items-center gap-3.5 shadow-sm group cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition">
                        {user.nama.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs md:text-sm text-slate-200 group-hover:text-white truncate">
                          {user.nama}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {user.jabatan}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                          NIP: {user.nip}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: PILIH BARANG & KERANJANG */}
            {pickupStep === 2 && (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left/Middle: Catalog */}
                <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700 rounded-3xl p-5 flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-black text-white">Katalog Barang ATK &amp; Habis Pakai</h2>
                      <p className="text-[11px] text-slate-400">
                        Pengambil:{' '}
                        <strong className="text-emerald-400">{selectedUser.nama}</strong> ({selectedUser.jabatan})
                      </p>
                    </div>

                    <button
                      onClick={() => setPickupStep(1)}
                      className="text-xs text-slate-400 hover:text-white underline"
                    >
                      Ganti Guru
                    </button>
                  </div>

                  {/* Search Item */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      placeholder="Cari nama spidol, kertas HVS, lakban, bolpoin..."
                      className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Item Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[50vh] pr-1">
                    {filteredAtkItems.map((item) => {
                      const stockInfo = stockSummary.find((s) => s.kodeBarang === item.kodeBarang);
                      const currentStock = stockInfo?.stok || 0;
                      const inBasket = basket.find((b) => b.id === item.id);

                      return (
                        <div
                          key={item.id}
                          className="bg-slate-850 border border-slate-700/80 rounded-2xl p-3.5 flex flex-col justify-between space-y-3 shadow-xs"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-xs text-slate-200 leading-tight">
                                {item.namaBarang}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                                  currentStock > item.batasMinimum
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : currentStock > 0
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}
                              >
                                Stok: {currentStock} {item.jenisSatuan}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Lokasi: {item.lokasiDefault || 'Gudang Persediaan'}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                            {inBasket ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateBasketQty(item.id, -1)}
                                  className="w-7 h-7 rounded-xl bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-mono font-bold text-sm text-emerald-400 w-6 text-center">
                                  {inBasket.jumlah}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateBasketQty(item.id, 1)}
                                  className="w-7 h-7 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddToBasket(item)}
                                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" /> Ambil Barang
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Basket Summary */}
                <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-emerald-400" />
                        <h3 className="font-extrabold text-sm text-white">Keranjang Pengambilan</h3>
                      </div>
                      <span className="text-xs font-bold text-slate-400">
                        {basket.length} Macam Barang
                      </span>
                    </div>

                    {basket.length === 0 ? (
                      <div className="py-12 text-center text-slate-500 text-xs">
                        Keranjang masih kosong.<br />Pilih barang dari katalog di sebelah kiri.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-700/60 overflow-y-auto max-h-60 mt-2">
                        {basket.map((item) => (
                          <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                            <div className="min-w-0 pr-2">
                              <div className="font-bold text-slate-200 truncate">{item.namaBarang}</div>
                              <div className="text-[10px] text-slate-400">
                                {item.jumlah} {item.satuan}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateBasketQty(item.id, -1)}
                                className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center font-bold text-xs">{item.jumlah}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateBasketQty(item.id, 1)}
                                className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-700">
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Keperluan / Peruntukan
                      </label>
                      <input
                        type="text"
                        value={keterangan}
                        onChange={(e) => setKeterangan(e.target.value)}
                        placeholder="Contoh: Pembelajaran Tematik Kelas 4"
                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={basket.length === 0}
                    onClick={() => setPickupStep(3)}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs md:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Lanjut ke Tanda Tangan Digital</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: TANDA TANGAN & BUKTI FOTO */}
            {pickupStep === 3 && (
              <div className="flex-1 bg-slate-800/60 border border-slate-700 rounded-3xl p-5 md:p-8 flex flex-col max-w-3xl mx-auto w-full space-y-6">
                <div>
                  <h2 className="text-lg md:text-xl font-black text-white">
                    Verifikasi &amp; Tanda Tangan Pengambilan
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Silakan goreskan tanda tangan pada layar sentuh sebagai bukti sah administrasi sekolah.
                  </p>
                </div>

                {/* Recap Items */}
                <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-2">
                    <span>Nama Guru: <strong className="text-white">{selectedUser.nama}</strong></span>
                    <span>NIP: <strong className="text-white">{selectedUser.nip}</strong></span>
                  </div>
                  <div className="font-bold text-slate-300">Daftar Barang yang Diambil:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {basket.map((it) => (
                      <li key={it.id}>
                        {it.namaBarang} — <strong className="text-emerald-400">{it.jumlah} {it.satuan}</strong>
                      </li>
                    ))}
                  </ul>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Keperluan: {keterangan}
                  </div>
                </div>

                {/* Signature Pad */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    Goreskan Tanda Tangan Anda di Sini:
                  </label>
                  <div className="bg-white rounded-2xl p-2 border-2 border-emerald-500/50">
                    <SignaturePad
                      onChange={(has, dataUrl) => {
                        setHasSignature(has);
                        setSignatureData(dataUrl);
                      }}
                      height={180}
                    />
                  </div>
                </div>

                {/* Photo Snap Option */}
                <div className="flex items-center justify-between bg-slate-850 p-3 rounded-2xl border border-slate-700">
                  <div className="text-xs">
                    <span className="font-bold text-slate-200">Foto Bukti Penyerahan (Opsional)</span>
                    <p className="text-[10px] text-slate-400">Ambil swafoto atau foto barang di meja</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsWebcamOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-200 transition"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    {photoData ? 'Foto Terambil (Ulangi)' : 'Ambil Kamera'}
                  </button>
                </div>

                {photoData && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-emerald-500">
                    <img src={photoData} alt="Foto Bukti" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Nav buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setPickupStep(2)}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition"
                  >
                    Kembali Ubah Barang
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalSubmitPickup}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs md:text-sm shadow-xl transition"
                  >
                    <Check className="w-4 h-4" /> Simpan Pengambilan &amp; Cetak Bukti
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: SUKSES & CETAK BUKTI */}
            {pickupStep === 4 && completedRecord && (
              <div className="flex-1 bg-slate-800/60 border border-slate-700 rounded-3xl p-6 md:p-10 flex flex-col items-center justify-center max-w-xl mx-auto w-full text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-xl">
                  <Check className="w-8 h-8" />
                </div>

                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white">
                    Pengambilan Berhasil Dicatat!
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Nomor Bukti Transaksi:{' '}
                    <span className="font-mono text-emerald-400 font-bold">
                      #{completedRecord.no.toString().padStart(4, '0')} ({completedRecord.id})
                    </span>
                  </p>
                </div>

                {/* Digital Receipt Card */}
                <div className="w-full bg-white text-slate-900 rounded-3xl p-5 text-left text-xs space-y-3 shadow-2xl">
                  <div className="text-center border-b border-slate-200 pb-2.5">
                    <h3 className="font-black text-sm uppercase tracking-wide">
                      {config.schoolName}
                    </h3>
                    <p className="text-[10px] text-slate-500">Tanda Terima Pengambilan ATK Digital</p>
                    <p className="text-[9px] text-slate-400 font-mono">
                      Waktu: {formatTanggalIndo(new Date())}
                    </p>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nama Penerima:</span>
                      <span className="font-bold">{completedRecord.user.nama}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Jabatan:</span>
                      <span>{completedRecord.user.jabatan}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-2">
                    <div className="font-bold text-[11px] mb-1">Rincian Barang:</div>
                    <ul className="space-y-1">
                      {completedRecord.items.map((it: any) => (
                        <li key={it.id} className="flex justify-between font-mono text-[11px]">
                          <span>{it.namaBarang}</span>
                          <span className="font-bold">x{it.jumlah} {it.satuan}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {completedRecord.paraf && (
                    <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Tanda Tangan Penerima:</span>
                      <img src={completedRecord.paraf} alt="Paraf" className="h-8 object-contain" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-3 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" /> Cetak Slip
                  </button>

                  <button
                    onClick={handleResetPickup}
                    className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <RotateCcw className="w-4 h-4" /> Selesai / Ambil Lagi
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CEK STOK CEPAT */}
        {activeTab === 'cek_stok' && (
          <div className="flex-1 bg-slate-800/60 border border-slate-700 rounded-3xl p-6 md:p-8 flex flex-col space-y-5">
            <div>
              <h2 className="text-lg md:text-xl font-black text-white">
                Pencarian Informasi Stok Barang Sekolah
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Ketik nama barang untuk melihat sisa stok riil di gudang secara langsung.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={stockSearchQuery}
                onChange={(e) => setStockSearchQuery(e.target.value)}
                placeholder="Cari nama spidol, kertas, baterai, perlengkapan kebersihan..."
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl pl-11 pr-4 py-3 text-xs md:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[60vh] pr-1">
              {stockSummary
                .filter((s) =>
                  s.namaBarang.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
                  s.kodeBarang.toLowerCase().includes(stockSearchQuery.toLowerCase())
                )
                .map((item) => (
                  <div
                    key={item.kodeBarang}
                    className="bg-slate-850 p-4 rounded-2xl border border-slate-700/80 flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-white leading-tight">
                          {item.namaBarang}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            item.status === 'AMAN'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : item.status === 'MINIMUM'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Kategori: {item.kategori} • Satuan: {item.jenisSatuan}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Sisa Fisik:</span>
                      <span className="font-mono font-black text-sm text-emerald-400">
                        {item.stok} {item.jenisSatuan}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: LAPOR KERUSAKAN */}
        {activeTab === 'lapor_rusak' && (
          <div className="flex-1 bg-slate-800/60 border border-slate-700 rounded-3xl p-6 md:p-8 flex flex-col max-w-2xl mx-auto w-full space-y-6">
            <div>
              <h2 className="text-lg md:text-xl font-black text-white">
                Lapor Cepat Fasilitas / Peralatan Rusak
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Laporan ini akan langsung diteruskan ke agenda perbaikan teknisi sekolah.
              </p>
            </div>

            {damageSubmitted ? (
              <div className="p-8 text-center space-y-4 bg-slate-850 rounded-2xl border border-slate-700">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7" />
                </div>
                <h3 className="font-black text-base text-white">Laporan Berhasil Diterima</h3>
                <p className="text-xs text-slate-300">
                  Terima kasih telah melaporkan kendala sarana belajar. Pengurus barang akan segera menindaklanjuti.
                </p>
                <button
                  onClick={() => {
                    setDamageSubmitted(false);
                    setDamageDesc('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  Buat Laporan Lain
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitDamage} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Pilih Peralatan yang Rusak
                  </label>
                  <select
                    value={damageAssetCode}
                    onChange={(e) => setDamageAssetCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    {assets.map((a) => (
                      <option key={a.kodeAset} value={a.kodeAset}>
                        [{a.kodeAset}] {a.namaBarang} - {a.lokasi}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Tingkat Kerusakan
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDamageCondition('RUSAK_RINGAN')}
                      className={`p-3 rounded-xl border text-center transition ${
                        damageCondition === 'RUSAK_RINGAN'
                          ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                          : 'border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold">Rusak Ringan</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Butuh servis kecil</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDamageCondition('RUSAK_BERAT')}
                      className={`p-3 rounded-xl border text-center transition ${
                        damageCondition === 'RUSAK_BERAT'
                          ? 'border-rose-500 bg-rose-500/20 text-rose-300 font-bold'
                          : 'border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold">Rusak Berat</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Mati total / patah</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Deskripsi Masalah / Kronologi
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={damageDesc}
                    onChange={(e) => setDamageDesc(e.target.value)}
                    placeholder="Contoh: Kabel power tidak menyala atau proyektor bergaris saat dinyalakan..."
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl p-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs md:text-sm shadow-lg transition"
                >
                  Kirim Laporan Kerusakan
                </button>
              </form>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <WebcamCaptureModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={(img) => setPhotoData(img)}
      />

      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onMutasiAsset={() => {}}
        onServiceAsset={() => {}}
      />
    </div>
  );
};
