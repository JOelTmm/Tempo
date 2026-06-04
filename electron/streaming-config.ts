import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

export interface StreamingConfig {
  spotifyClientId?: string;
  spotifyClientSecret?: string;
  deezerAppId?: string;
}

function configPath() {
  const dir = app.isReady() ? app.getPath("userData") : path.join(process.cwd(), "data");
  return path.join(dir, "streaming-config.json");
}

function projectFallbackPath() {
  return path.join(process.cwd(), "config", "streaming.local.json");
}

export function loadStreamingConfigFile(): StreamingConfig {
  const paths = [configPath(), projectFallbackPath()];
  for (const p of paths) {
    if (!fs.existsSync(p)) continue;
    try {
      return JSON.parse(fs.readFileSync(p, "utf8")) as StreamingConfig;
    } catch {
      /* ignore */
    }
  }
  return {};
}

export function applyStreamingConfig() {
  const c = loadStreamingConfigFile();
  if (c.spotifyClientId?.trim()) process.env.SPOTIFY_CLIENT_ID = c.spotifyClientId.trim();
  if (c.spotifyClientSecret?.trim()) process.env.SPOTIFY_CLIENT_SECRET = c.spotifyClientSecret.trim();
  if (c.deezerAppId?.trim()) process.env.DEEZER_APP_ID = c.deezerAppId.trim();
}

export function saveStreamingConfig(c: StreamingConfig) {
  const p = configPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const clean: StreamingConfig = {
    spotifyClientId: c.spotifyClientId?.trim() || undefined,
    spotifyClientSecret: c.spotifyClientSecret?.trim() || undefined,
    deezerAppId: c.deezerAppId?.trim() || undefined,
  };
  fs.writeFileSync(p, JSON.stringify(clean, null, 2), "utf8");
  applyStreamingConfig();
  return clean;
}

export function getStreamingConfigForUi() {
  const c = loadStreamingConfigFile();
  return {
    spotifyClientId: c.spotifyClientId || process.env.SPOTIFY_CLIENT_ID || "",
    spotifyClientSecret: c.spotifyClientSecret || process.env.SPOTIFY_CLIENT_SECRET || "",
    deezerAppId: c.deezerAppId || process.env.DEEZER_APP_ID || "",
  };
}