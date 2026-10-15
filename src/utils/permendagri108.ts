export interface PermendagriItem {
  kode: string;
  nama: string;
  kib: 'KIB_A' | 'KIB_B' | 'KIB_C' | 'KIB_D' | 'KIB_E' | 'KIB_F';
  masaManfaatDefault: number; // tahun
  satuanDefault: string;
  rekeningArkasDefault: string;
  keywords: string[];
}

export const PERMENDAGRI_108_DATABASE: PermendagriItem[] = [
  // === KIB A: TANAH ===
  {
    kode: '1.3.1.01.01.01.001',
    nama: 'Tanah Bangunan Tempat Kerja / Pendidikan Sekolah',
    kib: 'KIB_A',
    masaManfaatDefault: 0,
    satuanDefault: 'Bidang',
    rekeningArkasDefault: '5.2.02.01.01.0001',
    keywords: ['tanah', 'lahan', 'persil', 'tanah sekolah', 'lokasi sekolah', 'shm', 'hak pakai'],
  },
  {
    kode: '1.3.1.01.01.04.001',
    nama: 'Tanah Lapangan Olahraga Sekolah',
    kib: 'KIB_A',
    masaManfaatDefault: 0,
    satuanDefault: 'Bidang',
    rekeningArkasDefault: '5.2.02.01.01.0002',
    keywords: ['lapangan', 'olahraga', 'lapangan upacara', 'futsal', 'voli', 'basket'],
  },

  // === KIB B: PERALATAN DAN MESIN ===
  // Komputer & Teknologi
  {
    kode: '1.3.2.05.02.01.004',
    nama: 'Komputer Jinjing / Laptop / Chromebook',
    kib: 'KIB_B',
    masaManfaatDefault: 4,
    satuanDefault: 'Unit',
    rekeningArkasDefault: '5.2.02.05.02.0001',
    keywords: ['laptop', 'chromebook', 'notebook', 'macbook', 'acer', 'asus', 'lenovo', 'c733', 'komputer jinjing'],
  },
  {
    kode: '1.3.2.05.02.01.001',
    nama: 'Personal Computer (PC) Desktop Unit',
    kib: 'KIB_B',
    masaManfaatDefault: 4,
    satuanDefault: 'Unit',
    rekeningArkasDefault: '5.2.02.05.01.0001',
    keywords: ['pc', 'desktop', 'komputer', 'all-in-one', 'aio', 'cpu', 'monitor'],
  },
  {
    kode: '1.3.2.05.02.06.001',
    nama: 'LCD Proyektor / Projector Digital',
    kib: 'KIB_B',
    masaManfaatDefault: 4,
    satuanDefault: 'Unit',
    rekeningArkasDefault: '5.2.02.05.02.0006',
    keywords: ['proyektor', 'projector', 'infocus', 'epson', 'eb-e500', 'viewsonic', 'lcd proyektor'],
  },
  {
    kode: '1.3.2.05.01.05.001',
    nama: 'Printer Inkjet / Laserjet / Scanner All-in-One',
    kib: 'KIB_B',
    masaManfaatDefault: 4,
    satuanDefault: 'Unit',
    rekeningArkasDefault: '5.2.02.05.01.0005',
    keywords: ['printer', 'scanner', 'cetak', 'canon', 'l3210', 'l120', 'hp', 'epson l', 'fotokopi portable'],
  },
  {
    kode: '1.3.2.05.03.01.001',
    nama: 'Server Komputer Jaringan Sekolah / ANBK',
    kib: 'KIB_B',
    masaManfaatDefault: 5,
    satuanDefault: 'Unit',
    rekeningArkasDefault: '5.2.02.05.03.0001',
    keywords: ['server', 'anbk', 'server mini', 'tower server', 'rackmount', 'nas'],
  },
  {
    kode: '1.3.2.05.03.02.001',
    nama: 'Peralatan Jaringan (Switch Hub, Router WiFi, Access Point)',
    kib: 'KIB_B',
    masaManfaatDefault: 4,
    satuanDefault: 'Unit',
    rekeningArkasDefault: '5.2.02.05.03.0002',
    keywords: ['router', 'wifi', 'switch', 'hub', 'access point', 'mikrotik', 'tp-link', 'modem'],
  },
  {
    kode: '1.3.2.05.02.07.001',
    nama: 'Layar Proyektor (Screen Projector / Tripod Screen)',
    kib: 'KIB_B',
    masaManfaatDefault: 5,
    satuanDefault: 'Unit',
    rekeningArkasDefault: '5.2.02.05.02.0007',
    keywords: ['screen', 'layar proyektor', 'tripod screen', 'motorized screen'],
  },

  // Mebel & Perlengkapan Ruangan
  {
    kode: '1.3.2.04.01.01.001',
    nama: 'Meja Siswa (Kayu / Besi / Kombinasi)',
    kib: 'KIB_B',
    masaManfaatDefault: 5,
    satuanDefault: 'Buah',
    rekeningArkasDefault: '5.2.02.04.01.0001',
    keywords: ['meja siswa', 'meja belajar', 'meja murid', 'meja tunggal', 'meja ganda'],
  },
  {
    kode: '1.3.2.04.01.01.002',
    nama: 'Meja Guru / Kepala Sekolah / Tata Usaha',
    kib: 'KIB_B',
    masaManfaatDefault: 5,
    satuanDefault: 'Buah',
    rekeningArkasDefault: '5.2.02.04.01.0002',
    keywords: ['meja guru', 'meja kepsek', 'meja kantor', 'meja tu', 'meja kerja biro'],
  },
  {
    kode: '1.3.2.04.01.02.001',
    nama: 'Kursi Siswa (Kayu / Pipa Besi)',
    kib: 'KIB_B',
    masaManfaatDefault: 5,
    satuanDefault: 'Buah',
    rekeningArkasDefault: '5.2.02.04.01.0003',
    keywords: ['kursi siswa', 'kursi murid', 'kursi belajar', 'kursi kelas'],
  },
  {
    kode: '1.3.2.04.01.02.002',
    nama: 'Kursi Kerja Guru / Pegawai (Busa / Hidrolik / Putar)',
    kib: 'KIB_B',
    masaManfaatDefault: 5,
    satuanDefault: 'Buah',
    rekeningArkasDefault: '5.2.02.04.01.0004',
    keywords: ['kursi guru', 'kursi putar', 'kursi hidrolik', 'kursi direktur', 'kursi busa'],
  },
  {
    kode: '1.3.2.04.01.03.001',
    nama: 'Lemari Arsip Besi / Filling Cabinet',
    kib: 'KIB_B',
    masaManfaatDefault: 8,
    satuanDefault: 'Buah',
    rekeningArkasDefault: '5.2.02.04.01.0005',
    keywords: ['lemari arsip', 'filling cabinet', 'lemari besi', 'locker', 'loker siswa'],
  },
  {
    kode: '1.3.2.04.01.04.001',
    nama: 'Rak Buku Perpustakaan / Display Majalah',
    kib: 'KIB_B',
    masaManfaatDefault: 8,
    satuanDefault: 'Buah',
    rekeningArkasDefault: '5.2.02.04.01.0006',
    keywords: ['rak buku', 'rak perpus', 'rak perpustakaan', 'rak besi dua sisi', 'rak majalah'],
  },
  {
    kode: '1.3.2.04.01.05.001',
    nama: 'Papan Tulis Whiteboard Standar / Magnetik',
    kib: 'KIB_B',
    masaManfaatDefault: 5,
    satuanDefault: 'Buah',
    rekeningArkasDefault: '5.2.02.04.01.0007',
    keywords: ['whiteboard', 'papan tulis', 'papan gantung', 'papan beroda', 'chalkboard'],
  },

  // Elektronik Ruangan & Pendingin
  {
    kode: '1.3.2.08.01.01.001',
    nama: 'Air Conditioner (AC Split / Portable)',
    kib: 'KIB_B',
    masaManfaatDefault: 5,
    satuanDefault: 'Unit',
    rekeningArkasDefault: '5.2.02.08.01.0001',
    keywords: ['ac', 'air conditioner', 'ac split', 'daikin', 'panasonic', 'sharp', 'pendingin ruangan'],
  },
  {
    kode: '1.3.2.08.02.01.001',
    nama: 'Kipas Angin Dinding / Plafon / Orbit Fan',
    kib: 'KIB_B',
    masaManfaatDefault: 4,
    satuanDefault: 'Unit',
    rekeningArkasDefault: '5.2.02.08.02.0001',
    keywords: ['kipas', 'kipas angin', 'wall fan', 'orbit fan', 'exhaust fan'],
  },
  {
    kode: '1.3.2.11.01.01.001',
    nama: 'Sound System Upacara / Portable Wireless Amplifier',
    kib: 'KIB_B',
    masaManfaatDefault: 5,
    satuanDefault: 'Set',
    rekeningArkasDefault: '5.2.02.11.01.0001',
    keywords: ['sound system', 'speaker upacara', 'wireless amplifier', 'mic wireless', 'toa', 'megaphone'],
  },
  {
    kode: '1.3.2.11.02.01.001',
    nama: 'Bel Sekolah Otomatis / Sirine Waktu KBM',
    kib: 'KIB_B',
    masaManfaatDefault: 5,
    satuanDefault: 'Unit',
    rekeningArkasDefault: '5.2.02.11.02.0001',
    keywords: ['bel sekolah', 'sirine', 'bel otomatis', 'timer bell'],
  },

  // Laboratorium & Praktikum
  {
    kode: '1.3.2.14.02.01.002',
    nama: 'Mikroskop Monokuler Siswa / Alat Optik IPA',
    kib: 'KIB_B',
    masaManfaatDefault: 5,
    satuanDefault: 'Unit',
    rekeningArkasDefault: '5.2.02.14.02.0001',
    keywords: ['mikroskop', 'yazumi', 'xsp', 'alat lab', 'lensa', 'preparat', 'optik ipa'],
  },
  {
    kode: '1.3.2.14.03.01.001',
    nama: 'Kit Praktikum IPA / IPAS / Matematika',
    kib: 'KIB_B',
    masaManfaatDefault: 4,
    satuanDefault: 'Set',
    rekeningArkasDefault: '5.2.02.14.03.0001',
    keywords: ['kit ipa', 'kit ipas', 'kit matematika', 'torso', 'alat peraga tubuh', 'model anatomi'],
  },

  // Olahraga & UKS
  {
    kode: '1.3.2.13.01.01.001',
    nama: 'Matras Senam / Perlengkapan Olahraga Permanen',
    kib: 'KIB_B',
    masaManfaatDefault: 4,
    satuanDefault: 'Set',
    rekeningArkasDefault: '5.2.02.13.01.0001',
    keywords: ['matras', 'meja pingpong', 'tenis meja', 'gawang mini', 'ring basket portable'],
  },
  {
    kode: '1.3.2.12.01.01.001',
    nama: 'Tempat Tidur Pasien UKS / Timbangan & Pengukur Tinggi',
    kib: 'KIB_B',
    masaManfaatDefault: 6,
    satuanDefault: 'Unit',
    rekeningArkasDefault: '5.2.02.12.01.0001',
    keywords: ['bed uks', 'tempat tidur uks', 'timbangan dacin', 'stadiometer', 'tensi meter'],
  },

  // === KIB C: GEDUNG DAN BANGUNAN ===
  {
    kode: '1.3.3.01.01.01.001',
    nama: 'Gedung Ruang Kelas & Kantor Sekolah Permanen',
    kib: 'KIB_C',
    masaManfaatDefault: 50,
    satuanDefault: 'Unit',
    rekeningArkasDefault: '5.2.02.03.01.0001',
    keywords: ['gedung', 'ruang kelas', 'kantor sekolah', 'ruang guru', 'bangunan permanen', 'lantai', 'blok'],
  },
  {
    kode: '1.3.3.01.01.01.002',
    nama: 'Gedung Laboratorium Komputer / Bahasa / IPA',
    kib: 'KIB_C',
    masaManfaatDefault: 50,
    satuanDefault: 'Unit',
    rekeningArkasDefault: '5.2.02.03.01.0002',
    keywords: ['gedung lab', 'gedung laboratorium', 'ruang lab', 'lab komputer'],
  },
  {
    kode: '1.3.3.01.01.01.003',
    nama: 'Gedung Perpustakaan Sekolah',
    kib: 'KIB_C',
    masaManfaatDefault: 50,
    satuanDefault: 'Unit',
    rekeningArkasDefault: '5.2.02.03.01.0003',
    keywords: ['gedung perpustakaan', 'ruang perpustakaan', 'gedung baca'],
  },
  {
    kode: '1.3.3.01.01.04.001',
    nama: 'Bangunan Sanitasi / Toilet Siswa dan Guru',
    kib: 'KIB_C',
    masaManfaatDefault: 30,
    satuanDefault: 'Unit',
    rekeningArkasDefault: '5.2.02.03.01.0004',
    keywords: ['toilet', 'jamban', 'wc', 'sanitasi', 'kamar mandi'],
  },

  // === KIB D: JALAN, IRIGASI DAN JARINGAN ===
  {
    kode: '1.3.4.01.01.01.001',
    nama: 'Pagar Keliling Sekolah Permanen / Gerbang Besi',
    kib: 'KIB_D',
    masaManfaatDefault: 20,
    satuanDefault: 'Meter',
    rekeningArkasDefault: '5.2.02.06.01.0001',
    keywords: ['pagar', 'gerbang', 'tembok keliling', 'pintu gerbang', 'bata merah pagar'],
  },
  {
    kode: '1.3.4.01.01.02.001',
    nama: 'Saluran Pembuangan Air Hujan / Drainase Sekolah',
    kib: 'KIB_D',
    masaManfaatDefault: 20,
    satuanDefault: 'Meter',
    rekeningArkasDefault: '5.2.02.06.02.0001',
    keywords: ['drainase', 'saluran air', 'selokan', 'got tertutup', 'gorong-gorong'],
  },

  // === KIB E: ASET TETAP LAINNYA ===
  {
    kode: '1.3.5.01.01.01.001',
    nama: 'Buku Pelajaran Pokok / Teks Utama Siswa',
    kib: 'KIB_E',
    masaManfaatDefault: 4,
    satuanDefault: 'Eksemplar',
    rekeningArkasDefault: '5.2.02.08.01.0001',
    keywords: ['buku', 'buku pelajaran', 'buku teks', 'kurikulum merdeka', 'kemendikbud', 'isbn', 'buku pokok'],
  },
  {
    kode: '1.3.5.01.01.02.001',
    nama: 'Buku Perpustakaan Referensi & Pengayaan Siswa',
    kib: 'KIB_E',
    masaManfaatDefault: 4,
    satuanDefault: 'Eksemplar',
    rekeningArkasDefault: '5.2.02.08.01.0002',
    keywords: ['ensiklopedia', 'kamus', 'cerita rakyat', 'buku referensi', 'pengayaan', 'majalah perpustakaan'],
  },
  {
    kode: '1.3.5.02.01.01.001',
    nama: 'Barang Bercorak Kesenian / Alat Musik Tradisional',
    kib: 'KIB_E',
    masaManfaatDefault: 5,
    satuanDefault: 'Set',
    rekeningArkasDefault: '5.2.02.08.02.0001',
    keywords: ['angklung', 'gamelan', 'rebana', 'pianika', 'seruling', 'alat musik', 'drumband'],
  },
  {
    kode: '1.3.5.02.02.01.001',
    nama: 'Alat Peraga Edukatif (APE) / Globe / Peta Geografis',
    kib: 'KIB_E',
    masaManfaatDefault: 4,
    satuanDefault: 'Buah',
    rekeningArkasDefault: '5.2.02.08.02.0002',
    keywords: ['globe', 'peta', 'ape', 'alat peraga', 'charta', 'poster anatomi', 'peta indonesia'],
  },
];

/**
 * Mencari kecocokan terbaik kodefikasi Permendagri 108 berdasarkan nama barang atau kata kunci
 */
export function matchPermendagriCode(namaBarang: string, currentKib?: string): PermendagriItem | null {
  const clean = namaBarang.toLowerCase();

  // Filter berdasarkan kib jika ada
  let pool = PERMENDAGRI_108_DATABASE;
  if (currentKib && currentKib !== 'ALL') {
    pool = pool.filter((item) => item.kib === currentKib);
  }

  // 1. Exact match di keywords
  for (const item of pool) {
    if (item.keywords.some((k) => clean.includes(k))) {
      return item;
    }
  }

  // 2. Fallback search di nama
  for (const item of pool) {
    const itemWords = item.nama.toLowerCase().split(/\s+/);
    if (itemWords.some((w) => w.length > 3 && clean.includes(w))) {
      return item;
    }
  }

  // 3. Fallback default sesuai KIB
  if (currentKib === 'KIB_A') return PERMENDAGRI_108_DATABASE.find((i) => i.kib === 'KIB_A') || null;
  if (currentKib === 'KIB_C') return PERMENDAGRI_108_DATABASE.find((i) => i.kib === 'KIB_C') || null;
  if (currentKib === 'KIB_E') return PERMENDAGRI_108_DATABASE.find((i) => i.kib === 'KIB_E') || null;
  return PERMENDAGRI_108_DATABASE.find((i) => i.kib === 'KIB_B') || null;
}
