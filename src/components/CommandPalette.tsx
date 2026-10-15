import React, { useState, useEffect } from 'react';
import { Search, X, Boxes, Building2, FileSignature, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { PageId } from './Navigation';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PageId) => void;
  onSelectAsset?: (assetId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { items, assets, pengambilanATK } = useInventory();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredItems = query
    ? items.filter(
        (i) =>
          i.namaBarang.toLowerCase().includes(query.toLowerCase()) ||
          i.kodeBarang.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 4)
    : [];

  const filteredAssets = query
    ? assets.filter(
        (a) =>
          a.namaBarang.toLowerCase().includes(query.toLowerCase()) ||
          a.kodeAset.toLowerCase().includes(query.toLowerCase()) ||
          a.lokasi.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 4)
    : [];

  const filteredAtk = query
    ? pengambilanATK.filter(
        (atk) =>
          atk.namaLengkap.toLowerCase().includes(query.toLowerCase()) ||
          atk.nip.includes(query)
      ).slice(0, 3)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Search input bar */}
        <div className="p-3.5 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-700" />
          <input
            type="text"
            autoFocus
            placeholder="Cari barang, kode aset, guru pengambil ATK, atau menu..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400"
          />
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-500 hover:text-slate-700"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="p-3 max-h-96 overflow-y-auto space-y-4 text-xs">
          {!query && (
            <div className="text-center py-8 text-slate-400">
              <p>Ketik nama barang, kode aset, atau nama guru untuk mencari instan.</p>
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                <button
                  onClick={() => {
                    onNavigate('dashboard');
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    onNavigate('persediaan');
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Persediaan
                </button>
                <button
                  onClick={() => {
                    onNavigate('kiosk');
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold"
                >
                  Kiosk Guru
                </button>
                <button
                  onClick={() => {
                    onNavigate('aset');
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Aset KIB/KIR
                </button>
                <button
                  onClick={() => {
                    onNavigate('integrasi');
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold"
                >
                  Rekon Nasional (SIPD)
                </button>
                <button
                  onClick={() => {
                    onNavigate('terminal_logistik');
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold"
                >
                  ⚡ Terminal Cepat
                </button>
                <button
                  onClick={() => {
                    onNavigate('pengambilan_atk');
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Pengambilan ATK
                </button>
              </div>
            </div>
          )}

          {query && (
            <>
              {/* Master Items Results */}
              {filteredItems.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                    <Boxes className="w-3.5 h-3.5 text-emerald-700" /> Master Barang
                  </div>
                  <div className="space-y-1">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onNavigate('master');
                          onClose();
                        }}
                        className="p-2 rounded-xl hover:bg-emerald-50 cursor-pointer flex items-center justify-between text-xs transition"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{item.namaBarang}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.kodeBarang} • Satuan: {item.jenisSatuan}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assets Results */}
              {filteredAssets.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-700" /> Aset &amp; Inventaris
                  </div>
                  <div className="space-y-1">
                    {filteredAssets.map((asset) => (
                      <div
                        key={asset.id}
                        onClick={() => {
                          onNavigate('aset');
                          onClose();
                        }}
                        className="p-2 rounded-xl hover:bg-emerald-50 cursor-pointer flex items-center justify-between text-xs transition"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{asset.namaBarang}</div>
                          <div className="text-[10px] text-slate-500">
                            {asset.kodeAset} • Ruangan: {asset.lokasi} (Kondisi: {asset.kondisi})
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pengambilan ATK Results */}
              {filteredAtk.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                    <FileSignature className="w-3.5 h-3.5 text-emerald-700" /> Riwayat Pengambilan ATK
                  </div>
                  <div className="space-y-1">
                    {filteredAtk.map((atk) => (
                      <div
                        key={atk.id}
                        onClick={() => {
                          onNavigate('pengambilan_atk');
                          onClose();
                        }}
                        className="p-2 rounded-xl hover:bg-emerald-50 cursor-pointer flex items-center justify-between text-xs transition"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">
                            #{atk.no} - {atk.namaLengkap} ({atk.jabatan})
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {atk.items.map((i) => i.namaBarang).join(', ')}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredItems.length === 0 && filteredAssets.length === 0 && filteredAtk.length === 0 && (
                <div className="text-center py-6 text-slate-400">
                  Tidak ada data yang cocok dengan "{query}".
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-400 flex items-center justify-between px-4">
          <span>Gunakan panah &amp; Enter untuk memilih</span>
          <span className="font-mono">Pencarian Cepat</span>
        </div>
      </div>
    </div>
  );
};
