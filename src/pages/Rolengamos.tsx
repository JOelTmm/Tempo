import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bot, Loader2, Play, Send, Users } from "lucide-react";
import { GameEndScreen } from "../components/GameEndScreen";
import { MultiplayerLobby } from "../components/MultiplayerLobby";
import type { GameRoomClient, RoomState } from "../lib/multiplayer";
import { addXp } from "../lib/profile";
import { consumePendingOnlineGame } from "../lib/multiplayer-session";
import type { Difficulty } from "../vite-env";

type GameMode = "ai" | "local" | "online";
type Turn = "p1" | "p2" | "ai";

const TIME_BY_DIFF: Record<Difficulty, number> = {
  facile: 50,
  normal: 35,
  difficile: 25,
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export function Rolengamos() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<GameMode>("ai");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [current, setCurrent] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [used, setUsed] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [ended, setEnded] = useState(false);
  const [defeat, setDefeat] = useState<{
    artist: string;
    otherArtist: string;
    feats: string[];
    reason: string;
    collabTitle?: string;
  } | null>(null);
  const [turn, setTurn] = useState<Turn>("p1");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_BY_DIFF.normal);
  const mpRef = useRef<GameRoomClient | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const turnSec = TIME_BY_DIFF[difficulty];
  const isPlayerTurn = mode !== "ai" || turn === "p1";
  const useChoices = mode === "ai" && difficulty === "facile";

  const startGame = useCallback(async () => {
    const artist = await window.tempo.rolengamos.startArtist();
    setCurrent(artist);
    setHistory([artist]);
    setUsed([normalize(artist)]);
    setLog([`🎤 Départ : ${artist}`]);
    setStarted(true);
    setEnded(false);
    setDefeat(null);
    setScore(0);
    setTurn("p1");
    setTimeLeft(turnSec);
    setInput("");
    setChoices([]);
  }, [turnSec]);

  useEffect(() => {
    if (searchParams.get("online") === "1") {
      const pending = consumePendingOnlineGame("rolengamos");
      if (pending) {
        mpRef.current = pending.client;
        pending.client.onRoomUpdate((r) => {
          if (r.payload.current) setCurrent(r.payload.current as string);
          if (r.payload.log) setLog((l) => [...l, r.payload.log as string]);
        });
        setMode("online");
        setStarted(true);
        const start = (pending.room.payload.start as string) || pending.room.players[0]?.name || "";
        if (start) setCurrent(start);
        setLog([`🌐 Salon ${pending.room.code} — ${pending.room.players.length} joueur(s)`]);
        return;
      }
    }
    if (!started && mode !== "online") startGame();
  }, [mode, started, startGame, searchParams]);

  useEffect(() => {
    if (!useChoices || !current || defeat || ended) {
      setChoices([]);
      return;
    }
    window.tempo.rolengamos.choices(current, used).then((res) => {
      const data = res as { choices: string[] };
      setChoices(data.choices || []);
    });
  }, [useChoices, current, used, defeat, ended]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!started || defeat || ended || !isPlayerTurn || loading) return;

    setTimeLeft(turnSec);
    timerRef.current = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          void fail("Temps écoulé");
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, defeat, ended, isPlayerTurn, loading, current, turn, turnSec]);

  async function playCollabSound(artistA: string, artistB: string) {
    const collab = await window.tempo.rolengamos.collabPreview(artistA, artistB);
    if (collab?.previewUrl && audioRef.current) {
      audioRef.current.src = collab.previewUrl;
      audioRef.current.play().catch(() => undefined);
      return collab;
    }
    const res = (await window.tempo.music.search(`${artistA} ${artistB}`, "track")) as { tracks: Track[] };
    const t = res.tracks?.find((x) => x.previewUrl);
    if (t?.previewUrl && audioRef.current) {
      audioRef.current.src = t.previewUrl;
      audioRef.current.play().catch(() => undefined);
      return { previewUrl: t.previewUrl, title: t.title, artist: t.artist };
    }
    return null;
  }

  async function fail(reason: string, attemptedGuess?: string) {
    if (timerRef.current) clearInterval(timerRef.current);
    const feats = await window.tempo.rolengamos.collaborators(current);
    const otherArtist =
      attemptedGuess?.trim() ||
      feats.find((f) => !used.includes(normalize(f))) ||
      feats[0] ||
      history[history.length - 2] ||
      "";
    setLog((l) => [...l, `❌ ${reason}`]);
    setDefeat({ artist: current, otherArtist, feats, reason });
    setLoading(false);
  }

  useEffect(() => {
    if (!defeat?.otherArtist) return;
    playCollabSound(defeat.artist, defeat.otherArtist).then((c) => {
      if (c?.title) {
        setDefeat((d) => (d ? { ...d, collabTitle: `${c.title} — ${c.artist}` } : d));
      }
    });
  }, [defeat?.artist, defeat?.otherArtist]);

  const applyMove = async (from: string, to: string, playerLabel: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrent(to);
    setHistory((h) => [...h, to]);
    setUsed((u) => [...u, normalize(to)]);
    setLog((l) => [...l, `✓ ${playerLabel} : ${from} → ${to}`]);
    setScore((s) => s + 50);
    setTimeLeft(turnSec);
    mpRef.current?.sync({ current: to, history: [...history, to], log: `${playerLabel}: ${to}` });
  };

  const runAiTurn = async (from: string) => {
    setTurn("ai");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const reply = await window.tempo.rolengamos.aiPick(from, difficulty, used);
    setLoading(false);
    if (!reply || used.includes(normalize(reply))) {
      setLog((l) => [...l, "🤖 L'IA ne trouve plus de lien — vous gagnez !"]);
      setEnded(true);
      addXp(score + 100);
      return;
    }
    await applyMove(from, reply, "IA");
    setTurn("p1");
  };

  async function submitGuess(guess: string) {
    if (ended || loading || defeat || !guess.trim()) return;
    if (!isPlayerTurn) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(true);

    if (used.includes(normalize(guess))) {
      setLoading(false);
      await fail(`"${guess}" déjà utilisé`, guess);
      return;
    }

    const result = await window.tempo.rolengamos.validate(current, guess);
    setLoading(false);

    if (!result.valid) {
      await fail(result.reason || "Pas de featuring valide", guess);
      return;
    }

    const label = mode === "local" ? (turn === "p1" ? "Joueur 1" : "Joueur 2") : "Vous";
    const nextName = result.canonicalTo || guess;
    await applyMove(current, nextName, label);

    if (mode === "ai") {
      await runAiTurn(nextName);
      return;
    }

    if (mode === "local") {
      setTurn(turn === "p1" ? "p2" : "p1");
    }
  }

  async function submit() {
    await submitGuess(input);
    setInput("");
  }

  function onRoomReady(client: GameRoomClient, room: RoomState) {
    mpRef.current = client;
    client.onRoomUpdate((r) => {
      if (r.payload.current) setCurrent(r.payload.current as string);
      if (r.payload.log) setLog((l) => [...l, r.payload.log as string]);
    });
    setStarted(true);
    const start = (room.payload.start as string) || current;
    setCurrent(start);
    setLog([`🌐 Salon ${room.code} — ${room.players.length} joueur(s)`]);
  }

  function closeDefeat() {
    setDefeat(null);
    setEnded(true);
    addXp(score);
  }

  if (defeat) {
    return (
      <div className="space-y-6 animate-slide-up">
        <audio ref={audioRef} className="hidden" />
        <h2 className="font-display text-2xl font-bold text-rose-400">Partie terminée</h2>
        <p className="text-slate-300">{defeat.reason}</p>
        <div className="arena-card border-tempo-blue/40">
          <p className="mb-1 text-sm text-slate-400">Morceau en featuring</p>
          <p className="font-semibold text-tempo-blue">
            {defeat.artist} × {defeat.otherArtist}
          </p>
          {defeat.collabTitle && <p className="mt-1 text-xs text-slate-500">▶ {defeat.collabTitle}</p>}
          <button
            type="button"
            className="btn-neon mt-3 flex items-center gap-2"
            onClick={() => playCollabSound(defeat.artist, defeat.otherArtist)}
          >
            <Play size={16} /> Réécouter le featuring
          </button>
        </div>
        <div className="arena-card">
          <p className="mb-2 font-semibold text-tempo-orange">
            Autres featurings possibles depuis <span className="text-white">{defeat.artist}</span> :
          </p>
          <ul className="flex flex-wrap gap-2">
            {defeat.feats.length > 0 ? (
              defeat.feats.map((f) => (
                <li key={f}>
                  <button
                    type="button"
                    className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/20"
                    onClick={() => playCollabSound(defeat.artist, f)}
                  >
                    <Play size={12} className="mr-1 inline" />
                    {f}
                  </button>
                </li>
              ))
            ) : (
              <li className="text-slate-500">Aucun lien listé — essayez un autre nom de la base</li>
            )}
          </ul>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-orange"
            onClick={() => startGame().then(() => setDefeat(null))}
          >
            Rejouer
          </button>
          <button type="button" className="rounded-lg border border-tempo-border px-4 py-2" onClick={closeDefeat}>
            Voir le score
          </button>
        </div>
      </div>
    );
  }

  if (ended) return <GameEndScreen score={score} title="Rolengamos — Fin de partie" />;

  if (!started && mode === "online") {
    return (
      <div className="space-y-6">
        <h2 className="font-display text-2xl font-bold text-tempo-orange">Rolengamos — En ligne</h2>
        <MultiplayerLobby game="rolengamos" onRoomReady={onRoomReady} />
        <button type="button" className="btn-neon" onClick={startGame}>
          Démarrer la partie
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <audio ref={audioRef} className="hidden" />
      <h2 className="font-display text-2xl font-bold text-tempo-orange">Arène 2 — Rolengamos</h2>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["ai", "Contre l'IA", Bot],
            ["local", "Chacun son tour", Users],
            ["online", "En ligne", Users],
          ] as const
        ).map(([m, label, Icon]) => (
          <button
            key={m}
            type="button"
            className={`flex items-center gap-2 rounded-lg px-4 py-2 ${mode === m ? "btn-orange" : "border border-tempo-border text-slate-400"}`}
            onClick={() => {
              setMode(m);
              setStarted(false);
            }}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {mode === "online" && <MultiplayerLobby game="rolengamos" onRoomReady={onRoomReady} />}

      {mode === "ai" && (
        <div className="flex gap-2">
          {(["facile", "normal", "difficile"] as Difficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              className={`rounded-lg px-3 py-1 capitalize ${difficulty === d ? "btn-violet" : "border border-tempo-border text-slate-500"}`}
              onClick={() => {
                setDifficulty(d);
                setStarted(false);
              }}
            >
              {d} ({TIME_BY_DIFF[d]}s)
            </button>
          ))}
        </div>
      )}

      <div className="arena-card text-center">
        <p className="text-sm text-slate-400">Artiste actuel</p>
        <p className="font-display text-3xl font-bold text-tempo-violet">{current}</p>
        <button
          type="button"
          className="mt-2 text-xs text-tempo-blue underline"
          onClick={() => {
            const prev = history.length >= 2 ? history[history.length - 2] : undefined;
            if (prev) playCollabSound(current, prev);
          }}
        >
          ▶ Aperçu sonore
        </button>
        <p className="mt-2 text-sm">
          Tour : <strong>{mode === "ai" ? (turn === "p1" ? "Vous" : "IA") : turn === "p1" ? "Joueur 1" : "Joueur 2"}</strong>
          {isPlayerTurn && !loading && (
            <>
              {" "}
              — <span className="text-tempo-orange">{timeLeft}s</span>
            </>
          )}{" "}
          — Score {score}
        </p>
        {useChoices && (
          <p className="mt-1 text-xs text-slate-500">Mode facile : choisissez un featuring parmi 4 propositions</p>
        )}
      </div>

      {useChoices && choices.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {choices.map((c) => (
            <button
              key={c}
              type="button"
              className="arena-card text-left hover:border-tempo-violet"
              disabled={loading || !isPlayerTurn}
              onClick={() => submitGuess(c)}
            >
              {c}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-tempo-border bg-tempo-panel px-4 py-3"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Artiste en featuring avec l'actuel…"
            disabled={loading || !isPlayerTurn}
          />
          <button type="button" className="btn-violet" onClick={submit} disabled={loading || !isPlayerTurn}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </div>
      )}

      <ul className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-tempo-border bg-tempo-dark/60 p-4 text-sm">
        {log.map((line, i) => (
          <li key={i} className="text-slate-300">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}