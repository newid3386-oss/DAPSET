import {
  SchoolConfig,
  UserEmployee,
  Supplier,
  MasterItem,
  BarangMasuk,
  BarangKeluar,
  AssetRecord,
  MutasiRecord,
  StockOpnameRecord,
  PemeliharaanRecord,
  PenghapusanRecord,
  PengambilanATKRecord,
  AuditTrailRecord,
  RkbsItem,
  LaporanKerusakanRecord,
} from '../types';

export const initialSchoolConfig: SchoolConfig = {
  schoolName: 'SD NEGERI 01 MEKARSARI INDAH',
  npsn: '20108742',
  address: 'Jl. Merdeka Belajar No. 45, Kec. Harapan Mulia, Kab. Bandung Barat',
  headmaster: 'Drs. H. Mulyadi, M.Pd.',
  headmasterNip: '19750812 200003 1 002',
  treasurer: 'Khoirul Fajri, S.Pd.',
  treasurerNip: '19880415 201101 1 004',
  warehouseOfficer: 'Rina Suryani, S.Kom.',
  warehouseOfficerNip: '19920310 201802 2 001',
  dinasPendidikan: 'DINAS PENDIDIKAN DAN KEBUDAYAAN KABUPATEN BANDUNG BARAT',
  emailSekolah: 'sdn01mekarsari@sekolah.belajar.id',
  reduceStockOnATKPickup: false,
  tahunAnggaranAktif: '2026',
  paguAnggaranTahunan: 180000000,
  paguBosReguler: 120000000,
  paguBosKinerja: 45000000,
  paguBopDaerah: 15000000,
  adminPin: '123456',
};

export const initialUsers: UserEmployee[] = [
  {
    id: 'USR-001',
    nip: '19880415 201101 1 004',
    nama: 'Khoirul Fajri, S.Pd.',
    email: 'khoirul.fajri208@admin.sd.belajar.id',
    jabatan: 'Bendahara Sekolah / Guru PJOK',
    role: 'ADMIN',
    status: 'AKTIF',
  },
  {
    id: 'USR-002',
    nip: '19750812 200003 1 002',
    nama: 'Drs. H. Mulyadi, M.Pd.',
    email: 'mulyadi.kepsek@sd.belajar.id',
    jabatan: 'Kepala Sekolah',
    role: 'ADMIN',
    status: 'AKTIF',
  },
  {
    id: 'USR-003',
    nip: '19920310 201802 2 001',
    nama: 'Rina Suryani, S.Kom.',
    email: 'rina.suryani@sd.belajar.id',
    jabatan: 'Pengurus Barang / Staf Tata Usaha',
    role: 'PENGURUS_BARANG',
    status: 'AKTIF',
  },
  {
    id: 'USR-004',
    nip: '19830520 200801 2 015',
    nama: 'Siti Aminah, S.Pd.',
    email: 'siti.aminah@sd.belajar.id',
    jabatan: 'Guru Kelas 6 / Koord. Kurikulum',
    role: 'GURU',
    status: 'AKTIF',
  },
  {
    id: 'USR-005',
    nip: '19901114 201503 1 003',
    nama: 'Budi Santoso, S.Pd.',
    email: 'budi.santoso@sd.belajar.id',
    jabatan: 'Guru Kelas 3 / Pengelola Lab Komputer',
    role: 'GURU',
    status: 'AKTIF',
  },
  {
    id: 'USR-006',
    nip: '19870228 201202 2 006',
    nama: 'Dewi Lestari, S.Pd.SD',
    email: 'dewi.lestari@sd.belajar.id',
    jabatan: 'Guru Kelas 1 / Pembina UKS',
    role: 'GURU',
    status: 'AKTIF',
  },
  {
    id: 'USR-007',
    nip: '19950719 202012 1 005',
    nama: 'Ahmad Fauzi, S.Pd.',
    email: 'ahmad.fauzi@sd.belajar.id',
    jabatan: 'Guru PAI & Budi Pekerti',
    role: 'GURU',
    status: 'AKTIF',
  },
];

export const initialSuppliers: Supplier[] = [];
export const initialItems: MasterItem[] = [];
export const initialBarangMasuk: BarangMasuk[] = [];
export const initialBarangKeluar: BarangKeluar[] = [];
export const initialAssets: AssetRecord[] = [];
export const initialMutasi: MutasiRecord[] = [];
export const initialStockOpname: StockOpnameRecord[] = [];
export const initialPemeliharaan: PemeliharaanRecord[] = [];
export const initialPenghapusan: PenghapusanRecord[] = [];
export const initialPengambilanATK: PengambilanATKRecord[] = [];
export const initialAuditTrail: AuditTrailRecord[] = [];
export const initialRkbs: RkbsItem[] = [];
export const initialLaporanKerusakan: LaporanKerusakanRecord[] = [];
