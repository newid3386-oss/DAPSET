import React, { useEffect, useState } from 'react';
import { AssetRecord } from '../types';
import { generateQrCodeUrl, formatRupiah, formatTanggalIndo } from '../utils/format';
import { useInventory } from '../context/InventoryContext';
import { X, Printer, Download, QrCode } from 'lucide-react';

interface AssetQrModalProps {
  asset: AssetRecord | null;
  onClose: () => void;
}

export const AssetQrModal: React.FC<AssetQrModalProps> = ({ asset, onClose }) => {
  const { config } = useInventory();
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (!asset) return;
    const qrData = JSON.stringify({
      kodeAset: asset.kodeAset,
      nama: asset.namaBarang,
      lokasi: asset.lokasi,
      pj: asset.penanggungJawab,
      tahun: asset.tanggalBku,
    });

    generateQrCodeUrl(qrData).then(setQrUrl);
  }, [asset]);

  if (!asset) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `QR_${asset.kodeAset.replace(/\//g, '_')}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-base">Label Stiker Inventaris Aset</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Printable Sticker Preview */}
          <div id="printable-asset-sticker" className="border-2 border-emerald-800 rounded-xl p-4 bg-emerald-50/40 relative">
            <div className="border-b border-emerald-800/40 pb-2 mb-3 text-center">
              <div className="text-[11px] font-black tracking-wider text-emerald-900 uppercase">
                {config.schoolName}
              </div>
              <div className="text-[10px] text-slate-600 font-medium">
                KARTU INVENTARIS BARANG (KIB / KIR)
              </div>
            </div>

            <div className="flex gap-4 items-center">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt={`QR ${asset.kodeAset}`}
                  className="w-28 h-28 rounded-lg bg-white p-1 border border-emerald-300 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-28 h-28 bg-slate-100 rounded-lg animate-pulse" />
              )}

              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Kode Aset:</span>
                  <span className="font-mono font-bold text-emerald-950 text-sm bg-white px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                    {asset.kodeAset}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Nama Barang:</span>
                  <span className="font-semibold text-slate-900">{asset.namaBarang}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Merk / Seri:</span>
                  <span className="text-slate-700">{asset.merk} {asset.nomorSeri ? `(${asset.nomorSeri})` : ''}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                  <div>
                    <span className="text-slate-500 text-[9px] uppercase font-bold block">Ruangan:</span>
                    <span className="font-medium text-slate-800">{asset.lokasi}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[9px] uppercase font-bold block">Tahun Perolehan:</span>
                    <span className="font-medium text-slate-800">{asset.tanggalBku ? asset.tanggalBku.slice(0, 4) : '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-dashed border-emerald-300 text-[9px] text-slate-500 flex justify-between items-center">
              <span>PJ: {asset.penanggungJawab}</span>
              <span className="font-mono">NPSN: {config.npsn}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 justify-end">
            <button
              onClick={handleDownloadQr}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" /> Unduh Gambar QR
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-800 text-white hover:bg-emerald-700 text-xs font-bold shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak Label Stiker
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
