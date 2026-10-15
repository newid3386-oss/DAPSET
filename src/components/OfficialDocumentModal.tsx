import React, { useRef } from 'react';
import { X, Printer, Download, School, FileCheck, CheckCircle2, Building } from 'lucide-react';
import { SchoolConfig } from '../types';
import { formatRupiah, formatTanggalIndo } from '../utils/format';

export interface BastItem {
  namaBarang: string;
  kodeBarang?: string;
  jumlah: number;
  jenisSatuan: string;
  hargaSatuan: number;
  total: number;
}

export interface OfficialDocumentData {
  type: 'BAST' | 'BAHP';
  title: string;
  nomorSurat: string;
  tanggal: string;
  pihakPertama?: {
    nama: string;
    jabatan: string;
    instansi: string; // e.g. "Toko Buku & ATK Barokah"
    alamat?: string;
  };
  pihakKedua?: {
    nama: string;
    nip: string;
    jabatan: string;
  };
  items: BastItem[];
  keterangan?: string;
  sumberAnggaran?: string;
}

interface OfficialDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SchoolConfig;
  data: OfficialDocumentData;
}

export const OfficialDocumentModal: React.FC<OfficialDocumentModalProps> = ({
  isOpen,
  onClose,
  config,
  data,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const totalNilai = data.items.reduce((acc, curr) => acc + curr.total, 0);

  const handlePrint = () => {
    window.print();
  };

  const getDayName = (dateStr: string) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'Hari Ini' : days[d.getDay()];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6 flex flex-col max-h-[92vh]">
        {/* Modal Top Control Bar (Hidden during print) */}
        <div className="no-print bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">{data.title}</h3>
              <p className="text-[11px] text-slate-400">Pratinjau dokumen resmi siap cetak format A4 / Folio</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md"
            >
              <Printer className="w-4 h-4" /> Cetak Dokumen (PDF)
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 md:p-10 overflow-y-auto flex-1 bg-white font-serif text-slate-900 print:p-0 print:overflow-visible">
          {/* KOP SURAT RESMI */}
          <div className="border-b-4 border-double border-slate-900 pb-4 mb-6 text-center">
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-slate-900 flex items-center justify-center text-slate-900 shrink-0">
                <School className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-widest font-bold text-slate-700">
                  PEMERINTAH DAERAH PROVINSI / KABUPATEN
                </h4>
                <h3 className="text-sm font-bold uppercase text-slate-800">
                  {config.dinasPendidikan || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}
                </h3>
                <h2 className="text-lg md:text-xl font-extrabold uppercase tracking-tight text-slate-900">
                  {config.schoolName}
                </h2>
                <p className="text-[11px] text-slate-600 italic font-sans mt-0.5">
                  {config.address} • NPSN: {config.npsn} {config.emailSekolah ? `• Pos-el: ${config.emailSekolah}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* JUDUL DOKUMEN & NOMOR */}
          <div className="text-center mb-6">
            <h1 className="text-base font-extrabold tracking-wide uppercase underline decoration-1">
              {data.title}
            </h1>
            <p className="text-xs font-sans font-semibold text-slate-700 mt-1">
              Nomor: {data.nomorSurat || '... / BAST-BOS / 2026'}
            </p>
          </div>

          {/* DOKUMEN TIPE: BAST (Berita Acara Serah Terima) */}
          {data.type === 'BAST' && (
            <div className="text-xs font-sans leading-relaxed space-y-4">
              <p>
                Pada hari ini <strong>{getDayName(data.tanggal)}</strong> tanggal{' '}
                <strong>{formatTanggalIndo(data.tanggal)}</strong>, bertempat di {config.schoolName}, kami yang bertanda tangan di bawah ini:
              </p>

              {/* PIHAK PERTAMA & KEDUA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1 text-[11px]">
                    I. PIHAK PERTAMA (PENYEDIA / TOKO)
                  </span>
                  <div className="grid grid-cols-3 gap-1 pt-1">
                    <span className="text-slate-500">Nama / Toko:</span>
                    <span className="col-span-2 font-semibold text-slate-800">
                      {data.pihakPertama?.nama || 'Toko Rekanan SIPLah'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Jabatan:</span>
                    <span className="col-span-2 text-slate-800">
                      {data.pihakPertama?.jabatan || 'Penyedia Barang / Direktur'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Alamat:</span>
                    <span className="col-span-2 text-slate-700">
                      {data.pihakPertama?.alamat || 'Mitra Pengadaan Sekolah'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1 text-[11px]">
                    II. PIHAK KEDUA (PENGURUS / KEPALA SEKOLAH)
                  </span>
                  <div className="grid grid-cols-3 gap-1 pt-1">
                    <span className="text-slate-500">Nama:</span>
                    <span className="col-span-2 font-semibold text-slate-800">
                      {data.pihakKedua?.nama || config.treasurer || config.warehouseOfficer}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">NIP:</span>
                    <span className="col-span-2 font-mono text-slate-800">
                      {data.pihakKedua?.nip || config.treasurerNip || '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Jabatan:</span>
                    <span className="col-span-2 text-slate-800">
                      {data.pihakKedua?.jabatan || 'Pengurus Barang / Bendahara BOS'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Sekolah:</span>
                    <span className="col-span-2 text-slate-800">{config.schoolName}</span>
                  </div>
                </div>
              </div>

              <p>
                Menyatakan bahwa <strong>PIHAK PERTAMA</strong> telah menyerahkan kepada <strong>PIHAK KEDUA</strong>, dan <strong>PIHAK KEDUA</strong> telah menerima dengan lengkap barang hasil pengadaan dana{' '}
                <strong>{data.sumberAnggaran || 'BOS Reguler'}</strong> tahun anggaran 2026 dengan rincian sebagai berikut:
              </p>

              {/* TABEL BARANG */}
              <div className="overflow-x-auto my-3">
                <table className="w-full border-collapse border border-slate-400 text-xs">
                  <thead className="bg-slate-100 text-slate-800">
                    <tr>
                      <th className="border border-slate-400 py-2 px-2 text-center w-10">No</th>
                      <th className="border border-slate-400 py-2 px-3 text-left">Nama Barang / Spesifikasi</th>
                      <th className="border border-slate-400 py-2 px-3 text-center">Banyaknya</th>
                      <th className="border border-slate-400 py-2 px-3 text-right">Harga Satuan (Rp)</th>
                      <th className="border border-slate-400 py-2 px-3 text-right">Jumlah Total (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="border border-slate-400 py-1.5 px-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-400 py-1.5 px-3 font-medium">
                          {item.namaBarang}
                          {item.kodeBarang && (
                            <span className="block text-[10px] text-slate-500 font-mono">
                              Kode: {item.kodeBarang}
                            </span>
                          )}
                        </td>
                        <td className="border border-slate-400 py-1.5 px-3 text-center font-semibold">
                          {item.jumlah} {item.jenisSatuan}
                        </td>
                        <td className="border border-slate-400 py-1.5 px-3 text-right">
                          {formatRupiah(item.hargaSatuan)}
                        </td>
                        <td className="border border-slate-400 py-1.5 px-3 text-right font-bold text-slate-900">
                          {formatRupiah(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={4} className="border border-slate-400 py-2 px-3 text-right">
                        TOTAL PEMBAYARAN:
                      </td>
                      <td className="border border-slate-400 py-2 px-3 text-right font-bold text-slate-900 text-sm">
                        {formatRupiah(totalNilai)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <p className="text-[11px] text-slate-600 italic">
                {data.keterangan ||
                  'Barang-barang tersebut di atas telah diperiksa secara seksama oleh Tim Pengurus Barang Sekolah, dan diterima dalam keadaan baru, baik, cukup jumlahnya, serta memenuhi spesifikasi yang dipersyaratkan.'}
              </p>

              <p>
                Demikian Berita Acara Serah Terima ini dibuat dalam rangkap 2 (dua) yang masing-masing mempunyai kekuatan hukum yang sama untuk dipergunakan sebagaimana mestinya.
              </p>
            </div>
          )}

          {/* DOKUMEN TIPE: BAHP (Berita Acara Hasil Pemeriksaan Fisik Persediaan) */}
          {data.type === 'BAHP' && (
            <div className="text-xs font-sans leading-relaxed space-y-4">
              <p>
                Pada hari ini <strong>{getDayName(data.tanggal)}</strong> tanggal{' '}
                <strong>{formatTanggalIndo(data.tanggal)}</strong>, Panitia Pemeriksa / Pengurus Barang {config.schoolName} telah melaksanakan pemeriksaan fisik (Stock Opname) persediaan habis pakai di gudang sekolah, dengan hasil rekonsiliasi sebagai berikut:
              </p>

              {/* TABEL BAHP */}
              <div className="overflow-x-auto my-3">
                <table className="w-full border-collapse border border-slate-400 text-xs">
                  <thead className="bg-slate-100 text-slate-800">
                    <tr>
                      <th className="border border-slate-400 py-2 px-2 text-center w-10">No</th>
                      <th className="border border-slate-400 py-2 px-3 text-left">Kode &amp; Nama Barang</th>
                      <th className="border border-slate-400 py-2 px-3 text-center">Satuan</th>
                      <th className="border border-slate-400 py-2 px-3 text-center">Stok Sistem</th>
                      <th className="border border-slate-400 py-2 px-3 text-center">Stok Fisik</th>
                      <th className="border border-slate-400 py-2 px-3 text-center">Selisih</th>
                      <th className="border border-slate-400 py-2 px-3 text-left">Hasil &amp; Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, idx) => {
                      const selisih = item.total; // stored in total property
                      return (
                        <tr key={idx}>
                          <td className="border border-slate-400 py-1.5 px-2 text-center">{idx + 1}</td>
                          <td className="border border-slate-400 py-1.5 px-3 font-medium">
                            {item.namaBarang}
                            <span className="block text-[10px] text-slate-500 font-mono">
                              {item.kodeBarang}
                            </span>
                          </td>
                          <td className="border border-slate-400 py-1.5 px-3 text-center">{item.jenisSatuan}</td>
                          <td className="border border-slate-400 py-1.5 px-3 text-center font-bold text-slate-700">
                            {item.hargaSatuan}
                          </td>
                          <td className="border border-slate-400 py-1.5 px-3 text-center font-bold text-slate-900">
                            {item.jumlah}
                          </td>
                          <td className="border border-slate-400 py-1.5 px-3 text-center font-bold">
                            {selisih === 0 ? (
                              <span className="text-emerald-800">0 (Cocok)</span>
                            ) : selisih > 0 ? (
                              <span className="text-blue-800">+{selisih}</span>
                            ) : (
                              <span className="text-rose-800">{selisih}</span>
                            )}
                          </td>
                          <td className="border border-slate-400 py-1.5 px-3 text-[11px] text-slate-700">
                            {selisih === 0 ? 'Fisik klop dengan sistem' : 'Perlu penyesuaian BKU'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p>
                Hasil pemeriksaan fisik persediaan di atas dinyatakan sah dan dapat digunakan sebagai dasar penyusunan Laporan Mutasi Barang dan Buku Kas Umum (BKU) Pembantu Barang Sekolah.
              </p>
            </div>
          )}

          {/* SIGNATURE BLOCK */}
          <div className="mt-8 pt-4 grid grid-cols-2 gap-8 text-center text-xs font-sans break-inside-avoid">
            {data.type === 'BAST' ? (
              <>
                <div>
                  <p className="text-slate-600 mb-1">Yang Menyerahkan,</p>
                  <p className="font-bold text-slate-900 mb-16">
                    PIHAK PERTAMA (PENYEDIA / TOKO)
                  </p>
                  <p className="font-bold underline text-slate-900">
                    {data.pihakPertama?.nama || 'Toko Rekanan'}
                  </p>
                  <p className="text-[11px] text-slate-500">Penyedia Barang</p>
                </div>

                <div>
                  <p className="text-slate-600 mb-1">
                    {config.address.split(',')[1] || 'Tempat'}, {formatTanggalIndo(data.tanggal)}
                  </p>
                  <p className="font-bold text-slate-900 mb-16">
                    PIHAK KEDUA (PENGURUS BARANG)
                  </p>
                  <p className="font-bold underline text-slate-900">
                    {data.pihakKedua?.nama || config.treasurer || config.warehouseOfficer}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    NIP. {data.pihakKedua?.nip || config.treasurerNip || '-'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-slate-600 mb-1">Petugas Pemeriksa Fisik Gudang,</p>
                  <p className="font-bold text-slate-900 mb-16">PENGURUS BARANG</p>
                  <p className="font-bold underline text-slate-900">
                    {config.warehouseOfficer || config.treasurer}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    NIP. {config.warehouseOfficerNip || config.treasurerNip || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-600 mb-1">
                    {config.address.split(',')[1] || 'Tempat'}, {formatTanggalIndo(data.tanggal)}
                  </p>
                  <p className="font-bold text-slate-900 mb-16">MENGETAHUI KEPALA SEKOLAH</p>
                  <p className="font-bold underline text-slate-900">{config.headmaster}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    NIP. {config.headmasterNip || '-'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
