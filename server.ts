import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsers with ample limits for base64 evidence and receipt photos
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Shared Gemini AI client initialized on server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// AI Endpoint: Analisis Inventaris Cerdas
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { items, stockSummary, assets } = req.body;

    const prompt = `Anda adalah asisten ahli manajemen aset dan bendahara barang sekolah formal di Indonesia.
Berdasarkan data persediaan dan inventaris sekolah berikut:
- Total Master Barang: ${items?.length || 0}
- Data Ringkasan Stok: ${JSON.stringify((stockSummary || []).slice(0, 30))}
- Data Aset Sampel: ${JSON.stringify((assets || []).slice(0, 15))}

Berikan analisis menyeluruh:
1. Identifikasi barang yang stoknya kritis atau habis dan butuh pengadaan mendesak (RKAS/BOS).
2. Rekomendasi tindakan efisiensi dan tata kelola barang habis pakai.
3. Analisis aset fisik (kondisi rusak ringan / rusak berat yang perlu pemeliharaan atau penghapusan).
4. Catatan kepatuhan pelaporan BKU & Berita Acara.

Sajikan dalam bahasa Indonesia yang profesional, rapi, dengan poin-poin terstruktur dan nada positif serta solutif.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ ok: true, text: response.text });
  } catch (error: any) {
    console.error('Error analyzing inventory:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'Gagal menganalisis data inventaris dengan AI',
    });
  }
});

// AI Endpoint: OCR & Pindai Nota / Faktur Pengadaan Otomatis
app.post('/api/ai/scan-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ ok: false, error: 'Data gambar nota tidak ditemukan' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: 'Ekstrak detail nota/struk/kwitansi pengadaan barang belanja sekolah ini ke format JSON. Jika beberapa kolom tidak tertulis jelas, gunakan estimasi logis atau string kosong. Total angka harus murni number.',
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            namaToko: { type: Type.STRING, description: 'Nama toko atau penyedia barang' },
            tanggal: { type: Type.STRING, description: 'Tanggal transaksi dalam format YYYY-MM-DD jika terbaca' },
            nomorKwitansi: { type: Type.STRING, description: 'Nomor nota, faktur, atau kwitansi' },
            totalPengadaan: { type: Type.NUMBER, description: 'Total nilai transaksi pembayaran' },
            items: {
              type: Type.ARRAY,
              description: 'Daftar barang yang dibeli',
              items: {
                type: Type.OBJECT,
                properties: {
                  namaBarang: { type: Type.STRING },
                  jumlah: { type: Type.NUMBER },
                  jenisSatuan: { type: Type.STRING },
                  hargaSatuan: { type: Type.NUMBER },
                  total: { type: Type.NUMBER },
                },
                required: ['namaBarang', 'jumlah', 'hargaSatuan'],
              },
            },
          },
          required: ['namaToko', 'items'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ ok: true, data: parsed });
  } catch (error: any) {
    console.error('Error scanning receipt:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'Gagal memindai nota dengan AI',
    });
  }
});

// AI Endpoint: Buat Draft Berita Acara Resmi (BAST / Mutasi / Penghapusan)
app.post('/api/ai/draft-document', async (req, res) => {
  try {
    const { docType, payload, schoolConfig } = req.body;

    const prompt = `Anda adalah sekretaris bendahara barang sekolah di Indonesia.
Buatkan naskah draf resmi siap cetak untuk dokumen '${docType}' (misalnya Berita Acara Serah Terima, Berita Acara Mutasi, atau Berita Acara Penghapusan Barang).
Informasi Sekolah:
- Nama Sekolah: ${schoolConfig?.schoolName || 'SD Negeri 1 Contoh'}
- Kepala Sekolah: ${schoolConfig?.headmaster || 'Kepala Sekolah'} (${schoolConfig?.headmasterNip || '-'})
- Pengurus Barang: ${schoolConfig?.treasurer || 'Pengurus Barang'}

Detail Transaksi / Barang:
${JSON.stringify(payload)}

Tuliskan format berita acara resmi lengkap dengan pembuka, rincian pasal/tabel objek barang, klausul serah terima/pertanggungjawaban, serta penutup dan kolom tanda tangan kedua belah pihak. Gunakan kaidah bahasa baku administrasi persuratan dinas pendidikan.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ ok: true, text: response.text });
  } catch (error: any) {
    console.error('Error drafting document:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'Gagal menyusun naskah dokumen dengan AI',
    });
  }
});

// Mount Vite in dev mode or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server Bendahara Barang berjalan di http://localhost:${PORT}`);
  });
}

startServer();
