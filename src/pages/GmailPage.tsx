import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  Sparkles,
  Inbox
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope('https://mail.google.com/');
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/gmail.compose');

let cachedAccessToken: string | null = sessionStorage.getItem('SIMBARAS_GMAIL_TOKEN');

export const GmailPage: React.FC = () => {
  const { stockSummary, barangMasuk, barangKeluar } = useInventory();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(cachedAccessToken);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Email form state
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('Laporan Rekapitulasi Inventaris Sarpras Sekolah');
  const [body, setBody] = useState(
    `Kepada Yth. Kepala Sekolah / Tim Manajemen,\n\nBerikut adalah laporan ringkas inventaris dan logistik Sarpras per tanggal ${new Date().toLocaleDateString('id-ID')}:\n\n- Total Master Barang: ${stockSummary.length} item\n- Total Barang Masuk Tercatat: ${barangMasuk.length} transaksi\n- Total Barang Keluar Tercatat: ${barangKeluar.length} transaksi\n\nLaporan ini dibuat otomatis melalui Sistem Pengelolaan Sarana dan Prasarana.\n\nTerima kasih.`
  );
  const [selectedTemplate, setSelectedTemplate] = useState('standard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const stored = sessionStorage.getItem('SIMBARAS_GMAIL_TOKEN');
        if (stored) {
          cachedAccessToken = stored;
          setAccessToken(stored);
        }
      } else {
        setUser(null);
        setAccessToken(null);
        cachedAccessToken = null;
        sessionStorage.removeItem('SIMBARAS_GMAIL_TOKEN');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setStatusMessage(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Gagal mendapatkan token akses Google Gmail');
      }
      cachedAccessToken = credential.accessToken;
      sessionStorage.setItem('SIMBARAS_GMAIL_TOKEN', cachedAccessToken);
      setAccessToken(cachedAccessToken);
      setUser(result.user);
      setStatusMessage({ type: 'success', text: `Berhasil otentikasi Gmail dengan akun ${result.user.email}` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Gagal otentikasi Gmail: ${err.message}` });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    cachedAccessToken = null;
    sessionStorage.removeItem('SIMBARAS_GMAIL_TOKEN');
    setAccessToken(null);
    setUser(null);
    setStatusMessage({ type: 'info', text: 'Berhasil keluar dari akun Gmail.' });
  };

  const handleSelectTemplate = (type: string) => {
    setSelectedTemplate(type);
    const dateStr = new Date().toLocaleDateString('id-ID');
    if (type === 'standard') {
      setSubject('Laporan Rekapitulasi Inventaris Sarpras Sekolah');
      setBody(
        `Kepada Yth. Kepala Sekolah / Tim Manajemen,\n\nBerikut adalah laporan ringkas inventaris dan logistik Sarpras per tanggal ${dateStr}:\n\n- Total Master Barang: ${stockSummary.length} item\n- Total Barang Masuk Tercatat: ${barangMasuk.length} transaksi\n- Total Barang Keluar Tercatat: ${barangKeluar.length} transaksi\n\nTerima kasih.`
      );
    } else if (type === 'pengadaan') {
      setSubject('Permohonan Pengadaan Barang & ATK Sekolah - ' + dateStr);
      setBody(
        `Yth. Tim Pengadaan Sarpras,\n\nBersama email ini kami sampaikan daftar kebutuhan mendesak untuk operasional sekolah per tanggal ${dateStr}.\nMohon untuk ditinjau dan diproses lebih lanjut.\n\nTerima kasih.`
      );
    } else if (type === 'stok_kritis') {
      const lowStockItems = stockSummary.filter((i) => i.stok <= i.batasMinimum);
      setSubject('PERINGATAN: Laporan Stok Kritis / Minimum - ' + dateStr);
      setBody(
        `Perhatian Tim Logistik,\n\nTerdapat ${lowStockItems.length} item barang yang berada di bawah batas stok minimum:\n` +
          lowStockItems.map((i) => `• ${i.namaBarang} (Sisa: ${i.stok} ${i.jenisSatuan}, Min: ${i.batasMinimum})`).join('\n') +
          `\n\nSegera lakukan pengadaan atau restock.`
      );
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'Silakan masuk dengan akun Google terlebih dahulu.' });
      return;
    }
    if (!recipient) {
      setStatusMessage({ type: 'error', text: 'Mohon masukkan alamat email penerima.' });
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      const emailLines = [
        `To: ${recipient}`,
        `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
        'Content-Transfer-Encoding: base64',
        '',
        btoa(unescape(encodeURIComponent(body)))
      ];
      const emailContent = emailLines.join('\r\n');
      const encodedEmail = btoa(emailContent).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: encodedEmail
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Gagal mengirim email melalui Gmail API');
      }

      setStatusMessage({ type: 'success', text: `Email berhasil dikirim ke ${recipient}!` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Gagal mengirim email: ${err.message}` });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Integrasi Gmail Sekolah</h1>
              <p className="text-rose-100 text-sm mt-1">
                Kirim laporan inventaris, pemberitahuan stok kritis, dan surat pengadaan langsung via Gmail API.
              </p>
            </div>
          </div>
        </div>

        <div>
          {!user ? (
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="px-5 py-2.5 bg-white text-rose-700 font-semibold rounded-xl shadow-md hover:bg-rose-50 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              Masuk dengan Google (Gmail)
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
              <div className="text-right">
                <p className="text-xs text-rose-200">Masuk sebagai</p>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
                title="Keluar"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border shadow-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : statusMessage.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          ) : (
            <Inbox className="w-5 h-5 text-blue-600 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{statusMessage.text}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates Sidebar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-600" />
            Template Email Cepat
          </h2>
          <p className="text-xs text-slate-500">Pilih template pesan resmi untuk mempercepat pengiriman laporan.</p>

          <div className="space-y-2">
            <button
              onClick={() => handleSelectTemplate('standard')}
              className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                selectedTemplate === 'standard'
                  ? 'border-rose-500 bg-rose-50/50 text-rose-900 font-medium'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-rose-600" />
                <span className="text-sm">Laporan Inventaris Rutin</span>
              </div>
            </button>

            <button
              onClick={() => handleSelectTemplate('pengadaan')}
              className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                selectedTemplate === 'pengadaan'
                  ? 'border-rose-500 bg-rose-50/50 text-rose-900 font-medium'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Permohonan Pengadaan ATK</span>
              </div>
            </button>

            <button
              onClick={() => handleSelectTemplate('stok_kritis')}
              className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                selectedTemplate === 'stok_kritis'
                  ? 'border-rose-500 bg-rose-50/50 text-rose-900 font-medium'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-sm">Peringatan Stok Kritis</span>
              </div>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Statistik Data Siap Kirim</h3>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span>Total Master Barang:</span>
                <span className="font-semibold text-slate-800">{stockSummary.length} item</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span>Transaksi Masuk:</span>
                <span className="font-semibold text-slate-800">{barangMasuk.length}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Transaksi Keluar:</span>
                <span className="font-semibold text-slate-800">{barangKeluar.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compose Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-rose-600" />
            Kirim Pesan / Laporan Gmail
          </h2>

          {!user ? (
            <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Mail className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="font-medium text-slate-700">Autentikasi Diperlukan</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
                Silakan masuk dengan akun Google Anda terlebih dahulu untuk mengaktifkan pengiriman email langsung melalui Gmail API.
              </p>
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl shadow transition inline-flex items-center gap-2"
              >
                {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                Masuk dengan Google
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Kepada (Email Penerima)</label>
                <input
                  type="email"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="contoh: kepsek@sekolah.sch.id atau supplier@toko.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Subjek Email</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Isi Pesan / Laporan</label>
                <textarea
                  rows={9}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Kirim Email via Gmail
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
