import fs from "node:fs";
import path from "node:path";
import { applyStreamingConfig } from "./streaming-config";

/** Charge .env à la racine du projet (Spotify / Deezer OAuth). */
export function loadEnvFile() {
  const candidates = [
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "..", ".env"),
    path.join(__dirname, "..", ".env"),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
    break;
  }
}

/** Réapplique config streaming (fichier utilisateur ou config/streaming.local.json). */
export function reloadStreamingEnv() {
  try {
    applyStreamingConfig();
  } catch {
    /* avant app.ready */
  }
}

export function streamingCredentialsStatus() {
  reloadStreamingEnv();
  const spotifyId = (process.env.SPOTIFY_CLIENT_ID || "").trim();
  const deezerId = (process.env.DEEZER_APP_ID || "").trim();
  const spotifyOk =
    Boolean(spotifyId) &&
    !spotifyId.includes("VOTRE") &&
    spotifyId !== "VOTRE_SPOTIFY_CLIENT_ID";
  const deezerOk =
    Boolean(deezerId) && !deezerId.includes("VOTRE") && deezerId !== "VOTRE_DEEZER_APP_ID";
  return { spotifyOk, deezerOk };
}