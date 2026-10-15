import React, { useState, useEffect } from 'react';
import {
  FileText,
  LogIn,
  LogOut,
  PlusCircle,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/documents');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedAccessToken: string | null = sessionStorage.getItem('SIMBARAS_GDOCS_TOKEN');

export const GoogleDocsPage: React.FC = () => {
  const { stockSummary, barangMasuk, barangKeluar } = useInventory();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(cachedAccessToken);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [docTitle, setDocTitle] = useState('Berita Acara & Laporan Inventaris Sarpras Sekolah');
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const stored = sessionStorage.getItem('SIMBARAS_GDOCS_TOKEN');
        if (stored) {
          cachedAccessToken = stored;
          setAccessToken(stored);
        }
      } else {
        setUser(null);
        setAccessToken(null);
        cachedAccessToken = null;
        sessionStorage.removeItem('SIMBARAS_GDOCS_TOKEN');
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
        throw new Error('Gagal mendapatkan akses token Google Docs');
      }
      cachedAccessToken = credential.accessToken;
      sessionStorage.setItem('SIMBARAS_GDOCS_TOKEN', cachedAccessToken);
      setAccessToken(cachedAccessToken);
      setUser(result.user);
      setStatusMessage({ type: 'success', text: `Berhasil otentikasi Google Docs dengan akun ${result.user.email}` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Gagal otentikasi: ${err.message}` });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    cachedAccessToken = null;
    sessionStorage.removeItem('SIMBARAS_GDOCS_TOKEN');
    setAccessToken(null);
    setUser(null);
  };

  const handleCreateGoogleDoc = async () => {
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'Silakan masuk dengan akun Google terlebih dahulu.' });
      return;
    }

    setIsCreating(true);
    setStatusMessage(null);

    try {
      // 1. Create empty Google Doc
      const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: docTitle
        })
      });

      if (!createRes.ok) {
        const errJson = await createRes.json();
        throw new Error(errJson.error?.message || 'Gagal membuat Google Doc');
      }

      const docData = await createRes.json();
      const documentId = docData.documentId;
      setCreatedDocId(documentId);

      // 2. Insert content via batchUpdate
      const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const textContent =
        `LAPORAN RESMI SARPRAS & INVENTARIS SEKOLAH\n` +
        `Tanggal Cetak: ${dateStr}\n\n` +
        `I. RINGKASAN DATA\n` +
        `- Total Master Barang: ${stockSummary.length} item\n` +
        `- Total Transaksi Barang Masuk: ${barangMasuk.length}\n` +
        `- Total Transaksi Barang Keluar: ${barangKeluar.length}\n\n` +
        `II. DAFTAR MASTER BARANG UTAMA\n` +
        stockSummary
          .slice(0, 15)
          .map((i, idx) => `${idx + 1}. ${i.namaBarang} - Stok: ${i.stok} ${i.jenisSatuan} (Masuk: ${i.stokMasuk}, Keluar: ${i.stokKeluar})`)
          .join('\n') +
        `\n\nIII. PENGESAHAN\n` +
        `Dokumen ini digenerate secara otomatis melalui Sistem Pengelolaan Sarana dan Prasarana Sekolah.\n\n` +
        `Mengetahui,\nKepala Sekolah / Petugas Sarpras\n\n\n( _______________________ )`;

      const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                text: textContent,
                location: {
                  index: 1
                }
              }
            }
          ]
        })
      });

      if (!updateRes.ok) {
        const errJson = await updateRes.json();
        throw new Error(errJson.error?.message || 'Gagal mengisi konten Google Doc');
      }

      setStatusMessage({ type: 'success', text: 'Berhasil membuat dan mengisi Google Document!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Gagal membuat Google Document: ${err.message}` });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Integrasi Google Docs</h1>
              <p className="text-blue-100 text-sm mt-1">
                Buat Berita Acara, Laporan Inventaris, dan Dokumen Resmi Sarpras langsung ke Google Docs dengan sekali klik.
              </p>
            </div>
          </div>
        </div>

        <div>
          {!user ? (
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="px-5 py-2.5 bg-white text-blue-700 font-semibold rounded-xl shadow-md hover:bg-blue-50 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              Masuk dengan Google (Docs)
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
              <div className="text-right">
                <p className="text-xs text-blue-200">Masuk sebagai</p>
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
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{statusMessage.text}</p>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Generator Google Doc Otomatis
            </h2>
            <p className="text-sm text-slate-500">
              Mengekspor rekapitulasi data master barang, transaksi masuk, dan keluar menjadi dokumen Google Docs yang rapi.
            </p>
          </div>
        </div>

        {!user ? (
          <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-medium text-slate-700">Autentikasi Diperlukan</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
              Silakan masuk dengan akun Google Anda untuk mengizinkan pembuatan dokumen otomatis di Google Drive/Docs.
            </p>
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow transition inline-flex items-center gap-2"
            >
              {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              Masuk dengan Google
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Judul Dokumen Google Docs</label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">Konten yang akan disertakan dalam Dokumen:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Judul resmi & tanggal cetak otomatis</li>
                <li>Ringkasan statistik ({stockSummary.length} master barang, {barangMasuk.length} barang masuk, {barangKeluar.length} barang keluar)</li>
                <li>Daftar master barang inventaris utama</li>
                <li>Format tanda tangan kepala sekolah & petugas sarpras</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div>
                {createdDocId && (
                  <a
                    href={`https://docs.google.com/document/d/${createdDocId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm bg-blue-50 px-4 py-2 rounded-xl transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Buka Google Doc yang Dibuat
                  </a>
                )}
              </div>

              <button
                onClick={handleCreateGoogleDoc}
                disabled={isCreating}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
                Buat Google Doc Sekarang
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
