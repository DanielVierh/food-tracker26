import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// BarcodeScanner — camera overlay using @zxing/browser.
// Fires onDetected once with the first successfully decoded barcode.
// ---------------------------------------------------------------------------
export default function BarcodeScanner({
  onDetected,
  onClose,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectedRef = useRef(false);
  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        (result, err, controls) => {
          controlsRef.current = controls;
          if (result && !detectedRef.current) {
            detectedRef.current = true;
            onDetected(result.getText());
          }
          // Ignore continuous "not found" errors — they fire on every frame without a barcode
          void err;
        },
      )
      .catch(() => {
        // Camera access denied or not available — close scanner gracefully
        onClose();
      });

    return () => {
      controlsRef.current?.stop();
    };
  }, [onDetected, onClose]);

  return (
    <div className="scanner-overlay" onClick={onClose}>
      <div className="scanner-container" onClick={(e) => e.stopPropagation()}>
        <button
          className="scanner-close"
          onClick={onClose}
          aria-label="Scanner schließen"
        >
          ✕
        </button>
        <video
          ref={videoRef}
          className="scanner-video"
          autoPlay
          muted
          playsInline
        />
        <p className="scanner-hint">Barcode in die Kamera halten</p>
      </div>
    </div>
  );
}
