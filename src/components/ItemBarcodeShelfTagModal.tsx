import React, { useState, useEffect } from 'react';
import { MasterItem } from '../types';
import { useInventory } from '../context/InventoryContext';
import { generateQrCodeUrl, formatRupiah } from '../utils/format';
import { X, Printer, QrCode, Download, Tag, Layers } from 'lucide-react';

interface ItemBarcodeShelfTagModalProps {
  items: MasterItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const ItemBarcodeShelfTagModal: React.FC<ItemBarcodeShelfTagModalProps> = ({
  items,
  isOpen,
  onClose,
}) => {
  const { config, stockSummary } = useInventory();
  const [qrMap, setQrMap] = useState<{ [code: string]: string }>({});

  useEffect(() => {
    if (!isOpen || !items.length) return;

    const generateAll = async () => {
      const result: { [code: string]: string } = {};
      for (const item of items) {
        const qrContent = JSON.stringify({
          kode: item.kodeBarang,
          nama: item.namaBarang,
          lokasi: item.lokasiDefault,
          satuan: item.jenisSatuan,
          min: item.batasMinimum,
        });
        result[item.kodeBarang] = await generateQrCodeUrl(qrContent);
      }
      setQrMap(result);
    };

    generateAll();
  }, [items, isOpen]);

  if (!isOpen || !items.length) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="modal-dialog-container bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="modal-hide-print bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-bold text-base">Cetak Label Rak &amp; Barcode / QR Barang</h3>
              <p className="text-[11px] text-emerald-200">
                Format stiker label rak gudang / boks persediaan sekolah ({items.length} item)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs"
            >
              <Printer className="w-4 h-4" /> Cetak Lembar Label (Print)
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="modal-hide-print bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs text-slate-600">
            <span>
              Menampilkan {items.length} label rak siap cetak. Cocok ditempel di box kontainer, rak besi gudang persediaan, atau lemari ATK guru.
            </span>
            <span className="font-bold text-emerald-800">Layout Stiker Standar A4 (2 Kolom)</span>
          </div>

          {/* Grid of Shelf Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => {
              const currentStok = stockSummary.find((s) => s.kodeBarang === item.kodeBarang)?.stok ?? 0;
              const qrUrl = qrMap[item.kodeBarang];

              return (
                <div
                  key={item.id}
                  className="border-2 border-emerald-800 rounded-xl p-3 bg-white shadow-xs break-inside-avoid relative flex flex-col justify-between"
                >
                  {/* Top Bar */}
                  <div className="border-b border-emerald-800/40 pb-1.5 mb-2 flex items-center justify-between">
                    <div className="leading-tight">
                      <span className="text-[9px] font-bold text-emerald-900 uppercase block tracking-wider">
                        {config.schoolName}
                      </span>
                      <span className="text-[8px] text-slate-500 font-mono">
                        LABEL RAK PERSEDIAAN • NPSN: {config.npsn}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      {item.kategori}
                    </span>
                  </div>

                  {/* Main Info with QR */}
                  <div className="flex items-center gap-3">
                    {qrUrl ? (
                      <img
                        src={qrUrl}
                        alt={`QR ${item.kodeBarang}`}
                        className="w-20 h-20 bg-white border border-slate-200 rounded-lg p-0.5 shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-slate-100 rounded-lg animate-pulse shrink-0" />
                    )}

                    <div className="flex-1 min-w-0 space-y-1">
                      <div>
                        <span className="text-[8px] uppercase font-bold text-slate-400 block">Kode Barang:</span>
                        <span className="font-mono font-black text-emerald-950 text-xs bg-slate-50 px-1 py-0.2 rounded border border-slate-200">
                          {item.kodeBarang}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase font-bold text-slate-400 block">Nama Barang:</span>
                        <div className="font-bold text-slate-900 text-xs leading-tight truncate" title={item.namaBarang}>
                          {item.namaBarang}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-[8px] text-slate-400 block">Satuan:</span>
                          <span className="font-semibold text-slate-800">{item.jenisSatuan}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 block">Batas Min:</span>
                          <span className="font-semibold text-amber-700">{item.batasMinimum} {item.jenisSatuan}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Bar */}
                  <div className="mt-2 pt-1.5 border-t border-dashed border-slate-300 flex justify-between items-center text-[9px] text-slate-600">
                    <span className="truncate max-w-[160px]">
                      Lokasi: <strong>{item.lokasiDefault}</strong>
                    </span>
                    <span className="font-mono text-emerald-800 font-bold">
                      Stok: {currentStok} {item.jenisSatuan}
                    </span>
                  </div>
                </div>
              );
            })}
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
            <Printer className="w-4 h-4" /> Cetak Label Rak Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};
