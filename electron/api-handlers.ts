import type { OAuthTokens } from "./oauth-server";
import { getProviderTokens, getStreamingStatus } from "./session-store";

const DEEZER_API = "https://api.deezer.com";
const SPOTIFY_API = "https://api.spotify.com/v1";

export interface PlayedTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  previewUrl?: string;
  provider: "deezer" | "spotify" | "local";
}

export function getAuthStatus() {
  return getStreamingStatus();
}

async function deezerJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Deezer ${res.status}`);
  return res.json() as Promise<T>;
}

export async function searchMusic(query: string, type: "all" | "playlist" | "artist" | "track" = "all") {
  const q = encodeURIComponent(query.trim() || "pop");
  const results: {
    playlists: { id: string; title: string; cover?: string; source: string }[];
    artists: { id: string; name: string; picture?: string; source: string }[];
    tracks: PlayedTrack[];
  } = { playlists: [], artists: [], tracks: [] };

  if (type === "all" || type === "playlist") {
    try {
      const dzPlaylists = await deezerJson<{ data?: { id: number; title: string; picture_medium?: string }[] }>(
        `${DEEZER_API}/search/playlist?q=${q}&limit=10`
      );
      results.playlists.push(
        ...(dzPlaylists.data || []).map((p) => ({
          id: String(p.id),
          title: p.title,
          cover: p.picture_medium,
          source: "deezer",
        }))
      );
    } catch {
      /* Deezer playlist search failed — Spotify may still work */
    }
  }

  if (type === "all" || type === "artist") {
    try {
      const dzArtists = await deezerJson<{ data?: { id: number; name: string; picture_medium?: string }[] }>(
        `${DEEZER_API}/search/artist?q=${q}&limit=10`
      );
      results.artists.push(
        ...(dzArtists.data || []).map((a) => ({
          id: String(a.id),
          name: a.name,
          picture: a.picture_medium,
          source: "deezer",
        }))
      );
    } catch {
      /* ignore */
    }
  }

  if (type === "all" || type === "track") {
    try {
      const dzTracks = await deezerJson<{
        data?: { id: number; title: string; artist: { name: string }; preview?: string; album?: { cover_medium?: string } }[];
      }>(`${DEEZER_API}/search/track?q=${q}&limit=15`);
      results.tracks.push(
        ...(dzTracks.data || [])
          .filter((t) => t.preview)
          .map((t) => ({
            id: String(t.id),
            title: t.title,
            artist: t.artist?.name || "?",
            previewUrl: t.preview,
            coverUrl: t.album?.cover_medium,
            provider: "deezer" as const,
          }))
      );
    } catch {
      /* ignore */
    }
  }

  const { spotify } = getProviderTokens();
  if (spotify?.accessToken && !spotify.accessToken.startsWith("code:")) {
    const headers = { Authorization: `Bearer ${spotify.accessToken}` };
    if (type === "all" || type === "playlist") {
      try {
        const sp = await fetch(`${SPOTIFY_API}/search?q=${q}&type=playlist&limit=8`, { headers }).then((r) => r.json());
        results.playlists.push(
          ...(sp.playlists?.items || []).map((p: { id: string; name: string; images?: { url: string }[] }) => ({
            id: p.id,
            title: p.name,
            cover: p.images?.[0]?.url,
            source: "spotify",
          }))
        );
      } catch {
        /* ignore */
      }
    }
    if (type === "all" || type === "artist") {
      try {
        const sp = await fetch(`${SPOTIFY_API}/search?q=${q}&type=artist&limit=8`, { headers }).then((r) => r.json());
        results.artists.push(
          ...(sp.artists?.items || []).map((a: { id: string; name: string; images?: { url: string }[] }) => ({
            id: a.id,
            name: a.name,
            picture: a.images?.[0]?.url,
            source: "spotify",
          }))
        );
      } catch {
        /* ignore */
      }
    }
  }

  return results;
}

export async function searchDeezerPlaylists(query: string) {
  const r = await searchMusic(query, "playlist");
  return r.playlists.filter((p) => p.source === "deezer");
}

export async function getDeezerPlaylistTracks(playlistId: string) {
  const all: unknown[] = [];
  let url: string | null = `${DEEZER_API}/playlist/${playlistId}/tracks?limit=100`;
  for (let page = 0; page < 4 && url; page++) {
    const data = (await fetch(url).then((r) => r.json())) as { data?: unknown[]; next?: string };
    all.push(...(data.data || []));
    url = data.next || null;
  }
  return mapDeezerTracks(all);
}

export async function getDeezerArtistTracks(artistId: string) {
  const data = await fetch(`${DEEZER_API}/artist/${artistId}/top?limit=25`).then((r) => r.json());
  return mapDeezerTracks(data.data || []);
}

function mapDeezerTracks(list: unknown[]) {
  const out: PlayedTrack[] = [];
  for (const item of list) {
    const raw = item as { track?: Record<string, unknown> };
    const t = (raw.track ?? item) as {
      id: number;
      title: string;
      preview?: string;
      artist?: { name: string };
      album?: { cover_medium?: string; cover_big?: string };
    };
    if (!t?.id) continue;
    const cover = t.album?.cover_medium || t.album?.cover_big;
    out.push({
      id: String(t.id),
      title: t.title,
      artist: t.artist?.name || "?",
      previewUrl: t.preview,
      coverUrl: cover,
      provider: "deezer",
    });
  }
  return out;
}

export async function getDeezerChartTracks() {
  const data = await fetch(`${DEEZER_API}/chart/0/tracks`).then((r) => r.json());
  return mapDeezerTracks(data.data || []).slice(0, 25);
}

export async function getSpotifyPlaylistTracks(playlistId: string) {
  const { spotify } = getProviderTokens();
  if (!spotify?.accessToken || spotify.accessToken.startsWith("code:")) return [];
  const res = await fetch(`${SPOTIFY_API}/playlists/${playlistId}/tracks?limit=30`, {
    headers: { Authorization: `Bearer ${spotify.accessToken}` },
  });
  const data = await res.json();
  return (data.items || [])
    .map((it: { track: { id: string; name: string; artists: { name: string }[]; preview_url?: string; album?: { images?: { url: string }[] } } | null }) => it.track)
    .filter((t: { preview_url?: string } | null) => t?.preview_url)
    .map((t: { id: string; name: string; artists: { name: string }[]; preview_url: string; album?: { images?: { url: string }[] } }) => ({
      id: t.id,
      title: t.name,
      artist: t.artists?.map((a) => a.name).join(", ") || "?",
      previewUrl: t.preview_url,
      coverUrl: t.album?.images?.[0]?.url,
      provider: "spotify" as const,
    }));
}

export async function addTrackToFavorites(provider: "spotify" | "deezer", track: PlayedTrack) {
  const tokens = getProviderTokens();
  if (provider === "deezer" && tokens.deezer?.accessToken) {
    const res = await fetch(
      `https://api.deezer.com/user/me/tracks?access_token=${tokens.deezer.accessToken}&track_id=${track.id}`,
      { method: "POST" }
    );
    if (!res.ok) throw new Error("Impossible d'ajouter aux favoris Deezer");
    return { ok: true, message: "Ajouté aux Coups de cœur Deezer" };
  }

  if (provider === "spotify" && tokens.spotify?.accessToken) {
    const accessToken = tokens.spotify.accessToken;
    if (accessToken.startsWith("code:")) {
      throw new Error("Configurez SPOTIFY_CLIENT_SECRET pour l'échange de code");
    }
    const res = await fetch(`${SPOTIFY_API}/me/tracks?ids=${track.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("Impossible d'ajouter aux favoris Spotify");
    return { ok: true, message: "Ajouté à votre bibliothèque Spotify" };
  }

  return { ok: false, message: "Connectez Spotify et/ou Deezer dans votre profil" };
}

export function legacySetAuthToken(_provider: "spotify" | "deezer", _data: OAuthTokens) {
  /* handled via session-store in main */
}