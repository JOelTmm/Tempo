import { useState } from "react";
import { Loader2, Search } from "lucide-react";

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

interface Props {
  onSelectPlaylist: (source: string, id: string, title: string) => void;
  onSelectArtist?: (id: string, name: string) => void;
  placeholder?: string;
}

export function MusicSearch({ onSelectPlaylist, onSelectArtist, placeholder }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistHit[]>([]);
  const [artists, setArtists] = useState<ArtistHit[]>([]);

  async function search() {
    setLoading(true);
    try {
      const res = (await window.tempo.music.search(query, "all")) as {
        playlists: PlaylistHit[];
        artists: ArtistHit[];
      };
      setPlaylists(res.playlists || []);
      setArtists(res.artists || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
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
              <p className="font-semibold">{p.title}</p>
              <p className="text-xs text-slate-500">{p.source}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}