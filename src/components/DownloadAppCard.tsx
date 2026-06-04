import { useEffect, useState } from "react";
import { Download, FolderOpen, Monitor, Package } from "lucide-react";

type ReleaseInfo = {
  isPackaged: boolean;
  releaseDir: string;
  installers: { name: string; path: string }[];
  hasRelease: boolean;
};

export function DownloadAppCard() {
  const [info, setInfo] = useState<ReleaseInfo | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (window.tempo?.app?.getReleaseInfo) {
      window.tempo.app.getReleaseInfo().then(setInfo).catch(() => undefined);
    }
  }, []);

  async function openFolder() {
    if (!window.tempo?.app?.openReleaseFolder) return;
    const res = await window.tempo.app.openReleaseFolder();
    setMsg(res.message);
  }

  return (
    <section className="arena-card border-tempo-violet/50">
      <p className="mb-3 flex items-center gap-2 font-display font-bold text-tempo-violet">
        <Download size={20} /> Télécharger Tempo
      </p>

      {info?.isPackaged ? (
        <div className="flex items-start gap-3 text-sm text-slate-300">
          <Monitor className="shrink-0 text-emerald-400" size={22} />
          <div>
            <p className="font-semibold text-emerald-400">Application desktop installée</p>
            <p className="mt-1 text-slate-400">
              Vous jouez déjà avec l&apos;app Tempo. Partagez l&apos;installateur ci-dessous à vos amis pour qu&apos;ils
              rejoignent vos salons en ligne.
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-400">
          Mode développement : lancez via le raccourci Bureau ou <code className="text-tempo-orange">npm run start</code>
          . Générez l&apos;installateur Windows pour distribuer le jeu.
        </p>
      )}

      {info?.hasRelease && info.installers.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {info.installers.map((f) => (
            <li key={f.path} className="flex items-center gap-2 rounded-lg border border-tempo-border bg-tempo-dark/60 px-3 py-2 text-sm">
              <Package size={16} className="text-tempo-orange" />
              <span className="flex-1 truncate">{f.name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-amber-400">
          Aucun installateur dans <code>release/</code> — exécutez{" "}
          <code className="text-tempo-blue">npm run dist:win</code> dans le dossier du projet (une fois).
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-violet flex items-center gap-2 text-sm" onClick={openFolder}>
          <FolderOpen size={16} /> Ouvrir le dossier release
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Site de téléchargement :{" "}
        <button
          type="button"
          className="text-tempo-blue underline"
          onClick={() =>
            window.tempo?.shell?.openExternal("https://joeltmm.github.io/Tempo/")
          }
        >
          joeltmm.github.io/Tempo
        </button>
      </p>
      {msg && <p className="mt-2 text-xs text-tempo-blue">{msg}</p>}
    </section>
  );
}