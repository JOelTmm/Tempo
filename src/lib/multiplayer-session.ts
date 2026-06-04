import type { GameRoomClient, RoomState } from "./multiplayer";
import type { RoomGame } from "../vite-env";

export type PendingOnlineGame = {
  game: RoomGame;
  room: RoomState;
  client: GameRoomClient;
};

let pending: PendingOnlineGame | null = null;

export function setPendingOnlineGame(data: PendingOnlineGame) {
  pending = data;
}

export function consumePendingOnlineGame(game: RoomGame): PendingOnlineGame | null {
  if (!pending || pending.game !== game) return null;
  const data = pending;
  pending = null;
  return data;
}

export function peekPendingOnlineGame(): PendingOnlineGame | null {
  return pending;
}