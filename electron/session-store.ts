import { app, safeStorage } from "electron";
import fs from "node:fs";
import path from "node:path";
import type { OAuthTokens } from "./oauth-server";

export interface UserSession {
  userId: string;
  email: string;
  displayName: string;
  role: "player" | "manager";
  spotify?: OAuthTokens;
  deezer?: OAuthTokens;
}

interface PersistedSession {
  userId: string;
  email: string;
  displayName: string;
  role: "player" | "manager";
  spotifyEnc?: string;
  deezerEnc?: string;
}

let current: UserSession | null = null;

function sessionPath() {
  return path.join(app.getPath("userData"), "session.json");
}

function encrypt(obj: OAuthTokens): string | undefined {
  const raw = JSON.stringify(obj);
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(raw).toString("base64");
  }
  return Buffer.from(raw).toString("base64");
}

function decrypt(enc: string): OAuthTokens | undefined {
  try {
    const buf = Buffer.from(enc, "base64");
    const raw = safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(buf)
      : buf.toString("utf8");
    return JSON.parse(raw) as OAuthTokens;
  } catch {
    return undefined;
  }
}

export function getSession(): UserSession | null {
  return current;
}

export function setSession(session: UserSession) {
  current = session;
  const data: PersistedSession = {
    userId: session.userId,
    email: session.email,
    displayName: session.displayName,
    role: session.role,
    spotifyEnc: session.spotify ? encrypt(session.spotify) : undefined,
    deezerEnc: session.deezer ? encrypt(session.deezer) : undefined,
  };
  fs.writeFileSync(sessionPath(), JSON.stringify(data, null, 2), "utf8");
}

export function loadSessionFromDisk(): UserSession | null {
  try {
    const raw = fs.readFileSync(sessionPath(), "utf8");
    const data = JSON.parse(raw) as PersistedSession;
    current = {
      userId: data.userId,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      spotify: data.spotifyEnc ? decrypt(data.spotifyEnc) : undefined,
      deezer: data.deezerEnc ? decrypt(data.deezerEnc) : undefined,
    };
    return current;
  } catch {
    current = null;
    return null;
  }
}

export function clearSession() {
  current = null;
  try {
    fs.unlinkSync(sessionPath());
  } catch {
    /* ignore */
  }
}

export function setProviderToken(provider: "spotify" | "deezer", tokens: OAuthTokens) {
  if (!current) return;
  if (provider === "spotify") current.spotify = tokens;
  else current.deezer = tokens;
  setSession(current);
}

export function getProviderTokens() {
  return {
    spotify: current?.spotify,
    deezer: current?.deezer,
  };
}

export function getStreamingStatus() {
  return {
    spotify: Boolean(current?.spotify?.accessToken),
    deezer: Boolean(current?.deezer?.accessToken),
  };
}