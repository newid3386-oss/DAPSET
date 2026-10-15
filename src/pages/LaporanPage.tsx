import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Building2,
  Package,
  Boxes,
  FileSignature,
  Sparkles,
  Loader2,
  Check,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { formatRupiah, formatTanggalIndo } from '../utils/format';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type ReportType =
  | 'persediaan'
  | 'barang_masuk'
  | 'barang_keluar'
  | 'kir'
  | 'kib_all'
  | 'depresiasi'
  | 'mutasi'
  | 'penghapusan'
  | 'atk_all'
  | 'bast_ai';

export const LaporanPage: React.FC = () => {
  const { config, stockSummary, barangMasuk, barangKeluar, assets, mutasi, penghapusan, pengambilanATK } = useInventory();
  const { showToast } = useToast();
  const [selectedReport, setSelectedReport] = useState<ReportType>('persediaan');
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');
  const [selectedKibFilter, setSelectedKibFilter] = useState<string>('ALL');

  // AI BAST drafting state
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [aiDraftContent, setAiDraftContent] = useState<string>('');

  const rooms = Array.from(new Set(assets.map((a) => a.lokasi)));

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // School Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text((config.schoolName || 'KABUPATEN BANDUNG BARAT').toUpperCase(), pageWidth / 2, 12, { align: 'center' });
      doc.setFontSize(11);
      doc.text(`DINAS PENDIDIKAN - NPSN: ${config.npsn || '-'}`, pageWidth / 2, 18, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(config.address || '', pageWidth / 2, 23, { align: 'center' });

      doc.setLineWidth(0.5);
      doc.line(14, 26, pageWidth - 14, 26);

      let title = '';
      let head: string[][] = [];
      let body: any[][] = [];

      if (selectedReport === 'persediaan') {
        title = 'REKAPITULASI PERSEDIAAN BARANG & ATK';
        head = [['No', 'Kode Barang', 'Nama Barang / ATK', 'Kategori', 'Stok', 'Satuan', 'Total Nilai (Rp)']];
        body = stockSummary.map((item, idx) => [
          idx + 1,
          item.kodeBarang,
          item.namaBarang,
          item.kategori,
          item.stok,
          item.jenisSatuan,
          formatRupiah(item.nilaiPersediaan),
        ]);
      } else if (selectedReport === 'barang_masuk') {
        title = 'BUKU KAS UMUM (BKU) - BARANG MASUK / PENGADAAN';
        head = [['No', 'Tanggal', 'Sumber Anggaran', 'Nama Barang', 'Jumlah', 'Harga Satuan', 'Total Harga', 'Petugas']];
        body = barangMasuk.map((b, idx) => [
          idx + 1,
          formatTanggalIndo(b.tanggal),
          b.sumberAnggaran,
          b.namaBarang,
          `${b.jumlah} ${b.jenisSatuan}`,
          formatRupiah(b.hargaSatuan),
          formatRupiah(b.totalPengadaan),
          b.petugas,
        ]);
      } else if (selectedReport === 'barang_keluar') {
        title = 'BUKU KAS UMUM (BKU) - BARANG KELUAR';
        head = [['No', 'Tanggal', 'Nama Barang', 'Jumlah', 'Penerima / Ruang', 'Keperluan', 'Petugas']];
        body = barangKeluar.map((b, idx) => [
          idx + 1,
          formatTanggalIndo(b.tanggal),
          b.namaBarang,
          `${b.jumlah} ${b.jenisSatuan}`,
          `${b.penerima} (${b.unitRuangan})`,
          b.tujuanPenggunaan,
          b.petugas,
        ]);
      } else if (selectedReport === 'kir') {
        title = `KARTU INVENTARIS RUANGAN (KIR) - ${selectedRoom === 'ALL' ? 'SEMUA RUANGAN' : selectedRoom}`;
        head = [['No', 'Kode Barang', 'Nama Barang', 'Merk / Spesifikasi', 'Tahun', 'Kondisi', 'Jumlah', 'Lokasi']];
        const filtered = assets.filter((a) => selectedRoom === 'ALL' || a.lokasi === selectedRoom);
        body = filtered.map((a, idx) => [
          idx + 1,
          a.kodeBarang,
          a.namaBarang,
          `${a.merk || ''} ${a.spesifikasi || ''}`,
          a.tahunPerolehan || '-',
          a.kondisi,
          a.jumlah,
          a.lokasi,
        ]);
      } else if (selectedReport === 'kib_all') {
        title = 'BUKU INDUK KARTU INVENTARIS BARANG (KIB A s.d. E)';
        head = [['No', 'KIB', 'Kode Aset', 'Nama Aset', 'Lokasi', 'Kondisi', 'Nilai Perolehan']];
        body = assets.map((a, idx) => [
          idx + 1,
          a.kibKategori || '-',
          a.kodeAset,
          a.namaBarang,
          a.lokasi,
          a.kondisi,
          formatRupiah(a.totalNilai || 0),
        ]);
      } else if (selectedReport === 'depresiasi') {
        title = 'REKAPITULASI PENYUSUTAN ASET (SAP)';
        head = [['No', 'Kode', 'Nama Aset', 'Tahun', 'Perolehan (Rp)', 'Umur', 'Akumulasi (Rp)', 'Nilai Buku (Rp)']];
        body = assets.map((a, idx) => {
          const tahunPerolehanNum = typeof a.tahunPerolehan === 'number' ? a.tahunPerolehan : parseInt(a.tahunPerolehan || '2020');
          const tahunSekarang = new Date().getFullYear();
          const umur = Math.max(1, a.masaManfaat || 5);
          const umurBerjalan = Math.max(0, tahunSekarang - tahunPerolehanNum);
          const perolehan = a.totalNilai || 0;
          const penyusutanPerTahun = perolehan / umur;
          const akumulasi = Math.min(perolehan, penyusutanPerTahun * umurBerjalan);
          const sisa = Math.max(0, perolehan - akumulasi);
          return [
            idx + 1,
            a.kodeBarang,
            a.namaBarang,
            a.tahunPerolehan || '-',
            formatRupiah(perolehan),
            `${umur} Thn`,
            formatRupiah(akumulasi),
            formatRupiah(sisa),
          ];
        });
      } else if (selectedReport === 'mutasi') {
        title = 'BERITA ACARA MUTASI INVENTARIS';
        head = [['No', 'Tanggal', 'Nama Barang', 'Dari Lokasi', 'Ke Lokasi', 'Alasan']];
        body = mutasi.map((m, idx) => [
          idx + 1,
          formatTanggalIndo(m.tanggal),
          m.namaBarang,
          m.dariLokasi,
          m.keLokasi,
          m.alasan,
        ]);
      } else if (selectedReport === 'penghapusan') {
        title = 'BERITA ACARA PENGHAPUSAN INVENTARIS';
        head = [['No', 'Tanggal', 'Nama Barang', 'Kondisi Akhir', 'Alasan', 'Status']];
        body = penghapusan.map((p, idx) => [
          idx + 1,
          formatTanggalIndo(p.tanggal),
          p.namaBarang,
          p.kondisiAkhir,
          p.alasan,
          p.status,
        ]);
      } else if (selectedReport === 'atk_all') {
        title = 'REKAPITULASI PENGAMBILAN ATK / PERSEDIAAN';
        head = [['No', 'Tanggal', 'Pegawai / NIP', 'Jabatan', 'Item yang Diambil']];
        body = pengambilanATK.map((atk, idx) => [
          idx + 1,
          formatTanggalIndo(atk.tanggal),
          `${atk.namaLengkap} (${atk.nip})`,
          atk.jabatan,
          atk.items.map((it) => `${it.namaBarang} (${it.jumlah} ${it.satuan || ''})`).join(', '),
        ]);
      } else if (selectedReport === 'bast_ai') {
        title = 'BERITA ACARA SERAH TERIMA (BAST) - DRAF AI';
        head = [['Informasi BAST Resmi']];
        body = [[aiDraftContent || 'Belum ada draf BAST AI yang dibuat. Silakan susun naskah BAST otomatis terlebih dahulu.']];
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(title, 14, 34);

      (doc as any).autoTable({
        startY: 38,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [15, 118, 110] },
        styles: { fontSize: 8, cellPadding: 2 },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 15;
      const pageHeight = doc.internal.pageSize.getHeight();
      let signY = finalY > pageHeight - 35 ? pageHeight - 35 : finalY;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Mengetahui,', 30, signY, { align: 'center' });
      doc.text(`Kepala ${config.schoolName}`, 30, signY + 5, { align: 'center' });
      doc.text(config.headmaster || '-', 30, signY + 25, { align: 'center' });
      doc.text(`NIP. ${config.headmasterNip || '-'}`, 30, signY + 30, { align: 'center' });

      doc.text(`Bandung Barat, ${formatTanggalIndo(new Date())}`, pageWidth - 50, signY, { align: 'center' });
      doc.text('Bendahara / Pengurus Barang', pageWidth - 50, signY + 5, { align: 'center' });
      doc.text(config.treasurer || '-', pageWidth - 50, signY + 25, { align: 'center' });
      doc.text(`NIP. ${config.treasurerNip || '-'}`, pageWidth - 50, signY + 30, { align: 'center' });

      doc.save(`Laporan_${selectedReport}_${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast('Laporan PDF resmi berhasil diunduh via jsPDF!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Gagal menghasilkan file PDF', 'error');
    }
  };

  const handleGenerateAiBast = async () => {
    setAiDraftLoading(true);
    try {
      const res = await fetch('/api/ai/draft-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: 'Berita Acara Serah Terima (BAST) Hasil Pengadaan Belanja BOS',
          schoolConfig: config,
          payload: {
            pengadaanTerakhir: barangMasuk.slice(0, 5),
            tanggalCetak: new Date().toISOString().slice(0, 10),
          },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setAiDraftContent(data.text);
        showToast('Naskah resmi BAST berhasil disusun oleh AI!', 'success');
      } else {
        showToast(data.error || 'Gagal menyusun naskah BAST', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Terjadi kesalahan saat menghubungi asisten AI', 'error');
    } finally {
      setAiDraftLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Non-print Controls */}
      <div className="no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-800" /> Cetak Laporan &amp; Berita Acara Resmi
            </h2>
            <p className="text-xs text-slate-500">
              Format baku laporan inventaris &amp; pembukuan BOS siap cetak dokumen cetak A4 / Folio kop sekolah.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition"
            >
              <Download className="w-4 h-4" /> Unduh PDF (jsPDF)
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition"
            >
              <Printer className="w-4 h-4" /> Cetak Lembar Ini (Print)
            </button>
          </div>
        </div>

        {/* Report Selector Pills */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedReport('persediaan')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedReport === 'persediaan'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Package className="w-3.5 h-3.5" /> Rekap Persediaan Barang
          </button>

          <button
            onClick={() => setSelectedReport('barang_masuk')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedReport === 'barang_masuk'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" /> BKU Barang Masuk
          </button>

          <button
            onClick={() => setSelectedReport('barang_keluar')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedReport === 'barang_keluar'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" /> BKU Barang Keluar
          </button>

          <button
            onClick={() => setSelectedReport('kir')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedReport === 'kir'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Kartu Inventaris Ruangan (KIR)
          </button>

          <button
            onClick={() => setSelectedReport('kib_all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedReport === 'kib_all'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Buku Induk KIB (A s.d. E)
          </button>

          <button
            onClick={() => setSelectedReport('depresiasi')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedReport === 'depresiasi'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Rekap Penyusutan Aset (SAP)
          </button>

          <button
            onClick={() => setSelectedReport('mutasi')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedReport === 'mutasi'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Berita Acara Mutasi
          </button>

          <button
            onClick={() => setSelectedReport('penghapusan')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedReport === 'penghapusan'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Berita Acara Penghapusan
          </button>

          <button
            onClick={() => setSelectedReport('atk_all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedReport === 'atk_all'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FileSignature className="w-3.5 h-3.5" /> Rekap Pengambilan ATK
          </button>

          <button
            onClick={() => setSelectedReport('bast_ai')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedReport === 'bast_ai'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'bg-teal-50 hover:bg-teal-100 text-teal-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Generator BAST AI
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Periode Waktu:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 font-medium"
            >
              <option value="ALL">Semua Periode Tahun Ini</option>
              <option value="TW1">Triwulan I (Januari - Maret)</option>
              <option value="TW2">Triwulan II (April - Juni)</option>
              <option value="TW3">Triwulan III (Juli - September)</option>
              <option value="TW4">Triwulan IV (Oktober - Desember)</option>
              <option value="SEM1">Semester 1 (Ganjil)</option>
              <option value="SEM2">Semester 2 (Genap)</option>
            </select>
          </div>

          {selectedReport === 'kir' && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Filter Ruangan:</span>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 font-medium"
              >
                <option value="ALL">Semua Ruangan</option>
                {rooms.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedReport === 'kib_all' && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Golongan KIB:</span>
              <select
                value={selectedKibFilter}
                onChange={(e) => setSelectedKibFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 font-medium"
              >
                <option value="ALL">Semua Golongan (KIB A s.d. E)</option>
                <option value="KIB_A">KIB A (Tanah)</option>
                <option value="KIB_B">KIB B (Peralatan &amp; Mesin)</option>
                <option value="KIB_C">KIB C (Gedung &amp; Bangunan)</option>
                <option value="KIB_D">KIB D (Jalan &amp; Jaringan)</option>
                <option value="KIB_E">KIB E (Aset Tetap Lainnya)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Printable Sheet Viewport */}
      <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-lg text-slate-900 max-w-4xl mx-auto print:border-0 print:shadow-none print:p-0 print:max-w-none">
        {/* Kop Surat Resmi Sekolah */}
        <div className="text-center border-b-4 border-double border-slate-900 pb-4 mb-6">
          <div className="text-xs uppercase font-bold tracking-wider text-slate-600">
            PEMERINTAH DAERAH PROVINSI / KABUPATEN
          </div>
          <div className="text-lg md:text-xl font-black uppercase text-slate-900 tracking-tight">
            DINAS PENDIDIKAN DAN KEBUDAYAAN
          </div>
          <div className="text-base md:text-lg font-extrabold uppercase text-emerald-950">
            {config.schoolName}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">{config.address}</div>
          <div className="text-[11px] font-mono text-slate-500">NPSN: {config.npsn}</div>
        </div>

        {/* Report Content Body */}
        {selectedReport === 'persediaan' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-black text-sm uppercase underline">
                LAPORAN REKAPITULASI BUKU PERSEDIAAN BARANG
              </h3>
              <p className="text-xs text-slate-500">
                Tahun Anggaran {new Date().getFullYear()} • Dicetak per tanggal {formatTanggalIndo(new Date())}
              </p>
            </div>

            <table className="w-full border-collapse border border-slate-800 text-[11px]">
              <thead className="bg-slate-100 text-slate-900">
                <tr>
                  <th className="border border-slate-800 p-1.5 text-center w-8">No</th>
                  <th className="border border-slate-800 p-1.5 text-left">Kode</th>
                  <th className="border border-slate-800 p-1.5 text-left">Nama Barang</th>
                  <th className="border border-slate-800 p-1.5 text-center">Satuan</th>
                  <th className="border border-slate-800 p-1.5 text-center">Masuk</th>
                  <th className="border border-slate-800 p-1.5 text-center">Keluar</th>
                  <th className="border border-slate-800 p-1.5 text-center">Sisa Saldo</th>
                  <th className="border border-slate-800 p-1.5 text-right">Nilai Persediaan</th>
                </tr>
              </thead>
              <tbody>
                {stockSummary.map((s, idx) => (
                  <tr key={s.kodeBarang}>
                    <td className="border border-slate-800 p-1.5 text-center">{idx + 1}</td>
                    <td className="border border-slate-800 p-1.5 font-mono">{s.kodeBarang}</td>
                    <td className="border border-slate-800 p-1.5 font-medium">{s.namaBarang}</td>
                    <td className="border border-slate-800 p-1.5 text-center">{s.jenisSatuan}</td>
                    <td className="border border-slate-800 p-1.5 text-center">{s.stokMasuk}</td>
                    <td className="border border-slate-800 p-1.5 text-center">{s.stokKeluar}</td>
                    <td className="border border-slate-800 p-1.5 text-center font-bold">{s.stok}</td>
                    <td className="border border-slate-800 p-1.5 text-right">{formatRupiah(s.nilaiPersediaan)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'barang_masuk' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-black text-sm uppercase underline">
                BUKU PEMBANTU PENGADAAN BARANG MASUK (BOS/BOP)
              </h3>
              <p className="text-xs text-slate-500">Tahun Anggaran {new Date().getFullYear()}</p>
            </div>

            <table className="w-full border-collapse border border-slate-800 text-[11px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-800 p-1.5 text-center w-8">No</th>
                  <th className="border border-slate-800 p-1.5 text-left">Tanggal</th>
                  <th className="border border-slate-800 p-1.5 text-left">No BKU / Kwt</th>
                  <th className="border border-slate-800 p-1.5 text-left">Penyedia / Toko</th>
                  <th className="border border-slate-800 p-1.5 text-left">Barang</th>
                  <th className="border border-slate-800 p-1.5 text-center">Vol</th>
                  <th className="border border-slate-800 p-1.5 text-right">Harga (Rp)</th>
                  <th className="border border-slate-800 p-1.5 text-right">Total (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {barangMasuk.map((bm, idx) => (
                  <tr key={bm.id}>
                    <td className="border border-slate-800 p-1.5 text-center">{idx + 1}</td>
                    <td className="border border-slate-800 p-1.5 whitespace-nowrap">{formatTanggalIndo(bm.tanggal)}</td>
                    <td className="border border-slate-800 p-1.5 font-mono text-[10px]">{bm.nomorBku}</td>
                    <td className="border border-slate-800 p-1.5">{bm.namaToko}</td>
                    <td className="border border-slate-800 p-1.5 font-medium">{bm.namaBarang}</td>
                    <td className="border border-slate-800 p-1.5 text-center font-bold">
                      {bm.jumlah} {bm.jenisSatuan}
                    </td>
                    <td className="border border-slate-800 p-1.5 text-right">{formatRupiah(bm.hargaSatuan)}</td>
                    <td className="border border-slate-800 p-1.5 text-right font-bold">
                      {formatRupiah(bm.totalPengadaan)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'barang_keluar' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-black text-sm uppercase underline">
                BUKU PEMBANTU PENGELUARAN &amp; DISTRIBUSI BARANG
              </h3>
              <p className="text-xs text-slate-500">Tahun Anggaran {new Date().getFullYear()}</p>
            </div>

            <table className="w-full border-collapse border border-slate-800 text-[11px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-800 p-1.5 text-center w-8">No</th>
                  <th className="border border-slate-800 p-1.5 text-left">Tanggal</th>
                  <th className="border border-slate-800 p-1.5 text-left">Nama Barang</th>
                  <th className="border border-slate-800 p-1.5 text-center">Jumlah</th>
                  <th className="border border-slate-800 p-1.5 text-left">Penerima</th>
                  <th className="border border-slate-800 p-1.5 text-left">Ruangan / Kelas</th>
                  <th className="border border-slate-800 p-1.5 text-left">Keperluan</th>
                </tr>
              </thead>
              <tbody>
                {barangKeluar.map((bk, idx) => (
                  <tr key={bk.id}>
                    <td className="border border-slate-800 p-1.5 text-center">{idx + 1}</td>
                    <td className="border border-slate-800 p-1.5 whitespace-nowrap">{formatTanggalIndo(bk.tanggal)}</td>
                    <td className="border border-slate-800 p-1.5 font-medium">{bk.namaBarang}</td>
                    <td className="border border-slate-800 p-1.5 text-center font-bold">
                      {bk.jumlah} {bk.jenisSatuan}
                    </td>
                    <td className="border border-slate-800 p-1.5 font-semibold">{bk.penerima}</td>
                    <td className="border border-slate-800 p-1.5">{bk.unitRuangan}</td>
                    <td className="border border-slate-800 p-1.5 text-slate-600">{bk.tujuanPenggunaan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'kir' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-black text-sm uppercase underline">
                KARTU INVENTARIS RUANGAN (KIR)
              </h3>
              <p className="text-xs font-semibold text-slate-700">
                Ruangan: {selectedRoom === 'ALL' ? 'Semua Ruangan Sekolah' : selectedRoom}
              </p>
              <p className="text-[10px] text-slate-500 italic">
                Standar Permendagri No. 19 / 2016 tentang Pedoman Pengelolaan Barang Milik Daerah
              </p>
            </div>

            {selectedRoom !== 'ALL' && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-300 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 font-sans">
                <div>
                  <span className="text-slate-500 text-[10px] block font-semibold">Nama Ruangan</span>
                  <strong className="text-slate-900">{selectedRoom}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-semibold">Penanggung Jawab</span>
                  <strong className="text-slate-900">
                    {assets.find((a) => a.lokasi === selectedRoom)?.penanggungJawab || 'Wali Kelas / PJ Ruang'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-semibold">Jumlah Jenis Aset</span>
                  <strong className="text-slate-900">
                    {assets.filter((a) => a.lokasi === selectedRoom).length} Unit
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-semibold">Total Valuasi Aset</span>
                  <strong className="text-emerald-950 font-bold">
                    {formatRupiah(
                      assets
                        .filter((a) => a.lokasi === selectedRoom)
                        .reduce((sum, a) => sum + (a.totalNilai || a.hargaSatuan), 0)
                    )}
                  </strong>
                </div>
              </div>
            )}

            <table className="w-full border-collapse border border-slate-800 text-[10px]">
              <thead className="bg-slate-100 text-slate-900 font-bold">
                <tr>
                  <th className="border border-slate-800 p-1.5 text-center w-8">No</th>
                  <th className="border border-slate-800 p-1.5 text-left">Kode Barang / Aset</th>
                  <th className="border border-slate-800 p-1.5 text-left">Nama Barang &amp; Spesifikasi</th>
                  <th className="border border-slate-800 p-1.5 text-left">Merk / Tipe</th>
                  <th className="border border-slate-800 p-1.5 text-left">No. Seri / Pabrik</th>
                  <th className="border border-slate-800 p-1.5 text-center">Bahan</th>
                  <th className="border border-slate-800 p-1.5 text-center">Tahun</th>
                  <th className="border border-slate-800 p-1.5 text-center">Jumlah</th>
                  <th className="border border-slate-800 p-1.5 text-center">Kondisi</th>
                  <th className="border border-slate-800 p-1.5 text-right">Harga Perolehan</th>
                  <th className="border border-slate-800 p-1.5 text-left">Penanggung Jawab</th>
                </tr>
              </thead>
              <tbody>
                {assets
                  .filter((a) => selectedRoom === 'ALL' || a.lokasi === selectedRoom)
                  .map((a, idx) => (
                    <tr key={a.id} className="hover:bg-slate-50/50">
                      <td className="border border-slate-800 p-1.5 text-center">{idx + 1}</td>
                      <td className="border border-slate-800 p-1.5 font-mono font-bold text-[9px]">{a.kodeAset}</td>
                      <td className="border border-slate-800 p-1.5 font-medium">{a.namaBarang}</td>
                      <td className="border border-slate-800 p-1.5">{a.merk || '-'}</td>
                      <td className="border border-slate-800 p-1.5 font-mono text-[9px]">{a.nomorSeri || '-'}</td>
                      <td className="border border-slate-800 p-1.5 text-center">{a.bahan || 'Kayu/Besi'}</td>
                      <td className="border border-slate-800 p-1.5 text-center font-mono">
                        {a.tahunPerolehan || a.tanggalBku?.slice(0, 4) || '-'}
                      </td>
                      <td className="border border-slate-800 p-1.5 text-center font-bold">
                        {a.jumlah} {a.jenisSatuan}
                      </td>
                      <td className="border border-slate-800 p-1.5 text-center font-bold">
                        {a.kondisi === 'BAIK' ? (
                          <span className="text-emerald-800">Baik (B)</span>
                        ) : a.kondisi === 'RUSAK_RINGAN' ? (
                          <span className="text-amber-800">RR</span>
                        ) : (
                          <span className="text-red-800">RB</span>
                        )}
                      </td>
                      <td className="border border-slate-800 p-1.5 text-right font-medium">
                        {formatRupiah(a.totalNilai || a.hargaSatuan)}
                      </td>
                      <td className="border border-slate-800 p-1.5">{a.penanggungJawab}</td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold">
                <tr>
                  <td colSpan={9} className="border border-slate-800 p-1.5 text-right">
                    TOTAL NILAI ASET RUANGAN:
                  </td>
                  <td className="border border-slate-800 p-1.5 text-right font-black">
                    {formatRupiah(
                      assets
                        .filter((a) => selectedRoom === 'ALL' || a.lokasi === selectedRoom)
                        .reduce((sum, a) => sum + (a.totalNilai || a.hargaSatuan), 0)
                    )}
                  </td>
                  <td className="border border-slate-800 p-1.5"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {selectedReport === 'kib_all' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-black text-sm uppercase underline">
                BUKU INDUK INVENTARIS BARANG (KIB{' '}
                {selectedKibFilter === 'ALL'
                  ? 'A S.D. E'
                  : selectedKibFilter.replace('_', ' ')}
                )
              </h3>
              <p className="text-xs text-slate-500">
                Format Baku Penatausahaan Barang Milik Daerah (Permendagri 47/2021 &amp; Kemendikbudristek)
              </p>
            </div>

            <table className="w-full border-collapse border border-slate-800 text-[10px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-800 p-1 text-center w-6">No</th>
                  <th className="border border-slate-800 p-1 text-left">Kode Barang/Aset</th>
                  <th className="border border-slate-800 p-1 text-left">Nama / Jenis Barang</th>
                  <th className="border border-slate-800 p-1 text-left">Merk / Type</th>
                  <th className="border border-slate-800 p-1 text-left">No. Sertifikat / Pabrik</th>
                  <th className="border border-slate-800 p-1 text-left">Bahan</th>
                  <th className="border border-slate-800 p-1 text-center">Tahun</th>
                  <th className="border border-slate-800 p-1 text-left">Asal Usul / Anggaran</th>
                  <th className="border border-slate-800 p-1 text-center">Kondisi</th>
                  <th className="border border-slate-800 p-1 text-right">Harga Perolehan</th>
                </tr>
              </thead>
              <tbody>
                {assets
                  .filter(
                    (a) =>
                      selectedKibFilter === 'ALL' || a.kibKategori === selectedKibFilter
                  )
                  .map((a, idx) => (
                    <tr key={a.id}>
                      <td className="border border-slate-800 p-1 text-center">{idx + 1}</td>
                      <td className="border border-slate-800 p-1 font-mono font-bold">{a.kodeAset}</td>
                      <td className="border border-slate-800 p-1 font-medium">{a.namaBarang}</td>
                      <td className="border border-slate-800 p-1">{a.merk}</td>
                      <td className="border border-slate-800 p-1 font-mono text-[9px]">{a.nomorSeri || '-'}</td>
                      <td className="border border-slate-800 p-1">{a.bahan || '-'}</td>
                      <td className="border border-slate-800 p-1 text-center font-mono">
                        {a.tahunPerolehan || a.tanggalBku?.slice(0, 4) || '-'}
                      </td>
                      <td className="border border-slate-800 p-1">{a.asalUsul || 'BOS Reguler'}</td>
                      <td className="border border-slate-800 p-1 text-center font-bold">
                        {a.kondisi === 'BAIK' ? 'B' : a.kondisi === 'RUSAK_RINGAN' ? 'RR' : 'RB'}
                      </td>
                      <td className="border border-slate-800 p-1 text-right font-medium">
                        {formatRupiah(a.totalNilai || a.hargaSatuan)}
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold">
                <tr>
                  <td colSpan={9} className="border border-slate-800 p-1.5 text-right">
                    TOTAL NILAI PEROLEHAN KIB:
                  </td>
                  <td className="border border-slate-800 p-1.5 text-right">
                    {formatRupiah(
                      assets
                        .filter(
                          (a) =>
                            selectedKibFilter === 'ALL' ||
                            a.kibKategori === selectedKibFilter
                        )
                        .reduce(
                          (acc, a) => acc + (a.totalNilai || a.hargaSatuan),
                          0
                        )
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {selectedReport === 'depresiasi' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-black text-sm uppercase underline">
                LAPORAN REKAPITULASI PENYUSUTAN &amp; NILAI BUKU ASET TETAP
              </h3>
              <p className="text-xs text-slate-500">
                Penyajian Akuntansi Standar Pemerintahan (SAP No. 71/2010 &amp; Permendagri No. 47/2021)
              </p>
            </div>

            <table className="w-full border-collapse border border-slate-800 text-[10px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-800 p-1 text-center w-6">No</th>
                  <th className="border border-slate-800 p-1 text-left">Kode Aset</th>
                  <th className="border border-slate-800 p-1 text-left">Nama Barang / Aset</th>
                  <th className="border border-slate-800 p-1 text-center">Thn Perolehan</th>
                  <th className="border border-slate-800 p-1 text-center">Manfaat (Thn)</th>
                  <th className="border border-slate-800 p-1 text-center">Usia Pakai</th>
                  <th className="border border-slate-800 p-1 text-right">Nilai Perolehan</th>
                  <th className="border border-slate-800 p-1 text-right">Susut / Thn</th>
                  <th className="border border-slate-800 p-1 text-right">Akumulasi Susut</th>
                  <th className="border border-slate-800 p-1 text-right font-bold">Nilai Buku</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a, idx) => {
                  const thn = a.tahunPerolehan || parseInt(a.tanggalBku?.slice(0, 4) || '2026', 10);
                  const masaManfaat = a.masaManfaat !== undefined ? a.masaManfaat : (a.kibKategori === 'KIB_A' ? 0 : 4);
                  const usia = Math.max(0, new Date().getFullYear() - thn);
                  const nilaiPerolehan = a.totalNilai || (a.jumlah * a.hargaSatuan);
                  let bebanTahun = 0;
                  let akumulasi = 0;
                  let nilaiBuku = nilaiPerolehan;

                  if (masaManfaat > 0) {
                    bebanTahun = nilaiPerolehan / masaManfaat;
                    akumulasi = Math.min(nilaiPerolehan, bebanTahun * usia);
                    nilaiBuku = Math.max(0, nilaiPerolehan - akumulasi);
                  }

                  return (
                    <tr key={a.id}>
                      <td className="border border-slate-800 p-1 text-center">{idx + 1}</td>
                      <td className="border border-slate-800 p-1 font-mono">{a.kodeAset}</td>
                      <td className="border border-slate-800 p-1 font-medium">{a.namaBarang}</td>
                      <td className="border border-slate-800 p-1 text-center">{thn}</td>
                      <td className="border border-slate-800 p-1 text-center">{masaManfaat}</td>
                      <td className="border border-slate-800 p-1 text-center">{usia} Thn</td>
                      <td className="border border-slate-800 p-1 text-right">{formatRupiah(nilaiPerolehan)}</td>
                      <td className="border border-slate-800 p-1 text-right">{formatRupiah(bebanTahun)}</td>
                      <td className="border border-slate-800 p-1 text-right font-medium text-amber-900">{formatRupiah(akumulasi)}</td>
                      <td className="border border-slate-800 p-1 text-right font-bold text-emerald-950 bg-emerald-50/30">
                        {formatRupiah(nilaiBuku)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 font-bold">
                <tr>
                  <td colSpan={6} className="border border-slate-800 p-1.5 text-right">
                    JUMLAH TOTAL:
                  </td>
                  <td className="border border-slate-800 p-1.5 text-right">
                    {formatRupiah(assets.reduce((acc, a) => acc + (a.totalNilai || a.hargaSatuan), 0))}
                  </td>
                  <td className="border border-slate-800 p-1.5 text-right">-</td>
                  <td className="border border-slate-800 p-1.5 text-right text-amber-900">
                    {formatRupiah(
                      assets.reduce((acc, a) => {
                        const thn = a.tahunPerolehan || parseInt(a.tanggalBku?.slice(0, 4) || '2026', 10);
                        const masa = a.masaManfaat !== undefined ? a.masaManfaat : (a.kibKategori === 'KIB_A' ? 0 : 4);
                        const usia = Math.max(0, new Date().getFullYear() - thn);
                        const np = a.totalNilai || (a.jumlah * a.hargaSatuan);
                        return acc + (masa > 0 ? Math.min(np, (np / masa) * usia) : 0);
                      }, 0)
                    )}
                  </td>
                  <td className="border border-slate-800 p-1.5 text-right text-emerald-950">
                    {formatRupiah(
                      assets.reduce((acc, a) => {
                        const thn = a.tahunPerolehan || parseInt(a.tanggalBku?.slice(0, 4) || '2026', 10);
                        const masa = a.masaManfaat !== undefined ? a.masaManfaat : (a.kibKategori === 'KIB_A' ? 0 : 4);
                        const usia = Math.max(0, new Date().getFullYear() - thn);
                        const np = a.totalNilai || (a.jumlah * a.hargaSatuan);
                        const ak = masa > 0 ? Math.min(np, (np / masa) * usia) : 0;
                        return acc + Math.max(0, np - ak);
                      }, 0)
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {selectedReport === 'mutasi' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-black text-sm uppercase underline">
                BERITA ACARA MUTASI &amp; PEMINDAHAN ASET BARANG
              </h3>
              <p className="text-xs text-slate-500">Tahun Anggaran {new Date().getFullYear()}</p>
            </div>

            <table className="w-full border-collapse border border-slate-800 text-[11px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-800 p-1.5 text-center w-8">No</th>
                  <th className="border border-slate-800 p-1.5 text-left">Tanggal</th>
                  <th className="border border-slate-800 p-1.5 text-left">Kode Aset &amp; Nama Barang</th>
                  <th className="border border-slate-800 p-1.5 text-left">Dari Ruangan</th>
                  <th className="border border-slate-800 p-1.5 text-left">Ke Ruangan</th>
                  <th className="border border-slate-800 p-1.5 text-left">PJ Baru</th>
                  <th className="border border-slate-800 p-1.5 text-left">Alasan Pemindahan</th>
                </tr>
              </thead>
              <tbody>
                {mutasi.map((m, idx) => (
                  <tr key={m.id}>
                    <td className="border border-slate-800 p-1.5 text-center">{idx + 1}</td>
                    <td className="border border-slate-800 p-1.5 whitespace-nowrap">{formatTanggalIndo(m.tanggal)}</td>
                    <td className="border border-slate-800 p-1.5 font-medium">
                      {m.namaBarang} ({m.kodeAset})
                    </td>
                    <td className="border border-slate-800 p-1.5">{m.dariLokasi}</td>
                    <td className="border border-slate-800 p-1.5 font-bold">{m.keLokasi}</td>
                    <td className="border border-slate-800 p-1.5">{m.kePj}</td>
                    <td className="border border-slate-800 p-1.5">{m.alasan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'penghapusan' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-black text-sm uppercase underline">
                BERITA ACARA USULAN PENGHAPUSAN ASET RUSAK BERAT
              </h3>
              <p className="text-xs text-slate-500">Tahun Anggaran {new Date().getFullYear()}</p>
            </div>

            <table className="w-full border-collapse border border-slate-800 text-[11px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-800 p-1.5 text-center w-8">No</th>
                  <th className="border border-slate-800 p-1.5 text-left">Tanggal</th>
                  <th className="border border-slate-800 p-1.5 text-left">Kode Aset &amp; Nama Barang</th>
                  <th className="border border-slate-800 p-1.5 text-left">Kondisi Akhir</th>
                  <th className="border border-slate-800 p-1.5 text-left">Nomor SK / Berita Acara</th>
                  <th className="border border-slate-800 p-1.5 text-left">Alasan Penghapusan</th>
                  <th className="border border-slate-800 p-1.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {penghapusan.map((p, idx) => (
                  <tr key={p.id}>
                    <td className="border border-slate-800 p-1.5 text-center">{idx + 1}</td>
                    <td className="border border-slate-800 p-1.5 whitespace-nowrap">{formatTanggalIndo(p.tanggal)}</td>
                    <td className="border border-slate-800 p-1.5 font-medium">
                      {p.namaBarang} ({p.kodeAset})
                    </td>
                    <td className="border border-slate-800 p-1.5 font-bold text-red-900">{p.kondisiAkhir}</td>
                    <td className="border border-slate-800 p-1.5 font-mono text-[10px]">{p.dokumen}</td>
                    <td className="border border-slate-800 p-1.5">{p.alasan}</td>
                    <td className="border border-slate-800 p-1.5 text-center font-bold">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'atk_all' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-black text-sm uppercase underline">
                REKAPITULASI PENERIMAAN / PENGAMBILAN ATK KESELURUHAN
              </h3>
              <p className="text-xs text-slate-500">Dilengkapi Paraf Digital &amp; Foto Serah Terima</p>
            </div>

            <table className="w-full border-collapse border border-slate-800 text-[11px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-800 p-1.5 text-center w-8">No</th>
                  <th className="border border-slate-800 p-1.5 text-left">Tanggal</th>
                  <th className="border border-slate-800 p-1.5 text-left">NIP &amp; Nama Guru</th>
                  <th className="border border-slate-800 p-1.5 text-left">Jabatan</th>
                  <th className="border border-slate-800 p-1.5 text-left">Barang yang Diambil</th>
                  <th className="border border-slate-800 p-1.5 text-center w-20">Foto</th>
                  <th className="border border-slate-800 p-1.5 text-center w-20">Paraf TTD</th>
                </tr>
              </thead>
              <tbody>
                {pengambilanATK.map((atk) => (
                  <tr key={atk.id}>
                    <td className="border border-slate-800 p-1.5 text-center font-bold">#{atk.no}</td>
                    <td className="border border-slate-800 p-1.5 whitespace-nowrap">{formatTanggalIndo(atk.tanggal)}</td>
                    <td className="border border-slate-800 p-1.5">
                      <div className="font-bold">{atk.namaLengkap}</div>
                      <div className="text-[10px] text-slate-500">{atk.nip}</div>
                    </td>
                    <td className="border border-slate-800 p-1.5">{atk.jabatan}</td>
                    <td className="border border-slate-800 p-1.5">
                      {atk.items.map((it, i) => (
                        <div key={i}>• {it.namaBarang} ({it.jumlah} {it.satuan || ''})</div>
                      ))}
                    </td>
                    <td className="border border-slate-800 p-1.5 text-center">
                      {atk.fotoBuktiLink ? (
                        <img src={atk.fotoBuktiLink} alt="Foto" className="w-12 h-12 object-cover mx-auto rounded" />
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="border border-slate-800 p-1.5 text-center">
                      {atk.parafLink ? (
                        <img src={atk.parafLink} alt="Paraf" className="h-8 mx-auto object-contain" />
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'bast_ai' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-black text-sm uppercase underline">
                BERITA ACARA SERAH TERIMA HASIL PEKERJAAN / PENGADAAN (BAST)
              </h3>
              <p className="text-xs text-slate-500">Penyusunan format administratif formal dinas pendidikan</p>
            </div>

            {!aiDraftContent && (
              <div className="no-print p-6 text-center border-2 border-dashed border-teal-300 rounded-2xl bg-teal-50/50">
                <Sparkles className="w-8 h-8 text-teal-700 mx-auto mb-2" />
                <p className="text-xs font-semibold text-teal-950">
                  Gunakan kecerdasan buatan Gemini untuk merancang draf naskah BAST otomatis berdasarkan belanja pengadaan terbaru.
                </p>
                <button
                  onClick={handleGenerateAiBast}
                  disabled={aiDraftLoading}
                  className="mt-3 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs shadow-xs"
                >
                  {aiDraftLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Menyusun BAST...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Susun Naskah BAST Otomatis
                    </>
                  )}
                </button>
              </div>
            )}

            {aiDraftContent && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 whitespace-pre-wrap text-xs leading-relaxed font-serif">
                {aiDraftContent}
              </div>
            )}
          </div>
        )}

        {/* Tanda Tangan Pengesahan Sekolah */}
        <div className="grid grid-cols-2 gap-8 pt-8 mt-8 border-t border-slate-300 text-xs">
          <div className="text-center">
            <p className="text-slate-600 mb-1">Mengetahui,</p>
            <p className="font-bold text-slate-900">Kepala {config.schoolName}</p>
            <div className="h-20" />
            <p className="font-bold underline text-slate-900">{config.headmaster}</p>
            <p className="text-[11px] text-slate-600">NIP. {config.headmasterNip}</p>
          </div>

          <div className="text-center">
            <p className="text-slate-600 mb-1">Bandung Barat, {formatTanggalIndo(new Date())}</p>
            <p className="font-bold text-slate-900">Bendahara / Pengurus Barang</p>
            <div className="h-20" />
            <p className="font-bold underline text-slate-900">{config.treasurer}</p>
            <p className="text-[11px] text-slate-600">NIP. {config.treasurerNip}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
