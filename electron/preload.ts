import { contextBridge, ipcRenderer } from "electron";

const tempo = {
  auth: {
    register: (email: string, password: string, name: string) =>
      ipcRenderer.invoke("auth:register", email, password, name),
    login: (email: string, password: string) => ipcRenderer.invoke("auth:login", email, password),
    logout: () => ipcRenderer.invoke("auth:logout"),
    me: () => ipcRenderer.invoke("auth:me"),
  },
  oauth: {
    start: (provider: "spotify" | "deezer") => ipcRenderer.invoke("oauth:start", provider),
    status: () => ipcRenderer.invoke("oauth:status"),
    credentials: () =>
      ipcRenderer.invoke("oauth:credentials") as Promise<{ spotifyOk: boolean; deezerOk: boolean }>,
    getStreamingConfig: () =>
      ipcRenderer.invoke("oauth:getStreamingConfig") as Promise<{
        spotifyClientId: string;
        spotifyClientSecret: string;
        deezerAppId: string;
      }>,
    saveStreamingConfig: (cfg: {
      spotifyClientId?: string;
      spotifyClientSecret?: string;
      deezerAppId?: string;
    }) => ipcRenderer.invoke("oauth:saveStreamingConfig", cfg),
  },
  music: {
    search: (q: string, type?: string) => ipcRenderer.invoke("music:search", q, type || "all"),
    playlistTracks: (source: string, id: string) =>
      source === "spotify"
        ? ipcRenderer.invoke("spotify:playlistTracks", id)
        : ipcRenderer.invoke("deezer:playlistTracks", id),
    artistTracks: (id: string) => ipcRenderer.invoke("deezer:artistTracks", id),
    chartTracks: () => ipcRenderer.invoke("deezer:chartTracks"),
  },
  deezer: {
    searchPlaylists: (q: string) => ipcRenderer.invoke("deezer:searchPlaylists", q),
    playlistTracks: (id: string) => ipcRenderer.invoke("deezer:playlistTracks", id),
    chartTracks: () => ipcRenderer.invoke("deezer:chartTracks"),
  },
  rolengamos: {
    validate: (from: string, to: string) => ipcRenderer.invoke("rolengamos:validate", from, to),
    startArtist: () => ipcRenderer.invoke("rolengamos:startArtist"),
    aiPick: (from: string, difficulty: string, used: string[]) =>
      ipcRenderer.invoke("rolengamos:aiPick", from, difficulty, used),
    choices: (from: string, used: string[]) => ipcRenderer.invoke("rolengamos:choices", from, used),
    collaborators: (artist: string) => ipcRenderer.invoke("rolengamos:collaborators", artist) as Promise<string[]>,
    collabPreview: (from: string, to: string) =>
      ipcRenderer.invoke("rolengamos:collabPreview", from, to) as Promise<{
        previewUrl: string;
        title: string;
        artist: string;
      } | null>,
  },
  favorites: {
    add: (provider: "spotify" | "deezer", track: unknown) =>
      ipcRenderer.invoke("favorites:add", provider, track),
  },
  manager: {
    users: () => ipcRenderer.invoke("manager:users"),
    updateScore: (userId: string, xp: number, level: number) =>
      ipcRenderer.invoke("manager:updateScore", userId, xp, level),
    logs: () => ipcRenderer.invoke("manager:logs"),
  },
  room: {
    info: () => ipcRenderer.invoke("room:info"),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke("shell:openExternal", url),
  },
  app: {
    getReleaseInfo: () =>
      ipcRenderer.invoke("app:getReleaseInfo") as Promise<{
        isPackaged: boolean;
        releaseDir: string;
        installers: { name: string; path: string }[];
        hasRelease: boolean;
      }>,
    openReleaseFolder: () =>
      ipcRenderer.invoke("app:openReleaseFolder") as Promise<{ ok: boolean; message: string }>,
    checkForUpdates: () =>
      ipcRenderer.invoke("app:checkForUpdates") as Promise<{
        ok: boolean;
        status: string;
        message: string;
        version?: string;
      }>,
    installUpdate: () => ipcRenderer.invoke("app:installUpdate") as Promise<{ ok: boolean }>,
    onUpdateReady: (fn: (data: { version: string }) => void) => {
      const handler = (_: unknown, data: { version: string }) => fn(data);
      ipcRenderer.on("app:update-ready", handler);
      return () => ipcRenderer.removeListener("app:update-ready", handler);
    },
  },
};

contextBridge.exposeInMainWorld("tempo", tempo);

export type TempoAPI = typeof tempo;