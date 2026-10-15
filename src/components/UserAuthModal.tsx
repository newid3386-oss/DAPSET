import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  KeyRound,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  X,
  LogIn,
  LogOut,
  Mail,
  Building,
  School,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { UserEmployee } from '../types';
import { auth } from '../services/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredRole?: UserEmployee['role'];
  onSuccess?: () => void;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  requiredRole,
  onSuccess,
}) => {
  const {
    activeUser,
    setActiveUser,
    users,
    config,
    updateConfig,
    verifyAdminPin,
    hasPermission,
  } = useInventory();
  const { showToast } = useToast();

  const [selectedUser, setSelectedUser] = useState<UserEmployee>(activeUser);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);

  if (!isOpen) return null;

  const handleSelectUser = (user: UserEmployee) => {
    setSelectedUser(user);
    setPinInput('');
    setPinError('');
  };

  const handleConfirmSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    const targetRequiresPin = selectedUser.role === 'ADMIN' || selectedUser.role === 'BENDAHARA';

    if (targetRequiresPin && activeUser.id !== selectedUser.id) {
      if (!pinInput) {
        setPinError('Masukkan 6-digit PIN Pengamanan Admin untuk beralih ke peran ini.');
        return;
      }
      if (!verifyAdminPin(pinInput)) {
        setPinError('PIN Pengamanan salah! Hubungi Admin / Kepala Sekolah.');
        return;
      }
    }

    setActiveUser(selectedUser);
    showToast(`Berhasil masuk sebagai ${selectedUser.nama} (${selectedUser.role})`, 'success');
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleGoogleSignIn = async () => {
    setIsSigningInWithGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const email = res.user.email?.toLowerCase() || '';

      // Match user by registered email in school database
      const matchedUser = users.find((u) => u.email.toLowerCase() === email);
      if (matchedUser) {
        setActiveUser(matchedUser);
        showToast(`Autentikasi Google Berhasil! Masuk sebagai ${matchedUser.nama}`, 'success');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        // If not explicitly matched, assign with verified Google profile
        const guestUser: UserEmployee = {
          id: `USR-G-${res.user.uid.slice(0, 6)}`,
          nip: 'Terverifikasi Akun Google',
          nama: res.user.displayName || 'Staf / Guru Terverifikasi',
          email,
          jabatan: 'Tenaga Pendidik / Staf Terdaftar',
          role: email.includes('admin') || email.includes('kepsek') ? 'ADMIN' : 'GURU',
          status: 'AKTIF',
        };
        setActiveUser(guestUser);
        showToast(`Masuk dengan akun terverifikasi: ${email}`, 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.warn('Google Sign-In canceled or failed:', err);
      showToast('Gagal melakukan login Google: ' + (err.message || 'Dibatalkan'), 'error');
    } finally {
      setIsSigningInWithGoogle(false);
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length < 4) {
      showToast('PIN baru minimal harus 4 digit angka.', 'warning');
      return;
    }
    updateConfig({
      ...config,
      adminPin: newPin.trim(),
    });
    showToast('PIN Pengamanan Administrator berhasil diperbarui!', 'success');
    setIsChangingPin(false);
    setNewPin('');
  };

  const roleBadges: Record<UserEmployee['role'], { bg: string; text: string; label: string }> = {
    ADMIN: { bg: 'bg-rose-100 text-rose-800 border-rose-300', text: 'Administrator / Kepsek', label: 'Akses Penuh' },
    BENDAHARA: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', text: 'Bendahara Sekolah', label: 'BKU & Anggaran' },
    PENGURUS_BARANG: { bg: 'bg-amber-100 text-amber-800 border-amber-300', text: 'Pengurus Barang', label: 'Logistik & Aset' },
    GURU: { bg: 'bg-sky-100 text-sky-800 border-sky-300', text: 'Guru / Pendidik', label: 'ATK & Kiosk' },
    STAF: { bg: 'bg-purple-100 text-purple-800 border-purple-300', text: 'Staf Administrasi', label: 'Operasional' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight text-white flex items-center gap-2">
                Autentikasi &amp; Akses Pengguna
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 font-mono font-bold">
                  P0 RBAC
                </span>
              </h3>
              <p className="text-xs text-emerald-200/80">
                Kontrol hak akses otorisasi untuk integritas inventaris sekolah.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Notice if trigger came from restricted page */}
          {requiredRole && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <strong className="block font-bold">Halaman Ini Memerlukan Otorisasi {requiredRole}</strong>
                <span>Silakan pilih akun atau verifikasi identitas untuk melanjutkan ke modul ini.</span>
              </div>
            </div>
          )}

          {/* Current Active Account Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Pengguna Aktif Saat Ini
            </span>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-slate-800">{activeUser.nama}</h4>
                <div className="text-slate-500 text-[11px] mt-0.5">{activeUser.jabatan} • NIP: {activeUser.nip}</div>
              </div>
              <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${roleBadges[activeUser.role]?.bg}`}>
                {activeUser.role}
              </span>
            </div>
          </div>

          {/* Google Auth Quick Sign-In */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningInWithGoogle}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold transition shadow-2xs"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-4 h-4"
              />
              <span>{isSigningInWithGoogle ? 'Menghubungkan Akun...' : 'Masuk dengan Akun Google (@sekolah.belajar.id)'}</span>
            </button>
            <div className="relative text-center my-1">
              <span className="bg-white px-2 text-[10px] text-slate-400 relative z-10">atau pilih profil staf terdaftar</span>
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            </div>
          </div>

          {/* Select Registered Staff Member */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 block">Daftar Akun Pegawai &amp; Guru Terdaftar</label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
              {users.map((u) => {
                const isSelected = selectedUser.id === u.id;
                const requiresPin = u.role === 'ADMIN' || u.role === 'BENDAHARA';
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {u.nama.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 leading-tight">{u.nama}</div>
                        <div className="text-[10px] text-slate-500">{u.jabatan}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {requiresPin && (
                        <span title="Memerlukan PIN Pengamanan">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold ${roleBadges[u.role]?.bg}`}>
                        {u.role}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN Input if Admin/Bendahara */}
          {(selectedUser.role === 'ADMIN' || selectedUser.role === 'BENDAHARA') && activeUser.id !== selectedUser.id && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <KeyRound className="w-4 h-4 text-amber-700" />
                <span>Masukkan PIN Keamanan Admin</span>
              </div>
              <p className="text-[11px] text-amber-700">
                Peran ini berwenang mengubah konfigurasi, menghapus aset, dan mengakses buku audit. Default: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">123456</code>.
              </p>
              <input
                type="password"
                maxLength={10}
                placeholder="Ketik PIN Keamanan..."
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError('');
                }}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-center text-base tracking-widest font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              />
              {pinError && <p className="text-[11px] text-rose-600 font-bold">{pinError}</p>}
            </div>
          )}

          {/* Admin PIN Management Collapsible */}
          {activeUser.role === 'ADMIN' && (
            <div className="pt-2 border-t border-slate-100">
              {!isChangingPin ? (
                <button
                  type="button"
                  onClick={() => setIsChangingPin(true)}
                  className="text-xs text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Ubah PIN Administrator Sekolah
                </button>
              ) : (
                <form onSubmit={handleSaveNewPin} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-700 block">Atur PIN Pengamanan Baru</span>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="PIN baru (min 4 angka)..."
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-800 text-white rounded-xl font-bold hover:bg-emerald-700"
                    >
                      Simpan PIN
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsChangingPin(false)}
                      className="px-2.5 py-1.5 bg-slate-200 text-slate-700 rounded-xl font-medium"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100 transition"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleConfirmSwitch}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Aktifkan Profil ({selectedUser.role})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
