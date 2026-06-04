import crypto from "node:crypto";
import { getRedirectUri } from "./oauth-server";

let codeVerifier: string | null = null;

export function beginSpotifyPkce() {
  codeVerifier = crypto.randomBytes(48).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, challenge };
}

export function getSpotifyPkceVerifier() {
  return codeVerifier;
}

export function clearSpotifyPkce() {
  codeVerifier = null;
}

export async function exchangeSpotifyCode(code: string, verifier: string) {
  const clientId = (process.env.SPOTIFY_CLIENT_ID || "").trim();
  const clientSecret = (process.env.SPOTIFY_CLIENT_SECRET || "").trim();
  if (!clientId) throw new Error("SPOTIFY_CLIENT_ID manquant dans .env");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    client_id: clientId,
    code_verifier: verifier,
  });
  if (clientSecret) body.set("client_secret", clientSecret);

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Échange Spotify échoué");
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
  };
}