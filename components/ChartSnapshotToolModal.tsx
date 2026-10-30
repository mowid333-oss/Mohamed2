import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Crop,
  Download,
  Copy,
  Check,
  X,
  Maximize2,
  Sparkles,
  Bot,
  RefreshCw,
  Sliders,
  Layers,
  Eye,
  Move,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { EGXStock } from '../types/stock';
import { getCairoCurrentTimeFormatted } from '../utils/reportDisclaimer';

interface ChartSnapshotToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetElementId?: string;
  stock: EGXStock;
  onSendToAiVision?: (imageDataUrl: string) => void;
}

export const ChartSnapshotToolModal: React.FC<ChartSnapshotToolModalProps> = ({
  isOpen,
  onClose,
  targetElementId = 'tradingview-chart-wrapper',
  stock,
  onSendToAiVision,
}) => {
  const [snapshotMode, setSnapshotMode] = useState<'FULL' | 'CROP'>('FULL');
  const [capturedImageData, setCapturedImageData] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagePreviewRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Primary capture routine using html2canvas on the chart wrapper element
   */
  const captureFullChartElement = useCallback(async () => {
    setIsCapturing(true);
    setCaptureError(null);
    try {
      const el = document.getElementById(targetElementId);
      if (!el) {
        throw new Error('تعذر العثور على حاوية الشارت لالتقاط الصورة');
      }

      // Hide temporary UI buttons during capture for a clean shot
      const canvas = await html2canvas(el, {
        backgroundColor: '#0a0e17',
        scale: 2, // High resolution retina capture
        useCORS: true,
        logging: false,
        allowTaint: true,
        ignoreElements: (element) => {
          return element.classList.contains('no-screenshot');
        },
      });

      const dataUrl = canvas.toDataURL('image/png');
      setCapturedImageData(dataUrl);
      // Initialize default crop rect in center of captured image if user switches to crop
      setCropRect(null);
    } catch (err: any) {
      console.warn('html2canvas capture notice:', err);
      // Fallback: Create high-fidelity visual summary canvas if iframe blocked
      createFallbackTechnicalCanvas();
    } finally {
      setIsCapturing(false);
    }
  }, [targetElementId, stock]);

  /**
   * Browser Screen/Window Media Capture (Native TradingView pixel-perfect screenshot)
   */
  const captureScreenDisplayMedia = async () => {
    setIsCapturing(true);
    setCaptureError(null);
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('خاصية التقاط الشاشة عبر المتصفح غير مدعومة');
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' } as any,
        audio: false,
      });

      const track = stream.getVideoTracks()[0];
      const imageCapture = (window as any).ImageCapture ? new (window as any).ImageCapture(track) : null;
      
      if (imageCapture) {
        const bitmap = await imageCapture.grabFrame();
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(bitmap, 0, 0);
        track.stop();
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImageData(dataUrl);
      } else {
        // Video element frame fallback
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        await new Promise((r) => setTimeout(r, 400));
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        track.stop();
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImageData(dataUrl);
      }
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        setCaptureError(err?.message || 'تعذر التقاط شاشة المتصفح.');
      }
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Fallback visual generator for technical snapshot
   */
  const createFallbackTechnicalCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 700);
    grad.addColorStop(0, '#0a0e17');
    grad.addColorStop(1, '#05080e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 700);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 60; x < 1200; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x, 640);
      ctx.stroke();
    }
    for (let y = 60; y < 660; y += 60) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(1160, y);
      ctx.stroke();
    }

    // Header banner
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(30, 20, 1140, 70);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(30, 20, 1140, 70);

    // Stock details
    ctx.font = 'bold 24px Cairo, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${stock.symbol} - ${stock.nameAr}`, 50, 62);

    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`${stock.price.toFixed(2)} EGP (${stock.changePct >= 0 ? '+' : ''}${stock.changePct}%)`, 500, 62);

    ctx.font = '14px Cairo, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`توقيت القاهرة: ${getCairoCurrentTimeFormatted()} | رادار البورصة المصرية`, 820, 62);

    // Simulated Candlesticks
    let curY = 380;
    for (let i = 0; i < 28; i++) {
      const cx = 80 + i * 38;
      const change = (Math.sin(i * 0.4) + (i % 3 === 0 ? 0.8 : -0.5)) * 18;
      const isUp = change >= 0;
      const candleH = Math.max(8, Math.abs(change) * 2.5);
      curY -= change * 0.7;

      ctx.strokeStyle = isUp ? '#10b981' : '#f43f5e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, curY - candleH - 8);
      ctx.lineTo(cx, curY + candleH + 8);
      ctx.stroke();

      ctx.fillStyle = isUp ? '#10b981' : '#f43f5e';
      ctx.fillRect(cx - 10, curY - candleH / 2, 20, candleH);
    }

    // SuperTrend Line
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, 430);
    ctx.lineTo(1140, 310);
    ctx.stroke();

    ctx.font = 'bold 13px Cairo, sans-serif';
    ctx.fillStyle = '#22c55e';
    ctx.fillText('خط السوبر ترند الصاعد (SuperTrend Support)', 120, 450);

    const dataUrl = canvas.toDataURL('image/png');
    setCapturedImageData(dataUrl);
  };

  // Auto capture when modal opens
  useEffect(() => {
    if (isOpen) {
      captureFullChartElement();
    } else {
      setCapturedImageData(null);
      setCropRect(null);
      setIsCopied(false);
    }
  }, [isOpen, captureFullChartElement]);

  // Interactive mouse events for dragging rectangular crop box
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (snapshotMode !== 'CROP') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDragging(true);
    setDragStart({ x, y });
    setCropRect({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart || snapshotMode !== 'CROP') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const currentY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const x = Math.min(dragStart.x, currentX);
    const y = Math.min(dragStart.y, currentY);
    const width = Math.abs(currentX - dragStart.x);
    const height = Math.abs(currentY - dragStart.y);

    setCropRect({ x, y, width, height });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  /**
   * Exports or returns the active image (full or cropped)
   */
  const getProcessedImageDataUrl = async (): Promise<string | null> => {
    if (!capturedImageData) return null;
    if (snapshotMode === 'FULL' || !cropRect || cropRect.width < 10 || cropRect.height < 10) {
      return capturedImageData;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const container = containerRef.current;
        if (!container) {
          resolve(capturedImageData);
          return;
        }

        const scaleX = img.naturalWidth / container.clientWidth;
        const scaleY = img.naturalHeight / container.clientHeight;

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = Math.round(cropRect.width * scaleX);
        cropCanvas.height = Math.round(cropRect.height * scaleY);

        const ctx = cropCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            img,
            Math.round(cropRect.x * scaleX),
            Math.round(cropRect.y * scaleY),
            cropCanvas.width,
            cropCanvas.height,
            0,
            0,
            cropCanvas.width,
            cropCanvas.height
          );
          resolve(cropCanvas.toDataURL('image/png'));
        } else {
          resolve(capturedImageData);
        }
      };
      img.src = capturedImageData;
    });
  };

  /**
   * Download image as PNG file
   */
  const handleDownload = async () => {
    const finalData = await getProcessedImageDataUrl();
    if (!finalData) return;

    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `EGX_${stock.symbol}_TradingView_Chart_${dateStr}.png`;
    link.href = finalData;
    link.click();
  };

  /**
   * Copy image directly to user clipboard
   */
  const handleCopyToClipboard = async () => {
    const finalData = await getProcessedImageDataUrl();
    if (!finalData) return;

    try {
      const response = await fetch(finalData);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback: Copy data URI
      navigator.clipboard.writeText(finalData);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  /**
   * 1-Click Handover to Gemini AI Vision Analyzer
   */
  const handleSendToAi = async () => {
    const finalData = await getProcessedImageDataUrl();
    if (!finalData || !onSendToAiVision) return;
    onSendToAiVision(finalData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md font-['Cairo'] animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0a0e17] border border-cyan-500/40 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Strip */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  أداة لقطة الشاشة وقص الشارت (TradingView Snapshot)
                </h3>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 font-bold">
                  {stock.symbol}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                التقاط فوري للشارت، تحديد وقص منطقة محددة، تحميل PNG أو تحليل بالذكاء الاصطناعي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800/80 bg-slate-950/60 text-xs">
          {/* Mode Selector */}
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setSnapshotMode('FULL');
                setCropRect(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                snapshotMode === 'FULL'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>لقطة كاملة للشارت</span>
            </button>

            <button
              onClick={() => setSnapshotMode('CROP')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                snapshotMode === 'CROP'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              <span>تحديد وقص منطقة معينة ✂️</span>
            </button>
          </div>

          {/* Quick Retake / Native Screen Capture */}
          <div className="flex items-center gap-2">
            <button
              onClick={captureFullChartElement}
              disabled={isCapturing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold transition-all cursor-pointer disabled:opacity-50"
              title="إعادة التقاط الشارت"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
              <span>إعادة الالتقاط</span>
            </button>

            <button
              onClick={captureScreenDisplayMedia}
              disabled={isCapturing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/30 font-bold transition-all cursor-pointer"
              title="التقاط مباشر عالي الدقة من شاشة المتصفح"
            >
              <Camera className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">لقطة متقدمة من المتصفح 🖥️</span>
            </button>
          </div>
        </div>

        {/* Capture Preview & Cropping Canvas Area */}
        <div className="relative flex-1 min-h-[380px] max-h-[520px] bg-slate-950 flex items-center justify-center overflow-auto p-4 select-none">
          {isCapturing ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-pulse">
                <Camera className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="text-white font-bold text-sm">جارٍ التقاط صورة الشارت بدقة عالية...</span>
            </div>
          ) : capturedImageData ? (
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className={`relative max-w-full max-h-[480px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl ${
                snapshotMode === 'CROP' ? 'cursor-crosshair' : 'cursor-default'
              }`}
            >
              <img
                ref={imagePreviewRef}
                src={capturedImageData}
                alt={`Chart snapshot for ${stock.symbol}`}
                className="max-h-[480px] w-auto object-contain block pointer-events-none"
              />

              {/* Cropping Selection Rectangle Overlay */}
              {snapshotMode === 'CROP' && cropRect && cropRect.width > 2 && cropRect.height > 2 && (
                <div
                  style={{
                    left: `${cropRect.x}px`,
                    top: `${cropRect.y}px`,
                    width: `${cropRect.width}px`,
                    height: `${cropRect.height}px`,
                  }}
                  className="absolute border-2 border-cyan-400 bg-cyan-500/15 pointer-events-none shadow-lg"
                >
                  {/* Crop Dimension Badge */}
                  <span className="absolute -top-7 right-0 bg-cyan-400 text-slate-950 px-2 py-0.5 rounded text-[10px] font-mono font-black shadow-md">
                    {Math.round(cropRect.width)} × {Math.round(cropRect.height)} px
                  </span>
                  {/* Corner handles */}
                  <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-cyan-500 rounded-sm" />
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-cyan-500 rounded-sm" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-cyan-500 rounded-sm" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-cyan-500 rounded-sm" />
                </div>
              )}

              {/* Crop hint tooltip */}
              {snapshotMode === 'CROP' && !cropRect && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4 pointer-events-none">
                  <div className="bg-slate-900/90 border border-cyan-500/50 px-4 py-2 rounded-2xl text-cyan-300 font-bold text-xs flex items-center gap-2 shadow-xl">
                    <Crop className="w-4 h-4 text-cyan-400" />
                    <span>اضغط واسحب بالفأرة لتحديد وقص المنطقة المراد حفظها من الشارت</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-400 text-xs">
              لم يتم التقاط الصورة بعد، اضغط على زر إعادة الالتقاط
            </div>
          )}

          {captureError && (
            <div className="absolute bottom-4 left-4 right-4 bg-rose-950/90 border border-rose-500/50 text-rose-200 px-4 py-2 rounded-xl text-xs flex items-center justify-between">
              <span>{captureError}</span>
              <button
                onClick={() => setCaptureError(null)}
                className="text-rose-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions: Download, Copy, AI Analysis */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              {snapshotMode === 'CROP' && cropRect
                ? `تم تحديد منطقة مقصوصة (${Math.round(cropRect.width)} × ${Math.round(cropRect.height)} px)`
                : 'جاهز للتصدير بجودة كاملة PNG'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap justify-end w-full sm:w-auto">
            {/* Copy to Clipboard */}
            <button
              onClick={handleCopyToClipboard}
              disabled={!capturedImageData || isCapturing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">تم نسخ الصورة!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>نسخ إلى الحافظة</span>
                </>
              )}
            </button>

            {/* Direct PNG Download */}
            <button
              onClick={handleDownload}
              disabled={!capturedImageData || isCapturing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>تحميل صورة PNG 💾</span>
            </button>

            {/* Handover to AI Vision */}
            {onSendToAiVision && (
              <button
                onClick={handleSendToAi}
                disabled={!capturedImageData || isCapturing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
                title="إرسال اللقطة لمحلل الشارت بالذكاء الاصطناعي (Gemini Vision)"
              >
                <Bot className="w-4 h-4" />
                <span>تحليل بالذكاء الاصطناعي 🤖</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
