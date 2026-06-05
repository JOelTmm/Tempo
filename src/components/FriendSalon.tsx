import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Gamepad2, Music2, UserPlus, Users } from "lucide-react";
import { createGameRoom, joinGameRoom } from "../lib/create-game-room";
import { addFriend, listFriends, removeFriend, type FriendRow } from "../lib/friends";
import { isSupabaseConfigured } from "../lib/supabase-config";
import { setPendingOnlineGame } from "../lib/multiplayer-session";
import type { GameRoomClient, RoomState } from "../lib/multiplayer";
import type { PlayableRoomGame } from "../vite-env";
import { useAuth } from "../context/AuthContext";

const PLAYABLE: {
  id: PlayableRoomGame;
  title: string;
  path: string;
  icon: typeof Music2;
  online: boolean;
}[] = [
  { id: "rolengamos", title: "Rolengamos", path: "/rolengamos", icon: Gamepad2, online: true },
  { id: "flashquiz", title: "Quiz musical", path: "/flashquiz", icon: Music2, online: true },
  { id: "pixelcover", title: "PixelCover", path: "/pixelcover", icon: Gamepad2, online: false },
  { id: "speedlyrics", title: "Speed Lyrics", path: "/speedlyrics", icon: Music2, online: false },
];

export function FriendSalon() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const supabaseOk = isSupabaseConfigured();
  const playerId = user?.userId || "";
  const playerName = user?.displayName || "Joueur";

  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [friendEmail, setFriendEmail] = useState("");
  const [friendMsg, setFriendMsg] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [client, setClient] = useState<GameRoomClient | null>(null);
  const [pickGame, setPickGame] = useState<PlayableRoomGame>("rolengamos");
  const launchedRef = useRef(false);

  const isHost = room && playerId && room.hostId === playerId;

  const refreshFriends = useCallback(async () => {
    if (!user?.email || !supabaseOk) return;
    try {
      setFriends(await listFriends(user.email));
    } catch (e) {
      setFriendMsg(e instanceof Error ? e.message : "Erreur amis");
    }
  }, [user?.email, supabaseOk]);

  useEffect(() => {
    refreshFriends();
  }, [refreshFriends]);

  useEffect(() => {
    if (!client) return;
    const off = client.onRoomUpdate((r) => {
      setRoom(r);
      if (r.game !== "lobby" && r.payload.phase === "launch" && !launchedRef.current) {
        launchedRef.current = true;
        const meta = PLAYABLE.find((g) => g.id === r.game);
        if (meta?.online) {
          setPendingOnlineGame({ game: r.game, room: r, client });
          navigate(`${meta.path}?online=1`);
        }
      }
    });
    return off;
  }, [client, navigate]);

  async function onAddFriend() {
    if (!user?.email) {
      setFriendMsg("Connectez-vous pour ajouter des amis");
      return;
    }
    setLoading(true);
    try {
      await addFriend(user.email, friendEmail, friendEmail.split("@")[0]);
      setFriendEmail("");
      setFriendMsg("Ami ajouté — invitez-le avec le code salon");
      await refreshFriends();
    } catch (e) {
      setFriendMsg(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function hostLobby() {
    if (!playerId) {
      setStatus("Connectez-vous avec un compte Tempo");
      return;
    }
    setLoading(true);
    launchedRef.current = false;
    setStatus("Création du salon…");
    try {
      const { client: c, room: r } = await createGameRoom("lobby", playerName, playerId, true);
      setClient(c);
      setRoom(r);
      setCode(r.code);
      setStatus(`Salon ${r.code} — partagez ce code (Internet)`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function joinLobby() {
    if (!playerId || !code.trim()) return;
    setLoading(true);
    launchedRef.current = false;
    try {
      const { client: c, room: r } = await joinGameRoom(code.trim(), playerName, playerId, true);
      setClient(c);
      setRoom(r);
      setCode(r.code);
      setStatus(`Connecté au salon ${r.code}`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function launchGame() {
    if (!client || !isHost || !room) return;
    const meta = PLAYABLE.find((g) => g.id === pickGame);
    if (!meta?.online) {
      setStatus("Ce jeu n'est pas encore en multijoueur — lancez-le en solo");
      return;
    }
    setLoading(true);
    try {
      let payload: Record<string, unknown> = { hostName: playerName };
      if (pickGame === "rolengamos") {
        const start = await window.tempo.rolengamos.startArtist();
        payload = {
          ...payload,
          start,
          current: start,
          turnIndex: 0,
          used: [start.trim().toLowerCase()],
          history: [start],
        };
      }
      await client.setGame?.(pickGame, payload);
      setStatus(`Lancement ${meta.title}…`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Erreur lancement");
    } finally {
      setLoading(false);
    }
  }

  if (!supabaseOk) {
    return (
      <p className="text-sm text-amber-400">
        Multijoueur Internet indisponible sur cette installation. Réinstallez la dernière version Tempo ou contactez le
        développeur.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <section className="arena-card border-tempo-violet/40">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-tempo-violet">
          <UserPlus size={16} /> Amis (par email Tempo)
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            className="min-w-[200px] flex-1 rounded-lg border border-tempo-border bg-tempo-dark px-3 py-2 text-sm"
            placeholder="email@exemple.com"
            value={friendEmail}
            onChange={(e) => setFriendEmail(e.target.value)}
          />
          <button type="button" className="btn-violet text-sm" onClick={onAddFriend} disabled={loading}>
            Ajouter
          </button>
        </div>
        {friendMsg && <p className="mt-2 text-xs text-slate-400">{friendMsg}</p>}
        {friends.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {friends.map((f) => (
              <li key={f.id} className="flex items-center justify-between rounded border border-tempo-border/60 px-2 py-1">
                <span>
                  {f.friend_name} <span className="text-xs text-slate-500">({f.friend_email})</span>
                </span>
                <button type="button" className="text-xs text-rose-400" onClick={() => removeFriend(f.id).then(refreshFriends)}>
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="arena-card border-tempo-blue/40 space-y-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-tempo-blue">
          <Users size={16} /> Salon commun
        </p>
        {!room ? (
          <>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-neon" onClick={hostLobby} disabled={loading || !user}>
                Créer un salon
              </button>
              <input
                className="w-28 rounded-lg border border-tempo-border bg-tempo-dark px-3 py-2 uppercase"
                placeholder="CODE"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button type="button" className="btn-violet" onClick={joinLobby} disabled={loading || !user}>
                Rejoindre
              </button>
            </div>
            {!user && <p className="text-xs text-amber-400">Connectez-vous pour jouer en ligne à distance.</p>}
          </>
        ) : (
          <>
            <p className="text-lg font-display font-bold text-tempo-orange">
              Code salon : {room.code}
              <button
                type="button"
                className="ml-2 inline-flex text-tempo-blue"
                onClick={() => navigator.clipboard.writeText(room.code)}
              >
                <Copy size={16} />
              </button>
            </p>
            <p className="text-sm text-slate-400">
              Joueurs ({room.players.length}) : {room.players.map((p) => p.name).join(", ")}
            </p>
            {isHost ? (
              <>
                <p className="text-xs uppercase text-slate-500">Vous êtes l&apos;hôte — choisissez le jeu</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PLAYABLE.map(({ id, title, icon: Icon, online }) => (
                    <button
                      key={id}
                      type="button"
                      className={`arena-card text-left text-sm ${pickGame === id ? "ring-2 ring-tempo-orange" : ""}`}
                      onClick={() => setPickGame(id)}
                    >
                      <Icon size={18} className="mb-1 text-tempo-blue" />
                      {title}
                      {!online && <span className="ml-1 text-xs text-slate-500">(solo)</span>}
                    </button>
                  ))}
                </div>
                <button type="button" className="btn-orange w-full sm:w-auto" onClick={launchGame} disabled={loading}>
                  Lancer la partie pour tout le salon
                </button>
              </>
            ) : (
              <p className="text-sm text-emerald-400">En attente de l&apos;hôte pour lancer un jeu…</p>
            )}
          </>
        )}
        {status && <p className="text-xs text-slate-400">{status}</p>}
      </section>
    </div>
  );
}