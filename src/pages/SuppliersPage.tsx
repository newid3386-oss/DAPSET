import React, { useState } from 'react';
import { Store, Plus, Search, Edit2, Trash2, X, Check, Phone, MapPin, User, Download } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { Supplier } from '../types';
import { AdvancedExportModal } from '../components/AdvancedExportModal';
import { AdvancedImportModal } from '../components/AdvancedImportModal';

export const SuppliersPage: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, config } = useInventory();
  const { showToast, confirmDialog } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const supplierColumns = [
    { key: 'namaToko', label: 'Nama Toko / Vendor' },
    { key: 'kategori', label: 'Kategori Belanja' },
    { key: 'alamat', label: 'Alamat' },
    { key: 'telepon', label: 'Nomor Telepon' },
    { key: 'narahubung', label: 'Narahubung' },
    { key: 'status', label: 'Status Rekanan' },
  ];

  const [formData, setFormData] = useState<Omit<Supplier, 'id'>>({
    namaToko: '',
    alamat: '',
    telepon: '',
    narahubung: '',
    status: 'AKTIF',
  });

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.namaToko.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.narahubung.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.alamat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      namaToko: '',
      alamat: '',
      telepon: '',
      narahubung: '',
      status: 'AKTIF',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormData({
      namaToko: sup.namaToko,
      alamat: sup.alamat,
      telepon: sup.telepon,
      narahubung: sup.narahubung,
      status: sup.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaToko.trim()) {
      showToast('Nama Toko/Penyedia wajib diisi.', 'warning');
      return;
    }

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, formData);
      showToast(`Data penyedia "${formData.namaToko}" berhasil diperbarui!`, 'success');
    } else {
      addSupplier(formData);
      showToast(`Penyedia baru "${formData.namaToko}" berhasil ditambahkan!`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Rekanan Penyedia?',
      message: `Yakin ingin menghapus data penyedia/toko "${name}"?`,
      confirmText: 'Hapus Penyedia',
      variant: 'danger',
    });
    if (confirmed) {
      deleteSupplier(id);
      showToast(`Penyedia "${name}" berhasil dihapus.`, 'info');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-800" /> Rekanan Penyedia &amp; Toko SIPLah
          </h2>
          <p className="text-xs text-slate-500">
            Daftar toko rekanan belanja modal, ATK, bahan kebersihan, dan penyedia SIPLah resmi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 rotate-180 text-slate-600" /> Impor (Excel / CSV)
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Ekspor Toko
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Tambah Toko
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama toko, alamat, atau narahubung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Grid of Suppliers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((sup) => (
          <div
            key={sup.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-slate-900 text-sm">{sup.namaToko}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">
                  {sup.status}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 mt-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{sup.alamat || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{sup.telepon || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Kontak: {sup.narahubung || '-'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
              <button
                onClick={() => handleOpenEdit(sup)}
                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(sup.id, sup.namaToko)}
                className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                title="Hapus"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingSupplier ? 'Edit Rekanan Toko' : 'Tambah Rekanan Toko Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Toko / Perusahaan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Toko Buku Barokah"
                  value={formData.namaToko}
                  onChange={(e) => setFormData({ ...formData, namaToko: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  placeholder="Jl. Pasar Baru No. 12"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">No. Telepon / WA</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={formData.telepon}
                    onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Narahubung</label>
                  <input
                    type="text"
                    placeholder="Nama Sales / Pemilik"
                    value={formData.narahubung}
                    onChange={(e) => setFormData({ ...formData, narahubung: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  <Check className="w-4 h-4" /> Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Advanced Import Modal */}
      <AdvancedImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        type="SUPPLIERS"
      />

      {/* Advanced Export Modal */}
      <AdvancedExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Ekspor Rekanan Toko & Vendor"
        defaultFilename="Daftar_Supplier_Rekanan"
        data={suppliers}
        filteredData={filteredSuppliers}
        availableColumns={supplierColumns}
        schoolConfig={config}
      />
    </div>
  );
};
