import fs from "node:fs";
import path from "node:path";
import { getProviderTokens } from "./session-store";

const DEEZER_API = "https://api.deezer.com";

type Graph = Record<string, string[]>;

interface FeaturingsFile {
  artists: Graph;
  aliases?: Record<string, string>;
  startPool: string[];
}

let graph: Graph = {};
let aliasToKey: Map<string, string> = new Map();
let startPool: string[] = [];

function normalize(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

function ensureBidirectional(g: Graph) {
  for (const [key, collabs] of Object.entries(g)) {
    for (const c of collabs) {
      if (!g[c]) g[c] = [];
      if (!g[c].some((x) => normalize(x) === normalize(key))) {
        g[c].push(key);
      }
    }
  }
}

function loadGraph() {
  const bundled = path.join(__dirname, "data", "featurings.json");
  const devFile = path.join(process.cwd(), "electron", "data", "featurings.json");
  const chosen = fs.existsSync(bundled) ? bundled : devFile;
  const data = JSON.parse(fs.readFileSync(chosen, "utf8")) as FeaturingsFile;
  graph = data.artists;
  ensureBidirectional(graph);
  startPool = data.startPool;
  aliasToKey = new Map();

  for (const key of Object.keys(graph)) {
    aliasToKey.set(normalize(key), key);
  }
  if (data.aliases) {
    for (const [alias, key] of Object.entries(data.aliases)) {
      aliasToKey.set(normalize(alias), key);
    }
  }
}

export function initRolengamos() {
  loadGraph();
}

export function getRandomStartArtist() {
  return startPool[Math.floor(Math.random() * startPool.length)] || "Drake";
}

export function getCollaborators(fromDisplay: string): string[] {
  const key = resolveArtist(fromDisplay);
  if (!key) return [];
  return [...(graph[key] || [])];
}

export function resolveArtist(name: string): string | null {
  const n = normalize(name);
  if (!n) return null;
  if (aliasToKey.has(n)) return aliasToKey.get(n)!;
  for (const [alias, key] of aliasToKey) {
    if (alias.includes(n) || n.includes(alias)) return key;
  }
  return null;
}

function localCollaborators(artistKey: string): string[] {
  return graph[artistKey] || [];
}

async function deezerSearchTracks(fromName: string, toName: string, limit = 12) {
  const q = encodeURIComponent(`${fromName} ${toName}`);
  const res = await fetch(`${DEEZER_API}/search/track?q=${q}&limit=${limit}`);
  const data = (await res.json()) as {
    data?: { artist?: { name: string }; title: string; preview?: string }[];
  };
  return data.data || [];
}

function trackMatchesBoth(
  t: { artist?: { name: string }; title: string },
  fromName: string,
  toName: string
) {
  const blob = normalize(`${t.title} ${t.artist?.name || ""}`);
  const fromN = normalize(fromName);
  const toN = normalize(toName);
  return blob.includes(fromN) && blob.includes(toN);
}

async function deezerCollaboration(fromName: string, toName: string): Promise<boolean> {
  try {
    const tracks = await deezerSearchTracks(fromName, toName, 8);
    return tracks.some((t) => trackMatchesBoth(t, fromName, toName));
  } catch {
    return false;
  }
}

/** Extrait audio du morceau en featuring entre deux artistes (Deezer). */
export async function findCollabPreview(fromName: string, toName: string) {
  try {
    const tracks = await deezerSearchTracks(fromName, toName, 15);
    const match =
      tracks.find((t) => t.preview && trackMatchesBoth(t, fromName, toName)) ||
      tracks.find((t) => t.preview);
    if (!match?.preview) return null;
    return {
      previewUrl: match.preview,
      title: match.title,
      artist: match.artist?.name || `${fromName} & ${toName}`,
    };
  } catch {
    return null;
  }
}

export async function validateFeaturing(fromDisplay: string, toDisplay: string) {
  const fromKey = resolveArtist(fromDisplay);
  const toKey = resolveArtist(toDisplay);

  if (fromKey && toKey) {
    const collabsFrom = localCollaborators(fromKey);
    const collabsTo = localCollaborators(toKey);
    const linked =
      collabsFrom.some((c) => normalize(c) === normalize(toKey)) ||
      collabsTo.some((c) => normalize(c) === normalize(fromKey));
    if (linked) {
      return {
        valid: true,
        canonicalFrom: fromKey,
        canonicalTo: toKey,
        source: "local" as const,
      };
    }
  }

  if (fromKey && !toKey) {
    const guessKey = resolveArtist(toDisplay);
    if (guessKey && localCollaborators(fromKey).some((c) => normalize(c) === normalize(guessKey))) {
      return { valid: true, canonicalFrom: fromKey, canonicalTo: guessKey, source: "local" as const };
    }
  }

  const deezerOk = await deezerCollaboration(fromDisplay, toDisplay);
  if (deezerOk) {
    return {
      valid: true,
      canonicalFrom: fromKey || fromDisplay,
      canonicalTo: toKey || toDisplay,
      source: "deezer" as const,
    };
  }

  const tokens = getProviderTokens();
  if (tokens.spotify?.accessToken && !tokens.spotify.accessToken.startsWith("code:")) {
    try {
      const q = encodeURIComponent(`artist:"${fromDisplay}" AND artist:"${toDisplay}"`);
      const res = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=track&limit=5`, {
        headers: { Authorization: `Bearer ${tokens.spotify.accessToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { tracks?: { items?: unknown[] } };
        if ((data.tracks?.items?.length || 0) > 0) {
          return {
            valid: true,
            canonicalFrom: fromKey || fromDisplay,
            canonicalTo: toKey || toDisplay,
            source: "spotify" as const,
          };
        }
      }
    } catch {
      /* ignore */
    }
  }

  return {
    valid: false as const,
    reason: "Aucun featuring trouvé (base locale + APIs)",
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 4 propositions pour le mode facile (au moins 1 bonne réponse). */
export function getRolengamosChoices(fromDisplay: string, usedNormalized: Set<string>) {
  const key = resolveArtist(fromDisplay);
  if (!key) return { choices: [] as string[], validOptions: [] as string[] };

  const valid = localCollaborators(key).filter((a) => !usedNormalized.has(normalize(a)));
  if (!valid.length) return { choices: [], validOptions: [] };

  const picked = shuffle(valid).slice(0, Math.min(2, valid.length));
  const distractors = shuffle(
    startPool.filter((a) => normalize(a) !== normalize(key) && !usedNormalized.has(normalize(a)))
  );

  const choices: string[] = [...picked];
  for (const d of distractors) {
    if (choices.length >= 4) break;
    if (!choices.some((c) => normalize(c) === normalize(d))) choices.push(d);
  }
  while (choices.length < 4 && valid.length > picked.length) {
    const extra = valid.find((v) => !choices.includes(v));
    if (extra) choices.push(extra);
    else break;
  }

  return { choices: shuffle(choices).slice(0, 4), validOptions: valid };
}

export function pickAiMove(
  fromDisplay: string,
  difficulty: "facile" | "normal" | "difficile",
  usedNormalized: Set<string>
): string | null {
  const key = resolveArtist(fromDisplay);
  if (!key) return null;

  let options = localCollaborators(key).filter((a) => !usedNormalized.has(normalize(a)));
  if (!options.length) return null;

  return options[Math.floor(Math.random() * options.length)];
}