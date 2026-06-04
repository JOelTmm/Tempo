import { useEffect, useRef, useState } from "react";
import { GameEndScreen } from "../components/GameEndScreen";
import { ThemePicker } from "../components/ThemePicker";
import { PixelatedCover } from "../components/PixelatedCover";
import { pickUniqueTracks } from "../lib/pickUniqueTracks";
import { clearPlayedTracks, pushPlayedTrack } from "../lib/gameSession";
import type { Track } from "../vite-env";

const ROUND_SEC = 15;
const ROUNDS = 5;

export function PixelCover() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [phase, setPhase] = useState<"setup" | "play" | "end">("setup");
  const [idx, setIdx] = useState(0);
  const [reveal, setReveal] = useState(0);
  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [msg, setMsg] = useState("");
  const [timeLeft, setTimeLeft] = useState(ROUND_SEC);
  const advancingRef = useRef(false);

  const current = tracks[idx];

  async function startWithTracks(list: Track[]) {
    const playable = list.filter((t) => t.coverUrl && t.coverUrl.length > 10);
    const unique = pickUniqueTracks(playable, Math.max(ROUNDS + 2, 8));
    if (unique.length < 3) {
      setMsg("Pas assez de pochettes différentes — choisissez une autre playlist");
      return;
    }
    setTracks(unique.slice(0, ROUNDS));
    clearPlayedTracks();
    if (unique[0]) pushPlayedTrack(unique[0]);
    setPhase("play");
    setIdx(0);
    setRound(0);
    setScore(0);
    setTimeLeft(ROUND_SEC);
    setReveal(0);
    setMsg("");
    advancingRef.current = false;
  }

  async function fromPlaylist(source: string, id: string) {
    const list =
      source === "spotify"
        ? ((await window.tempo.music.playlistTracks("spotify", id)) as Track[])
        : ((await window.tempo.deezer.playlistTracks(id)) as Track[]);
    await startWithTracks(list);
  }

  async function fromArtist(id: string) {
    const list = (await window.tempo.music.artistTracks(id)) as Track[];
    await startWithTracks(list);
  }

  useEffect(() => {
    if (phase !== "play" || !current) return;
    advancingRef.current = false;
    setReveal(0);
    setTimeLeft(ROUND_SEC);
    setGuess("");
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const t = Math.min(1, elapsed / ROUND_SEC);
      setTimeLeft(Math.max(0, ROUND_SEC - elapsed));
      setReveal(t);
      if (elapsed >= ROUND_SEC) {
        clearInterval(tick);
        onTimeUp();
      }
    }, 80);
    return () => clearInterval(tick);
  }, [phase, idx]);

  function onTimeUp() {
    if (advancingRef.current || !current) return;
    advancingRef.current = true;
    setMsg(`Temps écoulé — 0 point. Réponse : ${current.title}`);
    setTimeout(() => advance(0), 1100);
  }

  function normalize(s: string) {
    return s
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
  }

  function titlesMatch(guess: string, title: string) {
    const g = normalize(guess);
    const t = normalize(title);
    if (g.length < 2 || t.length < 2) return false;
    if (g === t) return true;
    if (g.length >= 3 && t.includes(g)) return true;
    if (t.length >= 3 && g.includes(t)) return true;
    return false;
  }

  function advance(points: number) {
    if (points > 0) setScore((s) => s + points);
    const next = round + 1;
    setRound(next);
    setGuess("");
    setMsg("");
    advancingRef.current = false;
    if (next >= ROUNDS || next >= tracks.length) {
      setPhase("end");
      return;
    }
    setIdx(next);
    pushPlayedTrack(tracks[next]);
  }

  function validate() {
    if (!current || advancingRef.current) return;
    const g = guess.trim();
    if (!g) {
      setMsg("Entrez un titre — 0 point si vide");
      return;
    }
    advancingRef.current = true;
    const ok = titlesMatch(g, current.title);
    const points = ok ? 150 + Math.floor(timeLeft * 5) : 0;
    setMsg(ok ? `Bonne réponse ! +${points}` : `Raté — 0 point. C'était : ${current.title}`);
    setTimeout(() => advance(points), 900);
  }

  if (phase === "end") return <GameEndScreen score={score} title="PixelCover terminé" />;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-tempo-violet">PixelCover</h2>

      {phase === "setup" && (
        <>
          <p className="text-sm text-tempo-orange">
            Pochette en pixels — 15 s par manche. 0 point si erreur, vide ou temps écoulé. Deezer ou Spotify.
          </p>
          <ThemePicker
            onSelectPlaylist={fromPlaylist}
            onSelectArtist={fromArtist}
            onChartTracks={(list) => startWithTracks(list)}
          />
          {msg && <p className="text-amber-400">{msg}</p>}
        </>
      )}

      {phase === "play" && current?.coverUrl && (
        <>
          <p className="text-center text-sm">
            Manche {round + 1}/{ROUNDS} — <span className="text-tempo-orange">{Math.ceil(timeLeft)}s</span> — Score{" "}
            {score}
          </p>
          <div className="relative mx-auto aspect-square max-w-md overflow-hidden rounded-2xl border-2 border-tempo-violet bg-tempo-dark shadow-neon-violet">
            <PixelatedCover src={current.coverUrl} reveal={reveal} />
          </div>
          <p className="text-center text-xs text-slate-500">
            Indice : {current.artist}
            {reveal > 0.55 ? ` — ${current.title.slice(0, Math.min(4, current.title.length))}…` : ""}
          </p>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-tempo-border bg-tempo-panel px-4 py-3"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && validate()}
              placeholder="Titre du morceau…"
              autoFocus
            />
            <button type="button" className="btn-violet" onClick={validate}>
              Valider
            </button>
          </div>
          {msg && <p className="text-center font-semibold text-tempo-blue">{msg}</p>}
        </>
      )}
    </div>
  );
}