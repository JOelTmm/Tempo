import { app, nativeImage } from "electron";
import fs from "node:fs";
import path from "node:path";

export function resolveIconPath(): string | undefined {
  const names = ["logo-tempo.ico", "logo-tempo.png"];
  const bases = [
    path.join(process.cwd(), "public"),
    path.join(__dirname, "..", "public"),
    path.join(app.getAppPath(), "public"),
  ];

  for (const base of bases) {
    for (const name of names) {
      const p = path.join(base, name);
      if (fs.existsSync(p)) return p;
    }
  }
  const jfif = path.join(process.cwd(), "public", "logo-tempo.jfif");
  if (fs.existsSync(jfif)) return jfif;
  return undefined;
}

export function getAppIcon() {
  const iconPath = resolveIconPath();
  if (!iconPath) return undefined;
  const image = nativeImage.createFromPath(iconPath);
  return image.isEmpty() ? undefined : image;
}

export function configureAppIcon() {
  if (process.platform === "win32") {
    app.setAppUserModelId("com.laplateforme.tempo");
  }
}