import React from 'react';
import { BarangKeluar } from '../types';
import { useInventory } from '../context/InventoryContext';
import { formatTanggalIndo } from '../utils/format';
import { X, Printer, ArrowUpFromLine } from 'lucide-react';

interface BuktiBarangKeluarModalProps {
  record: BarangKeluar | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BuktiBarangKeluarModal: React.FC<BuktiBarangKeluarModalProps> = ({
  record,
  isOpen,
  onClose,
}) => {
  const { config } = useInventory();

  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  const nomorSbpb = `SBPB/${record.tanggal.replace(/-/g, '')}/${record.id.slice(-4).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="modal-dialog-container bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="modal-hide-print bg-orange-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpFromLine className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-base">Surat Bukti Pengeluaran Barang (SBPB)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-700 hover:bg-orange-600 text-white text-xs font-bold transition shadow-xs"
            >
              <Printer className="w-4 h-4" /> Cetak Bukti (PDF)
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
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
              {config.address} • NPSN: {config.npsn} {config.emailSekolah ? `• Email: ${config.emailSekolah}` : ''}
            </p>
            <div className="mt-2 pt-1 border-t border-slate-400">
              <span className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                SURAT BUKTI PENGELUARAN BARANG (SBPB)
              </span>
              <span className="block text-[11px] font-mono text-slate-600">
                Nomor: {nomorSbpb}
              </span>
            </div>
          </div>

          {/* Metadata Table */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Tanggal Distribusi:</span>
              <span className="font-semibold text-slate-900">{formatTanggalIndo(record.tanggal)}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Penerima Barang:</span>
              <span className="font-bold text-slate-900">{record.penerima}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Unit / Ruangan Pemakai:</span>
              <span className="font-semibold text-slate-800">{record.unitRuangan}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Petugas Penyalur:</span>
              <span className="font-semibold text-slate-800">{record.petugas}</span>
            </div>
          </div>

          {/* Table Items */}
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px]">
                <tr>
                  <th className="px-3 py-2 text-center w-10">No</th>
                  <th className="px-3 py-2">Kode Barang</th>
                  <th className="px-3 py-2">Nama Barang Persediaan</th>
                  <th className="px-3 py-2 text-center">Banyaknya</th>
                  <th className="px-3 py-2 text-center">Satuan</th>
                  <th className="px-3 py-2">Tujuan Penggunaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-3 py-2.5 text-center font-mono text-slate-500">1</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-emerald-900">{record.kodeBarang}</td>
                  <td className="px-3 py-2.5 font-bold text-slate-900">{record.namaBarang}</td>
                  <td className="px-3 py-2.5 text-center font-black text-slate-900 text-sm">{record.jumlah}</td>
                  <td className="px-3 py-2.5 text-center text-slate-700">{record.jenisSatuan}</td>
                  <td className="px-3 py-2.5 text-slate-700">{record.tujuanPenggunaan || 'KBM Kelas'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {record.keterangan && (
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <strong className="text-slate-800">Catatan Khusus:</strong> {record.keterangan}
            </div>
          )}

          {/* Signatures */}
          <div className="pt-6 grid grid-cols-3 gap-4 text-xs text-center break-inside-avoid">
            <div>
              <p className="text-slate-600 mb-1">Yang Menerima,</p>
              <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                (Tanda Tangan)
              </div>
              <p className="font-bold underline text-slate-900">{record.penerima}</p>
              <p className="text-slate-500 text-[10px]">Penerima / Pemakai</p>
            </div>

            <div>
              <p className="text-slate-600 mb-1">Petugas Gudang,</p>
              <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                (Tanda Tangan)
              </div>
              <p className="font-bold underline text-slate-900">{record.petugas}</p>
              <p className="text-slate-500 text-[10px]">Penyalur Barang</p>
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
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-orange-700 hover:bg-orange-600 text-white text-xs font-bold transition shadow-xs"
          >
            <Printer className="w-4 h-4" /> Cetak Dokumen SBPB
          </button>
        </div>
      </div>
    </div>
  );
};
