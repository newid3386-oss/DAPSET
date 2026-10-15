import React, { useState, useEffect } from 'react';
import { AssetRecord } from '../types';
import { generateQrCodeUrl } from '../utils/format';
import { useInventory } from '../context/InventoryContext';
import { X, Printer, CheckSquare, Square, Filter } from 'lucide-react';

interface BatchAssetQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BatchAssetQrModal: React.FC<BatchAssetQrModalProps> = ({ isOpen, onClose }) => {
  const { assets, config } = useInventory();
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  const locations = Array.from(new Set(assets.map((a) => a.lokasi)));

  const displayedAssets = assets.filter(
    (a) => selectedLocation === 'ALL' || a.lokasi === selectedLocation
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedAssetIds(displayedAssets.map((a) => a.id));
    }
  }, [isOpen, selectedLocation]);

  useEffect(() => {
    if (!isOpen) return;

    // Generate QR codes in batch
    const generateAll = async () => {
      const newMap: Record<string, string> = {};
      for (const a of displayedAssets) {
        if (!qrMap[a.id]) {
          const qrData = JSON.stringify({
            kodeAset: a.kodeAset,
            nama: a.namaBarang,
            lokasi: a.lokasi,
            pj: a.penanggungJawab,
            tahun: a.tanggalBku,
          });
          newMap[a.id] = await generateQrCodeUrl(qrData);
        }
      }
      setQrMap((prev) => ({ ...prev, ...newMap }));
    };

    generateAll();
  }, [isOpen, displayedAssets]);

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedAssetIds.length === displayedAssets.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(displayedAssets.map((a) => a.id));
    }
  };

  const toggleSelectAsset = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedForPrint = assets.filter((a) => selectedAssetIds.includes(a.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header (No print) */}
        <div className="no-print bg-emerald-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-sm md:text-base">Cetak Lembar Stiker Label QR Inventaris Massal</h3>
            <p className="text-xs text-emerald-300">Format stiker grid siap cetak A4 untuk ditempel pada aset sekolah</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar (No print) */}
        <div className="no-print p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Filter className="w-4 h-4 text-emerald-700" />
              <span>Ruangan:</span>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value="ALL">Semua Ruangan ({assets.length} aset)</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-semibold"
            >
              {selectedAssetIds.length === displayedAssets.length ? (
                <>
                  <CheckSquare className="w-4 h-4 text-emerald-700" /> Batal Pilih Semua
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-slate-400" /> Pilih Semua
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">
              Terpilih: <strong>{selectedForPrint.length}</strong> stiker label
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={selectedForPrint.length === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs disabled:opacity-50 transition shadow-xs"
            >
              <Printer className="w-4 h-4" /> Cetak Lembar Stiker
            </button>
          </div>
        </div>

        {/* Stickers Grid Viewport */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {selectedForPrint.map((asset) => (
              <div
                key={asset.id}
                onClick={() => toggleSelectAsset(asset.id)}
                className="cursor-pointer border-2 border-emerald-900 rounded-xl p-3 bg-white relative shadow-xs hover:border-emerald-600 transition"
              >
                <div className="border-b border-emerald-900/40 pb-1.5 mb-2 text-center">
                  <div className="text-[10px] font-black tracking-wider text-emerald-950 uppercase truncate">
                    {config.schoolName}
                  </div>
                  <div className="text-[9px] text-slate-600 font-semibold">
                    KARTU INVENTARIS BARANG (KIB / KIR)
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  {qrMap[asset.id] ? (
                    <img
                      src={qrMap[asset.id]}
                      alt="QR"
                      className="w-20 h-20 rounded bg-white p-0.5 border border-emerald-300 shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-slate-100 rounded animate-pulse" />
                  )}

                  <div className="space-y-0.5 text-[11px] leading-tight overflow-hidden">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Kode Aset:</span>
                      <span className="font-mono font-bold text-emerald-950 text-xs bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 inline-block">
                        {asset.kodeAset}
                      </span>
                    </div>
                    <div className="truncate font-semibold text-slate-900">{asset.namaBarang}</div>
                    <div className="text-[10px] text-slate-600 truncate">{asset.merk}</div>
                    <div className="text-[9px] text-slate-500 pt-1 flex justify-between">
                      <span>R: {asset.lokasi}</span>
                      <span>Th: {asset.tanggalBku ? asset.tanggalBku.slice(0, 4) : '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedForPrint.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              Tidak ada aset yang dipilih untuk dicetak.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
