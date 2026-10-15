import * as XLSX from 'xlsx';

export type ExportFormat = 'xlsx' | 'csv' | 'json';

export interface ColumnDefinition {
  key: string;
  label: string;
  format?: (val: any, row?: any) => string | number;
}

export interface ExportOptions {
  filename: string;
  sheetName?: string;
  columns?: ColumnDefinition[];
  title?: string;
  subtitle?: string;
  includeTimestamp?: boolean;
}

/**
 * Cleanly calculate column width based on content
 */
const getColWidths = (data: Record<string, any>[], headers: string[]) => {
  return headers.map((header) => {
    let maxLen = header.length;
    for (const row of data) {
      const cellVal = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
      if (cellVal.length > maxLen) {
        maxLen = Math.min(cellVal.length, 60); // Cap width to 60
      }
    }
    return { wch: Math.max(maxLen + 3, 10) };
  });
};

/**
 * Advanced Excel Export (.xlsx)
 */
export const exportToExcel = (
  data: Record<string, any>[],
  options: ExportOptions
) => {
  if (!data || !data.length) {
    console.warn('Tidak ada data untuk diekspor.');
    return false;
  }

  // Format data based on custom columns if provided
  let formattedData: Record<string, any>[] = [];
  let headers: string[] = [];

  if (options.columns && options.columns.length > 0) {
    headers = options.columns.map((c) => c.label);
    formattedData = data.map((row) => {
      const formattedRow: Record<string, any> = {};
      options.columns!.forEach((col) => {
        const val = row[col.key];
        formattedRow[col.label] = col.format ? col.format(val, row) : (val ?? '');
      });
      return formattedRow;
    });
  } else {
    formattedData = data;
    headers = Object.keys(data[0]);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(formattedData);

  // Set column widths
  ws['!cols'] = getColWidths(formattedData, headers);

  const sheetName = (options.sheetName || 'Data').substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const cleanFilename = options.filename.endsWith('.xlsx')
    ? options.filename
    : `${options.filename}.xlsx`;

  XLSX.writeFile(wb, cleanFilename);
  return true;
};

/**
 * Advanced CSV Export with UTF-8 BOM
 */
export const exportToCsvAdvanced = (
  data: Record<string, any>[],
  options: ExportOptions
) => {
  if (!data || !data.length) {
    console.warn('Tidak ada data untuk diekspor.');
    return false;
  }

  let formattedData: Record<string, any>[] = [];
  let headers: string[] = [];

  if (options.columns && options.columns.length > 0) {
    headers = options.columns.map((c) => c.label);
    formattedData = data.map((row) => {
      const formattedRow: Record<string, any> = {};
      options.columns!.forEach((col) => {
        const val = row[col.key];
        formattedRow[col.label] = col.format ? col.format(val, row) : (val ?? '');
      });
      return formattedRow;
    });
  } else {
    formattedData = data;
    headers = Object.keys(data[0]);
  }

  const csvContent = [
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
    ...formattedData.map((row) =>
      headers
        .map((h) => {
          const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ].join('\r\n');

  // \uFEFF BOM ensures Microsoft Excel recognizes UTF-8 correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = options.filename.endsWith('.csv') ? options.filename : `${options.filename}.csv`;
  link.click();
  return true;
};

/**
 * JSON Export
 */
export const exportToJsonAdvanced = (
  data: any,
  filename: string
) => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  link.click();
  return true;
};

/**
 * Universal Parser for Excel (.xlsx, .xls), CSV (.csv), and JSON (.json)
 */
export const parseUploadedFile = async (
  file: File
): Promise<{ rows: any[]; headers: string[]; fileName: string; totalCount: number }> => {
  const fileName = file.name;
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'json') {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    return { rows, headers, fileName, totalCount: rows.length };
  }

  if (extension === 'csv') {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array', raw: false });
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    return { rows, headers, fileName, totalCount: rows.length };
  }

  if (extension === 'xlsx' || extension === 'xls') {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    return { rows, headers, fileName, totalCount: rows.length };
  }

  throw new Error(`Format file .${extension} tidak didukung. Harap unggah file .xlsx, .xls, .csv, atau .json.`);
};

/**
 * Download sample template workbook
 */
export const downloadTemplate = (
  templateType: 'MASTER_BARANG' | 'ASSET' | 'BARANG_MASUK' | 'BARANG_KELUAR' | 'RKBS' | 'SUPPLIERS' | 'STOCK_OPNAME' | 'PENGAMBILAN_ATK',
  format: 'xlsx' | 'csv' = 'xlsx'
) => {
  const templates: Record<string, { filename: string; sheetName: string; rows: Record<string, any>[] }> = {
    MASTER_BARANG: {
      filename: 'Template_Master_Barang_Sekolah',
      sheetName: 'Master Barang',
      rows: [
        {
          KodeBarang: 'ATK-050',
          NamaBarang: 'Buku Tulis Sinar Dunia 38 Lembar',
          Kategori: 'ATK',
          JenisSatuan: 'Pack',
          Tipe: 'HABIS_PAKAI',
          KodeRekeningRkas: '5.2.2.01.01',
          BatasMinimum: 10,
          LokasiDefault: 'Gudang ATK',
          HargaEstimasi: 42000,
        },
        {
          KodeBarang: 'KBR-015',
          NamaBarang: 'Sabun Cuci Piring Mama Lemon 750ml',
          Kategori: 'Kebersihan',
          JenisSatuan: 'Pouch',
          Tipe: 'HABIS_PAKAI',
          KodeRekeningRkas: '5.2.2.01.05',
          BatasMinimum: 5,
          LokasiDefault: 'Gudang Kebersihan',
          HargaEstimasi: 16500,
        },
        {
          KodeBarang: 'ELK-025',
          NamaBarang: 'Mouse Wireless Logitech B170',
          Kategori: 'Elektronik',
          JenisSatuan: 'Unit',
          Tipe: 'ASET_TETAP',
          KodeRekeningRkas: '5.2.3.02.01',
          BatasMinimum: 2,
          LokasiDefault: 'Lab Komputer',
          HargaEstimasi: 145000,
        },
      ],
    },
    ASSET: {
      filename: 'Template_Aset_Inventaris_KIB',
      sheetName: 'Aset Inventaris',
      rows: [
        {
          KodeAset: 'AST/ELK/2026/050',
          KodeBarang: 'ELK-001',
          NamaBarang: 'Laptop Chromebook Axioo 360',
          KategoriKIB: 'KIB_B',
          Merk: 'Axioo 360 Touch',
          Spesifikasi: 'Intel Celeron 4GB RAM 32GB SSD ChromeOS',
          NomorSeri: 'SN-AXI-2026-999',
          TahunPerolehan: 2026,
          MasaManfaat: 4,
          Jumlah: 1,
          JenisSatuan: 'Unit',
          HargaSatuan: 5900000,
          Lokasi: 'Lab Komputer',
          PenanggungJawab: 'Budi Santoso, S.Pd.',
          Kondisi: 'BAIK',
          SumberDana: 'BOS Kinerja 2026',
        },
        {
          KodeAset: 'AST/MBL/2026/020',
          KodeBarang: 'MBL-001',
          NamaBarang: 'Kursi Kerja Guru Busa Hidrolik',
          KategoriKIB: 'KIB_B',
          Merk: 'Indachi',
          Spesifikasi: 'Rangka Besi Hidrolik Busa Hitam',
          NomorSeri: 'SN-IND-2026-05',
          TahunPerolehan: 2026,
          MasaManfaat: 5,
          Jumlah: 1,
          JenisSatuan: 'Unit',
          HargaSatuan: 750000,
          Lokasi: 'Ruang Guru',
          PenanggungJawab: 'Siti Aminah, S.Pd.',
          Kondisi: 'BAIK',
          SumberDana: 'BOS Reguler',
        },
      ],
    },
    BARANG_MASUK: {
      filename: 'Template_Faktur_Barang_Masuk',
      sheetName: 'Barang Masuk',
      rows: [
        {
          Tanggal: new Date().toISOString().slice(0, 10),
          BulanPengadaan: 'Oktober 2026',
          NamaToko: 'CV Mitra Edukasi Mandiri',
          KodeBarang: 'ATK-001',
          NamaBarang: 'Kertas HVS A4 70 Gram (PaperOne)',
          Jumlah: 15,
          JenisSatuan: 'Rim',
          HargaSatuan: 52000,
          SumberAnggaran: 'BOS Reguler',
          KodeRekeningRkas: '5.2.2.01.01',
          NomorBku: 'BKU/BOS/10/001',
          NomorKwitansi: 'KWT/MITRA/2026/101',
          Keterangan: 'Belanja persediaan ATK kantor semester genap',
        },
        {
          Tanggal: new Date().toISOString().slice(0, 10),
          BulanPengadaan: 'Oktober 2026',
          NamaToko: 'Toko Sumber Bersih Abadi',
          KodeBarang: 'KBR-001',
          NamaBarang: 'Cairan Pembersih Lantai Wipol 780ml',
          Jumlah: 10,
          JenisSatuan: 'Pouch',
          HargaSatuan: 18500,
          SumberAnggaran: 'BOS Reguler',
          KodeRekeningRkas: '5.2.2.01.05',
          NomorBku: 'BKU/BOS/10/002',
          NomorKwitansi: 'KWT/SBA/2026/045',
          Keterangan: 'Kebutuhan sanitasi harian toilet siswa',
        },
      ],
    },
    BARANG_KELUAR: {
      filename: 'Template_Distribusi_Barang_Keluar',
      sheetName: 'Barang Keluar',
      rows: [
        {
          Tanggal: new Date().toISOString().slice(0, 10),
          KodeBarang: 'ATK-001',
          NamaBarang: 'Kertas HVS A4 70 Gram (PaperOne)',
          Jumlah: 3,
          JenisSatuan: 'Rim',
          Penerima: 'Siti Aminah, S.Pd.',
          UnitTujuan: 'Kelas 6',
          Keperluan: 'Cetak Lembar Kerja Asesmen Sumatif',
        },
        {
          Tanggal: new Date().toISOString().slice(0, 10),
          KodeBarang: 'KBR-001',
          NamaBarang: 'Cairan Pembersih Lantai Wipol 780ml',
          Jumlah: 2,
          JenisSatuan: 'Pouch',
          Penerima: 'Agus Sudrajat',
          UnitTujuan: 'Petugas Kebersihan',
          Keperluan: 'Pembersihan harian lorong kelas',
        },
      ],
    },
    RKBS: {
      filename: 'Template_Perencanaan_RKBS',
      sheetName: 'Rencana Belanja',
      rows: [
        {
          TahunAnggaran: '2026',
          KodeBarang: 'ATK-001',
          NamaBarang: 'Kertas HVS A4 70 Gram (PaperOne)',
          Kategori: 'ATK',
          JumlahDiusulkan: 20,
          JenisSatuan: 'Rim',
          HargaEstimasi: 52000,
          Prioritas: 'TINGGI',
          SumberDana: 'BOS Reguler',
          AlasanPengadaan: 'Stok persediaan kantor menipis jelang ujian PTS',
          DiajukanOleh: 'Tim Kurikulum',
        },
        {
          TahunAnggaran: '2026',
          KodeBarang: 'ELK-002',
          NamaBarang: 'Kabel VGA to HDMI Converter',
          Kategori: 'Elektronik',
          JumlahDiusulkan: 4,
          JenisSatuan: 'Unit',
          HargaEstimasi: 85000,
          Prioritas: 'SEDANG',
          SumberDana: 'BOS Reguler',
          AlasanPengadaan: 'Dukungan infokus presentasi guru di kelas 4 dan 5',
          DiajukanOleh: 'Koordinator Sarpras',
        },
      ],
    },
    SUPPLIERS: {
      filename: 'Template_Daftar_Supplier_Rekanan',
      sheetName: 'Supplier Rekanan',
      rows: [
        {
          NamaToko: 'CV Harapan Edukasi Nusantara',
          Kategori: 'ATK & Cetak',
          Alamat: 'Jl. Raya Padalarang No. 88, Bandung Barat',
          Telepon: '081234567890',
          KontakPerson: 'Hendra Setiawan',
          StatusSipLah: 'TERDAFTAR',
          Catatan: 'Rekanan belanja buku dan kertas resmi SIPLah',
        },
        {
          NamaToko: 'PT Media Prima Mandiri',
          Kategori: 'Elektronik & TIK',
          Alamat: 'Jl. Surya Sumantri No. 45, Bandung',
          Telepon: '085712345678',
          KontakPerson: 'Dewi Anggraeni',
          StatusSipLah: 'TERDAFTAR',
          Catatan: 'Penyedia resmi Chromebook Axioo dan proyektor',
        },
      ],
    },
    STOCK_OPNAME: {
      filename: 'Template_Hasil_Stock_Opname',
      sheetName: 'Audit Fisik Stok',
      rows: [
        {
          Tanggal: new Date().toISOString().slice(0, 10),
          KodeBarang: 'ATK-001',
          NamaBarang: 'Kertas HVS A4 70 Gram (PaperOne)',
          StokSistem: 10,
          StokFisik: 10,
          JenisSatuan: 'Rim',
          Lokasi: 'Gudang ATK',
          Petugas: 'Rina Suryani, S.Kom.',
          Tindakan: 'SESUAI',
          Keterangan: 'Hasil hitung fisik cocok dengan saldo sistem',
        },
      ],
    },
    PENGAMBILAN_ATK: {
      filename: 'Template_Pengambilan_ATK',
      sheetName: 'Pengambilan ATK',
      rows: [
        {
          Tanggal: new Date().toISOString().slice(0, 10),
          Nip: '19830520 200801 2 015',
          NamaLengkap: 'Siti Aminah, S.Pd.',
          Jabatan: 'Guru Kelas 5',
          KodeBarang: 'ATK-001',
          NamaBarang: 'Kertas HVS A4 70 Gram (PaperOne)',
          Jumlah: 2,
          JenisSatuan: 'Rim',
          Keterangan: 'Pengambilan ATK untuk ulangan harian',
        },
      ],
    },
  };

  const t = templates[templateType];
  if (!t) return;

  if (format === 'csv') {
    exportToCsvAdvanced(t.rows, {
      filename: `${t.filename}.csv`,
    });
  } else {
    exportToExcel(t.rows, {
      filename: `${t.filename}.xlsx`,
      sheetName: t.sheetName,
    });
  }
};
