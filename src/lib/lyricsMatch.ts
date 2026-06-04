import builtinLyrics from "../data/lyrics.json";
import type { Difficulty, Track } from "../vite-env";

export type LyricEntry = {
  line: string;
  answer: string;
  songTitle: string;
  artist: string;
  previewQuery: string;
  previewUrl?: string;
  altTitles?: string[];
  /** Seconde dans l'extrait Deezer où couper (juste avant le mot manquant) */
  cutAt?: number;
};

const DIFF_CUT_TWEAK: Record<Difficulty, number> = {
  facile: 0.6,
  normal: 0,
  difficile: -0.6,
};

function normKey(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

function softNorm(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function cleanTrackTitle(title: string) {
  return title
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s*\[[^\]]*\]\s*/g, " ")
    .replace(/\s+-\s+(live|version|edit|remix|remaster|acoustic|radio).*$/gi, " ")
    .replace(/\b(feat\.?|ft\.?|featuring)\b.*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleTokens(s: string) {
  const k = normKey(cleanTrackTitle(s));
  return k.match(/[a-z0-9]{2,}/g) || [];
}

function titleSimilarity(trackTitle: string, lyricTitle: string, altTitles: string[] = []) {
  const candidates = [lyricTitle, ...altTitles];
  let best = 0;
  const tClean = normKey(cleanTrackTitle(trackTitle));
  const tWords = titleTokens(trackTitle);

  for (const cand of candidates) {
    const lKey = normKey(cand);
    if (!lKey || !tClean) continue;
    if (tClean === lKey) return 1;
    if (tClean.includes(lKey) || lKey.includes(tClean)) best = Math.max(best, 0.95);

    const lWords = titleTokens(cand);
    if (!lWords.length) continue;
    const overlap = lWords.filter((w) => tWords.some((tw) => tw.includes(w) || w.includes(tw))).length;
    const ratio = overlap / lWords.length;
    if (overlap >= 2 && ratio >= 0.6) best = Math.max(best, 0.85);
    if (overlap >= 1 && lWords.length === 1 && ratio >= 1) best = Math.max(best, 0.8);
  }
  return best;
}

function artistSimilarity(trackArtist: string, lyricArtist: string) {
  const t = softNorm(trackArtist);
  const l = softNorm(lyricArtist);
  if (!t || !l) return 0;
  if (t === l) return 1;
  if (t.includes(l) || l.includes(t)) return 0.95;

  const tParts = t.split(/,|&| et /).map((p) => p.trim()).filter(Boolean);
  const lParts = l.split(/,|&| et /).map((p) => p.trim()).filter(Boolean);
  for (const tp of tParts) {
    for (const lp of lParts) {
      if (tp.includes(lp) || lp.includes(tp)) return 0.9;
      const tf = tp.split(/\s+/)[0] || "";
      const lf = lp.split(/\s+/)[0] || "";
      if (tf.length >= 3 && lf.length >= 3 && (tf.includes(lf) || lf.includes(tf))) return 0.75;
    }
  }
  return 0;
}

export function matchScore(track: Track, lyric: LyricEntry) {
  const titleScore = titleSimilarity(track.title, lyric.songTitle, lyric.altTitles);
  const artistScore = artistSimilarity(track.artist, lyric.artist);
  if (titleScore >= 0.8 && artistScore >= 0.75) return titleScore + artistScore;
  if (titleScore >= 0.95 && artistScore >= 0.5) return titleScore + artistScore;
  if (titleScore >= 0.7 && artistScore >= 0.9) return titleScore + artistScore;
  if (titleScore >= 0.85 && artistScore >= 0.5) return titleScore + artistScore * 0.8;
  return 0;
}

const lyricPool = builtinLyrics as LyricEntry[];

/** Instant de coupure dans l'extrait (calibré par chanson). */
export function getCutAtForRound(lyric: LyricEntry, difficulty: Difficulty): number {
  const base = lyric.cutAt ?? 9;
  const sec = base + DIFF_CUT_TWEAK[difficulty];
  return Math.max(2.5, Math.min(27, sec));
}

export function getAllLyricRounds(): LyricEntry[] {
  return lyricPool.map((r) => ({ ...r }));
}

/** Choisit un morceau dont le titre/artiste correspond vraiment à la ligne de paroles. */
export function pickTrackForLyric(tracks: Track[], lyric: LyricEntry): Track | undefined {
  let best: { track: Track; score: number } | null = null;
  for (const track of tracks) {
    if (!track.previewUrl) continue;
    const score = matchScore(track, lyric);
    if (score >= 1.5 && (!best || score > best.score)) {
      best = { track, score };
    }
  }
  return best?.track;
}

export function matchLyricsFromTracks(tracks: Track[]): LyricEntry[] {
  const playable = tracks.filter((t) => t.title?.trim());
  if (!playable.length) return [];

  const usedTracks = new Set<string>();
  const out: LyricEntry[] = [];
  const sortedLyrics = [...lyricPool].sort(() => Math.random() - 0.5);

  for (const lyric of sortedLyrics) {
    let best: { track: Track; score: number } | null = null;

    for (const track of playable) {
      if (usedTracks.has(track.id)) continue;
      const score = matchScore(track, lyric);
      if (score >= 1.2 && (!best || score > best.score)) {
        best = { track, score };
      }
    }

    if (!best) continue;

    usedTracks.add(best.track.id);
    out.push({
      ...lyric,
      previewUrl: best.track.previewUrl,
      previewQuery: `${cleanTrackTitle(best.track.title)} ${best.track.artist}`,
    });
  }

  return out;
}

export async function fillLyricRoundsFromSearch(
  existing: LyricEntry[],
  targetCount: number,
  searchTracks: (query: string) => Promise<Track[]>
): Promise<LyricEntry[]> {
  const used = new Set(existing.map((e) => e.line));
  const out = [...existing];
  const pool = [...lyricPool].sort(() => Math.random() - 0.5);

  for (const lyric of pool) {
    if (out.length >= targetCount) break;
    if (used.has(lyric.line)) continue;
    const tracks = await searchTracks(lyric.previewQuery);
    const hit = pickTrackForLyric(tracks, lyric);
    if (!hit?.previewUrl) continue;
    used.add(lyric.line);
    out.push({ ...lyric, previewUrl: hit.previewUrl });
  }

  return out;
}