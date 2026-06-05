import { app, BrowserWindow, ipcMain } from "electron";
import { autoUpdater } from "electron-updater";

const GITHUB = { owner: "JOelTmm", repo: "Tempo" };

export function registerAutoUpdate(mainWindow: () => BrowserWindow | null) {
  if (!app.isPackaged) {
    ipcMain.handle("app:checkForUpdates", async () => ({
      ok: true,
      status: "dev",
      message: "Mises à jour auto en mode développement uniquement sur la version installée.",
    }));
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.setFeedURL({
    provider: "github",
    owner: GITHUB.owner,
    repo: GITHUB.repo,
  });

  autoUpdater.on("update-downloaded", () => {
    const win = mainWindow();
    win?.webContents.send("app:update-ready", {
      version: autoUpdater.currentVersion.version,
    });
  });

  ipcMain.handle("app:checkForUpdates", async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      const v = result?.updateInfo?.version;
      return {
        ok: true,
        status: v ? "available" : "current",
        message: v ? `Mise à jour ${v} trouvée — téléchargement…` : "Vous avez la dernière version.",
        version: v,
      };
    } catch (err) {
      return {
        ok: false,
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      };
    }
  });

  ipcMain.handle("app:installUpdate", () => {
    autoUpdater.quitAndInstall(false, true);
    return { ok: true };
  });

  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(() => undefined);
  }, 8000);
}