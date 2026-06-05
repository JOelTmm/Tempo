import { Link } from "react-router-dom";
import { Cloud, Download, Globe } from "lucide-react";
import { FriendSalon } from "../components/FriendSalon";
import { isSupabaseConfigured } from "../lib/supabase-config";

export function OnlineArena() {
  const supabaseOk = isSupabaseConfigured();

  return (
    <div className="space-y-8 animate-slide-up">
      <section className="text-center">
        <Globe className="mx-auto mb-3 text-tempo-blue" size={40} />
        <h1 className="font-display text-3xl font-bold text-gradient-tempo">Arène en ligne</h1>
        <p className="mt-2 text-slate-400">
          Ajoutez des amis, créez un salon, choisissez le jeu ensemble — jouez à distance.
        </p>
      </section>

      <div className="arena-card border-tempo-blue/50">
        {supabaseOk ? (
          <p className="flex items-center justify-center gap-2 text-sm text-emerald-400">
            <Cloud size={18} /> Internet actif — même code salon sur tous les PC Tempo
          </p>
        ) : (
          <p className="text-center text-sm text-amber-400">Configuration multijoueur en cours de chargement…</p>
        )}
        <p className="mt-2 text-center text-xs text-slate-500">
          Chaque joueur doit être connecté avec son compte. L&apos;hôte lance le jeu quand tout le monde est dans le salon.
        </p>
      </div>

      <FriendSalon />

      <div className="arena-card border-tempo-violet/40 text-center text-sm text-slate-400">
        <Download className="mx-auto mb-2 text-tempo-violet" size={22} />
        <p>
          Votre ami doit installer Tempo sur un <strong>PC Windows</strong> et se connecter avec son email, puis rejoindre
          avec le <strong>code salon</strong>.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center text-sm">
        <Link to="/" className="text-tempo-blue underline">
          ← Accueil
        </Link>
        <Link to="/arena" className="text-slate-400 underline">
          Mode solo / IA
        </Link>
      </div>
    </div>
  );
}