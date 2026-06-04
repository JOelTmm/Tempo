import { useCallback, useEffect, useRef, useState } from "react";
import { GameEndScreen } from "../components/GameEndScreen";
import { LyricLineDisplay } from "../components/LyricLineDisplay";
import { ThemePicker } from "../components/ThemePicker";
import {
  fillLyricRoundsFromSearch,
  getAllLyricRounds,
  getCutAtForRound,
  matchLyricsFromTracks,
  pickTrackForLyric,
  type LyricEntry,
} from "../lib/lyricsMatch";
import type { Difficulty, Track } from "../vite-env";

type GameMode = "paroles" | "coupure";
type Step = "listen" | "answer" | "feedback";

const ROUNDS_BUILTIN = 6;
const ROUNDS_THEME = 6;
const MIN_THEME_ROUNDS = 3;
const THEME_ROUNDS_TARGET = 6;

const TIME_BY_DIFF: Record<Difficulty, number> = {
  facile: 14,
  normal: 10,
  difficile: 7,
};

function normalize(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function answersMatch(guess: string, answer: string) {
  const g = normalize(guess);
  const a = normalize(answer);
  return g.length > 0 && (g === a || a.includes(g) || g.includes(a));
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function displayLine(round: LyricEntry, difficulty: Difficulty, step: Step, gameMode: GameMode): string | null {
  if (gameMode === "coupure" && step === "listen") return null;
  if (difficulty === "difficile" && gameMode === "coupure" && step === "answer") {
    return round.line;
  }
  return round.line;
}

export function SpeedLyrics() {
  const [phase, setPhase] = useState<"setup" | "play" | "end">("setup");
  const [gameMode, setGameMode] = useState<GameMode>("paroles");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [rounds, setRounds] = useState<LyricEntry[]>(getAllLyricRounds());
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState<Step>("answer");
  const [guess, setGuess] = useState("");
  const [timeLeft, setTimeLeft] = useState(TIME_BY_DIFF.normal);
  const [score, setScore] = useState(0);
  const [msg, setMsg] = useState("");
  const [revealBlank, setRevealBlank] = useState<string | undefined>();
  const [previewReady, setPreviewReady] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const cutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeCutHandlerRef = useRef<(() => void) | null>(null);
  const advancingRef = useRef(false);
  const stepRef = useRef<Step>(step);

  const round = rounds[idx];
  const timeSec = TIME_BY_DIFF[difficulty];
  const cutAtSec = round ? getCutAtForRound(round, difficulty) : 9;
  const isCoupure = gameMode === "coupure";

  stepRef.current = step;

  const clearTimers = useCallback(() => {
    if (cutTimerRef.current) {
      clearTimeout(cutTimerRef.current);
      cutTimerRef.current = null;
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    const el = audioRef.current;
    if (el && timeCutHandlerRef.current) {
      el.removeEventListener("timeupdate", timeCutHandlerRef.current);
      timeCutHandlerRef.current = null;
    }
  }, []);

  const beginPlay = useCallback(
    (list: LyricEntry[], infoMsg = "") => {
      clearTimers();
      advancingRef.current = false;
      setRounds(list);
      setIdx(0);
      setScore(0);
      setPhase("play");
      setMsg(infoMsg);
      setStep(isCoupure ? "listen" : "answer");
      setRevealBlank(undefined);
      setGuess("");
    },
    [clearTimers, isCoupure]
  );

  function startBuiltin() {
    beginPlay(shuffle(getAllLyricRounds()).slice(0, ROUNDS_BUILTIN));
  }

  async function fromThemeTracks(tracks: Track[]) {
    setMsg("Préparation des manches…");
    const playable = tracks.filter((t) => t.title?.trim());
    const fromPlaylist = matchLyricsFromTracks(playable);
    let matched = [...fromPlaylist];

    const searchTracks = async (query: string) => {
      const res = (await window.tempo.music.search(query, "track")) as { tracks: Track[] };
      return res.tracks || [];
    };

    if (matched.length < THEME_ROUNDS_TARGET) {
      matched = await fillLyricRoundsFromSearch(matched, THEME_ROUNDS_TARGET, searchTracks);
    }

    if (matched.length < MIN_THEME_ROUNDS) {
      setMsg(
        `Impossible de charger assez d'extraits audio (${matched.length}/${MIN_THEME_ROUNDS}). Essayez le pack intégré ou vérifiez votre connexion.`
      );
      return;
    }

    let info = "";
    if (fromPlaylist.length < matched.length) {
      info = `${fromPlaylist.length} titre(s) de votre thème + ${matched.length - fromPlaylist.length} du pack de paroles.`;
    } else if (fromPlaylist.length > 0) {
      info = `${fromPlaylist.length} titre(s) reconnus dans votre thème.`;
    }

    beginPlay(shuffle(matched).slice(0, ROUNDS_THEME), info);
  }

  async function fromPlaylist(source: string, id: string) {
    const list =
      source === "spotify"
        ? ((await window.tempo.music.playlistTracks("spotify", id)) as Track[])
        : ((await window.tempo.deezer.playlistTracks(id)) as Track[]);
    await fromThemeTracks(list);
  }

  async function fromArtist(id: string) {
    const list = (await window.tempo.music.artistTracks(id)) as Track[];
    await fromThemeTracks(list);
  }

  const goNextRound = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    clearTimers();
    audioRef.current?.pause();

    const nextIdx = idx + 1;
    if (nextIdx >= rounds.length) {
      setPhase("end");
      advancingRef.current = false;
      return;
    }

    setIdx(nextIdx);
    setMsg("");
    setRevealBlank(undefined);
    setGuess("");
    setPreviewReady(false);
    setStep(isCoupure ? "listen" : "answer");
    advancingRef.current = false;
  }, [clearTimers, idx, rounds.length, isCoupure]);

  const enterAnswerPhase = useCallback(() => {
    if (stepRef.current !== "listen") return;
    audioRef.current?.pause();
    setStep("answer");
    setTimeLeft(timeSec);
  }, [timeSec]);

  const showFeedback = useCallback(
    (ok: boolean, answer: string) => {
      if (advancingRef.current) return;
      advancingRef.current = true;
      clearTimers();
      setStep("feedback");
      setRevealBlank(answer);
      setMsg(ok ? "Parfait !" : `Raté — le mot des paroles était : ${answer}`);
      if (ok && isCoupure && audioRef.current) {
        audioRef.current.play().catch(() => undefined);
      }
      window.setTimeout(() => {
        advancingRef.current = false;
        goNextRound();
      }, 1500);
    },
    [clearTimers, goNextRound, isCoupure]
  );

  const onTimeExpired = useCallback(() => {
    if (!round || stepRef.current !== "answer") return;
    showFeedback(false, round.answer);
  }, [round, showFeedback]);

  const startTimer = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    setTimeLeft(timeSec);
    tickRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (tickRef.current) clearInterval(tickRef.current);
          tickRef.current = null;
          onTimeExpired();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [timeSec, onTimeExpired]);

  const resolvePreviewUrl = useCallback(async (r: LyricEntry): Promise<string | undefined> => {
    if (r.previewUrl) return r.previewUrl;
    const res = (await window.tempo.music.search(r.previewQuery, "track")) as { tracks: Track[] };
    return pickTrackForLyric(res.tracks || [], r)?.previewUrl;
  }, []);

  const scheduleCoupureCut = useCallback(
    (el: HTMLAudioElement, r: LyricEntry) => {
      const cutSec = getCutAtForRound(r, difficulty);

      const onTimeUpdate = () => {
        if (stepRef.current !== "listen") return;
        if (el.currentTime >= cutSec) {
          el.pause();
          el.removeEventListener("timeupdate", onTimeUpdate);
          timeCutHandlerRef.current = null;
          enterAnswerPhase();
        }
      };

      timeCutHandlerRef.current = onTimeUpdate;
      el.addEventListener("timeupdate", onTimeUpdate);

      cutTimerRef.current = setTimeout(() => {
        if (stepRef.current === "listen") {
          el.removeEventListener("timeupdate", onTimeUpdate);
          timeCutHandlerRef.current = null;
          el.pause();
          enterAnswerPhase();
        }
      }, (cutSec + 1.5) * 1000);
    },
    [difficulty, enterAnswerPhase]
  );

  const playRoundAudio = useCallback(
    async (r: LyricEntry) => {
      const url = await resolvePreviewUrl(r);
      const el = audioRef.current;
      if (!url || !el) {
        setPreviewReady(false);
        setMsg("Extrait introuvable — manche suivante…");
        if (isCoupure) {
          window.setTimeout(enterAnswerPhase, 800);
        } else {
          startTimer();
        }
        return;
      }

      setPreviewReady(true);
      clearTimers();
      el.src = url;
      el.currentTime = 0;
      el.play().catch(() => undefined);

      if (isCoupure && stepRef.current === "listen") {
        scheduleCoupureCut(el, r);
      }
    },
    [resolvePreviewUrl, clearTimers, isCoupure, scheduleCoupureCut, enterAnswerPhase, startTimer]
  );

  useEffect(() => {
    if (phase !== "play" || !round || step === "feedback") return;

    setRevealBlank(undefined);
    setGuess("");

    if (step === "listen") {
      setPreviewReady(false);
      void playRoundAudio(round);
      return clearTimers;
    }

    if (step === "answer") {
      startTimer();
      if (!isCoupure) void playRoundAudio(round);
      return clearTimers;
    }

    return clearTimers;
  }, [phase, idx, step, isCoupure, playRoundAudio, startTimer, clearTimers, round?.previewQuery, difficulty]);

  function submit() {
    if (!round || step !== "answer" || advancingRef.current) return;
    const g = guess.trim();
    if (!g) {
      setMsg("Entrez le mot manquant dans les paroles");
      return;
    }
    clearTimers();
    const ok = answersMatch(g, round.answer);
    if (ok) setScore((s) => s + 80 + timeLeft * 10);
    showFeedback(ok, round.answer);
  }

  if (phase === "end") return <GameEndScreen score={score} title="Speed Lyrics — Terminé" />;

  const lineToShow = round ? displayLine(round, difficulty, step, gameMode) : null;

  if (phase === "setup") {
    return (
      <div className="space-y-6">
        <h2 className="font-display text-2xl font-bold text-tempo-violet">Speed Lyrics</h2>

        <p className="text-xs uppercase text-slate-500">Mode de jeu</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-lg px-4 py-2 text-left ${gameMode === "paroles" ? "btn-violet" : "border border-tempo-border"}`}
            onClick={() => setGameMode("paroles")}
          >
            <span className="block font-semibold">Paroles à trou</span>
            <span className="block text-xs opacity-80">Ligne visible tout de suite + écoute continue</span>
          </button>
          <button
            type="button"
            className={`rounded-lg px-4 py-2 text-left ${gameMode === "coupure" ? "btn-orange" : "border border-tempo-border"}`}
            onClick={() => setGameMode("coupure")}
          >
            <span className="block font-semibold">Coupure audio</span>
            <span className="block text-xs opacity-80">Écoute → pause → complétez le mot des paroles</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["facile", "normal", "difficile"] as Difficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              className={`rounded-lg px-3 py-1 capitalize ${difficulty === d ? "btn-neon" : "border border-tempo-border text-slate-500"}`}
              onClick={() => setDifficulty(d)}
            >
              {d}
              {isCoupure ? (
                <span className="ml-1 text-xs opacity-70">(coupure calibrée / chanson)</span>
              ) : (
                <span className="ml-1 text-xs opacity-70">({TIME_BY_DIFF[d]}s)</span>
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={gameMode === "coupure" ? "btn-orange w-full" : "btn-neon w-full"}
          onClick={startBuiltin}
        >
          Pack intégré — paroles ({ROUNDS_BUILTIN} manches)
        </button>

        <p className="text-xs uppercase text-slate-500">Thème playlist / artiste (paroles reconnues dans le pack)</p>
        <ThemePicker onSelectPlaylist={fromPlaylist} onSelectArtist={fromArtist} />

        <p className="text-sm text-slate-500">
          Les deux modes demandent le <strong>mot manquant dans la ligne de paroles</strong>, jamais le titre du morceau.
        </p>

        {msg && <p className="text-center text-amber-400">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <audio ref={audioRef} className="hidden" />
      <h2 className="font-display text-2xl font-bold text-tempo-violet">Speed Lyrics</h2>

      <p className="text-center text-xs text-slate-500">
        {isCoupure ? "Coupure audio" : "Paroles"} — {difficulty} — {idx + 1}/{rounds.length}
      </p>

      {isCoupure && step === "listen" && (
        <p className="text-center text-lg text-tempo-orange animate-pulse">
          {previewReady
            ? `🔊 Écoute… coupure vers ${cutAtSec.toFixed(1)}s (${round?.songTitle || ""})`
            : "Chargement de l'extrait…"}
        </p>
      )}

      {isCoupure && step === "answer" && (
        <p className="text-center text-sm text-tempo-orange">⏸ Pause — quel mot manque dans la phrase ?</p>
      )}

      {step === "answer" && (
        <div className="progress-neon">
          <span style={{ width: `${(timeLeft / timeSec) * 100}%` }} />
        </div>
      )}

      {lineToShow ? (
        <LyricLineDisplay line={lineToShow} revealAnswer={revealBlank} />
      ) : (
        step === "listen" && <p className="text-center text-3xl font-display text-slate-600">🎧</p>
      )}

      {step === "answer" && difficulty !== "difficile" && round && (
        <p className="text-center text-xs text-slate-500">
          Chanson : {difficulty === "facile" ? `${round.artist} — ${round.songTitle}` : round.songTitle}
        </p>
      )}

      {step === "answer" && (
        <>
          <p className="text-center text-sm text-slate-400">Complétez le mot à la place de ? dans les paroles</p>
          <p className="text-center text-tempo-orange">{timeLeft}s</p>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-tempo-border bg-tempo-panel px-4 py-3 text-center text-lg"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Mot des paroles…"
              disabled={step !== "answer"}
              autoFocus
            />
            <button type="button" className="btn-violet" onClick={submit} disabled={step !== "answer"}>
              OK
            </button>
          </div>
        </>
      )}

      {msg && <p className="text-center font-semibold text-tempo-blue">{msg}</p>}

      <button type="button" className="text-sm text-slate-500 underline" onClick={() => setPhase("setup")}>
        Changer mode / thème
      </button>
    </div>
  );
}