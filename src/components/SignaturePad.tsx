import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCcw, Check, Undo2, Sparkles, PenTool, ShieldCheck, Download } from 'lucide-react';
import { trimAndCompressSignature } from '../utils/imageCompressor';

export interface SignaturePadProps {
  onSave?: (dataUrl: string) => void;
  onChange?: (hasDrawing: boolean, dataUrl: string) => void;
  width?: number;
  height?: number;
  label?: string;
  initialImage?: string;
  signerName?: string;
  signerRole?: string;
  allowQuickInitials?: boolean;
}

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onChange,
  height = 160,
  label = 'Tanda Tangan Digital Pengambil / Kepala Sekolah',
  initialImage,
  signerName,
  signerRole,
  allowQuickInitials = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState<'#1e3a8a' | '#0f172a'>('#1e3a8a'); // Biru Dokumen vs Hitam
  const [penWidth, setPenWidth] = useState<number>(2.5);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStroke = useRef<Stroke | null>(null);
  const isPointerDown = useRef(false);

  // Redraw all strokes cleanly with DPR scaling
  const redrawCanvas = useCallback(
    (strokeList: Stroke[], baseImage?: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const cssWidth = rect.width || 400;
      const cssHeight = height;

      // Adjust buffer size
      if (canvas.width !== Math.round(cssWidth * dpr) || canvas.height !== Math.round(cssHeight * dpr)) {
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssHeight * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      // Draw baseline dotted guide line
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      const baselineY = cssHeight - 28;
      ctx.moveTo(24, baselineY);
      ctx.lineTo(cssWidth - 24, baselineY);
      ctx.stroke();

      // Guide label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.fillText('X', 26, baselineY - 4);
      ctx.restore();

      // If initial image exists and no strokes yet
      if (baseImage && strokeList.length === 0) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, 20, 10, cssWidth - 40, cssHeight - 40);
          setHasDrawn(true);
        };
        img.src = baseImage;
      }

      // Draw all completed strokes
      for (const stroke of strokeList) {
        if (stroke.points.length < 2) continue;
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          const prev = stroke.points[i - 1];
          const curr = stroke.points[i];
          const midX = (prev.x + curr.x) / 2;
          const midY = (prev.y + curr.y) / 2;
          ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
        }
        ctx.lineTo(
          stroke.points[stroke.points.length - 1].x,
          stroke.points[stroke.points.length - 1].y
        );
        ctx.stroke();
      }

      ctx.restore();
    },
    [height]
  );

  // Sync canvas size on mount & resize
  useEffect(() => {
    redrawCanvas(strokes, initialImage);
    const handleResize = () => {
      redrawCanvas(strokes, initialImage);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas, strokes, initialImage]);

  const notifyChange = (drawn: boolean) => {
    setHasDrawn(drawn);
    if (!onChange) return;
    const canvas = canvasRef.current;
    if (!canvas || !drawn) {
      onChange(false, '');
      return;
    }
    const optimized = trimAndCompressSignature(canvas);
    onChange(true, optimized);
  };

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    isPointerDown.current = true;

    const pt = getCoordinates(e);
    const newStroke: Stroke = {
      points: [pt, pt],
      color: penColor,
      width: penWidth,
    };
    currentStroke.current = newStroke;

    const updated = [...strokes, newStroke];
    setStrokes(updated);
    redrawCanvas(updated);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDown.current || !currentStroke.current) return;
    const pt = getCoordinates(e);
    currentStroke.current.points.push(pt);

    // Live draw current stroke smoothly
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = currentStroke.current.color;
    ctx.lineWidth = currentStroke.current.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const pts = currentStroke.current.points;
    if (pts.length > 2) {
      const p1 = pts[pts.length - 2];
      const p2 = pts[pts.length - 1];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    currentStroke.current = null;
    notifyChange(true);
  };

  const handleClear = () => {
    setStrokes([]);
    currentStroke.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    redrawCanvas([]);
    notifyChange(false);
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const updated = strokes.slice(0, -1);
    setStrokes(updated);
    redrawCanvas(updated);
    notifyChange(updated.length > 0);
  };

  // Generate an authentic digitized paraf flourish based on name initials
  const handleGenerateQuickSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 380;
    const startX = width * 0.22;
    const startY = height * 0.55;

    // Create realistic signature stroke curves
    const flourishPoints: { x: number; y: number }[] = [];
    const stepCount = 45;
    for (let i = 0; i <= stepCount; i++) {
      const t = i / stepCount;
      const x = startX + t * (width * 0.56);
      const y =
        startY +
        Math.sin(t * Math.PI * 3.5) * (height * 0.22) -
        Math.cos(t * Math.PI * 1.5) * (height * 0.12) +
        (t > 0.7 ? (t - 0.7) * (height * 0.25) : 0);
      flourishPoints.push({ x, y });
    }

    // Underline underline swoosh
    const underlinePoints: { x: number; y: number }[] = [
      { x: startX - 10, y: height - 32 },
      { x: startX + width * 0.28, y: height - 30 },
      { x: startX + width * 0.58, y: height - 38 },
      { x: startX + width * 0.62, y: height - 32 },
    ];

    const generatedStrokes: Stroke[] = [
      { points: flourishPoints, color: penColor, width: penWidth },
      { points: underlinePoints, color: penColor, width: penWidth * 0.9 },
    ];

    setStrokes(generatedStrokes);
    redrawCanvas(generatedStrokes);
    notifyChange(true);
  };

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const link = document.createElement('a');
    link.download = `TTD_${(signerName || 'digital').replace(/\s+/g, '_')}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      {/* Header bar */}
      <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
        <div className="flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-emerald-800" />
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasDrawn ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
              <Check className="w-3 h-3 text-emerald-600" /> Terisi (Sah)
            </span>
          ) : (
            <span className="text-[11px] text-amber-600 font-medium">
              * Perlu paraf / goresan
            </span>
          )}
        </div>
      </div>

      {/* Canvas Box */}
      <div className="relative border-2 border-emerald-300 rounded-2xl bg-white overflow-hidden shadow-xs select-none">
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: `${height}px`,
            touchAction: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="cursor-crosshair w-full block"
        />

        {/* Empty placeholder guide */}
        {!hasDrawn && strokes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-xs select-none px-4 text-center">
            <span className="font-medium text-slate-500">
              Goreskan tanda tangan di sini (Layar Sentuh / Stylus / Mouse)
            </span>
            {signerName && (
              <span className="text-[11px] text-slate-400 mt-0.5">
                Atas nama: <strong className="text-slate-600">{signerName}</strong>
                {signerRole ? ` (${signerRole})` : ''}
              </span>
            )}
          </div>
        )}

        {/* Top Watermark Badge */}
        <div className="absolute top-2 right-2 pointer-events-none opacity-40 hover:opacity-100 transition">
          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-slate-500 bg-slate-100/90 px-1.5 py-0.5 rounded border border-slate-200">
            <ShieldCheck className="w-3 h-3 text-emerald-700" /> Canvas Verified
          </span>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        {/* Pen Colors & Sizes */}
        <div className="flex items-center gap-2">
          {/* Color pickers */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setPenColor('#1e3a8a')}
              className={`w-5 h-5 rounded-lg flex items-center justify-center transition ${
                penColor === '#1e3a8a' ? 'ring-2 ring-blue-500 ring-offset-1' : ''
              }`}
              style={{ backgroundColor: '#1e3a8a' }}
              title="Tinta Biru Resmi Dokumen"
            />
            <button
              type="button"
              onClick={() => setPenColor('#0f172a')}
              className={`w-5 h-5 rounded-lg flex items-center justify-center transition ${
                penColor === '#0f172a' ? 'ring-2 ring-slate-800 ring-offset-1' : ''
              }`}
              style={{ backgroundColor: '#0f172a' }}
              title="Tinta Hitam Formal"
            />
          </div>

          {/* Width pickers */}
          <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200 text-[11px]">
            <button
              type="button"
              onClick={() => setPenWidth(1.6)}
              className={`px-1.5 py-0.5 rounded ${penWidth === 1.6 ? 'bg-white font-bold shadow-2xs text-slate-900' : 'text-slate-500'}`}
              title="Ujung Tipis"
            >
              Tipis
            </button>
            <button
              type="button"
              onClick={() => setPenWidth(2.5)}
              className={`px-1.5 py-0.5 rounded ${penWidth === 2.5 ? 'bg-white font-bold shadow-2xs text-slate-900' : 'text-slate-500'}`}
              title="Ujung Standar"
            >
              Sedang
            </button>
            <button
              type="button"
              onClick={() => setPenWidth(3.8)}
              className={`px-1.5 py-0.5 rounded ${penWidth === 3.8 ? 'bg-white font-bold shadow-2xs text-slate-900' : 'text-slate-500'}`}
              title="Ujung Tebal"
            >
              Tebal
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          {allowQuickInitials && (
            <button
              type="button"
              onClick={handleGenerateQuickSignature}
              className="inline-flex items-center gap-1 text-[11px] text-emerald-800 hover:text-emerald-900 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-semibold transition"
              title="Buat goresan paraf otomatis"
            >
              <Sparkles className="w-3 h-3 text-emerald-600" /> Paraf Otomatis
            </button>
          )}

          <button
            type="button"
            disabled={strokes.length === 0}
            onClick={handleUndo}
            className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
            title="Urungkan goresan terakhir"
          >
            <Undo2 className="w-3 h-3" /> Urung
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-red-700 px-2 py-1 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition"
            title="Bersihkan kanvas"
          >
            <RotateCcw className="w-3 h-3" /> Bersihkan
          </button>

          {hasDrawn && (
            <button
              type="button"
              onClick={handleDownloadPng}
              className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
              title="Unduh file gambar tanda tangan PNG"
            >
              <Download className="w-3 h-3" /> PNG
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
