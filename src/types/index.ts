export interface SchoolConfig {
  schoolName: string;
  npsn: string;
  address: string;
  headmaster: string;
  headmasterNip: string;
  treasurer: string;
  treasurerNip: string;
  warehouseOfficer: string;
  warehouseOfficerNip: string;
  dinasPendidikan?: string;
  emailSekolah?: string;
  logoUrl?: string;
  reduceStockOnATKPickup?: boolean; // Konfigurasi apakah Pengambilan ATK memotong stok persediaan atau hanya mode laporan
  tahunAnggaranAktif?: string; // misal "2026"
  paguAnggaranTahunan?: number; // Total pagu anggaran tahunan belanja inventaris & operasional BOS (misal Rp 180.000.000)
  paguBosReguler?: number; // Alokasi pagu BOS Reguler (misal Rp 120.000.000)
  paguBosKinerja?: number; // Alokasi pagu BOS Kinerja / Afirmasi (misal Rp 45.000.000)
  paguBopDaerah?: number; // Alokasi pagu BOP Daerah / APBD / Komite (misal Rp 15.000.000)
  adminPin?: string; // PIN Pengamanan Otorisasi Admin & Modul Kritis (Default: 123456)
}

export interface UserEmployee {
  id: string;
  nip: string;
  nama: string;
  email: string;
  jabatan: string;
  role: 'ADMIN' | 'BENDAHARA' | 'PENGURUS_BARANG' | 'GURU' | 'STAF';
  status: 'AKTIF' | 'NONAKTIF';
}

export interface Supplier {
  id: string;
  namaToko: string;
  alamat: string;
  telepon: string;
  narahubung: string;
  status: 'AKTIF' | 'NONAKTIF';
}

export interface MasterItem {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  kategori: 'ATK' | 'Kebersihan' | 'Elektronik' | 'Mebel' | 'Laboratorium' | 'Olahraga' | 'Buku & Peraga' | 'UKS/Kesehatan' | 'Lainnya';
  jenisSatuan: string; // Rim, Pcs, Box, Pack, Buah, Unit, Set, Lembar, Botol
  tipe: 'HABIS_PAKAI' | 'ASET_TETAP';
  kodeRekeningRkas: string;
  batasMinimum: number;
  lokasiDefault: string;
  hargaEstimasi: number;
  status: 'AKTIF' | 'NONAKTIF';
}

export interface BarangMasuk {
  id: string;
  timestamp: string;
  tanggal: string;
  bulanPengadaan: string;
  namaToko: string;
  kodeBarang: string;
  namaBarang: string;
  jumlah: number;
  jenisSatuan: string;
  hargaSatuan: number;
  totalPengadaan: number;
  namaSekolah: string;
  sumberAnggaran: 'BOS Reguler' | 'BOS Kinerja' | 'BOP Daerah' | 'DAK Fisik' | 'Komite/Swadaya' | 'APBD Prov/Kab' | 'Lainnya';
  kodeRekeningRkas: string;
  nomorBku: string;
  nomorKwitansi: string;
  fotoLink?: string; // base64 or url
  petugas: string;
  keterangan: string;
}

export interface BarangKeluar {
  id: string;
  timestamp: string;
  tanggal: string;
  kodeBarang: string;
  namaBarang: string;
  jumlah: number;
  jenisSatuan: string;
  penerima: string;
  unitRuangan: string;
  tujuanPenggunaan: string;
  petugas: string;
  fotoLink?: string;
  parafLink?: string;
  keterangan: string;
}

export interface StockSummaryItem {
  kodeBarang: string;
  namaBarang: string;
  kategori: string;
  jenisSatuan: string;
  tipe: 'HABIS_PAKAI' | 'ASET_TETAP';
  stokMasuk: number;
  stokKeluar: number;
  stok: number;
  batasMinimum: number;
  status: 'AMAN' | 'MINIMUM' | 'HABIS';
  nilaiPersediaan: number;
}

export interface AssetRecord {
  id: string;
  kodeAset: string;
  kodeBarang: string;
  namaBarang: string;
  subKegiatan?: string;
  kodeRekening?: string;
  kodeLokasi?: string;
  tanggalBku: string;
  nomorBku?: string;
  nomorKwitansi?: string;
  namaToko?: string;
  merk: string;
  spesifikasi: string;
  nomorSeri?: string;
  jumlah: number;
  jenisSatuan: string;
  hargaSatuan: number;
  totalNilai: number;
  lokasi: string;
  penanggungJawab: string;
  kondisi: 'BAIK' | 'RUSAK_RINGAN' | 'RUSAK_BERAT';
  status: 'AKTIF' | 'DIMUTASI' | 'DIHAPUSKAN' | 'DALAM_PERBAIKAN';
  fotoLink?: string;
  keterangan?: string;
  // Standar KIB & Akuntansi Aset Tetap Permendagri 47/2021 & 108/2016
  kibKategori?: 'KIB_A' | 'KIB_B' | 'KIB_C' | 'KIB_D' | 'KIB_E' | 'KIB_F';
  tahunPerolehan?: number;
  masaManfaat?: number; // dalam tahun untuk perhitungan depresiasi
  asalUsul?: string; // Sumber Anggaran BOS Reguler / Kinerja / DAK / Komite
  nomorPabrik?: string;
  ukuran?: string;
  bahan?: string;
  kalibrasiTerakhir?: string;
  kalibrasiBerikutnya?: string;
  intervalKalibrasiBulan?: number;
  // Penyelarasan SIPD-BMD, ARKAS, & DAPODIK
  kodeBmdPermendagri?: string; // Standar Kodefikasi BMD Permendagri No. 108
  nomorRegisterNup?: string; // Nomor Urut Pendaftaran (NUP)
  statusPenggunaanBmd?: 'Digunakan Sendiri' | 'Dipinjamkan' | 'Dalam Sengketa' | 'Rusak Berat';
  idDapodikSarpras?: string; // ID Sarana Dapodik Kemendikbud
  laikPakaiDapodik?: 'Laik' | 'Tidak Laik';
  luasM2?: number; // Luas untuk KIB A (Tanah) atau KIB C (Gedung)
  kodeRekeningArkas?: string; // Pemetaan rekening belanja modal ARKAS (misal 5.2.02.05.01.0001)
}

export interface LaporanKerusakanRecord {
  id: string;
  timestamp: string;
  tanggal: string;
  kodeAset: string;
  namaBarang: string;
  lokasi: string;
  pelapor: string;
  kondisi: 'RUSAK_RINGAN' | 'RUSAK_BERAT';
  deskripsiKerusakan: string;
  fotoLink?: string;
  status: 'MENUNGGU_VERIFIKASI' | 'DISETUJUI_PERBAIKAN' | 'DIPERBAIKI' | 'DIUSULKAN_HAPUS';
  tanggapanPengurus?: string;
}

export interface MutasiRecord {
  id: string;
  timestamp: string;
  tanggal: string;
  kodeBarang?: string;
  kodeAset: string;
  namaBarang: string;
  dariLokasi: string;
  keLokasi: string;
  dariPj: string;
  kePj: string;
  petugas: string;
  alasan: string;
  fotoLink?: string;
  keterangan: string;
}

export interface StockOpnameRecord {
  id: string;
  timestamp: string;
  tanggal: string;
  kodeBarang: string;
  namaBarang: string;
  stokSistem: number;
  stokFisik: number;
  selisih: number;
  jenisSatuan: string;
  lokasi: string;
  petugas: string;
  tindakan: string;
  keterangan: string;
}

export interface PemeliharaanRecord {
  id: string;
  timestamp: string;
  tanggal: string;
  kodeAset: string;
  namaBarang: string;
  jenisPemeliharaan: string;
  biaya: number;
  penyedia: string;
  status: 'DIAJUKAN' | 'PROSES' | 'SELESAI' | 'BATAL';
  petugas: string;
  keterangan: string;
}

export interface PenghapusanRecord {
  id: string;
  timestamp: string;
  tanggal: string;
  kodeAset: string;
  namaBarang: string;
  alasan: string;
  kondisiAkhir: string;
  dokumen: string;
  status: 'DIAJUKAN' | 'DISETUJUI' | 'DITOLAK' | 'SELESAI';
  petugas: string;
  keterangan: string;
}

export interface PengambilanATKItem {
  id: string;
  namaBarang: string;
  jumlah: number;
  satuan?: string;
}

export interface PengambilanATKRecord {
  no: number;
  id: string;
  timestamp: string;
  tanggal: string;
  nip: string;
  namaLengkap: string;
  jabatan: string;
  items: PengambilanATKItem[];
  fotoBuktiLink?: string;
  parafLink?: string; // Tanda tangan penerima / guru
  ttdKepsek?: string; // Tanda tangan digital Kepala Sekolah
  ttdPetugas?: string; // Tanda tangan digital Pengurus Barang
  tanggalTtdKepsek?: string;
  catatanKepsek?: string;
  statusPengesahan?: 'PENDING' | 'DISETUJUI';
  petugas: string;
  keterangan?: string;
}

export interface AuditTrailRecord {
  id: string;
  timestamp: string;
  aksi: 'CREATE' | 'UPDATE' | 'DELETE' | 'PRINT' | 'EXPORT' | 'AI_SCAN' | 'LOGIN';
  modul: string;
  recordId: string;
  userEmail: string;
  dataJson?: string;
}

export interface RkbsItem {
  id: string;
  timestamp: string;
  tahunAnggaran: string;
  kodeBarang: string;
  namaBarang: string;
  kategori: string;
  jumlahDiusulkan: number;
  jenisSatuan: string;
  hargaEstimasi: number;
  totalEstimasi: number;
  prioritas: 'TINGGI' | 'SEDANG' | 'RENDAH';
  sumberDana: 'BOS Reguler' | 'BOS Kinerja' | 'BOP Daerah' | 'Komite' | 'Lainnya';
  status: 'DIUSULKAN' | 'DISETUJUI_RKAS' | 'TEREALISASI' | 'DITOLAK';
  alasanPengadaan: string;
  diajukanOleh: string;
}

