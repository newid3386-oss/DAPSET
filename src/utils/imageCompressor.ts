/**
 * Image Compressor & Storage Optimizer
 * Implementasi Prioritas 2: Kompresi otomatis gambar (Canvas downscaling & quality tuning)
 * Mencegah data Base64 melebihi batas 1 MB dokumen Firestore dan menghemat kuota transmisi.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

/**
 * Kompresi berkas gambar atau Data URL ke format JPEG/WebP dengan batas dimensi maksimal
 * @param source File, Blob, atau string Data URL
 * @param maxDimension Dimensi terpanjang (lebar/tinggi) maksimal (default 800px)
 * @param quality Kualitas kompresi 0.1 - 1.0 (default 0.72)
 */
export async function compressImage(
  source: File | Blob | string,
  maxDimension: number = 800,
  quality: number = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    let originalDataUrl = '';

    const processDataUrl = (dataUrl: string) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Hitung skala rasio agar tidak melebihi maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Gambar latar putih (mencegah transparansi menjadi hitam pada format JPEG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Gambar ulang gambar dengan dimensi yang sudah diskalakan
        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor ke format JPEG dengan kualitas terkompresi
        try {
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(dataUrl);
        }
      };

      img.onerror = () => {
        // Fallback jika pemrosesan gagal
        resolve(dataUrl);
      };

      img.src = dataUrl;
    };

    if (typeof source === 'string') {
      processDataUrl(source);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        originalDataUrl = (e.target?.result as string) || '';
        processDataUrl(originalDataUrl);
      };
      reader.onerror = () => reject(new Error('Gagal membaca berkas gambar'));
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Pangkas batas transparan pada kanvas tanda tangan (Signature trimming)
 * Menghilangkan ruang kosong di sekitar goresan paraf agar ukuran file < 10 KB
 */
export function trimAndCompressSignature(
  canvas: HTMLCanvasElement,
  quality: number = 0.8
): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/png');

  const { width, height } = canvas;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  // Temukan bounding box piksel yang digores
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  // Jika kanvas kosong
  if (!found) {
    return canvas.toDataURL('image/png');
  }

  // Berikan padding 10px
  const pad = 10;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width, maxX + pad);
  maxY = Math.min(height, maxY + pad);

  const trimmedWidth = maxX - minX;
  const trimmedHeight = maxY - minY;

  const trimmedCanvas = document.createElement('canvas');
  trimmedCanvas.width = trimmedWidth;
  trimmedCanvas.height = trimmedHeight;

  const trimmedCtx = trimmedCanvas.getContext('2d');
  if (!trimmedCtx) return canvas.toDataURL('image/png');

  trimmedCtx.drawImage(
    canvas,
    minX,
    minY,
    trimmedWidth,
    trimmedHeight,
    0,
    0,
    trimmedWidth,
    trimmedHeight
  );

  return trimmedCanvas.toDataURL('image/png', quality);
}

/**
 * Hitung ukuran byte UTF-8 dari sebuah string
 */
export function getByteSize(str: string): number {
  return new Blob([str]).size;
}

/**
 * Format ukuran byte ke format KB / MB yang mudah dibaca
 */
export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Validasi kapasitas dokumen Firestore (Batas aman: 850 KB, batas absolut Firestore: 1048576 byte)
 */
export function checkPayloadCapacity(
  dataJson: string,
  limitBytes: number = 850 * 1024
): {
  isSafe: boolean;
  sizeBytes: number;
  percentage: number;
  formattedSize: string;
} {
  const sizeBytes = getByteSize(dataJson);
  const percentage = Math.min(100, (sizeBytes / (1024 * 1024)) * 100);
  return {
    isSafe: sizeBytes <= limitBytes,
    sizeBytes,
    percentage: Number(percentage.toFixed(1)),
    formattedSize: formatByteSize(sizeBytes),
  };
}
