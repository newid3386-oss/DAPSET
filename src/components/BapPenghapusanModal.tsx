import React from 'react';
import { PenghapusanRecord } from '../types';
import { useInventory } from '../context/InventoryContext';
import { formatTanggalIndo, formatRupiah } from '../utils/format';
import { X, Printer, Trash2 } from 'lucide-react';

interface BapPenghapusanModalProps {
  record: PenghapusanRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BapPenghapusanModal: React.FC<BapPenghapusanModalProps> = ({
  record,
  isOpen,
  onClose,
}) => {
  const { config, assets } = useInventory();

  if (!isOpen || !record) return null;

  const assetDetails = assets.find((a) => a.kodeAset === record.kodeAset);
  const handlePrint = () => {
    window.print();
  };

  const nomorBap = `BAP-HAPUS/${record.tanggal.slice(0, 4)}/${record.id.slice(-4).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="modal-dialog-container bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="modal-hide-print bg-red-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-base">Berita Acara Pemeriksaan &amp; Usulan Penghapusan Aset</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs"
            >
              <Printer className="w-4 h-4" /> Cetak Berkas (PDF)
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
              {config.address} • NPSN: {config.npsn}
            </p>
            <div className="mt-2 pt-1 border-t border-slate-400">
              <span className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                BERITA ACARA PEMERIKSAAN KELAYAKAN &amp; USULAN PENGHAPUSAN BARANG
              </span>
              <span className="block text-[11px] font-mono text-slate-600">
                Nomor: {nomorBap} • Dasar SK: {record.dokumen}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-700 leading-relaxed space-y-3">
            <p>
              Pada hari ini, tanggal <strong>{formatTanggalIndo(record.tanggal)}</strong>, Panitia Pemeriksa Barang Milik Sekolah pada {config.schoolName} telah melakukan pemeriksaan fisik terhadap barang inventaris yang diusulkan untuk dihapuskan dari Buku Induk Inventaris:
            </p>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px]">
                  <tr>
                    <th className="px-3 py-2">Kode Aset</th>
                    <th className="px-3 py-2">Nama Barang &amp; Spesifikasi</th>
                    <th className="px-3 py-2 text-center">Kondisi Akhir</th>
                    <th className="px-3 py-2 text-right">Nilai Perolehan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="px-3 py-2.5 font-mono font-bold text-red-900">{record.kodeAset}</td>
                    <td className="px-3 py-2.5">
                      <span className="font-bold text-slate-900">{record.namaBarang}</span>
                      {assetDetails && (
                        <span className="block text-[10px] text-slate-500">
                          Merk: {assetDetails.merk} • Tahun: {assetDetails.tanggalBku?.slice(0, 4) || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                        {record.kondisiAkhir}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(assetDetails?.totalNilai || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div>
                <span className="font-bold text-slate-900 block">Alasan Penghapusan:</span>
                <p className="text-slate-600 mt-0.5">{record.alasan}</p>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900 block">Status Usulan &amp; Rekomendasi:</span>
                <p className="text-slate-600 mt-0.5">
                  Status berkas saat ini: <span className="font-bold text-red-900">{record.status}</span>. Direkomendasikan untuk ditindaklanjuti dengan pemusnahan / lelang sesuai ketentuan Permendagri No. 47 Tahun 2021.
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Demikian Berita Acara Pemeriksaan Fisik ini dibuat dengan sebenarnya untuk dijadikan bahan pertimbangan penetapan Surat Keputusan Penghapusan oleh pihak yang berwenang.
            </p>
          </div>

          {/* Signatures */}
          <div className="pt-6 grid grid-cols-3 gap-4 text-xs text-center break-inside-avoid">
            <div>
              <p className="text-slate-600 mb-1">Panitia Pemeriksa,</p>
              <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                (Tanda Tangan)
              </div>
              <p className="font-bold underline text-slate-900">{record.petugas}</p>
              <p className="text-slate-500 text-[10px]">Ketua Pemeriksa</p>
            </div>

            <div>
              <p className="text-slate-600 mb-1">Pengurus Barang,</p>
              <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                (Tanda Tangan)
              </div>
              <p className="font-bold underline text-slate-900">{config.warehouseOfficer || config.treasurer}</p>
              <p className="text-slate-500 text-[10px]">NIP. {config.warehouseOfficerNip || config.treasurerNip}</p>
            </div>

            <div>
              <p className="text-slate-600 mb-1">Menyetujui,</p>
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
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs"
          >
            <Printer className="w-4 h-4" /> Cetak Berkas Usulan
          </button>
        </div>
      </div>
    </div>
  );
};
