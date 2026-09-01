import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw, AlertCircle, Sparkles, SwitchCamera, VideoOff, Check } from 'lucide-react';

interface QrScannerComponentProps {
  onScan: (decodedText: string) => void;
  isPaused: boolean;
}

export const QrScannerComponent: React.FC<QrScannerComponentProps> = ({ onScan, isPaused }) => {
  const [scannerStarted, setScannerStarted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [lastScannedText, setLastScannedText] = useState<string | null>(null);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-reader-video-container';
  const isProcessingRef = useRef(false);

  // Initialize and get available cameras
  const initCameras = useCallback(async () => {
    try {
      setCameraError(null);
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        // Prefer back camera if found
        const backCamera = devices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
        );
        setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
      } else {
        // Fallback to facingMode
        setSelectedCameraId('');
      }
    } catch (err: unknown) {
      console.warn('Camera detection error:', err);
      // We will still try starting with facingMode
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      html5QrCodeRef.current = null;
      setScannerStarted(false);
    }
  }, []);

  const startScanner = useCallback(async () => {
    await stopScanner();
    setCameraError(null);

    const element = document.getElementById(containerId);
    if (!element) return;

    try {
      const qrCodeScanner = new Html5Qrcode(containerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      html5QrCodeRef.current = qrCodeScanner;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      const cameraConfig = selectedCameraId
        ? { deviceId: { exact: selectedCameraId } }
        : { facingMode };

      await qrCodeScanner.start(
        cameraConfig,
        config,
        (decodedText) => {
          if (isPaused || isProcessingRef.current) return;
          
          isProcessingRef.current = true;
          setLastScannedText(decodedText);
          onScan(decodedText);

          // Cooldown to prevent multi-triggering
          setTimeout(() => {
            isProcessingRef.current = false;
          }, 1800);
        },
        () => {
          // Frame scan failure is normal when no QR code in view
        }
      );

      setScannerStarted(true);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Camera start failure:', error);
      setCameraError(
        error?.message ||
          'Camera access failed. Please ensure camera permissions are granted or switch cameras.'
      );
      setScannerStarted(false);
    }
  }, [selectedCameraId, facingMode, isPaused, onScan, stopScanner]);

  useEffect(() => {
    initCameras();
  }, [initCameras]);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, [selectedCameraId, facingMode, startScanner, stopScanner]);

  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    setSelectedCameraId('');
  };

  return (
    <div id="camera-scanner-wrapper" className="relative w-full rounded-2xl overflow-hidden bg-[#020617] border border-slate-800 shadow-2xl">
      {/* Video Stream Container */}
      <div className="relative aspect-square max-h-[380px] sm:max-h-[420px] w-full flex items-center justify-center bg-black overflow-hidden">
        <div id={containerId} className="w-full h-full object-cover" />

        {/* Viewfinder Target Graphic */}
        {scannerStarted && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
            <div className="relative w-60 h-60 sm:w-64 sm:h-64 border-2 border-sky-500/30 rounded-2xl shadow-[0_0_20px_rgba(56,189,248,0.1)]">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-sky-400 rounded-tl-lg shadow-[0_0_10px_#38bdf8]" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-sky-400 rounded-tr-lg shadow-[0_0_10px_#38bdf8]" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-sky-400 rounded-bl-lg shadow-[0_0_10px_#38bdf8]" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-sky-400 rounded-br-lg shadow-[0_0_10px_#38bdf8]" />

              {/* Animated Laser Line */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-pulse top-1/2 -translate-y-1/2" />

              {/* Center target indicator */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-sky-400/90 ring-4 ring-sky-400/20" />
              </div>
            </div>

            {/* Instruction Overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#0F172A]/90 backdrop-blur-md border border-slate-700/80 text-[11px] font-medium text-slate-200 flex items-center gap-1.5 shadow-lg">
              <Camera className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>Align Attendee QR Code in frame</span>
            </div>
          </div>
        )}

        {/* Camera Error State */}
        {cameraError && (
          <div className="absolute inset-0 bg-[#0B0F19] flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-3">
              <VideoOff className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-100 mb-1">Camera Inactive</h4>
            <p className="text-xs text-slate-400 max-w-xs mb-4">{cameraError}</p>
            <div className="flex gap-2">
              <button
                id="retry-camera-btn"
                onClick={startScanner}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg shadow-sky-950/50 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Camera
              </button>
              <button
                id="flip-camera-btn"
                onClick={handleToggleFacingMode}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <SwitchCamera className="w-3.5 h-3.5" />
                Switch Camera
              </button>
            </div>
          </div>
        )}

        {/* Initializing / Loading Spinner */}
        {!scannerStarted && !cameraError && (
          <div className="absolute inset-0 bg-[#0B0F19] flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-medium text-slate-400">Initializing Optical Camera...</p>
          </div>
        )}
      </div>

      {/* Camera Controls Bar */}
      <div className="p-3 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${scannerStarted ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${scannerStarted ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {scannerStarted ? 'Live Scanner Ready' : 'Connecting...'}
            </span>
          </div>

          {lastScannedText && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 truncate max-w-[150px]">
              <Check className="w-3 h-3" /> {lastScannedText}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {cameras.length > 1 && (
            <select
              id="camera-select"
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="bg-[#020617] border border-slate-700 text-[11px] text-slate-300 rounded-lg px-2 py-1 max-w-[120px] sm:max-w-[160px] truncate focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label || `Camera ${c.id.substring(0, 5)}`}
                </option>
              ))}
            </select>
          )}

          <button
            id="switch-camera-mode-btn"
            onClick={handleToggleFacingMode}
            title="Switch front/back camera"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <SwitchCamera className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
