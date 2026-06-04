import { readFileSync } from "fs";
import { pathToFileURL } from "url";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const mod = await import(pathToFileURL(join(__dir, "../src/lib/lyricsMatch.ts")).href);
const { matchLyricsFromTracks } = mod;

const res = await fetch("https://api.deezer.com/chart/0/tracks?limit=50");
const data = await res.json();
const tracks = (data.data || []).map((t) => ({
  id: String(t.id),
  title: t.title,
  artist: t.artist?.name || "?",
  previewUrl: t.preview || undefined,
  provider: "deezer",
}));

console.log("Chart sample:");
tracks.slice(0, 12).forEach((t) => console.log(" ", t.artist, "-", t.title));

const matched = matchLyricsFromTracks(tracks);
console.log("Matched", matched.length, "from chart", tracks.length);
matched.forEach((m) => console.log(" -", m.artist, m.songTitle));

const stromae = await fetch("https://api.deezer.com/search/track?q=stromae&limit=10").then((r) => r.json());
const stTracks = (stromae.data || []).map((t) => ({
  id: String(t.id),
  title: t.title,
  artist: t.artist?.name || "?",
  previewUrl: t.preview,
  provider: "deezer",
}));
console.log("Stromae search matched:", matchLyricsFromTracks(stTracks).length);