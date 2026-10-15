import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RotateCcw, Check, FlipHorizontal, AlertCircle } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

interface WebcamCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
  title?: string;
}

export const WebcamCaptureModal: React.FC<WebcamCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Ambil Foto Bukti Serah Terima',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto('');
      setErrorMsg('');
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Error opening camera:', err);
      setErrorMsg('Gagal mengakses kamera perangkat. Pastikan izin kamera telah diberikan.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleTakePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    // Compress and downscale automatically
    compressImage(rawDataUrl, 800, 0.72).then((compressed) => {
      setCapturedPhoto(compressed);
    }).catch(() => {
      setCapturedPhoto(rawDataUrl);
    });
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedPhoto('');
    startCamera();
  };

  const handleConfirm = () => {
    if (!capturedPhoto) return;
    onCapture(capturedPhoto);
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="bg-emerald-950 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-sm">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera / Preview Viewport */}
        <div className="p-4 bg-slate-900 flex flex-col items-center justify-center relative min-h-[300px]">
          {errorMsg ? (
            <div className="text-center p-6 text-xs text-red-300 flex flex-col items-center">
              <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
              <span>{errorMsg}</span>
            </div>
          ) : capturedPhoto ? (
            <img
              src={capturedPhoto}
              alt="Hasil Tangkapan"
              className="max-h-80 w-auto rounded-xl object-contain shadow-lg"
            />
          ) : (
            <div className="relative w-full max-h-80 overflow-hidden rounded-xl bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-auto object-cover max-h-80"
              />
              <button
                type="button"
                onClick={toggleFacingMode}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                title="Putar Kamera Depan/Belakang"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          {capturedPhoto ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Ambil Ulang
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
              >
                <Check className="w-4 h-4" /> Gunakan Foto Ini
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!!errorMsg}
                onClick={handleTakePhoto}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md disabled:opacity-50"
              >
                <Camera className="w-4 h-4" /> Jepret Foto Sekarang
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
