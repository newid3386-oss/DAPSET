import React, { useState, useMemo } from 'react';
import {
  X,
  MapPin,
  Building,
  Layers,
  Search,
  Printer,
  Download,
  CheckCircle2,
  Package,
  ArrowRight,
  ShieldCheck,
  Building2,
  User,
} from 'lucide-react';
import { AssetRecord, SchoolConfig } from '../types';
import { formatRupiah } from '../utils/format';
import { exportToExcel } from '../utils/exportImport';

interface AssetLocationTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: AssetRecord[];
  schoolConfig: SchoolConfig;
}

export const AssetLocationTrackerModal: React.FC<AssetLocationTrackerModalProps> = ({
  isOpen,
  onClose,
  assets,
  schoolConfig,
}) => {
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique locations and floors
  const locations = useMemo(() => {
    const list = Array.from(new Set(assets.map((a) => a.lokasi || 'Ruang Umum')));
    return ['ALL', ...list];
  }, [assets]);

  // Map common rooms to floors
  const getFloorForLocation = (loc: string): string => {
    const upper = loc.toUpperCase();
    if (upper.includes('KELAS 1') || upper.includes('KELAS 2') || upper.includes('KELAS 3') || upper.includes('LANTAI 1') || upper.includes('PERPUSTAKAAN') || upper.includes('TU') || upper.includes('GURU')) {
      return 'Lantai 1';
    }
    if (upper.includes('KELAS 4') || upper.includes('KELAS 5') || upper.includes('KELAS 6') || upper.includes('LAB') || upper.includes('KOMPUTER') || upper.includes('LANTAI 2')) {
      return 'Lantai 2';
    }
    if (upper.includes('AULA') || upper.includes('LANTAI 3') || upper.includes('ROOFTOP')) {
      return 'Lantai 3';
    }
    return 'Lantai 1';
  };

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const loc = a.lokasi || 'Ruang Umum';
      const floor = getFloorForLocation(loc);

      const matchFloor = selectedFloor === 'ALL' || floor === selectedFloor;
      const matchLoc = selectedLocation === 'ALL' || loc === selectedLocation;
      const matchSearch =
        a.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.kodeAset.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.penanggungJawab.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.toLowerCase().includes(searchQuery.toLowerCase());

      return matchFloor && matchLoc && matchSearch;
    });
  }, [assets, selectedFloor, selectedLocation, searchQuery]);

  // Group assets by location for spatial audit summary
  const groupedByLocation = useMemo(() => {
    const map: Record<string, AssetRecord[]> = {};
    for (const a of filteredAssets) {
      const loc = a.lokasi || 'Ruang Umum';
      if (!map[loc]) map[loc] = [];
      map[loc].push(a);
    }
    return map;
  }, [filteredAssets]);

  const handleExportTracker = () => {
    const rows = filteredAssets.map((a) => ({
      KodeAset: a.kodeAset,
      NamaBarang: a.namaBarang,
      Lantai: getFloorForLocation(a.lokasi || 'Ruang Umum'),
      Ruangan: a.lokasi || 'Ruang Umum',
      PenanggungJawab: a.penanggungJawab,
      Kondisi: a.kondisi,
      Jumlah: a.jumlah,
      Satuan: a.jenisSatuan,
      NilaiPerolehan: a.totalNilai || (a.jumlah * a.hargaSatuan),
    }));

    exportToExcel(rows, {
      filename: `Pelacakan_Lokasi_Aset_${selectedFloor === 'ALL' ? 'Semua_Lantai' : selectedFloor}`,
      sheetName: 'Pelacakan Lokasi Aset',
      title: `${schoolConfig.schoolName} - Pelacakan Lokasi & Inventaris Fisik`,
      subtitle: `Filter Lantai: ${selectedFloor} | Filter Ruangan: ${selectedLocation}`,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <MapPin className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight">
                Pelacakan Lokasi Aset Sekolah (Spatial Room &amp; Floor Tracker)
              </h3>
              <p className="text-[11px] text-emerald-200">
                Inventarisasi fisik penempatan inventaris per lantai dan ruangan untuk memudahkan audit KIR.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between shrink-0">
          {/* Floor Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            {['ALL', 'Lantai 1', 'Lantai 2', 'Lantai 3'].map((fl) => (
              <button
                key={fl}
                onClick={() => {
                  setSelectedFloor(fl);
                  setSelectedLocation('ALL');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  selectedFloor === fl
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                {fl === 'ALL' ? 'Semua Lantai' : fl}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Room Filter */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Ruangan ({locations.length - 1})</option>
              {locations
                .filter((l) => l !== 'ALL')
                .map((loc) => (
                  <option key={loc} value={loc}>
                    {loc} ({getFloorForLocation(loc)})
                  </option>
                ))}
            </select>

            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama aset, kode, PJ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Export */}
            <button
              onClick={handleExportTracker}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" /> Unduh Laporan Spasial
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-800 font-bold uppercase block">Total Unit Aset Terlacak</span>
                <div className="text-2xl font-black text-emerald-950 mt-0.5">
                  {filteredAssets.reduce((sum, a) => sum + a.jumlah, 0)} Unit
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-200/60 flex items-center justify-center text-emerald-800 font-bold">
                <Package className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-blue-800 font-bold uppercase block">Ruangan / Zona Aktif</span>
                <div className="text-2xl font-black text-blue-950 mt-0.5">
                  {Object.keys(groupedByLocation).length} Ruangan
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-200/60 flex items-center justify-center text-blue-800 font-bold">
                <Building className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-800 font-bold uppercase block">Total Valuasi Ruangan</span>
                <div className="text-lg font-black text-amber-950 mt-0.5">
                  {formatRupiah(filteredAssets.reduce((sum, a) => sum + (a.totalNilai || a.jumlah * a.hargaSatuan), 0))}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-200/60 flex items-center justify-center text-amber-800 font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Grouped Rooms / Location Breakdown */}
          {Object.keys(groupedByLocation).length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
              Tidak ada data aset yang cocok dengan filter lokasi atau pencarian.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedByLocation).map(([locName, roomAssets]) => {
                const floor = getFloorForLocation(locName);
                const roomValuation = roomAssets.reduce((sum, a) => sum + (a.totalNilai || a.jumlah * a.hargaSatuan), 0);
                const pjName = roomAssets[0]?.penanggungJawab || 'Belum Ditentukan';

                return (
                  <div
                    key={locName}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:border-emerald-300 transition"
                  >
                    {/* Room Header */}
                    <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                            <span>{locName}</span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              {floor}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>PJ: <strong className="text-slate-700">{pjName}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Jumlah Aset</div>
                          <div className="font-bold text-slate-800">
                            {roomAssets.reduce((sum, a) => sum + a.jumlah, 0)} Unit ({roomAssets.length} jenis)
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Valuasi Ruangan</div>
                          <div className="font-black text-emerald-900">{formatRupiah(roomValuation)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Room Assets Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white border-b border-slate-100 text-slate-400 uppercase text-[9px] font-bold">
                          <tr>
                            <th className="px-4 py-2.5">Kode Aset</th>
                            <th className="px-4 py-2.5">Nama Barang / Inventaris</th>
                            <th className="px-4 py-2.5">Merk / Spesifikasi</th>
                            <th className="px-4 py-2.5 text-center">Kondisi</th>
                            <th className="px-4 py-2.5 text-center">Jumlah</th>
                            <th className="px-4 py-2.5 text-right">Harga Satuan</th>
                            <th className="px-4 py-2.5 text-right">Total Nilai</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {roomAssets.map((asset) => (
                            <tr key={asset.id} className="hover:bg-slate-50/80 transition">
                              <td className="px-4 py-2.5 font-mono font-bold text-emerald-900">
                                {asset.kodeAset}
                              </td>
                              <td className="px-4 py-2.5 font-semibold text-slate-900">
                                {asset.namaBarang}
                              </td>
                              <td className="px-4 py-2.5 text-slate-600 truncate max-w-[220px]">
                                {asset.merk} • {asset.spesifikasi}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    asset.kondisi === 'BAIK'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : asset.kondisi === 'RUSAK_RINGAN'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-red-50 text-red-700 border border-red-200'
                                  }`}
                                >
                                  {asset.kondisi}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-center font-bold">
                                {asset.jumlah} {asset.jenisSatuan}
                              </td>
                              <td className="px-4 py-2.5 text-right text-slate-600">
                                {formatRupiah(asset.hargaSatuan)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-black text-slate-900">
                                {formatRupiah(asset.totalNilai || asset.jumlah * asset.hargaSatuan)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            * Data lokasi diperbarui secara real-time dari registrasi inventaris KIB/KIR sekolah.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs"
          >
            Tutup Pelacakan
          </button>
        </div>
      </div>
    </div>
  );
};
