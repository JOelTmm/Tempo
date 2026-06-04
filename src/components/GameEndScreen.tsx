import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Plus, Trophy } from "lucide-react";
import { getPlayedTracks } from "../lib/gameSession";
import type { Track } from "../vite-env";

export function GameEndScreen({ score, title }: { score: number; title: string }) {
  const tracks = getPlayedTracks();
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [auth, setAuth] = useState({ spotify: false, deezer: false });

  useEffect(() => {
    window.tempo?.oauth.status().then(setAuth);
  }, []);

  async function magicClick(track: Track, provider: "spotify" | "deezer") {
    try {
      const res = await window.tempo.favorites.add(provider, track);
      setMessages((m) => ({ ...m, [`${track.id}-${provider}`]: res.message }));
    } catch (e) {
      setMessages((m) => ({
        ...m,
        [`${track.id}-${provider}`]: e instanceof Error ? e.message : "Erreur",
      }));
    }
  }

  return (
    <div className="animate-slide-up space-y-6">
      <div className="rounded-2xl border border-tempo-violet/50 bg-gradient-to-br from-tempo-panel to-tempo-dark p-8 text-center shadow-neon-violet">
        <Trophy className="mx-auto mb-3 text-tempo-orange" size={48} />
        <h2 className="font-display text-3xl font-bold text-gradient-tempo">{title}</h2>
        <p className="mt-2 text-2xl font-bold text-tempo-blue">{score} pts</p>
        <p className="mt-1 text-sm text-slate-400">Le Clic Magique — ajoutez vos coups de cœur</p>
      </div>

      <ul className="space-y-3">
        {tracks.length === 0 && (
          <li className="text-center text-slate-500">Aucun morceau enregistré cette session.</li>
        )}
        {tracks.map((t) => (
          <li
            key={t.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-tempo-border bg-tempo-panel/80 p-4 transition hover:border-tempo-blue/50"
          >
            {t.coverUrl && (
              <img src={t.coverUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{t.title}</p>
              <p className="truncate text-sm text-slate-400">{t.artist}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-neon flex items-center gap-1 text-sm"
                onClick={() => magicClick(t, "deezer")}
                title="Coups de cœur Deezer"
              >
                <Plus size={14} /> Deezer
              </button>
              <button
                type="button"
                className="btn-orange flex items-center gap-1 text-sm"
                onClick={() => magicClick(t, "spotify")}
                title="Bibliothèque Spotify"
              >
                <Plus size={14} /> Spotify
              </button>
            </div>
            {Object.entries(messages)
              .filter(([k]) => k.startsWith(t.id))
              .map(([, msg]) => (
                <span key={msg} className="w-full text-xs text-tempo-mint text-emerald-400">
                  {msg}
                </span>
              ))}
          </li>
        ))}
      </ul>

      {!auth.spotify && !auth.deezer && (
        <p className="flex items-center justify-center gap-2 text-sm text-amber-400">
          <Heart size={14} /> Connectez Spotify ou Deezer depuis l&apos;accueil pour activer le Clic Magique.
        </p>
      )}

      <Link to="/" className="btn-violet mx-auto block w-fit">
        Retour à l&apos;Arène
      </Link>
    </div>
  );
}