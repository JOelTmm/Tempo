import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

export function getProjectRoot() {
  if (app.isPackaged) {
    return path.dirname(app.getPath("exe"));
  }
  return process.cwd();
}

export function getReleaseInfo() {
  const releaseDir = path.join(getProjectRoot(), "release");
  let installers: { name: string; path: string }[] = [];
  let hasRelease = false;

  if (fs.existsSync(releaseDir)) {
    hasRelease = true;
    const names = fs.readdirSync(releaseDir);
    installers = names
      .filter((n) => /\.(exe|msi|zip)$/i.test(n))
      .map((name) => ({ name, path: path.join(releaseDir, name) }));
  }

  return {
    isPackaged: app.isPackaged,
    releaseDir,
    installers,
    hasRelease: hasRelease && installers.length > 0,
  };
}