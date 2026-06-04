import { getRedirectUri } from "./oauth-server";
import { beginSpotifyPkce } from "./spotify-oauth";

export function getSpotifyClientId() {
  return (process.env.SPOTIFY_CLIENT_ID || "").trim();
}

export function getDeezerAppId() {
  return (process.env.DEEZER_APP_ID || "").trim();
}

export function isPlaceholderId(value: string) {
  return !value || value.includes("VOTRE") || value === "VOTRE_SPOTIFY_CLIENT_ID" || value === "VOTRE_DEEZER_APP_ID";
}

const REDIRECT = getRedirectUri();

export function getSpotifyAuthUrl(): string {
  const clientId = getSpotifyClientId();
  if (isPlaceholderId(clientId)) {
    throw new Error(
      "Configurez SPOTIFY_CLIENT_ID (Redirect URI Spotify : http://127.0.0.1:3000/callback)"
    );
  }

  const { challenge } = beginSpotifyPkce();
  const scopes = [
    "user-read-private",
    "playlist-modify-public",
    "playlist-modify-private",
    "user-library-modify",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: REDIRECT,
    scope: scopes,
    show_dialog: "true",
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export function getDeezerAuthUrl(): string {
  const appId = getDeezerAppId();
  if (isPlaceholderId(appId)) {
    throw new Error(
      "Deezer : création d'apps fermée — utilisez la recherche sans connexion, ou un App ID existant"
    );
  }

  const perms = "basic_access,email,manage_library,offline_access";
  const params = new URLSearchParams({
    app_id: appId,
    redirect_uri: REDIRECT,
    perms,
  });
  return `https://connect.deezer.com/oauth/auth.php?${params.toString()}`;
}