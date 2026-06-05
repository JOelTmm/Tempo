import { isSupabaseConfigured } from "./supabase-config";
import { MultiplayerClient, SupabaseMultiplayerClient, type GameRoomClient, type RoomState } from "./multiplayer";
import type { RoomGame } from "../vite-env";

function wrapSupabaseClient(sb: SupabaseMultiplayerClient): GameRoomClient {
  return {
    mode: "supabase",
    sync: (p) => sb.sync(p),
    setGame: (g, p) => sb.setGame(g, p),
    leave: (id) => sb.leaveRoom(id),
    getCode: () => sb.getRoomCode(),
    close: () => sb.close(),
    onRoomUpdate: (fn) => sb.onRoomUpdate(fn),
  };
}

export async function createGameRoom(
  game: RoomGame,
  playerName: string,
  playerId: string,
  preferInternet = true
): Promise<{ client: GameRoomClient; room: RoomState }> {
  if (preferInternet && isSupabaseConfigured()) {
    const sb = new SupabaseMultiplayerClient();
    const room = await sb.createRoom(game, playerName, playerId);
    return { client: wrapSupabaseClient(sb), room };
  }

  const ws = new MultiplayerClient("127.0.0.1", 9876);
  await ws.connect();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timeout création salon local")), 8000);
    const off = ws.onMessage((msg) => {
      if (msg.type === "room:created") {
        clearTimeout(timeout);
        off();
        resolve({
          client: {
            mode: "local",
            sync: (p) => ws.sync(msg.room.code, p),
            close: () => ws.close(),
            onRoomUpdate: (fn) =>
              ws.onMessage((m) => {
                if (m.type === "room:update" || m.type === "room:sync") fn(m.room);
              }),
          },
          room: msg.room,
        });
      }
      if (msg.type === "error") {
        clearTimeout(timeout);
        reject(new Error(msg.message));
      }
    });
    ws.createRoom(game, playerName, playerId);
  });
}

export async function joinGameRoom(
  code: string,
  playerName: string,
  playerId: string,
  preferInternet = true
): Promise<{ client: GameRoomClient; room: RoomState }> {
  if (preferInternet && isSupabaseConfigured()) {
    const sb = new SupabaseMultiplayerClient();
    const room = await sb.joinRoom(code, playerName, playerId);
    return { client: wrapSupabaseClient(sb), room };
  }

  const ws = new MultiplayerClient("127.0.0.1", 9876);
  await ws.connect();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timeout connexion salon")), 8000);
    const off = ws.onMessage((msg) => {
      if (msg.type === "room:joined" || msg.type === "room:update") {
        clearTimeout(timeout);
        off();
        resolve({
          client: {
            mode: "local",
            sync: (p) => ws.sync(msg.room.code, p),
            close: () => ws.close(),
            onRoomUpdate: (fn) =>
              ws.onMessage((m) => {
                if (m.type === "room:update" || m.type === "room:sync") fn(m.room);
              }),
          },
          room: msg.room,
        });
      }
      if (msg.type === "error") {
        clearTimeout(timeout);
        reject(new Error(msg.message));
      }
    });
    ws.joinRoom(code, playerName, playerId);
  });
}