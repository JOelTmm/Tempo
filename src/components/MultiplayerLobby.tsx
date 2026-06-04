import { useState } from "react";
import { Cloud, Copy, Globe, Users, Wifi } from "lucide-react";
import { createGameRoom, joinGameRoom } from "../lib/create-game-room";
import { isSupabaseConfigured } from "../lib/supabase-config";
import type { GameRoomClient, RoomState } from "../lib/multiplayer";
import type { RoomGame } from "../vite-env";
import { useAuth } from "../context/AuthContext";

interface Props {
  game: RoomGame;
  onRoomReady: (client: GameRoomClient, room: RoomState) => void;
}

export function MultiplayerLobby({ game, onRoomReady }: Props) {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"supabase" | "local" | null>(null);
  const supabaseOk = isSupabaseConfigured();

  async function host() {
    setLoading(true);
    setStatus("Création du salon…");
    try {
      const { client, room } = await createGameRoom(
        game,
        user?.displayName || "Hôte",
        crypto.randomUUID(),
        true
      );
      setMode(client.mode);
      setCode(room.code);
      setStatus(
        client.mode === "supabase"
          ? `Salon Internet ${room.code} — partagez le code à votre ami (n'importe où)`
          : `Salon local ${room.code} — même réseau Wi‑Fi`
      );
      onRoomReady(client, room);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function join() {
    if (!code.trim()) return;
    setLoading(true);
    setStatus("Connexion…");
    try {
      const { client, room } = await joinGameRoom(
        code.trim(),
        user?.displayName || "Joueur",
        crypto.randomUUID(),
        true
      );
      setMode(client.mode);
      setStatus(`Connecté — salon ${room.code}`);
      onRoomReady(client, room);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="arena-card space-y-3 border-tempo-blue/40">
      <p className="flex items-center gap-2 text-sm font-semibold text-tempo-blue">
        <Globe size={16} /> Multijoueur en ligne
      </p>

      {supabaseOk ? (
        <p className="flex items-center gap-2 text-xs text-emerald-400">
          <Cloud size={14} /> Mode Internet : Supabase actif — jouez à distance
        </p>
      ) : (
        <p className="flex items-center gap-2 text-xs text-amber-400">
          <Wifi size={14} /> Supabase non configuré — salon local uniquement (voir docs/SUPABASE_SETUP.md)
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-neon flex items-center gap-2" onClick={host} disabled={loading}>
          <Users size={16} /> Créer un salon
        </button>
        <input
          className="w-28 rounded-lg border border-tempo-border bg-tempo-dark px-3 py-2 uppercase"
          placeholder="CODE"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button type="button" className="btn-violet" onClick={join} disabled={loading}>
          Rejoindre
        </button>
        {code && (
          <button
            type="button"
            className="btn-orange flex items-center gap-1 text-sm"
            onClick={() => navigator.clipboard.writeText(code)}
          >
            <Copy size={14} /> Copier
          </button>
        )}
      </div>
      {status && <p className="text-xs text-slate-400">{status}</p>}
      {mode === "supabase" && <p className="text-xs text-emerald-400">Sync temps réel via Supabase</p>}
      {mode === "local" && <p className="text-xs text-slate-500">Sync WebSocket local (port 9876)</p>}
    </div>
  );
}