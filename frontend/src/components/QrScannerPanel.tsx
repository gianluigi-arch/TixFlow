'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Keyboard, Loader2, ScanLine } from 'lucide-react';

interface QrScannerPanelProps {
  onValidateCode: (ticketCode: string) => Promise<void>;
  isValidating: boolean;
}

const READER_ELEMENT_ID = 'tixflow-qr-reader';

export function QrScannerPanel({
  onValidateCode,
  isValidating,
}: QrScannerPanelProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  const scannerRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
  } | null>(null);
  const busyScanRef = useRef(false);
  const lastScannedRef = useRef<{ code: string; at: number } | null>(null);

  const stopCamera = useCallback(async () => {
    const instance = scannerRef.current;
    scannerRef.current = null;
    setCameraActive(false);

    if (!instance) {
      return;
    }

    try {
      await instance.stop();
    } catch {
      // Ignore stop error if stream already ended
    }

    try {
      instance.clear();
    } catch {
      // Ignore clear error
    }
  }, []);

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, [stopCamera]);

  const startCamera = async () => {
    setCameraError(null);
    setCameraStarting(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(READER_ELEMENT_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
        },
        async (decodedText) => {
          const code = decodedText.trim();
          if (!code || busyScanRef.current) {
            return;
          }

          const now = Date.now();
          if (
            lastScannedRef.current &&
            lastScannedRef.current.code === code &&
            now - lastScannedRef.current.at < 2500
          ) {
            return;
          }

          busyScanRef.current = true;
          lastScannedRef.current = { code, at: now };
          setManualCode(code);

          try {
            await onValidateCode(code);
          } finally {
            window.setTimeout(() => {
              busyScanRef.current = false;
            }, 1200);
          }
        },
        () => {
          // Ignore per-frame decode misses while scanning
        },
      );

      setCameraActive(true);
    } catch (err) {
      await stopCamera();
      const message =
        err instanceof Error
          ? err.message
          : 'Kamera tidak dapat diakses. Pastikan izin kamera diberikan atau gunakan input manual.';
      setCameraError(
        `Gagal mengaktifkan kamera: ${message}. Anda tetap dapat memvalidasi tiket lewat input UUID manual di bawah.`,
      );
    } finally {
      setCameraStarting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualCode.trim();
    if (!trimmed || isValidating) {
      return;
    }
    await onValidateCode(trimmed);
  };

  return (
    <div className="space-y-6">
      {/* Camera Scanner Card */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ScanLine className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Pemindai Kamera QR</h2>
              <p className="mt-0.5 text-sm text-slate-600">
                Arahkan kamera ke QR Code peserta untuk check-in otomatis.
              </p>
            </div>
          </div>

          {!cameraActive ? (
            <button
              type="button"
              onClick={startCamera}
              disabled={cameraStarting}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              {cameraStarting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Menghubungkan Kamera...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  Mulai Kamera
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void stopCamera()}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
            >
              <CameraOff className="h-4 w-4" aria-hidden="true" />
              Hentikan Kamera
            </button>
          )}
        </div>

        {cameraError && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900"
          >
            {cameraError}
          </div>
        )}

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
          <div id={READER_ELEMENT_ID} className="min-h-[260px] w-full" />
          {!cameraActive && !cameraStarting && (
            <div className="flex flex-col items-center justify-center px-4 py-8 text-center text-slate-300">
              <Camera className="mb-2 h-8 w-8 text-slate-400" aria-hidden="true" />
              <p className="text-sm font-medium">Kamera belum aktif</p>
              <p className="mt-1 text-xs text-slate-400">
                Tekan tombol &ldquo;Mulai Kamera&rdquo; di atas atau masukkan kode UUID secara manual.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Manual UUID Check-in Card */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Keyboard className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Input Manual Kode Tiket (UUID)
            </h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Alternatif cepat jika kamera tidak tersedia atau QR sulit terbaca.
            </p>
          </div>
        </div>

        <form onSubmit={handleManualSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="manual-ticket-code" className="sr-only">
              Kode Tiket (UUID)
            </label>
            <input
              id="manual-ticket-code"
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Contoh: 66666666-6666-4666-8666-666666666666"
              required
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-mono text-sm text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
          <button
            type="submit"
            disabled={isValidating || !manualCode.trim()}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Memvalidasi...
              </>
            ) : (
              'Validasi Tiket'
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
