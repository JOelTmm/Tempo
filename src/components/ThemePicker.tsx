import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import type { Track } from "../vite-env";

interface PlaylistHit {
  id: string;
  title: string;
  cover?: string;
  source: string;
}

interface ArtistHit {
  id: string;
  name: string;
  picture?: string;
  source: string;
}

const QUICK_THEMES = [
  { label: "Top France", kind: "chart" as const },
  { label: "Rap FR", kind: "search" as const, query: "rap francais" },
  { label: "Pop", kind: "search" as const, query: "pop hits" },
  { label: "Années 80", kind: "search" as const, query: "annees 80" },
];

interface Props {
  onSelectPlaylist: (source: string, id: string, title: string) => void;
  onSelectArtist?: (id: string, name: string) => void;
  onChartTracks?: (tracks: Track[]) => void;
  placeholder?: string;
}

export function ThemePicker({ onSelectPlaylist, onSelectArtist, onChartTracks, placeholder }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [playlists, setPlaylists] = useState<PlaylistHit[]>([]);
  const [artists, setArtists] = useState<ArtistHit[]>([]);

  async function runSearch(q: string) {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setError("Tapez au moins 2 caractères");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = (await window.tempo.music.search(trimmed, "all")) as {
        playlists: PlaylistHit[];
        artists: ArtistHit[];
      };
      setPlaylists((res.playlists || []).slice(0, 8));
      setArtists((res.artists || []).slice(0, 8));
      if (!(res.playlists?.length || res.artists?.length)) {
        setError("Aucun résultat — essayez un autre mot-clé ou un thème rapide");
      }
    } catch {
      setError("Recherche indisponible — réessayez ou choisissez un thème rapide");
      setPlaylists([]);
      setArtists([]);
    } finally {
      setLoading(false);
    }
  }

  async function search() {
    await runSearch(query);
  }

  async function runQuick(theme: (typeof QUICK_THEMES)[number]) {
    setError("");
    if (theme.kind === "chart" && onChartTracks) {
      setLoading(true);
      try {
        const tracks = (await window.tempo.deezer.chartTracks()) as Track[];
        if (!tracks.length) {
          setError("Chart Deezer indisponible");
          return;
        }
        onChartTracks(tracks);
      } catch {
        setError("Chart indisponible — réessayez");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (theme.kind === "search" && theme.query) {
      setQuery(theme.query);
      await runSearch(theme.query);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">Choisir un thème musical</p>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl border border-tempo-border bg-tempo-panel px-4 py-3"
          placeholder={placeholder || "Artiste, genre, playlist…"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <button type="button" className="btn-neon flex items-center gap-2" onClick={search} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          Chercher
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase text-slate-500">Thèmes rapides</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_THEMES.map((t) => (
            <button
              key={t.label}
              type="button"
              className="rounded-lg border border-tempo-orange/50 px-3 py-2 text-sm text-tempo-orange hover:bg-tempo-orange/10"
              disabled={loading}
              onClick={() => runQuick(t)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-amber-400">{error}</p>}

      {artists.length > 0 && onSelectArtist && (
        <div>
          <p className="mb-2 text-xs uppercase text-slate-500">Artistes</p>
          <div className="flex flex-wrap gap-2">
            {artists.map((a) => (
              <button
                key={`${a.source}-${a.id}`}
                type="button"
                className="rounded-lg border border-tempo-border px-3 py-2 text-sm hover:border-tempo-violet"
                onClick={() => onSelectArtist(a.id, a.name)}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {playlists.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase text-slate-500">Playlists</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {playlists.map((p) => (
              <button
                key={`${p.source}-${p.id}`}
                type="button"
                className="arena-card flex items-center gap-3 text-left"
                onClick={() => onSelectPlaylist(p.source, p.id, p.title)}
              >
                {p.cover && <img src={p.cover} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                <div>
                  <p className="font-semibold line-clamp-2">{p.title}</p>
                  <p className="text-xs text-slate-500">{p.source}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}