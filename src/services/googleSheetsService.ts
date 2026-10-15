// Google Sheets Service for syncing inventory data with Google Sheets
import { SchoolConfig, MasterItem, AssetRecord, BarangMasuk, BarangKeluar, PengambilanATKRecord, Supplier } from '../types';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id?: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
    gapi?: any;
  }
}

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

export async function getAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services SDK belum dimuat. Pastikan Anda terhubung ke internet.'));
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        scope: SCOPES,
        callback: (resp) => {
          if (resp.error) {
            reject(new Error(`Otorisasi Google gagal: ${resp.error}`));
            return;
          }
          if (resp.access_token) {
            resolve(resp.access_token);
          } else {
            reject(new Error('Tidak dapat memperoleh token akses Google.'));
          }
        },
      });
      client.requestAccessToken({ prompt: '' });
    } catch (err) {
      reject(err);
    }
  });
}

export interface SyncToSheetsResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

export async function exportInventoryToGoogleSheets(
  schoolName: string,
  items: MasterItem[],
  assets: AssetRecord[],
  barangMasuk: BarangMasuk[],
  barangKeluar: BarangKeluar[],
  pengambilanATK: PengambilanATKRecord[],
  suppliers: Supplier[]
): Promise<SyncToSheetsResult> {
  const token = await getAccessToken();

  const title = `SIMBARAS - Inventaris & Aset ${schoolName} (${new Date().toLocaleDateString('id-ID')})`;

  // 1. Create Spreadsheet
  const createResp = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        { properties: { title: 'Master Barang' } },
        { properties: { title: 'Aset KIB' } },
        { properties: { title: 'Barang Masuk' } },
        { properties: { title: 'Barang Keluar' } },
        { properties: { title: 'Pengambilan ATK' } },
        { properties: { title: 'Supplier' } },
      ],
    }),
  });

  if (!createResp.ok) {
    const errText = await createResp.text();
    throw new Error(`Gagal membuat Google Spreadsheet: ${errText}`);
  }

  const spreadsheetData = await createResp.json();
  const spreadsheetId = spreadsheetData.spreadsheetId;
  const spreadsheetUrl = spreadsheetData.spreadsheetUrl;

  // 2. Prepare data values for each tab
  const masterBarangValues = [
    ['ID', 'Kode Barang', 'Nama Barang', 'Kategori', 'Satuan', 'Tipe', 'Batas Minimum', 'Lokasi Default', 'Harga Estimasi (Rp)', 'Status'],
    ...items.map((i) => [i.id, i.kodeBarang, i.namaBarang, i.kategori, i.jenisSatuan, i.tipe, i.batasMinimum, i.lokasiDefault, i.hargaEstimasi, i.status]),
  ];

  const asetKibValues = [
    ['ID', 'Kode Aset', 'Kode Barang', 'Nama Barang', 'Kategori KIB', 'NUP', 'Tahun Perolehan', 'Kondisi', 'Asal Usul', 'Harga Satuan (Rp)', 'Lokasi'],
    ...assets.map((a) => [a.id, a.kodeAset, a.kodeBarang, a.namaBarang, a.kibKategori || '', a.nomorRegisterNup || '', a.tahunPerolehan || '', a.kondisi, a.asalUsul || '', a.hargaSatuan, a.lokasi]),
  ];

  const barangMasukValues = [
    ['ID', 'Tanggal', 'Nama Toko', 'Kode Barang', 'Nama Barang', 'Jumlah', 'Harga Satuan (Rp)', 'Total Pengadaan (Rp)', 'Sumber Anggaran', 'Petugas'],
    ...barangMasuk.map((b) => [b.id, b.tanggal, b.namaToko, b.kodeBarang, b.namaBarang, b.jumlah, b.hargaSatuan, b.totalPengadaan, b.sumberAnggaran, b.petugas]),
  ];

  const barangKeluarValues = [
    ['ID', 'Tanggal', 'Kode Barang', 'Nama Barang', 'Jumlah', 'Penerima', 'Unit Ruangan', 'Tujuan Penggunaan', 'Petugas'],
    ...barangKeluar.map((b) => [b.id, b.tanggal, b.kodeBarang, b.namaBarang, b.jumlah, b.penerima, b.unitRuangan, b.tujuanPenggunaan, b.petugas]),
  ];

  const atkValues = [
    ['ID', 'Tanggal', 'Pemohon / Guru', 'Jabatan', 'Rincian Barang ATK', 'Petugas'],
    ...pengambilanATK.map((p) => [
      p.id,
      p.tanggal,
      p.namaLengkap,
      p.jabatan,
      p.items?.map((it) => `${it.namaBarang} (${it.jumlah} ${it.satuan || ''})`).join(', ') || '',
      p.petugas || '',
    ]),
  ];

  const supplierValues = [
    ['ID', 'Nama Toko / Supplier', 'Narahubung', 'Telepon', 'Alamat', 'Status'],
    ...suppliers.map((s) => [s.id, s.namaToko, s.narahubung, s.telepon, s.alamat, s.status]),
  ];

  // 3. Batch update values to the spreadsheet
  const bodyData = {
    valueInputOption: 'USER_ENTERED',
    data: [
      { range: 'Master Barang!A1', values: masterBarangValues },
      { range: 'Aset KIB!A1', values: asetKibValues },
      { range: 'Barang Masuk!A1', values: barangMasukValues },
      { range: 'Barang Keluar!A1', values: barangKeluarValues },
      { range: 'Pengambilan ATK!A1', values: atkValues },
      { range: 'Supplier!A1', values: supplierValues },
    ],
  };

  const updateResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyData),
  });

  if (!updateResp.ok) {
    const errText = await updateResp.text();
    throw new Error(`Gagal mengisi data ke Google Spreadsheet: ${errText}`);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
  };
}
