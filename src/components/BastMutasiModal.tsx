import React from 'react';
import { MutasiRecord } from '../types';
import { useInventory } from '../context/InventoryContext';
import { formatTanggalIndo } from '../utils/format';
import { X, Printer, ArrowLeftRight } from 'lucide-react';

interface BastMutasiModalProps {
  record: MutasiRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BastMutasiModal: React.FC<BastMutasiModalProps> = ({ record, isOpen, onClose }) => {
  const { config, assets } = useInventory();

  if (!isOpen || !record) return null;

  const assetDetails = assets.find((a) => a.kodeAset === record.kodeAset);
  const handlePrint = () => {
    window.print();
  };

  const nomorBast = `BAST-MUTASI/${record.tanggal.slice(0, 4)}/${record.id.slice(-4).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="modal-dialog-container bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="modal-hide-print bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-base">Berita Acara Serah Terima Mutasi Aset (BAST Mutasi)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs"
            >
              <Printer className="w-4 h-4" /> Cetak BAST (PDF)
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Letterhead */}
          <div className="text-center border-b-2 border-slate-900 pb-3">
            <h2 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
              {config.dinasPendidikan || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}
            </h2>
            <h1 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">
              {config.schoolName}
            </h1>
            <p className="text-[11px] text-slate-600">
              {config.address} • NPSN: {config.npsn}
            </p>
            <div className="mt-2 pt-1 border-t border-slate-400">
              <span className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                BERITA ACARA SERAH TERIMA MUTASI BARANG MILIK SEKOLAH
              </span>
              <span className="block text-[11px] font-mono text-slate-600">
                Nomor: {nomorBast}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-700 leading-relaxed space-y-3">
            <p>
              Pada hari ini, tanggal <strong>{formatTanggalIndo(record.tanggal)}</strong>, bertempat di {config.schoolName}, kami yang bertanda tangan di bawah ini:
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-semibold">1. Pihak Pertama (Menyerahkan):</span>
                <span className="col-span-2 font-bold text-slate-900">
                  {record.dariPj} <span className="font-normal text-slate-600">(PJ Ruangan {record.dariLokasi})</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-semibold">2. Pihak Kedua (Menerima):</span>
                <span className="col-span-2 font-bold text-slate-900">
                  {record.kePj} <span className="font-normal text-slate-600">(PJ Ruangan Baru {record.keLokasi})</span>
                </span>
              </div>
            </div>

            <p>
              Menyatakan bahwa Pihak Pertama telah menyerahkan barang inventaris milik sekolah berikut kepada Pihak Kedua dalam keadaan siap digunakan:
            </p>
          </div>

          {/* Asset Info Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px]">
                <tr>
                  <th className="px-3 py-2 text-center w-10">No</th>
                  <th className="px-3 py-2">Kode Aset</th>
                  <th className="px-3 py-2">Nama Barang &amp; Spesifikasi</th>
                  <th className="px-3 py-2">Lokasi Asal &rarr; Tujuan</th>
                  <th className="px-3 py-2 text-center">Kondisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-3 py-2.5 text-center font-mono text-slate-500">1</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-emerald-900">{record.kodeAset}</td>
                  <td className="px-3 py-2.5">
                    <span className="font-bold text-slate-900">{record.namaBarang}</span>
                    {assetDetails && (
                      <span className="block text-[10px] text-slate-500">
                        Merk: {assetDetails.merk} • SN: {assetDetails.nomorSeri || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700 font-medium">
                    {record.dariLokasi} &rarr; <strong>{record.keLokasi}</strong>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {assetDetails?.kondisi || 'BAIK'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            <p><strong>Alasan / Keperluan Mutasi:</strong> {record.alasan}</p>
            {record.keterangan && <p><strong>Keterangan Tambahan:</strong> {record.keterangan}</p>}
            <p className="pt-2 text-[11px] text-slate-500 italic">
              Demikian Berita Acara ini dibuat dengan sebenarnya dalam 2 (dua) rangkap untuk dipergunakan sebagai dasar pembaruan Kartu Inventaris Ruangan (KIR) dan pembukuan barang sekolah.
            </p>
          </div>

          {/* 3-Column Signatures */}
          <div className="pt-6 grid grid-cols-3 gap-4 text-xs text-center break-inside-avoid">
            <div>
              <p className="text-slate-600 mb-1">Pihak Pertama,</p>
              <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                (Tanda Tangan)
              </div>
              <p className="font-bold underline text-slate-900">{record.dariPj}</p>
              <p className="text-slate-500 text-[10px]">Yang Menyerahkan</p>
            </div>

            <div>
              <p className="text-slate-600 mb-1">Pihak Kedua,</p>
              <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                (Tanda Tangan)
              </div>
              <p className="font-bold underline text-slate-900">{record.kePj}</p>
              <p className="text-slate-500 text-[10px]">Yang Menerima</p>
            </div>

            <div>
              <p className="text-slate-600 mb-1">Mengetahui,</p>
              <p className="font-semibold text-slate-800">Kepala Sekolah</p>
              <div className="h-14 flex items-center justify-center text-slate-300 italic text-[11px]">
                (Tanda Tangan &amp; Stempel)
              </div>
              <p className="font-bold underline text-slate-900">{config.headmaster}</p>
              <p className="text-slate-500 font-mono text-[10px]">NIP. {config.headmasterNip}</p>
            </div>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="modal-hide-print p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
          >
            <Printer className="w-4 h-4" /> Cetak Lembar BAST
          </button>
        </div>
      </div>
    </div>
  );
};
