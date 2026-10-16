import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  Printer,
  Download,
  Save,
  X,
  UserCheck,
  Shield,
  GraduationCap,
  Key,
  CheckCircle2,
  AlertCircle,
  Mail,
  Briefcase,
  IdCard,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { UserEmployee } from '../types';
import { exportToCsv } from '../utils/format';

export const DaftarPegawaiPage: React.FC = () => {
  const {
    users,
    addUser,
    updateUser,
    deleteUser,
    activeUser,
    config,
    hasPermission,
  } = useInventory();
  const { showToast, confirmDialog } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserEmployee | null>(null);

  const [formData, setFormData] = useState<Omit<UserEmployee, 'id'>>({
    nip: '',
    nama: '',
    email: '',
    jabatan: '',
    role: 'GURU',
    status: 'AKTIF',
  });

  // Filtered employees list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchQuery =
        u.nama.toLowerCase().includes(q) ||
        u.nip.toLowerCase().includes(q) ||
        u.jabatan.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
      return matchQuery && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Summary counts
  const countTotal = users.length;
  const countGuru = users.filter((u) => u.role === 'GURU').length;
  const countPengurusBendahara = users.filter((u) => u.role === 'BENDAHARA' || u.role === 'PENGURUS_BARANG').length;
  const countAdmin = users.filter((u) => u.role === 'ADMIN').length;

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      nip: '',
      nama: '',
      email: '',
      jabatan: '',
      role: 'GURU',
      status: 'AKTIF',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserEmployee) => {
    setEditingUser(user);
    setFormData({
      nip: user.nip || '',
      nama: user.nama,
      email: user.email || '',
      jabatan: user.jabatan,
      role: user.role,
      status: user.status,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      showToast('Nama pegawai wajib diisi.', 'warning');
      return;
    }
    if (!formData.jabatan.trim()) {
      showToast('Jabatan pegawai wajib diisi.', 'warning');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, formData);
      showToast(`Data pegawai "${formData.nama}" berhasil diperbarui!`, 'success');
    } else {
      addUser(formData);
      showToast(`Pegawai baru "${formData.nama}" berhasil didaftarkan!`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (user: UserEmployee) => {
    if (user.id === activeUser.id) {
      showToast('Akses ditolak: Tidak dapat menghapus akun yang sedang aktif digunakan saat ini.', 'error');
      return;
    }
    const confirmed = await confirmDialog({
      title: 'Hapus Data Pegawai?',
      message: `Yakin ingin menghapus ${user.nama} (${user.jabatan}) dari pangkalan data pegawai sekolah?`,
      confirmText: 'Hapus Pegawai',
      variant: 'danger',
    });
    if (confirmed) {
      deleteUser(user.id);
      showToast(`Data pegawai "${user.nama}" berhasil dihapus.`, 'info');
    }
  };

  const handleExportCsv = () => {
    const exportData = filteredUsers.map((u, idx) => ({
      No: idx + 1,
      NIP: u.nip || '-',
      Nama: u.nama,
      Jabatan: u.jabatan,
      Email: u.email || '-',
      Role_RBAC: u.role,
      Status: u.status,
    }));
    exportToCsv(`Daftar_Pegawai_${config.schoolName || 'Sekolah'}`, exportData);
    showToast('Daftar pegawai berhasil diekspor ke CSV!', 'success');
  };

  const roleBadgeStyle = (role: UserEmployee['role']) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'BENDAHARA':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PENGURUS_BARANG':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'GURU':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'STAF':
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  const roleDescription = (role: UserEmployee['role']) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator (Akses Penuh)';
      case 'BENDAHARA':
        return 'Bendahara (BKU & Belanja BOS)';
      case 'PENGURUS_BARANG':
        return 'Pengurus Barang (Aset & Logistik)';
      case 'GURU':
        return 'Guru / Pendidik (ATK & Kiosk)';
      case 'STAF':
        return 'Staf Administrasi (Operasional)';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-800" /> Daftar Pegawai, Guru &amp; Staf Sekolah
          </h2>
          <p className="text-xs text-slate-500">
            Pangkalan data tenaga pendidik dan kependidikan di {config.schoolName}, penetapan role RBAC, dan otorisasi tanda tangan pengambilan ATK.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            title="Mode Cetak Laporan (Sembunyikan navigasi & menu)"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" /> Mode Cetak Laporan
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Ekspor CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Tambah Pegawai
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Pegawai</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{countTotal}</div>
          <div className="text-[11px] text-slate-400 mt-1">Pendidik &amp; Tenaga Kependidikan</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Guru / Pendidik</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-950">{countGuru}</div>
          <div className="text-[11px] text-sky-600 mt-1">Guru Kelas &amp; Mapel</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Bendahara &amp; Aset</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-950">{countPengurusBendahara}</div>
          <div className="text-[11px] text-emerald-600 mt-1">Pengelola BKU &amp; Logistik</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Administrator</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-950">{countAdmin}</div>
          <div className="text-[11px] text-rose-600 mt-1">Kepala Sekolah &amp; Otorisator</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between no-print">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, NIP, jabatan, atau email pegawai..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">Semua Peran / Role</option>
            <option value="ADMIN">Administrator</option>
            <option value="BENDAHARA">Bendahara Sekolah</option>
            <option value="PENGURUS_BARANG">Pengurus Barang</option>
            <option value="GURU">Guru / Pendidik</option>
            <option value="STAF">Staf Administrasi</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">Semua Status</option>
            <option value="AKTIF">Status: Aktif</option>
            <option value="NONAKTIF">Status: Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3 text-center w-12">No</th>
                <th className="px-4 py-3">Nama Pegawai &amp; NIP</th>
                <th className="px-4 py-3">Jabatan Sekolah</th>
                <th className="px-4 py-3">Email Resmi (@belajar.id)</th>
                <th className="px-4 py-3 text-center">Hak Akses (Role RBAC)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-xs">Tidak ada data pegawai yang cocok dengan filter atau kata kunci.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const isCurrentActive = user.id === activeUser.id;
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isCurrentActive ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-center font-mono text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {user.nama}
                              {isCurrentActive && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                                  Akun Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                              <IdCard className="w-3 h-3 text-slate-400" />
                              <span>{user.nip || 'NIP Tidak Tercatat'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{user.jabatan}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{user.email || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] border shadow-2xs ${roleBadgeStyle(
                            user.role
                          )}`}
                          title={roleDescription(user.role)}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            user.status === 'AKTIF'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.status === 'AKTIF' ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                          />
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                            title="Edit Data & Role Pegawai"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(user)}
                            disabled={isCurrentActive}
                            className={`p-1.5 rounded-lg border transition ${
                              isCurrentActive
                                ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                                : 'border-red-200 bg-red-50 hover:bg-red-100 text-red-700 cursor-pointer'
                            }`}
                            title={isCurrentActive ? 'Akun aktif tidak dapat dihapus' : 'Hapus Pegawai'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <div>
            Menampilkan <span className="font-bold text-slate-800">{filteredUsers.length}</span> dari total <span className="font-bold text-slate-800">{users.length}</span> pegawai terdaftar
          </div>
          <div className="mt-2 sm:mt-0 font-medium">
            Sistem Role-Based Access Control (RBAC) Aktif
          </div>
        </div>
      </div>

      {/* Modal Tambah / Edit Pegawai */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">
                    {editingUser ? 'Edit Data & Penetapan Role Pegawai' : 'Tambah Tenaga Pendidik / Staf Baru'}
                  </h3>
                  <p className="text-xs text-emerald-200/80">
                    {editingUser ? 'Perbarui identitas, jabatan, dan wewenang RBAC' : 'Daftarkan nama pegawai ke pangkalan data sekolah'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap &amp; Gelar <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Khoirul Fajri, S.Pd."
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Induk Pegawai (NIP)</label>
                  <input
                    type="text"
                    placeholder="19880415 201101 1 004 atau -"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jabatan di Sekolah <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Guru PJOK / Koord. Kurikulum"
                    value={formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Resmi Instansi (@belajar.id)</label>
                <input
                  type="email"
                  placeholder="khoirul.fajri208@admin.sd.belajar.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Digunakan untuk pencocokan login akun Google Workspace / SSO jika diaktifkan.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Penetapan Hak Akses (Role RBAC) <span className="text-red-500">*</span></label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="GURU">GURU (ATK, Kiosk &amp; Pengambilan)</option>
                    <option value="BENDAHARA">BENDAHARA (BKU, Belanja BOS &amp; RKAS)</option>
                    <option value="PENGURUS_BARANG">PENGURUS BARANG (Aset KIB &amp; Logistik)</option>
                    <option value="ADMIN">ADMIN (Kepala Sekolah &amp; Akses Penuh)</option>
                    <option value="STAF">STAF (Operasional Administrasi)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Kepegawaian <span className="text-red-500">*</span></label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="AKTIF">AKTIF (Dapat Mengambil ATK &amp; Login)</option>
                    <option value="NONAKTIF">NONAKTIF (Mutasi / Pensiun)</option>
                  </select>
                </div>
              </div>

              {/* Notice Box for RBAC role permissions */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                  <Shield className="w-3.5 h-3.5 text-emerald-700" />
                  Keterangan Hak Akses Peran:
                </span>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Peran <strong>ADMIN</strong> dan <strong>BENDAHARA</strong> dilindungi dengan PIN Pengamanan saat beralih akun untuk mencegah manipulasi data BKU dan penghapusan aset. Peran <strong>GURU</strong> dan <strong>STAF</strong> dapat langsung mencatat pengambilan ATK dan opname fisik.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingUser ? 'Simpan Perubahan' : 'Daftarkan Pegawai'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
