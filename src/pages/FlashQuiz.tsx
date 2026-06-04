import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import samples from "../data/samples.json";
import { GameEndScreen } from "../components/GameEndScreen";
import { ThemePicker } from "../components/ThemePicker";
import { MultiplayerLobby } from "../components/MultiplayerLobby";
import { pickUniqueTracks } from "../lib/pickUniqueTracks";
import { clearPlayedTracks, pushPlayedTrack } from "../lib/gameSession";
import { consumePendingOnlineGame } from "../lib/multiplayer-session";
import type { Track } from "../vite-env";

const ROUND_TIME = 30;

type SampleRound = {
  hint: string;
  choices: string[];
  answer: number;
  previewQuery: string;
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function FlashQuiz() {
  const [searchParams] = useSearchParams();
  const [onlineRoom, setOnlineRoom] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [sampleRounds, setSampleRounds] = useState<SampleRound[] | null>(null);
  const [sampleIdx, setSampleIdx] = useState(0);
  const [phase, setPhase] = useState<"setup" | "play" | "end">("setup");
  const [current, setCurrent] = useState<Track | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [score, setScore] = useState(0);
  const [roundIdx, setRoundIdx] = useState(0);
  const [feedback, setFeedback] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isSampleMode = sampleRounds !== null;
  const sampleRound = sampleRounds?.[sampleIdx];

  useEffect(() => {
    if (searchParams.get("online") === "1") {
      const pending = consumePendingOnlineGame("flashquiz");
      if (pending) {
        setOnlineRoom(pending.room.code);
        pending.client.onRoomUpdate(() => undefined);
      }
    }
  }, [searchParams]);

  function beginPlaylist(pool: Track[]) {
    const playable = pickUniqueTracks(pool.filter((t) => t.previewUrl), 12);
    if (playable.length < 4) {
      setFeedback("Pas assez d'extraits audio — autre thème");
      return;
    }
    setSampleRounds(null);
    setTracks(playable);
    clearPlayedTracks();
    setPhase("play");
    setScore(0);
    setRoundIdx(0);
    startRound(playable, 0);
  }

  async function loadTracks(source: string, id: string) {
    const list =
      source === "spotify"
        ? ((await window.tempo.music.playlistTracks("spotify", id)) as Track[])
        : ((await window.tempo.deezer.playlistTracks(id)) as Track[]);
    beginPlaylist(list);
  }

  async function loadArtist(id: string) {
    const list = (await window.tempo.music.artistTracks(id)) as Track[];
    beginPlaylist(list);
  }

  function startSamples() {
    setSampleRounds(samples as SampleRound[]);
    setSampleIdx(0);
    setTracks([]);
    clearPlayedTracks();
    setPhase("play");
    setScore(0);
    setFeedback("");
    playSamplePreview(0);
  }

  function playSamplePreview(idx: number) {
    const r = (samples as SampleRound[])[idx];
    if (!r) return;
    window.tempo.music.search(r.previewQuery, "track").then((res) => {
      const t = (res as { tracks: Track[] }).tracks?.[0];
      if (t?.previewUrl && audioRef.current) {
        audioRef.current.src = t.previewUrl;
        audioRef.current.play().catch(() => undefined);
        pushPlayedTrack(t);
      }
    });
    setTimeLeft(ROUND_TIME);
  }

  function startRound(pool: Track[], idx: number) {
    if (idx >= pool.length || idx >= 10) {
      setPhase("end");
      return;
    }
    setRoundIdx(idx);
    const track = pool[idx];
    setCurrent(track);
    pushPlayedTrack(track);
    const wrong = shuffle(pool.filter((t) => t.id !== track.id))
      .slice(0, 3)
      .map((t) => `${t.title} — ${t.artist}`);
    setChoices(shuffle([`${track.title} — ${track.artist}`, ...wrong]));
    setTimeLeft(ROUND_TIME);
    setFeedback("");
    if (audioRef.current && track.previewUrl) {
      audioRef.current.pause();
      audioRef.current.src = track.previewUrl;
      audioRef.current.play().catch(() => undefined);
    }
  }

  function advanceRound() {
    if (isSampleMode) {
      const next = sampleIdx + 1;
      if (next >= (sampleRounds?.length || 0)) {
        setPhase("end");
        return;
      }
      setSampleIdx(next);
      setFeedback("");
      playSamplePreview(next);
      return;
    }
    startRound(tracks, roundIdx + 1);
  }

  useEffect(() => {
    if (phase !== "play") return;
    if (!isSampleMode && !current) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          setFeedback("Temps écoulé — 0 point");
          setTimeout(advanceRound, 1000);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, current, roundIdx, sampleIdx, isSampleMode]);

  function answer(choice: string, choiceIndex?: number) {
    if (isSampleMode && sampleRound) {
      const ok = choiceIndex === sampleRound.answer;
      setScore((s) => s + (ok ? 120 : 0));
      setFeedback(ok ? "Bravo !" : `Raté — ${sampleRound.choices[sampleRound.answer]}`);
      audioRef.current?.pause();
      setTimeout(advanceRound, 1200);
      return;
    }
    if (!current) return;
    const correct = `${current.title} — ${current.artist}`;
    const ok = choice === correct;
    setScore((s) => s + (ok ? 100 : 0));
    setFeedback(ok ? "Bravo !" : `Raté — ${correct}`);
    audioRef.current?.pause();
    setTimeout(advanceRound, 1200);
  }

  if (phase === "end") {
    return <GameEndScreen score={score} title="Quiz Musical terminé" />;
  }

  return (
    <div className="space-y-6">
      <audio ref={audioRef} className="hidden" />
      <h2 className="font-display text-2xl font-bold text-tempo-blue">Quiz Musical</h2>
      <p className="text-sm text-slate-400">Blind test + samples — même arène</p>
      {onlineRoom ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          Salon en ligne actif : <strong>{onlineRoom}</strong> — jouez à tour de rôle sur le même écran ou synchronisez vos scores.
        </p>
      ) : (
        <p className="text-sm text-slate-400">
          Multijoueur : <Link to="/online" className="text-tempo-blue underline">Arène en ligne</Link>
        </p>
      )}

      {phase === "setup" && (
        <>
          <ThemePicker
            onSelectPlaylist={loadTracks}
            onSelectArtist={loadArtist}
            onChartTracks={beginPlaylist}
            placeholder="Playlist, artiste ou genre…"
          />
          <button type="button" className="btn-orange w-full" onClick={startSamples}>
            Ou : mode samples classiques (hip-hop / pop)
          </button>
          {feedback && <p className="text-amber-400">{feedback}</p>}
        </>
      )}

      {phase === "play" && isSampleMode && sampleRound && (
        <div className="animate-slide-up space-y-4">
          <div className="progress-neon">
            <span style={{ width: `${(timeLeft / ROUND_TIME) * 100}%` }} />
          </div>
          <p className="text-center text-tempo-orange">
            Sample {sampleIdx + 1}/{(sampleRounds?.length || 0)} — {timeLeft}s — Score {score}
          </p>
          <p className="text-slate-400">{sampleRound.hint}</p>
          {feedback && <p className="text-center font-bold text-tempo-violet">{feedback}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {sampleRound.choices.map((c, i) => (
              <button
                key={c}
                type="button"
                className="arena-card text-left hover:border-tempo-orange"
                onClick={() => answer(c, i)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "play" && !isSampleMode && current && (
        <div className="animate-slide-up space-y-4">
          <div className="progress-neon">
            <span style={{ width: `${(timeLeft / ROUND_TIME) * 100}%` }} />
          </div>
          <p className="text-center text-tempo-orange">
            Manche {roundIdx + 1} — {timeLeft}s — Score {score}
          </p>
          {feedback && <p className="text-center font-bold text-tempo-violet">{feedback}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {choices.map((c) => (
              <button
                key={c}
                type="button"
                className="rounded-xl border border-tempo-border bg-tempo-panel px-4 py-4 text-left transition hover:border-tempo-blue"
                onClick={() => answer(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}