import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Headphones, LogOut, Music2, Radio, Shield, Sparkles, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { DownloadAppCard } from "../components/DownloadAppCard";
import { HubSoundscape } from "../components/HubSoundscape";
import { NeonBackground } from "../components/NeonBackground";
import { isSupabaseConfigured } from "../lib/supabase-config";

export function Dashboard() {
  const { user, logout, refresh, isManager } = useAuth();
  const [oauthMsg, setOauthMsg] = useState("");
  const [streaming, setStreaming] = useState({ spotify: false, deezer: false });
  const [credentials, setCredentials] = useState({ spotifyOk: false, deezerOk: false });
  const [showKeys, setShowKeys] = useState(false);
  const [spotifyId, setSpotifyId] = useState("");
  const [spotifySecret, setSpotifySecret] = useState("");
  const [deezerId, setDeezerId] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [hoverPreview, setHoverPreview] = useState<string | undefined>();

  useEffect(() => {
    window.tempo.oauth.status().then(setStreaming);
    window.tempo.oauth.credentials().then(setCredentials);
    window.tempo.oauth.getStreamingConfig().then((c) => {
      setSpotifyId(c.spotifyClientId || "");
      setSpotifySecret(c.spotifyClientSecret || "");
      setDeezerId(c.deezerAppId || "");
      if (!c.spotifyClientId && !c.deezerAppId) setShowKeys(true);
    });
  }, [user]);

  async function saveStreamingKeys() {
    setSaveMsg("Enregistrement…");
    const res = await window.tempo.oauth.saveStreamingConfig({
      spotifyClientId: spotifyId,
      spotifyClientSecret: spotifySecret,
      deezerAppId: deezerId,
    });
    if (res.ok) {
      setCredentials(res.credentials);
      setSaveMsg("Clés enregistrées — vous pouvez connecter Spotify / Deezer");
    } else setSaveMsg("Erreur enregistrement");
  }

  async function connect(provider: "spotify" | "deezer") {
    if (provider === "deezer") {
      setOauthMsg(
        "Deezer : API catalogue active sans compte (recherche, playlists, Top France). Connexion compte Deezer indisponible tant que Deezer ne crée plus d'apps."
      );
      return;
    }
    setOauthMsg(`Connexion ${provider}…`);
    const res = await window.tempo.oauth.start(provider);
    if (res.ok) {
      setOauthMsg(`${provider} lié ✓`);
      setStreaming(await window.tempo.oauth.status());
      await refresh();
    } else setOauthMsg(res.error || "Échec");
  }

  const xpPct = user ? Math.min(100, (user.xp / (user.level * 200)) * 100) : 0;

  const arenas = [
    {
      to: "/flashquiz",
      title: "Quiz Musical",
      desc: "Blind test + samples",
      icon: Music2,
      color: "text-tempo-blue border-tempo-blue",
      preview: "hit france 2024",
    },
    {
      to: "/rolengamos",
      title: "Rolengamos",
      desc: "Featurings — IA & en ligne",
      icon: Zap,
      color: "text-tempo-orange border-tempo-orange",
      preview: "drake feat",
    },
    {
      to: "/pixelcover",
      title: "PixelCover",
      desc: "Pochette pixel 15s",
      icon: Sparkles,
      color: "text-tempo-violet border-tempo-violet",
      preview: "daft punk",
    },

    {
      to: "/speed-lyrics",
      title: "Speed Lyrics",
      desc: "Trou + coupure audio",
      icon: Headphones,
      color: "text-tempo-violet border-tempo-violet",
      preview: "indochine",
    },
  ];

  return (
    <>
      <NeonBackground />
      <HubSoundscape previewQuery={hoverPreview} />
      <section className="animate-slide-up text-center">
        <img
          src="./logo-tempo.jfif"
          alt="Tempo"
          className="relative mx-auto mb-4 h-32 w-32 animate-float rounded-full object-cover ring-4 ring-tempo-orange"
        />
        <h1 className="font-display text-4xl font-black">
          <span className="text-tempo-orange">Votre</span> <span className="text-gradient-tempo">Arène Musicale</span>
        </h1>
        <p className="mt-2 text-lg text-slate-300">Connectez. Jouez. Découvrez.</p>
        <p className="mt-1 text-sm text-slate-500">Jeu en ligne + application desktop téléchargeable</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link to="/online" className="arena-card group border-tempo-blue/60 ring-1 ring-tempo-blue/30">
          <Globe className="mb-2 text-tempo-blue" size={28} />
          <h3 className="font-display text-xl font-bold">Jouer en ligne</h3>
          <p className="mt-1 text-sm text-slate-400">
            Salons multijoueur — code à partager, sync {isSupabaseConfigured() ? "Internet (Supabase)" : "local (Wi‑Fi)"}
          </p>
        </Link>
        <DownloadAppCard />
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="arena-card flex items-center gap-4">
          <span className="text-4xl">🎧</span>
          <div className="flex-1">
            <p className="font-display text-lg font-bold">{user?.displayName}</p>
            <p className="text-sm text-tempo-blue">
              Niveau {user?.level} — {user?.xp} XP
              {isManager && <span className="ml-2 text-tempo-orange">• Manager</span>}
            </p>
            <div className="progress-neon mt-2">
              <span style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        </div>
        <div className="arena-card space-y-2">
          <p className="text-xs uppercase text-slate-500">Streaming (les deux en même temps)</p>
          <button type="button" className="btn-neon w-full text-sm" onClick={() => connect("spotify")}>
            Spotify {streaming.spotify ? "✓" : "+"}
          </button>
          <button
            type="button"
            className="btn-orange w-full text-sm flex items-center justify-center gap-2"
            onClick={() => connect("deezer")}
          >
            <Radio size={14} /> Deezer catalogue ✓
          </button>
          <p className="text-xs text-emerald-400/90">
            Deezer : recherche & jeux OK via API publique. Spotify+ pour votre bibliothèque.
          </p>
          {oauthMsg && <p className="text-xs text-slate-400">{oauthMsg}</p>}

          <button
            type="button"
            className="w-full text-xs text-tempo-blue underline"
            onClick={() => setShowKeys((s) => !s)}
          >
            {showKeys ? "Masquer" : "Configurer"} les clés API (sans fichier .env)
          </button>

          {showKeys && (
            <div className="space-y-2 rounded-lg border border-tempo-border bg-tempo-dark/80 p-3">
              <p className="text-xs text-slate-400">
                Spotify Dashboard → Redirect URI (copier exactement) :{" "}
                <code className="text-tempo-orange">http://127.0.0.1:3000/callback</code>
                <span className="block mt-1 text-amber-400/90">
                  Pas localhost — Spotify refuse. Deezer : création d&apos;apps fermée ; la recherche Deezer fonctionne sans compte.
                </span>
              </p>
              <input
                className="w-full rounded-lg border border-tempo-border bg-tempo-panel px-3 py-2 text-sm"
                placeholder="Spotify Client ID"
                value={spotifyId}
                onChange={(e) => setSpotifyId(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-tempo-border bg-tempo-panel px-3 py-2 text-sm"
                placeholder="Spotify Client Secret (optionnel)"
                value={spotifySecret}
                onChange={(e) => setSpotifySecret(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-tempo-border bg-tempo-panel px-3 py-2 text-sm"
                placeholder="Deezer App ID"
                value={deezerId}
                onChange={(e) => setDeezerId(e.target.value)}
              />
              <button type="button" className="btn-neon w-full text-sm" onClick={saveStreamingKeys}>
                Enregistrer les clés
              </button>
              {saveMsg && <p className="text-xs text-emerald-400">{saveMsg}</p>}
            </div>
          )}

          {!credentials.spotifyOk && !showKeys && (
            <p className="text-xs text-amber-400">Spotify : cliquez « Configurer les clés API » ci-dessus.</p>
          )}
          {!credentials.deezerOk && !showKeys && (
            <p className="text-xs text-amber-400">Deezer : même chose (sinon erreur Unknown app_id).</p>
          )}
        </div>
      </section>

      {isManager && (
        <Link to="/manager" className="btn-orange mt-4 inline-flex items-center gap-2">
          <Shield size={18} /> Dashboard Manager
        </Link>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {arenas.map(({ to, title, desc, icon: Icon, color, preview }) => (
          <Link
            key={to}
            to={to}
            className="arena-card group"
            onMouseEnter={() => setHoverPreview(preview)}
            onFocus={() => setHoverPreview(preview)}
          >
            <div className={`mb-3 inline-flex rounded-xl border p-3 ${color}`}>
              <Icon size={24} />
            </div>
            <h3 className="font-display text-lg font-bold">{title}</h3>
            <p className="mt-1 text-sm text-slate-400">{desc}</p>
          </Link>
        ))}
      </section>

      <button type="button" className="mt-6 flex items-center gap-2 text-sm text-slate-500 hover:text-white" onClick={() => logout()}>
        <LogOut size={14} /> Déconnexion
      </button>
    </>
  );
}