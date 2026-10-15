import QRCode from 'qrcode';

export const formatRupiah = (value: number | string | undefined | null): string => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatTanggalIndo = (dateStr?: string | Date): string => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
};

export const formatWaktuIndo = (dateStr?: string | Date): string => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

export const generateQrCodeUrl = async (text: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, {
      width: 250,
      margin: 1.5,
      color: {
        dark: '#166534',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
};

export const exportToCsv = (filename: string, rows: Record<string, any>[]) => {
  if (!rows || !rows.length) {
    console.warn('Tidak ada data untuk diekspor');
    return;
  }
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((fieldName) => {
          const val = row[fieldName] ?? '';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    ),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.click();
};

export const angkaKeTerbilang = (nilai: number): string => {
  const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  const n = Math.floor(Math.abs(nilai));

  if (n < 12) return bilangan[n];
  if (n < 20) return `${angkaKeTerbilang(n - 10)} Belas`;
  if (n < 100) return `${angkaKeTerbilang(Math.floor(n / 10))} Puluh ${angkaKeTerbilang(n % 10)}`.trim();
  if (n < 200) return `Seratus ${angkaKeTerbilang(n - 100)}`.trim();
  if (n < 1000) return `${angkaKeTerbilang(Math.floor(n / 100))} Ratus ${angkaKeTerbilang(n % 100)}`.trim();
  if (n < 2000) return `Seribu ${angkaKeTerbilang(n - 1000)}`.trim();
  if (n < 1000000) return `${angkaKeTerbilang(Math.floor(n / 1000))} Ribu ${angkaKeTerbilang(n % 1000)}`.trim();
  if (n < 1000000000) return `${angkaKeTerbilang(Math.floor(n / 1000000))} Juta ${angkaKeTerbilang(n % 1000000)}`.trim();
  if (n < 1000000000000) return `${angkaKeTerbilang(Math.floor(n / 1000000000))} Miliar ${angkaKeTerbilang(n % 1000000000)}`.trim();
  return `${angkaKeTerbilang(Math.floor(n / 1000000000000))} Triliun ${angkaKeTerbilang(n % 1000000000000)}`.trim();
};

