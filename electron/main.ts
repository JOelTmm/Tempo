import { app, BrowserWindow, ipcMain, shell } from "electron";
import { configureAppIcon, getAppIcon } from "./app-icon";
import path from "node:path";
import fs from "node:fs";
import { loadEnvFile, streamingCredentialsStatus } from "./load-env";
import {
  applyStreamingConfig,
  getStreamingConfigForUi,
  saveStreamingConfig,
} from "./streaming-config";
import { getDeezerAuthUrl, getSpotifyAuthUrl } from "./auth-config";
import {
  clearSpotifyPkce,
  exchangeSpotifyCode,
  getSpotifyPkceVerifier,
} from "./spotify-oauth";
import {
  addTrackToFavorites,
  getDeezerArtistTracks,
  getDeezerChartTracks,
  getDeezerPlaylistTracks,
  getSpotifyPlaylistTracks,
  searchDeezerPlaylists,
  searchMusic,
} from "./api-handlers";
import {
  getCurrentAuth,
  getSystemLogs,
  initAuth,
  listUsersForManager,
  loginUser,
  logoutUser,
  registerUser,
  updateUserScore,
} from "./auth-service";
import {
  findCollabPreview,
  getRandomStartArtist,
  initRolengamos,
  getCollaborators,
  getRolengamosChoices,
  pickAiMove,
  validateFeaturing,
} from "./rolengamos-service";
import { startRoomServer, stopRoomServer, getRoomServerInfo } from "./room-server";
import { loadSessionFromDisk, setProviderToken, getStreamingStatus } from "./session-store";
import {
  startOAuthServer,
  stopOAuthServer,
  waitForOAuthCallback,
  type OAuthProvider,
} from "./oauth-server";
import { getReleaseInfo } from "./app-release";

const isDev = process.env.NODE_ENV === "development";
let mainWindow: BrowserWindow | null = null;

function copyElectronData() {
  const src = path.join(__dirname, "..", "electron", "data");
  const dest = path.join(__dirname, "data");
  if (fs.existsSync(src) && !fs.existsSync(dest)) {
    fs.cpSync(src, dest, { recursive: true });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: "#0B0E1A",
    title: "Tempo — Votre Arène Musicale",
    show: false,
    autoHideMenuBar: true,
    icon: getAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());

  if (isDev) {
    mainWindow.loadURL("http://127.0.0.1:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function runOAuth(provider: OAuthProvider) {
  await startOAuthServer();
  const url = provider === "spotify" ? getSpotifyAuthUrl() : getDeezerAuthUrl();
  await shell.openExternal(url);
  let tokens = await waitForOAuthCallback(provider);

  if (provider === "spotify" && tokens.accessToken.startsWith("code:")) {
    const code = tokens.accessToken.slice(5);
    const verifier = getSpotifyPkceVerifier();
    if (!verifier) throw new Error("Session Spotify expirée — réessayez");
    const exchanged = await exchangeSpotifyCode(code, verifier);
    clearSpotifyPkce();
    tokens = {
      provider: "spotify",
      accessToken: exchanged.accessToken,
      refreshToken: exchanged.refreshToken,
      expiresAt: exchanged.expiresAt,
    };
  }

  setProviderToken(provider, tokens);
  stopOAuthServer();
  return { ok: true, streaming: getStreamingStatus() };
}

app.whenReady().then(() => {
  loadEnvFile();
  applyStreamingConfig();
  configureAppIcon();
  copyElectronData();
  initAuth();
  loadSessionFromDisk();
  initRolengamos();
  startRoomServer();
  createWindow();

  ipcMain.handle("auth:register", (_e, email: string, password: string, name: string) =>
    registerUser(email, password, name)
  );
  ipcMain.handle("auth:login", (_e, email: string, password: string) => loginUser(email, password));
  ipcMain.handle("auth:logout", () => logoutUser());
  ipcMain.handle("auth:me", () => getCurrentAuth());

  ipcMain.handle("oauth:start", async (_e, provider: OAuthProvider) => {
    try {
      if (!getCurrentAuth()) return { ok: false, error: "Connectez-vous d'abord à Tempo" };
      return await runOAuth(provider);
    } catch (err) {
      stopOAuthServer();
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  });
  ipcMain.handle("oauth:status", () => getStreamingStatus());
  ipcMain.handle("oauth:credentials", () => streamingCredentialsStatus());
  ipcMain.handle("oauth:getStreamingConfig", () => getStreamingConfigForUi());
  ipcMain.handle(
    "oauth:saveStreamingConfig",
    (_e, cfg: { spotifyClientId?: string; spotifyClientSecret?: string; deezerAppId?: string }) => {
      saveStreamingConfig(cfg);
      return { ok: true, credentials: streamingCredentialsStatus() };
    }
  );

  ipcMain.handle("music:search", (_e, q: string, type: string) => searchMusic(q, type as "all"));
  ipcMain.handle("deezer:searchPlaylists", (_e, q: string) => searchDeezerPlaylists(q));
  ipcMain.handle("deezer:playlistTracks", (_e, id: string) => getDeezerPlaylistTracks(id));
  ipcMain.handle("deezer:artistTracks", (_e, id: string) => getDeezerArtistTracks(id));
  ipcMain.handle("deezer:chartTracks", () => getDeezerChartTracks());
  ipcMain.handle("spotify:playlistTracks", (_e, id: string) => getSpotifyPlaylistTracks(id));

  ipcMain.handle("rolengamos:validate", (_e, from: string, to: string) => validateFeaturing(from, to));
  ipcMain.handle("rolengamos:startArtist", () => getRandomStartArtist());
  ipcMain.handle("rolengamos:collaborators", (_e, artist: string) => getCollaborators(artist));
  ipcMain.handle("rolengamos:aiPick", (_e, from: string, difficulty: string, used: string[]) =>
    pickAiMove(from, difficulty as "facile" | "normal" | "difficile", new Set(used))
  );
  ipcMain.handle("rolengamos:choices", (_e, from: string, used: string[]) =>
    getRolengamosChoices(from, new Set(used))
  );
  ipcMain.handle("rolengamos:collabPreview", (_e, a: string, b: string) => findCollabPreview(a, b));

  ipcMain.handle("favorites:add", (_e, provider: "spotify" | "deezer", track: unknown) =>
    addTrackToFavorites(provider, track as Parameters<typeof addTrackToFavorites>[1])
  );

  ipcMain.handle("manager:users", () => listUsersForManager());
  ipcMain.handle("manager:updateScore", (_e, userId: string, xp: number, level: number) =>
    updateUserScore(userId, xp, level)
  );
  ipcMain.handle("manager:logs", () => getSystemLogs());
  ipcMain.handle("room:info", () => getRoomServerInfo());

  ipcMain.handle("shell:openExternal", (_e, url: string) => shell.openExternal(url));

  ipcMain.handle("app:getReleaseInfo", () => getReleaseInfo());
  ipcMain.handle("app:openReleaseFolder", () => {
    const { releaseDir } = getReleaseInfo();
    if (!fs.existsSync(releaseDir)) {
      return { ok: false, message: `Dossier absent. Lancez : npm run dist:win` };
    }
    shell.openPath(releaseDir);
    return { ok: true, message: `Dossier ouvert : ${releaseDir}` };
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopOAuthServer();
  stopRoomServer();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  stopOAuthServer();
  stopRoomServer();
});