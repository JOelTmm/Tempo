import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cloud, Download, Gamepad2, Globe, Music2, Wifi } from "lucide-react";
import { MultiplayerLobby } from "../components/MultiplayerLobby";
import { isSupabaseConfigured } from "../lib/supabase-config";
import { setPendingOnlineGame } from "../lib/multiplayer-session";
import type { GameRoomClient, RoomState } from "../lib/multiplayer";
import type { RoomGame } from "../vite-env";

const GAMES: { id: RoomGame; title: string; path: string; icon: typeof Music2; desc: string }[] = [
  { id: "rolengamos", title: "Rolengamos", path: "/rolengamos", icon: Gamepad2, desc: "Featurings en temps réel" },
  { id: "flashquiz", title: "Quiz Musical", path: "/flashquiz", icon: Music2, desc: "Blind test à plusieurs (salon partagé)" },
];

export function OnlineArena() {
  const navigate = useNavigate();
  const [game, setGame] = useState<RoomGame>("rolengamos");
  const supabaseOk = isSupabaseConfigured();

  function onRoomReady(client: GameRoomClient, room: RoomState) {
    const meta = GAMES.find((g) => g.id === game);
    setPendingOnlineGame({ game, room, client });
    if (meta) navigate(`${meta.path}?online=1`);
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <section className="text-center">
        <Globe className="mx-auto mb-3 text-tempo-blue" size={40} />
        <h1 className="font-display text-3xl font-bold text-gradient-tempo">Arène en ligne</h1>
        <p className="mt-2 text-slate-400">
          Créez un salon, partagez le code — vos amis peuvent jouer depuis n&apos;importe où.
        </p>
      </section>

      <div className="arena-card border-tempo-blue/50">
        {supabaseOk ? (
          <p className="flex items-center justify-center gap-2 text-sm text-emerald-400">
            <Cloud size={18} /> Mode Internet actif (Supabase Realtime)
          </p>
        ) : (
          <p className="flex items-center justify-center gap-2 text-sm text-amber-400">
            <Wifi size={18} /> Supabase non configuré — salons locaux uniquement (même Wi‑Fi). Voir{" "}
            <code className="text-xs">docs/SUPABASE_SETUP.md</code>
          </p>
        )}
        <p className="mt-2 text-center text-xs text-slate-500">
          Compte Tempo requis — connectez-vous pour synchroniser scores et salons.
        </p>
      </div>

      <div>
        <p className="mb-3 text-xs uppercase text-slate-500">Choisir le jeu en ligne</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {GAMES.map(({ id, title, desc, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`arena-card text-left ${game === id ? "ring-2 ring-tempo-orange" : ""}`}
              onClick={() => setGame(id)}
            >
              <Icon className={`mb-2 ${game === id ? "text-tempo-orange" : "text-tempo-blue"}`} size={24} />
              <p className="font-display font-bold">{title}</p>
              <p className="text-sm text-slate-400">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      <MultiplayerLobby game={game} onRoomReady={onRoomReady} />

      <div className="flex flex-wrap gap-3 justify-center text-sm">
        <Link to="/" className="text-tempo-blue underline">
          ← Retour à l&apos;accueil
        </Link>
        <Link to="/arena" className="text-slate-400 underline">
          Mode solo / IA
        </Link>
      </div>

      <div className="arena-card border-tempo-violet/40 text-center text-sm text-slate-400">
        <Download className="mx-auto mb-2 text-tempo-violet" size={22} />
        <p>
          Invitez des amis sans Tempo installé ? Ils peuvent{" "}
          <Link to="/" className="text-tempo-orange underline">
            télécharger l&apos;application
          </Link>{" "}
          depuis l&apos;accueil, puis rejoindre avec le même code salon.
        </p>
      </div>
    </div>
  );
}