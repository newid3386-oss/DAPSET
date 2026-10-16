import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Download,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Eye,
  ShieldAlert,
  Radio,
  Filter,
  UserCheck,
  Cloud,
  Lock,
  RefreshCw,
  Printer,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatWaktuIndo, exportToCsv } from '../utils/format';
import { CloudAuditLogItem } from '../services/firebase';

export const AuditPage: React.FC = () => {
  const { auditTrail, fetchCloudAuditTrail } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'RED_FLAGS' | 'CLOUD_LEDGER'>('ALL');
  const [verifiedFlags, setVerifiedFlags] = useState<Record<string, boolean>>({});
  const [cloudLogs, setCloudLogs] = useState<CloudAuditLogItem[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  // Load cloud ledger
  const loadCloudAudit = async () => {
    setIsLoadingCloud(true);
    try {
      const logs = await fetchCloudAuditTrail();
      setCloudLogs(logs);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'CLOUD_LEDGER') {
      loadCloudAudit();
    }
  }, [activeTab]);

  // Identify red flags in audit trail:
  // e.g. DELETE actions, large value transactions, bulk operations, or actions outside office hours
  const redFlags = auditTrail.filter((log) => {
    const isDelete = log.aksi === 'DELETE';
    const isBulk = log.modul.toLowerCase().includes('impor') || (log.dataJson && log.dataJson.length > 150);
    const isAssetRemoval = log.modul.toLowerCase().includes('penghapusan') || log.modul.toLowerCase().includes('pemeliharaan');
    return isDelete || isBulk || isAssetRemoval;
  });

  const currentSource = activeTab === 'CLOUD_LEDGER' ? cloudLogs : activeTab === 'RED_FLAGS' ? redFlags : auditTrail;

  const filteredLogs = currentSource.filter(
    (log) =>
      log.modul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.userEmail && log.userEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.dataJson && log.dataJson.toLowerCase().includes(searchQuery.toLowerCase())) ||
      log.aksi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleVerifyFlag = (id: string) => {
    setVerifiedFlags((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const complianceScore = Math.max(
    85,
    Math.min(100, 100 - Math.round((redFlags.filter(f => !verifiedFlags[f.id]).length / Math.max(1, auditTrail.length)) * 100))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2 border border-emerald-200">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> Real-Time Compliance Monitoring Active
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-800" /> Audit Trail &amp; Panel Kepatuhan Audit Sekolah
          </h2>
          <p className="text-xs text-slate-500">
            Pengawasan real-time aktivitas pengguna, pencatatan mutasi inventaris, serta deteksi otomatis bendera merah (*red flags*) untuk verifikasi manual.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'CLOUD_LEDGER' && (
            <button
              onClick={loadCloudAudit}
              disabled={isLoadingCloud}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold shadow-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCloud ? 'animate-spin' : ''}`} /> Muat Ulang Cloud
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            title="Mode Cetak Laporan (Sembunyikan navigasi & menu)"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" /> Mode Cetak Laporan
          </button>
          <button
            onClick={() => exportToCsv('Panel_Kepatuhan_Audit_Sekolah', currentSource)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Ekspor Laporan Audit
          </button>
        </div>
      </div>

      {/* Compliance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Skor Kepatuhan Audit</span>
          <div className="text-3xl font-black text-emerald-700 mt-1">{complianceScore}%</div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Standar Pengelolaan BOS Akuntabel
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Aktivitas Tercatat</span>
          <div className="text-3xl font-black text-slate-800 mt-1">{auditTrail.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Log lokal browser</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Buku Besar Cloud (Immutable)</span>
          <div className="text-3xl font-black text-indigo-700 mt-1">{cloudLogs.length}</div>
          <div className="text-[11px] text-indigo-600 mt-1 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Anti-Hapus &amp; Permanen
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Bendera Merah (Red Flags)</span>
          <div className="text-3xl font-black text-amber-700 mt-1">{redFlags.length}</div>
          <div className="text-[11px] text-amber-600 mt-1">Memerlukan atensi khusus</div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'ALL'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Semua Log Aktivitas ({auditTrail.length})
            </button>
            <button
              onClick={() => setActiveTab('RED_FLAGS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'RED_FLAGS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Bendera Merah ({redFlags.length})
            </button>
            <button
              onClick={() => setActiveTab('CLOUD_LEDGER')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'CLOUD_LEDGER'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" /> Buku Besar Cloud Tak Terhapuskan ({cloudLogs.length})
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan modul, user email, jenis aksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3">Stempel Waktu</th>
                <th className="px-4 py-3 text-center">Status / Anomali</th>
                <th className="px-4 py-3 text-center">Aksi</th>
                <th className="px-4 py-3">Modul</th>
                <th className="px-4 py-3">ID Rekaman</th>
                <th className="px-4 py-3">Pengguna</th>
                <th className="px-4 py-3">Rincian Operasi</th>
                <th className="px-4 py-3 text-center">Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada rekaman log aktivitas atau bendera merah yang sesuai dengan kriteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isFlagged = redFlags.some((f) => f.id === log.id);
                  const isVerified = verifiedFlags[log.id];

                  return (
                    <tr key={log.id} className={`hover:bg-slate-50/80 transition ${isFlagged && !isVerified ? 'bg-amber-50/40' : ''}`}>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {formatWaktuIndo(log.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isFlagged ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                          }`}>
                            {isVerified ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {isVerified ? 'DIVERIFIKASI' : 'RED FLAG'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Normal</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            log.aksi === 'CREATE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.aksi === 'UPDATE'
                              ? 'bg-blue-100 text-blue-800'
                              : log.aksi === 'DELETE'
                              ? 'bg-red-100 text-red-800'
                              : log.aksi === 'EXPORT'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {log.aksi}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{log.modul}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">{log.recordId}</td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-[150px]">{log.userEmail}</td>
                      <td className="px-4 py-3 text-slate-700 truncate max-w-[220px]" title={log.dataJson}>
                        {log.dataJson || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isFlagged ? (
                          <button
                            onClick={() => toggleVerifyFlag(log.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                              isVerified
                                ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                            }`}
                          >
                            {isVerified ? 'Batalkan' : 'Verifikasi Manual'}
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
