import type { Track } from "../vite-env";

function norm(s: string) {
  return s.trim().toLowerCase();
}

export function pickUniqueTracks(tracks: Track[], count: number): Track[] {
  const seenId = new Set<string>();
  const seenCover = new Set<string>();
  const seenTitle = new Set<string>();
  const out: Track[] = [];
  const pool = [...tracks].sort(() => Math.random() - 0.5);
  for (const t of pool) {
    const idKey = `${t.provider}-${t.id}`;
    const coverKey = (t.coverUrl || "").split("?")[0];
    const titleKey = `${norm(t.title)}|${norm(t.artist)}`;
    if (seenId.has(idKey) || (coverKey && seenCover.has(coverKey)) || seenTitle.has(titleKey)) continue;
    seenId.add(idKey);
    if (coverKey) seenCover.add(coverKey);
    seenTitle.add(titleKey);
    out.push(t);
    if (out.length >= count) break;
  }
  return out;
}