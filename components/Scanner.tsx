"use client";

import { useEffect, useRef, useState } from "react";
import { cleanIsbn } from "@/lib/isbn";
import { TorchIcon } from "./Icons";

type Detector = { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> };

/**
 * Camera barcode scanner. Uses the browser's BarcodeDetector (Chrome on Android)
 * and falls back to ZXing (Safari on iPhone). Calls onIsbn once per valid book barcode.
 */
export function Scanner({ active, onIsbn }: { active: boolean; onIsbn: (isbn: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const onIsbnRef = useRef(onIsbn);
  onIsbnRef.current = onIsbn;
  const [error, setError] = useState<string | null>(null);
  const [torch, setTorch] = useState<boolean | null>(null);

  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let zxingStop: (() => void) | undefined;

    const found = (raw: string) => {
      const isbn = cleanIsbn(raw);
      if (!isbn || stopped) return false;
      stopped = true;
      navigator.vibrate?.(60);
      onIsbnRef.current(isbn);
      return true;
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (stopped) return;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        trackRef.current = stream.getVideoTracks()[0] ?? null;
        const caps = trackRef.current?.getCapabilities?.() as { torch?: boolean } | undefined;
        setTorch(caps?.torch ? false : null);

        const Native = (window as unknown as { BarcodeDetector?: { new (o: object): Detector; getSupportedFormats?: () => Promise<string[]> } }).BarcodeDetector;
        const formats = Native?.getSupportedFormats ? await Native.getSupportedFormats() : [];
        if (Native && formats.includes("ean_13")) {
          const detector = new Native({ formats: ["ean_13"] });
          const tick = async () => {
            if (stopped) return;
            try {
              const codes = await detector.detect(video);
              for (const c of codes) if (found(c.rawValue)) return;
            } catch {}
            timer = setTimeout(tick, 200);
          };
          tick();
        } else {
          const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
            import("@zxing/browser"),
            import("@zxing/library"),
          ]);
          const hints = new Map();
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]);
          const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 150 });
          const controls = await reader.decodeFromVideoElement(video, (result) => {
            if (result) found(result.getText());
          });
          zxingStop = () => controls.stop();
          if (stopped) zxingStop();
        }
      } catch (e) {
        const name = (e as Error)?.name;
        setError(
          name === "NotAllowedError"
            ? "Camera access is blocked. Allow the camera for this site in your browser settings, or type the ISBN instead."
            : "The camera couldn't start. Type the ISBN instead."
        );
      }
    })();

    return () => {
      stopped = true;
      clearTimeout(timer);
      zxingStop?.();
      stream?.getTracks().forEach((t) => t.stop());
      trackRef.current = null;
    };
  }, [active]);

  const toggleTorch = async () => {
    const next = !torch;
    try {
      await trackRef.current?.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorch(next);
    } catch {
      setTorch(null);
    }
  };

  return (
    <div className="scanner">
      <video ref={videoRef} playsInline muted className="scanner-video" />
      <div className="viewfinder" aria-hidden="true"><span /><span /><span /><span /></div>
      {error ? <p className="scanner-hint scanner-error">{error}</p> : <p className="scanner-hint">Line up the barcode on the back cover</p>}
      {torch !== null && (
        <button type="button" className="icon-btn round torch" aria-label={torch ? "Turn off torch" : "Turn on torch"} aria-pressed={torch} onClick={toggleTorch}>
          <TorchIcon />
        </button>
      )}
    </div>
  );
}
