import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  Plus,
  Minus,
  Trash2,
  Check,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Sparkles,
  Printer,
  RotateCcw,
  Volume2,
  VolumeX,
  FileText,
  User,
  Store,
  Calendar,
  Building2,
  X,
  ScanLine,
  ClipboardList,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileSignature,
  ArrowLeft,
  Clock,
  Maximize2,
  Minimize2,
  Package,
  Share2,
  Copy,
  Download,
  Receipt,
  HelpCircle,
  Tag,
  CheckCheck,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { MasterItem } from '../types';
import { formatRupiah, formatTanggalIndo, generateQrCodeUrl, angkaKeTerbilang } from '../utils/format';
import { soundEffects } from '../utils/audio';
import { SignaturePad } from '../components/SignaturePad';
import { QrScannerModal } from '../components/QrScannerModal';

interface TerminalLogistikPageProps {
  onExitTerminal?: () => void;
}

interface CartItem {
  item: MasterItem;
  jumlah: number;
  hargaSatuan: number;
  currentStock: number;
  kodeRekeningRkas?: string;
}

interface CompletedTransaction {
  type: 'MASUK' | 'KELUAR';
  tanggal: string;
  jam: string;
  nomorBukti: string;
  nomorBku?: string;
  pihak: string; // Toko untuk Masuk, Penerima untuk Keluar
  nipPihak?: string;
  jabatanPihak?: string;
  ruangan?: string;
  tujuan?: string;
  sumberAnggaran?: string;
  items: {
    namaBarang: string;
    kodeBarang: string;
    jumlah: number;
    satuan: string;
    hargaSatuan: number;
    total: number;
    kodeRekening?: string;
  }[];
  totalNilai: number;
  totalJumlahItem: number;
  signatureData?: string;
  petugas: string;
  petugasNip?: string;
  qrCodeUrl?: string;
  securityHash?: string;
}

export const TerminalLogistikPage: React.FC<TerminalLogistikPageProps> = ({ onExitTerminal }) => {
  const {
    items,
    suppliers,
    users,
    stockSummary,
    config,
    addBarangMasukBatch,
    addBarangKeluarBatch,
    addSupplier,
  } = useInventory();
  const { showToast, confirmDialog } = useToast();

  // Mode Utama: KELUAR (Kios Guru) vs MASUK (Penerimaan Logistik)
  const [mode, setMode] = useState<'KELUAR' | 'MASUK'>('KELUAR');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live Digital Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Search & Catalog Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeInputTab, setActiveInputTab] = useState<'katalog' | 'guru' | 'barcode' | 'smart_text' | 'paket'>('katalog');

  // Barcode Input
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeQty, setBarcodeQty] = useState(1);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Smart Text Parser
  const [smartTextInput, setSmartTextInput] = useState('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // State Header - Barang Masuk
  const [namaToko, setNamaToko] = useState(suppliers[0]?.namaToko || 'Toko Buku & ATK Barokah');
  const [nomorKwitansi, setNomorKwitansi] = useState(
    `KWT/BOS/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`
  );
  const [nomorBku, setNomorBku] = useState(
    `BKU-BOS/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(10 + Math.random() * 90)}`
  );
  const [sumberAnggaran, setSumberAnggaran] = useState<'BOS Reguler' | 'BOS Kinerja' | 'BOP Daerah' | 'DAK Fisik'>('BOS Reguler');
  const [bulanPengadaan, setBulanPengadaan] = useState(
    new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date())
  );
  const [keteranganMasuk, setKeteranganMasuk] = useState('Pengadaan logistik operasional sekolah');

  // State Header - Barang Keluar (Kios Guru)
  const [selectedTeacherNip, setSelectedTeacherNip] = useState(users[0]?.nip || '');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [penerima, setPenerima] = useState(users[0]?.nama || 'Dewi Lestari, S.Pd.SD');
  const [unitRuangan, setUnitRuangan] = useState('Ruang Guru');
  const [tujuanPenggunaan, setTujuanPenggunaan] = useState('Pembelajaran KBM Kelas & Administrasi');
  const [keteranganKeluar, setKeteranganKeluar] = useState('Kebutuhan operasional pembelajaran guru');
  const [withSignature, setWithSignature] = useState(true);
  const [recipientSignature, setRecipientSignature] = useState<string>('');

  // New Supplier Quick Modal
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');

  // Completed Transaction Modal (Receipt / Bukti Serah Terima)
  const [completedDoc, setCompletedDoc] = useState<CompletedTransaction | null>(null);
  const [receiptViewFormat, setReceiptViewFormat] = useState<'thermal' | 'official'>('thermal');
  const [copySuccess, setCopySuccess] = useState(false);

  // Quick Preset Rooms & Purposes
  const quickRooms = [
    'Ruang Guru',
    'Kelas 1',
    'Kelas 2',
    'Kelas 3',
    'Kelas 4',
    'Kelas 5',
    'Kelas 6',
    'Lab Komputer',
    'Lab IPA',
    'Perpustakaan',
    'UKS',
    'TU / Administrasi',
  ];

  const quickPurposes = [
    'Pembelajaran Tematik KBM',
    'Asesmen & Ujian Semester',
    'Praktik Siswa & Kesenian',
    'Administrasi Kelas & Guru',
    'Kebersihan & Sanitasi Kelas',
    'Kegiatan Ekstrakurikuler',
  ];

  // Stock Map for instant O(1) lookup
  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    stockSummary.forEach((s) => {
      map.set(s.kodeBarang, s.stok);
    });
    return map;
  }, [stockSummary]);

  // Sync sound settings
  useEffect(() => {
    soundEffects.enabled = soundEnabled;
  }, [soundEnabled]);

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Categories list
  const categories = useMemo(() => {
    const cats = Array.from(new Set(items.map((i) => i.kategori)));
    return ['ALL', ...cats];
  }, [items]);

  // Active Selected User
  const activeSelectedUser = useMemo(() => {
    return users.find((u) => u.nip === selectedTeacherNip) || users[0];
  }, [users, selectedTeacherNip]);

  // Filtered Teachers
  const filteredTeachers = useMemo(() => {
    return users.filter(
      (u) =>
        u.status === 'AKTIF' &&
        (u.nama.toLowerCase().includes(teacherSearch.toLowerCase()) ||
          u.nip.toLowerCase().includes(teacherSearch.toLowerCase()) ||
          u.jabatan.toLowerCase().includes(teacherSearch.toLowerCase()))
    );
  }, [users, teacherSearch]);

  // Filtered Items for Catalog
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = selectedCategory === 'ALL' || item.kategori === selectedCategory;
      const matchSearch =
        item.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kodeBarang.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  // Select Teacher Handler
  const handleSelectTeacher = (user: (typeof users)[0]) => {
    setSelectedTeacherNip(user.nip);
    setPenerima(user.nama);
    soundEffects.playAdd();
  };

  // Add Item to Cart
  const handleAddToCart = (item: MasterItem, qtyToAdd: number = 1) => {
    const currentStock = stockMap.get(item.kodeBarang) ?? 0;

    // Check if adding exceeds stock in KELUAR mode
    if (mode === 'KELUAR') {
      const existingInCart = cart.find((c) => c.item.kodeBarang === item.kodeBarang)?.jumlah || 0;
      if (existingInCart + qtyToAdd > currentStock) {
        soundEffects.playWarning();
        showToast(
          `Perhatian: Stok "${item.namaBarang}" tidak mencukupi! Sisa stok di gudang hanya ${currentStock} ${item.jenisSatuan}.`,
          'warning'
        );
        return;
      }
    }

    soundEffects.playAdd();

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((c) => c.item.kodeBarang === item.kodeBarang);
      if (existingIndex >= 0) {
        const next = [...prevCart];
        next[existingIndex] = {
          ...next[existingIndex],
          jumlah: next[existingIndex].jumlah + qtyToAdd,
        };
        return next;
      } else {
        return [
          ...prevCart,
          {
            item,
            jumlah: qtyToAdd,
            hargaSatuan: item.hargaEstimasi || 0,
            currentStock,
            kodeRekeningRkas: item.kodeRekeningRkas || '5.2.2.01.01',
          },
        ];
      }
    });
  };

  // Update Cart Item Quantity
  const handleUpdateQty = (kodeBarang: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(kodeBarang);
      return;
    }

    if (mode === 'KELUAR') {
      const currentStock = stockMap.get(kodeBarang) ?? 0;
      if (newQty > currentStock) {
        soundEffects.playWarning();
        showToast(`Jumlah pengeluaran melebihi sisa stok gudang (${currentStock})!`, 'warning');
        return;
      }
    }

    setCart((prev) =>
      prev.map((c) => (c.item.kodeBarang === kodeBarang ? { ...c, jumlah: newQty } : c))
    );
  };

  // Update Cart Item Unit Price (For Masuk)
  const handleUpdatePrice = (kodeBarang: string, price: number) => {
    setCart((prev) =>
      prev.map((c) =>
        c.item.kodeBarang === kodeBarang ? { ...c, hargaSatuan: Math.max(0, price) } : c
      )
    );
  };

  // Remove Item from Cart
  const handleRemoveFromCart = (kodeBarang: string) => {
    setCart((prev) => prev.filter((c) => c.item.kodeBarang !== kodeBarang));
  };

  // Clear Cart
  const handleClearCart = async () => {
    if (cart.length === 0) return;
    const confirmed = await confirmDialog({
      title: 'Kosongkan Keranjang?',
      message: 'Yakin ingin mengosongkan seluruh item belanja/pengambilan di keranjang?',
      confirmText: 'Kosongkan Keranjang',
      variant: 'warning',
    });
    if (confirmed) {
      setCart([]);
      setBarcodeInput('');
      setSmartTextInput('');
      soundEffects.playWarning();
      showToast('Keranjang transaksi berhasil dikosongkan.', 'info');
    }
  };

  // Barcode Submit
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = barcodeInput.trim().toUpperCase();
    if (!cleanCode) return;

    const matched = items.find(
      (i) => i.kodeBarang.toUpperCase() === cleanCode || i.namaBarang.toUpperCase().includes(cleanCode)
    );

    if (matched) {
      handleAddToCart(matched, barcodeQty);
      setBarcodeInput('');
      setBarcodeQty(1);
    } else {
      soundEffects.playWarning();
      showToast(`Barang dengan kode atau nama "${cleanCode}" tidak ditemukan di database.`, 'error');
    }

    barcodeInputRef.current?.focus();
  };

  // Smart Text Parser Execution
  const handleParseSmartText = () => {
    if (!smartTextInput.trim()) return;

    const lines = smartTextInput
      .split(/\n|,|;/)
      .map((l) => l.trim())
      .filter(Boolean);
    let addedCount = 0;

    lines.forEach((line) => {
      const numberMatch = line.match(/\b(\d+)\b/);
      const qty = numberMatch ? parseInt(numberMatch[1], 10) : 1;
      const textWithoutNum = line.replace(/\b\d+\b/, '').trim().toLowerCase();

      const matched = items.find((it) => {
        const itemWords = it.namaBarang.toLowerCase().split(/\s+/);
        return itemWords.some((w) => w.length > 3 && textWithoutNum.includes(w));
      });

      if (matched) {
        handleAddToCart(matched, qty);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      soundEffects.playAdd();
      showToast(`Berhasil mengenali dan menambahkan ${addedCount} jenis barang ke keranjang!`, 'success');
      setSmartTextInput('');
    } else {
      soundEffects.playWarning();
      showToast('Tidak ada barang yang cocok dari teks tersebut. Pastikan nama barang sesuai katalog.', 'warning');
    }
  };

  // Preset Bundles
  const applyPresetBundle = (bundleType: 'kbm' | 'pts' | 'sanitasi' | 'rapor') => {
    if (bundleType === 'kbm') {
      const a4 = items.find((i) => i.namaBarang.toLowerCase().includes('a4'));
      const spidol = items.find((i) => i.namaBarang.toLowerCase().includes('spidol'));
      const sabun = items.find((i) => i.namaBarang.toLowerCase().includes('sabun'));
      if (a4) handleAddToCart(a4, 2);
      if (spidol) handleAddToCart(spidol, 2);
      if (sabun) handleAddToCart(sabun, 1);
    } else if (bundleType === 'pts') {
      const f4 = items.find((i) => i.namaBarang.toLowerCase().includes('f4'));
      const a4 = items.find((i) => i.namaBarang.toLowerCase().includes('a4'));
      const spidol = items.find((i) => i.namaBarang.toLowerCase().includes('spidol'));
      if (f4) handleAddToCart(f4, 5);
      if (a4) handleAddToCart(a4, 3);
      if (spidol) handleAddToCart(spidol, 2);
    } else if (bundleType === 'sanitasi') {
      const wipol = items.find(
        (i) => i.namaBarang.toLowerCase().includes('wipol') || i.namaBarang.toLowerCase().includes('pembersih')
      );
      const sabun = items.find((i) => i.namaBarang.toLowerCase().includes('sabun'));
      if (wipol) handleAddToCart(wipol, 3);
      if (sabun) handleAddToCart(sabun, 3);
    } else if (bundleType === 'rapor') {
      const f4 = items.find((i) => i.namaBarang.toLowerCase().includes('f4'));
      if (f4) handleAddToCart(f4, 6);
    }
    soundEffects.playAdd();
  };

  // Quick Add Supplier
  const handleQuickAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;

    addSupplier({
      namaToko: newSupplierName.trim(),
      telepon: newSupplierPhone.trim() || '-',
      alamat: newSupplierAddress.trim() || '-',
      narahubung: 'Kasir Toko',
      status: 'AKTIF',
    });

    setNamaToko(newSupplierName.trim());
    setIsNewSupplierModalOpen(false);
    setNewSupplierName('');
    setNewSupplierPhone('');
    setNewSupplierAddress('');
  };

  // Totals in Cart
  const cartTotals = useMemo(() => {
    const totalTypes = cart.length;
    const totalQty = cart.reduce((sum, c) => sum + c.jumlah, 0);
    const totalValue = cart.reduce((sum, c) => sum + c.jumlah * c.hargaSatuan, 0);
    const hasInsufficientStock = mode === 'KELUAR' && cart.some((c) => c.jumlah > c.currentStock);
    return { totalTypes, totalQty, totalValue, hasInsufficientStock };
  }, [cart, mode]);

  // Checkout Transaction Execution
  const handleProcessCheckout = async () => {
    if (cart.length === 0) {
      showToast('Keranjang transaksi masih kosong. Silakan pilih barang terlebih dahulu.', 'warning');
      return;
    }

    if (mode === 'KELUAR' && cartTotals.hasInsufficientStock) {
      soundEffects.playWarning();
      showToast('Transaksi tidak dapat diproses karena ada barang dengan kuantitas melebihi sisa stok gudang!', 'error');
      return;
    }

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const jamStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';

    const docNumber =
      mode === 'MASUK'
        ? nomorKwitansi
        : `SPB-${now.getFullYear()}-${now.getTime().toString().slice(-6)}`;

    const securityHash = `SEC-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    // Generate Verification QR Code URL
    const qrData = `VERIFIKASI-SIMSARPRAS|NPSN:${config.npsn}|TIPE:${mode}|DOC:${docNumber}|TGL:${today}|ITEM:${cartTotals.totalTypes}|QTY:${cartTotals.totalQty}|TOTAL_RP:${cartTotals.totalValue}|PETUGAS:${config.warehouseOfficer}|HASH:${securityHash}`;
    const qrUrl = await generateQrCodeUrl(qrData);

    if (mode === 'MASUK') {
      const batchData = cart.map((c) => ({
        tanggal: today,
        bulanPengadaan,
        namaToko,
        kodeBarang: c.item.kodeBarang,
        namaBarang: c.item.namaBarang,
        jumlah: c.jumlah,
        jenisSatuan: c.item.jenisSatuan,
        hargaSatuan: c.hargaSatuan,
        namaSekolah: config.schoolName,
        sumberAnggaran,
        kodeRekeningRkas: c.kodeRekeningRkas || c.item.kodeRekeningRkas || '5.2.2.01.01',
        nomorBku,
        nomorKwitansi,
        petugas: config.warehouseOfficer,
        keterangan: keteranganMasuk,
      }));

      addBarangMasukBatch(batchData);
      soundEffects.playSuccess();

      setCompletedDoc({
        type: 'MASUK',
        tanggal: today,
        jam: jamStr,
        nomorBukti: nomorKwitansi,
        nomorBku,
        pihak: namaToko,
        sumberAnggaran,
        items: cart.map((c) => ({
          namaBarang: c.item.namaBarang,
          kodeBarang: c.item.kodeBarang,
          jumlah: c.jumlah,
          satuan: c.item.jenisSatuan,
          hargaSatuan: c.hargaSatuan,
          total: c.jumlah * c.hargaSatuan,
          kodeRekening: c.kodeRekeningRkas || c.item.kodeRekeningRkas || '5.2.2.01.01',
        })),
        totalNilai: cartTotals.totalValue,
        totalJumlahItem: cartTotals.totalQty,
        petugas: config.warehouseOfficer,
        petugasNip: config.warehouseOfficerNip,
        qrCodeUrl: qrUrl,
        securityHash,
      });

      setCart([]);
      setNomorKwitansi(`KWT/BOS/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`);
      setNomorBku(
        `BKU-BOS/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(10 + Math.random() * 90)}`
      );
    } else {
      const activeUserRecord = users.find((u) => u.nama === penerima) || activeSelectedUser;

      const batchData = cart.map((c) => ({
        tanggal: today,
        kodeBarang: c.item.kodeBarang,
        namaBarang: c.item.namaBarang,
        jumlah: c.jumlah,
        jenisSatuan: c.item.jenisSatuan,
        penerima,
        unitRuangan,
        tujuanPenggunaan,
        petugas: config.warehouseOfficer,
        parafLink: recipientSignature || undefined,
        keterangan: keteranganKeluar,
      }));

      addBarangKeluarBatch(batchData);
      soundEffects.playSuccess();

      setCompletedDoc({
        type: 'KELUAR',
        tanggal: today,
        jam: jamStr,
        nomorBukti: docNumber,
        pihak: penerima,
        nipPihak: activeUserRecord?.nip || '-',
        jabatanPihak: activeUserRecord?.jabatan || 'Guru / Staf',
        ruangan: unitRuangan,
        tujuan: tujuanPenggunaan,
        items: cart.map((c) => ({
          namaBarang: c.item.namaBarang,
          kodeBarang: c.item.kodeBarang,
          jumlah: c.jumlah,
          satuan: c.item.jenisSatuan,
          hargaSatuan: c.hargaSatuan,
          total: c.jumlah * c.hargaSatuan,
        })),
        totalNilai: cartTotals.totalValue,
        totalJumlahItem: cartTotals.totalQty,
        signatureData: recipientSignature,
        petugas: config.warehouseOfficer,
        petugasNip: config.warehouseOfficerNip,
        qrCodeUrl: qrUrl,
        securityHash,
      });

      setCart([]);
      setRecipientSignature('');
    }
  };

  // Keyboard shortcut listener: F9 to checkout, F2 to switch mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        handleProcessCheckout();
      } else if (e.key === 'F2') {
        e.preventDefault();
        setMode((prev) => (prev === 'MASUK' ? 'KELUAR' : 'MASUK'));
        soundEffects.playClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, mode, cartTotals, namaToko, nomorKwitansi, nomorBku, penerima, unitRuangan, recipientSignature]);

  // Copy receipt summary to WhatsApp
  const handleCopySummaryToWhatsApp = () => {
    if (!completedDoc) return;

    const isMasuk = completedDoc.type === 'MASUK';
    const lines = [
      `*${isMasuk ? 'BUKTI PENERIMAAN PENGADAAN BARANG MASUK' : 'BUKTI PENGELUARAN & SERAH TERIMA LOGISTIK'}*`,
      `🏫 *${config.schoolName}*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📄 No. Dokumen : ${completedDoc.nomorBukti}`,
      `📅 Waktu        : ${formatTanggalIndo(completedDoc.tanggal)} (${completedDoc.jam})`,
      `${isMasuk ? '🏪 Penyedia    :' : '👨‍🏫 Penerima    :'} ${completedDoc.pihak} ${completedDoc.nipPihak ? `(NIP: ${completedDoc.nipPihak})` : ''}`,
      isMasuk
        ? `💰 Anggaran    : ${completedDoc.sumberAnggaran || 'BOS Reguler'} | BKU: ${completedDoc.nomorBku || '-'}`
        : `📍 Peruntukan  : ${completedDoc.ruangan} - ${completedDoc.tujuan}`,
      `👤 Petugas     : ${completedDoc.petugas}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `*RINCIAN BARANG:*`,
      ...completedDoc.items.map(
        (it, idx) => `${idx + 1}. ${it.namaBarang} (${it.jumlah} ${it.satuan})${isMasuk ? ` - ${formatRupiah(it.total)}` : ''}`
      ),
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📦 Total Kuantitas : ${completedDoc.totalJumlahItem} unit fisik`,
      isMasuk ? `💵 Total Nilai     : ${formatRupiah(completedDoc.totalNilai)}` : '',
      `🔐 Status Audit    : E-VERIFIED (${completedDoc.securityHash})`,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `_Tercatat otomatis di Sistem Persediaan & Logistik SIM-SARPRAS._`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(lines).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    });
  };

  // Download printable standalone HTML receipt
  const handleDownloadHtml = () => {
    if (!completedDoc) return;
    const isMasuk = completedDoc.type === 'MASUK';
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bukti Transaksi - ${completedDoc.nomorBukti}</title>
  <style>
    body { font-family: monospace; padding: 20px; max-width: 480px; margin: auto; color: #111; line-height: 1.4; }
    .center { text-align: center; }
    .line { border-bottom: 1px dashed #333; margin: 10px 0; }
    .bold { font-weight: bold; }
    .flex { display: flex; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th, td { text-align: left; padding: 4px 0; font-size: 12px; }
    td.right { text-align: right; }
    .qr { margin-top: 15px; text-align: center; }
  </style>
</head>
<body>
  <div class="center">
    <h3 style="margin:0">${config.schoolName}</h3>
    <div style="font-size:11px">${config.address} • NPSN: ${config.npsn}</div>
    <div class="line"></div>
    <div class="bold" style="font-size:13px">${isMasuk ? 'BUKTI PENERIMAAN BARANG MASUK' : 'BUKTI SERAH TERIMA PENGELUARAN BARANG'}</div>
    <div style="font-size:11px">No: ${completedDoc.nomorBukti}</div>
    <div style="font-size:11px">${formatTanggalIndo(completedDoc.tanggal)} • ${completedDoc.jam}</div>
  </div>
  <div class="line"></div>
  <div class="flex" style="font-size:11px">
    <span>${isMasuk ? 'Penyedia / Toko:' : 'Penerima (Guru):'}</span>
    <span class="bold">${completedDoc.pihak}</span>
  </div>
  ${completedDoc.ruangan ? `<div class="flex" style="font-size:11px"><span>Ruangan / Tujuan:</span><span>${completedDoc.ruangan} - ${completedDoc.tujuan}</span></div>` : ''}
  <div class="flex" style="font-size:11px"><span>Petugas Logistik:</span><span>${completedDoc.petugas}</span></div>
  <div class="line"></div>
  <table>
    <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th class="right">Total</th></tr></thead>
    <tbody>
      ${completedDoc.items
        .map(
          (i) =>
            `<tr><td>${i.namaBarang}</td><td style="text-align:center">${i.jumlah} ${i.satuan}</td><td class="right">${isMasuk ? formatRupiah(i.total) : `${i.jumlah} unit`}</td></tr>`
        )
        .join('')}
    </tbody>
  </table>
  <div class="line"></div>
  <div class="flex bold">
    <span>TOTAL KUANTITAS:</span>
    <span>${completedDoc.totalJumlahItem} Unit</span>
  </div>
  ${isMasuk ? `<div class="flex bold" style="font-size:14px"><span>TOTAL BIAYA:</span><span>${formatRupiah(completedDoc.totalNilai)}</span></div>` : ''}
  <div class="center qr">
    <div style="font-size:10px; margin-top:8px">SECURITY AUDIT ID: ${completedDoc.securityHash}</div>
    <div style="font-size:10px; color:#555">Validasi Elektronik SIM-SARPRAS</div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resi_${completedDoc.nomorBukti.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* ========================================================================= */}
      {/* STANDALONE KIOSK TOP BAR (IMMERSIVE TOUCH EXPERIENCE) */}
      {/* ========================================================================= */}
      <header className="no-print bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-3 flex items-center justify-between shadow-2xl sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {onExitTerminal && (
            <button
              onClick={async () => {
                if (cart.length > 0) {
                  const confirmed = await confirmDialog({
                    title: 'Keluar dari Terminal?',
                    message: 'Keranjang transaksi masih memiliki barang. Yakin ingin keluar dari Terminal Logistik?',
                    confirmText: 'Ya, Keluar',
                    variant: 'warning',
                  });
                  if (confirmed) {
                    onExitTerminal();
                  }
                } else {
                  onExitTerminal();
                }
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold border border-slate-700 shadow-sm cursor-pointer"
              title="Keluar dari Kios ke Portal Administrasi"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Portal Admin</span>
            </button>
          )}

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20 text-lg">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-sm md:text-base text-white tracking-tight flex items-center gap-1.5">
                Kios Mandiri Guru &amp; Terminal Logistik
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-400/30 uppercase tracking-wider">
                STANDALONE KIOSK
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>{config.schoolName}</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">Pengurus: {config.warehouseOfficer}</span>
            </p>
          </div>
        </div>

        {/* Master Dual-Mode Selector in Top Bar */}
        <div className="flex items-center gap-2.5">
          <div className="flex bg-slate-850 p-1 rounded-2xl border border-slate-700/80 shadow-inner text-xs">
            <button
              onClick={() => {
                setMode('KELUAR');
                soundEffects.playAdd();
              }}
              className={`px-4 py-2 rounded-xl font-black transition flex items-center gap-2 cursor-pointer ${
                mode === 'KELUAR'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 ring-1 ring-blue-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpFromLine className="w-4 h-4 text-blue-200" />
              <div className="text-left">
                <div className="text-xs font-black leading-tight">Kios Guru (Ambil Barang)</div>
                <div className="text-[9px] opacity-75 font-normal hidden md:block">Distribusi &amp; Tanda Tangan</div>
              </div>
            </button>

            <button
              onClick={() => {
                setMode('MASUK');
                soundEffects.playAdd();
              }}
              className={`px-4 py-2 rounded-xl font-black transition flex items-center gap-2 cursor-pointer ${
                mode === 'MASUK'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 ring-1 ring-emerald-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownToLine className="w-4 h-4 text-emerald-200" />
              <div className="text-left">
                <div className="text-xs font-black leading-tight">Penerimaan (Barang Masuk)</div>
                <div className="text-[9px] opacity-75 font-normal hidden md:block">Pengadaan &amp; Belanja BOS</div>
              </div>
            </button>
          </div>

          {/* Live Digital Clock */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 font-mono text-xs font-bold">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <span className="text-amber-400 font-black">{currentTime.toLocaleTimeString('id-ID')}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
            title={soundEnabled ? 'Matikan Suara Audio' : 'Aktifkan Suara Audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition hidden sm:block"
            title="Layar Penuh Kiosk"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* KIOSK MAIN CONTENT WORKSPACE */}
      {/* ========================================================================= */}
      <main className="no-print flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: MULTI-INPUT ENGINES */}
        <div className="lg:col-span-7 space-y-4">
          {/* Sub Navigation for Input Modes */}
          <div className="bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-md flex flex-wrap gap-1 text-xs font-bold">
            {mode === 'KELUAR' && (
              <button
                onClick={() => setActiveInputTab('guru')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  activeInputTab === 'guru'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" /> Pilih Guru &amp; Ruang
              </button>
            )}

            <button
              onClick={() => setActiveInputTab('katalog')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeInputTab === 'katalog'
                  ? mode === 'KELUAR'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Katalog Visual
            </button>

            <button
              onClick={() => {
                setActiveInputTab('barcode');
                setTimeout(() => barcodeInputRef.current?.focus(), 100);
              }}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeInputTab === 'barcode'
                  ? mode === 'KELUAR'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ScanLine className="w-3.5 h-3.5" /> Barcode &amp; Scanner
            </button>

            <button
              onClick={() => setActiveInputTab('paket')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeInputTab === 'paket'
                  ? mode === 'KELUAR'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Paket Kilat KBM
            </button>

            <button
              onClick={() => setActiveInputTab('smart_text')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeInputTab === 'smart_text'
                  ? mode === 'KELUAR'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" /> Salin Teks / Nota
            </button>
          </div>

          {/* TAB: PILIH GURU (KHUSUS MODE KIOS GURU) */}
          {activeInputTab === 'guru' && mode === 'KELUAR' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm md:text-base font-black text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" /> Pilih Identitas Guru Pengambil
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Sentuh salah satu nama guru di bawah ini untuk mencatat tanda terima resmi.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400">Terpilih:</span>
                  <div className="text-xs font-black text-emerald-400">{penerima}</div>
                </div>
              </div>

              {/* Search Guru */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  placeholder="Ketik nama guru, NIP, atau mata pelajaran..."
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Grid Guru Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredTeachers.map((user) => {
                  const isSelected = selectedTeacherNip === user.nip || penerima === user.nama;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectTeacher(user)}
                      className={`p-3 rounded-2xl text-left transition flex items-center gap-3 border cursor-pointer ${
                        isSelected
                          ? 'bg-blue-950/70 border-blue-500 ring-2 ring-blue-500/30'
                          : 'bg-slate-850 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {user.nama.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-white truncate">{user.nama}</div>
                        <div className="text-[10px] text-slate-400 truncate">{user.jabatan}</div>
                        <div className="text-[9px] text-slate-500 font-mono">NIP. {user.nip}</div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Quick Destination Chips */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block">Ruangan / Unit Pemakai:</span>
                <div className="flex flex-wrap gap-1.5">
                  {quickRooms.map((room) => (
                    <button
                      key={room}
                      type="button"
                      onClick={() => setUnitRuangan(room)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        unitRuangan === room
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {room}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Purpose Chips */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block">Tujuan Penggunaan:</span>
                <div className="flex flex-wrap gap-1.5">
                  {quickPurposes.map((purp) => (
                    <button
                      key={purp}
                      type="button"
                      onClick={() => setTujuanPenggunaan(purp)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        tujuanPenggunaan === purp
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {purp}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: VISUAL CATALOG */}
          {activeInputTab === 'katalog' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              {/* Category Filter Pills & Search */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari spidol, kertas HVS, buku, lakban, bola, kabel..."
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                        selectedCategory === cat
                          ? mode === 'KELUAR'
                            ? 'bg-blue-600 text-white'
                            : 'bg-emerald-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {cat === 'ALL' ? 'Semua Kategori' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
                {filteredItems.map((item) => {
                  const stock = stockMap.get(item.kodeBarang) ?? 0;
                  const inCart = cart.find((c) => c.item.kodeBarang === item.kodeBarang);
                  const isLow = stock <= item.batasMinimum && stock > 0;
                  const isOutOfStock = stock <= 0;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition flex flex-col justify-between space-y-2.5 relative ${
                        inCart
                          ? 'bg-slate-850 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-slate-850/80 hover:bg-slate-800 border-slate-700/80'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1.5 mb-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                            {item.kodeBarang}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-md font-black ${
                              isOutOfStock
                                ? 'bg-rose-500/20 text-rose-400'
                                : isLow
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            Stok: {stock} {item.jenisSatuan}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-white leading-tight line-clamp-2">
                          {item.namaBarang}
                        </h4>

                        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                          <span>{item.kategori}</span>
                          <span className="font-mono text-slate-300">
                            {formatRupiah(item.hargaEstimasi)}
                          </span>
                        </div>
                      </div>

                      {/* Add Button / Stepper */}
                      <div className="pt-2 border-t border-slate-750 flex items-center justify-between">
                        {inCart ? (
                          <div className="flex items-center gap-1.5 w-full justify-between">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.kodeBarang, inCart.jumlah - 1)}
                              className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center text-xs cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-black text-xs text-emerald-400 font-mono">
                              {inCart.jumlah} {item.jenisSatuan}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddToCart(item, 1)}
                              className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center text-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={mode === 'KELUAR' && isOutOfStock}
                            onClick={() => handleAddToCart(item, 1)}
                            className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              mode === 'KELUAR' && isOutOfStock
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : mode === 'KELUAR'
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{mode === 'KELUAR' ? 'Ambil' : 'Terima'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: BARCODE & SCANNER */}
          {activeInputTab === 'barcode' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <ScanLine className="w-5 h-5 text-emerald-400" /> Pemindai Barcode &amp; Scanner Gun
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Arahkan scanner gun fisik atau gunakan kamera perangkat untuk input super kilat.
                  </p>
                </div>

                <button
                  onClick={() => setIsQrScannerOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" /> Buka Kamera QR
                </button>
              </div>

              <form onSubmit={handleBarcodeSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-3">
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Scan atau Ketik Kode Barang / Nama
                    </label>
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      autoFocus
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="Contoh: ELK-001, ATK-002, atau nama spidol..."
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Jumlah</label>
                    <input
                      type="number"
                      min="1"
                      value={barcodeQty}
                      onChange={(e) => setBarcodeQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl px-3 py-3 text-sm font-mono text-center font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs md:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Masukkan ke Keranjang Transaksi
                </button>
              </form>
            </div>
          )}

          {/* TAB: PAKET KILAT KBM */}
          {activeInputTab === 'paket' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" /> Paket Kebutuhan Kilat Sekolah
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tambahkan paket set perlengkapan lengkap dalam 1 sentuhan tanpa perlu memilih satu per satu.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => applyPresetBundle('kbm')}
                  className="p-4 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-left transition space-y-2 group cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs md:text-sm text-white group-hover:text-amber-300">
                      📦 Paket KBM Tematik Kelas
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">
                      Set Harian
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    2 Rim Kertas A4, 2 Spidol Whiteboard Boardmarker, 1 Sabun Cuci Tangan.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetBundle('pts')}
                  className="p-4 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-left transition space-y-2 group cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs md:text-sm text-white group-hover:text-blue-300">
                      📝 Paket Ujian / Asesmen Semester
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-300 font-bold">
                      Set Ujian
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    5 Rim Kertas F4 Folio, 3 Rim Kertas A4, 2 Spidol Merah Koreksi.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetBundle('sanitasi')}
                  className="p-4 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-left transition space-y-2 group cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs md:text-sm text-white group-hover:text-emerald-300">
                      🧹 Paket Sanitasi &amp; Kebersihan
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold">
                      Set Sanitasi
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    3 Botol Karbol / Wipol Lantai, 3 Botol Sabun Cuci Tangan Antiseptik.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetBundle('rapor')}
                  className="p-4 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-left transition space-y-2 group cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs md:text-sm text-white group-hover:text-purple-300">
                      🎓 Paket Raport &amp; Kelulusan
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-300 font-bold">
                      Set Raport
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    6 Rim Kertas F4 Folio 80gr untuk cetak halaman raport dan ijazah siswa.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* TAB: SMART TEXT PARSER */}
          {activeInputTab === 'smart_text' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-emerald-400" /> Parse Teks dari Nota / WhatsApp
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tempel teks daftar belanja dari grup chat atau pesan WhatsApp. Sistem akan mendeteksi otomatis barang &amp; jumlahnya.
                </p>
              </div>

              <textarea
                rows={5}
                value={smartTextInput}
                onChange={(e) => setSmartTextInput(e.target.value)}
                placeholder="Contoh:&#10;5 rim kertas HVS A4&#10;3 spidol whiteboard snowman&#10;2 sabun pembersih lantai"
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl p-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none font-mono"
              />

              <button
                type="button"
                onClick={handleParseSmartText}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs md:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" /> Ekstrak &amp; Masukkan ke Keranjang
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: CART, HEADER METADATA & CHECKOUT */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Cart Header */}
            <div
              className={`p-4 border-b border-slate-800 flex items-center justify-between ${
                mode === 'MASUK' ? 'bg-emerald-950/40' : 'bg-blue-950/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white ${
                    mode === 'MASUK' ? 'bg-emerald-600' : 'bg-blue-600'
                  }`}
                >
                  {mode === 'MASUK' ? <ArrowDownToLine className="w-5 h-5" /> : <ArrowUpFromLine className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-black text-xs md:text-sm text-white">
                    {mode === 'MASUK' ? 'Rincian Penerimaan Barang' : 'Keranjang Kios Guru'}
                  </h3>
                  <div className="text-[10px] text-slate-400">
                    {cartTotals.totalTypes} Jenis Barang • {cartTotals.totalQty} Total Fisik
                  </div>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-rose-400 hover:bg-rose-950/40 border border-rose-800/40 transition cursor-pointer"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Transaction Metadata Input Fields */}
            <div className="p-4 bg-slate-850/60 border-b border-slate-800 space-y-3 text-xs">
              {mode === 'MASUK' ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <label className="font-bold text-slate-300 block">Penyedia / Toko:</label>
                    <button
                      type="button"
                      onClick={() => setIsNewSupplierModalOpen(true)}
                      className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Tambah Toko
                    </button>
                  </div>
                  <select
                    value={namaToko}
                    onChange={(e) => setNamaToko(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.namaToko}>
                        {s.namaToko}
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-400 block mb-0.5">No. Kwitansi / Faktur:</label>
                      <input
                        type="text"
                        value={nomorKwitansi}
                        onChange={(e) => setNomorKwitansi(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-[11px] font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-400 block mb-0.5">Nomor BKU BOS:</label>
                      <input
                        type="text"
                        value={nomorBku}
                        onChange={(e) => setNomorBku(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-[11px] font-mono text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-400 block mb-0.5">Sumber Anggaran:</label>
                      <select
                        value={sumberAnggaran}
                        onChange={(e) => setSumberAnggaran(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-white"
                      >
                        <option value="BOS Reguler">BOS Reguler</option>
                        <option value="BOS Kinerja">BOS Kinerja</option>
                        <option value="BOP Daerah">BOP Daerah</option>
                        <option value="DAK Fisik">DAK Fisik</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-400 block mb-0.5">Bulan Anggaran:</label>
                      <input
                        type="text"
                        value={bulanPengadaan}
                        onChange={(e) => setBulanPengadaan(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-white"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-300 block">Penerima (Guru / Staf):</label>
                      <button
                        type="button"
                        onClick={() => setActiveInputTab('guru')}
                        className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        Pilih Kartu Guru
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <select
                        value={users.some((u) => u.nama === penerima) ? penerima : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            setPenerima(e.target.value);
                            const u = users.find((x) => x.nama === e.target.value);
                            if (u) setUnitRuangan(u.jabatan);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Pilih dari Daftar Pegawai Sekolah --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.nama}>
                            {u.nama} ({u.jabatan})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        list="penerima-options-standalone"
                        value={penerima}
                        onChange={(e) => setPenerima(e.target.value)}
                        placeholder="Atau ketik nama penerima..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-semibold text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                      <datalist id="penerima-options-standalone">
                        {users.map((u) => (
                          <option key={u.id} value={u.nama} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-400 block mb-0.5">Ruangan Tujuan:</label>
                      <input
                        type="text"
                        value={unitRuangan}
                        onChange={(e) => setUnitRuangan(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-400 block mb-0.5">Tujuan Penggunaan:</label>
                      <input
                        type="text"
                        value={tujuanPenggunaan}
                        onChange={(e) => setTujuanPenggunaan(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-white"
                      />
                    </div>
                  </div>

                  {/* Recipient Digital Signature Inline Pad */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={withSignature}
                          onChange={(e) => setWithSignature(e.target.checked)}
                          className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-950"
                        />
                        <span className="font-bold text-slate-200 text-xs flex items-center gap-1">
                          <FileSignature className="w-3.5 h-3.5 text-blue-400" /> Tanda Tangan / Paraf Guru
                        </span>
                      </label>
                      {recipientSignature && (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCheck className="w-3 h-3" /> Tanda Tangan Tersimpan
                        </span>
                      )}
                    </div>

                    {withSignature && (
                      <div className="p-2 bg-slate-950 rounded-2xl border border-slate-700">
                        <SignaturePad
                          height={100}
                          label={`Paraf Digital ${penerima}`}
                          onChange={(hasDrawing, dataUrl) => {
                            if (hasDrawing) setRecipientSignature(dataUrl);
                            else setRecipientSignature('');
                          }}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Cart Items List */}
            <div className="p-4 max-h-[320px] overflow-y-auto divide-y divide-slate-800">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    {mode === 'MASUK' ? <ArrowDownToLine className="w-6 h-6 text-emerald-400" /> : <ArrowUpFromLine className="w-6 h-6 text-blue-400" />}
                  </div>
                  <p className="text-xs font-semibold text-slate-300">Keranjang transaksi masih kosong.</p>
                  <p className="text-[11px]">Pilih barang dari katalog di sebelah kiri atau ketik kode barcode.</p>
                </div>
              ) : (
                cart.map((c) => {
                  const isStockInsufficient = mode === 'KELUAR' && c.jumlah > c.currentStock;
                  return (
                    <div key={c.item.kodeBarang} className="py-2.5 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-xs text-white leading-snug">{c.item.namaBarang}</h4>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {c.item.kodeBarang} • Satuan: {c.item.jenisSatuan}
                            {mode === 'KELUAR' && (
                              <span className={`ml-2 font-bold ${isStockInsufficient ? 'text-rose-400' : 'text-slate-400'}`}>
                                (Sisa: {c.currentStock})
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveFromCart(c.item.kodeBarang)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          title="Hapus dari keranjang"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Stepper & Price / Total */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(c.item.kodeBarang, c.jumlah - 1)}
                            className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-200 cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={c.jumlah}
                            onChange={(e) => handleUpdateQty(c.item.kodeBarang, parseInt(e.target.value, 10) || 0)}
                            className={`w-14 text-center font-bold text-xs py-0.5 rounded bg-slate-950 border ${
                              isStockInsufficient ? 'border-rose-500 text-rose-300 bg-rose-950/40' : 'border-slate-700 text-white'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(c.item.kodeBarang, c.jumlah + 1)}
                            className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-200 cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {mode === 'MASUK' ? (
                          <div className="flex items-center gap-1.5 text-right">
                            <span className="text-[10px] text-slate-400">@</span>
                            <input
                              type="number"
                              min="0"
                              value={c.hargaSatuan}
                              onChange={(e) => handleUpdatePrice(c.item.kodeBarang, parseInt(e.target.value, 10) || 0)}
                              className="w-20 text-right font-mono text-xs py-0.5 rounded bg-slate-950 border border-slate-700 text-white"
                              title="Harga satuan faktur"
                            />
                            <div className="font-mono font-bold text-xs text-emerald-400 w-24 text-right">
                              {formatRupiah(c.jumlah * c.hargaSatuan)}
                            </div>
                          </div>
                        ) : (
                          <div className="font-mono font-bold text-xs text-blue-300">
                            {c.jumlah} {c.item.jenisSatuan}
                          </div>
                        )}
                      </div>

                      {isStockInsufficient && (
                        <div className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Kuantitas melebihi sisa stok gudang!
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Cart Summary & Action Buttons */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Total Jenis Barang:</span>
                  <span className="font-bold text-slate-200">{cartTotals.totalTypes} item</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Kuantitas Fisik:</span>
                  <span className="font-bold text-slate-200">{cartTotals.totalQty} unit</span>
                </div>
                {mode === 'MASUK' && (
                  <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-slate-800">
                    <span>Total Nilai Belanja:</span>
                    <span className="font-mono text-emerald-400">{formatRupiah(cartTotals.totalValue)}</span>
                  </div>
                )}
              </div>

              {/* Big Checkout Button */}
              <button
                type="button"
                onClick={handleProcessCheckout}
                disabled={cart.length === 0 || cartTotals.hasInsufficientStock}
                className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs md:text-sm shadow-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                  cart.length === 0 || cartTotals.hasInsufficientStock
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : mode === 'MASUK'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {mode === 'MASUK'
                    ? 'Simpan Penerimaan Barang & Cetak Bukti (F9)'
                    : 'Selesaikan Pengambilan & Cetak Bukti (F9)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* COMPLETED TRANSACTION MODAL: NEAT, PRISTINE DIGITAL RECEIPT (BUKTI RESMI) */}
      {/* ========================================================================= */}
      {completedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-md overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-150 my-6 flex flex-col">
            {/* Top Toolbar (Non-printable) */}
            <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <h3 className="font-black text-xs md:text-sm">
                    {completedDoc.type === 'MASUK'
                      ? 'Bukti Penerimaan Barang Pengadaan Berhasil Dibuat'
                      : 'Bukti Serah Terima Kios Guru Berhasil Dibuat'}
                  </h3>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Ref: {completedDoc.nomorBukti} • {completedDoc.jam}
                  </div>
                </div>
              </div>

              {/* View Switcher: Thermal Slip vs Official A4 Document */}
              <div className="flex items-center gap-1.5">
                <div className="bg-slate-800 p-0.5 rounded-xl border border-slate-700 flex text-[10px] font-bold">
                  <button
                    onClick={() => setReceiptViewFormat('thermal')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                      receiptViewFormat === 'thermal' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Receipt className="w-3 h-3" /> Struk Kios
                  </button>
                  <button
                    onClick={() => setReceiptViewFormat('official')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                      receiptViewFormat === 'official' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3 h-3" /> Berita Acara A4
                  </button>
                </div>

                <button
                  onClick={() => setCompletedDoc(null)}
                  className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* FORMAT 1: STRUK TERMAL KIOS (THERMAL POS SLIP 58MM/80MM STYLE) */}
            {receiptViewFormat === 'thermal' && (
              <div className="p-6 md:p-8 bg-slate-100 flex justify-center">
                <div className="w-full max-w-[380px] bg-white p-5 rounded-2xl border border-slate-300 shadow-md font-mono text-slate-900 text-xs space-y-3 relative">
                  {/* Top Paper Serration Design */}
                  <div className="text-center border-b border-dashed border-slate-400 pb-3 space-y-1">
                    <div className="font-black text-sm uppercase tracking-wider">{config.schoolName}</div>
                    <div className="text-[10px] text-slate-600">{config.address}</div>
                    <div className="text-[9px] text-slate-500">NPSN: {config.npsn}</div>
                    <div className="pt-1">
                      <span className="inline-block px-2 py-0.5 rounded font-black text-[10px] bg-slate-900 text-white uppercase tracking-wider">
                        {completedDoc.type === 'MASUK' ? 'STRUK BARANG MASUK' : 'STRUK AMBIL ATK / KIOS GURU'}
                      </span>
                    </div>
                  </div>

                  {/* Header Details */}
                  <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-400 pb-2.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">No. Bukti:</span>
                      <span className="font-bold">{completedDoc.nomorBukti}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Waktu:</span>
                      <span>{formatTanggalIndo(completedDoc.tanggal)}, {completedDoc.jam}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{completedDoc.type === 'MASUK' ? 'Toko Rekanan:' : 'Guru Pengambil:'}</span>
                      <span className="font-bold">{completedDoc.pihak}</span>
                    </div>
                    {completedDoc.nipPihak && completedDoc.nipPihak !== '-' && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">NIP Penerima:</span>
                        <span>{completedDoc.nipPihak}</span>
                      </div>
                    )}
                    {completedDoc.ruangan && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Unit/Ruangan:</span>
                        <span>{completedDoc.ruangan}</span>
                      </div>
                    )}
                    {completedDoc.sumberAnggaran && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Anggaran:</span>
                        <span>{completedDoc.sumberAnggaran}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Petugas Kios:</span>
                      <span>{completedDoc.petugas}</span>
                    </div>
                  </div>

                  {/* Itemized Table */}
                  <div className="space-y-1.5 border-b border-dashed border-slate-400 pb-2.5 text-[11px]">
                    <div className="flex justify-between font-bold text-slate-500 text-[10px] pb-1 border-b border-slate-200">
                      <span>NAMA BARANG</span>
                      <span>QTY {completedDoc.type === 'MASUK' ? '• HARGA' : ''}</span>
                    </div>

                    {completedDoc.items.map((it, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="font-bold text-slate-900 leading-tight">{it.namaBarang}</div>
                        <div className="flex justify-between text-slate-600 text-[10px]">
                          <span>
                            {it.jumlah} {it.satuan} {completedDoc.type === 'MASUK' ? `@ ${formatRupiah(it.hargaSatuan)}` : ''}
                          </span>
                          <span className="font-bold text-slate-900">
                            {completedDoc.type === 'MASUK' ? formatRupiah(it.total) : `${it.jumlah} ${it.satuan}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="space-y-1 pt-1 text-[11px]">
                    <div className="flex justify-between font-bold">
                      <span>TOTAL FISIK:</span>
                      <span>{completedDoc.totalJumlahItem} Unit Barang</span>
                    </div>
                    {completedDoc.type === 'MASUK' && (
                      <div className="flex justify-between font-black text-sm text-slate-950 pt-1 border-t border-slate-300">
                        <span>TOTAL BIAYA:</span>
                        <span>{formatRupiah(completedDoc.totalNilai)}</span>
                      </div>
                    )}
                  </div>

                  {/* Signature in Slip */}
                  {completedDoc.signatureData && (
                    <div className="pt-2 border-t border-dashed border-slate-400 text-center">
                      <div className="text-[9px] text-slate-500 mb-1">Paraf Sah Penerima:</div>
                      <img
                        src={completedDoc.signatureData}
                        alt="Paraf Guru"
                        className="max-h-12 max-w-[140px] mx-auto object-contain"
                      />
                      <div className="text-[10px] font-bold text-slate-900 uppercase mt-0.5">
                        {completedDoc.pihak}
                      </div>
                    </div>
                  )}

                  {/* QR Code Verification Stamp */}
                  <div className="pt-2 border-t border-dashed border-slate-400 text-center space-y-1">
                    {completedDoc.qrCodeUrl && (
                      <img
                        src={completedDoc.qrCodeUrl}
                        alt="QR Code Verifikasi"
                        className="w-16 h-16 mx-auto object-contain border border-slate-300 p-0.5 rounded shadow-2xs"
                      />
                    )}
                    <div className="text-[9px] text-slate-400 font-mono tracking-wider">
                      E-VERIFIED BOS SIM-SARPRAS
                    </div>
                    <div className="text-[8px] text-slate-400 font-mono">
                      Security ID: {completedDoc.securityHash}
                    </div>
                    <div className="text-[9px] text-slate-500 italic pt-1">
                      "Barang telah diterima dalam kondisi baik &amp; lengkap."
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FORMAT 2: BERITA ACARA & SURAT TANDA TERIMA RESMI PEMDA (A4 / A5 DOKUMEN FORMAL) */}
            {receiptViewFormat === 'official' && (
              <div className="p-8 md:p-10 font-serif text-slate-950 text-xs leading-relaxed space-y-4 max-h-[65vh] overflow-y-auto">
                {/* Kop Surat Resmi */}
                <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-700">
                    {config.dinasPendidikan || 'PEMERINTAH DAERAH KABUPATEN BANDUNG BARAT - DINAS PENDIDIKAN'}
                  </h4>
                  <h2 className="text-base md:text-lg font-black tracking-wide uppercase text-slate-950 mt-0.5">
                    {config.schoolName}
                  </h2>
                  <p className="text-[10px] font-sans text-slate-600 mt-0.5">
                    NPSN: {config.npsn} • Alamat: {config.address} • Email: {config.emailSekolah || 'sdn01mekarsari@sekolah.belajar.id'}
                  </p>
                </div>

                {/* Judul Naskah */}
                <div className="text-center my-3">
                  <h3 className="text-sm md:text-base font-black uppercase underline decoration-1">
                    {completedDoc.type === 'MASUK'
                      ? 'BERITA ACARA PEMERIKSAAN & PENERIMAAN BARANG PENGADAAN (BAP-PB)'
                      : 'SURAT BUKTI PENGELUARAN & SERAH TERIMA BARANG (SPB-ST)'}
                  </h3>
                  <p className="text-[11px] font-sans text-slate-700 font-mono mt-0.5 font-bold">
                    Nomor: {completedDoc.nomorBukti}
                  </p>
                </div>

                {/* Paragraf Pembuka */}
                <p className="font-sans text-xs text-justify indent-6">
                  Pada hari ini, <strong>{formatTanggalIndo(completedDoc.tanggal)}</strong> pukul <strong>{completedDoc.jam}</strong>, telah dilaksanakan serah terima logistik dan perlengkapan sarana prasarana sekolah pada <strong>{config.schoolName}</strong> dengan rincian administrasi sebagai berikut:
                </p>

                {/* Metadata Transaksi */}
                <div className="grid grid-cols-2 gap-3 font-sans text-[11px] my-3 p-3.5 bg-slate-50 rounded-xl border border-slate-300">
                  <div className="space-y-1">
                    <p><span className="text-slate-500">Tanggal Transaksi:</span> <strong>{formatTanggalIndo(completedDoc.tanggal)}</strong></p>
                    <p>
                      <span className="text-slate-500">{completedDoc.type === 'MASUK' ? 'Penyedia / Toko:' : 'Nama Penerima (Guru):'}</span>{' '}
                      <strong>{completedDoc.pihak}</strong>
                    </p>
                    {completedDoc.nipPihak && (
                      <p><span className="text-slate-500">NIP Penerima:</span> <strong className="font-mono">{completedDoc.nipPihak}</strong></p>
                    )}
                    {completedDoc.ruangan && (
                      <p><span className="text-slate-500">Unit / Ruangan:</span> <strong>{completedDoc.ruangan}</strong></p>
                    )}
                    {completedDoc.tujuan && (
                      <p><span className="text-slate-500">Keperluan:</span> <strong>{completedDoc.tujuan}</strong></p>
                    )}
                  </div>

                  <div className="space-y-1">
                    {completedDoc.nomorBku && (
                      <p><span className="text-slate-500">Nomor BKU:</span> <strong className="font-mono">{completedDoc.nomorBku}</strong></p>
                    )}
                    {completedDoc.sumberAnggaran && (
                      <p><span className="text-slate-500">Sumber Anggaran:</span> <strong>{completedDoc.sumberAnggaran}</strong></p>
                    )}
                    <p><span className="text-slate-500">Petugas Pengurus:</span> <strong>{completedDoc.petugas}</strong></p>
                    <p><span className="text-slate-500">Kode Audit Digital:</span> <strong className="font-mono text-[10px] text-emerald-800">{completedDoc.securityHash}</strong></p>
                  </div>
                </div>

                {/* Tabel Rincian Barang */}
                <table className="w-full border-collapse border border-slate-800 font-sans text-[11px] my-3">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold text-center">
                      <th className="border border-slate-400 p-2 w-8">No</th>
                      <th className="border border-slate-400 p-2 text-left">Kode &amp; Nama Barang</th>
                      <th className="border border-slate-400 p-2 text-center">Kuantitas</th>
                      <th className="border border-slate-400 p-2 text-center">Satuan</th>
                      {completedDoc.type === 'MASUK' && (
                        <>
                          <th className="border border-slate-400 p-2 text-right">Harga Satuan</th>
                          <th className="border border-slate-400 p-2 text-right">Total Belanja</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {completedDoc.items.map((it, idx) => (
                      <tr key={it.kodeBarang}>
                        <td className="border border-slate-400 p-2 text-center font-mono">{idx + 1}</td>
                        <td className="border border-slate-400 p-2 font-medium">
                          <span className="font-bold text-slate-900">{it.namaBarang}</span>
                          <span className="text-slate-500 font-mono text-[10px] ml-1">({it.kodeBarang})</span>
                        </td>
                        <td className="border border-slate-400 p-2 text-center font-bold">{it.jumlah}</td>
                        <td className="border border-slate-400 p-2 text-center">{it.satuan}</td>
                        {completedDoc.type === 'MASUK' && (
                          <>
                            <td className="border border-slate-400 p-2 text-right font-mono">{formatRupiah(it.hargaSatuan)}</td>
                            <td className="border border-slate-400 p-2 text-right font-mono font-bold">{formatRupiah(it.total)}</td>
                          </>
                        )}
                      </tr>
                    ))}
                    {completedDoc.type === 'MASUK' && (
                      <tr className="bg-slate-100 font-bold">
                        <td colSpan={5} className="border border-slate-400 p-2 text-right">TOTAL PENGADAAN (RP):</td>
                        <td className="border border-slate-400 p-2 text-right font-mono text-emerald-900">
                          {formatRupiah(completedDoc.totalNilai)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Terbilang Section (For Masuk) */}
                {completedDoc.type === 'MASUK' && completedDoc.totalNilai > 0 && (
                  <div className="font-sans text-[11px] p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">Terbilang:</span>{' '}
                    <span className="font-bold italic text-slate-800">
                      "{angkaKeTerbilang(completedDoc.totalNilai)} Rupiah"
                    </span>
                  </div>
                )}

                {/* Pernyataan Legal */}
                <p className="font-sans text-[11px] text-justify text-slate-600 leading-relaxed">
                  Barang-barang tersebut di atas telah diperiksa, diserahterimakan dalam keadaan baik dan lengkap, serta dicatat dalam buku register inventaris/persediaan sekolah sesuai ketentuan perundang-undangan pengelolaan aset yang berlaku.
                </p>

                {/* Signature Section with QR Code */}
                <div className="grid grid-cols-3 gap-4 text-center font-sans text-xs pt-4 items-end">
                  {/* Pihak Yang Menyerahkan */}
                  <div>
                    <p className="text-slate-600 text-[11px] mb-1">
                      {completedDoc.type === 'MASUK' ? 'Yang Menyerahkan (Rekanan / Toko):' : 'Pengurus Barang Sekolah:'}
                    </p>
                    <div className="h-16 flex items-center justify-center">
                      {completedDoc.type === 'KELUAR' ? (
                        <div className="text-slate-400 italic text-[10px]">Tanda Tangan Pengurus</div>
                      ) : (
                        <div className="text-slate-400 italic text-[10px]">Cap / Tanda Tangan Toko</div>
                      )}
                    </div>
                    <p className="font-bold underline uppercase text-slate-900">
                      {completedDoc.type === 'MASUK' ? completedDoc.pihak : config.warehouseOfficer}
                    </p>
                    {completedDoc.type === 'KELUAR' && (
                      <p className="text-[10px] text-slate-500">NIP. {config.warehouseOfficerNip}</p>
                    )}
                  </div>

                  {/* QR Code Verification Stamp */}
                  <div className="flex flex-col items-center justify-center">
                    {completedDoc.qrCodeUrl ? (
                      <img
                        src={completedDoc.qrCodeUrl}
                        alt="Verifikasi Digital"
                        className="w-16 h-16 object-contain border border-slate-300 p-0.5 rounded shadow-2xs"
                      />
                    ) : (
                      <div className="w-16 h-16 border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
                        QR Verifikasi
                      </div>
                    )}
                    <span className="text-[9px] font-mono text-slate-500 mt-1 font-bold">E-VERIFIED BOS</span>
                    <span className="text-[8px] font-mono text-slate-400">{completedDoc.securityHash}</span>
                  </div>

                  {/* Pihak Yang Menerima */}
                  <div>
                    <p className="text-slate-600 text-[11px] mb-1">
                      {completedDoc.type === 'MASUK' ? 'Yang Menerima (Pengurus Barang):' : 'Yang Menerima (Guru / Staf):'}
                    </p>
                    <div className="h-16 flex items-center justify-center">
                      {completedDoc.signatureData ? (
                        <img
                          src={completedDoc.signatureData}
                          alt="Paraf Penerima"
                          className="max-h-14 max-w-[130px] object-contain border-b border-dashed border-slate-300"
                        />
                      ) : (
                        <div className="text-slate-300 italic text-[10px]">Tanda Tangan</div>
                      )}
                    </div>
                    <p className="font-bold underline uppercase text-slate-900">
                      {completedDoc.type === 'MASUK' ? config.warehouseOfficer : completedDoc.pihak}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {completedDoc.type === 'MASUK' ? `NIP. ${config.warehouseOfficerNip}` : completedDoc.nipPihak ? `NIP. ${completedDoc.nipPihak}` : '-'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Action Toolbar (Print, Copy WA, Download, Reset) */}
            <div className="no-print p-4 md:px-6 md:py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySummaryToWhatsApp}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Salin ringkasan transaksi siap kirim ke WhatsApp"
                >
                  {copySuccess ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copySuccess ? 'Tersalin!' : 'Salin WhatsApp'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Unduh berkas bukti (.html)"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Resi
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" /> Cetak Naskah
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCompletedDoc(null);
                    soundEffects.playAdd();
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> Transaksi Baru (Reset)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD SUPPLIER MODAL */}
      {isNewSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-slate-900 text-white rounded-3xl max-w-md w-full shadow-2xl p-6 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Store className="w-4 h-4 text-emerald-400" /> Tambah Rekanan / Toko Baru
              </h3>
              <button
                onClick={() => setIsNewSupplierModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAddSupplier} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Nama Toko / Penyedia *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Toko Buku Mitra Edukasi"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">No. Telepon / WhatsApp</label>
                <input
                  type="text"
                  placeholder="0812-xxxx-xxxx"
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Alamat Toko</label>
                <input
                  type="text"
                  placeholder="Jl. Raya..."
                  value={newSupplierAddress}
                  onChange={(e) => setNewSupplierAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewSupplierModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md cursor-pointer"
                >
                  Simpan &amp; Pilih
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR SCANNER MODAL */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
      />
    </div>
  );
};
