import type { Track } from "../vite-env";

const KEY = "tempo-last-session";

export function pushPlayedTrack(track: Track) {
  const list = getPlayedTracks();
  if (!list.find((t) => t.id === track.id)) list.push(track);
  sessionStorage.setItem(KEY, JSON.stringify(list));
}

export function getPlayedTracks(): Track[] {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearPlayedTracks() {
  sessionStorage.removeItem(KEY);
}