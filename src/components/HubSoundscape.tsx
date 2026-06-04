import { useEffect, useRef } from "react";
import type { Track } from "../vite-env";

/** Ambiance hub + aperçu court au survol des arènes. */
export function HubSoundscape({ previewQuery }: { previewQuery?: string }) {
  const ambientRef = useRef<HTMLAudioElement>(null);
  const stingRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = (await window.tempo.deezer.chartTracks()) as Track[];
        const t = res.find((x) => x.previewUrl);
        if (!t?.previewUrl || cancelled || !ambientRef.current) return;
        ambientRef.current.src = t.previewUrl;
        ambientRef.current.volume = 0.12;
        ambientRef.current.loop = true;
        await ambientRef.current.play().catch(() => undefined);
      } catch {
        /* pas de son si API indisponible */
      }
    })();
    return () => {
      cancelled = true;
      ambientRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (!previewQuery || !stingRef.current) return;
    let cancelled = false;
    (async () => {
      const res = (await window.tempo.music.search(previewQuery, "track")) as { tracks: Track[] };
      const t = res.tracks?.[0];
      if (!t?.previewUrl || cancelled) return;
      stingRef.current!.src = t.previewUrl;
      stingRef.current!.volume = 0.35;
      stingRef.current!.currentTime = 0;
      await stingRef.current!.play().catch(() => undefined);
      setTimeout(() => stingRef.current?.pause(), 2200);
    })();
    return () => {
      cancelled = true;
    };
  }, [previewQuery]);

  return (
    <>
      <audio ref={ambientRef} className="hidden" />
      <audio ref={stingRef} className="hidden" />
    </>
  );
}