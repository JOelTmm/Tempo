import { useEffect, useRef, useState } from "react";
import builtinSamples from "../data/samples.json";
import { GameEndScreen } from "../components/GameEndScreen";
import { MusicSearch } from "../components/MusicSearch";
import { pickUniqueTracks } from "../lib/pickUniqueTracks";
import { clearPlayedTracks, pushPlayedTrack } from "../lib/gameSession";
import type { Track } from "../vite-env";

const PREVIEW_SEC = 10;

type SampleRound = {
  id: string;
  hint: string;
  choices: string[];
  answer: number;
  previewQuery: string;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tracksToRounds(tracks: Track[]): SampleRound[] {
  const pool = pickUniqueTracks(tracks.filter((t) => t.previewUrl || t.title), 8);
  return pool.slice(0, 6).map((target, i) => {
    const label = (t: Track) => `${t.title} — ${t.artist}`;
    const others = shuffle(pool.filter((t) => t.id !== target.id)).slice(0, 3);
    const choices = shuffle([label(target), ...others.map(label)]).slice(0, 4);
    const answer = choices.findIndex((c) => c === label(target));
    return {
      id: `t-${i}-${target.id}`,
      hint: `Extrait du morceau — devinez le titre (${target.artist})`,
      choices,
      answer: answer >= 0 ? answer : 0,
      previewQuery: `${target.title} ${target.artist}`,
    };
  });
}

export function SampleHunter() {
  const [phase, setPhase] = useState<"setup" | "play" | "end">("setup");
  const [rounds, setRounds] = useState<SampleRound[]>(builtinSamples as SampleRound[]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const round = rounds[idx];

  useEffect(() => {
    clearPlayedTracks();
  }, []);

  useEffect(() => {
    if (phase !== "play" || !round) return;
    window.tempo.music.search(round.previewQuery, "track").then((res) => {
      const tracks = (res as { tracks: Track[] }).tracks;
      const t = tracks[0];
      if (t?.previewUrl && audioRef.current) {
        audioRef.current.src = t.previewUrl;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => undefined);
        pushPlayedTrack(t);
      }
    });
    const t = setTimeout(() => audioRef.current?.pause(), PREVIEW_SEC * 1000);
    return () => clearTimeout(t);
  }, [round, idx, phase]);

  function startBuiltin() {
    setRounds(builtinSamples as SampleRound[]);
    setIdx(0);
    setScore(0);
    setPhase("play");
    setFeedback("");
  }

  async function fromPlaylist(source: string, id: string) {
    const list =
      source === "spotify"
        ? ((await window.tempo.music.playlistTracks("spotify", id)) as Track[])
        : ((await window.tempo.deezer.playlistTracks(id)) as Track[]);
    const built = tracksToRounds(list);
    if (built.length < 2) {
      setFeedback("Pas assez de morceaux — autre playlist ou artiste");
      return;
    }
    setRounds(built);
    setIdx(0);
    setScore(0);
    setPhase("play");
    setFeedback("");
  }

  async function fromArtist(id: string) {
    const list = (await window.tempo.music.artistTracks(id)) as Track[];
    const built = tracksToRounds(list);
    if (built.length < 2) {
      setFeedback("Pas assez de morceaux pour cet artiste");
      return;
    }
    setRounds(built);
    setIdx(0);
    setScore(0);
    setPhase("play");
    setFeedback("");
  }

  async function fromChart() {
    const list = (await window.tempo.deezer.chartTracks()) as Track[];
    const built = tracksToRounds(list);
    if (!built.length) {
      setFeedback("Chart Deezer indisponible");
      return;
    }
    setRounds(built);
    setIdx(0);
    setScore(0);
    setPhase("play");
    setFeedback("");
  }

  function answer(i: number) {
    if (!round) return;
    if (i === round.answer) {
      setScore((s) => s + 120);
      setFeedback("Bravo ! Sample identifié");
    } else {
      setFeedback(`Raté — 0 point. Bonne réponse : ${round.choices[round.answer]}`);
    }
    if (idx + 1 >= rounds.length) {
      setTimeout(() => setPhase("end"), 1400);
      return;
    }
    setTimeout(() => {
      setIdx((x) => x + 1);
      setFeedback("");
    }, 1500);
  }

  if (phase === "end") return <GameEndScreen score={score} title="Sample Hunter — Terminé" />;

  if (phase === "setup") {
    return (
      <div className="space-y-6 animate-slide-up">
        <h2 className="font-display text-2xl font-bold text-tempo-orange">Sample Hunter</h2>
        <p className="text-slate-400">Trouvez le morceau original — choisissez votre thème</p>

        <button type="button" className="btn-neon w-full" onClick={startBuiltin}>
          Samples classiques (hip-hop / pop)
        </button>
        <button type="button" className="btn-orange w-full" onClick={fromChart}>
          Top France Deezer (sans compte)
        </button>

        <p className="text-xs uppercase text-slate-500">Ou recherchez playlist / artiste</p>
        <MusicSearch onSelectPlaylist={fromPlaylist} onSelectArtist={fromArtist} />
        {feedback && <p className="text-center text-amber-400">{feedback}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <audio ref={audioRef} className="hidden" />
      <h2 className="font-display text-2xl font-bold text-tempo-orange">Sample Hunter</h2>
      <p className="text-sm text-slate-500">
        Manche {idx + 1}/{rounds.length} — Score {score}
      </p>
      <p className="text-slate-400">{round?.hint}</p>
      <p className="text-sm text-tempo-blue">Extrait {PREVIEW_SEC}s — trouvez le morceau original</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {round?.choices.map((c, i) => (
          <button
            key={`${round.id}-${c}`}
            type="button"
            className="arena-card text-left hover:border-tempo-orange"
            onClick={() => answer(i)}
          >
            {c}
          </button>
        ))}
      </div>
      {feedback && <p className="text-center font-bold text-tempo-violet">{feedback}</p>}
      <button type="button" className="text-sm text-slate-500 underline" onClick={() => setPhase("setup")}>
        Changer de thème
      </button>
    </div>
  );
}